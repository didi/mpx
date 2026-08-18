#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent


def fail(message):
    print(f"FAIL: {message}", file=sys.stderr)
    return 1


def main():
    expected_dirs = [path for path in sorted(ROOT.glob("eval-*-*")) if path.is_dir()]
    if len(expected_dirs) != 6:
        return fail(f"expected 6 eval directories, got {len(expected_dirs)}")
    metadata_list = []
    assertion_ids = set()
    for index, eval_dir in enumerate(expected_dirs):
        metadata_path = eval_dir / "eval_metadata.json"
        if not metadata_path.is_file():
            return fail(f"missing {metadata_path.relative_to(ROOT)}")
        metadata = json.loads(metadata_path.read_text())
        if metadata["eval_id"] != index or eval_dir.name != f"eval-{index}-{metadata['eval_name']}":
            return fail(f"id/name mismatch in {eval_dir.name}")
        if metadata["complexity"] != ("normal" if index < 3 else "complex"):
            return fail(f"unexpected complexity in {eval_dir.name}")
        if len(metadata["files"]) != len(metadata["outputs"]):
            return fail(f"input/output count mismatch in {eval_dir.name}")
        for path in metadata["files"]:
            if not (eval_dir / path).is_file():
                return fail(f"missing input {eval_dir.name}/{path}")
        for assertion in metadata["assertions"]:
            if assertion["id"] in assertion_ids:
                return fail(f"duplicate assertion id {assertion['id']}")
            assertion_ids.add(assertion["id"])
            if not all(assertion.get(key) for key in ("id", "text", "category")):
                return fail(f"invalid assertion in {eval_dir.name}")
            for field in ("required_patterns", "forbidden_patterns"):
                for rule in assertion.get(field, []):
                    if not all(rule.get(key) for key in ("pattern", "description")):
                        return fail(f"invalid {field} rule in {eval_dir.name}/{assertion['id']}")
                    try:
                        re.compile(rule["pattern"])
                    except re.error as error:
                        return fail(f"invalid regex in {eval_dir.name}/{assertion['id']}: {error}")
        metadata_list.append(metadata)

    public = json.loads((ROOT / "evals.json").read_text())
    generated = json.loads(subprocess.check_output([sys.executable, str(ROOT / "build_evals.py")]))
    if public != generated:
        return fail("evals.json is stale; regenerate it with build_evals.py")
    if [item["complexity"] for item in public["evals"]].count("normal") != 3:
        return fail("benchmark must contain 3 normal evals")
    if [item["complexity"] for item in public["evals"]].count("complex") != 3:
        return fail("benchmark must contain 3 complex evals")

    prompts = "\n".join(item["prompt"] for item in metadata_list)
    metadata_text = json.dumps(metadata_list, ensure_ascii=False)
    required_topics = ["WebView", "WXS", "SocketTask", "SSR", "scoped", "分享"]
    for topic in required_topics:
        if topic.lower() not in metadata_text.lower():
            return fail(f"missing Web benchmark topic: {topic}")
    if re.search(r"loadChunkAsync|downloadChunkAsync|react-native|React Native", prompts, re.I):
        return fail("prompt leaks RN-only topic")
    eval4 = metadata_list[4]
    eval4_assertions = "\n".join(assertion["text"] for assertion in eval4["assertions"])
    if re.search(r"requestId|callbackId|请求.?响应", eval4_assertions, re.I):
        return fail("eval-4 must not grade an undeclared request-response protocol")
    if "没有自定义 invoke API" not in eval4["prompt"]:
        return fail("eval-4 must state the one-way WebView protocol boundary")
    recommendations = (expected_dirs[5] / "input/src/components/product-recommendations.mpx").read_text()
    if not all(token in recommendations for token in ("create({ productId })", "track(eventName, payload)", "destroy()")):
        return fail("eval-5 must document the client SDK lifecycle contract")
    print(f"OK: 6 evals, {len(assertion_ids)} assertions, 3 normal + 3 complex")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
