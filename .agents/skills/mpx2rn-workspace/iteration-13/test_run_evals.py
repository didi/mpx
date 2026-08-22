import importlib.util
import tempfile
import unittest
from pathlib import Path


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
