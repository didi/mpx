#!/usr/bin/env python3
"""Generate or execute isolated mpx/mpx2rn runs from this directory's config.

Prepare only:
  python3 run_evals.py --model gpt-6.1-sol --reasoning-effort high
Execute:
  python3 run_evals.py --execute --model gpt-6.1-sol --reasoning-effort high

Use --evals and --groups to select runs. Execution saves JSONL transcripts,
run metadata and actual usage/timing under each group's run-1 directory.
"""
import json
import sys
import argparse
import shutil
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
PROJECT_ROOT = WORKSPACE.parents[4]
EVAL_WORKDIR = WORKSPACE.parent.resolve()

CONFIG = json.loads((WORKSPACE / "evals.json").read_text())
EVAL_DIRS = {
    case["id"]: f"eval-{case['id']}-{case['name']}" for case in CONFIG["evals"]
}
OUTPUT_FILES = {case["id"]: case["outputs"][0] for case in CONFIG["evals"]}


def copy_input_dependencies(eval_dir, input_path, output_dir):
    input_dir = WORKSPACE / eval_dir / "input"
    for source_path in input_dir.rglob("*"):
        if source_path.is_file() and source_path != input_path:
            target_path = output_dir / source_path.relative_to(input_dir)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, target_path)


def build_prompts(eval_ids=None, groups=None, model=None, reasoning_effort=None):
    if not model or not reasoning_effort:
        raise ValueError(
            "model and reasoning_effort must be explicitly set for this evaluation"
        )

    evals_cfg = json.loads((WORKSPACE / "evals.json").read_text())
    templates_cfg = json.loads((WORKSPACE / "prompt_templates.json").read_text())

    all_groups = [group["id"] for group in evals_cfg["comparison"]["groups"]]
    if groups is None:
        groups = all_groups

    evals = evals_cfg["evals"]
    if eval_ids is not None:
        evals = [e for e in evals if e["id"] in eval_ids]

    skill_paths = {
        "MPX2RN_SKILL_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn/SKILL.md"),
        "MPX2RN_REFS_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn/references/"),
    }
    workdir = str(EVAL_WORKDIR)

    dispatches = []
    for ev in evals:
        eid = ev["id"]
        eval_dir = EVAL_DIRS[eid]
        output_file = OUTPUT_FILES[eid]
        input_files = ev.get("files", [])
        input_path = WORKSPACE / eval_dir / input_files[0] if input_files else None

        for group in groups:
            if group not in templates_cfg["templates"]:
                continue
            tmpl = templates_cfg["templates"][group]
            output_path = str(WORKSPACE / eval_dir / group / "outputs" / output_file)
            metrics_path = str(WORKSPACE / eval_dir / group / "run-1" / "metrics.json")
            if input_path:
                copy_input_dependencies(eval_dir, input_path, Path(output_path).parent)

            variables = {
                "TASK_PROMPT": ev["prompt"],
                "INPUT_PATH": str(input_path) if input_path else "",
                "OUTPUT_PATH": output_path,
                "METRICS_PATH": metrics_path,
                "MODEL": model,
                "REASONING_EFFORT": reasoning_effort,
                "WORKDIR": workdir,
                **skill_paths,
            }

            prompt = tmpl["prompt"]
            for key, val in variables.items():
                prompt = prompt.replace("{{" + key + "}}", val)

            dispatches.append({
                "description": f"Eval-{eid} {group}",
                "model": model,
                "reasoning_effort": reasoning_effort,
                "fork_turns": "none",
                "workdir": workdir,
                "prompt": prompt,
                "output_path": output_path,
                "metrics_path": metrics_path,
            })

    return dispatches


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


def sync_timing_files():
    for metrics_path in WORKSPACE.glob("eval-*/*/run-*/metrics.json"):
        write_metrics(metrics_path, json.loads(metrics_path.read_text()))


def run_dispatch(dispatch, codex_bin="codex"):
    workdir = Path(dispatch["workdir"]).resolve()
    if workdir != EVAL_WORKDIR:
        raise ValueError(f"dispatch workdir must be {EVAL_WORKDIR}, got {workdir}")

    output_path = Path(dispatch["output_path"]).resolve()
    try:
        output_path.relative_to(EVAL_WORKDIR)
    except ValueError as error:
        raise ValueError(f"output path must stay under {EVAL_WORKDIR}") from error

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
        "output_exists": output_path.is_file(),
        "duration_ms": duration_ms,
    }
    (run_dir / "run.json").write_text(
        json.dumps(run_result, ensure_ascii=False, indent=2) + "\n"
    )
    return run_result


def run_dispatches(dispatches, max_workers=3, codex_bin="codex"):
    if not dispatches:
        return []
    with ThreadPoolExecutor(max_workers=min(max_workers, len(dispatches))) as executor:
        return list(
            executor.map(
                lambda dispatch: run_dispatch(dispatch, codex_bin=codex_bin),
                dispatches,
            )
        )


def main():
    parser = argparse.ArgumentParser(description="Generate or execute eval agent prompts")
    parser.add_argument("--evals", nargs="*", type=int, help="Eval IDs to run (default: all)")
    parser.add_argument("--groups", nargs="*", help="Groups to run (default: all)")
    parser.add_argument(
        "--model",
        required=True,
        help="Model for this evaluation (for example gpt-6.1-sol)",
    )
    parser.add_argument(
        "--reasoning-effort",
        required=True,
        help="Reasoning effort for this evaluation (for example high)",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Execute child agents with codex exec -C instead of printing dispatch JSON",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=3,
        help="Maximum concurrent child agents (default: 3)",
    )
    parser.add_argument(
        "--codex-bin",
        default="codex",
        help="Codex executable used by --execute (default: codex)",
    )
    args = parser.parse_args()

    dispatches = build_prompts(
        eval_ids=args.evals,
        groups=args.groups,
        model=args.model,
        reasoning_effort=args.reasoning_effort,
    )

    if not args.execute:
        print(json.dumps(dispatches, ensure_ascii=False, indent=2))
        print(f"\n# Total: {len(dispatches)} agent dispatches", file=sys.stderr)
        return

    if args.max_workers < 1:
        parser.error("--max-workers must be at least 1")

    results = run_dispatches(
        dispatches,
        max_workers=args.max_workers,
        codex_bin=args.codex_bin,
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))
    if any(result["returncode"] != 0 or not result["output_exists"] for result in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
