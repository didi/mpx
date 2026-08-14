#!/usr/bin/env python3
import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parents[3]
SKILL_PATH = PROJECT_ROOT / ".agents/skills/mpx2web/SKILL.md"


def build_prompt(item, group, outputs):
    templates = json.loads((ROOT / "prompt_templates.json").read_text())
    template = templates[group]
    if group == "has_skill":
        template = template.replace(".agents/skills/mpx2web/SKILL.md", str(SKILL_PATH))
    inputs = [ROOT / path for path in item["inputs"]]
    parts = [
        template,
        f"本用例要求：{item['task']}",
        "输入文件：\n- " + "\n- ".join(map(str, inputs)),
        "把完整源文件只写入当前工作目录：\n- " + "\n- ".join(
            str(Path("outputs") / output.name) for output in outputs
        ),
        "完成指定输出后立即结束，不要读取旧 outputs、grading、benchmark-results 或 review。",
    ]
    if group == "has_skill":
        parts.append(f"Skill 绝对路径：{SKILL_PATH}")
    else:
        parts.append(
            "禁止读取或调用任何 SKILL.md、skills 或 references；只允许读取上述输入以及仓库 packages、docs-vitepress。"
        )
    return "\n\n".join(parts)


def run_job(item, group, run_root, model, timeout, resume, dry_run):
    workdir = run_root / item["id"] / group
    outputs = [workdir / "outputs" / name for name in item["outputs"]]
    log_path = workdir / "run.log"
    if resume and all(path.is_file() and path.stat().st_size for path in outputs):
        print(f"[skip] {item['id']} {group}")
        return True
    if dry_run:
        print(f"[dry-run] {item['id']} {group} -> {workdir}")
        return True

    (workdir / "outputs").mkdir(parents=True, exist_ok=True)
    prompt = build_prompt(item, group, outputs)
    command = [
        "codex", "exec", "--ignore-user-config", "--ephemeral",
        "--disable", "plugins", "--disable", "remote_plugin", "--disable", "apps",
        "--skip-git-repo-check", "-m", model, "-s", "workspace-write",
        "-C", str(workdir), "--add-dir", str(PROJECT_ROOT), "-",
    ]
    print(f"[run] {item['id']} {group} (timeout={timeout}s)")
    try:
        completed = subprocess.run(
            command,
            input=prompt,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
        )
        log_path.write_text(completed.stdout)
    except subprocess.TimeoutExpired as error:
        output = error.stdout or ""
        if isinstance(output, bytes):
            output = output.decode(errors="replace")
        log_path.write_text(output)
        print(f"[timeout] {item['id']} {group}，日志：{log_path}")
        return False

    success = completed.returncode == 0 and all(
        path.is_file() and path.stat().st_size for path in outputs
    )
    token_match = re.findall(r"tokens used\s*\n?\s*([\d,]+)", completed.stdout)
    token_text = token_match[-1] if token_match else "unknown"
    print(
        f"[{'ok' if success else 'fail'}] {item['id']} {group} "
        f"exit={completed.returncode} tokens={token_text} log={log_path}"
    )
    return success


def grade(evals, groups, run_root):
    score_root = run_root / "score"
    score_root.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "evals.json", score_root / "evals.json")
    shutil.copy2(ROOT / "grade.py", score_root / "grade.py")
    for item in evals:
        for group in groups:
            source_dir = run_root / item["id"] / group / "outputs"
            target_dir = score_root / item["id"] / group / "outputs"
            target_dir.mkdir(parents=True, exist_ok=True)
            for name in item["outputs"]:
                source = source_dir / name
                if source.is_file():
                    shutil.copy2(source, target_dir / name)

    completed = subprocess.run(
        ["python3", str(score_root / "grade.py"), "--groups", *groups],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    (score_root / "grade.log").write_text(completed.stdout)
    if completed.returncode:
        print(f"[grade-fail] 查看 {score_root / 'grade.log'}")
        return

    results = json.loads((score_root / "benchmark-results.json").read_text())
    print("\n评分结果：")
    for result in results:
        summary = result["summary"]
        print(
            f"{result['eval_id']}\t{result['configuration']}\t"
            f"{summary['passed']}/{summary['total']}"
        )
    print(f"\n完整评分：{score_root / 'benchmark-results.json'}")


def main():
    parser = argparse.ArgumentParser(description="在隔离临时目录中执行并评分 Mpx2Web 全量 benchmark。")
    parser.add_argument("--groups", nargs="+", choices=["no_skill", "has_skill"], default=["no_skill", "has_skill"])
    parser.add_argument("--evals", nargs="*", help="只执行指定 eval id；默认全部。")
    parser.add_argument("--model", default="gpt-5.6-sol")
    parser.add_argument("--timeout", type=int, default=600, help="单个任务超时秒数，默认 600。")
    parser.add_argument("--run-root", type=Path)
    parser.add_argument("--resume", action="store_true", help="跳过输出已完整存在的任务。")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    evals = json.loads((ROOT / "evals.json").read_text())
    if args.evals:
        selected = set(args.evals)
        evals = [item for item in evals if item["id"] in selected]
    run_root = args.run_root or Path(tempfile.mkdtemp(prefix="mpx2web-full-", dir="/tmp"))
    run_root.mkdir(parents=True, exist_ok=True)
    print(f"运行目录：{run_root}")

    all_success = True
    for item in evals:
        for group in args.groups:
            all_success = run_job(
                item, group, run_root, args.model, args.timeout, args.resume, args.dry_run
            ) and all_success
    if args.dry_run:
        return
    grade(evals, args.groups, run_root)
    if not all_success:
        print("\n部分任务失败或超时；可使用同一 --run-root 加 --resume 重试。")


if __name__ == "__main__":
    main()
