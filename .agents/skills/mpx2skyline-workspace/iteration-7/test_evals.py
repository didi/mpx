import importlib.util
import json
import shutil
import subprocess
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


ENTRY = load("run_evals")
RUNNER = ENTRY.RUNNER
GRADE = load("grade")
REPORT = load("report")


class WorkflowTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.suite = self.root / "iteration-7"
        self.suite.mkdir()
        for filename in ("evals.json", "prompt_templates.json"):
            shutil.copy2(WORKSPACE / filename, self.suite / filename)
        for directory in RUNNER.EVAL_DIRS.values():
            shutil.copytree(WORKSPACE / directory / "input", self.suite / directory / "input")
        for field, value in (("WORKSPACE", self.suite), ("EVAL_WORKDIR", self.root)):
            patcher = patch.object(RUNNER, field, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def prompts(self, **kwargs):
        return RUNNER.build_prompts(model="test-model", reasoning_effort="high", **kwargs)

    def test_dispatches_stage_only_dependencies_and_resolve_multifile_contract(self):
        dispatches = self.prompts()
        self.assertEqual(len(dispatches), 8)
        for dispatch in dispatches:
            case = ENTRY.CASES[dispatch["eval_id"]]
            self.assertEqual(dispatch["fork_turns"], "none")
            self.assertEqual(dispatch["workdir"], str(self.root))
            self.assertNotIn("{{", dispatch["prompt"])
            self.assertIn(f"/{dispatch['group']}/SKILL.md", dispatch["prompt"])
            self.assertIn("/input/task.md", dispatch["prompt"])
            self.assertIn("WebView / Skyline", dispatch["prompt"])
            self.assertFalse(Path(dispatch["output_path"]).exists())
            self.assertFalse(Path(dispatch["metrics_path"]).exists())
            output_dir = Path(dispatch["metrics_path"]).parents[1] / "outputs"
            self.assertEqual(sorted(p.name for p in output_dir.iterdir()), case["staged_files"])
            self.assertEqual(len(dispatch["required_outputs"]), len(case["outputs"]))
            command = RUNNER.build_codex_command(dispatch)
            self.assertEqual(command[command.index("-C") + 1], str(self.root))
            self.assertEqual(command[command.index("-m") + 1], "test-model")

    def test_filtering_and_invalid_selection(self):
        self.assertEqual(len(self.prompts(eval_ids=[2], groups=["mpx"])), 1)
        for kwargs in ({"eval_ids": [99]}, {"groups": ["merged_skill"]}):
            with self.assertRaises(ValueError):
                self.prompts(**kwargs)
        with self.assertRaises(ValueError):
            RUNNER.build_prompts()

    def test_execute_checks_all_outputs_and_archives_real_protocol(self):
        dispatch = self.prompts(eval_ids=[3], groups=["mpx"])[0]
        stdout = '\n'.join([
            json.dumps({"type": "item.completed", "item": {"type": "command_execution"}}),
            json.dumps({"type": "turn.completed", "usage": {"input_tokens": 80, "output_tokens": 20}}),
        ])

        def fake_process(command, **kwargs):
            self.assertEqual(kwargs["cwd"], self.root)
            self.assertEqual(kwargs["input"], dispatch["prompt"])
            primary = Path(dispatch["output_path"])
            primary.parent.mkdir(parents=True)
            primary.write_text("<template><view /></template>")
            return subprocess.CompletedProcess(command, 0, stdout, "")

        with patch.object(RUNNER.subprocess, "run", side_effect=fake_process):
            result = RUNNER.run_dispatches([dispatch])[0]
        self.assertFalse(result["output_exists"])
        self.assertEqual(len(result["missing_outputs"]), 4)
        run_dir = Path(dispatch["metrics_path"]).parent
        metrics = json.loads((run_dir / "metrics.json").read_text())
        self.assertEqual(metrics["total_tokens"], 100)
        self.assertEqual(metrics["tool_calls"], 1)
        for filename in ("agent.jsonl", "stderr.log", "run.json", "timing.json", "source-snapshot.json"):
            self.assertTrue((run_dir / filename).exists())
        self.assertTrue((self.suite / "execution-results.json").exists())
        with self.assertRaises(ValueError):
            RUNNER.run_dispatch(dispatch)

    def test_grade_requires_reviewed_evidence_and_real_metrics(self):
        run_dir = self.root / "run-1"
        run_dir.mkdir()
        case = ENTRY.CASES[0]
        GRADE.prepare(case, run_dir)
        with self.assertRaises(ValueError):
            GRADE.grade_run(case, "mpx", run_dir)
        assessment = json.loads((run_dir / "assessment.json").read_text())
        for item in assessment["expectations"]:
            item.update(passed=False, evidence="test evidence: missing adaptation")
        GRADE.write_json(run_dir / "assessment.json", assessment)
        GRADE.prepare(case, run_dir)
        self.assertEqual(json.loads((run_dir / "assessment.json").read_text()), assessment)
        with self.assertRaises(ValueError):
            GRADE.grade_run(case, "mpx", run_dir)
        GRADE.write_json(run_dir / "metrics.json", {"total_tokens": 100, "tool_calls": 2, "duration_ms": 500})
        grading = GRADE.grade_run(case, "mpx", run_dir)
        self.assertEqual(grading["summary"]["total"], 14)
        self.assertEqual(grading["summary"]["passed"], 0)
        self.assertEqual(grading["timing"]["total_duration_seconds"], 0.5)
        assessment["expectations"][0]["id"] = "unknown"
        GRADE.write_json(run_dir / "assessment.json", assessment)
        with self.assertRaises(ValueError):
            GRADE.grade_run(case, "mpx", run_dir)

    def test_report_preserves_scoring_groups_and_single_run_count(self):
        with self.assertRaises(FileNotFoundError):
            REPORT.build_benchmark(self.suite)
        for dispatch in self.prompts():
            run_dir = Path(dispatch["metrics_path"]).parent
            run_dir.mkdir(parents=True)
            case = ENTRY.CASES[dispatch["eval_id"]]
            GRADE.prepare(case, run_dir)
            assessment = json.loads((run_dir / "assessment.json").read_text())
            for item in assessment["expectations"]:
                item.update(passed=True, evidence="synthetic test only")
            GRADE.write_json(run_dir / "assessment.json", assessment)
            GRADE.write_json(run_dir / "metrics.json", {"total_tokens": 100, "tool_calls": 2, "duration_ms": 500})
            GRADE.write_json(run_dir / "run.json", {"command": RUNNER.build_codex_command(dispatch)})
            GRADE.write_json(run_dir / "grading.json", GRADE.grade_run(case, dispatch["group"], run_dir))
        report = REPORT.build_benchmark(self.suite)
        self.assertEqual(len(report["runs"]), 8)
        self.assertEqual(report["metadata"]["runs_per_configuration"], 1)
        self.assertEqual(report["metadata"]["executor_model"], "test-model")
        for group in ("mpx", "mpx2skyline"):
            self.assertEqual(report["scoring_groups"][group]["adaptation"], {"passed": 33, "total": 33})
            self.assertEqual(report["scoring_groups"][group]["creation"], {"passed": 7, "total": 7})


if __name__ == "__main__":
    unittest.main()
