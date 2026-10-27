"""Positive equivalents and counterexamples for the calibrated Web grader."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path
import grade

ROOT = Path(__file__).resolve().parent
CASES = {row['id']: f"eval-{row['id']}-{row['name']}" for row in grade.load_config()['evals']}


class CalibratedGradeTests(unittest.TestCase):
    def mutated(self, case, group, file, old, new, assertion):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'outputs'
            shutil.copytree(ROOT / CASES[case] / group / 'outputs', output)
            target = output / file
            source = target.read_text()
            self.assertIn(old, source)
            target.write_text(source.replace(old, new))
            return next(row['passed'] for row in grade.CHECKERS[case](output) if row['id'] == assertion)

    def test_all_52_verdicts_match_independent_semantic_review(self):
        rows = json.loads((ROOT / 'semantic-review.json').read_text())['expectations']
        self.assertEqual(len(rows), 52)
        for case in CASES:
            for group in grade.GROUPS:
                expected = {row['id']: row['passed'] for row in rows if row['case'] == case and row['group'] == group}
                actual = {row['id']: row['passed'] for row in grade.CHECKERS[case](ROOT / CASES[case] / group / 'outputs')}
                with self.subTest(case=case, group=group):
                    self.assertEqual(actual, expected)

    def test_application_mutations_detect_real_regressions(self):
        mutations = [
            ('src/components/red-card.mpx', '<style scoped>', '<style>', 's0'),
            ('mpx.config.js', 'layout-cell', 'unrelated-cell', 's1'),
            ('src/components/theme-card.mpx', 'class="theme-label tone-class custom-class"', 'class="custom-class"', 's2'),
            ('src/pages/home/index.mpx', "this.selectedLabel = '正在选择'", "this.selectedLabel = '错误状态'", 's3'),
            ('src/app.mpx', 'enableTitleBar = false', 'enableTitleBar = true', 's4'),
            ('mpx.config.js', "'/help-demo/'", "'/wrong/'", 's5'),
            ('mpx.config.js', 'Number(value) / 2', 'Number(value) / 3', 's6'),
        ]
        for file, old, new, assertion in mutations:
            with self.subTest(assertion=assertion):
                self.assertFalse(self.mutated(0, 'mpx', file, old, new, assertion))

    def test_component_factory_and_json_contract(self):
        for group in grade.GROUPS:
            with self.subTest(group=group):
                self.assertFalse(self.mutated(1, group, 'profile-card.mpx', '"component": true', '"component": false', 'n0'))
                self.assertFalse(self.mutated(1, group, 'profile-card.mpx', 'accent-class">', 'missing-class">', 'n2'))
                self.assertFalse(self.mutated(1, group, 'profile-card.mpx', 'this.expanded = !this.expanded', 'this.expanded = true', 'n3'))

    def test_video_uses_actual_web_router_query_and_media_fields(self):
        source = grade.blocks((ROOT / CASES[2] / 'mpx2web/outputs/business-page.mpx').read_text())['script']
        fixed = source.replace("decodeURIComponent(query.videoUrl || '')", "query.videoUrl || ''")
        self.assertTrue(all(grade.javascript_probe('video', fixed)[key] for key in ('srcMatches', 'fallback', 'detail')))
        self.assertFalse(grade.javascript_probe('video', source)['srcMatches'])
        missing_argument = fixed.replace("query.videoUrl || ''", 'arguments[1].videoUrl')
        self.assertIn('error', grade.javascript_probe('video', missing_argument))
        no_media_fallback = fixed.replace('event.target', '{}')
        self.assertFalse(grade.javascript_probe('video', no_media_fallback)['fallback'])

    def test_json_and_template_isolation_must_both_hold(self):
        for marker, assertion in (('native-scanner', 'c2'), ('foo-card', 'c5')):
            with self.subTest(assertion=assertion):
                self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx',
                    "usingComponents: __mpx_mode__ === 'wx'", 'usingComponents: true', assertion))
        self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx',
            "__mpx_mode__ === 'wx' && scanning", "scanning", 'c2'))
        self.assertFalse(self.mutated(2, 'mpx', 'native-scanner.mpx', '<template>', '<template> changed ', 'c2'))

    def test_location_named_import_alias_and_platform_guard(self):
        source = grade.blocks((ROOT / CASES[2] / 'mpx/outputs/business-page.mpx').read_text())['script']
        aliased = source.replace('showModal, chooseLocation', 'showModal, chooseLocation as selectPlace').replace('chooseLocation({', 'selectPlace({')
        self.assertEqual(grade.javascript_probe('location', aliased, 'wx')['placeName'], 'probe-location')
        self.assertEqual(grade.javascript_probe('location', aliased, 'web')['calls'], [])
        broken = source.replace("if (__mpx_mode__ === 'wx') {\n        chooseLocation", 'if (true) {\n        chooseLocation')
        self.assertEqual(grade.javascript_probe('location', broken, 'web')['calls'], ['chooseLocation'])

    def test_picker_dynamic_attributes_follow_installed_compiler(self):
        self.assertFalse(self.mutated(2, 'mpx2web', 'business-page.mpx', 'value@web=', 'value@_web=', 'c6'))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(ROOT / CASES[2] / 'mpx2web/outputs', root, dirs_exist_ok=True)
            page = root / 'business-page.mpx'
            page.write_text(page.read_text().replace('value@web=', 'value@_web=').replace('range@web=', 'range@_web='))
            self.assertTrue(next(row['passed'] for row in grade.check_eval_2(root) if row['id'] == 'c6'))

    def test_filter_css_names_are_not_hardcoded_but_behavior_is_required(self):
        self.assertTrue(self.mutated(2, 'mpx', 'business-page.mpx', 'filter-mask', 'custom-filter-dialog', 'c8'))
        self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx', 'position: fixed', 'position: static', 'c8'))
        self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx',
            'cancelFilter () {', 'cancelFilter () { this.appliedCategory = this.draftCategory;', 'c9'))
        self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx',
            'this.appliedCategory = this.draftCategory', "this.appliedCategory = 'all'", 'c9'))

    def test_grid_style_must_apply_to_the_product_parent(self):
        self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx', 'display: grid', 'display: block', 'c8'))

    def test_filter_reopen_must_restore_the_last_confirmed_category(self):
        self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx',
            'this.draftCategory = this.appliedCategory', "this.draftCategory = 'all'", 'c9'))

    def test_region_todo_cannot_hide_an_existing_broken_picker(self):
        self.assertFalse(self.mutated(2, 'mpx2web', 'business-page.mpx',
            '<template>', '<template><!-- TODO(web): 地区待接入 -->', 'c6'))

    def test_failed_json_or_template_is_not_successful_isolation(self):
        for assertion in ('c2', 'c5'):
            with self.subTest(assertion=assertion):
                self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx',
                    '    : {}', "    : (() => { throw new Error('broken JSON') })()", assertion))
        from unittest.mock import patch
        with patch.object(grade, 'compiled_nodes', side_effect=[[('native-scanner', {})], None]):
            self.assertFalse(grade.platform_node_isolated('', 'native-scanner'))

    def test_existing_business_checks_still_reject_bad_outputs(self):
        for old, new, assertion in [
            ('this.scanResult = event.detail.result', "this.scanResult = ''", 'c0'),
            ('this.displayName = this.draftName', "this.draftName = ''", 'c1'),
            ('mode="aspectFill"', 'mode="scaleToFill"', 'c7'),
            ('/pages/business/index', '/wrong/page', 'c10'),
        ]:
            with self.subTest(assertion=assertion):
                self.assertFalse(self.mutated(2, 'mpx', 'business-page.mpx', old, new, assertion))

    def test_ssr_globals_use_syntax_not_strings_or_comments(self):
        for source in ('const value = typeof window', "// window\nconst value = 'document navigator'", 'const value = { window: true }'):
            self.assertEqual(grade.javascript_probe('browser', source)['unsafe'], [])
        for source in ('window.location', 'typeof window.location', 'document.body', 'navigator.userAgent'):
            self.assertTrue(grade.javascript_probe('browser', source)['unsafe'])

    def test_ssr_negative_cases_preserve_original_contract(self):
        for file, old, new, assertion in [
            ('src/pages/article/index.mpx', 'return useArticleStore(this.$pinia).loadArticle', 'useArticleStore(this.$pinia).loadArticle', 'r0'),
            ('src/store/article.js', "from '@mpxjs/pinia'", "from 'other-pinia'", 'r1'),
            ('src/app.mpx', 'pinia: createPinia()', 'pinia: sharedPinia', 'r2'),
            ('src/services/article.js', 'export ', 'window.location; export ', 'r3'),
            ('src/pages/article/index.mpx', "if (__mpx_mode__ === 'wx')", "if (__mpx_mode__ === 'web')", 'r4'),
        ]:
            group = 'mpx2web' if assertion == 'r4' else 'mpx'
            with self.subTest(assertion=assertion):
                self.assertFalse(self.mutated(3, group, file, old, new, assertion))


if __name__ == '__main__':
    unittest.main()
