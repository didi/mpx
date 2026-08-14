#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).parent


def fixture_digest(metadata_path, metadata):
    digest = hashlib.sha256()
    digest.update(json.dumps(metadata, ensure_ascii=False, sort_keys=True).encode())
    for path in metadata["files"]:
        digest.update(path.encode())
        digest.update((metadata_path.parent / path).read_bytes())
    return digest.hexdigest()


def build():
    evals = []
    for metadata_path in sorted(ROOT.glob("eval-*/eval_metadata.json")):
        metadata = json.loads(metadata_path.read_text())
        evals.append({
            "id": metadata["eval_id"],
            "name": metadata["eval_name"],
            "prompt": metadata["prompt"],
            "expected_output": "输出 metadata.outputs 声明的全部完整文件，并满足 assertions。",
            "files": [str(metadata_path.parent.relative_to(ROOT) / path) for path in metadata["files"]],
            "outputs": metadata["outputs"],
            "assertions": metadata["assertions"],
            "complexity": metadata["complexity"],
            "focus": metadata["focus"],
            "fixture_digest": fixture_digest(metadata_path, metadata)
        })
    return {"skill_name": "mpx2web", "iteration": 8, "evals": evals}


if __name__ == "__main__":
    print(json.dumps(build(), ensure_ascii=False, indent=2))
