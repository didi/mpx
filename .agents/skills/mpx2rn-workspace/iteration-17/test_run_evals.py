import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from subprocess import CompletedProcess
from unittest.mock import patch


WORKSPACE = Path(__file__).parent
SPEC = importlib.util.spec_from_file_location("run_evals", WORKSPACE / "run_evals.py")
RUN_EVALS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUN_EVALS)


class DispatchConfigTest(unittest.TestCase):
    def test_explicitly_matches_parent_and_disables_context_fork(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["no_skill"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]

        self.assertEqual(dispatch["model"], "gpt-5.6-sol")
        self.assertEqual(dispatch["reasoning_effort"], "high")
        self.assertEqual(dispatch["fork_turns"], "none")
        self.assertEqual(dispatch["workdir"], str(RUN_EVALS.EVAL_WORKDIR))

    def test_requires_explicit_parent_model_and_reasoning_effort(self):
        invalid_configs = (
            {"model": None, "reasoning_effort": "high"},
            {"model": "gpt-5.6-sol", "reasoning_effort": None},
        )

        for config in invalid_configs:
            with self.subTest(config=config), self.assertRaisesRegex(
                ValueError,
                "must be explicitly set",
            ):
                RUN_EVALS.build_prompts(
                    eval_ids=[0],
                    groups=["no_skill"],
                    **config,
                )

    def test_no_skill_prompt_does_not_add_compile_validation(self):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["no_skill"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]

        self.assertNotIn("compile-validate", dispatch["prompt"])
        self.assertNotIn("MPX2RN_SKILL_PATH", dispatch["prompt"])


class CodexExecutionTest(unittest.TestCase):
    def build_dispatch(self, output_path, metrics_path):
        dispatch = RUN_EVALS.build_prompts(
            eval_ids=[0],
            groups=["no_skill"],
            model="gpt-5.6-sol",
            reasoning_effort="high",
        )[0]
        dispatch["output_path"] = str(output_path)
        dispatch["metrics_path"] = str(metrics_path)
        return dispatch

    def test_command_forces_workspace_with_codex_cd(self):
        dispatch = self.build_dispatch(
            RUN_EVALS.WORKSPACE / "output.mpx",
            RUN_EVALS.WORKSPACE / "metrics.json",
        )
        command = RUN_EVALS.build_codex_command(dispatch)

        self.assertEqual(command[command.index("-C") + 1], str(RUN_EVALS.EVAL_WORKDIR))
        self.assertEqual(command[command.index("-m") + 1], "gpt-5.6-sol")
        self.assertIn('model_reasoning_effort="high"', command)
        self.assertNotIn("compile-validate", " ".join(command))

    def test_subprocess_uses_same_forced_cwd(self):
        with tempfile.TemporaryDirectory(dir=RUN_EVALS.EVAL_WORKDIR) as directory:
            directory = Path(directory)
            output_path = directory / "output.mpx"
            dispatch = self.build_dispatch(
                output_path,
                directory / "run-1" / "metrics.json",
            )

            def fake_run(*args, **kwargs):
                output_path.write_text("<template />\n")
                return CompletedProcess(
                    args[0],
                    0,
                    stdout='{"type":"turn.completed","usage":{"input_tokens":10,"output_tokens":5}}\n',
                    stderr="",
                )

            with patch.object(RUN_EVALS.subprocess, "run", side_effect=fake_run) as run:
                result = RUN_EVALS.run_dispatch(dispatch)

            self.assertEqual(run.call_args.kwargs["cwd"], RUN_EVALS.EVAL_WORKDIR)
            command = run.call_args.args[0]
            self.assertEqual(
                command[command.index("-C") + 1],
                str(RUN_EVALS.EVAL_WORKDIR),
            )
            self.assertTrue(result["output_exists"])
            metrics = json.loads(Path(dispatch["metrics_path"]).read_text())
            self.assertEqual(metrics["total_tokens"], 15)
            timing = json.loads((Path(dispatch["metrics_path"]).parent / "timing.json").read_text())
            self.assertEqual(timing["total_tokens"], 15)


class CopyInputDependenciesTest(unittest.TestCase):
    def test_copies_component_dependency(self):
        eval_dir = RUN_EVALS.EVAL_DIRS[3]
        input_dir = WORKSPACE / eval_dir / "input"

        with tempfile.TemporaryDirectory() as directory:
            output_dir = Path(directory)
            RUN_EVALS.copy_input_dependencies(
                eval_dir,
                input_dir / "carousel-card.mpx",
                output_dir,
            )

            relative_path = "components/lottie-view/index.mpx"
            self.assertEqual(
                (output_dir / relative_path).read_bytes(),
                (input_dir / relative_path).read_bytes(),
            )

    def test_copies_nested_component_and_static_assets(self):
        eval_dir = RUN_EVALS.EVAL_DIRS[5]
        input_dir = WORKSPACE / eval_dir / "input"
        input_path = input_dir / "payment-page.mpx"

        with tempfile.TemporaryDirectory() as directory:
            output_dir = Path(directory)
            RUN_EVALS.copy_input_dependencies(eval_dir, input_path, output_dir)

            for relative_path in (
                "components/pay-form/index.mpx",
                "security-pattern.png",
                "shield.png",
            ):
                with self.subTest(relative_path=relative_path):
                    self.assertEqual(
                        (output_dir / relative_path).read_bytes(),
                        (input_dir / relative_path).read_bytes(),
                    )

            self.assertFalse((output_dir / "payment-page.mpx").exists())


if __name__ == "__main__":
    unittest.main()
