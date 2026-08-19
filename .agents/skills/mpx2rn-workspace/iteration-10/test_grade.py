import importlib.util
import tempfile
import unittest
from pathlib import Path


WORKSPACE = Path(__file__).parent
SPEC = importlib.util.spec_from_file_location("grade", WORKSPACE / "grade.py")
GRADE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GRADE)


def check(checker, assertion_id, source):
    with tempfile.TemporaryDirectory() as directory:
        output_path = Path(directory) / "fixture.mpx"
        output_path.write_text(source)
        return next(
            result["passed"]
            for result in checker(output_path)
            if result["id"] == assertion_id
        )


class ConditionalIsolationTest(unittest.TestCase):
    def test_android_only_unsupported_selector_fails(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'android') */
.btn-default .btn-text { color: red; }
/* @mpx-endif */
</style>
"""
        self.assertFalse(check(GRADE.check_eval_1, "t7", source))

    def test_rn_else_keyframes_fail(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'wx') */
.card { opacity: 1; }
/* @mpx-else */
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
/* @mpx-endif */
</style>
"""
        self.assertFalse(check(GRADE.check_eval_3, "g9", source))

    def test_empty_rule_on_one_platform_fails(self):
        source = """<style>
.rn-only {
  /* @mpx-if (__mpx_mode__ === 'android') */
  width: 10rpx;
  /* @mpx-endif */
}
</style>
"""
        self.assertFalse(check(GRADE.check_eval_5, "c0", source))

    def test_json_platform_name_without_runtime_mode_check_fails(self):
        source = """<script name="json">
const target = 'ios'
module.exports = { navigationBarTitleText: target }
</script>
"""
        self.assertFalse(check(GRADE.check_eval_5, "c8", source))

    def test_unsupported_lifecycle_in_rn_branch_fails(self):
        source = """<script>
const isRN = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'
if (isRN) {
  const pageOptions = { onShareTimeline () {} }
}
</script>
"""
        self.assertFalse(check(GRADE.check_eval_2, "j1", source))

    def test_unsupported_lifecycle_in_original_branch_passes(self):
        source = """<script>
const isRN = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'
if (!isRN) {
  const pageOptions = { onShareTimeline () {} }
}
</script>
"""
        self.assertTrue(check(GRADE.check_eval_2, "j1", source))

    def test_original_platform_alias_guards_lifecycles_and_apis(self):
        source = """<script>
const isOriginalPlatform = __mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web'
const pageOptions = {}
if (isOriginalPlatform) {
  Object.assign(pageOptions, {
    onShareTimeline () {},
    onTabItemTap () {}
  })
}
const methods = {
  requestUserProfile () {
    if (isOriginalPlatform) {
      mpx.getUserProfile({})
    }
  },
  refreshBadge () {
    if (isOriginalPlatform) {
      mpx.setTabBarBadge({})
      mpx.removeTabBarBadge({})
    }
  }
}
</script>
"""
        for assertion_id in ("j1", "j2", "j3", "j4"):
            with self.subTest(assertion_id=assertion_id):
                self.assertTrue(check(
                    GRADE.check_eval_2, assertion_id, source))

    def test_alias_name_does_not_override_its_expression(self):
        source = """<script>
const isOriginalPlatform = __mpx_mode__ === 'ios'
if (isOriginalPlatform) {
  const pageOptions = { onShareTimeline () {} }
}
</script>
"""
        self.assertFalse(check(GRADE.check_eval_2, "j1", source))

    def test_inverted_alias_guards_original_platform_branch(self):
        source = """<script>
const isRN = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'
const isOriginalPlatform = !isRN
if (isOriginalPlatform) {
  const pageOptions = { onTabItemTap () {} }
}
</script>
"""
        self.assertTrue(check(GRADE.check_eval_2, "j2", source))

    def test_pull_down_refresh_in_rn_branch_fails(self):
        source = """<script name="json">
const isRN = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'
if (isRN) {
  module.exports = { enablePullDownRefresh: true }
}
</script>
"""
        self.assertFalse(check(GRADE.check_eval_2, "j7", source))

    def test_unrelated_rn_early_return_does_not_guard_api(self):
        source = """<script>
const isRN = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'
const pageOptions = {
  guardedMethod () {
    if (isRN) return
  },
  unsafeMethod () {
    mpx.getUserProfile({})
  }
}
</script>
"""
        self.assertFalse(check(GRADE.check_eval_2, "j4", source))

    def test_existing_script_isolation_results(self):
        expected = {"mpx2rn": True, "mpx2rn_simple": True, "no_skill": False}
        for run_kind, passed in expected.items():
            with self.subTest(run_kind=run_kind):
                output_path = (
                    WORKSPACE / GRADE.EVAL_DIRS[2] / run_kind / "outputs"
                    / GRADE.OUTPUT_FILES[2]
                )
                results = {
                    result["id"]: result["passed"]
                    for result in GRADE.check_eval_2(output_path)
                }
                self.assertEqual(results["j3"], passed)
                self.assertEqual(results["j4"], passed)


