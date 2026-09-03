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

    def test_json_fence_parser(self):
        payload = GRADE.parse_json_payload(
            '```json\n{"expectations": [], "claims": []}\n```'
        )
        self.assertEqual(payload["expectations"], [])

    def test_compile_failure_is_scored_zero_without_calling_grader(self):
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
            with patch.object(GRADE.subprocess, "run") as grader_run:
                grade = GRADE.grade_run(
                    item, "no_skill", run_root, "gpt-5.5", "high"
                )
            grader_run.assert_not_called()
            self.assertEqual(grade["summary"]["pass_rate"], 0.0)
            self.assertTrue(all(not entry["passed"] for entry in grade["expectations"]))
            self.assertEqual(
                grade["expectations"][0]["verification_methods"],
                ["compile_gate"],
            )
            self.assertFalse(grade["grader"]["invoked"])

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
                        "failed": 0,
                        "total": 1,
                        "pass_rate": 1.0,
                        "expectations": [{"id": "a", "passed": True}],
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
                totals[group] = {"runs": 3, "passed": 3, "total": 3, "pass_rate": 1.0}
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
        self.assertEqual(len(payload["results"]), 78)
        self.assertEqual(
            {row["run_number"] for row in payload["results"]},
            {1, 2, 3},
        )
        for group in GRADE.PUBLIC_GROUPS:
            with self.subTest(group=group):
                self.assertEqual(payload["totals"][group]["runs"], 39)
                self.assertEqual(payload["totals"][group]["total"], 306)

    def test_grade_has_no_internal_workspace_dependency(self):
        self.assertNotIn("iteration-11-internal", (WORKSPACE / "grade.py").read_text())

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


if __name__ == "__main__":
    unittest.main()
