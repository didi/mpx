#!/usr/bin/env python3
"""Run the consolidated suite using iteration-17's execution protocol."""
import importlib.util
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "iteration17_runner", WORKSPACE.parent / "iteration-17/run_evals.py")
RUNNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUNNER)
CONFIG = json.loads((WORKSPACE / "evals.json").read_text())
RUNNER.WORKSPACE = WORKSPACE
RUNNER.EVAL_DIRS = {
    case["id"]: f"eval-{case['id']}-{case['name']}" for case in CONFIG["evals"]
}
RUNNER.OUTPUT_FILES = {
    case["id"]: case["outputs"][0] for case in CONFIG["evals"]
}

if __name__ == "__main__":
    RUNNER.main()
