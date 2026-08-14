#!/usr/bin/env python3
import json
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from benchmark_assertions import apply_deterministic_checks, audit_workspace, check_p3, check_p7

ROOT = Path(__file__).parent


def load_runner():
    spec = importlib.util.spec_from_file_location("iteration8_runner", ROOT / "run_full_benchmark.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class BenchmarkTest(unittest.TestCase):
    def load_eval(self, eval_id):
        return next(item for item in load_runner().load_evals(None) if item["id"] == eval_id)

    def deterministic_grade(self, eval_id, group):
        item = self.load_eval(eval_id)
        root = ROOT / f"eval-{eval_id}-{item['name']}" / group
        expectations = [{
            "id": assertion["id"],
            "text": assertion["text"],
            "passed": True,
            "evidence": "model evidence",
        } for assertion in item["assertions"]]
        return {
            entry["id"]: entry
            for entry in apply_deterministic_checks(item, expectations, root)
        }

    def test_contract_validator(self):
        subprocess.run([sys.executable, str(ROOT / "validate_benchmark.py")], check=True)

    def test_dispatch_matrix(self):
        output = subprocess.check_output([sys.executable, str(ROOT / "run_evals.py")])
        dispatches = json.loads(output)
        self.assertEqual(len(dispatches), 12)
        self.assertEqual({item["group"] for item in dispatches}, {"no_skill", "has_skill"})
        has_skill = next(item for item in dispatches if item["group"] == "has_skill")
        no_skill = next(item for item in dispatches if item["group"] == "no_skill")
        self.assertIn("mpx2web/SKILL.md", has_skill["prompt"])
        self.assertNotIn("Skill：", no_skill["prompt"])

    def test_full_runner_dry_run(self):
        output = subprocess.check_output([
            sys.executable, str(ROOT / "run_full_benchmark.py"),
            "--dry-run", "--evals", "0", "--groups", "no_skill"
        ], text=True)
        self.assertIn("eval-0-storefront-style-compat no_skill", output)

    def test_grader_rejects_incomplete_output(self):
        with tempfile.TemporaryDirectory() as output_dir:
            result = subprocess.run([
                sys.executable,
                str(ROOT / "grade_outputs.py"),
                str(ROOT / "eval-5-ssr-product-platform"),
                output_dir
            ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertFalse(json.loads(result.stdout)["output_complete"])

    def test_unlimited_timeout_and_transient_failure_detection(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory() as output_dir:
            code, _, output = runner.run_command(
                [sys.executable, "-c", "import sys, time; sys.stdin.read(); time.sleep(0.05); print('done')"],
                "prompt", Path(output_dir) / "run.log", 0, "timeout-test"
            )
        self.assertEqual(code, 0)
        self.assertIn("done", output)
        self.assertTrue(runner.retryable(1, "stream disconnected before completion"))
        self.assertFalse(runner.retryable(1, "candidate code failed to compile"))

    def test_complex_cases_only_disclose_required_contracts(self):
        eval4 = json.loads((ROOT / "eval-4-campaign-webview-sdk/eval_metadata.json").read_text())
        eval5 = json.loads((ROOT / "eval-5-ssr-product-platform/eval_metadata.json").read_text())
        assertions = "\n".join(item["text"] for item in eval4["assertions"])
        self.assertNotIn("callbackId", assertions)
        self.assertNotIn("requestId", assertions)
        self.assertIn("campaignId", assertions)
        self.assertIn("没有自定义 invoke API", eval4["prompt"])
        self.assertIn("create/track/destroy 契约", eval5["prompt"])

    def test_skill_documents_runtime_aligned_webview_security(self):
        skill = (ROOT.parent.parent / "mpx2web/SKILL.md").read_text()
        reference = (ROOT.parent.parent / "mpx2web/references/webview-bridge-reference.md").read_text()
        self.assertIn("含协议的完整可信 origin", skill)
        self.assertIn("bindmessage", skill)
        self.assertIn("当前 iframe `contentWindow`", skill)
        self.assertIn("hostWhitelists: ['https://h5.example.com']", reference)
        self.assertIn("event.source", reference)
        self.assertIn("业务身份严格等于当前页面状态", reference)

    def test_eval1_static_rules_reject_invented_web_protocol(self):
        runner = load_runner()
        item = next(item for item in runner.load_evals(None) if item["id"] == 1)
        expectations = [{
            "id": assertion["id"],
            "text": assertion["text"],
            "passed": True,
            "evidence": "outputs/src/pages/community/publish.mpx: model evidence"
        } for assertion in item["assertions"]]
        with tempfile.TemporaryDirectory() as output_dir:
            root = Path(output_dir)
            path = root / "outputs/src/pages/community/publish.mpx"
            path.parent.mkdir(parents=True)
            path.write_text("""
wx.chooseLocation({})
wx.openLocation({})
wx.chooseMedia({})
globalThis.__INVENTED_BRIDGE__
fetch('/api')
location.assign('/detail')
alert('failed')
""")
            checked = runner.apply_static_checks(item, expectations, root)
        by_id = {entry["id"]: entry for entry in checked}
        self.assertFalse(by_id["a2"]["passed"])
        self.assertFalse(by_id["a3"]["passed"])
        self.assertFalse(by_id["a4"]["passed"])
        self.assertFalse(by_id["a5"]["passed"])
        self.assertFalse(by_id["a6"]["passed"])

    def test_eval1_static_rules_accept_todo_synonyms_but_reject_raw_named_api_imports(self):
        runner = load_runner()
        item = next(item for item in runner.load_evals(None) if item["id"] == 1)
        expectations = [{
            "id": assertion["id"],
            "text": assertion["text"],
            "passed": True,
            "evidence": "outputs/src/pages/community/publish.mpx: model evidence"
        } for assertion in item["assertions"]]
        with tempfile.TemporaryDirectory() as output_dir:
            root = Path(output_dir)
            path = root / "outputs/src/pages/community/publish.mpx"
            path.parent.mkdir(parents=True)
            path.write_text("""
// TODO: 宿主 Bridge/地图 SDK 协议确定后接入位置选择
// TODO: 地图 SDK/宿主 Bridge 协议确定后打开地图
// TODO: 媒体 SDK/宿主 Bridge 协议确定后选择图片
mpx.request({})
mpx.redirectTo({})
mpx.showToast({})
""")
            checked = runner.apply_static_checks(item, expectations, root)
            by_id = {entry["id"]: entry for entry in checked}
            self.assertTrue(by_id["a3"]["passed"])
            self.assertTrue(by_id["a4"]["passed"])
            self.assertTrue(by_id["a6"]["passed"])

            path.write_text(path.read_text() + "\nimport { request } from '@mpxjs/api-proxy'\n")
            checked = runner.apply_static_checks(item, expectations, root)
            self.assertFalse({entry["id"]: entry for entry in checked}["a6"]["passed"])

    def test_eval3_requires_explicit_wxs_web_event_pairs(self):
        no_skill = self.deterministic_grade(3, "no_skill")
        has_skill = self.deterministic_grade(3, "has_skill")
        self.assertFalse(no_skill["r1"]["passed"])
        self.assertTrue(has_skill["r1"]["passed"])
        validator = ROOT.parent.parent / "mpx2web/scripts/validate-wxs-web-events.js"
        no_skill_file = ROOT / "eval-3-order-center-realtime/no_skill/outputs/src/components/swipe-order-item.mpx"
        has_skill_file = ROOT / "eval-3-order-center-realtime/has_skill/outputs/src/components/swipe-order-item.mpx"
        self.assertNotEqual(subprocess.run(["node", str(validator), str(no_skill_file)]).returncode, 0)
        self.assertEqual(subprocess.run(["node", str(validator), str(has_skill_file)]).returncode, 0)

    def test_eval4_uses_runtime_aligned_webview_security_rules(self):
        no_skill = self.deterministic_grade(4, "no_skill")
        has_skill = self.deterministic_grade(4, "has_skill")
        self.assertFalse(no_skill["h1"]["passed"])
        self.assertFalse(no_skill["h7"]["passed"])
        self.assertFalse(no_skill["h8"]["passed"])
        self.assertFalse(has_skill["h1"]["passed"])
        self.assertFalse(has_skill["h7"]["passed"])
        self.assertTrue(has_skill["h8"]["passed"])

    def test_eval5_rejects_hydration_race_without_misreading_forwarded_onload(self):
        no_skill = self.deterministic_grade(5, "no_skill")
        has_skill = self.deterministic_grade(5, "has_skill")
        self.assertFalse(no_skill["p2"]["passed"])
        self.assertTrue(no_skill["p7"]["passed"])
        self.assertTrue(has_skill["p2"]["passed"])
        self.assertTrue(has_skill["p7"]["passed"])
        self.assertIn("A→B→A", has_skill["p2"]["evidence"])

    def test_eval5_p7_follows_one_method_call_but_keeps_window_guard_detection(self):
        with tempfile.TemporaryDirectory() as output_dir:
            root = Path(output_dir)
            path = root / "outputs/src/packageProduct/pages/detail/index.mpx"
            path.parent.mkdir(parents=True)
            path.write_text("""
onLoad (options) {
  this.prepareProduct(options.id)
}
prepareProduct (productId) {
  return this.loadProduct(productId)
}
""")
            self.assertTrue(check_p7(root)[0])

            path.write_text("""
onLoad (options) {
  this.prepareProduct(options.id)
}
prepareProduct (productId) {
  if (typeof window !== 'undefined') this.loadProduct(productId)
}
""")
            self.assertFalse(check_p7(root)[0])

    def test_eval5_p3_requires_declared_ssr_request_origin_contract(self):
        with tempfile.TemporaryDirectory() as output_dir:
            root = Path(output_dir)
            path = root / "outputs/src/services/product.js"
            path.parent.mkdir(parents=True)
            path.write_text("""
function getOrigin (requestContext) {
  const request = requestContext && requestContext.req
  const headers = request ? request.headers : {}
  const protocol = headers['x-forwarded-proto'] || 'https'
  const host = headers['x-forwarded-host'] || headers.host
  return request && host ? `${protocol}://${host}` : ''
}
function request (path, requestContext) {
  const origin = getOrigin(requestContext)
  return new Promise((resolve) => resolve(origin + path))
}
""")
            self.assertTrue(check_p3(root)[0])

            path.write_text("""
function request (options, requestContext) {
  const requestClient = requestContext && requestContext.requestClient
  return Promise.resolve(requestClient(options))
}
""")
            passed, evidence = check_p3(root)
            self.assertFalse(passed)
            self.assertIn("requestClient", evidence)

    def test_audited_scores_match_regression_evidence(self):
        result = audit_workspace(ROOT)
        by_run = {
            (row["eval_id"], row["configuration"]): (row["passed"], row["total"])
            for row in result["results"]
        }
        self.assertEqual(by_run[(3, "no_skill")], (7, 9))
        self.assertEqual(by_run[(3, "has_skill")], (9, 9))
        self.assertEqual(by_run[(4, "no_skill")], (4, 9))
        self.assertEqual(by_run[(4, "has_skill")], (7, 9))
        self.assertEqual(by_run[(5, "no_skill")], (6, 8))
        self.assertEqual(by_run[(5, "has_skill")], (8, 8))
        self.assertEqual(result["totals"]["no_skill"], {
            "passed": 27,
            "total": 49,
            "pass_rate": 0.551,
        })


if __name__ == "__main__":
    unittest.main()
