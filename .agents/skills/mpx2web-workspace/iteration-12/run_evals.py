#!/usr/bin/env python3
"""Case adapter over the RN iteration-17 executor; no calls without --execute."""
import argparse
import concurrent.futures
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import time
import isolated_execution

WORKSPACE = Path(__file__).resolve().parent
PROJECT_ROOT = Path(os.environ["MPX_BENCHMARK_REPO"]) if os.environ.get("MPX_BENCHMARK_REPO") else WORKSPACE.parents[3]
EVAL_WORKDIR = WORKSPACE.parent
RN_WORKSPACE = PROJECT_ROOT / ".agents/skills/mpx2rn-workspace"
SKILL_CREATOR = PROJECT_ROOT / ".agents/skills/skill-creator"


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BASE = load_module("rn_eval_base", RN_WORKSPACE / "iteration-17/run_evals.py")
BASE.EVAL_WORKDIR = EVAL_WORKDIR


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def inside(root, relative):
    candidate = root / relative
    candidate.resolve().relative_to(root.resolve())
    if Path(relative).is_absolute() or ".." in Path(relative).parts:
        raise ValueError(f"invalid relative path: {relative}")
    return candidate


def tree_hash(root):
    digest = hashlib.sha256()
    if root.exists():
        for path in sorted(root.rglob("*")):
            if path.is_symlink():
                raise ValueError(f"symlink is not a submitted artifact: {path}")
            if path.is_file() and "__pycache__" not in path.parts:
                digest.update(str(path.relative_to(root)).encode())
                digest.update(path.read_bytes())
    return digest.hexdigest()


def load_configs():
    config = json.loads((WORKSPACE / "evals.json").read_text())
    templates = json.loads((WORKSPACE / "prompt_templates.json").read_text())
    if not config["runner"]["enabled"]:
        raise ValueError("suite runner is disabled")
    groups = [group["id"] for group in config["comparison"]["groups"]]
    if groups != ["mpx2web", "no_skill"]:
        raise ValueError("only current Mpx2Web and No Skill are configured")
    seen = set()
    for item in config["evals"]:
        if item["id"] in seen:
            raise ValueError("duplicate eval id")
        seen.add(item["id"])
        case = WORKSPACE / f"eval-{item['id']}-{item['name']}"
        for name in item["files"] + item.get("context_files", []):
            if not inside(WORKSPACE, name).is_file():
                raise ValueError(f"missing input/context: {name}")
        for name in item["outputs"]:
            inside(case, name)
        metadata = json.loads((case / "eval_metadata.json").read_text())
        expected_metadata = {
            "eval_id": item["id"],
            "eval_name": item["name"],
            "prompt": item["prompt"],
            "source_metadata": "evals.json",
        }
        if metadata != expected_metadata:
            raise ValueError(f"metadata drift: {case}")
    return config, templates


