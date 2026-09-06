import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


WORKSPACE = Path(__file__).parent
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("grade", WORKSPACE / "grade.py")
GRADE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GRADE)


class GradeContractTest(unittest.TestCase):
    def test_independent_grader_prompt_is_configuration_blind(self):
        item = {
            "prompt": "修复页面",
            "assertions": [
                {"id": "a", "text": "保留入口"},
                {"id": "b", "text": "完成 Web 修复"},
            ],
        }
        prompt = GRADE.build_grader_prompt(item)
        self.assertIn("a: 保留入口", prompt)
        self.assertIn("b: 完成 Web 修复", prompt)
        for group in GRADE.PUBLIC_GROUPS:
            self.assertNotIn(group, prompt)
        self.assertNotIn("Has Skill", prompt)
        self.assertNotIn("No Skill", prompt)

    def test_missing_model_verdict_fails_closed(self):
        item = {
            "assertions": [
                {"id": "a", "text": "第一项"},
                {"id": "b", "text": "第二项"},
            ],
        }
        expectations = GRADE.normalize_model_grade(item, {
            "expectations": [
                {"id": "a", "passed": True, "evidence": "outputs/a"}
            ]
        })
        self.assertTrue(expectations[0]["passed"])
        self.assertFalse(expectations[1]["passed"])

    def test_inconclusive_deterministic_check_keeps_independent_verdict(self):
        item = {"assertions": [{"id": "probe", "text": "语义等价实现"}]}
        expectations = [{
            "id": "probe",
            "text": "语义等价实现",
            "passed": True,
            "evidence": "独立评审确认调用链完整",
            "verification_methods": ["independent_code_review"],
        }]
        with patch.dict(GRADE.CHECKS, {"probe": lambda root: (None, "静态分析无法证明")}):
            checked = GRADE.apply_deterministic_checks(item, expectations, Path("."))
        self.assertTrue(checked[0]["passed"])
        self.assertEqual(checked[0]["deterministic_check"]["status"], "unknown")
        self.assertIn("deterministic_check_inconclusive", checked[0]["verification_methods"])

    def test_json_fence_parser(self):
        payload = GRADE.parse_json_payload(
            '```json\n{"expectations": [], "claims": []}\n```'
        )
        self.assertEqual(payload["expectations"], [])

    def test_compile_failure_keeps_functional_grade_and_sets_strict_zero(self):
        with tempfile.TemporaryDirectory() as directory:
            run_root = Path(directory) / "run-1"
            run_root.mkdir()
            (run_root / "run.json").write_text(json.dumps({
                "fingerprint": "candidate",
                "returncode": 0,
                "outputs_complete": True,
                "compile_status": "failed",
            }))
            (run_root / "compile.json").write_text(json.dumps({
                "status": "failed",
                "checks": [{
                    "kind": "mpx-conditional-compile-semantics",
                    "passed": False,
                    "detail": {
                        "files": [{
                            "file": "/tmp/page.mpx",
                            "errors": [{
                                "line": 8,
                                "message": "脚本中的 @mpx-if 是普通注释",
                            }],
                        }],
                    },
                }],
            }))
            item = {
                "id": 7,
                "name": "compile-failure",
                "assertions": [
                    {"id": "a", "text": "保留入口"},
                    {"id": "b", "text": "完成 Web 修复"},
                ],
            }
            model_fingerprint = GRADE.model_grader_fingerprint(
                item, run_root, "gpt-5.5", "high"
            )
            (run_root / "model-grading.json").write_text(json.dumps({
                "model_grading_fingerprint": model_fingerprint,
                "grader": {
                    "model": "gpt-5.5",
                    "reasoning_effort": "high",
                    "blind_configuration": True,
                    "duration_ms": 10,
                },
                "expectations": [
                    {"id": "a", "text": "保留入口", "passed": True, "evidence": "a"},
                    {"id": "b", "text": "完成 Web 修复", "passed": True, "evidence": "b"},
                ],
            }))
            with patch.object(GRADE.subprocess, "run") as grader_run:
                grade = GRADE.grade_run(
                    item, "no_skill", run_root, "gpt-5.5", "high"
                )
            grader_run.assert_not_called()
            self.assertEqual(grade["summary"]["pass_rate"], 1.0)
            self.assertEqual(grade["strict_delivery_summary"]["pass_rate"], 0.0)
            self.assertTrue(all(entry["passed"] for entry in grade["expectations"]))

    def test_audit_separates_compile_failure_from_functional_score(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            item = {
                "id": 0,
                "name": "fixture",
                "assertions": [{"id": "manual", "text": "保留业务入口"}],
            }
            (root / "evals.json").write_text(json.dumps({
                "skill_name": "mpx2web",
                "iteration": 11,
                "evals": [item],
            }))
            for group in GRADE.PUBLIC_GROUPS:
                run_root = root / f"eval-0-fixture/{group}/run-1"
                run_root.mkdir(parents=True)
                (run_root / "grading.json").write_text(json.dumps({
                    "expectations": [{
                        "id": "manual",
                        "text": "保留业务入口",
                        "passed": True,
                        "evidence": "模型认为功能正确",
                    }],
                }))
                (run_root / "compile.json").write_text(json.dumps({
                    "status": "failed",
                    "checks": [{"kind": "web-compile", "passed": False}],
                }))
            audited = GRADE.audit_workspace(root)
            self.assertTrue(all(row["passed"] == 1 for row in audited["results"]))
            self.assertTrue(all(row["strict_passed"] == 0 for row in audited["results"]))

    def test_method_discovery_accepts_vue2_property_functions_and_arrows(self):
        source = """
export default {
  methods: {
    init: async function () { await import('sdk') },
    cleanup: () => { release() }
  }
}
"""
        self.assertIn("init", GRADE.method_names(source))
        self.assertIn("cleanup", GRADE.method_names(source))
        self.assertIn("await import", GRADE.method_body(source, "init"))
        self.assertIn("release", GRADE.method_body(source, "cleanup"))

    def test_three_sample_aggregation_writes_json_and_markdown(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "evals.json").write_text(json.dumps({
                "skill_name": "mpx2web",
                "iteration": 11,
                "evals": [],
            }))
            rows = []
            totals = {}
            for group in GRADE.PUBLIC_GROUPS:
                for sample in (1, 2, 3):
                    rows.append({
                        "eval_id": 0,
                        "eval_name": "fixture",
                        "configuration": group,
                        "run_number": sample,
                        "passed": 1,
                        "strict_passed": 1,
                        "failed": 0,
                        "total": 1,
                        "pass_rate": 1.0,
                        "expectations": [{
                            "id": "a",
                            "passed": True,
                            "category": "web-template",
                        }],
                        "compile_status": "passed",
                        "compiled_mpx_count": 1,
                        "compile_eligible_mpx_count": 1,
                        "all_declared_outputs_present": True,
                        "total_tokens": 10,
                        "duration_ms": 100,
                        "tool_calls": 1,
                        "output_lines": 5,
                        "output_bytes": 20,
                    })
                totals[group] = {
                    "runs": 3,
                    "passed": 3,
                    "total": 3,
                    "pass_rate": 1.0,
                    "strict_passed": 3,
                    "strict_pass_rate": 1.0,
                }
            with patch.object(
                GRADE,
                "audit_workspace",
                return_value={"results": rows, "totals": totals},
            ):
                benchmark = GRADE.aggregate_benchmark(root, 3)
            self.assertEqual(benchmark["run_summary"]["mpx2web"]["sample_stddev"], 0.0)
            self.assertTrue((root / "benchmark.json").is_file())
            self.assertTrue((root / "benchmark.md").is_file())
            self.assertTrue((root / "review.html").is_file())

    def test_rpx_checker_accepts_complete_conversion_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "outputs/vue.config.js"
            output.parent.mkdir()
            output.write_text(
                "module.exports = { webConfig: { transRpxFn: function (value) {\n"
                "  if (value === 0) return 0\n"
                "  return value / 100\n"
                "} } }\n"
            )
            passed, evidence = GRADE.check_t1(root)
            self.assertTrue(passed, evidence)

    def test_rpx_checker_rejects_missing_zero_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "outputs/vue.config.js"
            output.parent.mkdir()
            output.write_text(
                "module.exports = { webConfig: { transRpxFn: function (value) {\n"
                "  return value / 100\n"
                "} } }\n"
            )
            passed, _ = GRADE.check_t1(root)
            self.assertFalse(passed)

    def test_public_audit_covers_all_three_samples(self):
        payload = GRADE.audit_workspace(WORKSPACE)
        assertions_per_sample = sum(
            len(item["assertions"])
            for item in json.loads((WORKSPACE / "evals.json").read_text())["evals"]
        )
        self.assertEqual(len(payload["results"]), 78)
        self.assertEqual(
            {row["run_number"] for row in payload["results"]},
            {1, 2, 3},
        )
        for group in GRADE.PUBLIC_GROUPS:
            with self.subTest(group=group):
                self.assertEqual(payload["totals"][group]["runs"], 39)
                self.assertEqual(
                    payload["totals"][group]["total"],
                    assertions_per_sample * 3,
                )

    def test_write_grades_cannot_fake_an_independent_regrade(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            item = {
                "id": 0,
                "name": "fixture",
                "assertions": [{"id": "manual", "text": "保留业务入口"}],
            }
            (root / "evals.json").write_text(json.dumps({
                "skill_name": "mpx2web",
                "iteration": 11,
                "evals": [item],
            }))
            for group in GRADE.PUBLIC_GROUPS:
                run_root = root / f"eval-0-fixture/{group}/run-1"
                run_root.mkdir(parents=True)
                (run_root / "run.json").write_text(json.dumps({"fingerprint": "candidate"}))
                (run_root / "grading.json").write_text(json.dumps({
                    "grading_fingerprint": "old-checker",
                    "grader": {"model": "gpt-5.5", "reasoning_effort": "high"},
                    "expectations": [{"id": "manual", "text": "保留业务入口", "passed": True, "evidence": "outputs/page.mpx"}],
                }))
            GRADE.audit_workspace(root, write_grades=True)
            run_root = root / "eval-0-fixture/mpx2web/run-1"
            written = json.loads((run_root / "grading.json").read_text())
            self.assertNotIn("grading_fingerprint", written)
            self.assertEqual(
                written["grading_status"], "requires_independent_regrade"
            )

    def test_grade_has_no_internal_workspace_dependency(self):
        self.assertNotIn("iteration-11-internal", (WORKSPACE / "grade.py").read_text())

    def test_share_lifecycle_checker_requires_real_web_removal(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/member/invite.mpx"
            page.parent.mkdir(parents=True)
            page.write_text("""
<script>
import { createPage, implement } from '@mpxjs/core'
if (__mpx_mode__ === 'web') {
  implement('onShareAppMessage', { modes: ['web'], remove: true, processor: () => {} })
  implement('onShareTimeline', { modes: ['web'], remove: true, processor: () => {} })
}
createPage({
  onShareAppMessage () { return { title: '邀请' } },
  onShareTimeline () { return { title: '邀请' } }
})
</script>
""")
            passed, evidence = GRADE.check_s1(root)
            self.assertTrue(passed, evidence)

            page.write_text("""
<script>
createPage({
  // @mpx-if (__mpx_mode__ === 'wx')
  onShareAppMessage () { return { title: '邀请' } },
  onShareTimeline () { return { title: '邀请' } }
  // @mpx-endif
})
</script>
""")
            passed, _ = GRADE.check_s1(root)
            self.assertFalse(passed)

    def test_ssr_client_flag_accepts_page_on_ready(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/article/detail.mpx"
            page.parent.mkdir(parents=True)
            page.write_text("""
<template>
  <view class="browser-share" wx:if="{{clientMounted}}">分享</view>
</template>
<script>
createPage({
  data: { clientMounted: false },
  onReady () {
    if (__mpx_mode__ === 'web') this.clientMounted = true
  }
})
</script>
""")
            passed, evidence = GRADE.check_x3(root)
            self.assertTrue(passed, evidence)

            page.write_text(page.read_text().replace("this.clientMounted = true", "this.clientMounted = false"))
            passed, _ = GRADE.check_x3(root)
            self.assertFalse(passed)

    def test_route_checkers_accept_wx_calls_converted_by_cross_platform_build(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            checkout = root / "outputs/src/pages/checkout/index.mpx"
            address = root / "outputs/src/pages/address/select.mpx"
            checkout.parent.mkdir(parents=True)
            address.parent.mkdir(parents=True)
            checkout.write_text(
                "chooseAddress () {\n"
                "  wx.navigateTo({\n"
                "    url: '/pages/address/select',\n"
                "    events: { selected () {} },\n"
                "    success (res) { res.eventChannel.emit('current', {}) }\n"
                "  })\n"
                "}\n"
                "openDetail () { wx.navigateTo({ url: '/pages/detail/index' }) }\n"
                "replaceResult () { wx.redirectTo({ url: '/pages/result/index' }) }\n"
                "restartLogin () { wx.reLaunch({ url: '/pages/login/index' }) }\n"
                "openOrders () { wx.switchTab({ url: '/pages/orders/index' }) }\n"
            )
            address.write_text(
                "confirm () {\n"
                "  const channel = this.getOpenerEventChannel()\n"
                "  channel.emit('selected', {})\n"
                "  wx.navigateBack()\n"
                "}\n"
            )
            for checker in (GRADE.check_n0, GRADE.check_n1, GRADE.check_n2):
                with self.subTest(checker=checker.__name__):
                    passed, evidence = checker(root)
                    self.assertTrue(passed, evidence)

    def test_event_channel_template_accepts_button_and_rejects_inert_view_or_bad_open_type(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            checkout = root / "outputs/src/pages/checkout/index.mpx"
            checkout.parent.mkdir(parents=True)
            checkout.write_text(
                '<template><button bindtap="chooseAddress">选择地址</button>'
                '<navigator url="/pages/detail/index" open-type="navigate">详情</navigator></template>'
            )
            passed, evidence = GRADE.check_n3(root)
            self.assertTrue(passed, evidence)

            checkout.write_text(
                '<template><view bindtap="chooseAddress">选择地址</view></template>'
            )
            passed, _ = GRADE.check_n3(root)
            self.assertFalse(passed)

            checkout.write_text(
                '<template><button bindtap="chooseAddress">选择地址</button>'
                '<navigator url="/pages/detail/index" open-type="navigateTo">详情</navigator></template>'
            )
            passed, _ = GRADE.check_n3(root)
            self.assertFalse(passed)

    def test_route_config_accepts_direct_web_config_object_and_object_assign(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / "outputs/src/app.mpx"
            config = root / "outputs/vue.config.js"
            app.parent.mkdir(parents=True)
            config.parent.mkdir(parents=True, exist_ok=True)
            config.write_text("module.exports = { publicPath: '/shop/' }\n")
            variants = (
                "mpx.config.webConfig = { routeConfig: { mode: 'history', base: '/shop/' } }",
                "mpx.config.webConfig = Object.assign({}, mpx.config.webConfig, { "
                "routeConfig: { mode: 'history', base: '/shop/' } })",
            )
            for source in variants:
                with self.subTest(source=source):
                    app.write_text(f"<script>{source}</script>\n")
                    passed, evidence = GRADE.check_n4(root)
                    self.assertTrue(passed, evidence)

    def test_scroll_refresh_accepts_web_event_or_web_ref_guard_without_forcing_ref_at_web(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            feed = root / "outputs/src/pages/feed/index.mpx"
            feed.parent.mkdir(parents=True)
            feed.write_text(
                '<template><scroll-view wx:ref="feedScroll">'
                '<image bindload@web="onImageLoad" /></scroll-view></template>'
                '<script>createPage({ methods: { onImageLoad () {'
                'this.$nextTick(() => { this.$refs.feedScroll.refresh() })'
                '} } })</script>'
            )
            passed, evidence = GRADE.check_b2(root)
            self.assertTrue(passed, evidence)

            feed.write_text(
                '<template><scroll-view ref@web="feedScroll">'
                '<image bindload="onImageLoad" /></scroll-view></template>'
                '<script>createPage({ methods: { onImageLoad () {'
                'this.$nextTick(() => {'
                'const feedScroll = this.$refs && this.$refs.feedScroll; '
                'if (feedScroll) feedScroll.refresh()'
                '}) } } })</script>'
            )
            passed, evidence = GRADE.check_b2(root)
            self.assertTrue(passed, evidence)

            feed.write_text(
                '<template><scroll-view wx:ref="feedScroll">'
                '<image bindload="onImageLoad" /></scroll-view></template>'
                '<script>createPage({ methods: { onImageLoad () {'
                'this.$nextTick(() => { this.$refs.feedScroll.refresh() })'
                '} } })</script>'
            )
            passed, _ = GRADE.check_b2(root)
            self.assertFalse(passed)

    def test_task_checker_accepts_framework_promise_returned_task(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/search/index.mpx"
            service = root / "outputs/src/services/search.js"
            page.parent.mkdir(parents=True)
            service.parent.mkdir(parents=True)
            service.write_text(
                "import mpx from '@mpxjs/core'\n"
                "export function requestSuggestions (keyword) {\n"
                "  return mpx.request({ url: '/suggestions', data: { keyword } })\n"
                "}\n"
            )
            page.write_text(
                "search () {\n"
                "  this.cancelSuggestionRequest()\n"
                "  const request = requestSuggestions(this.keyword)\n"
                "  this.suggestionRequest = request\n"
                "}\n"
                "cancelSuggestionRequest () {\n"
                "  const request = this.suggestionRequest\n"
                "  this.suggestionRequest = null\n"
                "  if (request && request.__returned) request.__returned.abort()\n"
                "}\n"
                "onUnload () { this.cancelSuggestionRequest() }\n"
            )
            passed, evidence = GRADE.check_q2(root)
            self.assertTrue(passed, evidence)

    def test_task_checker_accepts_saved_promise_returned_task_alias(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/search/index.mpx"
            service = root / "outputs/src/services/search.js"
            page.parent.mkdir(parents=True)
            service.parent.mkdir(parents=True)
            service.write_text(
                "import mpx from '@mpxjs/core'\n"
                "export function requestSuggestions (keyword) {\n"
                "  return mpx.request({ url: '/suggestions', data: { keyword } })\n"
                "}\n"
            )
            page.write_text(
                "search () {\n"
                "  this.cancelSuggestionRequest()\n"
                "  const promise = requestSuggestions(this.keyword)\n"
                "  const task = promise.__returned\n"
                "  this.suggestionTask = task\n"
                "}\n"
                "cancelSuggestionRequest () {\n"
                "  const task = this.suggestionTask\n"
                "  this.suggestionTask = null\n"
                "  this.suggestionGeneration += 1\n"
                "  if (task && task.abort) task.abort()\n"
                "}\n"
                "onUnload () { this.cancelSuggestionRequest() }\n"
            )
            passed, evidence = GRADE.check_q2(root)
            self.assertTrue(passed, evidence)

    def test_task_checker_accepts_named_api_direct_task(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/search/index.mpx"
            service = root / "outputs/src/services/search.js"
            page.parent.mkdir(parents=True)
            service.parent.mkdir(parents=True)
            service.write_text(
                "import { request } from '@mpxjs/api-proxy'\n"
                "export function requestSuggestions (keyword) {\n"
                "  return request({ url: '/suggestions', data: { keyword } })\n"
                "}\n"
            )
            page.write_text(
                "search () {\n"
                "  this.cancelSuggestionRequest()\n"
                "  const task = requestSuggestions(this.keyword)\n"
                "  this.suggestionTask = task\n"
                "}\n"
                "cancelSuggestionRequest () {\n"
                "  const task = this.suggestionTask\n"
                "  this.suggestionTask = null\n"
                "  if (task) task.abort()\n"
                "}\n"
                "onUnload () { this.cancelSuggestionRequest() }\n"
            )
            passed, evidence = GRADE.check_q2(root)
            self.assertTrue(passed, evidence)

    def test_task_checker_rejects_named_api_as_promise_returned_task(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/search/index.mpx"
            service = root / "outputs/src/services/search.js"
            page.parent.mkdir(parents=True)
            service.parent.mkdir(parents=True)
            service.write_text(
                "import { request } from '@mpxjs/api-proxy'\n"
                "export function requestSuggestions () { return request({ url: '/suggestions' }) }\n"
            )
            page.write_text(
                "search () {\n"
                "  this.cancelSuggestionRequest()\n"
                "  const request = requestSuggestions()\n"
                "  this.suggestionRequest = request\n"
                "}\n"
                "cancelSuggestionRequest () {\n"
                "  const request = this.suggestionRequest\n"
                "  this.suggestionRequest = null\n"
                "  if (request && request.__returned) request.__returned.abort()\n"
                "}\n"
                "onUnload () { this.cancelSuggestionRequest() }\n"
            )
            passed, _ = GRADE.check_q2(root)
            self.assertFalse(passed)

    def test_web_bindmessage_checks_only_the_web_protocol_handler(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/campaign/index.mpx"
            page.parent.mkdir(parents=True)
            source = """
<template><web-view bindmessage@wx="handleWxMessage" bindmessage@web="handleWebMessage" /></template>
<script>
createPage({ methods: {
  handleWxMessage (event) { this.dispatchCampaignMessage(event.detail.data) },
  handleWebMessage (event) { const message = event.detail && event.detail.data;
    if (!message || message.campaignId !== this.campaignId) return;
    this.dispatchCampaignMessage(message) },
  dispatchCampaignMessage (message) { if (message.type === 'claim') this.claimCoupon(); if (message.type === 'open') this.openProduct() },
  claimCoupon () {},
  openProduct () {}
} })
</script>
"""
            page.write_text(source)
            self.assertTrue(GRADE.check_h7(root)[0])
            self.assertTrue(GRADE.check_h8(root)[0])

            page.write_text(source.replace(
                "!message || message.campaignId !== this.campaignId",
                "!message || (message.campaignId && message.campaignId !== this.campaignId)",
            ))
            self.assertFalse(GRADE.check_h8(root)[0])

    def test_tracker_cleanup_follows_helpers_and_rejects_unguarded_observer(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            component = root / "outputs/src/components/product-recommendations.mpx"
            component.parent.mkdir(parents=True)
            source = """
<script>
createComponent({
  detached: function () { this.sdkDetached = true; this.trackerGeneration += 1; this.releaseResources() },
  methods: {
    isCurrent: function (generation, productId) { return !this.sdkDetached && this.trackerGeneration === generation && this.productId === productId },
    releaseResources: function () { if (this.observer) this.observer.disconnect(); this.observer = null; const tracker = this.tracker; this.tracker = null; if (tracker) tracker.destroy() },
    bindObserver: function (generation, productId) { const tracker = this.tracker; const observer = new IntersectionObserver((entries) => {
      if (!this.isCurrent(generation, productId) || this.tracker !== tracker || this.observer !== observer) return;
      entries.forEach((entry) => { if (entry.isIntersecting) tracker.track('exposure', { productId }) })
    }); this.observer = observer },
    initTracker: async function (productId) { const generation = ++this.trackerGeneration; this.releaseResources();
      const sdk = await import('@business/product-exposure-web'); if (!this.isCurrent(generation, productId)) return;
      const tracker = await sdk.create({ productId }); if (!this.isCurrent(generation, productId)) { tracker.destroy(); return }
      this.tracker = tracker; this.bindObserver(generation, productId) }
  }
})
</script>
"""
            component.write_text(source)
            passed, evidence = GRADE.check_p5(root)
            self.assertTrue(passed, evidence)

            component.write_text(source.replace(
                "if (!this.isCurrent(generation, productId) || this.tracker !== tracker || this.observer !== observer) return;",
                "if (!entries.length) return;",
            ))
            self.assertFalse(GRADE.check_p5(root)[0])

    def test_product_sdk_checks_follow_transitive_web_and_generation_helpers(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            component = root / "outputs/src/components/product-recommendations.mpx"
            component.parent.mkdir(parents=True)
            component.write_text("""
<script>
createComponent({
  data: { sdkReady: false, trackerGeneration: 0 },
  ready () { if (__mpx_mode__ !== 'web' || typeof window === 'undefined') return; this.sdkReady = true; this.restartTracker(this.productId) },
  properties: { productId: { observer (productId) { if (this.sdkReady) this.restartTracker(productId) } } },
  methods: {
    invalidateTracker () { return ++this.trackerGeneration },
    restartTracker (productId) { const generation = this.invalidateTracker(); this.initTracker(generation, productId) },
    isCurrentTracker (generation, productId) { return this.sdkReady && this.trackerGeneration === generation && this.productId === productId },
    async initTracker (generation, productId) {
      const sdk = await import('@business/product-exposure-web')
      if (!this.isCurrentTracker(generation, productId)) return
      const tracker = await sdk.create({ productId })
      if (!this.isCurrentTracker(generation, productId)) { tracker.destroy(); return }
      this.tracker = tracker
    }
  }
})
</script>
""")
            for checker in (GRADE.check_p4a, GRADE.check_p4b, GRADE.check_p4c):
                with self.subTest(checker=checker.__name__):
                    passed, evidence = checker(root)
                    self.assertTrue(passed, evidence)

    def test_tracker_liveness_accepts_descriptive_flag_suffix(self):
        source = """
createPage({
  data: { detachedFlag: false, trackerGeneration: 0 },
  detached () { this.detachedFlag = true; this.trackerGeneration += 1 },
  methods: {
    isCurrentTrackerInit (generation) {
      return !this.detachedFlag && generation === this.trackerGeneration
    }
  }
})
"""
        self.assertTrue(GRADE.has_liveness_state(source))
        self.assertTrue(GRADE.has_liveness_invalidation(source))
        callback = """
if (this.productId !== productId || !this.tracker) return
tracker.track('exposure', { productId })
"""
        self.assertTrue(GRADE.observer_callback_is_current(source, callback))

    def test_custom_scroll_passthrough_does_not_claim_behavioral_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "outputs/vue.config.js"
            component = root / "outputs/src/web/AnalyticsScroll.vue"
            config.parent.mkdir(parents=True)
            component.parent.mkdir(parents=True)
            config.write_text(
                "module.exports = { webConfig: { customBuiltInComponents: {\n"
                "  'scroll-view': '/src/web/AnalyticsScroll.vue'\n"
                "} } }\n"
            )
            component.write_text(
                "<template><div v-bind=\"$attrs\" v-on=\"$listeners\"><slot /></div></template>\n"
                "<script>export default { inheritAttrs: false, props: { scrollY: Boolean } }</script>\n"
            )
            self.assertTrue(GRADE.check_v6(root)[0])
            self.assertFalse(GRADE.check_v7(root)[0])
            self.assertFalse(GRADE.check_v8(root)[0])

    def test_complete_custom_scroll_and_metric_chain_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            outputs = root / "outputs"
            files = {
                "vue.config.js": (
                    "module.exports = { webConfig: { customBuiltInComponents: {\n"
                    "  'scroll-view': '/src/web/AnalyticsScroll.vue'\n"
                    "} } }\n"
                ),
                "src/components/analytics-panel.mpx": (
                    "<template><view wx:for=\"{{metrics}}\" bindtap=\"selectMetric(item.key)\">"
                    "{{item.label}}</view></template>\n"
                    "<script>export default { methods: { selectMetric (key) { "
                    "this.triggerEvent('select', { key }) } } }</script>\n"
                ),
                "src/components/analytics-panel.web.mpx": (
                    "<template><scroll-view scroll-x=\"{{scrollX}}\" scroll-y=\"{{scrollY}}\" "
                    "scroll-top=\"{{scrollTop}}\" scroll-left=\"{{scrollLeft}}\" "
                    "scroll-into-view=\"{{activeMetricId}}\" upper-threshold=\"24\" lower-threshold=\"24\" "
                    "bindscroll=\"handleScroll\" "
                    "bindscrolltoupper=\"handleUpper\" bindscrolltolower=\"handleLower\">"
                    "<analytics-chart metrics=\"{{metrics}}\" bindselect=\"handleSelect\" />"
                    "</scroll-view></template>\n<script>export default { methods: { "
                    "handleSelect (e) { this.triggerEvent('select', e) }, "
                    "handleScroll (e) { this.triggerEvent('scroll', e) }, "
                    "handleUpper (e) { this.triggerEvent('scrolltoupper', e) }, "
                    "handleLower (e) { this.triggerEvent('scrolltolower', e) } } }</script>\n"
                ),
                "src/web/AnalyticsChart.vue": (
                    "<template><div /></template><script>export default { props: { metrics: Array }, "
                    "watch: { metrics (value) { this.chart.update(value) } }, methods: { "
                    "select (key) { this.$emit('select', { key }) } } }</script>\n"
                ),
                "src/web/chart-sdk.js": (
                    "export function createChart (element, metrics, { onSelect }) {\n"
                    "  element.addEventListener('click', onSelect)\n"
                    "  return { update () {}, destroy () {} }\n}\n"
                ),
                "src/web/AnalyticsScroll.vue": (
                    "<template><div ref=\"scroller\" :style=\"scrollStyle\" "
                    "v-bind=\"$attrs\" v-on=\"$listeners\"><slot /></div></template>\n"
                    "<script>export default { inheritAttrs: false, props: { scrollX: Boolean, "
                    "scrollY: Boolean, scrollTop: Number, scrollLeft: Number, scrollIntoView: String, "
                    "upperThreshold: Number, lowerThreshold: Number }, data () { return { atUpperX: false, "
                    "atUpperY: false, atLowerX: false, atLowerY: false, lastScrollTop: 0, lastScrollLeft: 0 } }, computed: { scrollStyle () { "
                    "return { overflowX: this.scrollX ? 'auto' : 'hidden', overflowY: this.scrollY ? 'auto' : 'hidden' } } }, "
                    "watch: { scrollTop (value) { this.$refs.scroller.scrollTop = value }, "
                    "scrollLeft (value) { this.$refs.scroller.scrollLeft = value }, "
                    "scrollIntoView () { this.$nextTick(this.scrollToChild) } }, mounted () { "
                    "this.$refs.scroller.scrollTop = this.scrollTop; this.$refs.scroller.scrollLeft = this.scrollLeft; "
                    "this.scrollToChild() }, methods: { scrollToChild () { const child = "
                    "this.$refs.scroller.ownerDocument.getElementById(this.scrollIntoView); if (child && "
                    "this.$refs.scroller.contains(child)) child.scrollIntoView() }, handleScroll (event) { const target = event.target; "
                    "const scrollTop = target.scrollTop; const scrollLeft = target.scrollLeft; const upperY = "
                    "this.scrollY && scrollTop <= this.upperThreshold; const upperX = this.scrollX && scrollLeft <= this.upperThreshold; "
                    "const lowerY = this.scrollY && scrollTop + target.clientHeight >= target.scrollHeight - this.lowerThreshold; "
                    "const lowerX = this.scrollX && scrollLeft + target.clientWidth >= target.scrollWidth - this.lowerThreshold; this.$emit('scroll', { detail: { "
                    "scrollTop, scrollLeft, scrollHeight: target.scrollHeight, scrollWidth: target.scrollWidth, "
                    "deltaX: scrollLeft - this.lastScrollLeft, deltaY: scrollTop - this.lastScrollTop } }); "
                    "if (upperY && !this.atUpperY) this.$emit('scrolltoupper', { detail: { direction: 'top' } }); "
                    "if (upperX && !this.atUpperX) this.$emit('scrolltoupper', { detail: { direction: 'left' } }); "
                    "if (lowerY && !this.atLowerY) this.$emit('scrolltolower', { detail: { direction: 'bottom' } }); "
                    "if (lowerX && !this.atLowerX) this.$emit('scrolltolower', { detail: { direction: 'right' } }); "
                    "this.atUpperY = upperY; this.atUpperX = upperX; this.atLowerY = lowerY; this.atLowerX = lowerX; "
                    "this.lastScrollTop = scrollTop; this.lastScrollLeft = scrollLeft } } }</script>\n"
                ),
            }
            for relative, content in files.items():
                path = outputs / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
            for checker in (GRADE.check_v6, GRADE.check_v7, GRADE.check_v8, GRADE.check_v9):
                with self.subTest(checker=checker.__name__):
                    passed, evidence = checker(root)
                    self.assertTrue(passed, evidence)

    def test_chart_chain_accepts_vue_click_and_safe_recreate_without_sdk_click(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            outputs = root / "outputs"
            files = {
                "src/components/analytics-panel.web.mpx": (
                    "<template><analytics-chart metrics=\"{{metrics}}\" bindselect=\"handleSelect\" /></template>"
                    "<script>export default { methods: { handleSelect (event) { "
                    "this.triggerEvent('select', event.detail) } } }</script>"
                ),
                "src/web/AnalyticsChart.vue": (
                    "<template><div><button v-for=\"item in metrics\" @click=\"select(item)\">"
                    "{{item.label}}</button><div ref=\"chart\"></div></div></template>"
                    "<script>import { createChart } from './chart-sdk'; export default { props: { metrics: Array }, "
                    "watch: { metrics: { deep: true, handler () { this.renderChart() } } }, methods: { "
                    "select (item) { this.$emit('select', item) }, renderChart () { "
                    "if (this.chart) this.chart.destroy(); this.chart = createChart(this.$refs.chart, this.metrics) } } }</script>"
                ),
                "src/web/chart-sdk.js": "export function createChart () { return { destroy () {} } }",
            }
            for relative, content in files.items():
                path = outputs / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
            passed, evidence = GRADE.check_v9b(root)
            self.assertTrue(passed, evidence)

    def test_scroll_checkers_follow_helpers_and_accept_container_offset_scrolling(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            component = root / "outputs/src/web/AnalyticsScroll.vue"
            component.parent.mkdir(parents=True)
            component.write_text("""
<template><div ref="scroller" :style="scrollStyle" @scroll="handleNativeScroll"><slot /></div></template>
<script>
export default {
  props: { scrollX: Boolean, scrollY: Boolean, scrollTop: Number, scrollLeft: Number,
    scrollIntoView: String, upperThreshold: Number, lowerThreshold: Number },
  data () { return { previousTop: 0, previousLeft: 0, boundaryState: {} } },
  computed: { scrollStyle () { return { overflowX: this.scrollX ? 'auto' : 'hidden',
    overflowY: this.scrollY ? 'auto' : 'hidden' } } },
  watch: {
    scrollTop () { this.syncPosition() },
    scrollLeft () { this.syncPosition() },
    scrollIntoView () { this.scheduleIntoView() }
  },
  mounted () { this.syncPosition(); this.scheduleIntoView() },
  methods: {
    syncPosition () { const scroller = this.$refs.scroller; scroller.scrollTop = this.scrollTop; scroller.scrollLeft = this.scrollLeft },
    scheduleIntoView () { this.$nextTick(() => this.scrollToTarget()) },
    scrollToTarget () { const scroller = this.$refs.scroller; const target = scroller.querySelector('[id]');
      if (!target) return; const a = scroller.getBoundingClientRect(); const b = target.getBoundingClientRect();
      if (this.scrollY) scroller.scrollTop += b.top - a.top; if (this.scrollX) scroller.scrollLeft += b.left - a.left },
    createDetail (scroller) { return { scrollTop: scroller.scrollTop, scrollLeft: scroller.scrollLeft,
      scrollHeight: scroller.scrollHeight, scrollWidth: scroller.scrollWidth,
      deltaX: scroller.scrollLeft - this.previousLeft, deltaY: scroller.scrollTop - this.previousTop } },
    emitBoundary (key, active, name, direction, detail) { if (active && !this.boundaryState[key]) this.$emit(name, { detail: Object.assign({}, detail, { direction }) }); this.boundaryState[key] = active },
    emitBoundaries (scroller, detail) { this.emitBoundary('top', this.scrollY && detail.scrollTop <= this.upperThreshold, 'scrolltoupper', 'top', detail);
      this.emitBoundary('left', this.scrollX && detail.scrollLeft <= this.upperThreshold, 'scrolltoupper', 'left', detail);
      this.emitBoundary('bottom', this.scrollY && detail.scrollTop + scroller.clientHeight >= scroller.scrollHeight - this.lowerThreshold, 'scrolltolower', 'bottom', detail);
      this.emitBoundary('right', this.scrollX && detail.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - this.lowerThreshold, 'scrolltolower', 'right', detail) },
    handleNativeScroll (event) { const detail = this.createDetail(event.currentTarget); this.$emit('scroll', { detail }); this.emitBoundaries(event.currentTarget, detail) }
  }
}
</script>
""")
            for checker in (GRADE.check_v7, GRADE.check_v8):
                with self.subTest(checker=checker.__name__):
                    passed, evidence = checker(root)
                    self.assertTrue(passed, evidence)

    def test_a11y_checker_accepts_native_buttons_without_redundant_aria(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            common = root / "outputs/src/components/filter-dialog.mpx"
            web = root / "outputs/src/components/filter-dialog.web.mpx"
            common.parent.mkdir(parents=True)
            common.write_text(
                '<template><view><button class="filter-trigger" bindtap="open">筛选</button>'
                '<view class="mask" bindtap="close"><view class="dialog" aria-role="dialog" catchtap="stop">'
                '<button wx:for="{{options}}" bindtap="toggle(item.value)">{{item.label}}</button>'
                '<button bindtap="confirm">确定</button></view></view></view></template>'
            )
            web.write_text(
                '<template><div><div class="dialog" role="dialog" aria-modal="true" tabindex="-1"></div></div></template>'
                '<script>document.addEventListener("keydown", this.onKeydown)</script>'
            )
            self.assertTrue(GRADE.check_c0(root)[0])
            self.assertTrue(GRADE.check_c1(root)[0])

            common.write_text(
                '<template><view><view class="filter-trigger" role="button" bindtap="open">筛选</view>'
                '<view class="mask" bindtap="close"><view class="dialog" catchtap="stop">'
                '<button wx:for="{{options}}" bindtap="toggle(item.value)">{{item.label}}</button>'
                '<button bindtap="confirm">确定</button></view></view></view></template>'
            )
            self.assertFalse(GRADE.check_c0(root)[0])
            self.assertFalse(GRADE.check_c1(root)[0])

    def test_scroll_lock_accepts_collection_snapshot_and_rejects_missing_mount(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/portal/index.mpx"
            html = root / "outputs/public/index.html"
            page.parent.mkdir(parents=True)
            html.parent.mkdir(parents=True)
            html.write_text('<div id="app"></div>')
            complete = """
<script>
let pageScrollLock = null
createPage({
  onHide () { this.restorePageScroll() },
  onUnload () { this.restorePageScroll() },
  methods: {
    openDialog () { this.lockPageScroll() },
    closeDialog () { this.restorePageScroll() },
    lockPageScroll () { if (pageScrollLock) return; const targets = [document.body, document.querySelector('#app')].filter(Boolean);
      pageScrollLock = targets.map(target => ({ target, overflow: target.style.getPropertyValue('overflow') }));
      targets.forEach(target => target.style.setProperty('overflow', 'hidden')) },
    restorePageScroll () { if (!pageScrollLock) return; pageScrollLock.forEach(({ target, overflow }) => {
      if (overflow) target.style.setProperty('overflow', overflow); else target.style.removeProperty('overflow') }); pageScrollLock = null }
  }
})
</script>
"""
            page.write_text(complete)
            passed, evidence = GRADE.check_t4(root)
            self.assertTrue(passed, evidence)

            page.write_text(complete.replace(", document.querySelector('#app')", ""))
            self.assertFalse(GRADE.check_t4(root)[0])

    def test_vue2_scroll_checker_accepts_all_watcher_forms_and_axis_edges(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            component = root / "outputs/src/web/AnalyticsScroll.vue"
            component.parent.mkdir(parents=True)
            component.write_text("""
<template><div ref="scroller" class="analytics-scroll analytics-scroll--x analytics-scroll--y" @scroll="handleScroll"><slot /></div></template>
<script>
export default {
  props: { scrollX: Boolean, scrollY: Boolean, scrollTop: Number, scrollLeft: Number, scrollIntoView: String, upperThreshold: Number, lowerThreshold: Number },
  data () { return { activeEdges: {} } },
  watch: {
    scrollTop: 'syncPosition',
    scrollLeft: { immediate: true, handler () { this.syncPosition() } },
    scrollIntoView: { immediate: true, handler () { this.scrollToTarget() } }
  },
  mounted () { this.syncPosition() },
  methods: {
    syncPosition () { const el = this.$refs.scroller; el.scrollTo({ top: this.scrollTop, left: this.scrollLeft }) },
    scrollToTarget () { this.$nextTick(() => { const el = this.$refs.scroller; const target = el.querySelector('#' + this.scrollIntoView); const box = target.getBoundingClientRect(); const root = el.getBoundingClientRect(); el.scrollTo({ top: el.scrollTop + box.top - root.top, left: el.scrollLeft + box.left - root.left }) }) },
    handleScroll () { const el = this.$refs.scroller; const detail = { scrollTop: el.scrollTop, scrollLeft: el.scrollLeft, scrollHeight: el.scrollHeight, scrollWidth: el.scrollWidth, deltaX: 0, deltaY: 0 }; this.$emit('scroll', detail); this.updateEdge('top', detail.scrollTop <= this.upperThreshold, 'scrolltoupper', detail); this.updateEdge('left', detail.scrollLeft <= this.upperThreshold, 'scrolltoupper', detail); this.updateEdge('bottom', detail.scrollHeight - el.clientHeight - detail.scrollTop <= this.lowerThreshold, 'scrolltolower', detail); this.updateEdge('right', detail.scrollWidth - el.clientWidth - detail.scrollLeft <= this.lowerThreshold, 'scrolltolower', detail) },
    updateEdge (direction, active, eventName, detail) { if (!active) { this.$delete(this.activeEdges, direction); return } if (this.activeEdges[direction]) return; this.$set(this.activeEdges, direction, true); this.$emit(eventName, Object.assign({ direction }, detail)) }
  }
}
</script>
""")
            self.assertTrue(GRADE.check_v7(root)[0])
            self.assertTrue(GRADE.check_v8(root)[0])

            dynamic_events = component.read_text().replace(
                "this.$emit(eventName, Object.assign({ direction }, detail))",
                "const eventNames = { top: 'scrolltoupper', left: 'scrolltoupper', bottom: 'scrolltolower', right: 'scrolltolower' }; this.$emit(eventNames[direction], Object.assign({ direction }, detail))",
            )
            component.write_text(dynamic_events)
            self.assertTrue(GRADE.check_v8(root)[0])

            ternary_events = dynamic_events.replace(
                "this.$emit(eventNames[direction], Object.assign({ direction }, detail))",
                "this.$emit(direction === 'top' || direction === 'left' ? 'scrolltoupper' : 'scrolltolower', Object.assign({ direction }, detail))",
            )
            component.write_text(ternary_events)
            self.assertTrue(GRADE.check_v8(root)[0])

            computed_state = """
<template><div @scroll="handleScroll"><slot /></div></template>
<script>
export default {
  props: { upperThreshold: Number, lowerThreshold: Number },
  data () { return { upperActive: {}, lowerActive: {} } },
  methods: {
    handleScroll (event) { const node = event.target; const detail = { scrollTop: node.scrollTop, scrollLeft: node.scrollLeft, scrollHeight: node.scrollHeight, scrollWidth: node.scrollWidth, deltaX: 0, deltaY: 0 }; this.$emit('scroll', detail); this.checkEdges(node, detail) },
    checkEdges (node, detail) { this.emitEdge('upper', 'top', node.scrollTop <= this.upperThreshold, detail); this.emitEdge('upper', 'left', node.scrollLeft <= this.upperThreshold, detail); this.emitEdge('lower', 'bottom', node.scrollHeight - node.clientHeight - node.scrollTop <= this.lowerThreshold, detail); this.emitEdge('lower', 'right', node.scrollWidth - node.clientWidth - node.scrollLeft <= this.lowerThreshold, detail) },
    emitEdge (name, direction, active, detail) { if (active && !this[name + 'Active'][direction]) { this[name + 'Active'][direction] = true; this.$emit(name === 'upper' ? 'scrolltoupper' : 'scrolltolower', Object.assign({ direction }, detail)) } else if (!active) { this[name + 'Active'][direction] = false } }
  }
}
</script>
"""
            component.write_text(computed_state)
            passed, evidence = GRADE.check_v8(root)
            self.assertTrue(passed, evidence)

    def test_scroll_lock_accepts_module_object_and_direct_multi_target_snapshots(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "outputs/src/pages/portal/index.mpx"
            html = root / "outputs/public/index.html"
            page.parent.mkdir(parents=True)
            html.parent.mkdir(parents=True)
            html.write_text('<div id="app"></div>')
            page.write_text("""
<script>
const webScrollState = { locked: false, targets: [] }
function lockWebScroll () { const app = document.getElementById('app'); webScrollState.targets = [document.body, app].filter(Boolean).map(element => ({ element, overflow: element.style.overflow })); webScrollState.targets.forEach(({ element }) => { element.style.overflow = 'hidden' }); webScrollState.locked = true }
function restoreWebScroll () { if (!webScrollState.locked) return; webScrollState.targets.forEach(({ element, overflow }) => { element.style.overflow = overflow }); webScrollState.targets = []; webScrollState.locked = false }
createPage({ onHide () { restoreWebScroll() }, onUnload () { restoreWebScroll() }, methods: { openDialog () { lockWebScroll() }, closeDialog () { restoreWebScroll() } } })
</script>
""")
            self.assertTrue(GRADE.check_t4(root)[0])

            page.write_text("""
<script>
createPage({ onHide () { this.restore() }, onUnload () { this.restore() }, methods: {
  openDialog () { const body = document.body; const app = document.getElementById('app'); this.scrollLock = { bodyOverflow: body.style.overflow, app: app, appOverflow: app.style.overflow }; body.style.overflow = 'hidden'; app.style.overflow = 'hidden' },
  closeDialog () { this.restore() },
  restore () { if (!this.scrollLock) return; document.body.style.overflow = this.scrollLock.bodyOverflow; this.scrollLock.app.style.overflow = this.scrollLock.appOverflow; this.scrollLock = null }
} })
</script>
""")
            self.assertTrue(GRADE.check_t4(root)[0])


if __name__ == "__main__":
    unittest.main()
