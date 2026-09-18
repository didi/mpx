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
import grade
import hashlib

SOURCE = Path(__file__).parent


def grade_payload(expectations, **extra):
    return {"expectations": expectations,
            "user_notes_summary": {"needs_review": []}, **extra}


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve() / "iteration-test"
        # Synthetic candidates must not inherit production source-review receipts.
        shutil.copytree(SOURCE, self.root, ignore=shutil.ignore_patterns(
            "__pycache__", "mpx2web", "no_skill", ".runtime-cache",
            "static-review.json"))
        shutil.copyfile(runner.PROJECT_ROOT / '.agents/skills/mpx2web-workspace/package-lock.json', self.root.parent / 'package-lock.json')
        dependencies = runner.PROJECT_ROOT / '.agents/skills/mpx2web-workspace/node_modules'
        for relative in {source[0] for sources in grade.FRAMEWORK_SOURCES.values() for source in sources}:
            target = self.root.parent / 'node_modules' / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(dependencies / relative, target)
        self.saved = runner.WORKSPACE, runner.EVAL_WORKDIR, runner.BASE.EVAL_WORKDIR
        runner.WORKSPACE = self.root
        runner.EVAL_WORKDIR = self.root.parent
        runner.BASE.EVAL_WORKDIR = self.root.parent

    def tearDown(self):
        runner.WORKSPACE, runner.EVAL_WORKDIR, runner.BASE.EVAL_WORKDIR = self.saved
        self.temp.cleanup()

    def dispatch(self, **kwargs):
        return runner.build_prompts(model="test-model", reasoning_effort="high", **kwargs)

    def execute(self, dispatch, missing_last=False):
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
            return runner.run_dispatch(dispatch)

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

    def test_inputs_outputs_and_readonly_webview_context(self):
        rows = self.dispatch()
        self.assertGreater(len(rows[0]["required_outputs"]), 1)
        self.assertIn("fixtures/src/pages/common/webview.mpx", rows[0]["prompt"])
        self.assertNotIn("compile-validate", rows[0]["prompt"])
        self.assertNotIn("C1.8", rows[0]["prompt"])

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

    def test_grade_uses_case_ids_and_keeps_environment_unverified(self):
        config, _ = runner.load_configs()
        item = config["evals"][0]
        prompt = grade.build_grader_prompt(item, config)
        self.assertIn("event.detail", prompt)
        self.assertIn("只做静态源码评审", prompt)
        self.assertIn('user_notes_summary 必须且只能是 {"needs_review": string[]}', prompt)
        payload = grade_payload([{"id": a["id"], "passed": True, "evidence": "fixture evidence"}
                                 for a in item["assertions"]])
        result = grade.normalize_grade(payload, item, {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0})
        self.assertEqual(result["summary"]["total"], 10)
        self.assertEqual(result["grading_scope"], "source_review_only")
        self.assertEqual(result["validation"]["runtime"], "out_of_scope")
        payload["expectations"][0]["passed"] = "true"
        with self.assertRaises(ValueError):
            grade.normalize_grade(payload, item, {})

    def test_layout_review_is_case_scoped_and_not_a_generator_hint(self):
        config, _ = runner.load_configs()
        item = config["evals"][0]
        prompt = grade.build_grader_prompt(item, config)
        for text in ("实际布局父子关系", "fixed 只按题面要求的视口定位语义判断",
                     "externalClasses、virtualHost 和 CSS 变量", "C1.1～C1.6 只评已有源码",
                     "C1.7～C1.11 只评新建 help-card/help-item", "needs_review"):
            self.assertIn(text, prompt)
        self.assertEqual([a["id"] for a in item["assertions"]], ["C1.1", "C1.2", "C1.4", "C1.5", "C1.6", "C1.7", "C1.8", "C1.9", "C1.10", "C1.11"])
        c15 = next(row["text"] for row in item["assertions"] if row["id"] == "C1.5")
        self.assertIn("不得仅因位于同一页面、scroll-view 或组件链中", c15)
        metadata = json.loads((self.root / "eval-0-style-layout/eval_metadata.json").read_text())
        self.assertEqual(set(metadata), {"eval_id", "eval_name", "prompt", "source_metadata"})
        self.assertEqual(metadata["prompt"], item["prompt"])
        self.assertNotIn("runtime_validation", item)
        for other in config["evals"][1:]:
            self.assertNotIn("C1.1～C1.6 只评已有源码", grade.build_grader_prompt(other, config))
        for dispatch in self.dispatch(eval_ids=[0]):
            self.assertNotIn("实际布局父子关系", dispatch["prompt"])
            self.assertNotIn("C1.1～C1.6 只评已有源码", dispatch["prompt"])
        for dispatch in self.dispatch(eval_ids=[0]):
            self.assertIn("src/components/help-item.mpx", dispatch["required_outputs"])
            self.assertNotIn("C1.11", dispatch["prompt"])
        self.assertIn("options.externalClasses = options.externalClasses ||", prompt)
        self.assertIn("function processExternalClasses", prompt)

    def test_grade_accepts_reordering_but_rejects_missing_duplicate_and_unknown_ids(self):
        config, _ = runner.load_configs()
        item = config["evals"][1]
        metrics = {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0}
        rows = [{"id": a["id"], "passed": index % 2 == 0, "evidence": a["id"] + " source"}
                for index, a in enumerate(item["assertions"])]
        result = grade.normalize_grade(grade_payload(list(reversed(rows))), item, metrics)
        self.assertEqual([row["id"] for row in result["expectations"]], [row["id"] for row in rows])
        self.assertEqual([row["passed"] for row in result["expectations"]], [row["passed"] for row in rows])
        for invalid in (rows[:-1], rows + [rows[0]], [rows[0]] + rows[:-1],
                        [dict(rows[0], id="unknown")] + rows[1:], {}, [None] + rows[1:]):
            with self.assertRaises(ValueError):
                grade.normalize_grade(grade_payload(invalid), item, metrics)

    def test_confirmed_readonly_violation_is_not_left_pending(self):
        config, _ = runner.load_configs()
        item = config["evals"][2]
        d = self.dispatch(eval_ids=[2], groups=["no_skill"])[0]
        self.execute(d)
        metrics = {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0}
        rows = [{"id": a["id"], "passed": True, "evidence": "source"} for a in item["assertions"]]
        rows[2].update(passed=False, review_status="pending")
        result = grade.normalize_grade(grade_payload(rows), item, metrics)
        grade.check_readonly_files(result, d, item)
        self.assertEqual(result["expectations"][2]["review_status"], "pending")
        readonly = Path(d["output_root"]) / item["readonly_files"][0]
        readonly.write_text("synthetic readonly violation, not a real candidate\n")
        grade.check_readonly_files(result, d, item)
        checked = next(row for row in result["expectations"] if row["id"] == "C3.3")
        self.assertFalse(checked["passed"])
        self.assertNotIn("review_status", checked)
        self.assertIn("只读依赖缺失或被修改", checked["evidence"])

    def test_class_component_query_is_not_overridden_by_regex(self):
        config, _ = runner.load_configs()
        item = config["evals"][1]
        d = self.dispatch(eval_ids=[1], groups=["no_skill"])[0]
        self.execute(d)
        page = Path(d["output_root"]) / "src/pages/panel/index.mpx"
        page.write_text("""<script>
this.selectComponent('#first-choice')
this.selectAllComponents('.choice')
</script>
""")
        metrics = {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0}
        rows = [{"id": a["id"], "passed": True, "evidence": "model evidence"}
                for a in item["assertions"]]
        result = grade.normalize_grade(grade_payload(rows), item, metrics)
        c25 = next(row for row in result["expectations"] if row["id"] == "C2.5")
        self.assertTrue(c25["passed"])
        self.assertEqual(c25["evidence"], "model evidence")
        prompt = grade.build_grader_prompt(item, config)
        self.assertIn("不能仅凭出现 class 选择器", prompt)
        self.assertIn("同一业务路径上的有效 id/ref/等价兜底", prompt)

    def test_proxy_keywords_do_not_force_pending_review_to_pass(self):
        config, _ = runner.load_configs()
        item = config["evals"][1]
        d = self.dispatch(eval_ids=[1], groups=["mpx2web"])[0]
        output = Path(d["output_root"])
        (output / "src/composables").mkdir(parents=True, exist_ok=True)
        (output / "src/components").mkdir(parents=True, exist_ok=True)
        (output / "src/composables/use-ready-notice.js").write_text("""import { getCurrentInstance } from '@mpxjs/core'
export function useReadyNotice () {
  const current = getCurrentInstance()
  const component = current && current.proxy
  return () => component && component.recordReady()
}
""")
        (output / "src/components/composition-counter.mpx").write_text("""<script>
import { onMounted } from '@mpxjs/core'
import { useReadyNotice } from '../composables/use-ready-notice'
const notifyReady = useReadyNotice()
onMounted(notifyReady)
function recordReady () {}
</script>
""")
        metrics = {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0}
        rows = [{"id": a["id"], "passed": True, "evidence": "model evidence"}
                for a in item["assertions"]]
        rows[2].update(passed=False, review_status="pending")
        result = grade.normalize_grade(grade_payload(rows), item, metrics)
        c23 = next(row for row in result["expectations"] if row["id"] == "C2.3")
        self.assertFalse(c23["passed"])
        self.assertEqual(c23["review_status"], "pending")
        self.assertEqual(c23["evidence"], "model evidence")
        self.assertIn("零散关键词", grade.build_grader_prompt(item, config))
        self.assertEqual(result["summary"]["passed"], len(rows) - 1)

    def test_minimal_wxs_review_does_not_restore_removed_gesture_requirements(self):
        config, _ = runner.load_configs()
        prompt = grade.build_grader_prompt(config["evals"][1], config)
        self.assertIn("分别追踪 WXS 事件", prompt)
        for removed in ("坐标计算", "0～100", "取消回弹", "手势算法"):
            self.assertNotIn(removed, prompt)
        for dispatch in self.dispatch(eval_ids=[1]):
            self.assertIn("src/components/event-actions.mpx", dispatch["required_outputs"])
            self.assertNotIn("src/components/gesture-slider.mpx", dispatch["required_outputs"])
            self.assertNotIn("分别追踪 WXS 事件", dispatch["prompt"])

    def test_split_criteria_and_delivery_checks_do_not_change_generation(self):
        config, _ = runner.load_configs()
        self.assertEqual([len(item["assertions"]) for item in config["evals"]], [10, 5, 6, 9])
        self.assertEqual(sum(len(item["assertions"]) for item in config["evals"]), 30)
        self.assertNotIn("common_gates", config)
        self.assertEqual(config["evals"][0]["scope_checks"][0]["id"], "S1.1")
        c19 = next(row for row in config["evals"][0]["assertions"] if row["id"] == "C1.9")
        self.assertEqual((c19["category"], c19["capability"]), ("generation", "style"))
        item = config["evals"][3]
        payload = grade_payload(
            [{"id": a["id"], "passed": True, "evidence": "code evidence"} for a in item["assertions"]],
            delivery_review=[{"id": check["id"], "status": "failed", "evidence": "missing note"}
                             for check in item["delivery_checks"]],
        )
        result = grade.normalize_grade(payload, item, {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0})
        self.assertEqual(result["summary"]["passed"], 9)
        self.assertEqual([r["status"] for r in result["delivery_review"]], ["failed"] * 5)
        before = [d["fingerprint"] for d in self.dispatch()]
        config["evals"][3]["assertions"][0]["text"] += "评审规则修订"
        config["evals"][3]["delivery_checks"][0]["text"] += "说明规则修订"
        runner.write_json(self.root / "evals.json", config)
        self.assertEqual([d["fingerprint"] for d in self.dispatch()], before)

    def test_pending_source_and_unknown_delivery_status_are_not_confirmed_passes(self):
        item = {"assertions": [{"id": "x", "text": "x"}]}
        payload = grade_payload([{"id": "x", "passed": False, "review_status": "pending",
                                  "evidence": "cannot establish chain"}])
        result = grade.normalize_grade(payload, item, {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0})
        self.assertEqual(result["expectations"][0]["review_status"], "pending")
        payload["expectations"][0]["passed"] = True
        with self.assertRaisesRegex(ValueError, "pending review"):
            grade.normalize_grade(payload, item, {})
        with self.assertRaisesRegex(ValueError, "delivery review"):
            grade.normalize_reviews([{"id": "d", "status": "unknown"}], [{"id": "d", "text": "d"}])

    def test_user_notes_summary_requires_exact_non_empty_string_list_schema(self):
        item = {"assertions": [{"id": "x", "text": "x"}]}
        metrics = {"duration_ms": 1, "total_tokens": 2, "tool_calls": 0}
        expectations = [{"id": "x", "passed": True, "evidence": "source"}]
        result = grade.normalize_grade(
            {"expectations": expectations,
             "user_notes_summary": {"needs_review": ["  浏览器确认  "]}},
            item, metrics,
        )
        self.assertEqual(result["user_notes_summary"], {"needs_review": ["浏览器确认"]})
        for invalid in (None, {}, {"needs_review": "浏览器确认"},
                        {"needs_review": [1]}, {"needs_review": [" "]},
                        {"needs_review": [], "extra": []}):
            payload = {"expectations": expectations}
            if invalid is not None:
                payload["user_notes_summary"] = invalid
            with self.assertRaisesRegex(ValueError, "user_notes_summary|needs_review"):
                grade.normalize_grade(payload, item, metrics)

    def test_notice_review_preserves_payload_and_does_not_leak_web_solution(self):
        config, _ = runner.load_configs()
        item = config["evals"][1]
        prompt = grade.build_grader_prompt(item, config)
        for text in ("notice 发送到页面接收", "triggerEvent 的第三个传播参数",
                     "等价通知链", "TODO、空方法或硬编码结果", "needs_review"):
            self.assertIn(text, prompt)
        self.assertEqual([a["id"] for a in item["assertions"]], ["C2.1", "C2.2", "C2.3", "C2.5", "C2.6"])
        metadata = json.loads((self.root / "eval-1-events-instance/eval_metadata.json").read_text())
        self.assertEqual(set(metadata), {"eval_id", "eval_name", "prompt", "source_metadata"})
        self.assertEqual(metadata["prompt"], item["prompt"])
        self.assertNotIn("runtime_validation", item)
        for other in config["evals"]:
            if other["id"] != 1:
                self.assertNotIn("notice 发送到页面接收", grade.build_grader_prompt(other, config))
        requirements = (self.root / "eval-1-events-instance/input/requirements.md").read_text()
        self.assertNotIn("连续点击两次后次数为 2", requirements)
        self.assertIn("每次只递增一次", item["assertions"][1]["text"])
        for dispatch in self.dispatch(eval_ids=[1]):
            for hint in ("notice 发送到页面接收", "$emit", "逐层转发", "第三个传播参数"):
                self.assertNotIn(hint, dispatch["prompt"] + requirements)

    def test_incomplete_generation_cannot_be_graded(self):
        d = self.dispatch(eval_ids=[0], groups=["no_skill"])[0]
        config, _ = runner.load_configs()
        with self.assertRaisesRegex(ValueError, "生成失败"):
            grade.grade_run(d, config["evals"][0], config, "grader", "high")

    def test_framework_evidence_is_current_scoped_and_grading_only(self):
        config, _ = runner.load_configs()
        item = config["evals"][1]
        prompts = [grade.build_grader_prompt(i, config) for i in config["evals"]]
        self.assertIn("Vue.prototype.triggerEvent", prompts[1])
        self.assertIn("return this.$emit(eventName, eventObj)", prompts[1])
        for prompt in prompts:
            self.assertNotIn("expOrFn.split(',')", prompt)
            self.assertNotIn("Case 2 监听评审", prompt)
            self.assertNotIn("两处多字段监听", prompt)
        self.assertIn("名称编辑只验收确认、取消和状态更新", prompts[2])
        self.assertIn("implemented[key].remove", prompts[2])
        self.assertIn("global.__mpx.config.webConfig.routeConfig", prompts[3])
        self.assertIn("不以同名但未被消费的字段或另一组 # 地址", prompts[3])
        self.assertIn("return createElement('div'", prompts[0])
        self.assertIn("this[callbackName].apply(this, params)", prompts[1])
        self.assertIn("return currentInstance && { proxy: currentInstance }", prompts[1])
        self.assertIn("this.content.textContent = opts.content", prompts[2])
        self.assertIn("const chooseLocation = envError('chooseLocation')", prompts[2])
        self.assertIn("inheritEvent('timeupdate', e, {})", prompts[2])
        self.assertIn("detail = extend({}, oe.detail, detail)", prompts[2])
        self.assertIn("const newContext =", prompts[3])
        self.assertIn("global.__mpxTransRpxFn = ${webConfig.transRpxFn}", prompts[3])
        self.assertNotIn("expOrFn.split(',')", prompts[0])
        for d in self.dispatch():
            self.assertNotIn("专项框架摘录", d["prompt"])
            self.assertNotIn("full-file sha256", d["prompt"])
        d = self.dispatch(eval_ids=[1], groups=["no_skill"])[0]
        self.execute(d)
        before = grade.grade_fingerprint(d, item, config, "grader", "high")
        source = self.root.parent / "node_modules" / grade.FRAMEWORK_SOURCES[1][0][0]
        source.write_text(source.read_text() + "\n// synthetic framework revision\n")
        self.assertNotEqual(before, grade.grade_fingerprint(d, item, config, "grader", "high"))
        self.assertTrue(runner.generation_complete(d))
        source.unlink()
        with self.assertRaisesRegex(ValueError, "missing framework grading evidence"):
            grade.build_grader_prompt(item, config)

    def test_case_local_framework_changes_preserve_other_grade_fingerprints(self):
        config, _ = runner.load_configs()
        before = {}
        dispatches = self.dispatch(groups=["no_skill"])
        for d in dispatches:
            before[d["eval_id"]] = grade.grade_fingerprint(d, config["evals"][d["eval_id"]], config, "grader", "high")
        source = self.root.parent / "node_modules/@mpxjs/webpack-plugin/lib/web/processMainScript.js"
        source.write_text(source.read_text() + "\n// synthetic router framework revision\n")
        for d in dispatches:
            after = grade.grade_fingerprint(d, config["evals"][d["eval_id"]], config, "grader", "high")
            self.assertEqual(before[d["eval_id"]] != after, d["eval_id"] == 3)

    def test_api_grading_uses_real_platform_branches_and_web_video_event_shape(self):
        config, _ = runner.load_configs()
        prompt = grade.build_grader_prompt(config["evals"][2], config)
        self.assertIn("JS 和 JSON 中的 /* @mpx-if */", prompt)
        self.assertIn("不能作为平台隔离", prompt)
        self.assertIn("Web JSON 的 usingComponents 仍解析该实现", prompt)
        self.assertIn("必须判失败", prompt)
        self.assertIn("分享服务未接入", prompt)
        self.assertIn("不得仅因源码或交付说明没有字面量 TODO 判失败", prompt)
        self.assertIn("Web inheritEvent 会透传原生事件 target", prompt)
        self.assertIn("不能仅因出现 event.target 判失败", prompt)
        assertions = {row["id"]: row["text"] for row in config["evals"][2]["assertions"]}
        self.assertIn("不要求必须出现字面量 TODO", assertions["C3.1"])
        self.assertIn("JS 中的 @mpx 条件注释不是有效分支", assertions["C3.2"])
        self.assertIn("仅在模板隐藏 native-scanner 不足以证明隔离", assertions["C3.3"])
        self.assertIn("Web JSON 仍通过 usingComponents 解析", assertions["C3.3"])
        self.assertIn("JS 中的 @mpx 条件注释不是有效分支", assertions["C3.5"])
        self.assertIn("JSON 中的 @mpx 条件注释会被当作普通注释", assertions["C3.6"])
        self.assertIn("inheritEvent 透传原生 target", assertions["C3.4"])
        for index in (0, 1, 3):
            other = grade.build_grader_prompt(config["evals"][index], config)
            self.assertNotIn("JS 和 JSON 中的 /* @mpx-if */", other)
            self.assertNotIn("Web inheritEvent 会透传原生事件 target", other)

    def test_router_and_ssr_evidence_follows_declared_urls_and_official_store_contract(self):
        config, _ = runner.load_configs()
        prompts = [grade.build_grader_prompt(item, config) for item in config["evals"]]
        for index in (3,):
            self.assertIn("options.mode || 'hash'", prompts[index])
            self.assertIn("function getHash ()", prompts[index])
            self.assertIn("global.__mpx.config.webConfig.routeConfig", prompts[index])
        self.assertIn("区分构建配置、运行时 routeConfig 和部署服务器规则", prompts[3])
        self.assertIn("C4.3 不把服务器 rewrite 或真实刷新当作已验证结果", prompts[3])
        self.assertIn("export function processAppOption", prompts[3])
        self.assertIn("this.__mpxProxy.callHook(ONLOAD, [query])", prompts[3])
        self.assertIn("waitForServerPrefetch(child, resolve, reject)", prompts[3])
        self.assertIn("repository/packages/pinia/src/index.web.js", prompts[3])
        self.assertIn("Pinia must be created in the onAppInit lifecycle", prompts[3])
        self.assertIn("SSR 中仅支持使用 `@mpxjs/pinia`", prompts[3])
        self.assertIn("不以库名、方法名或部署说明代替完整调用链", prompts[3])
        self.assertIn("C4.6 只评官方 Pinia SSR 状态传输", prompts[3])
        self.assertIn("C4.7 只评服务端请求级隔离", prompts[3])
        self.assertIn("C4.8 只评同一客户端 store 的异步竞态", prompts[3])
        self.assertIn("C4.9 只评 SSR 服务端的浏览器 API 安全", prompts[3])
        self.assertIn("C4.10 只评微信 onLoad 加载链保留", prompts[3])
        assertions = {row["id"]: row["text"] for row in config["evals"][3]["assertions"]}
        self.assertIn("旧 createStore 迁移到 @mpxjs/pinia", assertions["C4.6"])
        self.assertIn("客户端是否重复请求及展开/收起交互属于运行验证", assertions["C4.6"])
        self.assertIn("不得只因未使用 Pinia 在本项再次扣分", assertions["C4.7"])
        self.assertIn("Pinia 迁移与 hydration 统一归 C4.6", assertions["C4.7"])
        self.assertNotIn("a=40ms", assertions["C4.7"])
        self.assertIn("a=40ms、b=10ms", assertions["C4.8"])
        self.assertIn("无条件提交晚到结果时不通过", assertions["C4.8"])
        self.assertIn("浏览器专属逻辑", assertions["C4.9"])
        self.assertNotIn("微信 onLoad 加载链保留", assertions["C4.9"])
        self.assertIn("微信端页面 onLoad", assertions["C4.10"])
        for index in (0, 1, 2):
            self.assertNotIn("C4.5～C4.10 沿服务端预取 Promise", prompts[index])
            self.assertNotIn("options.mode || 'hash'", prompts[index])
        for dispatch in self.dispatch():
            self.assertNotIn("C4.5～C4.10 沿服务端预取 Promise", dispatch["prompt"])

    def test_missing_token_metrics_are_not_reported_as_zero(self):
        import aggregate_benchmark
        d = self.dispatch(eval_ids=[0], groups=["no_skill"])[0]
        self.execute(d)
        for invalid in (None, "15", True, -1):
            runner.write_json(Path(d["metrics_path"]), {"total_tokens": invalid})
            with self.assertRaisesRegex(ValueError, "total_tokens"):
                aggregate_benchmark.generation_tokens(d)
        runner.write_json(Path(d["metrics_path"]), {"total_tokens": 0})
        self.assertEqual(aggregate_benchmark.generation_tokens(d), 0)

    def test_grader_starts_outside_git_readonly_and_resume_preserves_generation(self):
        d = self.dispatch(eval_ids=[0], groups=["no_skill"])[0]
        self.execute(d)
        config, _ = runner.load_configs()
        item = config["evals"][0]
        payload = grade_payload([{"id": a["id"], "passed": True, "evidence": "fixture evidence"}
                                 for a in item["assertions"]])
        before = runner.tree_hash(Path(d["output_root"]))

        def fake(command, **kwargs):
            neutral = Path(kwargs["cwd"])
            self.assertFalse((neutral / ".git").exists())
            self.assertEqual(command[:2], ["test-codex", "exec"])
            self.assertIn('--skip-git-repo-check', command)
            self.assertEqual(command[command.index("-C") + 1], str(neutral))
            self.assertNotIn('-s', command)
            self.assertIn('default_permissions="benchmark"', command)
            self.assertTrue(any(str(neutral) + '\"=\"read\"' in part for part in command))
            self.assertEqual(command[-1], "-")
            self.assertTrue((neutral / "outputs/src/components/help-card.mpx").is_file())
            kwargs["stdout"].write(json.dumps({"type": "item.completed", "item": {
                "type": "agent_message", "text": json.dumps(payload)}}) + "\n")
            return SimpleNamespace(stdin=io.StringIO(), poll=lambda: 0, returncode=0)

        with patch.object(grade.subprocess, "Popen", side_effect=fake) as launch:
            result = grade.grade_run(d, item, config, "grader", "high", codex_bin="test-codex")
            resumed = grade.grade_run(d, item, config, "grader", "high", resume=True, codex_bin="test-codex")
        self.assertEqual(result['expectations'], resumed['expectations'])
        self.assertEqual(result['summary'], resumed['summary'])
        launch.assert_called_once()
        self.assertEqual(before, runner.tree_hash(Path(d["output_root"])))
        self.assertTrue(runner.generation_complete(d))

    def test_complete_report_and_stale_output_rejection(self):
        import aggregate_benchmark
        config, _ = runner.load_configs()
        items = {i["id"]: i for i in config["evals"]}
        dispatches = self.dispatch()
        with self.assertRaises(ValueError):
            aggregate_benchmark.aggregate("test-model", "high")
        for d in dispatches:
            self.execute(d)
            item = items[d["eval_id"]]
            metrics = json.loads(Path(d["metrics_path"]).read_text())
            payload = {
                "expectations": [{"id": a["id"], "passed": True, "evidence": "schema-test-only fixture"}
                                 for a in item["assertions"]],
                "scope_review": [{"id": check["id"], "status": "passed", "evidence": "scope fixture"}
                                 for check in item.get("scope_checks", [])],
                "user_notes_summary": {"needs_review": [f"runtime fixture case {item['id']}"]},
            }
            result = grade.normalize_grade(payload, item, metrics)
            result["grader"] = {"model": "test-grader", "reasoning_effort": "high"}
            result["grading_fingerprint"] = grade.grade_fingerprint(d, item, config, "test-grader", "high")
            runner.write_json(Path(d["metrics_path"]).parent / "grading.json", result)
        with patch("subprocess.Popen", side_effect=AssertionError("static report must not launch tools")):
            report = aggregate_benchmark.aggregate("test-model", "high")
        self.assertEqual(len(report["runs"]), 8)
        self.assertEqual(report["metadata"]["runs_per_configuration"], 1)
        self.assertEqual(list(report["run_summary"]), ["mpx2web", "no_skill", "delta"])
        self.assertTrue(all(row["result"]["tokens"] == 15 for row in report["runs"]))
        self.assertEqual(report["metadata"]["grading_scope"], "source_review_only")
        for group in ("mpx2web", "no_skill"):
            self.assertEqual(report["run_summary"][group]["tokens"]["mean"], 60)
            self.assertEqual(report["classification"]["adaptation"]["counts"][group], {"passed": 25, "total": 25})
            self.assertEqual(report["review_status"]["adaptation"][group]["confirmed_pass_rate"], 1)
            self.assertEqual(report["review_status"]["all_assertions"][group]["confirmed_pass_rate"], 1)
            self.assertEqual(report["scope_status"][group]["invalid"], 0)
        self.assertEqual(report["review_status"]["primary_scope"], "adaptation")
        self.assertEqual(len(report["runtime_followups"]), 8)
        self.assertTrue(all(row["runtime_followups"] for row in report["runs"]))
        self.assertTrue(report["metadata"]["scope_comparison_eligible"])
        self.assertFalse(report["metadata"]["formal_publishable"])
        self.assertEqual(report["metadata"]["benchmark_tier"], "development")
        self.assertIn("只检查源码", (self.root / "benchmark.md").read_text())
        self.assertIn("开发级源码结果", (self.root / "benchmark.md").read_text())
        self.assertIn("待运行验证（不计分）", (self.root / "benchmark.md").read_text())
        self.assertNotIn(" ± ", (self.root / "benchmark.md").read_text())
        self.assertEqual(report["metadata"]["score_weighting"],
                         "assertion_micro_per_sample_primary_case_macro_diagnostic")
        self.assertIn("不能据此", " ".join(report["notes"]))
        Path(dispatches[0]["output_path"]).write_text("changed after grading")
        with self.assertRaisesRegex(ValueError, "stale generation"):
            aggregate_benchmark.aggregate("test-model", "high")

    def test_ssr_is_source_only_and_resume_does_not_launch_tools(self):
        d = self.dispatch(eval_ids=[3], groups=["no_skill"])[0]
        self.execute(d)
        config, _ = runner.load_configs()
        item = config["evals"][3]
        payload = grade_payload([{"id": a["id"], "passed": True, "evidence": "source evidence"}
                                 for a in item["assertions"]])
        def fake(command, **kwargs):
            kwargs["stdout"].write(json.dumps({"type": "item.completed", "item": {
                "type": "agent_message", "text": json.dumps(payload)}}) + "\n")
            return SimpleNamespace(stdin=io.StringIO(), poll=lambda: 0, returncode=0)
        with patch.object(grade.subprocess, "Popen", side_effect=fake) as model:
            first = grade.grade_run(d, item, config, "grader", "high")
        model.assert_called_once()
        with patch("subprocess.Popen", side_effect=AssertionError("resume must not launch any tool")):
            second = grade.grade_run(d, item, config, "grader", "high", resume=True)
        self.assertEqual(first["summary"], second["summary"])
        self.assertNotIn("runtime_review", second)
        self.assertNotIn("ssr_acceptance", second)
        self.assertFalse((Path(d["metrics_path"]).parent / "runtime-validation.json").exists())