def build_prompts(eval_ids=None, groups=None, model=None, reasoning_effort=None, samples=1):
    if not model or not reasoning_effort:
        raise ValueError("model and reasoning_effort must be explicitly set")
    if samples < 1:
        raise ValueError("samples must be positive")
    config, templates = load_configs()
    configured = {g["id"]: g for g in config["comparison"]["groups"]}
    selected = list(configured) if groups is None else groups
    if not selected or set(selected) - configured.keys():
        raise ValueError("unknown or empty groups")
    if eval_ids is not None and (not eval_ids or set(eval_ids) - {e["id"] for e in config["evals"]}):
        raise ValueError("unknown or empty eval ids")
    dispatches = []
    for number in range(1, samples + 1):
        for item in config["evals"]:
            if eval_ids is not None and item["id"] not in eval_ids:
                continue
            case = WORKSPACE / f"eval-{item['id']}-{item['name']}"
            for group in selected:
                run = case / group / f"run-{number}"
                output = case / group / "outputs" if number == 1 else run / "outputs"
                variables = {
                    "TASK_PROMPT": item["prompt"], "WORKDIR": str(EVAL_WORKDIR),
                    "INPUT_PATH": str(case / "input"), "OUTPUT_PATH": str(output),
                    "OUTPUT_FILES": "\n".join(item["outputs"]),
                    "CONTEXT_FILES": "\n".join(str(WORKSPACE / p) for p in item.get("context_files", [])) or "无",
                    "MPX2WEB_SKILL_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2web/SKILL.md"),
                    "MPX2WEB_REFS_PATH": str(PROJECT_ROOT / ".agents/skills/mpx2web/references"),
                }
                prompt = templates["templates"][group]["prompt"]
                for key, value in variables.items():
                    prompt = prompt.replace("{{" + key + "}}", value)
                if "{{" in prompt:
                    raise ValueError("unresolved prompt variable")
                semantic_contract = {
                    "prompt": prompt, "model": model, "effort": reasoning_effort,
                    "input": tree_hash(case / "input"), "fixtures": tree_hash(case / "fixtures"),
                    "skill": tree_hash(PROJECT_ROOT / ".agents/skills/mpx2web") if group == "mpx2web" else None,
                }
                contract = {
                    **semantic_contract,
                    "runner": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                    "base": hashlib.sha256((RN_WORKSPACE / "iteration-17/run_evals.py").read_bytes()).hexdigest(),
                    "isolation": hashlib.sha256(Path(isolated_execution.__file__).read_bytes()).hexdigest(),
                }
                dispatches.append({
                    "description": f"Eval-{item['id']} {group} run-{number}",
                    "eval_id": item["id"], "group": group, "run_number": number,
                    "model": model, "reasoning_effort": reasoning_effort, "fork_turns": "none",
                    "workdir": str(EVAL_WORKDIR), "prompt": prompt,
                    "output_path": str(output / item["outputs"][0]), "output_root": str(output),
                    "metrics_path": str(run / "metrics.json"), "case_root": str(case),
                    "required_outputs": item["outputs"],
                    "semantic_contract": semantic_contract,
                    "fingerprint": hashlib.sha256(json.dumps(contract, sort_keys=True).encode()).hexdigest(),
                })
    return dispatches


def legacy_receipt(dispatch, result):
    """Explicit audited reuse; never relabel a legacy run as sandbox-isolated."""
    run = Path(dispatch["metrics_path"]).parent
    path = run / "reuse-receipt.json"
    if not path.is_file():
        return None
    receipt = json.loads(path.read_text())
    transcript = run / "agent.jsonl"
    if (receipt.get("keep") is True
            and receipt.get("original_fingerprint") == result.get("fingerprint")
            and receipt.get("contract") == dispatch["semantic_contract"]
            and receipt.get("output_digest") == tree_hash(Path(dispatch["output_root"]))
            and transcript.is_file()
            and receipt.get("transcript_digest") == hashlib.sha256(transcript.read_bytes()).hexdigest()):
        return receipt
    return None


def generation_complete(dispatch):
    run_path = Path(dispatch["metrics_path"]).parent / "run.json"
    if not run_path.exists():
        return False
    result = json.loads(run_path.read_text())
    output = Path(dispatch["output_root"])
    return (result.get("returncode") == 0 and result.get("output_exists") is True
            and (result.get("fingerprint") == dispatch["fingerprint"] or legacy_receipt(dispatch, result))
            and result.get("output_digest") == tree_hash(output)
            and all(inside(output, p).is_file() and inside(output, p).stat().st_size
                    for p in dispatch["required_outputs"]))


def collection_retry_allowed(dispatch, result):
    """An audited missing-output recovery cannot authorize replacing valid code."""
    run = Path(dispatch['metrics_path']).parent
    receipt = run / 'collection-recovery.json'
    if not receipt.is_file() or result.get('output_exists') is not False:
        return False
    record = json.loads(receipt.read_text())
    return (record.get('action') == 'regenerate_missing_outputs'
            and record.get('original_run') == result
            and record.get('contract') == dispatch['semantic_contract']
            and record.get('output_digest') == tree_hash(Path(dispatch['output_root']))
            and record.get('transcript_digest') == hashlib.sha256((run / 'agent.jsonl').read_bytes()).hexdigest())


