#!/usr/bin/env python3
"""Turn evidence-based Skyline assessments into the RN grading/viewer format.

--prepare creates unscored assessment templates after actual execution.
Without it, every selected assertion needs an explicit boolean and evidence.
This keeps semantic checks out of a keyword-based approximation.
"""
import argparse
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
CONFIG = json.loads((WORKSPACE / "evals.json").read_text())


def _first_present(data, keys):
    for key in keys:
        if key in data:
            return data[key]


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def load_metrics(run_dir):
    """Load metrics.json written by the main agent from task-notification <usage> data."""
    metrics_path = run_dir / "metrics.json"
    if not metrics_path.exists():
        return None, []
    try:
        data = json.loads(metrics_path.read_text())
    except json.JSONDecodeError as e:
        return None, [f"invalid metrics json: {metrics_path}: {e}"]
    if not isinstance(data, dict):
        return None, [f"metrics file must contain an object: {metrics_path}"]

    errors = []
    total_tokens = _first_present(data, ("total_tokens", "tokens"))
    tool_calls = _first_present(data, ("tool_calls", "tool_call_count", "tool_uses"))
    duration_ms = _first_present(data, ("duration_ms", "elapsed_ms"))
    if duration_ms is None:
        duration_seconds = _first_present(
            data, ("duration_seconds", "total_duration_seconds", "time_seconds"))
        if duration_seconds is not None:
            duration_ms = duration_seconds * 1000

    if not _is_number(total_tokens) or total_tokens < 0:
        errors.append("metrics.total_tokens must be a non-negative number")
    if not _is_number(tool_calls) or tool_calls < 0:
        errors.append("metrics.tool_calls must be a non-negative number")
    if not _is_number(duration_ms) or duration_ms < 0:
        errors.append("metrics.duration_ms must be a non-negative number")
    if errors:
        return None, errors

    duration_ms = int(round(duration_ms))
    return {
        "total_tokens": int(round(total_tokens)),
        "tool_calls": int(round(tool_calls)),
        "duration_ms": duration_ms,
        "duration_seconds": round(duration_ms / 1000, 3),
    }, []


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def prepare(case, run_dir):
    path = run_dir / "assessment.json"
    if path.exists():
        return
    write_json(path, {
        "eval_id": case["id"],
        "expectations": [{
            "id": item["id"], "text": item["text"],
            "verification": item["verification"],
            "passed": None, "evidence": "",
        } for item in case["assertions"]],
    })


def grade_run(case, group, run_dir):
    assessment = json.loads((run_dir / "assessment.json").read_text())
    items = assessment["expectations"]
    if assessment["eval_id"] != case["id"] or [item["id"] for item in items] != [
            item["id"] for item in case["assertions"]]:
        raise ValueError(f"assessment does not match case {case['id']}: {run_dir}")
    for item in items:
        if not isinstance(item["passed"], bool) or not isinstance(item["evidence"], str) or not item["evidence"].strip():
            raise ValueError(f"unreviewed assertion {item['id']}: {run_dir}")
    metrics, errors = load_metrics(run_dir)
    if errors or metrics is None:
        raise ValueError(f"missing or invalid execution metrics: {run_dir}: {errors}")
    expectations = [{
        "id": definition["id"], "text": definition["text"],
        "passed": item["passed"], "evidence": item["evidence"],
    } for definition, item in zip(case["assertions"], items)]
    passed = sum(item["passed"] for item in expectations)
    return {
        "eval_id": case["id"], "run_kind": group,
        "scoring_group": case["scoring_group"],
        "expectations": expectations,
        "summary": {"passed": passed, "failed": len(items) - passed,
                    "total": len(items), "pass_rate": round(passed / len(items), 4)},
        "metrics": metrics,
        "timing": {"total_duration_seconds": metrics["duration_seconds"],
                   "total_tokens": metrics["total_tokens"]},
        "execution_metrics": {"total_tool_calls": metrics["tool_calls"],
                              "output_chars": metrics["total_tokens"]},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prepare", action="store_true")
    parser.add_argument("--evals", nargs="+", type=int,
                        choices=[case["id"] for case in CONFIG["evals"]])
    parser.add_argument("--groups", nargs="+",
                        choices=[group["id"] for group in CONFIG["comparison"]["groups"]])
    args = parser.parse_args()
    results = []
    for case in CONFIG["evals"]:
        if args.evals is not None and case["id"] not in args.evals:
            continue
        for group in CONFIG["comparison"]["groups"]:
            group = group["id"]
            if args.groups is not None and group not in args.groups:
                continue
            run_dir = WORKSPACE / f"eval-{case['id']}-{case['name']}" / group / "run-1"
            if not (run_dir / "run.json").exists():
                raise ValueError(f"model has not run: {run_dir}")
            if args.prepare:
                prepare(case, run_dir)
            else:
                results.append((run_dir, grade_run(case, group, run_dir)))
    if args.prepare:
        return
    # Validate every assessment before writing any scores.
    summary = []
    for run_dir, grading in results:
        write_json(run_dir / "grading.json", grading)
        score = grading["summary"]
        summary.append({"eval": run_dir.parents[1].name,
                        "kind": grading["run_kind"],
                        "scoring_group": grading["scoring_group"],
                        "score": f"{score['passed']}/{score['total']}",
                        **grading["metrics"]})
    write_json(WORKSPACE / "grading-summary.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
