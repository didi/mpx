#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).parent


def main():
    parser = argparse.ArgumentParser(description="按 eval_metadata assertions 生成待评分记录并检查输出完整性。")
    parser.add_argument("eval_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--write", type=Path)
    args = parser.parse_args()
    metadata = json.loads((args.eval_dir / "eval_metadata.json").read_text())
    missing = [path for path in metadata["outputs"] if not (args.output_dir / path).is_file()]
    expectations = [{
        "id": item["id"],
        "text": item["text"],
        "category": item["category"],
        "passed": None if not missing else False,
        "evidence": "待依据完整输出执行静态检查/人工复核" if not missing else f"缺少输出文件：{', '.join(missing)}"
    } for item in metadata["assertions"]]
    result = {
        "eval_id": metadata["eval_id"],
        "eval_name": metadata["eval_name"],
        "output_complete": not missing,
        "expectations": expectations
    }
    content = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.write:
        args.write.write_text(content)
    else:
        print(content, end="")
    return int(bool(missing))


if __name__ == "__main__":
    raise SystemExit(main())
