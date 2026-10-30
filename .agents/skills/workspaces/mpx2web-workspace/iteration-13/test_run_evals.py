import json
from pathlib import Path
import shutil
from subprocess import CompletedProcess
import tempfile
import unittest
from unittest.mock import patch
import aggregate_benchmark
import run_evals as runner

SOURCE = Path(__file__).resolve().parent


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve() / 'iteration-13'
        shutil.copytree(SOURCE, self.root, ignore=shutil.ignore_patterns(
            '__pycache__', 'mpx', 'mpx2web', 'benchmark.json'))
        self.saved = runner.WORKSPACE, runner.EVAL_WORKDIR
        runner.WORKSPACE, runner.EVAL_WORKDIR = self.root, self.root.parent

    def tearDown(self):
        runner.WORKSPACE, runner.EVAL_WORKDIR = self.saved
        self.temp.cleanup()

    def dispatches(self, **kwargs):
        return runner.build_prompts(model='test-model', reasoning_effort='high', **kwargs)

    def execute(self, dispatch, missing_last=False):
        def fake(command, **kwargs):
            self.assertEqual(kwargs['cwd'], runner.EVAL_WORKDIR)
            self.assertEqual(command[command.index('-C') + 1], str(runner.EVAL_WORKDIR))
            self.assertEqual(kwargs['input'], dispatch['prompt'])
            names = dispatch['output_files'][:-1] if missing_last else dispatch['output_files']
            for name in names:
                output = Path(dispatch['output_path']) / name
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_text('Synthetic executor fixture, not a model result.\n')
            return CompletedProcess(command, 0,
                '{"type":"turn.completed","usage":{"input_tokens":10,"output_tokens":5}}\n', '')
        with patch.object(runner.subprocess, 'run', side_effect=fake):
            return runner.run_dispatch(dispatch)

    def test_four_cases_eight_dispatches_use_selected_model_without_forking(self):
        rows = self.dispatches()
        self.assertEqual(len(rows), 8)
        for row in rows:
            self.assertEqual(row['model'], 'test-model')
            self.assertEqual(row['reasoning_effort'], 'high')
            self.assertEqual(row['fork_turns'], 'none')
            self.assertEqual(row['workdir'], str(runner.EVAL_WORKDIR))
            self.assertNotIn('{{', row['prompt'])
        self.assertEqual(len(list(self.root.glob('eval-*'))), 4)

    def test_requires_explicit_model_and_effort(self):
        for model, effort in ((None, 'high'), ('test-model', None)):
            with self.assertRaisesRegex(ValueError, 'must be explicitly set'):
                runner.build_prompts(model=model, reasoning_effort=effort)

    def test_rejects_unknown_cases_and_groups(self):
        for selection in ({'eval_ids': [4]}, {'eval_ids': []}, {'groups': ['mpx2rn']}, {'groups': []}):
            with self.assertRaisesRegex(ValueError, 'unknown or empty'):
                self.dispatches(**selection)

    def test_prompts_share_task_and_exclude_assessment(self):
        before = self.dispatches()
        config, templates = runner.load_configs()
        for item in config['evals']:
            case = self.root / f"eval-{item['id']}-{item['name']}"
            metadata = json.loads((case / 'eval_metadata.json').read_text())
            self.assertEqual(metadata['prompt'], item['prompt'])
            self.assertEqual(set(item['files']), {
                str(p.relative_to(case)) for p in (case / 'input').rglob('*') if p.is_file()
            })
            item['assertions'][0]['text'] = 'ASSESSMENT_ONLY_SENTINEL'
        (self.root / 'evals.json').write_text(json.dumps(config))
        after = self.dispatches()
        self.assertEqual([r['prompt'] for r in before], [r['prompt'] for r in after])
        for index in range(0, len(before), 2):
            mpx, web = before[index:index + 2]
            self.assertEqual(mpx['output_files'], web['output_files'])
            for row, group, other in ((mpx, 'mpx', 'mpx2web'), (web, 'mpx2web', 'mpx')):
                self.assertNotIn('compile-validate', row['prompt'])
                self.assertIn('只能使用本组指定的 Skill', row['prompt'])
                self.assertIn(str(runner.PROJECT_ROOT / f'.agents/skills/{group}/SKILL.md'), row['prompt'])
                self.assertNotIn(str(runner.PROJECT_ROOT / f'.agents/skills/{other}/SKILL.md'), row['prompt'])
        self.assertEqual(set(templates['templates']), {'mpx', 'mpx2web'})

    def test_stages_dependencies_without_staging_answers_or_requirements(self):
        for row in self.dispatches(eval_ids=[0, 2]):
            output = Path(row['output_path'])
            case = output.parent.parent
            dependencies = [p for p in (case / 'input').rglob('*')
                            if p.is_file() and p.suffix != '.md'
                            and str(p.relative_to(case / 'input')) not in row['output_files']]
            self.assertTrue(dependencies)
            for source in dependencies:
                self.assertEqual((output / source.relative_to(case / 'input')).read_bytes(), source.read_bytes())
            self.assertFalse(list(output.rglob('*.md')))
            self.assertFalse(any((output / name).exists() for name in row['output_files']))

    def test_command_matches_rn_cwd_model_and_sandbox_contract(self):
        dispatch = self.dispatches(eval_ids=[0], groups=['mpx'])[0]
        command = runner.build_codex_command(dispatch)
        self.assertEqual(command[command.index('-m') + 1], 'test-model')
        self.assertIn('model_reasoning_effort="high"', command)
        self.assertEqual(command[command.index('-s') + 1], 'workspace-write')
        self.assertEqual(command[-1], '-')
        self.assertNotIn('compile-validate', ' '.join(command))

    def test_execution_writes_real_usage_timing_and_status(self):
        for dispatch in self.dispatches(eval_ids=[1]):
            result = self.execute(dispatch)
            self.assertTrue(result['output_exists'])
            run = Path(dispatch['metrics_path']).parent
            self.assertEqual(json.loads((run / 'metrics.json').read_text())['total_tokens'], 15)
            self.assertEqual(json.loads((run / 'timing.json').read_text())['total_tokens'], 15)
            self.assertEqual(json.loads((run / 'run.json').read_text())['returncode'], 0)
            self.assertTrue((run / 'agent.jsonl').is_file())
            self.assertTrue((run / 'stderr.log').is_file())

    def test_missing_non_primary_output_is_failure(self):
        dispatch = self.dispatches(eval_ids=[3], groups=['mpx'])[0]
        self.assertFalse(self.execute(dispatch, missing_last=True)['output_exists'])

    def test_refuses_execution_outside_workspace(self):
        dispatch = self.dispatches(eval_ids=[1], groups=['mpx'])[0]
        dispatch['output_path'] = '/outside/outputs'
        with self.assertRaisesRegex(ValueError, 'output path must stay under'):
            runner.run_dispatch(dispatch)

    def test_aggregate_rejects_unrun_suite(self):
        with self.assertRaisesRegex(ValueError, 'missing run artifact'):
            aggregate_benchmark.aggregate('test-model', 'high')
        self.assertFalse((self.root / 'benchmark.json').exists())


if __name__ == '__main__':
    unittest.main()
