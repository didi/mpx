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


class EvalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve() / 'iteration-1'
        shutil.copytree(SOURCE, self.root, ignore=shutil.ignore_patterns(
            '__pycache__', 'mpx', 'mpx2ali', 'benchmark.json'))
        self.saved = runner.WORKSPACE, runner.EVAL_WORKDIR, grade.WORKSPACE
        runner.WORKSPACE, runner.EVAL_WORKDIR, grade.WORKSPACE = self.root, self.root.parent, self.root

    def tearDown(self):
        runner.WORKSPACE, runner.EVAL_WORKDIR, grade.WORKSPACE = self.saved
        self.temp.cleanup()

    def dispatches(self, **kwargs):
        return runner.build_prompts(model='test-model', reasoning_effort='high', **kwargs)

    def execute(self, dispatch, missing=False):
        def fake(command, **kwargs):
            self.assertEqual(kwargs['cwd'], runner.EVAL_WORKDIR)
            self.assertEqual(command[command.index('-C') + 1], str(runner.EVAL_WORKDIR))
            self.assertEqual(kwargs['input'], dispatch['prompt'])
            for name in dispatch['output_files'][:-1] if missing else dispatch['output_files']:
                target = Path(dispatch['output_path']) / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text('Synthetic fixture: not a real model result.\n')
            return CompletedProcess(command, 0, json.dumps({
                'type': 'turn.completed', 'usage': {'input_tokens': 10,
                'cached_input_tokens': 6, 'output_tokens': 5}}) + '\n', '')
        with patch.object(runner.subprocess, 'run', side_effect=fake):
            return runner.run_dispatch(dispatch)

    def reviewed_matrix(self):
        config, _ = runner.load_configs()
        for dispatch in self.dispatches():
            self.execute(dispatch)
            case = config['evals'][dispatch['eval_id']]
            run_dir = Path(dispatch['metrics_path']).parent
            grade.prepare(case, run_dir)
            data = grade.read_json(run_dir / 'assessment.json')
            for item in data['expectations']:
                item.update(passed=True, evidence='Synthetic test evidence; never a model score.')
            grade.write_json(run_dir / 'assessment.json', data)

    def test_matrix_metadata_and_isolation(self):
        rows = self.dispatches()
        self.assertEqual(len(rows), 6)
        config, templates = runner.load_configs()
        self.assertEqual([len(c['assertions']) for c in config['evals']], [4, 5, 6])
        assertions = [a for c in config['evals'] for a in c['assertions']]
        self.assertEqual(len({a['id'] for a in assertions}), 15)
        sources = [source for a in assertions for source in a['covers']]
        sources += config['consolidation']['common_requirement_sources']
        self.assertEqual(len(sources), len(set(sources)))
        self.assertEqual(set(sources), {f'a{case}{item}' for case in range(6) for item in range(6)})
        self.assertEqual(set(templates['templates']), {'mpx', 'mpx2ali'})
        for case in config['evals']:
            directory = self.root / f"eval-{case['id']}-{case['name']}"
            metadata = grade.read_json(directory / 'eval_metadata.json')
            self.assertEqual(metadata['prompt'], case['prompt'])
            self.assertEqual(metadata['assertions'], case['assertions'])
            self.assertEqual(set(case['files']), {str(p.relative_to(directory))
                for p in (directory / 'input').rglob('*') if p.is_file()})
        for row in rows:
            self.assertEqual(row['model'], 'test-model')
            self.assertEqual(row['fork_turns'], 'none')
            self.assertIn('wx、ali', row['prompt'])
            self.assertIn('只能使用本组指定的 Skill', row['prompt'])
            self.assertIn(row['skill_path'], row['prompt'])
            self.assertNotIn('{{', row['prompt'])
        for case in config['evals']:
            case['assertions'][0]['text'] = 'PRIVATE_SCORING_SENTINEL'
        grade.write_json(self.root / 'evals.json', config)
        self.assertEqual([r['prompt'] for r in rows], [r['prompt'] for r in self.dispatches()])

    def test_local_navigation_contract(self):
        config, _ = runner.load_configs()
        case = config['evals'][2]
        self.assertNotIn('旧版本替代', case['prompt'])
        navigation = next(a for a in case['assertions'] if a['id'] == 'a50')
        self.assertIn('自动转换', navigation['text'])
        for row in self.dispatches():
            self.assertIn('npm 官方源', row['prompt'])
            self.assertNotIn('本地仓库当前', row['prompt'])
            self.assertIn('skill-snapshots', row['skill_path'])

    def test_rejects_bad_selection_and_missing_model(self):
        for args in ({'eval_ids': [99]}, {'groups': ['mpx2rn']}, {'groups': []}):
            with self.assertRaises(ValueError):
                self.dispatches(**args)
        with self.assertRaises(ValueError):
            runner.build_prompts()

    def test_stages_dependencies_but_never_answers(self):
        for row in self.dispatches():
            output = Path(row['output_path'])
            self.assertFalse(any((output / name).exists() for name in row['output_files']))
            self.assertFalse(list(output.rglob('*requirements.md')))
            if row['eval_id'] == 2:
                self.assertTrue((output / 'utils/window-info.js').is_file())
                self.assertTrue((output / 'components/info-badge.mpx').is_file())

    def test_execution_metadata_and_metrics(self):
        row = self.dispatches(eval_ids=[0], groups=['mpx'])[0]
        result = self.execute(row)
        self.assertTrue(result['output_exists'])
        self.assertTrue(result['sources_unchanged'])
        run_dir = Path(row['metrics_path']).parent
        metrics = grade.read_json(run_dir / 'metrics.json')
        self.assertEqual(metrics['total_tokens'], 15)
        self.assertEqual(metrics['cached_input_tokens'], 6)
        self.assertTrue((run_dir / 'source-snapshot.json').is_file())
        with self.assertRaisesRegex(ValueError, 'run already exists'):
            self.execute(row)

    def test_missing_usage_is_unknown_and_multiple_turns_sum(self):
        self.assertIsNone(runner.extract_metrics('', 100)['total_tokens'])
        events = '\n'.join(json.dumps({'type': 'turn.completed', 'usage': {
            'input_tokens': 10, 'output_tokens': 2}}) for _ in range(2))
        self.assertEqual(runner.extract_metrics(events, 100)['total_tokens'], 24)

    def test_missing_secondary_output_fails(self):
        row = self.dispatches(eval_ids=[0], groups=['mpx'])[0]
        self.assertFalse(self.execute(row, missing=True)['output_exists'])
        config, _ = runner.load_configs()
        with self.assertRaisesRegex(ValueError, 'incomplete execution'):
            grade.load_run(config['evals'][0], 'mpx')

    def test_unrun_or_unreviewed_never_emits_benchmark(self):
        with self.assertRaisesRegex(ValueError, 'missing run artifact'):
            grade.aggregate()
        row = self.dispatches(eval_ids=[0], groups=['mpx'])[0]
        self.execute(row)
        config, _ = runner.load_configs()
        case = config['evals'][0]
        grade.prepare(case, Path(row['metrics_path']).parent)
        with self.assertRaisesRegex(ValueError, 'unreviewed assertion'):
            grade.grade_run(case, 'mpx')
        self.assertFalse((self.root / 'benchmark.json').exists())

    def test_complete_review_aggregates_for_viewer(self):
        self.reviewed_matrix()
        benchmark = grade.aggregate()
        self.assertEqual(len(benchmark['runs']), 6)
        self.assertEqual(benchmark['metadata']['runs_per_configuration'], 1)
        self.assertEqual(benchmark['metadata']['executor_model'], 'test-model')
        self.assertEqual(benchmark['weighted_summary']['mpx2ali']['total'], 15)
        self.assertEqual(benchmark['run_summary']['mpx']['tokens']['mean'], 15)
        self.assertTrue((self.root / 'benchmark.md').is_file())
        assessment_path = self.root / 'eval-0-text-image-adaptation/mpx/run-1/assessment.json'
        assessment = grade.read_json(assessment_path)
        assessment['expectations'][0]['passed'] = False
        grade.write_json(assessment_path, assessment)
        benchmark = grade.aggregate()
        self.assertAlmostEqual(benchmark['weighted_summary']['mpx']['pass_rate'], 14 / 15)
        self.assertAlmostEqual(benchmark['run_summary']['mpx']['pass_rate']['mean'], (3 / 4 + 1 + 1) / 3, places=4)
        self.assertIn('| mpx | 14 / 15 | 93.33% |', (self.root / 'benchmark.md').read_text())

    def test_mixed_model_cannot_be_compared(self):
        self.reviewed_matrix()
        path = next(self.root.glob('eval-*/mpx/run-1/run.json'))
        data = grade.read_json(path)
        data['model'] = 'different-model'
        grade.write_json(path, data)
        with self.assertRaisesRegex(ValueError, 'same model'):
            grade.aggregate()


if __name__ == '__main__':
    unittest.main()
