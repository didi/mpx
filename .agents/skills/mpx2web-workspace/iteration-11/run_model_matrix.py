#!/usr/bin/env python3
"""Run the formal three-model Has Skill / No Skill benchmark matrix."""
import argparse
import html
import importlib.util
import json
import shutil
import statistics
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).parent.resolve()
MODEL_ROOT = ROOT / "model-runs"
GROUPS = ("mpx2web", "no_skill")
MODELS = (
    ("luna-medium", "5.6 Luna / medium", "gpt-5.6-luna", "medium"),
    ("terra-medium", "5.6 Terra / medium", "gpt-5.6-terra", "medium"),
    ("sol-high", "5.6 Sol / high", "gpt-5.6-sol", "high"),
)
EVAL_COUNT = 13
REPORT_NAMES = ("benchmark.json", "benchmark.md", "review.html")


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


RUN_EVALS = load_module("iteration11_run_evals", ROOT / "run_evals.py")
GRADE = load_module("iteration11_grade", ROOT / "grade.py")


def prepare_model_root(target):
    target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "evals.json", target / "evals.json")
    shutil.copy2(ROOT / "prompt_templates.json", target / "prompt_templates.json")
    public = json.loads((ROOT / "evals.json").read_text())
    for item in public["evals"]:
        name = f"eval-{item['id']}-{item['name']}"
        source = ROOT / name
        destination = target / name
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / "eval_metadata.json", destination / "eval_metadata.json")
        shutil.copytree(source / "input", destination / "input", dirs_exist_ok=True)


def invalidate_reports(root):
    """Remove reports whose contract may no longer match the pending run."""
    for name in REPORT_NAMES:
        path = Path(root) / name
        if path.is_file():
            path.unlink()


