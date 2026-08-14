#!/usr/bin/env python3
import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

from benchmark_assertions import apply_deterministic_checks

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parents[3]
SKILL_PATH = PROJECT_ROOT / ".agents/skills/mpx2web/SKILL.md"
GROUPS = ("no_skill", "has_skill")
TRANSIENT_MARKERS = (
    "stream disconnected",
    "reconnecting...",
    "connection reset",
    "connection closed",
    "timed out",
    "temporarily unavailable",
)


def load_evals(selected):
    evals = json.loads((ROOT / "evals.json").read_text())["evals"]
    if not selected:
        return evals
    wanted = set(selected)
    result = [item for item in evals if str(item["id"]) in wanted or f"eval-{item['id']}-{item['name']}" in wanted]
    missing = wanted - {str(item["id"]) for item in result} - {f"eval-{item['id']}-{item['name']}" for item in result}
    if missing:
        raise SystemExit(f"未知 eval: {', '.join(sorted(missing))}")
    return result


def eval_dir(item):
    return ROOT / f"eval-{item['id']}-{item['name']}"


def configuration_digest(item, group):
    digest = hashlib.sha256(item["fixture_digest"].encode())
    if group == "has_skill":
        for path in sorted(SKILL_PATH.parent.rglob("*")):
            if path.is_file() and "workspace" not in path.parts:
                digest.update(str(path.relative_to(SKILL_PATH.parent)).encode())
                digest.update(path.read_bytes())
    return digest.hexdigest()


def valid_grading(item, path):
    try:
        expectations = json.loads(path.read_text())["expectations"]
    except (OSError, KeyError, json.JSONDecodeError):
        return False
    return [
        (entry.get("id"), entry.get("text")) for entry in expectations
    ] == [
        (entry["id"], entry["text"]) for entry in item["assertions"]
    ]


def complete(item, group):
    root = eval_dir(item) / group
    files_complete = (
        all((root / "outputs" / path).is_file() for path in item["outputs"])
        and valid_grading(item, root / "grading.json")
        and (root / "timing.json").is_file()
    )
    status_path = root / "run-status.json"
    if not files_complete or not status_path.is_file():
        return files_complete
    try:
        status = json.loads(status_path.read_text())
    except json.JSONDecodeError:
        return False
    return status.get("status") == "completed" and status.get("configuration_digest") == configuration_digest(item, group)


def archive_existing(root):
    archive_parent = root.parent / "previous-runs"
    archive_parent.mkdir(exist_ok=True)
    suffix = time.strftime("%Y%m%d-%H%M%S")
    target = archive_parent / f"{root.name}-{suffix}"
    index = 2
    while target.exists():
        target = archive_parent / f"{root.name}-{suffix}-{index}"
        index += 1
    shutil.move(str(root), str(target))
    print(f"[archive] {root.relative_to(ROOT)} -> {target.relative_to(ROOT)}", flush=True)


def write_status(item, group, status, stage, attempts):
    root = eval_dir(item) / group
    payload = {
        "status": status,
        "stage": stage,
        "attempts": attempts,
        "fixture_digest": item["fixture_digest"],
        "configuration_digest": configuration_digest(item, group),
    }
    (root / "run-status.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def retryable(code, output):
    lowered = output.lower()
    return code == 124 or any(marker in lowered for marker in TRANSIENT_MARKERS)


def preserve_partial_outputs(root, attempt):
    outputs = root / "outputs"
    if outputs.exists() and any(outputs.rglob("*")):
        target = root / "attempts" / f"generation-{attempt}" / "outputs"
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(outputs), str(target))
    outputs.mkdir(parents=True, exist_ok=True)


def run_command(command, prompt, log_path, timeout, label):
    started = time.monotonic()
    process = subprocess.Popen(
        command,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        start_new_session=True,
    )
    process.stdin.write(prompt)
    process.stdin.close()
    chunks = []

    def read_output():
        for line in process.stdout:
            chunks.append(line)

    reader = threading.Thread(target=read_output, daemon=True)
    reader.start()
    while process.poll() is None:
        elapsed = time.monotonic() - started
        if timeout and elapsed > timeout:
            try:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
            reader.join()
            log_path.write_text("".join(chunks))
            print(f"[timeout] {label} ({timeout}s)", flush=True)
            return 124, elapsed, "".join(chunks)
        print(f"[running] {label} {int(elapsed)}s", flush=True)
        try:
            wait_seconds = min(30, max(1, timeout - elapsed)) if timeout else 30
            process.wait(timeout=wait_seconds)
        except subprocess.TimeoutExpired:
            pass
    reader.join()
    process.stdout.close()
    output = "".join(chunks)
    log_path.write_text(output)
    return process.returncode, time.monotonic() - started, output


