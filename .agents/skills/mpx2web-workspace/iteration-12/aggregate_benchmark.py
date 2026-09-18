#!/usr/bin/env python3
"""Aggregate static source reviews with the shared RN/skill-creator schema."""
import argparse
from copy import deepcopy
import json
from pathlib import Path
import grade
import run_evals as runner
import static_review


def generation_tokens(dispatch):
    tokens = json.loads(Path(dispatch["metrics_path"]).read_text()).get("total_tokens")
    if type(tokens) is not int or tokens < 0:
        raise ValueError(f"missing/invalid generation total_tokens: {dispatch['metrics_path']}")
    return tokens


def review_bounds(runs, assertion_ids=None):
    assertion_ids = set(assertion_ids) if assertion_ids is not None else None
    samples = {}
    for run in runs:
        rows = [row for row in run["expectations"]
                if assertion_ids is None or row.get("id") in assertion_ids]
        if assertion_ids is not None and not rows:
            continue
        pending = [row for row in rows if row.get("review_status") == "pending"]
        if any(row["passed"] for row in pending):
            raise ValueError("pending review cannot be published as a confirmed pass")
        key = run["configuration"], run.get("run_number", 1)
        sample = samples.setdefault(key, {"pending": 0, "passed": 0, "total": 0})
        sample["pending"] += len(pending)
        if assertion_ids is None:
            sample["passed"] += run["result"]["passed"]
            sample["total"] += run["result"]["total"]
        else:
            sample["passed"] += sum(row["passed"] for row in rows)
            sample["total"] += len(rows)
    groups = {}
    for (name, _), sample in samples.items():
        group = groups.setdefault(name, {"pending_assertions": 0, "lower": [], "upper": []})
        group["pending_assertions"] += sample["pending"]
        group["lower"].append(sample["passed"] / sample["total"])
        group["upper"].append((sample["passed"] + sample["pending"]) / sample["total"])
    return {
        name: {
            "pending_assertions": values["pending_assertions"],
            "confirmed_pass_rate": round(sum(values["lower"]) / len(values["lower"]), 4),
            "upper_pass_rate": round(sum(values["upper"]) / len(values["upper"]), 4),
        }
        for name, values in groups.items()
    }


def summarize(runs, base):
    return static_review.aggregate_assertion_micro(
        {g: [r for r in runs if r["configuration"] == g] for g in static_review.GROUPS},
        base,
    )


def format_stat(stats, samples, *, percent=False, decimals=1):
    factor = 100 if percent else 1
    suffix = "%" if percent else ""
    mean = stats.get("mean", 0) * factor
    value = f"{mean:.{decimals}f}{suffix}"
    if samples > 1:
        spread = stats.get("stddev", 0) * factor
        value += f" ± {spread:.{decimals}f}{suffix}"
    return value


def delivery_status(runs):
    result = {group: {"passed": 0, "failed": 0, "not_verified": 0,
                      "not_applicable": 0} for group in static_review.GROUPS}
    for run in runs:
        for check in run.get("delivery_review", []):
            result[run["configuration"]][check["status"]] += 1
    return result


def scope_status(runs):
    result = {group: {"valid": 0, "needs_review": 0, "invalid": 0,
                      "not_applicable": 0, "total": 0}
              for group in static_review.GROUPS}
    for run in runs:
        reviews = run.get("scope_review", [])
        statuses = {row["status"] for row in reviews}
        if "failed" in statuses:
            state = "invalid"
        elif "not_verified" in statuses:
            state = "needs_review"
        elif not reviews or statuses == {"not_applicable"}:
            state = "not_applicable"
        else:
            state = "valid"
        run["scope_state"] = state
        result[run["configuration"]][state] += 1
        result[run["configuration"]]["total"] += 1
    return result


