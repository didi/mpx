import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


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

    def test_invalidate_reports_removes_only_aggregate_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in MATRIX.REPORT_NAMES:
                (root / name).write_text("stale")
            evidence = root / "evals.json"
            evidence.write_text("{}")

            MATRIX.invalidate_reports(root)

            self.assertTrue(evidence.is_file())
            self.assertTrue(all(not (root / name).exists() for name in MATRIX.REPORT_NAMES))

    def test_publish_representative_results_uses_documented_median(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            model_root = root / "model-runs"
            eval_name = "eval-0-example"
            (root / "evals.json").write_text(json.dumps({
                "evals": [{"id": 0, "name": "example"}],
            }))
            models = (
                ("a", "A", "model-a", "medium"),
                ("b", "B", "model-b", "medium"),
                ("c", "C", "model-c", "high"),
            )
            rates = iter((0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9) * 2)
            for group in MATRIX.GROUPS:
                for slug, _, _, _ in models:
                    for run_number in range(1, 4):
                        run_root = model_root / slug / eval_name / group / f"run-{run_number}"
                        outputs = run_root / "outputs"
                        outputs.mkdir(parents=True)
                        rate = next(rates)
                        (run_root / "grading.json").write_text(json.dumps({
                            "summary": {"pass_rate": rate},
                            "strict_delivery_summary": {"pass_rate": rate},
                        }))
                        (outputs / "result.mpx").write_text(str(rate))

            with patch.object(MATRIX, "ROOT", root), patch.object(
                MATRIX, "MODEL_ROOT", model_root
            ), patch.object(MATRIX, "MODELS", models):
                MATRIX.publish_representative_results({})

            for group in MATRIX.GROUPS:
                destination = root / eval_name / group
                published = json.loads((destination / "published_source.json").read_text())
                self.assertEqual(published["functional_rate"], 0.5)
                self.assertEqual(published["slug"], "b")
                self.assertEqual(published["run_number"], 2)
                self.assertEqual((destination / "outputs/result.mpx").read_text(), "0.5")
                self.assertEqual((destination / "run-1/outputs/result.mpx").read_text(), "0.5")


if __name__ == "__main__":
    unittest.main()
