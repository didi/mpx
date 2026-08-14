#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).parent
SKILL = ROOT.parent.parent / "mpx2web" / "SKILL.md"


def build_dispatches(eval_ids, groups):
    evals = json.loads((ROOT / "evals.json").read_text())["evals"]
    dispatches = []
    for item in evals:
        if eval_ids and item["id"] not in eval_ids:
            continue
        for group in groups:
            output_root = ROOT / f"eval-{item['id']}-{item['name']}" / group / "outputs"
            instruction = "先完整读取并严格使用 Skill。" if group == "has_skill" else "不要读取或使用 mpx2web Skill。"
            dispatches.append({
                "eval_id": item["id"],
                "eval_name": item["name"],
                "group": group,
                "prompt": "\n\n".join([
                    instruction,
                    item["prompt"],
                    "输入文件：\n- " + "\n- ".join(str(ROOT / path) for path in item["files"]),
                    "输出文件：\n- " + "\n- ".join(str(output_root / path) for path in item["outputs"]),
                    f"Skill：{SKILL}" if group == "has_skill" else ""
                ]).strip(),
                "output_root": str(output_root)
            })
    return dispatches


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="生成 benchmark Agent dispatch，不直接调用模型。")
    parser.add_argument("--evals", nargs="*", type=int)
    parser.add_argument("--groups", nargs="*", choices=["no_skill", "has_skill"], default=["no_skill", "has_skill"])
    args = parser.parse_args()
    print(json.dumps(build_dispatches(args.evals, args.groups), ensure_ascii=False, indent=2))
