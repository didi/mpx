import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from subprocess import CompletedProcess
from unittest.mock import patch


WORKSPACE = Path(__file__).parent
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("run_evals", WORKSPACE / "run_evals.py")
RUN_EVALS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUN_EVALS)


class DispatchContractTest(unittest.TestCase):
    def test_full_matrix_has_three_isolated_configurations(self):
        dispatches = RUN_EVALS.build_prompts(
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )
        self.assertEqual(len(dispatches), 39)
        self.assertEqual(
            {dispatch["group"] for dispatch in dispatches},
            {"mpx2web", "previous_mpx2web", "no_skill"},
        )
        self.assertTrue(all(dispatch["fork_turns"] == "none" for dispatch in dispatches))

    def test_no_skill_prompt_does_not_expose_skill_path(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["no_skill"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]
        self.assertNotIn(str(RUN_EVALS.SKILL), dispatch["prompt"])
        self.assertIn("不要读取或使用任何 Mpx2Web Skill", dispatch["prompt"])

    def test_previous_skill_uses_embedded_frozen_1_8_entry(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["previous_mpx2web"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]
        self.assertIn('version: "1.8.0"', dispatch["prompt"])
        self.assertIn(str(RUN_EVALS.SKILL_REFERENCES), dispatch["prompt"])
        self.assertNotIn("iteration-11-internal", dispatch["prompt"])

    def test_command_forces_workspace_and_model(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["mpx2web"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]
        command = RUN_EVALS.build_codex_command(dispatch)
        self.assertEqual(command[command.index("-C") + 1], str(RUN_EVALS.EVAL_WORKDIR))
        self.assertEqual(command[command.index("-m") + 1], "gpt-5.6-sol")
        self.assertIn('model_reasoning_effort="high"', command)

    def test_runner_records_complete_multi_file_output(self):
        with tempfile.TemporaryDirectory(dir=RUN_EVALS.EVAL_WORKDIR) as directory:
            root = Path(directory)
            dispatch = RUN_EVALS.build_prompts(
                eval_ids=[0],
                groups=["no_skill"],
                model="gpt-5.6-sol",
                reasoning_effort="high",
                run_number=4,
            )[0]
            output_root = root / "outputs"
            output_paths = [output_root / path for path in (
                "src/pages/home/index.mpx",
                "src/components/product-card.mpx",
            )]
            dispatch["output_root"] = str(output_root)
            dispatch["output_paths"] = [str(path) for path in output_paths]
            dispatch["metrics_path"] = str(root / "run-4/metrics.json")

            def fake_run(*args, **kwargs):
                for output in output_paths:
                    output.parent.mkdir(parents=True, exist_ok=True)
                    output.write_text("<template />\n")
                return CompletedProcess(
                    args[0],
                    0,
                    stdout=(
                        '{"type":"item.completed","item":{"type":"file_change"}}\n'
                        '{"type":"turn.completed","usage":{"input_tokens":10,"output_tokens":5}}\n'
                    ),
                    stderr="",
                )

            with patch.object(RUN_EVALS.subprocess, "run", side_effect=fake_run):
                result = RUN_EVALS.run_dispatch(dispatch)

            self.assertTrue(result["outputs_complete"])
            metrics = json.loads(Path(dispatch["metrics_path"]).read_text())
            self.assertEqual(metrics["total_tokens"], 15)
            self.assertEqual(metrics["tool_calls"], 1)

    def test_runner_has_no_internal_workspace_dependency(self):
        self.assertNotIn(
            "iteration-11-internal",
            (WORKSPACE / "run_evals.py").read_text(),
        )


if __name__ == "__main__":
    unittest.main()