def run_dispatch(dispatch, codex_bin="codex", resume=False):
    run = Path(dispatch["metrics_path"]).parent
    run.resolve().relative_to(WORKSPACE.resolve())
    Path(dispatch["output_root"]).resolve().relative_to(WORKSPACE.resolve())
    run.mkdir(parents=True, exist_ok=True)
    with (run / ".run.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if resume and generation_complete(dispatch):
            print(f"[skip] {dispatch['description']}", flush=True)
            return json.loads((run / "run.json").read_text())
        if (run / "run.json").exists():
            previous = json.loads((run / "run.json").read_text())
            if previous.get("fingerprint") != dispatch["fingerprint"] and not collection_retry_allowed(dispatch, previous):
                raise ValueError(f"{run}: 配置已变，不能混用旧结果；请使用新的 iteration")
            if previous.get("returncode") == 0 and previous.get("output_exists"):
                raise ValueError(f"{run}: 已有结果或产物被改动；不覆盖，请核对后使用 --resume")
        output = Path(dispatch["output_root"])
        if output.exists():
            output.resolve().relative_to(WORKSPACE.resolve())
            if not (run / "run.json").exists():
                raise ValueError(f"{output}: 未知已有产物，拒绝覆盖")
            shutil.rmtree(output)  # Only this exact, unsuccessful dispatch's artifacts.
        output.mkdir(parents=True)
        input_root = Path(dispatch["case_root"]) / "input"
        for source in input_root.rglob("*"):
            relative = str(source.relative_to(input_root))
            if source.is_file() and relative not in dispatch["required_outputs"] and source.suffix != ".md":
                target = inside(output, relative)
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
        write_json(run / "run.json", {
            "fingerprint": dispatch["fingerprint"], "returncode": None,
            "output_exists": False, "status": "running",
        })
        print(f"[running] {dispatch['description']}", flush=True)
        result = isolated_execution.run(dispatch, BASE, EVAL_WORKDIR, PROJECT_ROOT, codex_bin)
        result.update({
            "fingerprint": dispatch["fingerprint"], "model": dispatch["model"],
            "reasoning_effort": dispatch["reasoning_effort"],
            "output_root": str(output.relative_to(run.parent)),
            "output_exists": all(inside(output, p).is_file() and inside(output, p).stat().st_size > 0
                                 for p in dispatch["required_outputs"]),
            "output_digest": tree_hash(output),
            "validation": {"compile": "not_run_by_runner", "runtime": "not_run_by_runner"},
        })
        write_json(run / "run.json", result)
        status = "ok" if result["returncode"] == 0 and result["output_exists"] else "failed"
        print(f"[{status}] {dispatch['description']} {result['duration_ms'] / 1000:.0f}s", flush=True)
        return result


def run_dispatches(dispatches, max_workers=3, codex_bin="codex", resume=False):
    if max_workers < 1:
        raise ValueError("max-workers must be positive")
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
        pending = {pool.submit(run_dispatch, d, codex_bin, resume): d for d in dispatches}
        started = time.monotonic()
        while pending:
            done, _ = concurrent.futures.wait(pending, timeout=30, return_when=concurrent.futures.FIRST_COMPLETED)
            for future in done:
                pending.pop(future)
                results.append(future.result())
            print(f"[progress] {len(results)}/{len(dispatches)} completed; {len(pending)} running/queued; {time.monotonic() - started:.0f}s", flush=True)
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evals", nargs="*", type=int)
    parser.add_argument("--groups", nargs="*")
    parser.add_argument("--model", required=True)
    parser.add_argument("--reasoning-effort", required=True)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--max-workers", "--jobs", type=int, default=3)
    parser.add_argument("--samples", type=int, default=1)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--codex-bin", default="codex")
    args = parser.parse_args()
    dispatches = build_prompts(args.evals, args.groups, args.model, args.reasoning_effort, args.samples)
    if not args.execute:
        print(json.dumps(dispatches, ensure_ascii=False, indent=2))
        return
    results = run_dispatches(dispatches, args.max_workers, args.codex_bin, args.resume)
    if any(r["returncode"] != 0 or not r["output_exists"] for r in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
