#!/usr/bin/env python3
"""Generate or execute self-contained Mpx2Web iteration-11 eval prompts."""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

WORKSPACE = Path(__file__).parent
PROJECT_ROOT = WORKSPACE.parents[3]
EVAL_WORKDIR = WORKSPACE.parent.resolve()
SKILL = PROJECT_ROOT / ".agents/skills/mpx2web/SKILL.md"
COMPILE_SCRIPT = SKILL.parent / "scripts/compile-validate.js"
CONDITIONAL_VALIDATE_SCRIPT = (
    SKILL.parent / "scripts/validate-conditional-compile.js"
)
PROMPT_TEMPLATES = WORKSPACE / "prompt_templates.json"
PUBLIC_GROUPS = ("mpx2web", "no_skill")
STALE_REPORTS = ("benchmark.json", "benchmark.md", "review.html")


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def file_digest(paths):
    digest = hashlib.sha256()
    for path in paths:
        digest.update(Path(path).read_bytes())
    return digest.hexdigest()


def tree_digest(root):
    root = Path(root)
    digest = hashlib.sha256()
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        relative = path.relative_to(root).as_posix()
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate_contract(evals_config=None, templates=None):
    evals_config, templates = (
        (evals_config, templates)
        if evals_config is not None and templates is not None
        else load_configs(validate=False)
    )
    errors = []
    seen_eval_ids = set()
    seen_eval_names = set()
    seen_assertion_ids = set()
    for item in evals_config.get("evals", []):
        eval_id = item.get("id")
        eval_name = item.get("name")
        eval_dir = WORKSPACE / f"eval-{eval_id}-{eval_name}"
        if eval_id in seen_eval_ids:
            errors.append(f"重复 eval id: {eval_id}")
        if eval_name in seen_eval_names:
            errors.append(f"重复 eval name: {eval_name}")
        seen_eval_ids.add(eval_id)
        seen_eval_names.add(eval_name)

        metadata_path = eval_dir / "eval_metadata.json"
        if not metadata_path.is_file():
            errors.append(f"缺少 {metadata_path}")
            continue
        metadata = json.loads(metadata_path.read_text())
        scalar_pairs = {
            "eval_id": eval_id,
            "eval_name": eval_name,
            "prompt": item.get("prompt"),
            "complexity": item.get("complexity"),
            "focus": item.get("focus"),
        }
        for key, expected in scalar_pairs.items():
            if metadata.get(key) != expected:
                errors.append(f"{metadata_path}: {key} 与 evals.json 不一致")
        expected_files = [
            str((WORKSPACE / path).relative_to(eval_dir))
            for path in item.get("files", [])
        ]
        if metadata.get("files") != expected_files:
            errors.append(f"{metadata_path}: files 与 evals.json 不一致")
        for key in ("outputs", "assertions"):
            if metadata.get(key) != item.get(key):
                errors.append(f"{metadata_path}: {key} 与 evals.json 不一致")

        input_paths = [WORKSPACE / path for path in item.get("files", [])]
        missing_inputs = [str(path) for path in input_paths if not path.is_file()]
        if missing_inputs:
            errors.append(f"eval-{eval_id} 缺少输入: {', '.join(missing_inputs)}")
        elif file_digest(input_paths) != item.get("fixture_digest"):
            errors.append(
                f"eval-{eval_id} fixture_digest 已过期；"
                f"当前为 {file_digest(input_paths)}"
            )
        for relative in item.get("outputs", []):
            path = Path(relative)
            if path.is_absolute() or ".." in path.parts:
                errors.append(f"eval-{eval_id} 非法输出路径: {relative}")
        for assertion in item.get("assertions", []):
            assertion_id = assertion.get("id")
            if assertion_id in seen_assertion_ids:
                errors.append(f"重复 assertion id: {assertion_id}")
            seen_assertion_ids.add(assertion_id)

    if errors:
        raise ValueError("评测契约校验失败：\n- " + "\n- ".join(errors))
    return True


def load_configs(validate=True):
    configs = (
        json.loads((WORKSPACE / "evals.json").read_text()),
        json.loads(PROMPT_TEMPLATES.read_text()),
    )
    if validate:
        validate_contract(*configs)
    return configs


def group_instruction(group, templates):
    template = templates["templates"][group]
    return template["instruction"].replace(
        "{{MPX2WEB_SKILL_PATH}}", str(SKILL)
    )


