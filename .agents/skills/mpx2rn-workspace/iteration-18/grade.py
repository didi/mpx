#!/usr/bin/env python3
"""Score each capability once; retain iteration-17 checks as reusable evidence."""
import importlib.util
import json
import re
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "iteration17_grader", WORKSPACE.parent / "iteration-17/grade.py")
LEGACY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LEGACY)
CONFIG = json.loads((WORKSPACE / "evals.json").read_text())
CASES = {case["id"]: case for case in CONFIG["evals"]}
SOURCE_CONFIG = json.loads(
    (WORKSPACE.parent / "iteration-17/evals.json").read_text())
SOURCE_CHECKERS = {
    assertion["id"]: LEGACY.CHECKERS[case["id"]]
    for case in SOURCE_CONFIG["evals"] for assertion in case["assertions"]
}


def check_case(eval_id, output_path):
    assertions = CASES[eval_id]["assertions"]
    checkers = dict.fromkeys(
        SOURCE_CHECKERS[key] for assertion in assertions
        for key in assertion["checks"])
    results = {
        result["id"]: result["passed"]
        for checker in checkers for result in checker(output_path)
    }
    blocks = LEGACY.extract_blocks(output_path.read_text())
    complete = bool(blocks["template"].strip() and blocks["script"].strip())
    if eval_id == 1:
        # Old t4 also accepted a bare scroll-view, duplicating t3. Require the
        # actual loading event so the merged assertion retains that coverage.
        results["t4"] = LEGACY.has_scroll_loading_handler(blocks["template"])
        results["t1"] = results["t1"] and bool(re.search(
            r'bindtap\s*=\s*["\'][^"\']+\([^"\']+\)',
            blocks["template"]))
    return [{
        "id": assertion["id"],
        "text": assertion["text"],
        "passed": complete and all(results[key] for key in assertion["checks"]),
    } for assertion in assertions]


LEGACY.RUN_KINDS = tuple(group["id"] for group in CONFIG["comparison"]["groups"])
LEGACY.WORKSPACE = WORKSPACE
LEGACY.EVAL_DIRS = {
    eid: f"eval-{eid}-{case['name']}" for eid, case in CASES.items()
}
LEGACY.OUTPUT_FILES = {eid: case["outputs"][0] for eid, case in CASES.items()}
LEGACY.CHECKERS = {
    eid: (lambda path, eid=eid: check_case(eid, path)) for eid in CASES
}

if __name__ == "__main__":
    LEGACY.main()
