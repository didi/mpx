from pathlib import Path
import shutil
import tempfile
import unittest
import grade

WORKSPACE = Path(__file__).parent


def verdicts(rows):
    return {row['id']: row['passed'] for row in rows}


class DeterministicGradeTests(unittest.TestCase):
    def test_assertion_counts_match_eval_config(self):
        config = grade.load_config()
        self.assertEqual([len(item['assertions']) for item in config['evals']], [7, 5, 9, 5])
        self.assertEqual(sum(len(item['assertions']) for item in config['evals']), 26)

    def test_same_sources_always_return_same_results(self):
        for eval_id, checker in grade.CHECKERS.items():
            item = next(item for item in grade.load_config()['evals'] if item['id'] == eval_id)
            root = WORKSPACE / f"eval-{eval_id}-{item['name']}" / 'mpx2web' / 'outputs'
            self.assertEqual(checker(root), checker(root))

    def test_current_results_keep_real_failures_and_drop_regex_false_negatives(self):
        expected = {
            0: {'mpx2web': (7, []), 'no_skill': (6, ['C4.3'])},
            1: {'mpx2web': (5, []), 'no_skill': (4, ['C2.5'])},
            2: {'mpx2web': (8, ['C5.2']), 'no_skill': (1, ['C3.2', 'C3.3', 'C3.4', 'C3.5', 'C3.6', 'C5.1', 'C5.2', 'C5.3'])},
            3: {'mpx2web': (5, []), 'no_skill': (4, ['C6.1'])},
        }
        for eval_id, groups in expected.items():
            item = next(item for item in grade.load_config()['evals'] if item['id'] == eval_id)
            for group, (passed, failed) in groups.items():
                root = WORKSPACE / f"eval-{eval_id}-{item['name']}" / group / 'outputs'
                rows = grade.CHECKERS[eval_id](root)
                self.assertEqual(sum(row['passed'] for row in rows), passed)
                self.assertEqual([row['id'] for row in rows if not row['passed']], failed)

    def test_ssr_accepts_direct_current_pinia_action_but_rejects_build_route_config(self):
        item = next(item for item in grade.load_config()['evals'] if item['id'] == 3)
        case = WORKSPACE / f"eval-3-{item['name']}"
        self.assertTrue(verdicts(grade.check_eval_3(case / 'mpx2web' / 'outputs'))['C6.1'])
        self.assertFalse(verdicts(grade.check_eval_3(case / 'no_skill' / 'outputs'))['C6.1'])

    def test_route_config_accepts_object_assign(self):
        source = """<script>
mpx.config.webConfig = Object.assign({}, current, {
  routeConfig: Object.assign({}, current.routeConfig, {
    mode: 'history',
    base: '/help-demo/'
  })
})
</script>"""
        self.assertTrue(grade.has_runtime_route_config(source, '/help-demo/'))

    def test_route_config_accepts_direct_runtime_assignment(self):
        source = """<script>
mpx.config.webConfig.routeConfig = {
  mode: 'history',
  base: '/profile-demo/'
}
</script>"""
        self.assertTrue(grade.has_runtime_route_config(source, '/profile-demo/'))

    def test_half_rpx_transform_accepts_direct_and_local_alias(self):
        direct = """transRpxFn: function (match, value) {
  return `${Number(value) / 2}px`
}"""
        aliased = """transRpxFn: function (match, value) {
  const size = Number(value)
  return size === 0 ? '0' : `${size / 2}px`
}"""
        wrong = """transRpxFn: function (match, value) {
  return `${Number(value) / 3}px`
}"""
        self.assertTrue(grade.has_half_rpx_transform(direct))
        self.assertTrue(grade.has_half_rpx_transform(aliased))
        self.assertFalse(grade.has_half_rpx_transform(wrong))

    def test_platform_node_accepts_current_and_legacy_mode_aliases(self):
        source = '<picker @web /><picker @_web /><map @_wx />'
        self.assertEqual(len(grade.platform_open_tags(source, 'picker', 'web')), 2)
        self.assertTrue(grade.has_platform_node(source, 'map', 'wx'))

    def test_on_app_init_accepts_direct_and_shorthand_pinia_injection(self):
        direct = """createApp({
  onAppInit () { return { pinia: createPinia() } }
})"""
        shorthand = """createApp({
  onAppInit () {
    const pinia = createPinia()
    return { pinia }
  }
})"""
        global_only = "const pinia = createPinia(); createApp({})"
        self.assertTrue(grade.on_app_init_injects_pinia(direct))
        self.assertTrue(grade.on_app_init_injects_pinia(shorthand))
        self.assertFalse(grade.on_app_init_injects_pinia(global_only))

    def test_valid_mpx_condition_comments_are_evaluated(self):
        valid = """/* @mpx-if (__mpx_mode__ === 'web') */
.web { display: block; }
/* @mpx-endif */"""
        invalid = """/* @mpx-if (mode === 'web') */
.web { display: block; }
/* @mpx-endif */"""
        self.assertTrue(grade.valid_mpx_conditionals(valid))
        self.assertFalse(grade.valid_mpx_conditionals(invalid))

    def test_web_template_override_can_isolate_wx_handler(self):
        source = """<template><button bindtap="rename">编辑</button></template>
<template mode="web"><button bindtap="openRename">编辑</button></template>"""
        self.assertTrue(grade.handler_isolated_by_web_override(source, 'rename'))

    def test_number_is_finite_is_a_safe_video_fallback(self):
        source = """const detail = Number(event.detail.currentTime)
if (Number.isFinite(detail)) return detail
const target = Number(event.target.currentTime)
return Number.isFinite(target) ? target : 0"""
        self.assertTrue(grade.has_safe_media_fallback(source))

    def test_set_data_handler_name_is_not_hardcoded(self):
        template = '<view bindtap="toggleSummary"><view wx:if="{{expanded}}" /></view>'
        script = """methods: {
  toggleSummary () {
    this.setData({ expanded: !this.expanded })
  }
}"""
        self.assertTrue(grade.component_has_local_toggle(template, script, 'expanded'))

    def test_share_rule_accepts_real_wx_branch_without_page_option_style_requirement(self):
        source = WORKSPACE / 'eval-1-generate-web/mpx2web/outputs'
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            shutil.copytree(source, target, dirs_exist_ok=True)
            page = target / 'src/pages/profile/index.mpx'
            text = page.read_text()
            script_start = text.index("<script>\nimport")
            script_end = text.index("</script>", script_start)
            replacement = """<script>
import { createPage } from '@mpxjs/core'
const pageOptions = { data: { isWeb: __mpx_mode__ === 'web' } }
if (__mpx_mode__ === 'wx') {
  pageOptions.onShareAppMessage = function () {
    return { title: '个人资料', path: '/pages/profile/index' }
  }
}
createPage(pageOptions)
"""
            text = text[:script_start] + replacement + text[script_end:]
            page.write_text(text)
            self.assertTrue(verdicts(grade.check_eval_1(target))['C2.5'])

    def test_invalid_mode_condition_comments_do_not_count_as_platform_isolation(self):
        root = WORKSPACE / 'eval-2-api-share-components/no_skill/outputs'
        result = verdicts(grade.check_eval_2(root))
        self.assertFalse(result['C3.2'])
        self.assertFalse(result['C3.3'])
        self.assertFalse(result['C3.5'])
        self.assertFalse(result['C3.6'])

    def test_no_skill_correct_behavior_passes_but_real_failures_remain(self):
        profile = WORKSPACE / 'eval-1-generate-web/no_skill/outputs'
        api_case = WORKSPACE / 'eval-2-api-share-components/no_skill/outputs'
        self.assertTrue(verdicts(grade.check_eval_1(profile))['C2.4'])
        result = verdicts(grade.check_eval_2(api_case))
        self.assertFalse(result['C3.4'])
        self.assertFalse(result['C5.1'])
        self.assertFalse(result['C5.3'])

    def test_catalog_accepts_real_web_structure_but_keeps_attribute_failure(self):
        source = WORKSPACE / 'eval-2-api-share-components/mpx2web/outputs'
        result = verdicts(grade.check_eval_2(source))
        self.assertFalse(result['C5.2'])
        self.assertTrue(result['C5.3'])
        catalog = (source / 'src/pages/catalog/index.mpx').read_text()
        self.assertTrue(grade.valid_mpx_conditionals(catalog))

    def test_shared_picker_platform_attributes_are_accepted(self):
        source = WORKSPACE / 'eval-2-api-share-components/mpx2web/outputs'
        self.assertTrue(verdicts(grade.check_eval_2(source))['C5.1'])

    def test_readonly_scanner_change_fails_scanner_assertion(self):
        source = WORKSPACE / 'eval-2-api-share-components/mpx2web/outputs'
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            shutil.copytree(source, target, dirs_exist_ok=True)
            (target / 'src/vendor/native-scanner/index.mpx').write_text('changed')
            self.assertFalse(verdicts(grade.check_eval_2(target))['C3.3'])

    def test_assertion_rows_match_rn17_binary_shape(self):
        ids = [row['id'] for row in grade.load_config()['evals'][0]['assertions']]
        rows = grade.assertion_rows(0, {assertion_id: True for assertion_id in ids})
        for row in rows:
            self.assertEqual(set(row), {'id', 'text', 'passed'})
            self.assertIs(row['passed'], True)


if __name__ == '__main__':
    unittest.main()
