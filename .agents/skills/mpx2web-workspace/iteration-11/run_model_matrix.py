#!/usr/bin/env python3
"""Run the formal three-model Has Skill / No Skill benchmark matrix."""
import argparse
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


def run_model(target, model, effort, samples, workers, grader_model, grader_effort, resume):
    prepare_model_root(target)
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
            "grading_mode": "blind independent model review plus frozen deterministic overrides",
        },
        "models": rows,
        "overall": {
            "has_skill_mean": has_mean,
            "no_skill_mean": no_mean,
            "delta": round(has_mean - no_mean, 4),
        },
    }
    (ROOT / "benchmark.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    lines = [
        "# Mpx2Web iteration-11 跨模型 Benchmark",
        "",
        f"- 模型：3 个；每个模型 Has Skill / No Skill 各采样 {samples} 次",
        f"- 候选结果：{3 * 2 * samples * 13} 个",
        f"- 独立评分：{grader_model} / {grader_effort}",
        "- 编译：所有可作为 page/component 入口的 `.mpx` 均执行真实 Web 编译",
        "",
        "| 模型 | 无 Skill 通过率 | 使用 Skill 通过率 | 提升 | 无 Skill 三轮 | 使用 Skill 三轮 | 编译（无/有） |",
        "| --- | ---: | ---: | ---: | --- | --- | ---: |",
    ]
    for row in rows:
        no_skill = row["no_skill"]
        has_skill = row["has_skill"]
        no_rates = ", ".join(f"{rate:.1%}" for rate in no_skill["sample_pass_rates"])
        has_rates = ", ".join(f"{rate:.1%}" for rate in has_skill["sample_pass_rates"])
        lines.append(
            f"| {row['label']} | {no_skill['sample_mean']:.1%} | {has_skill['sample_mean']:.1%} | "
            f"{row['delta']:+.1%} | {no_rates} | {has_rates} | "
            f"{no_skill['compile']['compiled_mpx']}/{no_skill['compile']['eligible_mpx']} / "
            f"{has_skill['compile']['compiled_mpx']}/{has_skill['compile']['eligible_mpx']} |"
        )
    lines.extend([
        f"| 整体均值 | {no_mean:.1%} | {has_mean:.1%} | {has_mean - no_mean:+.1%} | — | — | — |",
        "",
        "## 结论边界",
        "",
        "该结论覆盖冻结的 13 个场景、三个生成模型以及每种配置三次采样；不包含旧版 Skill 对照。各模型的完整结果、评分和编译证据位于 `model-runs/<model>/`。",
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
        )
    aggregate_matrix(
        model_benchmarks,
        args.samples,
        args.grader_model,
        args.grader_reasoning_effort,
    )
    print(f"[all-done] {ROOT / 'benchmark.md'}", flush=True)


if __name__ == "__main__":
    main()