def group_skill_digest(group):
    if group == "mpx2web":
        return tree_digest(SKILL.parent)
    return sha256_bytes(b"no-skill")


def build_prompts(
    eval_ids=None,
    groups=None,
    model=None,
    reasoning_effort=None,
    run_number=1,
):
    if not model or not reasoning_effort:
        raise ValueError(
            "model and reasoning_effort must be explicitly set to the parent session values"
        )
    if run_number < 1:
        raise ValueError("run_number must be at least 1")
    evals_config, templates = load_configs()
    groups = list(groups or PUBLIC_GROUPS)
    unknown_groups = sorted(set(groups) - set(PUBLIC_GROUPS))
    if unknown_groups:
        raise ValueError(f"unknown groups: {', '.join(unknown_groups)}")

    dispatches = []
    for item in evals_config["evals"]:
        if eval_ids is not None and item["id"] not in eval_ids:
            continue
        eval_name = f"eval-{item['id']}-{item['name']}"
        input_paths = [WORKSPACE / path for path in item["files"]]
        input_relative_paths = [
            Path(path).relative_to(WORKSPACE / eval_name / "input").as_posix()
            for path in input_paths
        ]
        for group in groups:
            run_dir = WORKSPACE / eval_name / group / f"run-{run_number}"
            output_root = run_dir / "outputs"
            output_paths = [output_root / path for path in item["outputs"]]
            published_output_root = WORKSPACE / eval_name / group / "outputs"
            published_output_paths = [
                published_output_root / path for path in item["outputs"]
            ]
            isolation = (
                "只读取上述输入、本组指定的 Skill/reference；"
                "不要读取 iteration-11 的其他组输出、评分、"
                "benchmark 或 review.html。"
            )
            prompt = "\n\n".join((
                group_instruction(group, templates),
                f"任务：{item['prompt']}",
                f"固定工作目录：{EVAL_WORKDIR}",
                "输入文件：\n- " + "\n- ".join(map(str, input_paths)),
                "输出文件：\n- " + "\n- ".join(map(str, output_paths)),
                isolation,
                "仅写入声明的输出文件，且每个文件都必须是完整内容。",
            ))
            skill_digest = group_skill_digest(group)
            fingerprint = hashlib.sha256(json.dumps({
                "prompt": prompt,
                "model": model,
                "reasoning_effort": reasoning_effort,
                "fixture_digest": item["fixture_digest"],
                "skill_digest": skill_digest,
                "output_paths": [str(path) for path in output_paths],
            }, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
            dispatches.append({
                "description": f"Eval-{item['id']} {group} run-{run_number}",
                "eval_id": item["id"],
                "eval_name": item["name"],
                "group": group,
                "run_number": run_number,
                "model": model,
                "reasoning_effort": reasoning_effort,
                "fork_turns": "none",
                "fingerprint": fingerprint,
                "fixture_digest": item["fixture_digest"],
                "skill_digest": skill_digest,
                "workdir": str(EVAL_WORKDIR),
                "prompt": prompt,
                "input_paths": [str(path) for path in input_paths],
                "input_relative_paths": input_relative_paths,
                "output_root": str(output_root),
                "output_paths": [str(path) for path in output_paths],
                "output_relative_paths": list(item["outputs"]),
                "published_output_root": str(published_output_root),
                "published_output_paths": [
                    str(path) for path in published_output_paths
                ],
                "metrics_path": str(run_dir / "metrics.json"),
            })
    return dispatches


def build_dispatches(eval_ids, groups, model, reasoning_effort, run_number=1):
    """Compatibility alias retained for earlier iteration-11 callers."""
    return build_prompts(
        eval_ids=eval_ids,
        groups=groups,
        model=model,
        reasoning_effort=reasoning_effort,
        run_number=run_number,
    )


def build_codex_command(dispatch, codex_bin="codex", workdir=None):
    workdir = Path(workdir or EVAL_WORKDIR).resolve()
    return [
        codex_bin,
        "exec",
        "--ignore-user-config",
        "--ephemeral",
        "--disable",
        "plugins",
        "--disable",
        "remote_plugin",
        "--disable",
        "apps",
        "--skip-git-repo-check",
        "-C",
        str(workdir),
        "-s",
        "workspace-write",
        "-m",
        dispatch["model"],
        "-c",
        f'model_reasoning_effort="{dispatch["reasoning_effort"]}"',
        "--color",
        "never",
        "--json",
        "-",
    ]


def extract_metrics(stdout, duration_ms):
    input_tokens = 0
    output_tokens = 0
    tool_calls = 0
    for line in stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        usage = event.get("usage", {})
        if usage:
            input_tokens = max(input_tokens, usage.get("input_tokens", 0))
            output_tokens = max(output_tokens, usage.get("output_tokens", 0))
        item = event.get("item", {})
        if event.get("type") == "item.completed" and item.get("type") in {
            "command_execution",
            "file_change",
            "mcp_tool_call",
            "web_search",
        }:
            tool_calls += 1
    return {
        "total_tokens": input_tokens + output_tokens,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "tool_calls": tool_calls,
        "duration_ms": duration_ms,
    }


def write_metrics(metrics_path, metrics):
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n")
    (metrics_path.parent / "timing.json").write_text(
        json.dumps({
            "total_tokens": metrics["total_tokens"],
            "duration_ms": metrics["duration_ms"],
            "total_duration_seconds": round(metrics["duration_ms"] / 1000, 3),
        }, indent=2) + "\n"
    )


def staged_prompt(dispatch, workdir, staged_inputs, staged_outputs):
    prompt = dispatch["prompt"]
    for source, staged in zip(dispatch["input_paths"], staged_inputs):
        prompt = prompt.replace(source, str(staged))
    for target, staged in zip(dispatch["output_paths"], staged_outputs):
        prompt = prompt.replace(target, str(staged))
    prompt = prompt.replace(
        f"固定工作目录：{EVAL_WORKDIR}", f"固定工作目录：{workdir}"
    )
    return prompt


def compile_entry_type(relative):
    path = Path(relative)
    if path.name == "app.mpx":
        return None
    if "pages" in path.parts:
        return "page"
    return "component"


def run_compile_gate(dispatch):
    output_paths = [Path(path) for path in dispatch["output_paths"]]
    relative_paths = dispatch["output_relative_paths"]
    checks = []
    success = True
    conditional_command = [
        "node",
        str(CONDITIONAL_VALIDATE_SCRIPT),
        "--json",
        *(str(path) for path in output_paths),
    ]
    conditional_result = subprocess.run(
        conditional_command,
        cwd=EVAL_WORKDIR,
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        conditional_detail = (
            json.loads(conditional_result.stdout)
            if conditional_result.stdout.strip()
            else {}
        )
    except json.JSONDecodeError:
        conditional_detail = {"raw_stdout": conditional_result.stdout[-8000:]}
    conditional_passed = (
        conditional_result.returncode == 0
        and conditional_detail.get("success") is True
    )
    success = success and conditional_passed
    checks.append({
        "kind": "mpx-conditional-compile-semantics",
        "files": [str(path) for path in output_paths],
        "passed": conditional_passed,
        "returncode": conditional_result.returncode,
        "detail": conditional_detail,
        "stderr": conditional_result.stderr[-8000:],
    })

    for entry_type in ("page", "component"):
        entries = [
            path for path, relative in zip(output_paths, relative_paths)
            if Path(relative).suffix == ".mpx"
            and compile_entry_type(relative) == entry_type
        ]
        if not entries:
            continue
        command = [
            "node",
            str(COMPILE_SCRIPT),
            *(str(path) for path in entries),
            "--target=web",
            f"--type={entry_type}",
            f"--project-root={EVAL_WORKDIR}",
            "--json",
        ]
        result = subprocess.run(
            command,
            cwd=EVAL_WORKDIR,
            capture_output=True,
            text=True,
            check=False,
        )
        try:
            detail = json.loads(result.stdout) if result.stdout.strip() else {}
        except json.JSONDecodeError:
            detail = {"raw_stdout": result.stdout[-8000:]}
        passed = result.returncode == 0 and detail.get("success") is True
        success = success and passed
        checks.append({
            "kind": "mpx-web-compile",
            "type": entry_type,
            "files": [str(path) for path in entries],
            "passed": passed,
            "returncode": result.returncode,
            "detail": detail,
            "stderr": result.stderr[-8000:],
        })

    for path, relative in zip(output_paths, relative_paths):
        suffix = path.suffix.lower()
        if suffix == ".js":
            result = subprocess.run(
                ["node", "--check", str(path)],
                cwd=EVAL_WORKDIR,
                capture_output=True,
                text=True,
                check=False,
            )
            passed = result.returncode == 0
            success = success and passed
            checks.append({
                "kind": "javascript-syntax",
                "files": [str(path)],
                "passed": passed,
                "returncode": result.returncode,
                "stderr": result.stderr[-8000:],
            })
        elif suffix != ".mpx" or compile_entry_type(relative) is None:
            passed = path.is_file() and path.stat().st_size > 0
            success = success and passed
            checks.append({
                "kind": "declared-support-artifact",
                "files": [str(path)],
                "passed": passed,
                "note": (
                    "该文件不是 compile-validate 支持的 page/component 入口；"
                    "记录完整性门禁，不把它伪报为独立 Mpx 编译。"
                ),
            })

    eligible = [
        relative for relative in relative_paths
        if Path(relative).suffix == ".mpx" and compile_entry_type(relative)
    ]
    compiled = [
        file for check in checks if check["kind"] == "mpx-web-compile"
        and check["passed"] for file in check["files"]
    ]
    payload = {
        "status": "passed" if success else "failed",
        "all_declared_outputs_present": all(path.is_file() for path in output_paths),
        "declared_output_count": len(output_paths),
        "compile_eligible_mpx_count": len(eligible),
        "compiled_mpx_count": len(compiled),
        "checks": checks,
        "boundary": (
            "所有声明输出先检查条件编译语义；"
            "所有可作为 page/component 入口的 .mpx 均执行真实 Web 编译；"
            "app.mpx、HTML 和独立配置仅做完整性门禁，JS 另做语法检查。"
        ),
    }
    run_dir = Path(dispatch["metrics_path"]).parent
    (run_dir / "compile.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    )
    return payload


def run_dispatch(dispatch, codex_bin="codex"):
    workdir = Path(dispatch["workdir"]).resolve()
    if workdir != EVAL_WORKDIR:
        raise ValueError(f"dispatch workdir must be {EVAL_WORKDIR}, got {workdir}")
    output_paths = [Path(path).resolve() for path in dispatch["output_paths"]]
    published_output_paths = [
        Path(path).resolve() for path in dispatch.get("published_output_paths", [])
    ]
    for output_path in output_paths + published_output_paths:
        try:
            output_path.relative_to(EVAL_WORKDIR)
        except ValueError as error:
            raise ValueError(
                f"output path must stay under {EVAL_WORKDIR}"
            ) from error

    run_dir = Path(dispatch["metrics_path"]).parent
    run_dir.mkdir(parents=True, exist_ok=True)
    for path in output_paths + published_output_paths:
        if path.is_file():
            path.unlink()
    for stale in ("grading.json", "compile.json"):
        stale_path = run_dir / stale
        if stale_path.is_file():
            stale_path.unlink()

    print(f"[running] {dispatch['description']}", flush=True)
    started = time.monotonic()
    with tempfile.TemporaryDirectory(prefix="mpx2web-eval-") as directory:
        isolated_root = Path(directory).resolve()
        staged_inputs = [
            isolated_root / "input" / relative
            for relative in dispatch["input_relative_paths"]
        ]
        staged_outputs = [
            isolated_root / "outputs" / relative
            for relative in dispatch["output_relative_paths"]
        ]
        for source, target in zip(dispatch["input_paths"], staged_inputs):
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        for target in staged_outputs:
            target.parent.mkdir(parents=True, exist_ok=True)
        command = build_codex_command(
            dispatch, codex_bin=codex_bin, workdir=isolated_root
        )
        result = subprocess.run(
            command,
            cwd=isolated_root,
            input=staged_prompt(
                dispatch,
                isolated_root,
                staged_inputs,
                staged_outputs,
            ),
            capture_output=True,
            text=True,
            check=False,
        )
        staged_complete = all(path.is_file() for path in staged_outputs)
        if result.returncode == 0 and staged_complete:
            for source, target in zip(staged_outputs, output_paths):
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
    duration_ms = round((time.monotonic() - started) * 1000)
    (run_dir / "agent.jsonl").write_text(result.stdout)
    (run_dir / "stderr.log").write_text(result.stderr)
    write_metrics(
        Path(dispatch["metrics_path"]),
        extract_metrics(result.stdout, duration_ms),
    )
    outputs_complete = all(path.is_file() for path in output_paths)
    compile_result = (
        run_compile_gate(dispatch)
        if result.returncode == 0 and outputs_complete
        else {"status": "not-run", "all_declared_outputs_present": outputs_complete}
    )
    run_result = {
        "description": dispatch["description"],
        "configuration": dispatch["group"],
        "run_number": dispatch["run_number"],
        "model": dispatch["model"],
        "reasoning_effort": dispatch["reasoning_effort"],
        "cwd": "isolated temporary workspace",
        "command": command[:-1] + ["<prompt-via-stdin>"],
        "returncode": result.returncode,
        "outputs_complete": outputs_complete,
        "compile_status": compile_result["status"],
        "compile_boundary": compile_result.get("boundary"),
        "duration_ms": duration_ms,
        "fingerprint": dispatch["fingerprint"],
        "fixture_digest": dispatch["fixture_digest"],
        "skill_digest": dispatch["skill_digest"],
    }
    if (
        run_result["returncode"] == 0
        and run_result["outputs_complete"]
        and run_result["compile_status"] == "passed"
    ):
        for source, target in zip(output_paths, published_output_paths):
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
    status = "ok" if (
        run_result["returncode"] == 0
        and run_result["outputs_complete"]
        and run_result["compile_status"] == "passed"
    ) else "failed"
    print(
        f"[{status}] {dispatch['description']} {round(duration_ms / 1000)}s",
        flush=True,
    )
    (run_dir / "run.json").write_text(
        json.dumps(run_result, ensure_ascii=False, indent=2) + "\n"
    )
    return run_result


def dispatch_complete(dispatch):
    run_path = Path(dispatch["metrics_path"]).parent / "run.json"
    if not run_path.is_file():
        return False
    try:
        run_result = json.loads(run_path.read_text())
    except (OSError, json.JSONDecodeError):
        return False
    return bool(
        run_result.get("fingerprint") == dispatch["fingerprint"]
        and run_result.get("returncode") == 0
        and run_result.get("outputs_complete") is True
        and run_result.get("compile_status") in {"passed", "failed"}
        and all(Path(path).is_file() for path in dispatch["output_paths"])
    )


def run_dispatches(dispatches, max_workers=3, codex_bin="codex"):
    if not dispatches:
        return []
    with ThreadPoolExecutor(
        max_workers=min(max_workers, len(dispatches))
    ) as executor:
        return list(executor.map(
            lambda dispatch: run_dispatch(dispatch, codex_bin=codex_bin),
            dispatches,
        ))


def invalidate_aggregate_reports():
    for relative in STALE_REPORTS:
        path = WORKSPACE / relative
        if path.is_file():
            path.unlink()


def main():
    parser = argparse.ArgumentParser(
        description="Generate or execute self-contained Mpx2Web eval prompts"
    )
    parser.add_argument("--evals", nargs="*", type=int)
    parser.add_argument("--groups", nargs="*", choices=PUBLIC_GROUPS)
    parser.add_argument("--run-number", type=int, default=1)
    parser.add_argument(
        "--run-numbers",
        nargs="+",
        type=int,
        help="一次执行多个独立采样，例如 --run-numbers 1 2 3",
    )
    parser.add_argument("--model", required=True)
    parser.add_argument("--reasoning-effort", required=True)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument(
        "--resume",
        action="store_true",
        help="只跳过指纹一致且产物完整的成功任务",
    )
    parser.add_argument("--max-workers", type=int, default=3)
    parser.add_argument("--codex-bin", default="codex")
    args = parser.parse_args()
    if args.max_workers < 1:
        parser.error("--max-workers must be at least 1")
    run_numbers = args.run_numbers or [args.run_number]
    if any(number < 1 for number in run_numbers) or len(set(run_numbers)) != len(run_numbers):
        parser.error("run numbers must be unique positive integers")
    dispatches = []
    for number in run_numbers:
        dispatches.extend(build_prompts(
            eval_ids=args.evals,
            groups=args.groups,
            model=args.model,
            reasoning_effort=args.reasoning_effort,
            run_number=number,
        ))
    if not args.execute:
        print(json.dumps(dispatches, ensure_ascii=False, indent=2))
        print(f"\n# Total: {len(dispatches)} agent dispatches", file=sys.stderr)
        return
    if args.resume:
        pending = []
        for dispatch in dispatches:
            if dispatch_complete(dispatch):
                print(f"[skip] {dispatch['description']}", flush=True)
            else:
                pending.append(dispatch)
        dispatches = pending
    if dispatches:
        invalidate_aggregate_reports()
    results = run_dispatches(
        dispatches,
        max_workers=args.max_workers,
        codex_bin=args.codex_bin,
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))
    if any(
        result["returncode"] != 0
        or not result["outputs_complete"]
        for result in results
    ):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
