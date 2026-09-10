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
    def test_android_only_unsupported_selector_is_ignored(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'android') */
.btn-default .btn-text { color: red; }
/* @mpx-endif */
</style>
"""
        self.assertTrue(check(GRADE.check_eval_1, "t7", source))

    def test_ios_unsupported_selector_fails(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'ios') */
.btn-default .btn-text { color: red; }
/* @mpx-endif */
</style>
"""
        self.assertFalse(check(GRADE.check_eval_1, "t7", source))

    def test_conditional_hover_uses_distinct_rn_keys(self):
        source = """<template>
<view wx:if="{{unpaid}}" class="btn btn-primary" hover-class="btn-primary-hover" key@ios="unpaid"></view>
<view wx:elif="{{shipped}}" class="btn btn-default" key@ios="shipped"></view>
</template>
"""
        self.assertTrue(check(GRADE.check_eval_1, "t9", source))

    def test_conditional_hover_uses_distinct_plain_keys(self):
        source = """<template>
<view wx:if="{{unpaid}}" class="btn btn-primary" hover-class="btn-primary-hover" key="unpaid"></view>
<view wx:elif="{{shipped}}" class="btn btn-default" key="shipped"></view>
</template>
"""
        self.assertTrue(check(GRADE.check_eval_1, "t9", source))

    def test_conditional_hover_reusing_same_key_fails(self):
        source = """<template>
<view wx:if="{{unpaid}}" class="btn btn-primary" hover-class="btn-primary-hover" key="order"></view>
<view wx:elif="{{shipped}}" class="btn btn-default" key="order"></view>
</template>
"""
        self.assertFalse(check(GRADE.check_eval_1, "t9", source))

    def test_conditional_hover_is_stable_in_both_branches(self):
        source = """<template>
<view wx:if="{{unpaid}}" class="btn btn-primary" hover-class="btn-primary-hover"></view>
<view wx:elif="{{shipped}}" class="btn btn-default" hover-class="btn-default-hover"></view>
</template>
"""
        self.assertTrue(check(GRADE.check_eval_1, "t9", source))

    def test_conditional_hover_without_stability_fails(self):
        source = """<template>
<view wx:if="{{unpaid}}" class="btn btn-primary" hover-class="btn-primary-hover"></view>
<view wx:elif="{{shipped}}" class="btn btn-default"></view>
</template>
"""
        self.assertFalse(check(GRADE.check_eval_1, "t9", source))

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

    def test_dynamic_capabilities_and_conditional_css_var_use_rn_attributes(self):
        source = """<template>
<view class="gradient-overlay" enable-background@ios="{{true}}"></view>
<view class="card-item" enable-animation@ios="transition"></view>
<view wx:if="{{showToast}}" class="toast-mask" key@ios="toast"></view>
<view wx:else class="toast-placeholder" key@ios="placeholder"></view>
</template>
<style>
.toast-mask { --toast-color: red; background-color: var(--toast-color); }
</style>
"""
        for assertion_id in ("g3", "g4", "g10"):
            with self.subTest(assertion_id=assertion_id):
                self.assertTrue(check(
                    GRADE.check_eval_3, assertion_id, source))

    def test_conditional_css_var_predeclares_both_branches(self):
        source = """<template>
<view wx:if="{{showToast}}" class="toast-mask" enable-var@ios="{{true}}"></view>
<view wx:else class="toast-placeholder" enable-var@ios="{{true}}"></view>
</template>
<style>
.toast-mask { --toast-color: red; background-color: var(--toast-color); }
</style>
"""
        self.assertTrue(check(GRADE.check_eval_3, "g10", source))

    def test_conditional_css_var_predeclares_only_one_branch_fails(self):
        source = """<template>
<view wx:if="{{showToast}}" class="toast-mask" enable-var@ios="{{true}}"></view>
<view wx:else class="toast-placeholder"></view>
</template>
<style>
.toast-mask { --toast-color: red; background-color: var(--toast-color); }
</style>
"""
        self.assertFalse(check(GRADE.check_eval_3, "g10", source))

    def test_unconditional_capability_and_keys_fail_rn_attribute_checks(self):
        source = """<template>
<view class="gradient-overlay" enable-background="{{true}}"></view>
<view class="card-item" enable-animation="transition"></view>
<view wx:if="{{showToast}}" class="toast-mask" key="toast"></view>
<view wx:else class="toast-placeholder" key="placeholder"></view>
</template>
<style>
.toast-mask { --toast-color: red; background-color: var(--toast-color); }
</style>
"""
        for assertion_id in ("g3", "g4", "g10"):
            with self.subTest(assertion_id=assertion_id):
                self.assertFalse(check(
                    GRADE.check_eval_3, assertion_id, source))

    def test_empty_rule_on_ios_fails(self):
        source = """<style>
.rn-only {
  /* @mpx-if (__mpx_mode__ === 'ios') */
  width: 10rpx;
  /* @mpx-endif */
}
</style>
"""
        self.assertFalse(check(GRADE.check_eval_5, "c0", source))

    def test_ali_only_empty_rule_is_ignored(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'ali') */
