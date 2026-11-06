#!/usr/bin/env python3
"""Use the local execution protocol with Skyline's multi-file delivery contract."""
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "execution", WORKSPACE / "execution.py")
RUNNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUNNER)
CONFIG = json.loads((WORKSPACE / "evals.json").read_text())
CASES = {case["id"]: case for case in CONFIG["evals"]}
RUNNER.WORKSPACE = WORKSPACE
RUNNER.EVAL_WORKDIR = WORKSPACE.parent
RUNNER.EVAL_DIRS = {
    eid: f"eval-{eid}-{case['name']}" for eid, case in CASES.items()
}
RUNNER.OUTPUT_FILES = {eid: case["outputs"][0] for eid, case in CASES.items()}
BUILD_PROMPTS = RUNNER.build_prompts
RUN_DISPATCH = RUNNER.run_dispatch
RUN_DISPATCHES = RUNNER.run_dispatches


def copy_input_dependencies(eval_dir, input_path, output_dir):
    # Never stage files that the agent must adapt: their mere presence must not
    # make an incomplete run look successful. Preserve existing staged assets.
    case = next(case for eid, case in CASES.items()
                if RUNNER.EVAL_DIRS[eid] == eval_dir)
    group = output_dir.relative_to(RUNNER.WORKSPACE / eval_dir).parts[0]
    output_dir = RUNNER.WORKSPACE / eval_dir / group / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)
    for filename in case["staged_files"]:
        target = output_dir / filename
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(RUNNER.WORKSPACE / eval_dir / "input" / filename, target)


def build_prompts(eval_ids=None, groups=None, model=None, reasoning_effort=None):
    allowed_groups = [group["id"] for group in CONFIG["comparison"]["groups"]]
    if groups is not None and set(groups) - set(allowed_groups):
        raise ValueError(f"groups must be selected from {allowed_groups}")
    if eval_ids is not None and set(eval_ids) - set(CASES):
        raise ValueError(f"evals must be selected from {list(CASES)}")
    dispatches = BUILD_PROMPTS(eval_ids, groups, model, reasoning_effort)
    for dispatch in dispatches:
        output_path = Path(dispatch["output_path"])
        run_dir = Path(dispatch["metrics_path"]).parent
        case_dir = run_dir.parent.parent
        case = next(case for eid, case in CASES.items()
                    if RUNNER.EVAL_DIRS[eid] == case_dir.name)
        output_dir = run_dir.parent / "outputs"
        dispatch.update({
            "eval_id": case["id"],
            "group": run_dir.parent.name,
            "required_outputs": [str(output_dir / name) for name in case["outputs"]],
        })
        for key, value in {
            "INPUT_DIR": str(case_dir / "input"),
            "ITERATION_DIR": str(RUNNER.WORKSPACE),
            "OUTPUT_DIR": str(output_dir),
            "RUN_DIR": str(run_dir),
            "REQUIRED_OUTPUTS": ", ".join(case["outputs"]),
        }.items():
            dispatch["prompt"] = dispatch["prompt"].replace("{{" + key + "}}", value)
        if "{{" in dispatch["prompt"]:
            raise ValueError(f"unresolved prompt variable: {output_path}")
    return dispatches


def fingerprints(dispatch):
    case_dir = Path(dispatch["metrics_path"]).parents[2]
    skill = RUNNER.WORKSPACE / "skill-snapshots" / dispatch["group"]
    roots = {"input": case_dir / "input", "skill": skill}
    return {
        kind: {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest()
               for path in sorted(root.rglob("*")) if path.is_file()}
        for kind, root in roots.items()
    }


def run_dispatch(dispatch, codex_bin="codex"):
    run_dir = Path(dispatch["metrics_path"]).parent
    if (run_dir / "agent.jsonl").exists():
        raise ValueError(f"run already exists; archive it before rerunning: {run_dir}")
    before = fingerprints(dispatch)
    result = RUN_DISPATCH(dispatch, codex_bin=codex_bin)
    after = fingerprints(dispatch)
    result["missing_outputs"] = [
        filename for filename in dispatch["required_outputs"]
        if not Path(filename).is_file() or not Path(filename).stat().st_size
    ]
    result["output_exists"] = not result["missing_outputs"]
    result["sources_unchanged"] = before == after
    if not result["sources_unchanged"]:
        result["returncode"] = result["returncode"] or 1
    (run_dir / "source-snapshot.json").write_text(
        json.dumps({"before": before, "after": after}, ensure_ascii=False, indent=2) + "\n")
    (run_dir / "run.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    return result


def run_dispatches(dispatches, max_workers=3, codex_bin="codex"):
    results = RUN_DISPATCHES(dispatches, max_workers=max_workers, codex_bin=codex_bin)
    (RUNNER.WORKSPACE / "execution-results.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    return results


RUNNER.copy_input_dependencies = copy_input_dependencies
RUNNER.build_prompts = build_prompts
RUNNER.run_dispatch = run_dispatch
RUNNER.run_dispatches = run_dispatches

if __name__ == "__main__":
    RUNNER.main()
