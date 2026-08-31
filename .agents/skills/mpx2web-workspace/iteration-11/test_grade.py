import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


WORKSPACE = Path(__file__).parent
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("grade", WORKSPACE / "grade.py")
GRADE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GRADE)


class GradeContractTest(unittest.TestCase):
    def test_rpx_checker_accepts_complete_conversion_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "outputs/vue.config.js"
            output.parent.mkdir()
            output.write_text(
                "module.exports = { webConfig: { transRpxFn: function (value) {\n"
                "  if (value === 0) return 0\n"
                "  return value / 100\n"
                "} } }\n"
            )
            passed, evidence = GRADE.check_t1(root)
            self.assertTrue(passed, evidence)

    def test_rpx_checker_rejects_missing_zero_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "outputs/vue.config.js"
            output.parent.mkdir()
            output.write_text(
                "module.exports = { webConfig: { transRpxFn: function (value) {\n"
                "  return value / 100\n"
                "} } }\n"
            )
            passed, _ = GRADE.check_t1(root)
            self.assertFalse(passed)

    def test_public_audit_covers_all_three_samples(self):
        payload = GRADE.audit_workspace(WORKSPACE)
        self.assertEqual(len(payload["results"]), 117)
        self.assertEqual(
            {row["run_number"] for row in payload["results"]},
            {1, 2, 3},
        )
        for group in GRADE.PUBLIC_GROUPS:
            with self.subTest(group=group):
                self.assertEqual(payload["totals"][group]["runs"], 39)
                self.assertEqual(payload["totals"][group]["total"], 300)

    def test_grade_has_no_internal_workspace_dependency(self):
        self.assertNotIn("iteration-11-internal", (WORKSPACE / "grade.py").read_text())


if __name__ == "__main__":
    unittest.main()
