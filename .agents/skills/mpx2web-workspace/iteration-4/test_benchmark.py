#!/usr/bin/env python3
import json
import unittest

import grade


class BenchmarkContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.evals = json.loads((grade.ROOT / "evals.json").read_text())

    def test_all_inputs_and_rubrics_exist(self):
        self.assertEqual({item["id"] for item in self.evals}, set(grade.RUBRICS))
        for item in self.evals:
            for path in item["inputs"]:
                self.assertTrue((grade.ROOT / path).is_file(), path)

    def test_share_prompt_does_not_leak_implementation(self):
        task = next(item["task"] for item in self.evals if item["id"] == "eval-5-web-lifecycle")
        for answer in ("implement", "remove: true", "navigator.share", "clipboard", "TODO"):
            self.assertNotIn(answer.lower(), task.lower())

    def test_share_rubric_rejects_guessed_browser_implementation(self):
        output = """
        <button open-type="share">分享</button>
        <button bindtap="shareOnWeb">Web 分享</button>
        <script>
        createPage({
          onShareAppMessage () {},
          methods: {
            shareOnWeb () { navigator.share({}) }
          }
        })
        </script>
        """
        results = {label: checker(output) for label, checker in grade.RUBRICS["eval-5-web-lifecycle"]}
        self.assertFalse(results["Web 通过 implement remove 移除分享生命周期"])
        self.assertFalse(results["Web 分享方法保留明确的业务接入 TODO"])
        self.assertFalse(results["未擅自选择 Web Share 或 clipboard 降级"])

    def test_style_rubric_rejects_unisolated_component(self):
        output = """
        /* OUTPUT_FILE:account-page.mpx */
        <style scoped>.title { color: #d33; font-size: 40rpx; }</style>
        /* OUTPUT_FILE:profile-card.mpx */
        <image src="{{avatar}}" />
        <style>
        .title { color: #d33; font-size: 40rpx; }
        .card image { border-radius: 50%; }
        .title { color: #333; font-size: 30rpx; }
        </style>
        <json>{ "component": true, "styleIsolation": "isolated" }</json>
        """
        results = {label: checker(output) for label, checker in grade.RUBRICS["eval-1-style-isolation"]}
        self.assertFalse(results["Web 组件样式使用 scoped 隔离"])
        self.assertFalse(results["基础标签节点增加稳定业务类名"])
        self.assertFalse(results["组件样式不再依赖 image 标签选择器"])

    def test_api_rubric_rejects_guessed_browser_replacements(self):
        output = """
        choosePlace () { navigator.geolocation.getCurrentPosition(() => {}) }
        openPlace () { window.open('https://maps.example.com') }
        choosePhoto () { document.createElement('input') }
        wx.chooseLocation(); wx.openLocation(); wx.chooseMedia()
        """
        results = {label: checker(output) for label, checker in grade.RUBRICS["eval-3-unsupported-api"]}
        self.assertFalse(results["Web 位置选择保留业务 Bridge/SDK TODO"])
        self.assertFalse(results["Web 地图打开保留业务 Bridge/SDK TODO"])
        self.assertFalse(results["Web 媒体选择保留业务 Bridge/SDK TODO"])
        self.assertFalse(results["未擅自使用纯浏览器位置、地图或文件替代"])

    def test_api_rubric_accepts_explicit_todos(self):
        output = """
        choosePlace () { if (__mpx_mode__ === 'web') { /* TODO: 接入 Bridge */ return } }
        openPlace () { if (__mpx_mode__ === 'web') { /* TODO: 接入地图 SDK */ return } }
        choosePhoto () { if (__mpx_mode__ === 'web') { /* TODO: 接入媒体 SDK */ return } }
        """
        results = {label: checker(output) for label, checker in grade.RUBRICS["eval-3-unsupported-api"]}
        self.assertTrue(results["Web 位置选择保留业务 Bridge/SDK TODO"])
        self.assertTrue(results["Web 地图打开保留业务 Bridge/SDK TODO"])
        self.assertTrue(results["Web 媒体选择保留业务 Bridge/SDK TODO"])

    def test_ssr_input_is_valid_miniprogram_source(self):
        source = (
            grade.ROOT / "eval-6-ssr-product-detail/input/product-detail.mpx"
        ).read_text()
        self.assertNotRegex(source, r"\b(?:window|document|navigator)\b")

    def test_socket_callback_guard_accepts_both_safe_shapes(self):
        negative_guard = """
        task.onOpen(() => { if (this.socketTask !== task) return; this.connected = true })
        task.onMessage(() => { if (this.socketTask !== task) return; this.emitMessage() })
        task.onError(() => { if (this.socketTask !== task) return; this.reportError() })
        task.onClose(() => { if (this.socketTask !== task) return; this.connected = false })
        """
        positive_guard = """
        task.onOpen(() => { if (this.socketTask === task) { this.connected = true } })
        task.onMessage(() => { if (this.socketTask === task) { this.emitMessage() } })
        task.onError(() => { if (this.socketTask === task) { this.reportError() } })
        task.onClose(() => { if (this.socketTask === task) { this.connected = false } })
        """
        unsafe_guard = """
        task.onOpen(() => { this.connected = true })
        task.onMessage(() => { this.emitMessage() })
        task.onError(() => { this.reportError() })
        task.onClose(() => { this.connected = false })
        """
        self.assertTrue(grade.socket_callbacks_guard_current_task(negative_guard))
        self.assertTrue(grade.socket_callbacks_guard_current_task(positive_guard))
        self.assertFalse(grade.socket_callbacks_guard_current_task(unsafe_guard))

    def test_socket_prompt_describes_symptoms_without_leaking_guard(self):
        task = next(item["task"] for item in self.evals if item["id"] == "eval-4-socket-task")
        for answer in ("SocketTask", "当前任务", "任务身份", "onOpen", "onMessage", "onError", "onClose"):
            self.assertNotIn(answer.lower(), task.lower())

    def test_socket_detach_requires_invalidation_before_close(self):
        safe = """
        detached () {
          const task = this.socketTask
          this.socketTask = null
          if (task) task.close({})
        },
        """
        unsafe = """
        detached () {
          if (this.socketTask) this.socketTask.close({})
          this.socketTask = null
        },
        """
        self.assertTrue(grade.socket_detach_closes_task(safe))
        self.assertTrue(grade.socket_detach_closes_task(unsafe))
        self.assertTrue(grade.socket_detach_invalidates_before_close(safe))
        self.assertFalse(grade.socket_detach_invalidates_before_close(unsafe))

    def test_socket_detach_accepts_safe_cleanup_helper(self):
        output = """
        detached () {
          this._isAttached = false
          this.disposeSocket()
        },
        methods: {
          disposeSocket () {
            const task = this.socketTask
            this.socketTask = null
            if (task) task.close({})
          }
        }
        """
        self.assertTrue(grade.socket_detach_closes_task(output))
        self.assertTrue(grade.socket_detach_invalidates_before_close(output))

    def test_socket_detach_does_not_leak_into_unrelated_method(self):
        output = """
        detached () {
          this.markDetached()
        },
        methods: {
          markDetached () {
            this.destroyed = true
          },
          disposeSocket () {
            const task = this.socketTask
            this.socketTask = null
            if (task) task.close({})
          }
        }
        """
        self.assertFalse(grade.socket_detach_closes_task(output))
        self.assertFalse(grade.socket_detach_invalidates_before_close(output))

    def test_wxs_state_check_ignores_method_local_offset(self):
        safe = """
        <script>
        createComponent({ methods: { onTouchMove () { let offsetX = 0; this.webOffsetX = offsetX } } })
        </script>
        """
        unsafe = """
        <script>
        let swipeOffset = 0
        createComponent({ methods: { onTouchMove () { swipeOffset += 1 } } })
        </script>
        """
        self.assertFalse(grade.has_module_scope_gesture_state(safe))
        self.assertTrue(grade.has_module_scope_gesture_state(unsafe))

    def test_wxs_cancel_accepts_finish_false(self):
        output = """
        <script>
        createComponent({ methods: { onWebTouchCancel () { this.finishSwipe(false) } } })
        </script>
        """
        self.assertTrue(grade.web_touch_cancel_safe(output))


if __name__ == "__main__":
    unittest.main()
