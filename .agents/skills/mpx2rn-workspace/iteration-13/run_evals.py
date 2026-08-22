#!/usr/bin/env python3
"""
Generate sub-agent prompts from prompt_templates.json + evals.json.

Usage:
  # Print all prompts and stage input dependencies in each outputs directory.
  # Model and reasoning effort must explicitly match the parent session.
  python3 run_evals.py --model gpt-5.6-sol --reasoning-effort high

  # Print prompts for specific eval ids
  python3 run_evals.py --evals 0 2 --model gpt-5.6-sol --reasoning-effort high

  # Specify specific groups
  python3 run_evals.py --groups mpx2rn mpx2rn_simple no_skill \
    --model gpt-5.6-sol --reasoning-effort high

Output is a JSON array of agent dispatch descriptors, each with:
  {
    "description", "model", "reasoning_effort", "fork_turns", "workdir",
    "prompt", "output_path", "metrics_path"
  }

Copy the output to Claude Code to dispatch agents.
Before emitting dispatches, the script copies every input fixture except the
primary task file into the corresponding outputs directory.
Metrics are collected from task-notification <usage> by the main agent after each
sub-agent completes, then written to metrics_path. Required schema:
  {
    "total_tokens": 84852,
    "tool_calls": 12,
    "duration_ms": 23332
  }
"""
import json
import sys
import argparse
import shutil
from pathlib import Path

WORKSPACE = Path(__file__).parent
PROJECT_ROOT = WORKSPACE.parents[3]

EVAL_DIRS = {
    0: "eval-0-style-adaptation",
    1: "eval-1-template-adaptation",
    2: "eval-2-script-json-adaptation",
    3: "eval-3-gradient-animation-interaction",
    4: "eval-4-text-layout-selector",
    5: "eval-5-conditional-compile-advanced",
    6: "eval-6-new-rating-component",
    7: "eval-7-new-segmented-control",
    8: "eval-8-new-task-board-page",
}

OUTPUT_FILES = {
    0: "product-card.mpx",
    1: "order-list.mpx",
    2: "user-profile.mpx",
    3: "carousel-card.mpx",
    4: "data-panel.mpx",
    5: "payment-page.mpx",
    6: "rating-selector.mpx",
    7: "segmented-control.mpx",
    8: "task-board.mpx",
}


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
            "model and reasoning_effort must be explicitly set to the parent session values"
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
        "MPX2RN_SIMPLE_SKILL_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn-simple/SKILL.md"),
        "MPX2RN_SIMPLE_REFS_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn-simple/references/"),
    }
    workdir = str(WORKSPACE.parent)

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


def main():
    parser = argparse.ArgumentParser(description="Generate eval agent prompts")
    parser.add_argument("--evals", nargs="*", type=int, help="Eval IDs to run (default: all)")
    parser.add_argument("--groups", nargs="*", help="Groups to run (default: all)")
    parser.add_argument(
        "--model",
        required=True,
        help="Model of the parent session; the eval sub-agent must use the same model",
    )
    parser.add_argument(
        "--reasoning-effort",
        required=True,
        help="Reasoning effort of the parent session; the eval sub-agent must use the same value",
    )
    args = parser.parse_args()

    dispatches = build_prompts(
        eval_ids=args.evals,
        groups=args.groups,
        model=args.model,
        reasoning_effort=args.reasoning_effort,
    )

    print(json.dumps(dispatches, ensure_ascii=False, indent=2))
    print(f"\n# Total: {len(dispatches)} agent dispatches", file=sys.stderr)


if __name__ == "__main__":
    main()
