#!/usr/bin/env python3
"""
Generate sub-agent prompts from prompt_templates.json + evals.json.

Usage:
  # Print all prompts (dry-run)
  python3 run_evals.py

  # Print prompts for specific eval ids
  python3 run_evals.py --evals 0 2

  # Specify model
  python3 run_evals.py --model opus

  # Specify specific groups
  python3 run_evals.py --groups no_skill mpx2rn_original

Output is a JSON array of agent dispatch descriptors, each with:
  { "description", "model", "prompt", "output_path", "metrics_path" }

Copy the output to Claude Code to dispatch agents.
Each agent must write metrics_path before it finishes. Required schema:
  {
    "total_tokens": 84852,
    "tool_calls": 12,
    "duration_ms": 23332
  }
"""
import json
import sys
import argparse
from pathlib import Path

WORKSPACE = Path(__file__).parent
PROJECT_ROOT = WORKSPACE.parents[3]  # .agents/skills/mpx2rn-workspace/iteration-8 -> /Users/didi/work/mpx2

EVAL_DIRS = {
    0: "eval-0-style-adaptation",
    1: "eval-1-template-adaptation",
    2: "eval-2-script-json-adaptation",
    3: "eval-3-gradient-animation-interaction",
    4: "eval-4-text-layout-selector",
    5: "eval-5-conditional-compile-advanced",
}

OUTPUT_FILES = {
    0: "product-card.mpx",
    1: "order-list.mpx",
    2: "user-profile.mpx",
    3: "carousel-card.mpx",
    4: "data-panel.mpx",
    5: "payment-page.mpx",
}


def build_prompts(eval_ids=None, groups=None, model="opus"):
    evals_cfg = json.loads((WORKSPACE / "evals.json").read_text())
    templates_cfg = json.loads((WORKSPACE / "prompt_templates.json").read_text())

    all_groups = list(templates_cfg["templates"].keys())
    if groups is None:
        groups = all_groups

    evals = evals_cfg["evals"]
    if eval_ids is not None:
        evals = [e for e in evals if e["id"] in eval_ids]

    skill_paths = {
        "ORIGINAL_SKILL_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn/SKILL.md"),
        "ORIGINAL_REFS_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn/references/"),
        "GENE_SKILL_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn-gene/SKILL.md"),
        "GENE_GENES_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn-gene/genes/"),
        "GENE_REFS_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2rn-gene/references/"),
    }

    dispatches = []
    for ev in evals:
        eid = ev["id"]
        eval_dir = EVAL_DIRS[eid]
        output_file = OUTPUT_FILES[eid]
        input_files = ev.get("files", [])
        input_path = str(WORKSPACE / eval_dir / input_files[0]) if input_files else ""

        for group in groups:
            if group not in templates_cfg["templates"]:
                continue
            tmpl = templates_cfg["templates"][group]
            output_path = str(WORKSPACE / eval_dir / group / "outputs" / output_file)
            metrics_path = str(WORKSPACE / eval_dir / group / "run-1" / "metrics.json")

            variables = {
                "TASK_PROMPT": ev["prompt"],
                "INPUT_PATH": input_path,
                "OUTPUT_PATH": output_path,
                "METRICS_PATH": metrics_path,
                "MODEL": model,
                **skill_paths,
            }

            prompt = tmpl["prompt"]
            for key, val in variables.items():
                prompt = prompt.replace("{{" + key + "}}", val)

            dispatches.append({
                "description": f"Eval-{eid} {group}",
                "model": model,
                "prompt": prompt,
                "output_path": output_path,
                "metrics_path": metrics_path,
            })

    return dispatches


def main():
    parser = argparse.ArgumentParser(description="Generate eval agent prompts")
    parser.add_argument("--evals", nargs="*", type=int, help="Eval IDs to run (default: all)")
    parser.add_argument("--groups", nargs="*", help="Groups to run (default: all)")
    parser.add_argument("--model", default="opus", help="Model to use (default: opus)")
    args = parser.parse_args()

    dispatches = build_prompts(
        eval_ids=args.evals,
        groups=args.groups,
        model=args.model,
    )

    print(json.dumps(dispatches, ensure_ascii=False, indent=2))
    print(f"\n# Total: {len(dispatches)} agent dispatches", file=sys.stderr)


if __name__ == "__main__":
    main()
