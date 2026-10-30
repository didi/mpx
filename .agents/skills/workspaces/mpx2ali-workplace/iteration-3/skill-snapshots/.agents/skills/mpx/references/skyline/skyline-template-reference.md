# Skyline 模板与基础组件差异

本页记录 WebView 迁移 Skyline 的组件支持、属性取值、结构与方法差异，以及 glass-easel 模板语法和 SVG 限制；新增能力仅在作为替代方案时列出。通用契约见[模板基准](../base/template-reference.md)，双模式与高级能力见 [Skyline 入口](./index.md)。

## 目录

- [Skyline 不支持或不建议使用的组件](#skyline-不支持或不建议使用的组件)
- [WebView-only 属性、取值与行为](#webview-only-属性取值与行为)
- [Skyline 必填属性与结构约束](#skyline-必填属性与结构约束)
- [Skyline 相对 WebView 的高频差异补充](#skyline-相对-webview-的高频差异补充)
- [模板结构适配](#模板结构适配)
  - [模板中数据绑定外的转义改为标准 XML 转义](#模板中数据绑定外的转义改为标准-xml-转义)
  - [模板片段使用 import template](#模板片段使用-import-template)
  - [navigator 嵌套限制](#navigator-嵌套限制)
  - [SVG 在 Skyline 下的限制与适配](#svg-在-skyline-下的限制与适配)

## Skyline 不支持或不建议使用的组件

| 组件 | Skyline 支持情况 | 替代/处理 |
| --- | --- | --- |
| `web-view` | 不支持 | 承载 `web-view` 的页面单独配置 `"renderer": "webview"` |
| `editor` | 不支持 | 纯文本编辑用 `textarea`；富文本编辑页降级 WebView；只读展示用 `rich-text` |
| `movable-area` / `movable-view` | 不支持 | 使用手势组件 + Worklet 动画替代 |
| `progress` | 不支持 | 用 `view` 嵌套实现进度条，动画进度可配合 Worklet 驱动 |
| `navigation-bar` | 不支持 | Skyline 只能使用自定义导航 |
| `xr-frame` | 不支持 | 3D/XR 页面降级 WebView，或用 `canvas` / WebGL 自行渲染 |
| `match-media` | 不支持 | 用实例 `this.createMediaQueryObserver()` 监听媒体条件，或用 `getWindowInfo()` 获取窗口尺寸后条件渲染 |
| `keyboard-accessory` | 不支持 | 用 `input` 的 `worklet:onkeyboardheightchange` 回调实现键盘跟随 |
| `page-meta` | 基本支持 | 全局页面滚动属性 `scroll-top` / `scroll-duration` 不支持；页面滚动需改用 `scroll-view` |

上述替代方案的调用约定：

- `this.createMediaQueryObserver(): MediaQueryObserver` 无参数，在组件实例中调用；`observer.observe(descriptor, callback): void` 的两个参数必填。`descriptor` 可选 `width/height/minWidth/maxWidth/minHeight/maxHeight: number`（px）及 `orientation: 'landscape' | 'portrait'`；回调 `(res: { matches: boolean }) => void` 接收是否匹配的结果，无需返回值。销毁时调用无参数的 `observer.disconnect(): void` 停止监听。见[官方实例方法](https://github.com/wechat-miniprogram/api-typings/blob/master/types/wx/lib.wx.component.d.ts)与[观察器类型](https://github.com/wechat-miniprogram/api-typings/blob/master/types/wx/lib.wx.api.d.ts)。
- `getWindowInfo()` 无参数、同步返回窗口信息；尺寸字段见[环境 API 基准](../base/api-reference.md#getwindowinfo)。
- `worklet:onkeyboardheightchange` 绑定 Worklet 函数 `(e) => void`，从 `e.detail.height: number` 读取键盘高度、`e.detail.pageBottomPadding: number` 读取页面上推高度，无需返回值。函数在 UI 线程执行，完整接入见[高级能力](./index.md#高级能力)与[官方键盘回调](https://github.com/wechat-miniprogram/skyline-skills/blob/master/skills/skyline-components/references/form/input.md#worklet-键盘回调)。

## WebView-only 属性、取值与行为

| 组件 | 属性 / 取值 / 场景 | 差异/替代 |
| --- | --- | --- |
| `image` | `mode="top"` / `bottom` / `center` / `left` / `right` / `top left` / `top right` / `bottom left` / `bottom right` | 这些裁剪模式仅 WebView 支持；Skyline 稳定使用 `scaleToFill` / `aspectFit` / `aspectFill` / `widthFix` / `heightFix` |
| `image` | `lazy-load` / `forceHttps` | WebView 特有；Skyline 默认懒加载，无需设置 `lazy-load` |
| `image` | SVG 百分比、`<style>`、`rgba()` 及 `scaleToFill` 表现 | 限制与处理见 [SVG 适配](#svg-在-skyline-下的限制与适配) |
| `text` | `space` | Skyline 不支持；连续空格不要依赖该属性 |
| `text` | `decode` | Skyline 不支持；不要依赖 HTML 实体解码行为 |
| `input` / `textarea` | `placeholder-class` | 仅 WebView 生效；Skyline 使用 `placeholder-style` |
| `input` / `textarea` | `safe-password-cert-path` / `safe-password-length` / `safe-password-time-stamp` / `safe-password-nonce` / `safe-password-salt` / `safe-password-custom-hash` | 安全键盘属性仅 WebView 生效 |
| `swiper` | `snap-to-edge` | WebView 特性，Skyline 不支持 |

## Skyline 必填属性与结构约束

| 组件 | 约束 | 说明 |
| --- | --- | --- |
| `scroll-view` | 必须显式声明 `type` | 可选 `list` / `custom` / `nested`；遗漏会退化为 WebView 渲染路径或无法正常工作 |
| `scroll-view type="list"` | 列表项必须是 `scroll-view` 的直接子节点 | 只有一个直接子节点时，按需渲染会退化 |
| `scroll-view type="nested"` | 外层必须使用 `type="nested"` | 内层 `scroll-view` 必须设置 `associative-container="nested-scroll-view"` |
| `navigator` | 仅可包含 `text` / 纯文本 | 详见 [navigator 嵌套限制](#navigator-嵌套限制) |
| `text` | 只能嵌套 `text` | 图文混排改用 `span`，写法见下表 |

## Skyline 相对 WebView 的高频差异补充

| 组件 | 差异 |
| --- | --- |
| `picker-view` | `indicator-style` 仅支持 `height` / `border` / `background-color`；`indicator-class` / `mask-style` 暂未支持；Skyline 默认存在上下边框，无自定义边框需设置 `indicator-style="border: none;"` 去除默认边框 |
| `swiper` | `layout-type="stackLeft"` / `stackRight` / `tinder` 时仅支持 `indicator-type="normal"` |
| `swiper` | `indicator-type="scrollFixedCenter"` / `swap` / `swapYRotation` 时不支持 `circular` |
| `swiper` | `previous-margin` / `display-multiple-items` / `vertical` 的布局计算与 WebView 不一致；设置 `next-margin > 0` 时对齐 WebView 实现 |
| `input` / `textarea` | 固定使用系统字体，`font-family` 无效；聚焦期间避免 CSS 动画；`bindkeyboardheightchange` 可能重复触发，相同高度应忽略 |
| `video` | 全屏已支持，投屏暂未支持；开发者工具暂未支持调试，需真机预览 |
| `map` / `canvas` / `camera` | 开发者工具暂未支持调试，需真机预览 |
| `rich-text` | 默认渲染模式不保证与 WebView 完全一致；`mode="web"` 时对齐 WebView |
| `scroll-view` | 滚动 `scroll-view` 会阻止页面回弹，无法触发页面级 `onPullDownRefresh` |
| `scroll-view` | `scroll-into-view` 优先级高于 `scroll-top`；目标 id 不能以数字开头 |
| `scroll-view` | 自定义下拉刷新节点必须声明 `slot="refresher"` |
| `scroll-view` | 滚动条长度为预估值；直接子节点高度差异较大时，滚动条长度不保证精确 |
| `scroll-view` | 横向滚动需同时开启 `enable-flex`，并设置横向布局样式（如 `flex-direction: row`）以兼容 WebView |
| `scroll-view` | `type="list"` 下列表项可加 `list-item` 启用样式共享优化；列表项仍必须是直接子节点 |
| `scroll-view` | 基础库 2.4.0 以下不支持嵌套 `textarea` / `map` / `canvas` / `video` |
| `text` | `user-select` 会使节点变为 `inline-block`；除文本节点外，其他节点无法长按选中 |
| `span` | 用于图文内联混排，仅微信支持，跨平台建议按 `<view mpxTagName@wx="span"></view>` |
| `sticky-section` / `sticky-header` | WebView 常用的 CSS `position: sticky` 在 Skyline 下应替换为 `scroll-view type="custom"` + `sticky-section` / `sticky-header` |

## 模板结构适配

### 模板中数据绑定外的转义改为标准 XML 转义

数据绑定外的引号用 XML 实体，不用反斜杠转义；绑定内无需额外转义。

```html
<view prop-a="&quot;test&quot;" prop-b="{{ test === 'test' }}" />
```

### 模板片段使用 import template

用 `<import>` 引入具名 `<template>`，通过 `is` 调用、`data` 传参，不使用 `<include>`。

```html
<import src="inc.wxml" />
<template is="item-content" data="{{ item: item }}" />

<!-- inc.wxml -->
<template name="item-content"><view>{{ item }}</view></template>
```

### navigator 嵌套限制

`navigator` 仅可包含 `text` 或纯文本；嵌套 `view`、`image`、`swiper`、自定义组件等可能静默渲染异常、图标缺失或点击区域错位。

```html
<navigator url="/pages/chat/index"><text>联系客服</text></navigator>
```

### SVG 在 Skyline 下的限制与适配

- **尺寸与坐标**：不支持百分比，改为具体数值。
- **样式与颜色**：`<style>` 选择器不生效，改用内联属性；`rgba()` 拆为颜色值与 `fill-opacity` / `stroke-opacity`。
- **拉伸一致性**：SVG 配合 `image mode="scaleToFill"` 时，WebView 默认按 `preserveAspectRatio` 居中留白，Skyline 会拉伸铺满。需要一致时在 SVG 根节点设置 `preserveAspectRatio="none"`，或避免使用该模式。

本例目标尺寸为 24 × 24，且需要随 image 的 scaleToFill 拉伸铺满。

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  viewBox="0 0 24 24" preserveAspectRatio="none">
  <path fill="#FF6400" fill-opacity="0.5" d="M0 0H24V24Z" />
</svg>
```

可用 [SVGOMG](https://jakearchibald.github.io/svgomg/) 清理冗余属性、合并路径以减小体积；优化后仍按上述限制检查兼容性。
