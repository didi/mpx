import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

WORKSPACE = Path(__file__).resolve().parent


def load(name):
    spec = importlib.util.spec_from_file_location(name, WORKSPACE / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


GRADE = load("grade")
RUNNER = load("run_evals")


class ConsolidatedCasesTest(unittest.TestCase):
    def test_scores_match_current_benchmark(self):
        benchmark_path = WORKSPACE / "benchmark.json"
        if not benchmark_path.exists():
            self.skipTest("本轮评分基线不存在")
        if not all((WORKSPACE / GRADE.EVAL_DIRS[eid] / group / "outputs" / GRADE.OUTPUT_FILES[eid]).is_file()
                   for eid in GRADE.EVAL_DIRS for group in GRADE.RUN_KINDS):
            self.skipTest("历史模型产物已清理；重新生成产物后可复核历史评分")
        benchmark = json.loads(benchmark_path.read_text())
        for run in benchmark["runs"]:
            eid, group = run["eval_id"], run["configuration"]
            output = WORKSPACE / GRADE.EVAL_DIRS[eid] / group / "outputs" / GRADE.OUTPUT_FILES[eid]
            with self.subTest(eid=eid, group=group):
                actual = {r["id"]: r["passed"] for r in GRADE.check_case(eid, output)}
                expected = {r["id"]: r["passed"] for r in run["expectations"]}
                self.assertEqual(actual, expected)

    def test_entrypoints_work_without_other_iterations(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory) / "repo/.agents/skills/workspaces/mpx2rn-workspace/iteration-18"
            workspace.mkdir(parents=True)
            for name in ("run_evals.py", "grade.py", "evals.json", "prompt_templates.json"):
                shutil.copy2(WORKSPACE / name, workspace / name)
            for case_dir in WORKSPACE.glob("eval-*"):
                shutil.copytree(case_dir, workspace / case_dir.name)
            self.assertEqual([p.name for p in workspace.parent.iterdir()], ["iteration-18"])
            result = subprocess.run(
                [sys.executable, str(workspace / "run_evals.py"), "--model", "test-model",
                 "--reasoning-effort", "high"], capture_output=True, text=True, check=True)
            self.assertEqual(len(json.loads(result.stdout)), 12)
            result = subprocess.run([sys.executable, str(workspace / "grade.py")],
                                    capture_output=True, text=True, check=True)
            summary = json.loads(result.stdout)
            # A definitions-only checkout must not manufacture historical scores.
            self.assertEqual(summary, [])

    def test_metadata_inputs_and_checker_coverage_match(self):
        scored = []
        for case in GRADE.CASES.values():
            directory = WORKSPACE / RUNNER.EVAL_DIRS[case["id"]]
            metadata = json.loads((directory / "eval_metadata.json").read_text())
            self.assertEqual(metadata["assertions"], case["assertions"])
            self.assertEqual(metadata["prompt"], case["prompt"])
            self.assertEqual(metadata["eval_id"], case["id"])
            self.assertEqual(metadata["eval_name"], case["name"])
            for filename in case["files"]:
                self.assertTrue((directory / filename).is_file(), filename)
            for assertion in case["assertions"]:
                for key in assertion["checks"]:
                    self.assertIn(key, GRADE.SOURCE_CHECKERS)
                    scored.append(key)
        self.assertEqual(len(scored), len(set(scored)))
        self.assertEqual(sum(len(c["assertions"]) for c in GRADE.CASES.values()), 61)

    def test_all_dispatches_use_new_paths_and_copy_dependencies(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory) / "iteration-18"
            shutil.copytree(WORKSPACE, workspace, ignore=shutil.ignore_patterns("__pycache__", "outputs", "focused-rerun-*", "skill-snapshots"))
            with patch.object(RUNNER, "WORKSPACE", workspace):
                dispatches = RUNNER.build_prompts(model="test-parent", reasoning_effort="high")
            self.assertEqual(len(dispatches), 12)
            self.assertEqual(GRADE.RUN_KINDS, ("mpx", "mpx2rn"))
            for dispatch in dispatches:
                self.assertEqual(dispatch["model"], "test-parent")
                self.assertEqual(dispatch["fork_turns"], "none")
                self.assertTrue(Path(dispatch["output_path"]).is_relative_to(workspace))
                self.assertNotIn("iteration-17/", dispatch["prompt"])
                self.assertNotIn("{{", dispatch["prompt"])
                group = Path(dispatch["output_path"]).parent.parent.name
                self.assertIn(group, ("mpx", "mpx2rn"))
                self.assertIn(f"/{group}/SKILL.md", dispatch["prompt"])
            outputs = workspace / RUNNER.EVAL_DIRS[2] / "mpx/outputs"
            for filename in ("components/pay-form/index.mpx", "components/lottie-view/index.mpx", "shield.png", "security-pattern.png"):
                self.assertTrue((outputs / filename).is_file())
            self.assertFalse((outputs / "carousel-card.mpx").exists())

    def score_fixture(self, eid, source):
        with tempfile.TemporaryDirectory() as directory:
            case = GRADE.CASES[eid]
            root = Path(directory)
            filename = case["outputs"][0]
            input_dir = root / "input"
            input_dir.mkdir()
            if eid < 3:
                shutil.copy2(WORKSPACE / RUNNER.EVAL_DIRS[eid] / "input" / filename, input_dir / filename)
            output = root / "mpx/outputs" / filename
            output.parent.mkdir(parents=True)
            output.write_text(source)
            return {r["id"]: r["passed"] for r in GRADE.check_case(eid, output)}

    def test_unadapted_fixtures_still_exercise_merged_capabilities(self):
        expected_failures = {
            0: ("s0", "s1", "s8", "s6", "s7", "l1", "l5", "l10", "l11"),
            1: ("t0", "t2", "t1", "t3", "j0", "j1", "j3", "t9"),
            2: ("g0", "g1", "g2", "g3", "g4", "g5", "g8", "g9", "g10", "c2", "c4", "c6", "c7"),
        }
        for eid, keys in expected_failures.items():
            case = GRADE.CASES[eid]
            source = (WORKSPACE / RUNNER.EVAL_DIRS[eid] / case["files"][0]).read_text()
            results = self.score_fixture(eid, source)
            for key in keys:
                with self.subTest(eid=eid, key=key):
                    self.assertFalse(results[key])

    def test_empty_outputs_cannot_pass_negative_checks(self):
        for eid in GRADE.CASES:
            self.assertFalse(any(self.score_fixture(eid, "").values()))

    def test_merged_assertion_requires_all_members(self):
        source = "<template><view /></template><script>createComponent({})</script>"
        with patch.dict(GRADE.SOURCE_CHECKERS, {
            key: lambda path: [{"id": k, "passed": k != "s11"} for k in GRADE.SOURCE_CHECKERS]
            for key in GRADE.SOURCE_CHECKERS
        }):
            self.assertFalse(self.score_fixture(0, source)["s0"])
        with patch.dict(GRADE.SOURCE_CHECKERS, {
            key: lambda path: [{"id": k, "passed": True} for k in GRADE.SOURCE_CHECKERS]
            for key in GRADE.SOURCE_CHECKERS
        }):
            self.assertTrue(self.score_fixture(0, source)["s0"])

    def test_scroll_container_without_loading_handler_does_not_pass(self):
        source = '<template><scroll-view scroll-y /></template><script>createPage({})</script>'
        self.assertFalse(self.score_fixture(1, source)["t3"])
        source = source.replace('scroll-y', 'scroll-y bindscrolltolower="loadMore"')
        self.assertTrue(self.score_fixture(1, source)["t3"])


if __name__ == "__main__":
    unittest.main()
