#!/usr/bin/env python3
"""Generate or execute self-contained Mpx2Web iteration-11 eval prompts."""
import argparse
import json
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

WORKSPACE = Path(__file__).parent
PROJECT_ROOT = WORKSPACE.parents[3]
EVAL_WORKDIR = WORKSPACE.parent.resolve()
SKILL = PROJECT_ROOT / ".agents/skills/mpx2web/SKILL.md"
SKILL_REFERENCES = SKILL.parent / "references"
PROMPT_TEMPLATES = WORKSPACE / "prompt_templates.json"
PUBLIC_GROUPS = ("mpx2web", "previous_mpx2web", "no_skill")


def load_configs():
    return (
        json.loads((WORKSPACE / "evals.json").read_text()),
        json.loads(PROMPT_TEMPLATES.read_text()),
    )


def group_instruction(group, templates):
    template = templates["templates"][group]
    instruction = template["instruction"].replace(
        "{{MPX2WEB_SKILL_PATH}}", str(SKILL)
    )
    if group != "previous_mpx2web":
        return instruction
    frozen = template.get("frozen_skill_text", "").strip()
    if not frozen:
        raise ValueError("previous_mpx2web 缺少冻结的 1.8 Skill 入口")
    return "\n\n".join((
        instruction.replace(
            "{{PREVIOUS_MPX2WEB_SKILL_PATH}}", "下方内嵌的冻结入口"
        ),
        "冻结的 Mpx2Web 1.8 SKILL.md：\n" + frozen,
        (
            "冻结时 references 与当前目录内容一致；"
            f"当上述入口路由到 ./references 时，从 {SKILL_REFERENCES} 读取。"
        ),
    ))


def build_prompts(
    eval_ids=None,
    groups=None,
    model=None,
    reasoning_effort=None,
    run_number=1,
):
    if not model or not reasoning_effort:
        raise ValueError(
            "model and reasoning_effort must be explicitly set to the parent session values"
        )
    if run_number < 1:
        raise ValueError("run_number must be at least 1")
    evals_config, templates = load_configs()
    groups = list(groups or PUBLIC_GROUPS)
    unknown_groups = sorted(set(groups) - set(PUBLIC_GROUPS))
    if unknown_groups:
        raise ValueError(f"unknown groups: {', '.join(unknown_groups)}")

    dispatches = []
    for item in evals_config["evals"]:
        if eval_ids is not None and item["id"] not in eval_ids:
            continue
        eval_name = f"eval-{item['id']}-{item['name']}"
        input_paths = [WORKSPACE / path for path in item["files"]]
        for group in groups:
            output_root = WORKSPACE / eval_name / group / "outputs"
            output_paths = [output_root / path for path in item["outputs"]]
            run_dir = WORKSPACE / eval_name / group / f"run-{run_number}"
            isolation = (
                "只读取上述输入、本组指定的 Skill/reference；"
                "不要读取 iteration-11 的其他组输出、评分、"
                "benchmark 或 review.html。"
            )
            prompt = "\n\n".join((
                group_instruction(group, templates),
                f"任务：{item['prompt']}",
                f"固定工作目录：{EVAL_WORKDIR}",
                "输入文件：\n- " + "\n- ".join(map(str, input_paths)),
                "输出文件：\n- " + "\n- ".join(map(str, output_paths)),
                isolation,
                "仅写入声明的输出文件，且每个文件都必须是完整内容。",
            ))
            dispatches.append({
                "description": f"Eval-{item['id']} {group} run-{run_number}",
                "eval_id": item["id"],
                "eval_name": item["name"],
                "group": group,
                "run_number": run_number,
                "model": model,
                "reasoning_effort": reasoning_effort,
                "fork_turns": "none",
                "workdir": str(EVAL_WORKDIR),
                "prompt": prompt,
                "output_root": str(output_root),
                "output_paths": [str(path) for path in output_paths],
                "metrics_path": str(run_dir / "metrics.json"),
            })
    return dispatches


def build_dispatches(eval_ids, groups, model, reasoning_effort, run_number=1):
    """Compatibility alias retained for earlier iteration-11 callers."""
    return build_prompts(
        eval_ids=eval_ids,
        groups=groups,
        model=model,
        reasoning_effort=reasoning_effort,
        run_number=run_number,
    )


def build_codex_command(dispatch, codex_bin="codex"):
    return [
        codex_bin,
        "exec",
        "-C",
        str(EVAL_WORKDIR),
        "-s",
        "workspace-write",
        "-m",
        dispatch["model"],
        "-c",
        f'model_reasoning_effort="{dispatch["reasoning_effort"]}"',
        "--color",
        "never",
        "--json",
        "-",
    ]


