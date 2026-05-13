import json
from pathlib import Path

ITER = Path("/Users/didi/work/mpx2/.agents/skills/mpx2rn-workspace/iteration-2")

EVAL_DIRS = {
    0: "eval-0-adapt-list-page",
    1: "eval-1-create-card-component",
    2: "eval-2-adapt-style-block",
}

runs = []
for eid, edir in EVAL_DIRS.items():
    for kind in ("with_skill", "without_skill"):
        grading_path = ITER / edir / kind / "run-1" / "grading.json"
        timing_path = ITER / edir / kind / "timing.json"
        
        grading = json.loads(grading_path.read_text()) if grading_path.exists() else None
        timing = json.loads(timing_path.read_text()) if timing_path.exists() else None
        
        if grading and timing:
            runs.append({
                "eval_id": eid,
                "configuration": kind,
                "run_number": 1,
                "result": {
                    "pass_rate": grading["summary"]["pass_rate"],
                    "passed": grading["summary"]["passed"],
                    "failed": grading["summary"]["failed"],
                    "total": grading["summary"]["total"],
                    "time_seconds": timing["total_duration_seconds"],
                    "tokens": timing["total_tokens"],
                    "tool_calls": 0,
                    "errors": 0,
                },
                "expectations": grading["expectations"],
                "notes": [],
            })

benchmark = {
    "metadata": {
        "skill_name": "mpx2rn",
        "skill_path": "/Users/didi/work/mpx2/.agents/skills/mpx2rn",
        "executor_model": "claude-opus-4-20250514",
        "analyzer_model": "claude-opus-4-20250514",
        "timestamp": "2026-05-11T12:00:00Z",
        "evals_run": [0, 1, 2],
        "runs_per_configuration": 1,
    },
    "runs": runs,
}

out = ITER / "benchmark.json"
out.write_text(json.dumps(benchmark, ensure_ascii=False, indent=2))
print(f"Wrote {out}")

# Summary
print("\n=== BENCHMARK SUMMARY ===")
for kind in ("with_skill", "without_skill"):
    kind_runs = [r for r in runs if r["configuration"] == kind]
    total_passed = sum(r["result"]["passed"] for r in kind_runs)
    total_all = sum(r["result"]["total"] for r in kind_runs)
    avg_time = sum(r["result"]["time_seconds"] for r in kind_runs) / len(kind_runs)
    avg_tokens = sum(r["result"]["tokens"] for r in kind_runs) / len(kind_runs)
    print(f"{kind}: {total_passed}/{total_all} ({total_passed/total_all*100:.1f}%) | avg time: {avg_time:.1f}s | avg tokens: {avg_tokens:.0f}")