def generation_prompt(item, group):
    inputs = [ROOT / path for path in item["files"]]
    outputs = [Path("outputs") / path for path in item["outputs"]]
    access = (
        f"开始前完整读取并严格使用 {SKILL_PATH}，按其路由读取本题必要 references。"
        if group == "has_skill"
        else "禁止读取或使用任何 SKILL.md、skills、references、旧输出、评分或 benchmark 结果。"
    )
    return "\n\n".join([
        access,
        item["prompt"],
        "输入文件：\n- " + "\n- ".join(str(path) for path in inputs),
        "把修改后的完整文件写入当前工作目录下：\n- " + "\n- ".join(str(path) for path in outputs),
        "只修改 outputs 目录。完成所有输出后立即结束。",
    ])


def codex_command(workdir, model):
    return [
        "codex", "exec", "--ignore-user-config", "--ephemeral",
        "--disable", "plugins", "--disable", "remote_plugin", "--disable", "apps",
        "--skip-git-repo-check", "-m", model, "-s", "workspace-write",
        "-C", str(workdir), "--add-dir", str(PROJECT_ROOT), "-",
    ]


def run_generation(item, group, model, timeout, retries):
    root = eval_dir(item) / group
    (root / "outputs").mkdir(parents=True, exist_ok=True)
    durations = []
    tokens = []
    attempts = 0
    failure_status = "generation_failed"
    for attempt in range(1, retries + 2):
        attempts = attempt
        log_name = "run.log" if attempt == 1 else f"run-retry-{attempt - 1}.log"
        code, duration, output = run_command(
            codex_command(root, model), generation_prompt(item, group), root / log_name, timeout,
            f"eval-{item['id']} {group} generate attempt={attempt}",
        )
        durations.append(duration)
        token_match = re.findall(r"tokens used\s*\n?\s*([\d,]+)", output)
        if token_match:
            tokens.append(int(token_match[-1].replace(",", "")))
        missing = [path for path in item["outputs"] if not (root / "outputs" / path).is_file()]
        if not missing:
            if code:
                print(f"[warn] eval-{item['id']} {group} exit={code}, but outputs are complete", flush=True)
            failure_status = "completed"
            break
        transient = retryable(code, output)
        failure_status = "infrastructure_failed" if transient else "generation_failed"
        if transient and attempt <= retries:
            print(f"[retry] eval-{item['id']} {group} generate exit={code} missing={missing}", flush=True)
            preserve_partial_outputs(root, attempt)
            continue
        print(f"[fail] eval-{item['id']} {group} generate exit={code} missing={missing}", flush=True)
        break
    timing = {
        "total_tokens": sum(tokens) if tokens else None,
        "duration_ms": round(sum(durations) * 1000),
        "total_duration_seconds": round(sum(durations), 3),
        "generation_attempts": attempts,
    }
    (root / "timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=2) + "\n")
    if failure_status != "completed":
        write_status(item, group, failure_status, "generation", attempts)
        return False, attempts
    print(f"[ok] eval-{item['id']} {group} outputs", flush=True)
    return True, attempts


def grading_prompt(item):
    assertions = json.dumps(item["assertions"], ensure_ascii=False, indent=2)
    return f"""你是独立代码评分器。只读取 outputs 下的候选文件，逐条判断下列断言是否满足。不要修改任何文件，也不要读取 Skill、其他组输出或 benchmark 历史。

断言：
{assertions}

每个通过项的 evidence 必须引用 outputs 下的具体文件路径，并摘录或定位能够证明结论的代码。断言含多个分句时，逐项给出证据；任一分句缺证据则整体判 false。required_patterns 与 forbidden_patterns 是硬约束：缺少任一 required_patterns 或命中任一 forbidden_patterns 时必须判 false，无论其它部分是否满足。不要根据常识推测，也不要只复述断言。

最终只输出一个合法 JSON 对象，不要 Markdown：
{{"expectations":[{{"id":"断言 id","text":"原断言文本","passed":true或false,"evidence":"候选代码中的简洁证据"}}]}}
每条断言必须恰好出现一次；没有充分证据时判 false。
"""


def apply_static_checks(item, expectations, root):
    contents = []
    for path in item["outputs"]:
        output_path = root / "outputs" / path
        if output_path.is_file():
            contents.append(output_path.read_text())
    content = "\n".join(contents)
    output_label = f"outputs/{item['outputs'][0]}"
    for assertion, expectation in zip(item["assertions"], expectations):
        failures = []
        for rule in assertion.get("required_patterns", []):
            if not re.search(rule["pattern"], content, re.S):
                failures.append(f"缺少{rule['description']}")
        for rule in assertion.get("forbidden_patterns", []):
            if re.search(rule["pattern"], content, re.S):
                failures.append(f"发现{rule['description']}")
        if failures:
            expectation["passed"] = False
            expectation["evidence"] = f"{output_label}：静态硬约束未通过：{'；'.join(failures)}。"
    return apply_deterministic_checks(item, expectations, root)


def parse_grading_response(item, result_path):
    raw = result_path.read_text().strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.I)
    expectations = json.loads(raw)["expectations"]
    expected = [(entry["id"], entry["text"]) for entry in item["assertions"]]
    if [(entry.get("id"), entry.get("text")) for entry in expectations] != expected:
        raise ValueError("评分断言 id/text/order 不匹配")
    for entry in expectations:
        if not isinstance(entry.get("passed"), bool):
            raise ValueError("passed 必须为 bool")
        evidence = entry.get("evidence")
        if not isinstance(evidence, str) or not evidence.strip():
            raise ValueError(f"{entry['id']} 缺少 evidence")
        if entry["passed"] and not any(path in evidence for path in item["outputs"]):
            raise ValueError(f"{entry['id']} 的通过证据未引用输出文件")
    return expectations