def extract_metrics(stdout, duration_ms):
    input_tokens = 0
    output_tokens = 0
    tool_calls = 0
    for line in stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        usage = event.get("usage", {})
        if usage:
            input_tokens = max(input_tokens, usage.get("input_tokens", 0))
            output_tokens = max(output_tokens, usage.get("output_tokens", 0))
        item = event.get("item", {})
        if event.get("type") == "item.completed" and item.get("type") in {
            "command_execution",
            "file_change",
            "mcp_tool_call",
            "web_search",
        }:
            tool_calls += 1
    return {
        "total_tokens": input_tokens + output_tokens,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "tool_calls": tool_calls,
        "duration_ms": duration_ms,
    }


def write_metrics(metrics_path, metrics):
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n")
    (metrics_path.parent / "timing.json").write_text(
        json.dumps({
            "total_tokens": metrics["total_tokens"],
            "duration_ms": metrics["duration_ms"],
            "total_duration_seconds": round(metrics["duration_ms"] / 1000, 3),
        }, indent=2) + "\n"
    )


def run_dispatch(dispatch, codex_bin="codex"):
    workdir = Path(dispatch["workdir"]).resolve()
    if workdir != EVAL_WORKDIR:
        raise ValueError(f"dispatch workdir must be {EVAL_WORKDIR}, got {workdir}")
    output_paths = [Path(path).resolve() for path in dispatch["output_paths"]]
    for output_path in output_paths:
        try:
            output_path.relative_to(EVAL_WORKDIR)
        except ValueError as error:
            raise ValueError(
                f"output path must stay under {EVAL_WORKDIR}"
            ) from error

    Path(dispatch["output_root"]).mkdir(parents=True, exist_ok=True)
    run_dir = Path(dispatch["metrics_path"]).parent
    run_dir.mkdir(parents=True, exist_ok=True)
    command = build_codex_command(dispatch, codex_bin=codex_bin)
    started = time.monotonic()
    result = subprocess.run(
        command,
        cwd=EVAL_WORKDIR,
        input=dispatch["prompt"],
        capture_output=True,
        text=True,
        check=False,
    )
    duration_ms = round((time.monotonic() - started) * 1000)
    (run_dir / "agent.jsonl").write_text(result.stdout)
    (run_dir / "stderr.log").write_text(result.stderr)
    write_metrics(
        Path(dispatch["metrics_path"]),
        extract_metrics(result.stdout, duration_ms),
    )
    run_result = {
        "description": dispatch["description"],
        "cwd": str(EVAL_WORKDIR),
        "command": command[:-1] + ["<prompt-via-stdin>"],
        "returncode": result.returncode,
        "outputs_complete": all(path.is_file() for path in output_paths),
        "duration_ms": duration_ms,
    }
    (run_dir / "run.json").write_text(
        json.dumps(run_result, ensure_ascii=False, indent=2) + "\n"
    )
    return run_result


def run_dispatches(dispatches, max_workers=3, codex_bin="codex"):
    if not dispatches:
        return []
    with ThreadPoolExecutor(
        max_workers=min(max_workers, len(dispatches))
    ) as executor:
        return list(executor.map(
            lambda dispatch: run_dispatch(dispatch, codex_bin=codex_bin),
            dispatches,
        ))


def main():
    parser = argparse.ArgumentParser(
        description="Generate or execute self-contained Mpx2Web eval prompts"
    )
    parser.add_argument("--evals", nargs="*", type=int)
    parser.add_argument("--groups", nargs="*", choices=PUBLIC_GROUPS)
    parser.add_argument("--run-number", type=int, default=1)
    parser.add_argument("--model", required=True)
    parser.add_argument("--reasoning-effort", required=True)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--max-workers", type=int, default=3)
    parser.add_argument("--codex-bin", default="codex")
    args = parser.parse_args()
    if args.max_workers < 1:
        parser.error("--max-workers must be at least 1")
    dispatches = build_prompts(
        eval_ids=args.evals,
        groups=args.groups,
        model=args.model,
        reasoning_effort=args.reasoning_effort,
        run_number=args.run_number,
    )
    if not args.execute:
        print(json.dumps(dispatches, ensure_ascii=False, indent=2))
        print(f"\n# Total: {len(dispatches)} agent dispatches", file=sys.stderr)
        return
    results = run_dispatches(
        dispatches,
        max_workers=args.max_workers,
        codex_bin=args.codex_bin,
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))
    if any(
        result["returncode"] != 0 or not result["outputs_complete"]
        for result in results
    ):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
