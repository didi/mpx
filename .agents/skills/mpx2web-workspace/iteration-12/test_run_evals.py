import io
import json
import re
from pathlib import Path
import shutil
from subprocess import CompletedProcess
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch
import run_evals as runner
import hashlib

SOURCE = Path(__file__).parent



class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve() / "iteration-test"
        # Synthetic candidates must not inherit production source-review receipts.
        shutil.copytree(SOURCE, self.root, ignore=shutil.ignore_patterns(
            "__pycache__", "mpx2web", "no_skill", ".runtime-cache",
            "static-review.json"))
        shutil.copyfile(runner.PROJECT_ROOT / '.agents/skills/mpx2web-workspace/package-lock.json', self.root.parent / 'package-lock.json')
        self.saved = runner.WORKSPACE, runner.EVAL_WORKDIR, runner.BASE.EVAL_WORKDIR
        runner.WORKSPACE = self.root
        runner.EVAL_WORKDIR = self.root.parent
        runner.BASE.EVAL_WORKDIR = self.root.parent

    def tearDown(self):
        runner.WORKSPACE, runner.EVAL_WORKDIR, runner.BASE.EVAL_WORKDIR = self.saved
        self.temp.cleanup()

    def case(self, config, eval_id):
        return next(item for item in config["evals"] if item["id"] == eval_id)

    def dispatch(self, **kwargs):
        return runner.build_prompts(model="test-model", reasoning_effort="high", **kwargs)

    def execute(self, dispatch, missing_last=False, fresh=False):
        def fake(command, **kwargs):
            neutral = Path(kwargs['cwd'])
            self.assertNotEqual(neutral, runner.EVAL_WORKDIR)
            self.assertEqual(command[command.index("-C") + 1], str(neutral))
            self.assertIn('--ignore-user-config', command)
            self.assertNotIn('-s', command)
            prompt = kwargs['input']
            advertised = Path(re.search(r'输出：把下列完整文件写入 (.*?)，', prompt).group(1))
            input_root = Path(re.search(r'输入：完整读取 (.*?) 中', prompt).group(1))
            workdir = Path(re.search(r'工作目录：将 (.*?) 作为', prompt).group(1))
            self.assertEqual(advertised, neutral / 'outputs')
            self.assertEqual(input_root, neutral / 'input')
            self.assertEqual(workdir, neutral)
            self.assertTrue(input_root.is_dir())
            self.assertNotIn('skill-workspace', prompt)
            names = dispatch["required_outputs"][:-1] if missing_last else dispatch["required_outputs"]
            for name in names:
                output = advertised / name
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_text("test fixture, not a real model answer\n")
            return CompletedProcess(command, 0, '{"type":"turn.completed","usage":{"input_tokens":10,"output_tokens":5}}\n', "")
        (runner.EVAL_WORKDIR / 'package.json').write_text('{"scripts":{"compile-validate":"node ../mpx2web/scripts/compile-validate.js"}}')
        with patch.object(runner.isolated_execution.subprocess, "run", side_effect=fake):
            return runner.run_dispatch(dispatch, fresh=fresh)

    def test_plan_is_read_only_and_has_eight_dispatches(self):
        before = runner.tree_hash(self.root)
        dispatches = self.dispatch()
        self.assertEqual(len(dispatches), 8)
        self.assertEqual(before, runner.tree_hash(self.root))
        self.assertTrue(all(d["fork_turns"] == "none" for d in dispatches))
        self.assertEqual({d["group"] for d in dispatches}, {"mpx2web", "no_skill"})

    def test_legacy_reuse_requires_original_code_contract_and_transcript(self):
        d = self.dispatch(eval_ids=[0], groups=['no_skill'])[0]
        self.execute(d)
        run = Path(d['metrics_path']).parent
        result = json.loads((run / 'run.json').read_text())
        old_fingerprint = result['fingerprint']
        result['fingerprint'] = 'old-runner-fingerprint'
        runner.write_json(run / 'run.json', result)
        self.assertFalse(runner.generation_complete(d))
        receipt = {'keep': True, 'original_fingerprint': result['fingerprint'],
                   'contract': d['semantic_contract'], 'output_digest': result['output_digest'],
                   'transcript_digest': hashlib.sha256((run / 'agent.jsonl').read_bytes()).hexdigest()}
        runner.write_json(run / 'reuse-receipt.json', receipt)
        self.assertTrue(runner.generation_complete(d))
        self.assertNotEqual(result['fingerprint'], old_fingerprint)
        (run / 'agent.jsonl').write_text('changed transcript')
        self.assertFalse(runner.generation_complete(d))

    def test_isolated_command_disables_automatic_context_and_denies_history(self):
        command = runner.isolated_execution.command(self.root, 'test-model', 'high', runner.EVAL_WORKDIR, runner.PROJECT_ROOT)
        joined = ' '.join(command)
        for argument in ('--ignore-user-config', '--ignore-rules', '--ephemeral', 'project_doc_max_bytes=0',
                         'skills.config=[', 'default_permissions="benchmark"', 'network.enabled=false'):
            self.assertIn(argument, joined)
        self.assertIn(str(Path.home() / '.agents') + '\"=\"deny\"', joined)
        self.assertNotIn('-s', command)

    def test_inputs_outputs_match_skill_only_cases(self):
        rows = self.dispatch()
        self.assertEqual(len(rows), 8)
        self.assertGreater(len(rows[0]["required_outputs"]), 1)
        self.assertNotIn("fixtures/src/pages/common/webview.mpx", rows[0]["prompt"])
        self.assertNotIn("src/components/help-card.mpx", rows[0]["required_outputs"])
        self.assertNotIn("src/components/help-item.mpx", rows[0]["required_outputs"])
        self.assertNotIn("compile-validate", rows[0]["prompt"])
        self.assertNotIn("C1.7", rows[0]["prompt"])

    def test_assessment_metadata_is_not_generator_visible(self):
        before = self.dispatch()
        config, _ = runner.load_configs()
        marker = "ASSESSMENT_ONLY_SENTINEL"
        for item in config["evals"]:
            item["title"] = marker
            item["expected_output"] = marker
            item["pending_validation"] = [marker]
            item["assertions"][0]["text"] = marker
        runner.write_json(self.root / "evals.json", config)
        after = self.dispatch()
        self.assertEqual([d["prompt"] for d in before], [d["prompt"] for d in after])
        self.assertEqual([d["fingerprint"] for d in before], [d["fingerprint"] for d in after])
        for dispatch in after:
            visible = dispatch["prompt"]
            for directory in ("input", "fixtures"):
                for path in (Path(dispatch["case_root"]) / directory).rglob("*.md"):
                    visible += path.read_text()
            self.assertNotIn(marker, visible)

    def test_changed_requirements_invalidate_generation_without_overwriting(self):
        dispatch = self.dispatch(eval_ids=[0], groups=["no_skill"])[0]
        self.execute(dispatch)
        output_hash = runner.tree_hash(Path(dispatch["output_root"]))
        requirements = self.root / "eval-0-style-layout/input/requirements.md"
        requirements.write_text(requirements.read_text() + "\nSynthetic changed task requirement.\n")
        revised = self.dispatch(eval_ids=[0], groups=["no_skill"])[0]
        self.assertNotEqual(revised["fingerprint"], dispatch["fingerprint"])
        self.assertFalse(runner.generation_complete(revised))
        with self.assertRaisesRegex(ValueError, "配置已变"):
            runner.run_dispatch(revised, resume=True)
        self.assertEqual(runner.tree_hash(Path(dispatch["output_root"])), output_hash)

    def test_missing_non_primary_output_is_failure(self):
        d = self.dispatch(eval_ids=[0], groups=["no_skill"])[0]
        result = self.execute(d, missing_last=True)
        self.assertFalse(result["output_exists"])
        self.assertFalse(runner.generation_complete(d))
        recovery = Path(result['recovery_workspace'])
        self.assertTrue((recovery / 'outputs' / d['required_outputs'][0]).is_file())
        self.assertTrue((Path(d['metrics_path']).parent / 'workspace-recovery.json').is_file())
        shutil.rmtree(recovery)

    def test_has_and_no_publish_to_declared_output_path(self):
        for d in self.dispatch(eval_ids=[0]):
            result = self.execute(d)
            self.assertTrue(runner.generation_complete(d))
            self.assertIsNone(result['recovery_workspace'])
            self.assertFalse(Path(result['cwd']).exists())

    def test_skill_path_does_not_match_workspace_prefix(self):
        base = runner.PROJECT_ROOT / '.agents/skills/mpx2web-workspace'
        for d in self.dispatch(eval_ids=[0]):
            d = dict(d)
            for key in ('prompt', 'case_root', 'output_root'):
                d[key] = d[key].replace(str(runner.EVAL_WORKDIR), str(base))
            prompt = runner.isolated_execution.mapped_prompt(d, Path('/private/tmp/neutral'),
                                                            base, runner.PROJECT_ROOT)
            self.assertNotIn('skill-workspace', prompt)
            self.assertIn('写入 /private/tmp/neutral/outputs，', prompt)
            if d['group'] == 'mpx2web':
                self.assertIn('/private/tmp/neutral/skill/SKILL.md', prompt)

    def test_retry_receipt_only_permits_exact_failed_collection(self):
        d = self.dispatch(eval_ids=[0], groups=['mpx2web'])[0]
        result = self.execute(d, missing_last=True)
        run = Path(d['metrics_path']).parent
        record = {'action': 'regenerate_missing_outputs', 'original_run': result,
                  'contract': d['semantic_contract'], 'output_digest': result['output_digest'],
                  'transcript_digest': hashlib.sha256((run / 'agent.jsonl').read_bytes()).hexdigest()}
        runner.write_json(run / 'collection-recovery.json', record)
        self.assertTrue(runner.collection_retry_allowed(d, result))
        self.assertFalse(runner.collection_retry_allowed(d, dict(result, output_exists=True)))
        changed = dict(d, semantic_contract=dict(d['semantic_contract'], skill='changed'))
        self.assertFalse(runner.collection_retry_allowed(changed, result))
        (run / 'agent.jsonl').write_text('changed transcript')
        self.assertFalse(runner.collection_retry_allowed(d, result))
        shutil.rmtree(result['recovery_workspace'])

    def test_resume_preserves_outputs_and_uses_rn_metrics(self):
        d = self.dispatch(eval_ids=[0], groups=["no_skill"])[0]
        self.execute(d)
        self.assertTrue(runner.generation_complete(d))
        metrics = json.loads(Path(d["metrics_path"]).read_text())
        self.assertEqual(metrics["total_tokens"], 15)
        with patch.object(runner.BASE, "run_dispatch", side_effect=AssertionError("must skip")):
            runner.run_dispatch(d, resume=True)
        (Path(d["output_root"]) / d["required_outputs"][0]).write_text("edited")
        self.assertFalse(runner.generation_complete(d))
        with self.assertRaisesRegex(ValueError, "已有结果"):
            runner.run_dispatch(d, resume=True)

    def test_fresh_replaces_only_the_selected_generated_artifacts(self):
        selected, untouched = self.dispatch(eval_ids=[0])
        self.execute(selected)
        self.execute(untouched)
        untouched_output_hash = runner.tree_hash(Path(untouched["output_root"]))
        untouched_run_hash = runner.tree_hash(Path(untouched["metrics_path"]).parent)
        stale_output = Path(selected["output_root"]) / "stale.txt"
        stale_run = Path(selected["metrics_path"]).parent / "stale.json"
        stale_output.write_text("old candidate artifact")
        stale_run.write_text("old run artifact")

        with self.assertRaisesRegex(ValueError, "cannot be used together"):
            runner.run_dispatch(selected, resume=True, fresh=True)
        self.execute(selected, fresh=True)

        self.assertTrue(runner.generation_complete(selected))
        self.assertFalse(stale_output.exists())
        self.assertFalse(stale_run.exists())
        self.assertEqual(runner.tree_hash(Path(untouched["output_root"])), untouched_output_hash)
        self.assertEqual(runner.tree_hash(Path(untouched["metrics_path"]).parent), untouched_run_hash)

    def test_samples_are_separate_and_never_publish_medians(self):
        rows = self.dispatch(samples=3)
        self.assertEqual(len(rows), 24)
        self.assertEqual(len({d["output_root"] for d in rows}), 24)
        self.assertNotIn("run-1/outputs", rows[0]["output_root"])
        self.assertIn("run-2/outputs", rows[8]["output_root"])

    def test_invalid_group_and_traversal_rejected(self):
        with self.assertRaises(ValueError):
            self.dispatch(groups=["mpx2rn_simple"])
        with self.assertRaises(ValueError):
            runner.inside(self.root, "../outside")

    def test_eval_schema_matches_rn17_grading_shape(self):
        config, _ = runner.load_configs()
        self.assertEqual([len(item["assertions"]) for item in config["evals"]], [7, 5, 9, 5])
        self.assertEqual(config["scoring"]["grader_method"], "deterministic_python_static_checks")
        for item in config["evals"]:
            self.assertNotIn("scope_checks", item)
            self.assertNotIn("delivery_checks", item)
            for assertion in item["assertions"]:
                self.assertEqual(set(assertion), {"id", "text"})

    def test_case_titles_and_ids_are_contiguous(self):
        config, _ = runner.load_configs()
        self.assertEqual([item["id"] for item in config["evals"]], [0, 1, 2, 3])
        self.assertEqual([item["title"] for item in config["evals"]], [
            "Web 基础适配", "从零生成资料页", "业务能力兼容", "文章页 Web SSR"
        ])


if __name__ == "__main__":
    unittest.main()