def runtime_followups(runs):
    result = []
    for run in runs:
        summary = run.get("user_notes_summary")
        items = summary.get("needs_review", []) if isinstance(summary, dict) else []
        if not isinstance(items, list):
            items = [str(items)] if items else []
        items = [item.strip() for item in items if isinstance(item, str) and item.strip()]
        run["runtime_followups"] = items
        run["notes"] = list(items)
        if items:
            result.append({"eval_id": run["eval_id"], "configuration": run["configuration"],
                           "run_number": run.get("run_number", 1), "items": items})
    return result


def render_markdown(payload, config, base):
    counts = {name: len(ids) for name, ids in config["scoring"]["buckets"].items()}
    counts["adaptation"] = counts["web"] + counts["ssr"]
    total = config["scoring"]["assertion_count"]
    samples = payload["metadata"]["runs_per_configuration"]
    metadata = payload["metadata"]
    tier_text = "正式级" if metadata["benchmark_tier"] == "formal" else "开发级"
    judge_text = "不同模型复核" if metadata["judge_model_distinct"] else "同模型盲审独立会话"
    validation_text = config.get("runner", {}).get(
        "validation",
        "本 Benchmark 仅检查源码、配置、编译规则、引用关系和交付说明，不执行构建、E2E、浏览器、SSR 渲染或真机验收。",
    )
    lines = ["# Mpx2Web 静态源码评测", "", validation_text, "",
             f"当前为**{tier_text}源码结果**：{samples}/{metadata['recommended_samples']} 次采样，{judge_text}。", "",
             f"主分每次采样 {counts['adaptation']} 项（Web {counts['web']} + SSR {counts['ssr']}），按断言等权；先汇总每次采样的四个 Case，再统计跨采样均值。当前共 {len(config['evals'])} 个 eval；从零生成单列。", "",
             "| 范围 | Has Skill | No Skill |", "| --- | --- | --- |"]
    for key, name in (("adaptation", "适配主分"), ("web", "Web"), ("ssr", "SSR 源码"),
                      ("generation", "从零生成")):
        label = f"{name} {counts[key]} 项"
        section = payload["classification"][key]
        cells = []
        for group in static_review.GROUPS:
            group_counts = section["counts"][group]
            rate = format_stat(section["run_summary"][group]["pass_rate"], samples,
                               percent=True, decimals=2)
            cells.append(f"{rate}（{group_counts['passed']}/{group_counts['total']}）")
        lines.append(f"| {label} | {' | '.join(cells)} |")
    lines += ["", "Case 宏平均只用于观察不同题目的难度差异，不作为主分：", "",
              "| 范围 | Has Skill Case 宏平均 | No Skill Case 宏平均 |",
              "| --- | --- | --- |"]
    for key, name in (("adaptation", "适配主分"), ("web", "Web"),
                      ("ssr", "SSR 源码链路"), ("generation", "从零生成")):
        section = payload["classification"][key]["case_macro_summary"]
        cells = []
        for group in static_review.GROUPS:
            stats = section[group]["pass_rate"]
            cells.append(f"{stats['mean']:.2%}（Case 范围 {stats['min']:.2%}–{stats['max']:.2%}）")
        lines.append(f"| {name} | {' | '.join(cells)} |")

    lines += ["", f"全部 {total} 项的每次采样汇总与生成成本：", "",
              "| 指标 | Has Skill | No Skill |", "| --- | --- | --- |"]
    overall = payload["all_assertions_run_summary"]
    for metric, label, kwargs in (
        ("pass_rate", "全部断言通过率", {"percent": True, "decimals": 2}),
        ("time_seconds", "整套生成耗时（秒）", {"decimals": 1}),
        ("tokens", "整套生成 Tokens", {"decimals": 0}),
    ):
        cells = [format_stat(overall[group][metric], samples, **kwargs)
                 for group in static_review.GROUPS]
        lines.append(f"| {label} | {' | '.join(cells)} |")

    scope = payload["scope_status"]
    lines += ["", "范围有效性（不计分；失败会使比较不可发布）：", "",
              "| 配置 | 已检查有效 | 待确认 | 无效 | 无需检查 |", "| --- | ---: | ---: | ---: | ---: |"]
    for group in static_review.GROUPS:
        values = scope[group]
        lines.append(f"| {group} | {values['valid']} | {values['needs_review']} | {values['invalid']} | {values['not_applicable']} |")

    delivery = payload["delivery_status"]
    if any(sum(values.values()) for values in delivery.values()):
        lines += ["", "交付说明检查（不计分）：", "",
                  "| 配置 | 已说明 | 缺少说明 | 待确认 | 不适用 |", "| --- | ---: | ---: | ---: | ---: |"]
        for group in static_review.GROUPS:
            values = delivery[group]
            lines.append(f"| {group} | {values['passed']} | {values['failed']} | {values['not_verified']} | {values['not_applicable']} |")
    if payload["runtime_followups"]:
        lines += ["", "待运行验证（不计分）：", ""]
        for followup in payload["runtime_followups"]:
            label = f"Case {followup['eval_id'] + 1} / {followup['configuration']} / run-{followup['run_number']}"
            lines.append(f"- **{label}**：" + "；".join(followup["items"]))
    titles = {item["id"]: item["title"] for item in config["evals"]}
    for run in payload["runs"]:
        lines += ["", f"## Case {run['eval_id'] + 1}：{titles[run['eval_id']]} / {run['configuration']} / run-{run['run_number']}", ""]
        lines += [f"范围状态：**{run['scope_state']}**", ""]
        for check in run.get("scope_review", []):
            lines += [f"- {check['id']} / {check['status']}：{check['evidence']}"]
        if run.get("scope_review"):
            lines.append("")
        if run.get("runtime_followups"):
            lines += ["待运行验证：", ""] + [f"- {item}" for item in run["runtime_followups"]] + [""]
        for row in run["expectations"]:
            status = "待复核" if row.get("review_status") == "pending" else "通过" if row["passed"] else "不通过"
            lines += [f"### {row['id']}：{status}", "", row["text"], "", row["evidence"], ""]
    return "\n".join(lines)