class Eval5Test(unittest.TestCase):
    def check(self, assertion_id, output_path):
        return next(
            result["passed"]
            for result in GRADE.check_eval_5(output_path)
            if result["id"] == assertion_id
        )

    def test_text_decoration_platform_branches_pass(self):
        for run_kind in GRADE.RUN_KINDS:
            with self.subTest(run_kind=run_kind):
                output_path = (
                    WORKSPACE / GRADE.EVAL_DIRS[5] / run_kind / "outputs"
                    / GRADE.OUTPUT_FILES[5]
                )
                self.assertTrue(self.check("c9", output_path))

    def test_rn_compatible_conditional_branches_pass(self):
        for run_kind in GRADE.RUN_KINDS:
            with self.subTest(run_kind=run_kind):
                output_path = (
                    WORKSPACE / GRADE.EVAL_DIRS[5] / run_kind / "outputs"
                    / GRADE.OUTPUT_FILES[5]
                )
                self.assertEqual(
                    self.check("c2", output_path),
                    run_kind != "no_skill",
                )
                self.assertTrue(self.check("c7", output_path))

    def test_unsupported_android_text_decoration_fails(self):
        source = """<style>
.amount {
  text-decoration-style: dashed;
  text-decoration-color: #ccc;
}
</style>
"""
        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "payment-page.mpx"
            output_path.write_text(source)
            self.assertFalse(self.check("c9", output_path))

    def test_unconditional_per_side_border_style_fails(self):
        source = """<style>
.method { border-top-style: dashed; }
</style>
"""
        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "payment-page.mpx"
            output_path.write_text(source)
            self.assertFalse(self.check("c2", output_path))

    def test_unconditional_repeating_background_fails(self):
        source = """<style>
.background { background-repeat: repeat-x; }
</style>
"""
        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "payment-page.mpx"
            output_path.write_text(source)
            self.assertFalse(self.check("c7", output_path))


class Eval8Test(unittest.TestCase):
    SOURCE = """<template>
<view class="flex flex-row gap-2 m-2 bg-white text-black rounded-lg"></view>
</template>
<script setup>
</script>
<script type="application/json">
{}
</script>
$STYLE"""

    def test_empty_style_block_passes(self):
        source = self.SOURCE.replace(
            "$STYLE", "<style>\n/* 原子类提供全部视觉样式 */\n</style>")
        self.assertTrue(check(GRADE.check_eval_8, "a0", source))
        self.assertTrue(check(GRADE.check_eval_8, "a9", source))

    def test_nonempty_style_block_fails(self):
        source = self.SOURCE.replace(
            "$STYLE", "<style>\n.page { color: red; }\n</style>")
        self.assertFalse(check(GRADE.check_eval_8, "a0", source))
        self.assertFalse(check(GRADE.check_eval_8, "a9", source))

    def test_hover_atomic_class_fails(self):
        source = self.SOURCE.replace(
            "rounded-lg", "rounded-lg hover:bg-gray-100")
        self.assertFalse(check(GRADE.check_eval_8, "a12", source))

    def test_hover_class_passes(self):
        source = self.SOURCE.replace(
            "<view class=", '<view hover-class="opacity-80" class=')
        self.assertTrue(check(GRADE.check_eval_8, "a12", source))

    def test_missing_hover_feedback_fails(self):
        self.assertFalse(check(GRADE.check_eval_8, "a12", self.SOURCE))

    def test_unsupported_interaction_variant_fails(self):
        source = self.SOURCE.replace(
            "<view class=", '<view hover-class="opacity-80" class=')
        source = source.replace(
            "rounded-lg", "rounded-lg active:bg-gray-200")
        self.assertFalse(check(GRADE.check_eval_8, "a12", source))


if __name__ == "__main__":
    unittest.main()
