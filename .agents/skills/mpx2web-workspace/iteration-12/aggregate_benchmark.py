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
    metadata = payload["metadata"]
    samples = metadata["runs_per_configuration"]
    case_count = len(config["evals"])
    case_runs = payload["case_run_summary"]
    labels = {"mpx2web": "Mpx2Web", "no_skill": "No Skill"}
    run_count = case_count * samples

    def spread(group, metric, *, percent=False, decimals=1):
        stats = case_runs[group][metric]
        factor = 100 if percent else 1
        suffix = "%" if percent else ""
        return (f"{stats['mean'] * factor:.{decimals}f}{suffix} ± "
                f"{stats['stddev'] * factor:.{decimals}f}{suffix}")

    def duration(value):
        minutes, seconds = divmod(value, 60)
        return f"{int(minutes)}m {seconds:.1f}s" if minutes else f"{seconds:.1f}s"

    has = case_runs["mpx2web"]
    baseline = case_runs["no_skill"]
    pass_delta = has["pass_rate"]["mean"] - baseline["pass_rate"]["mean"]
    time_delta = has["time_seconds"]["mean"] - baseline["time_seconds"]["mean"]
    token_delta = has["tokens"]["mean"] - baseline["tokens"]["mean"]
    evals = ", ".join(str(item["id"]) for item in config["evals"])
    lines = [
        "# Skill Benchmark: mpx2web eval comparison",
        "",
        f"**Model**: {metadata['executor_model']}",
        f"**Date**: {metadata['timestamp']}",
        f"**Evals**: {evals} ({samples} run each per configuration)",
        "",
        "## Summary",
        "",
        "| Metric | Mpx2Web | No Skill | Delta |",
        "| --- | ---: | ---: | ---: |",
        (f"| Pass Rate | {spread('mpx2web', 'pass_rate', percent=True, decimals=0)} | "
         f"{spread('no_skill', 'pass_rate', percent=True, decimals=0)} | {pass_delta:+.2f} |"),
        (f"| Time | {spread('mpx2web', 'time_seconds')} | "
         f"{spread('no_skill', 'time_seconds')} | {time_delta:+.1f}s |"),
        (f"| Tokens | {spread('mpx2web', 'tokens', decimals=0)} | "
         f"{spread('no_skill', 'tokens', decimals=0)} | {token_delta:+.0f} |"),
        "",
        "## 平均执行耗时",
        "",
        "| 配置 | 样本数 | 平均执行耗时 | 最短 | 最长 |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for group in static_review.GROUPS:
        stats = case_runs[group]["time_seconds"]
        lines.append(
            f"| {group} | {run_count} | {stats['mean']:.1f}s（{duration(stats['mean'])}） | "
            f"{stats['min']:.1f}s | {stats['max']:.1f}s |"
        )
    time_percent = time_delta / baseline["time_seconds"]["mean"] if baseline["time_seconds"]["mean"] else 0
    lines += [
        "",
        f"Has Skill 比 No Skill 平均多用 {time_delta:.1f}s（{time_percent:.1%}）。",
        "",
        "## 平均 Token 消耗",
        "",
        f"| 配置 | 样本数 | 平均 Total | 最少 | 最多 | {run_count} 次合计 |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for group in static_review.GROUPS:
        stats = case_runs[group]["tokens"]
        total_tokens = sum(row["result"].get("tokens", 0) for row in payload["runs"]
                           if row["configuration"] == group)
        lines.append(
            f"| {group} | {run_count} | {stats['mean']:,.0f} | {stats['min']:,.0f} | "
            f"{stats['max']:,.0f} | {total_tokens:,.0f} |"
        )
    token_percent = token_delta / baseline["tokens"]["mean"] if baseline["tokens"]["mean"] else 0
    counts = {name: len(ids) for name, ids in config["scoring"]["buckets"].items()}
    diagnostics = []
    for key, name in (("web", "Web"), ("ssr", "SSR"), ("generation", "生成")):
        section = payload["classification"][key]
        rates = [section["run_summary"][group]["pass_rate"]["mean"] for group in static_review.GROUPS]
        diagnostics.append(f"{name} {counts[key]} 项 {rates[0]:.2%}/{rates[1]:.2%}")
    scope = payload["scope_status"]
    scope_note = "；".join(
        f"{group} 有效 {values['valid']}、待确认 {values['needs_review']}、无效 {values['invalid']}、无需检查 {values['not_applicable']}"
        for group, values in scope.items()
    )
    delivery = payload["delivery_status"]
    delivery_note = "；".join(
        f"{group} 满足 {values['passed']}、未满足 {values['failed']}、待确认 {values['not_verified']}、不适用 {values['not_applicable']}"
        for group, values in delivery.items()
    )
    followup_count = sum(len(row["items"]) for row in payload["runtime_followups"])
    tier = "正式级" if metadata["benchmark_tier"] == "formal" else "开发级"
    judge = "不同模型复核" if metadata["judge_model_distinct"] else "同模型盲审独立会话"
    lines += [
        "",
        (f"Has Skill 比 No Skill 平均多消耗 {token_delta:,.0f} Token（{token_percent:.1%}）。"
         "`Total` 为各子 agent session 的累计 Token，不代表单次 Context 大小。"),
        "",
        "## Notes",
        "",
        f"- All {len(payload['runs'])} child agents ran in isolated workspaces with the configured Codex model.",
        f"- Case 等权主分：{case_count} 个 Case 各占 {1 / case_count:.0%}；Summary 的 ± 表示 Case 之间的离散程度。",
        f"- 当前为{tier}源码结果：{samples}/{metadata['recommended_samples']} 次完整采样，{judge}。",
        "- 本 Benchmark 只做静态源码评审，不执行构建、E2E、浏览器、SSR renderer 或真机验收。",
        f"- 断言微平均仅作诊断：{'；'.join(diagnostics)}（Has Skill/No Skill）。",
        f"- 范围有效性（不计分）：{scope_note}。",
        f"- 交付与质量检查（不计分）：{delivery_note}。",
        f"- 待运行验证（不计分）共 {followup_count} 项，逐项内容见 review.html 和 benchmark.json。",
    ]
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
        "primary_scope": "all_cases",
        "adaptation": adaptation_review_status,
        "all_assertions": all_review_status,
    }
    payload["classification"] = static_review.classify(payload["runs"], config, base)
    payload["source_review"]["classification"] = static_review.classify(
        payload["source_review"]["runs"], config, base
    )
    payload["run_summary"] = static_review.aggregate_case_equal(
        payload["runs"], [item["id"] for item in config["evals"]], base
    )
    payload["case_macro_run_summary"] = payload["run_summary"]
    payload["case_run_summary"] = base.aggregate_results({
        group: [row["result"] for row in payload["runs"] if row["configuration"] == group]
        for group in static_review.GROUPS
    })
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
        score_weighting="case_equal_per_sample_primary_assertion_micro_diagnostic",
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
        f"主分覆盖 evals.json 的全部 {config['scoring']['assertion_count']} 项功能断言；先算 Case 内通过率，再将 {len(config['evals'])} 个 Case 等权平均。",
        f"Web、SSR、生成及全部断言微平均仅作诊断。单次采样不显示 ±；正式级结果要求至少 {recommended_samples} 次独立采样且评分模型不同于生成模型，届时 ± 表示跨采样标准差，不是置信区间。",
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
    ids = {assertion["id"] for item in config["evals"] for assertion in item["assertions"]}
    viewer_benchmark["runs"] = []
    for row in payload["runs"]:
        expectations = [item for item in row["expectations"] if item["id"] in ids]
        if expectations:
            current = deepcopy(row)
            current["expectations"] = expectations
            current["result"].update(static_review.summary(expectations))
            viewer_benchmark["runs"].append(current)
    viewer_benchmark["run_summary"] = payload["run_summary"]
    viewer_benchmark["notes"].insert(0, f"此表主分覆盖全部 {len(ids)} 项功能断言，先计算每个 Case 的通过率，再将 {len(config['evals'])} 个 Case 等权平均；断言微平均在 benchmark.md 中作为诊断数据。")
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