def aggregate(model, effort, samples=1):
    config, _ = runner.load_configs()
    items = {i["id"]: i for i in config["evals"]}
    dispatches = runner.build_prompts(model=model, reasoning_effort=effort, samples=samples)
    grades, graders, provenance = {}, set(), []
    for d in dispatches:
        if not runner.generation_complete(d):
            raise ValueError(f"incomplete/stale generation: {d['description']}")
        target = Path(d["metrics_path"]).parent / "grading.json"
        original = json.loads(target.read_text())
        grader = original["grader"]
        graders.add((grader["model"], grader["reasoning_effort"]))
        fingerprint = grade.grade_fingerprint(d, items[d["eval_id"]], config, grader["model"], grader["reasoning_effort"])
        current = static_review.current_grade(target, fingerprint, runner.WORKSPACE, items[d["eval_id"]])
        if current is None:
            raise ValueError(f"stale grading: {target}")
        key = d["eval_id"], d["group"], d["run_number"]
        grades[key] = current
        result = json.loads((target.parent / "run.json").read_text())
        provenance.append(dict(eval_id=key[0], configuration=key[1], run_number=key[2],
                               policy=result.get("isolation", {}).get("policy", "legacy_prompt_only_audited")))
    if len(graders) != 1:
        raise ValueError("mixed graders cannot be aggregated")
    base = runner.load_module("common_aggregate", runner.SKILL_CREATOR / "scripts/aggregate_benchmark.py")
    payload = base.generate_benchmark(runner.WORKSPACE, "mpx2web", str(runner.PROJECT_ROOT / ".agents/skills/mpx2web"))
    actual = [(r["eval_id"], r["configuration"], r["run_number"]) for r in payload["runs"]]
    if set(actual) != set(grades) or len(actual) != len(grades):
        raise ValueError("unexpected/missing results; do not silently mix sample counts or groups")
    tokens = {(d["eval_id"], d["group"], d["run_number"]): generation_tokens(d) for d in dispatches}
    for row in payload["runs"]:
        row["result"]["tokens"] = tokens[(row["eval_id"], row["configuration"], row["run_number"])]
        row["notes"] = []
    payload["source_review"] = dict(runs=deepcopy(payload["runs"]), run_summary=summarize(payload["runs"], base))
    for row in payload["runs"]:
        current = grades[row["eval_id"], row["configuration"], row["run_number"]]
        row["expectations"] = current["expectations"]
        row["result"].update(current["summary"])
        row["static_review"] = current.get("static_review")
        row["scope_review"] = current.get("scope_review", [])
        row["delivery_review"] = current.get("delivery_review", [])
        row["user_notes_summary"] = current.get("user_notes_summary", {})
    payload["all_assertions_run_summary"] = summarize(payload["runs"], base)
    adaptation_ids = config["scoring"]["buckets"]["web"] + config["scoring"]["buckets"]["ssr"]
    all_review_status = review_bounds(payload["runs"])
    adaptation_review_status = review_bounds(payload["runs"], adaptation_ids)
    payload["review_status"] = {
        "primary_scope": "adaptation",
        "adaptation": adaptation_review_status,
        "all_assertions": all_review_status,
    }
    payload["classification"] = static_review.classify(payload["runs"], config, base)
    payload["source_review"]["classification"] = static_review.classify(
        payload["source_review"]["runs"], config, base
    )
    payload["run_summary"] = payload["classification"]["adaptation"]["run_summary"]
    payload["case_macro_run_summary"] = payload["classification"]["adaptation"]["case_macro_summary"]
    payload["delivery_status"] = delivery_status(payload["runs"])
    payload["scope_status"] = scope_status(payload["runs"])
    payload["runtime_followups"] = runtime_followups(payload["runs"])
    pending = sum(v["pending_assertions"] for v in all_review_status.values())
    scope_invalid = sum(v["invalid"] for v in payload["scope_status"].values())
    scope_pending = sum(v["needs_review"] for v in payload["scope_status"].values())
    scope_comparison_eligible = scope_invalid == 0 and scope_pending == 0
    grader_model, grader_effort = next(iter(graders))
    recommended_samples = config["runner"]["recommended_samples"]
    sample_sufficient = samples >= recommended_samples
    judge_model_distinct = grader_model != model
    formal_publishable = scope_comparison_eligible and not pending and sample_sufficient and judge_model_distinct
    if scope_invalid:
        result_status = "invalid_scope"
    elif scope_pending:
        result_status = "scope_needs_review"
    elif pending:
        result_status = "assertion_needs_review"
    else:
        result_status = "complete_source_review"
    payload["generation_provenance"] = provenance
    payload["metadata"].update(
        executor_model=f"{model} ({effort})", analyzer_model=f"{grader_model} / {grader_effort}",
        runs_per_configuration=samples, grading_scope="source_review_only", suite_revision=config["suite_revision"],
        grader_method=config["scoring"]["grader_method"],
        score_weighting="assertion_micro_per_sample_primary_case_macro_diagnostic",
        result_status=result_status,
        benchmark_tier="formal" if formal_publishable else "development",
        recommended_samples=recommended_samples,
        sample_sufficient=sample_sufficient,
        judge_model_distinct=judge_model_distinct,
        judge_relationship="different_model" if judge_model_distinct else "same_model_blind_pass",
        scope_comparison_eligible=scope_comparison_eligible,
        formal_publishable=formal_publishable,
        comparison_isolation="all_isolated" if all(p["policy"] != "legacy_prompt_only_audited" for p in provenance) else "mixed",
        validation_scope={"static_source_review": True, "e2e": False, "browser": False, "ssr_runtime": False, "device": False})
    payload["notes"] = [
        "静态源码评审不等于纯确定性扫描：评分在生成之外的盲审会话中逐项阅读源码；只读文件完整性使用确定性检查。",
        "不执行 E2E、浏览器、SSR 渲染/接管或真机验收；源码符合要求不能据此宣称全部 Mpx2Web 能力已运行验证。",
        "C2.3/C2.5 等行为项不再用关键词正则强制改分；模型必须结合框架证据追踪可达调用链，不足时标为 pending。",
        f"主分范围由 evals.json 的 web/ssr 分桶决定；共 {config['scoring']['assertion_count']} 项，生成项单列。",
        f"主分按断言/采样等权；Case 宏平均仅诊断题目差异。单次采样不显示 ±；正式级结果要求至少 {recommended_samples} 次独立采样且评分模型不同于生成模型，届时 ± 表示跨采样标准差，不是置信区间。",
        "Token/耗时来自生成指标，不是计费金额；评分开销保留在原 grading.json/grader.metrics。"]
    runner.write_json(runner.WORKSPACE / "benchmark.json", payload)
    (runner.WORKSPACE / "benchmark.md").write_text(render_markdown(payload, config, base) + "\n")
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True)
    parser.add_argument("--reasoning-effort", required=True)
    parser.add_argument("--samples", type=int, default=1)
    args = parser.parse_args()
    payload = aggregate(args.model, args.reasoning_effort, args.samples)
    viewer = runner.load_module("common_viewer", runner.SKILL_CREATOR / "eval-viewer/generate_review.py")
    runs = viewer.find_runs(runner.WORKSPACE)
    for run in runs:
        matches = []
        for row in payload["runs"]:
            suffix = f"-{row['configuration']}" + (f"-run-{row['run_number']}" if row['run_number'] != 1 else "")
            if run["eval_id"] == row["eval_id"] and run["id"].endswith(suffix):
                matches.append(row)
        if len(matches) != 1:
            raise ValueError(f"unmatched viewer run: {run['id']}")
        row = matches[0]
        run["grading"] = dict(expectations=row["expectations"], summary=static_review.summary(row["expectations"]),
                              grading_scope="source_review_only", static_review=row["static_review"],
                              scope_review=row.get("scope_review", []),
                              delivery_review=row.get("delivery_review", []),
                              user_notes_summary=row.get("user_notes_summary", {}),
                              scope_state=row.get("scope_state"),
                              runtime_followups=row.get("runtime_followups", []))
    viewer_benchmark = deepcopy(payload)
    config, _ = runner.load_configs()
    ids = set(config["scoring"]["buckets"]["web"] + config["scoring"]["buckets"]["ssr"])
    viewer_benchmark["runs"] = []
    for row in payload["runs"]:
        expectations = [item for item in row["expectations"] if item["id"] in ids]
        if expectations:
            current = deepcopy(row)
            current["expectations"] = expectations
            current["result"].update(static_review.summary(expectations))
            viewer_benchmark["runs"].append(current)
    viewer_benchmark["run_summary"] = payload["classification"]["adaptation"]["run_summary"]
    viewer_benchmark["notes"].insert(0, f"此表为 {len(ids)} 项适配静态主分；Outputs 保留全部 {config['scoring']['assertion_count']} 项逐条证据，生成单列于 benchmark.md。")
    scope_cells = []
    for group in static_review.GROUPS:
        values = payload["scope_status"][group]
        scope_cells.append(f"{group} 已检查有效 {values['valid']} / 待确认 {values['needs_review']} / 无效 {values['invalid']} / 无需检查 {values['not_applicable']}")
    viewer_benchmark["notes"].insert(1, "范围有效性（不计分）：" + "；".join(scope_cells))
    for followup in payload["runtime_followups"]:
        label = f"Case {followup['eval_id'] + 1} / {followup['configuration']} / run-{followup['run_number']}"
        viewer_benchmark["notes"].append(f"待运行验证｜{label}：" + "；".join(followup["items"]))
    (runner.WORKSPACE / "review.html").write_text(viewer.generate_html(runs, "Mpx2Web 静态源码评测", benchmark=viewer_benchmark))
    result_status = payload["metadata"]["result_status"]
    status = "source-review-done" if result_status == "complete_source_review" else result_status.replace("_", "-")
    if payload["metadata"]["benchmark_tier"] == "development":
        status = "development-" + status
    print(f"[{status}] {runner.WORKSPACE / 'benchmark.md'}")


if __name__ == "__main__":
    main()
