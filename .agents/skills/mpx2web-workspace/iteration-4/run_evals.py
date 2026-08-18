#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent
PROJECT_ROOT = ROOT.parents[3]


def build(eval_ids=None, groups=None):
    evals = json.loads((ROOT / "evals.json").read_text())
    templates = json.loads((ROOT / "prompt_templates.json").read_text())
    groups = groups or ["no_skill", "has_skill"]
    dispatches = []
    for item in evals:
        if eval_ids and item["id"] not in eval_ids:
            continue
        for group in groups:
            output_dir = ROOT / item["id"] / group / "outputs"
            inputs = [str(ROOT / path) for path in item["inputs"]]
            outputs = [str(output_dir / name) for name in item["outputs"]]
            prompt = "\n\n".join([
                templates[group],
                f"本用例要求：{item['task']}",
                "输入文件：\n- " + "\n- ".join(inputs),
                "把完整源文件写入：\n- " + "\n- ".join(outputs),
                f"Skill 路径：{PROJECT_ROOT / '.agents/skills/mpx2web/SKILL.md'}" if group == "has_skill" else ""
            ]).strip()
            dispatches.append({
                "description": f"{item['id']} {group}: {item['name']}",
                "group": group,
                "eval_id": item["id"],
                "prompt": prompt,
                "output_paths": outputs
            })
    return dispatches


def main():
    parser = argparse.ArgumentParser(description="生成 agent 执行任务；本命令本身不调用模型。")
    parser.add_argument("--evals", nargs="*")
    parser.add_argument("--groups", nargs="*", choices=["no_skill", "has_skill"])
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    content = json.dumps(build(args.evals, args.groups), ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(content)
        print(f"任务已写入：{args.output}")
    else:
        print(content, end="")
    print("注意：run_evals.py 只生成 dispatch，不会执行 Agent。", file=sys.stderr)


if __name__ == "__main__":
    main()
