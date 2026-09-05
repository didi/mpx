import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


WORKSPACE = Path(__file__).parent
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location(
    "run_model_matrix",
    WORKSPACE / "run_model_matrix.py",
)
MATRIX = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MATRIX)


class ModelMatrixContractTest(unittest.TestCase):
    def test_formal_matrix_has_three_models_and_two_groups(self):
        self.assertEqual(
            [(model, effort) for _, _, model, effort in MATRIX.MODELS],
            [
                ("gpt-5.6-luna", "medium"),
                ("gpt-5.6-terra", "medium"),
                ("gpt-5.6-sol", "high"),
            ],
        )
        self.assertEqual(MATRIX.GROUPS, ("mpx2web", "no_skill"))
        self.assertEqual(MATRIX.EVAL_COUNT, 13)
        self.assertNotIn("previous_mpx2web", MATRIX.GROUPS)

    def test_each_model_root_is_self_contained(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "luna-medium"
            MATRIX.prepare_model_root(target)

            templates = json.loads((target / "prompt_templates.json").read_text())
            self.assertEqual(
                set(templates["templates"]),
                {"mpx2web", "no_skill"},
            )
            self.assertNotIn("previous_mpx2web", (target / "prompt_templates.json").read_text())
            self.assertEqual(
                len(list(target.glob("eval-*/eval_metadata.json"))),
                MATRIX.EVAL_COUNT,
            )
            self.assertEqual(len(list(target.glob("eval-*/input"))), MATRIX.EVAL_COUNT)


if __name__ == "__main__":
    unittest.main()