def publish_representative_results(model_benchmarks):
    """Expose one documented median result per eval/group in the RN-style root tree."""
    public = json.loads((ROOT / "evals.json").read_text())
    for item in public["evals"]:
        eval_name = f"eval-{item['id']}-{item['name']}"
        for group in GROUPS:
            candidates = []
            for slug, label, model, effort in MODELS:
                source_group = MODEL_ROOT / slug / eval_name / group
                for run_root in sorted(source_group.glob("run-*")):
                    grade_path = run_root / "grading.json"
                    if not grade_path.is_file():
                        continue
                    grade = json.loads(grade_path.read_text())
                    candidates.append({
                        "source": run_root,
                        "slug": slug,
                        "label": label,
                        "model": model,
                        "reasoning_effort": effort,
                        "run_number": int(run_root.name.removeprefix("run-")),
                        "functional_rate": grade["summary"]["pass_rate"],
                        "strict_rate": grade["strict_delivery_summary"]["pass_rate"],
                    })
            if not candidates:
                raise ValueError(f"没有可发布的正式评分结果：{eval_name}/{group}")
            candidates.sort(key=lambda row: (
                row["functional_rate"],
                row["strict_rate"],
                row["slug"],
                row["run_number"],
            ))
            selected = candidates[len(candidates) // 2]
            destination = ROOT / eval_name / group
            if destination.exists():
                shutil.rmtree(destination)
            destination.mkdir(parents=True)
            shutil.copytree(selected["source"], destination / "run-1")
            shutil.copytree(selected["source"] / "outputs", destination / "outputs")
            source_record = {
                key: value for key, value in selected.items() if key != "source"
            }
            source_record["selection"] = "median functional score across three models and three samples"
            source_record["source"] = str(selected["source"].relative_to(ROOT))
            (destination / "published_source.json").write_text(
                json.dumps(source_record, ensure_ascii=False, indent=2) + "\n"
            )


def write_matrix_review(payload):
    rows = "".join(
        "<tr>"
        f"<td>{html.escape(row['label'])}</td>"
        f"<td>{row['no_skill']['sample_mean']:.1%}</td>"
        f"<td>{row['has_skill']['sample_mean']:.1%}</td>"
        f"<td>{row['delta'] * 100:+.1f}pp</td>"
        f"<td>{row['no_skill']['capability']['pass_rate']:.1%} / "
        f"{row['has_skill']['capability']['pass_rate']:.1%}</td>"
        f"<td>{row['no_skill']['strict_delivery']['sample_mean']:.1%} / "
        f"{row['has_skill']['strict_delivery']['sample_mean']:.1%}</td>"
        f"<td><a href='model-runs/{html.escape(row['slug'])}/review.html'>逐项证据</a></td>"
        "</tr>"
        for row in payload["models"]
    )
    document = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mpx2Web iteration-11 review</title>
<style>body{{font:14px/1.55 system-ui,sans-serif;max-width:1100px;margin:32px auto;padding:0 20px;color:#222}}table{{border-collapse:collapse;width:100%}}th,td{{border:1px solid #ddd;padding:8px;text-align:left}}</style></head>
<body><h1>Mpx2Web iteration-11 跨模型评测</h1>
<p>源码契约独立盲评、三态确定性检查和逐文件 Web 编译。完整逐项证据位于各 model-runs 的 review.html。</p>
<table><thead><tr><th>模型</th><th>无 Skill 功能分</th><th>使用 Skill 功能分</th><th>提升</th><th>能力分（无/有）</th><th>严格交付（无/有）</th><th>详情</th></tr></thead>
<tbody>{rows}</tbody></table></body></html>"""
    (ROOT / "review.html").write_text(document)


def run_model(
    target,
    model,
    effort,
    samples,
    workers,
    grader_model,
    grader_effort,
    resume,
    recompile,
):
    prepare_model_root(target)
    invalidate_reports(target)
    RUN_EVALS.WORKSPACE = target
    RUN_EVALS.PROMPT_TEMPLATES = target / "prompt_templates.json"
    RUN_EVALS.PUBLIC_GROUPS = GROUPS
    dispatches = []
    for sample in range(1, samples + 1):
        dispatches.extend(RUN_EVALS.build_prompts(
            groups=GROUPS,
            model=model,
            reasoning_effort=effort,
            run_number=sample,
        ))
    if recompile:
        for dispatch in dispatches:
            try:
                RUN_EVALS.recompile_dispatch(dispatch)
            except ValueError as error:
                # An incomplete or fingerprint-stale candidate is not reusable.
                # Leave it pending so the normal --resume path regenerates it.
                print(
                    f"[recompile-skip] {dispatch['description']}: {error}",
                    flush=True,
                )
    if resume:
        pending = []
        for dispatch in dispatches:
            if RUN_EVALS.dispatch_complete(dispatch):
                print(f"[skip] {dispatch['description']}", flush=True)
            else:
                pending.append(dispatch)
        dispatches = pending
    if dispatches:
        RUN_EVALS.invalidate_aggregate_reports()
    results = RUN_EVALS.run_dispatches(dispatches, max_workers=workers)
    if any(result["returncode"] != 0 or not result["outputs_complete"] for result in results):
        raise RuntimeError(f"{model}/{effort} 至少一个候选生成失败；修复后用 --resume 续跑")

    GRADE.PUBLIC_GROUPS = GROUPS
    GRADE.GROUP_LABELS = {"mpx2web": "使用 Skill", "no_skill": "无 Skill"}
    GRADE.run_independent_grading(
        target,
        samples,
        grader_model,
        grader_effort,
        jobs=workers,
        resume=resume,
    )
    return GRADE.aggregate_benchmark(target, samples)


def aggregate_matrix(model_benchmarks, samples, grader_model, grader_effort):
    rows = []
    for slug, label, model, effort in MODELS:
        benchmark = model_benchmarks[slug]
        has_skill = benchmark["run_summary"]["mpx2web"]
        no_skill = benchmark["run_summary"]["no_skill"]
        rows.append({
            "slug": slug,
            "label": label,
            "model": model,
            "reasoning_effort": effort,
            "has_skill": has_skill,
            "no_skill": no_skill,
            "delta": round(has_skill["sample_mean"] - no_skill["sample_mean"], 4),
        })
    has_mean = round(statistics.mean(row["has_skill"]["sample_mean"] for row in rows), 4)
    no_mean = round(statistics.mean(row["no_skill"]["sample_mean"] for row in rows), 4)
    has_strict_mean = round(statistics.mean(
        row["has_skill"]["strict_delivery"]["sample_mean"] for row in rows
    ), 4)
    no_strict_mean = round(statistics.mean(
        row["no_skill"]["strict_delivery"]["sample_mean"] for row in rows
    ), 4)
    has_capability_mean = round(statistics.mean(
        row["has_skill"]["capability"]["pass_rate"] for row in rows
    ), 4)
    no_capability_mean = round(statistics.mean(
        row["no_skill"]["capability"]["pass_rate"] for row in rows
    ), 4)
    payload = {
        "metadata": {
            "skill_name": "mpx2web",
            "iteration": 11,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "models": [row["model"] for row in rows],
            "samples_per_model_configuration": samples,
            "configurations": {"mpx2web": "使用 Skill", "no_skill": "无 Skill"},
            "grader_model": grader_model,
            "grader_reasoning_effort": grader_effort,
            "grading_mode": "blind independent model review plus conclusive tri-state deterministic overrides",
        },
        "models": rows,
        "overall": {
            "functional": {
                "has_skill_mean": has_mean,
                "no_skill_mean": no_mean,
                "delta": round(has_mean - no_mean, 4),
            },
            "capability": {
                "has_skill_mean": has_capability_mean,
                "no_skill_mean": no_capability_mean,
                "delta": round(has_capability_mean - no_capability_mean, 4),
            },
            "strict_delivery": {
                "has_skill_mean": has_strict_mean,
                "no_skill_mean": no_strict_mean,
                "delta": round(has_strict_mean - no_strict_mean, 4),
            },
        },
    }
    (ROOT / "benchmark.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    lines = [
        "# Mpx2Web iteration-11 跨模型 Benchmark",
        "",
        f"- 模型：3 个；每个模型 Has Skill / No Skill 各采样 {samples} 次",
        f"- 候选结果：{3 * 2 * samples * 13} 个",
        f"- 独立评分：{grader_model} / {grader_effort}",
        "- 评分：功能、业务保真、逐文件编译与严格交付分开统计",
        "- 基线：`--resume` 仅复用候选指纹完全一致的 No Skill 产物；最终评分使用当前评分指纹",
        "",
        "| 模型 | 无 Skill 功能分 | 使用 Skill 功能分 | 功能提升 | 无/有 Skill 严格交付 | 无/有 Skill 能力分 | 编译候选（无/有） | 逐项证据 |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for row in rows:
        no_skill = row["no_skill"]
        has_skill = row["has_skill"]
        lines.append(
            f"| {row['label']} | {no_skill['sample_mean']:.1%} | {has_skill['sample_mean']:.1%} | "
            f"{row['delta'] * 100:+.1f}pp | "
            f"{no_skill['strict_delivery']['sample_mean']:.1%} / {has_skill['strict_delivery']['sample_mean']:.1%} | "
            f"{no_skill['capability']['pass_rate']:.1%} / {has_skill['capability']['pass_rate']:.1%} | "
            f"{no_skill['compile']['candidate_passed']}/{no_skill['compile']['candidate_total']} / "
            f"{has_skill['compile']['candidate_passed']}/{has_skill['compile']['candidate_total']} | "
            f"[查看](model-runs/{row['slug']}/benchmark.md) |"
        )
    lines.extend([
        f"| 整体均值 | {no_mean:.1%} | {has_mean:.1%} | "
        f"{(has_mean - no_mean) * 100:+.1f}pp | "
        f"{no_strict_mean:.1%} / {has_strict_mean:.1%} | "
        f"{no_capability_mean:.1%} / {has_capability_mean:.1%} | — | — |",
        "",
        "## 结论边界",
        "",
        "该结论覆盖冻结的 13 个场景、三个生成模型以及每种配置三次采样；不包含旧版 Skill 对照。它验证源码契约与隔离 Web 编译，不等同于真实浏览器 E2E。各模型的完整结果、评分和逐文件编译证据位于 `model-runs/<model>/`。",
        "",
    ])
    (ROOT / "benchmark.md").write_text("\n".join(lines))
    return payload


def main():
    parser = argparse.ArgumentParser(description="运行 Mpx2Web 三模型 Has/No Skill 正式评测")
    parser.add_argument("--samples", type=int, default=3)
    parser.add_argument("--jobs", type=int, default=2)
    parser.add_argument("--grader-model", default="gpt-5.5")
    parser.add_argument("--grader-reasoning-effort", default="high")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument(
        "--recompile",
        action="store_true",
        help="逐文件刷新现有候选的编译证据；配合 --resume 时不重新生成候选",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只打印正式评测矩阵和结果目录，不生成候选或调用评分模型",
    )
    args = parser.parse_args()
    if args.samples < 1 or args.jobs < 1:
        parser.error("--samples and --jobs must be at least 1")

    if args.dry_run:
        print("[plan] 仅比较使用 Skill 与无 Skill，不包含旧版 Skill", flush=True)
        for index, (slug, label, model, effort) in enumerate(MODELS, start=1):
            print(
                f"[model {index}/{len(MODELS)}] {label}: "
                f"{model}/{effort} -> {MODEL_ROOT / slug}",
                flush=True,
            )
        total = len(MODELS) * len(GROUPS) * args.samples * EVAL_COUNT
        print(
            f"[plan] {len(MODELS)} models × {len(GROUPS)} groups × "
            f"{args.samples} runs × {EVAL_COUNT} evals = {total} candidate results",
            flush=True,
        )
        return

    model_benchmarks = {}
    invalidate_reports(ROOT)
    for index, (slug, label, model, effort) in enumerate(MODELS, start=1):
        print(f"[model {index}/{len(MODELS)}] {label}", flush=True)
        model_benchmarks[slug] = run_model(
            MODEL_ROOT / slug,
            model,
            effort,
            args.samples,
            args.jobs,
            args.grader_model,
            args.grader_reasoning_effort,
            args.resume,
            args.recompile,
        )
    matrix = aggregate_matrix(
        model_benchmarks,
        args.samples,
        args.grader_model,
        args.grader_reasoning_effort,
    )
    publish_representative_results(model_benchmarks)
    write_matrix_review(matrix)
    print(f"[all-done] {ROOT / 'benchmark.md'}", flush=True)


if __name__ == "__main__":
    main()