.ali-only {}
/* @mpx-endif */
</style>
"""
        self.assertTrue(check(GRADE.check_eval_5, "c0", source))

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
        expected = {
            "mpx2rn": {"j3": True, "j4": True},
            "mpx2rn_simple": {"j3": True, "j4": True},
            "no_skill": {"j3": False, "j4": False},
        }
        if not all(
            (
                WORKSPACE / GRADE.EVAL_DIRS[2] / run_kind / "outputs"
                / GRADE.OUTPUT_FILES[2]
            ).exists()
            for run_kind in expected
        ):
            self.skipTest("评测输出尚未生成")
        for run_kind, assertion_results in expected.items():
            with self.subTest(run_kind=run_kind):
                output_path = (
                    WORKSPACE / GRADE.EVAL_DIRS[2] / run_kind / "outputs"
                    / GRADE.OUTPUT_FILES[2]
                )
                results = {
                    result["id"]: result["passed"]
                    for result in GRADE.check_eval_2(output_path)
                }
                for assertion_id, passed in assertion_results.items():
                    self.assertEqual(results[assertion_id], passed)


class Eval4Test(unittest.TestCase):
    def test_flex_item_wrapper_padding_preserves_gap(self):
        source = """<template>
<view class="stats-section">
  <view class="stat-card-wrap">
    <view class="stat-card"></view>
  </view>
</view>
</template>
<style>
.stats-section { display: flex; }
.stat-card-wrap { padding: 16rpx 24rpx; }
</style>
"""
        self.assertTrue(check(GRADE.check_eval_4, "l12", source))

    def test_flex_item_wrapper_without_vertical_gap_fails(self):
        source = """<template>
<view class="stats-section">
  <view class="stat-card-wrap">
    <view class="stat-card"></view>
  </view>
</view>
</template>
<style>
.stats-section { display: flex; }
.stat-card-wrap { padding: 0 24rpx; }
</style>
"""
        self.assertFalse(check(GRADE.check_eval_4, "l12", source))


class Eval5Test(unittest.TestCase):
    def check(self, assertion_id, output_path):
        return next(
            result["passed"]
            for result in GRADE.check_eval_5(output_path)
            if result["id"] == assertion_id
        )

    def test_original_multi_font_rn_single_font_passes(self):
        source = """<style>
.title {
  /* @mpx-if (__mpx_mode__ === 'wx') */
  font-family: 'PingFang SC', 'Helvetica Neue', sans-serif;
  /* @mpx-else */
  font-family: 'PingFang SC';
  /* @mpx-endif */
}
</style>
"""
        self.assertTrue(check(GRADE.check_eval_5, "c1", source))

    def test_rn_multi_font_fails(self):
        source = """<style>
.title {
  /* @mpx-if (__mpx_mode__ === 'wx') */
  font-family: 'PingFang SC';
  /* @mpx-else */
  font-family: 'PingFang SC', sans-serif;
  /* @mpx-endif */
}
</style>
"""
        self.assertFalse(check(GRADE.check_eval_5, "c1", source))

    def test_text_decoration_platform_branches_match_current_outputs(self):
        if not all(
            (
                WORKSPACE / GRADE.EVAL_DIRS[5] / run_kind / "outputs"
                / GRADE.OUTPUT_FILES[5]
            ).exists()
            for run_kind in GRADE.RUN_KINDS
        ):
            self.skipTest("评测输出尚未生成")
        expected = {
            "mpx2rn": True,
            "mpx2rn_simple": True,
            "no_skill": False,
        }
        for run_kind, passed in expected.items():
            with self.subTest(run_kind=run_kind):
                output_path = (
                    WORKSPACE / GRADE.EVAL_DIRS[5] / run_kind / "outputs"
                    / GRADE.OUTPUT_FILES[5]
                )
                self.assertEqual(self.check("c9", output_path), passed)

    def test_existing_style_results(self):
        expected = {
            "mpx2rn": {"c2": True, "c7": True},
            "mpx2rn_simple": {"c2": True, "c7": True},
            "no_skill": {"c2": True, "c7": True},
        }
        if not all(
            (
                WORKSPACE / GRADE.EVAL_DIRS[5] / run_kind / "outputs"
                / GRADE.OUTPUT_FILES[5]
            ).exists()
            for run_kind in expected
        ):
            self.skipTest("评测输出尚未生成")
        for run_kind, assertion_results in expected.items():
            with self.subTest(run_kind=run_kind):
                output_path = (
                    WORKSPACE / GRADE.EVAL_DIRS[5] / run_kind / "outputs"
                    / GRADE.OUTPUT_FILES[5]
                )
                results = {
                    result["id"]: result["passed"]
                    for result in GRADE.check_eval_5(output_path)
                }
                for assertion_id, passed in assertion_results.items():
                    self.assertEqual(results[assertion_id], passed)

    def test_ios_supported_text_decoration_passes(self):
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
            self.assertTrue(self.check("c9", output_path))

    def test_android_only_style_restrictions_are_ignored(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'android') */
.method {
  border-top-style: dashed;
  background-repeat: repeat-x;
}
/* @mpx-endif */
</style>
"""
        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "payment-page.mpx"
            output_path.write_text(source)
            self.assertTrue(self.check("c2", output_path))
            self.assertTrue(self.check("c7", output_path))

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

    def test_setup_properties_alias_uses_to_refs(self):
        source = """<script>
createPage({
  setup (componentProperties) {
    const { value } = toRefs(componentProperties)
    return { value }
  }
})
</script>
"""
        self.assertTrue(check(GRADE.check_eval_5, "c6", source))

    def test_setup_properties_alias_direct_destructure_fails(self):
        source = """<script>
createPage({
  setup (componentProperties) {
    const { value } = componentProperties
    return { value }
  }
})
</script>
"""
        self.assertFalse(check(GRADE.check_eval_5, "c6", source))

    def test_setup_argument_destructure_fails(self):
        source = """<script>
createPage({
  setup ({ value }) {
    return { value }
  }
})
</script>
"""
        self.assertFalse(check(GRADE.check_eval_5, "c6", source))


