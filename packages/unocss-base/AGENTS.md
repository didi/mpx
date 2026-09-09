# @mpxjs/unocss-base

Mpx 提供给 [UnoCSS](https://unocss.dev/) 的基础 preset：包装 `@unocss/preset-uno`，把 `rem` 单位按目标平台转成 `vw`（Web）或 `rpx`（小程序），并定义 Mpx 友好的 `preflightRoot` 选择器。

## 入口文件

- [lib/index.js](lib/index.js)：默认导出 `presetMpx(options)`，返回带 `postprocess` 的 unocss preset 对象。

## 核心实现

- 包装 `presetUno`：复用其 rules / variants / theme，仅覆盖 `name`、扩展 `theme.preflightRoot`，并追加 `postprocess`。
- `postprocess`：遍历每条 util 的 entries，命中 `rem` 单位时按 `process.env.MPX_CURRENT_TARGET_MODE` 选择换算策略：
  - Web：`<n>rem` → `<n * baseFontSize * (100/750).toFixed(8)>vw`；
  - 其他（小程序）：`<n>rem` → `<n * baseFontSize>rpx`。
- `baseFontSize` 默认 `37.5`，可在 `presetMpx({ baseFontSize })` 中覆盖。

## 典型调用链

1. 用户 `unocss.config.js` 中 `presets: [presetMpx({ baseFontSize: 50 })]`。
2. 编译期：[@mpxjs/unocss-plugin](../unocss-plugin/AGENTS.md) 透传当前目标平台到 `process.env.MPX_CURRENT_TARGET_MODE`，UnoCSS 生成 util CSS → 命中 [lib/index.js](lib/index.js) 的 `postprocess` → 输出 `vw` 或 `rpx`。

## 注意

- 改动单位换算逻辑要兼顾 Web 与小程序两条路径，不要破坏 `(100/750).toFixed(8)` 的精度。
- `MPX_CURRENT_TARGET_MODE` 由 [@mpxjs/unocss-plugin](../unocss-plugin/AGENTS.md) 在构建期设置，不要在本包中读取其它 mpx 内部 env。
