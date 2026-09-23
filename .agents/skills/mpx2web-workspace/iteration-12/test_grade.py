import json
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

    def test_current_ssr_page_and_app_prefetch_are_both_accepted(self):
        item = next(item for item in grade.load_config()['evals'] if item['id'] == 3)
        case = WORKSPACE / f"eval-3-{item['name']}"
        self.assertTrue(verdicts(grade.check_eval_3(case / 'mpx2web' / 'outputs'))['C6.1'])
        self.assertTrue(verdicts(grade.check_eval_3(case / 'no_skill' / 'outputs'))['C6.1'])

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

    def test_pseudo_condition_comments_do_not_count_as_platform_isolation(self):
        root = WORKSPACE / 'eval-2-api-share-components/no_skill/outputs'
        result = verdicts(grade.check_eval_2(root))
        self.assertFalse(result['C3.2'])
        self.assertFalse(result['C3.3'])
        self.assertFalse(result['C3.5'])
        self.assertFalse(result['C3.6'])

    def test_image_inside_wx_only_structure_is_not_a_web_lazy_load_failure(self):
        source = WORKSPACE / 'eval-2-api-share-components/mpx2web/outputs'
        self.assertTrue(verdicts(grade.check_eval_2(source))['C5.2'])
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            shutil.copytree(source, target, dirs_exist_ok=True)
            page = target / 'src/pages/catalog/index.mpx'
            page.write_text(page.read_text().replace('      @wx\n      type="aligned"', '      type="aligned"'))
            self.assertFalse(verdicts(grade.check_eval_2(target))['C5.2'])

    def test_readonly_scanner_change_fails_scanner_assertion(self):
        source = WORKSPACE / 'eval-2-api-share-components/mpx2web/outputs'
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            shutil.copytree(source, target, dirs_exist_ok=True)
            (target / 'src/vendor/native-scanner/index.mpx').write_text('changed')
            self.assertFalse(verdicts(grade.check_eval_2(target))['C3.3'])

    def test_grading_schema_matches_rn17(self):
        grading = grade.grade_run(3, 'mpx2web', 1)
        self.assertEqual(set(grading), {'eval_id', 'run_kind', 'expectations', 'summary', 'metrics', 'timing', 'execution_metrics'})
        for row in grading['expectations']:
            self.assertEqual(set(row), {'id', 'text', 'passed', 'evidence'})
            self.assertIn(row['evidence'], ('PASS', 'FAIL'))


if __name__ == '__main__':
    unittest.main()