class Eval6Test(unittest.TestCase):
    SOURCE = """<script>
createComponent({
  $PROPERTIES: {
    ratingKey: { type: String },
    value: { type: Number },
    max: { type: Number },
    readonly: { type: Boolean },
    label: { type: String }
  },
  data: { currentValue: 0 },
  computed: { stars () { return [] } },
  watch: { value () {} },
  methods: { selectRating () {} }
})
</script>
"""

    def test_properties_option_passes(self):
        source = self.SOURCE.replace("$PROPERTIES", "properties")
        self.assertTrue(check(GRADE.check_eval_6, "n1", source))

    def test_props_option_passes(self):
        source = self.SOURCE.replace("$PROPERTIES", "props")
        self.assertTrue(check(GRADE.check_eval_6, "n1", source))

    def test_android_only_condition_does_not_count_as_target_branch(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'android') */
.android-only { color: red; }
/* @mpx-endif */
</style>
"""
        self.assertTrue(check(GRADE.check_eval_6, "n12", source))

    def test_ios_condition_counts_as_target_branch(self):
        source = """<style>
/* @mpx-if (__mpx_mode__ === 'ios') */
.ios-only { color: red; }
/* @mpx-endif */
</style>
"""
        self.assertFalse(check(GRADE.check_eval_6, "n12", source))


class Eval7Test(unittest.TestCase):
    SOURCE = """<script setup>
const $BINDING = defineProps({
  controlKey: { type: String },
  options: { type: Array },
  value: { type: String },
  disabled: { type: Boolean },
  label: { type: String }
})
$USAGE
defineExpose({ value })
</script>
"""

    def test_define_props_binding_alias_uses_to_refs(self):
        source = self.SOURCE.replace(
            "$BINDING", "componentProperties").replace(
                "$USAGE", "const { value } = toRefs(componentProperties)")
        self.assertTrue(check(GRADE.check_eval_7, "u2", source))

    def test_define_props_binding_alias_direct_destructure_fails(self):
        source = self.SOURCE.replace(
            "$BINDING", "componentProperties").replace(
                "$USAGE", "const { value } = componentProperties")
        self.assertFalse(check(GRADE.check_eval_7, "u2", source))

    def test_inline_item_disabled_argument_passes(self):
        source = """<template>
<view bindtap="selectOption(item.value, item.disabled)"></view>
</template>
<script setup>
function selectOption (optionValue, optionDisabled) {
  if (disabled.value || optionDisabled) return
  context.triggerEvent('change', {
    controlKey: controlKey.value,
    value: optionValue
  })
}
</script>
"""
        self.assertTrue(check(GRADE.check_eval_7, "u5", source))

    def test_inline_item_disabled_without_handler_guard_fails(self):
        source = """<template>
<view bindtap="selectOption(item.value, item.disabled)"></view>
</template>
<script setup>
function selectOption (optionValue) {
  if (disabled.value) return
  context.triggerEvent('change', {
    controlKey: controlKey.value,
    value: optionValue
  })
}
</script>
"""
        self.assertFalse(check(GRADE.check_eval_7, "u5", source))

    def test_script_item_disabled_access_still_passes(self):
        source = """<script setup>
function selectOption (option) {
  if (disabled.value || option.disabled) return
  context.triggerEvent('change', {
    controlKey: controlKey.value,
    value: option.value
  })
}
</script>
"""
        self.assertTrue(check(GRADE.check_eval_7, "u5", source))


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
