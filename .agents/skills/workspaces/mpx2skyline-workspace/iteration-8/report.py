#!/usr/bin/env python3
"""Aggregate a fully graded run and reuse skill-creator's static review viewer."""
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
CREATOR = WORKSPACE.parents[2] / "skill-creator"
SPEC = importlib.util.spec_from_file_location(
    "aggregate_benchmark", CREATOR / "scripts/aggregate_benchmark.py")
AGGREGATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AGGREGATOR)


def build_benchmark(workspace):
    config = json.loads((workspace / "evals.json").read_text())
    models, efforts = set(), set()
    scores = {}
    for group in config["comparison"]["groups"]:
        group = group["id"]
        scores[group] = {}
        for case in config["evals"]:
            run_dir = workspace / f"eval-{case['id']}-{case['name']}" / group / "run-1"
            grading = json.loads((run_dir / "grading.json").read_text())
            run = json.loads((run_dir / "run.json").read_text())
            models.add(run["command"][run["command"].index("-m") + 1])
            efforts.add(run["command"][run["command"].index("-c") + 1])
            category = scores[group].setdefault(case["scoring_group"], {"passed": 0, "total": 0})
            category["passed"] += grading["summary"]["passed"]
            category["total"] += grading["summary"]["total"]
    if len(models) != 1 or len(efforts) != 1:
        raise ValueError("all comparison runs must use the same model and reasoning effort")
    benchmark = AGGREGATOR.generate_benchmark(
        workspace, skill_name="mpx / mpx2skyline", skill_path=".agents/skills/mpx2skyline")
    benchmark["metadata"].update({
        "executor_model": next(iter(models)), "reasoning_effort": next(iter(efforts)),
        "analyzer_model": "unavailable", "runs_per_configuration": 1,
    })
    benchmark["scoring_groups"] = scores
    benchmark["notes"] = [
        "每 case 每组运行一次；Pass Rate 是 case 均值，专项总分见适配/创建分项。",
        "40 条能力断言由实际产物与 verification 语义核验；通用契约另存 validation.json。",
        "Delta 为 mpx 减 mpx2skyline；编译和静态证据不等于真机验证。",
    ]
    return benchmark


def main():
    benchmark = build_benchmark(WORKSPACE)
    (WORKSPACE / "benchmark.json").write_text(
        json.dumps(benchmark, ensure_ascii=False, indent=2) + "\n")
    markdown = AGGREGATOR.generate_markdown(benchmark)
    markdown += "\n\n## 专项分数\n\n| 组 | 适配 | 创建 |\n| --- | --- | --- |\n"
    for group, scores in benchmark["scoring_groups"].items():
        cells = [f"{scores[k]['passed']}/{scores[k]['total']}" for k in ("adaptation", "creation")]
        markdown += f"| {group} | {' | '.join(cells)} |\n"
    (WORKSPACE / "benchmark.md").write_text(markdown)
    subprocess.run([
        sys.executable, str(CREATOR / "eval-viewer/generate_review.py"), str(WORKSPACE),
        "--skill-name", "mpx / mpx2skyline", "--benchmark", str(WORKSPACE / "benchmark.json"),
        "--static", str(WORKSPACE / "review.html"),
    ], check=True)


if __name__ == "__main__":
    main()
