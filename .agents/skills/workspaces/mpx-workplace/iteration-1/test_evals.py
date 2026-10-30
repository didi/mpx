import json
from pathlib import Path
import shutil
from subprocess import CompletedProcess
import tempfile
import unittest
from unittest.mock import patch

import grade
import run_evals as runner

SOURCE = Path(__file__).resolve().parent


class WorkflowTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve() / 'repo/.agents/skills/workspaces/mpx-workplace/iteration-1'
        self.root.mkdir(parents=True)
        for filename in ('evals.json', 'prompt_templates.json'):
            shutil.copy2(SOURCE / filename, self.root / filename)
        for case in SOURCE.glob('eval-*'):
            shutil.copytree(case / 'input', self.root / case.name / 'input')
        skill = self.root.parents[2] / 'mpx/SKILL.md'
        skill.parent.mkdir()
        skill.write_text('Synthetic test Skill')
        for module, field, value in ((runner, 'WORKSPACE', self.root),
                                     (runner, 'EVAL_WORKDIR', self.root.parent),
                                     (grade, 'WORKSPACE', self.root)):
            patcher = patch.object(module, field, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def dispatches(self, **kwargs):
        return runner.build_prompts(model='test-model', reasoning_effort='high', **kwargs)

    def execute(self, dispatch):
        def fake(command, **kwargs):
            self.assertEqual(kwargs['cwd'], self.root.parent)
            self.assertEqual(command[command.index('-C') + 1], str(self.root.parent))
            for name in dispatch['output_files']:
                target = Path(dispatch['output_path']) / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text('Synthetic test output')
            return CompletedProcess(command, 0, json.dumps({
                'type': 'turn.completed', 'usage': {'input_tokens': 10, 'output_tokens': 2}}), '')
        with patch.object(runner.subprocess, 'run', side_effect=fake):
            return runner.run_dispatch(dispatch)

    def test_dispatches_are_isolated_and_noskill_reads_no_skill(self):
        rows = self.dispatches()
        self.assertEqual(len(rows), 16)
        for row in rows:
            self.assertNotIn('{{', row['prompt'])
            self.assertNotIn('mpx2rn-workspace', row['prompt'])
            self.assertFalse(Path(row['metrics_path']).exists())
            if row['group'] == 'noskill':
                self.assertIsNone(row['skill_path'])
                self.assertNotIn('skill', runner.fingerprints(row))
        self.assertEqual(len(self.dispatches(eval_ids=[0], groups=['mpx'])), 1)
        with self.assertRaises(ValueError):
            self.dispatches(groups=['mpx2rn'])

    def test_mock_execution_preserves_usage_and_rejects_overwrite(self):
        row = self.dispatches(eval_ids=[0], groups=['mpx'])[0]
        self.assertTrue(self.execute(row)['output_exists'])
        self.assertEqual(json.loads(Path(row['metrics_path']).read_text())['total_tokens'], 12)
        with self.assertRaisesRegex(ValueError, 'run already exists'):
            self.execute(row)

    def test_pending_reviews_never_become_final_scores(self):
        config, _ = runner.load_configs()
        for row in self.dispatches():
            self.execute(row)
            case = config['evals'][row['eval_id']]
            grade.prepare(case, Path(row['metrics_path']).parent)
        with self.assertRaisesRegex(ValueError, 'pending reviews'):
            grade.aggregate()
        self.assertFalse((self.root / 'benchmark.json').exists())
        for path in self.root.glob('eval-*/*/run-1/assessment.json'):
            assessment = json.loads(path.read_text())
            for item in assessment['expectations']:
                item.update(status='passed', evidence=['Synthetic test evidence'])
            grade.write_json(path, assessment)
        result = grade.aggregate()
        self.assertEqual(result['weighted_summary']['mpx']['total'], 48)
        self.assertEqual(result['weighted_summary']['noskill']['passed'], 48)
        path = next(self.root.glob('eval-*/*/run-1/assessment.json'))
        assessment = json.loads(path.read_text())
        assessment['expectations'][0]['status'] = 'pending'
        grade.write_json(path, assessment)
        with self.assertRaisesRegex(ValueError, 'pending reviews'):
            grade.aggregate()
        self.assertFalse((self.root / 'benchmark.json').exists())


if __name__ == '__main__':
    unittest.main()