class SharedReportTests(unittest.TestCase):
    def test_pending_review_keeps_denominator_and_reports_micro_bounds(self):
        import aggregate_benchmark
        rows = [{"configuration": "no_skill", "result": {"passed": 1, "total": 3},
                 "expectations": [{"passed": False, "review_status": "pending"}]},
                {"configuration": "no_skill", "result": {"passed": 4, "total": 4}, "expectations": []}]
        status = aggregate_benchmark.review_bounds(rows)["no_skill"]
        self.assertEqual(status, {"pending_assertions": 1, "confirmed_pass_rate": 0.7143, "upper_pass_rate": 0.8571})
        rows[0]["expectations"][0]["passed"] = True
        with self.assertRaisesRegex(ValueError, "pending review"):
            aggregate_benchmark.review_bounds(rows)

    def test_primary_review_bounds_filter_generation_and_scope_failure_blocks_comparison(self):
        import aggregate_benchmark
        rows = [{
            "configuration": "mpx2web", "run_number": 1,
            "result": {"passed": 2, "total": 2},
            "expectations": [
                {"id": "adapt", "passed": True},
                {"id": "generation", "passed": False, "review_status": "pending"},
            ],
            "scope_review": [{"id": "S1", "status": "failed", "evidence": "changed input"}],
        }]
        primary = aggregate_benchmark.review_bounds(rows, ["adapt"])["mpx2web"]
        self.assertEqual(primary, {"pending_assertions": 0, "confirmed_pass_rate": 1.0,
                                   "upper_pass_rate": 1.0})
        scope = aggregate_benchmark.scope_status(rows)
        self.assertEqual(rows[0]["scope_state"], "invalid")
        self.assertEqual(scope["mpx2web"], {"valid": 0, "needs_review": 0,
                                             "invalid": 1, "not_applicable": 0, "total": 1})

    def test_scope_status_does_not_report_missing_checks_as_valid(self):
        import aggregate_benchmark
        rows = [
            {"configuration": "mpx2web", "scope_review": []},
            {"configuration": "mpx2web", "scope_review": [
                {"id": "S1", "status": "passed", "evidence": "checked"},
            ]},
        ]
        scope = aggregate_benchmark.scope_status(rows)
        self.assertEqual([row["scope_state"] for row in rows], ["not_applicable", "valid"])
        self.assertEqual(scope["mpx2web"], {"valid": 1, "needs_review": 0,
                                             "invalid": 0, "not_applicable": 1, "total": 2})

    def test_runtime_followups_are_preserved_per_run(self):
        import aggregate_benchmark
        rows = [{"eval_id": 3, "configuration": "no_skill", "run_number": 1,
                 "notes": [], "user_notes_summary": {"needs_review": ["SSR 首屏", "微信 onLoad"]}}]
        result = aggregate_benchmark.runtime_followups(rows)
        self.assertEqual(result[0]["items"], ["SSR 首屏", "微信 onLoad"])
        self.assertEqual(rows[0]["runtime_followups"], ["SSR 首屏", "微信 onLoad"])
        self.assertEqual(rows[0]["notes"], ["SSR 首屏", "微信 onLoad"])

    def test_assertion_micro_is_primary_and_case_macro_is_diagnostic(self):
        import static_review
        common = runner.load_module("aggregate_micro_test", runner.SKILL_CREATOR / "scripts/aggregate_benchmark.py")
        runs = [
            {"configuration": "mpx2web", "run_number": 1,
             "result": {"passed": 1, "total": 1, "pass_rate": 1,
                        "time_seconds": 1, "tokens": 10}},
            {"configuration": "mpx2web", "run_number": 1,
             "result": {"passed": 0, "total": 9, "pass_rate": 0,
                        "time_seconds": 2, "tokens": 20}},
        ]
        micro = static_review.aggregate_assertion_micro({"mpx2web": runs, "no_skill": []}, common)
        macro = common.aggregate_results({"mpx2web": [row["result"] for row in runs], "no_skill": []})
        self.assertEqual(micro["mpx2web"]["pass_rate"]["mean"], 0.1)
        self.assertEqual(micro["mpx2web"]["time_seconds"]["mean"], 3)
        self.assertEqual(micro["mpx2web"]["tokens"]["mean"], 30)
        self.assertEqual(macro["mpx2web"]["pass_rate"]["mean"], 0.5)

    def test_nested_outputs_and_real_sample_count(self):
        common = runner.load_module("aggregate_under_test", runner.SKILL_CREATOR / "scripts/aggregate_benchmark.py")
        viewer = runner.load_module("viewer_under_test", runner.SKILL_CREATOR / "eval-viewer/generate_review.py")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            case = root / "eval-0-fixture"
            runner.write_json(case / "eval_metadata.json", {"eval_id": 0, "prompt": "test prompt"})
            for group in ("mpx2web", "no_skill"):
                output = case / group / "outputs/src/components/test.mpx"
                output.parent.mkdir(parents=True)
                output.write_text("test")
                runner.write_json(case / group / "run-1/grading.json", {
                    "summary": {"pass_rate": 1, "passed": 1, "failed": 0, "total": 1},
                    "expectations": [{"text": "test", "passed": True, "evidence": "fixture"}],
                })
            benchmark = common.generate_benchmark(root)
            self.assertEqual(benchmark["metadata"]["runs_per_configuration"], 1)
            runs = viewer.find_runs(root)
            self.assertEqual(len(runs), 2)
            self.assertEqual(runs[0]["outputs"][0]["name"], "src/components/test.mpx")
            extra = case / "mpx2web/run-2/outputs/a.mpx"
            extra.parent.mkdir(parents=True)
            extra.write_text("test2")
            runs = viewer.find_runs(root)
            self.assertEqual(len(runs), 3)
            self.assertTrue(all(r["prompt"] == "test prompt" for r in runs))


if __name__ == "__main__":
    unittest.main()
