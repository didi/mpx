"""Static-only policy and digest-bound reuse of existing source reviews."""
from copy import deepcopy
import json

GROUPS = ("mpx2web", "no_skill")


def summary(rows):
    passed = sum(row["passed"] for row in rows)
    total = len(rows)
    return dict(passed=passed, failed=total - passed, total=total,
                pass_rate=passed / total if total else 0)


def source_only(grade):
    # Keep original grading.json immutable; exclude appended runtime evidence.
    result = {key: deepcopy(grade[key]) for key in (
        "expectations", "summary", "metrics", "timing", "execution_metrics",
        "grader", "grading_fingerprint", "eval_id", "run_kind", "scope_review",
        "delivery_review", "user_notes_summary", "eval_feedback"
    ) if key in grade}
    result["grading_scope"] = "source_review_only"
    result["validation"] = {"compile": "out_of_scope", "runtime": "out_of_scope"}
    return result


def current_grade(target, fingerprint, workspace, item):
    original = json.loads(target.read_text())
    if original.get("grading_fingerprint") != fingerprint:
        return None
    corrected = source_only(original)
    expected = [row["id"] for row in item["assertions"]]
    if [row.get("id") for row in corrected["expectations"]] != expected:
        raise ValueError("static review assertion IDs do not match current case")
    for row, assertion in zip(corrected["expectations"], item["assertions"]):
        if type(row.get("passed")) is not bool:
            raise ValueError("invalid source verdict")
        row["text"] = assertion["text"]
    corrected["summary"] = summary(corrected["expectations"])
    return corrected


def aggregate_assertion_micro(runs_by_group, base):
    """Aggregate assertions inside each independent sample before run statistics."""
    samples_by_group = {}
    for group, runs in runs_by_group.items():
        samples = {}
        for run in runs:
            result = run.get("result", run)
            number = run.get("run_number", result.get("run_number", 1))
            sample = samples.setdefault(number, {
                "passed": 0, "total": 0, "time_seconds": 0.0,
                "tokens": 0, "tool_calls": 0, "errors": 0,
            })
            sample["passed"] += result["passed"]
            sample["total"] += result["total"]
            sample["time_seconds"] += result.get("time_seconds", 0.0)
            sample["tokens"] += result.get("tokens", 0)
            sample["tool_calls"] += result.get("tool_calls", 0)
            sample["errors"] += result.get("errors", 0)
        rows = []
        for number in sorted(samples):
            sample = samples[number]
            if not sample["total"]:
                continue
            rows.append(dict(sample, run_number=number,
                             failed=sample["total"] - sample["passed"],
                             pass_rate=sample["passed"] / sample["total"]))
        samples_by_group[group] = rows
    return base.aggregate_results(samples_by_group)


def aggregate_case_equal(runs, case_ids, base):
    """Average each complete Case equally inside a sample, then aggregate samples."""
    expected = set(case_ids)
    samples_by_group = {group: {} for group in GROUPS}
    for run in runs:
        group = run["configuration"]
        number = run.get("run_number", 1)
        cases = samples_by_group[group].setdefault(number, {})
        case_id = run["eval_id"]
        if case_id in cases:
            raise ValueError(f"duplicate Case {case_id} in {group} sample {number}")
        result = run.get("result", run)
        cases[case_id] = {
            "pass_rate": result["pass_rate"],
            "time_seconds": result.get("time_seconds", 0.0),
            "tokens": result.get("tokens", 0),
        }
    groups = {group: [] for group in GROUPS}
    for group, samples in samples_by_group.items():
        for number, cases in sorted(samples.items()):
            if set(cases) != expected:
                raise ValueError(f"missing/unexpected Cases in {group} sample {number}")
            groups[group].append({
                "run_number": number,
                "pass_rate": sum(row["pass_rate"] for row in cases.values()) / len(expected),
                "time_seconds": sum(row["time_seconds"] for row in cases.values()),
                "tokens": sum(row["tokens"] for row in cases.values()),
            })
    return base.aggregate_results(groups)


def subset(runs, ids, base):
    groups = {group: [] for group in GROUPS}
    totals = {group: {"passed": 0, "total": 0} for group in GROUPS}
    for run in runs:
        rows = [row for row in run["expectations"] if row["id"] in ids]
        if not rows:
            continue
        result = dict(run["result"], **summary(rows),
                      run_number=run.get("run_number", 1))
        groups[run["configuration"]].append(result)
        for key in ("passed", "total"):
            totals[run["configuration"]][key] += result[key]
    return {
        "run_summary": aggregate_assertion_micro(groups, base),
        "case_macro_summary": base.aggregate_results(groups),
        "counts": totals,
    }


def classify(runs, config, base):
    buckets = config["scoring"]["buckets"]
    all_ids = [row["id"] for item in config["evals"] for row in item["assertions"]]
    flat = [key for ids in buckets.values() for key in ids]
    if len(flat) != len(set(flat)) or set(flat) != set(all_ids):
        raise ValueError("every assertion must belong to exactly one score bucket")
    sections = {name: subset(runs, set(ids), base) for name, ids in buckets.items()}
    sections["adaptation"] = subset(runs, set(buckets["web"] + buckets["ssr"]), base)
    sections["all"] = subset(runs, set(all_ids), base)
    return sections
