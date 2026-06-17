# Mpx 与 H5 生态混合开发

> **填充说明（待补充，删除本块后正式发布）**：本文件对应 RN skill 的 `rn-hybrid-dev.md`，但内容是 **Web 侧**：在 `.mpx` 内使用原生 DOM、第三方 H5 SDK / Vue 生态库，及跨端隔离方案。

## 目录

- [使用原生 DOM 能力](#使用原生-dom-能力)
- [引入第三方 H5 SDK](#引入第三方-h5-sdk)
- [使用 Vue 生态组件 / 指令](#使用-vue-生态组件--指令)
- [跨端兼容隔离](#跨端兼容隔离)

---

## 使用原生 DOM 能力

TODO：
- 在脚本中访问 `window` / `document` / DOM 节点的方式（须用条件编译限定 Web 平台）。
- 通过 `wx:ref` / selector 获取节点后操作 DOM 的建议。

## 引入第三方 H5 SDK

TODO：
- 引入第三方 H5 库（如埋点、支付、地图 SDK）的方式。
- 仅 Web 依赖的隔离，避免小程序构建解析。

## 使用 Vue 生态组件 / 指令

TODO：
- Web 输出基于 Vue 2.7，能否/如何在 `.mpx` 中复用 Vue 组件与指令。
- 与 Mpx 组件机制的边界与注意事项。

## 跨端兼容隔离

TODO：
- Web 与小程序差异通常很小，对差异片段使用 `@mode` / `@_mode` / `mpxTagName@mode` / 脚本 `__mpx_mode__` 隔离少量 Web 专属节点或逻辑即可。