def run_grading(item, group, model, timeout, retries):
    root = eval_dir(item) / group
    result_path = root / "grading-response.json"
    command = codex_command(root, model)
    command[command.index("-")] = "-o"
    command.insert(command.index("-o") + 1, str(result_path))
    command.append("-")
    attempts = 0
    expectations = None
    for attempt in range(1, retries + 2):
        attempts = attempt
        result_path.unlink(missing_ok=True)
        log_name = "grading.log" if attempt == 1 else f"grading-retry-{attempt - 1}.log"
        code, _, output = run_command(
            command, grading_prompt(item), root / log_name, timeout,
            f"eval-{item['id']} {group} grade attempt={attempt}",
        )
        try:
            expectations = apply_static_checks(item, parse_grading_response(item, result_path), root)
        except Exception as error:
            if attempt <= retries:
                print(f"[retry] eval-{item['id']} {group} grade: {error}", flush=True)
                continue
            status = "infrastructure_failed" if retryable(code, output) else "grading_failed"
            write_status(item, group, status, "grading", attempts)
            print(f"[grade-fail] eval-{item['id']} {group}: {error}", flush=True)
            return False, attempts
        if code:
            print(f"[warn] eval-{item['id']} {group} grader exit={code}, but response is valid", flush=True)
        break
    result = {
        "eval_id": item["id"],
        "eval_name": item["name"],
        "configuration": group,
        "expectations": expectations,
        "summary": {
            "passed": sum(entry["passed"] for entry in expectations),
            "failed": sum(not entry["passed"] for entry in expectations),
            "total": len(expectations),
            "pass_rate": round(sum(entry["passed"] for entry in expectations) / len(expectations), 4),
        },
    }
    (root / "grading.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    result_path.unlink(missing_ok=True)
    print(f"[ok] eval-{item['id']} {group} grade {result['summary']['passed']}/{result['summary']['total']}", flush=True)
    return True, attempts


def aggregate(evals, groups):
    results = []
    runs = []
    for item in evals:
        for group in groups:
            root = eval_dir(item) / group
            status_path = root / "run-status.json"
            status = json.loads(status_path.read_text()) if status_path.is_file() else {}
            is_complete = complete(item, group)
            run = {
                "eval_id": item["id"],
                "eval_name": item["name"],
                "configuration": group,
                "status": status.get("status", "completed_legacy" if is_complete else "not_run"),
                "stage": status.get("stage"),
                "attempts": status.get("attempts"),
            }
            runs.append(run)
            path = root / "grading.json"
            if not is_complete:
                continue
            grade = json.loads(path.read_text())
            timing_path = root / "timing.json"
            timing = json.loads(timing_path.read_text()) if timing_path.is_file() else {}
            summary = grade["summary"]
            results.append({
                "eval_id": item["id"], "eval_name": item["name"], "configuration": group,
                "passed": summary["passed"], "total": summary["total"],
                "pass_rate": round(summary["passed"] / summary["total"], 4) if summary["total"] else 0,
                **timing,
            })
    totals = {}
    for group in groups:
        rows = [row for row in results if row["configuration"] == group]
        group_runs = [run for run in runs if run["configuration"] == group]
        passed = sum(row["passed"] for row in rows)
        total = sum(row["total"] for row in rows)
        totals[group] = {
            "passed": passed,
            "total": total,
            "pass_rate": round(passed / total, 4) if total else 0,
            "completed_runs": sum(run["status"] in ("completed", "completed_legacy") for run in group_runs),
            "infrastructure_failures": sum(run["status"] == "infrastructure_failed" for run in group_runs),
            "task_failures": sum(run["status"] in ("generation_failed", "grading_failed") for run in group_runs),
        }
    payload = {"skill_name": "mpx2web", "iteration": 8, "runs": runs, "results": results, "totals": totals}
    result_path = ROOT / "benchmark-results.json"
    if result_path.exists():
        archive_parent = ROOT / "previous-results"
        archive_parent.mkdir(exist_ok=True)
        suffix = time.strftime("%Y%m%d-%H%M%S")
        target = archive_parent / f"benchmark-results-{suffix}.json"
        index = 2
        while target.exists():
            target = archive_parent / f"benchmark-results-{suffix}-{index}.json"
            index += 1
        shutil.copy2(result_path, target)
    result_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"[done] {ROOT / 'benchmark-results.json'}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="运行并评分 Mpx2Web iteration-8 benchmark。")
    parser.add_argument("--evals", nargs="*", help="eval id（0）或完整目录名；默认全部")
    parser.add_argument("--groups", nargs="+", choices=GROUPS, default=list(GROUPS))
    parser.add_argument("--model", default="gpt-5.6-sol")
    parser.add_argument("--grader-model", default="gpt-5.6-terra")
    parser.add_argument("--timeout", type=int, default=0, help="单阶段超时秒数；0 表示不限制，默认 0")
    parser.add_argument("--retries", type=int, default=2, help="瞬时失败与评分格式错误的重试次数，默认 2")
    parser.add_argument("--jobs", type=int, default=2, help="常规 eval 并行任务数；复杂 eval 固定串行，默认 2")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--grade-only", action="store_true", help="保留已有 outputs，只重新评分")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.timeout < 0 or args.retries < 0 or args.jobs < 1:
        parser.error("timeout/retries 不能为负数，jobs 必须至少为 1")
    evals = load_evals(args.evals)

    if args.dry_run:
        for item in evals:
            for group in args.groups:
                print(f"eval-{item['id']}-{item['name']} {group} -> {eval_dir(item) / group}")
        return

    pending = []
    for item in evals:
        for group in args.groups:
            root = eval_dir(item) / group
            if args.resume and not args.grade_only and complete(item, group):
                print(f"[skip] eval-{item['id']} {group}", flush=True)
                continue
            if root.exists() and not args.grade_only:
                archive_existing(root)
            pending.append((item, group))

    def run_one(item, group):
        if args.grade_only:
            root = eval_dir(item) / group
            missing = [path for path in item["outputs"] if not (root / "outputs" / path).is_file()]
            if missing:
                print(f"[fail] eval-{item['id']} {group} missing outputs={missing}", flush=True)
                return False
            graded, grading_attempts = run_grading(item, group, args.grader_model, args.timeout, args.retries)
            if graded:
                write_status(item, group, "completed", "completed", {"generation": 0, "grading": grading_attempts})
            return graded
        generated, generation_attempts = run_generation(item, group, args.model, args.timeout, args.retries)
        if not generated:
            return False
        graded, grading_attempts = run_grading(item, group, args.grader_model, args.timeout, args.retries)
        if graded:
            write_status(item, group, "completed", "completed", {
                "generation": generation_attempts,
                "grading": grading_attempts,
            })
        return graded

    def run_batch(batch, jobs):
        batch_success = True
        with concurrent.futures.ThreadPoolExecutor(max_workers=jobs) as executor:
            futures = [executor.submit(run_one, item, group) for item, group in batch]
            for future in concurrent.futures.as_completed(futures):
                try:
                    batch_success = future.result() and batch_success
                except Exception as error:
                    print(f"[fail] {error}", flush=True)
                    batch_success = False
        return batch_success

    normal = [(item, group) for item, group in pending if item["complexity"] == "normal"]
    complex_cases = [(item, group) for item, group in pending if item["complexity"] == "complex"]
    success = run_batch(normal, args.jobs)
    success = run_batch(complex_cases, 1) and success
    aggregate(load_evals(None), GROUPS)
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
