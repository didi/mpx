# Skyline 组件不支持与差异参考

本文只记录 WebView 迁移 Skyline 时需要关注的组件差异：不支持组件、不支持属性/取值、结构约束、方法差异。Skyline 新增能力不在本文展开，除非它是替代方案。

## 目录

- [Skyline 不支持或不建议使用的组件](#skyline-不支持或不建议使用的组件)
- [WebView-only 属性、取值与行为](#webview-only-属性取值与行为)
- [Skyline 必填属性与结构约束](#skyline-必填属性与结构约束)
- [Skyline 相对 WebView 的高频差异补充](#skyline-相对-webview-的高频差异补充)

## Skyline 不支持或不建议使用的组件

| 组件 | Skyline 支持情况 | 替代/处理 |
| --- |--------------| --- |
| `web-view` | 不支持          | 承载 `web-view` 的页面单独配置 `"renderer": "webview"` |
| `editor` | 不支持         | 纯文本编辑用 `textarea`；富文本编辑页降级 WebView；只读展示用 `rich-text` |
| `movable-area` / `movable-view` | 不支持         | 使用手势组件 + Worklet 动画替代 |
| `progress` | 不支持         | 用 `view` 嵌套实现进度条，动画进度可配合 Worklet 驱动 |
| `navigation-bar` | 不支持          | Skyline 只能使用自定义导航 |
| `xr-frame` | 不支持         | 3D/XR 页面降级 WebView，或用 `canvas` / WebGL 自行渲染 |
| `match-media` | 不支持          | 用 `wx.createMediaQueryObserver()` 监听媒体条件，或用 `getWindowInfo()` 获取屏幕尺寸后条件渲染 |
| `keyboard-accessory` | 不支持          | 用 `input` 的 `worklet:onkeyboardheightchange` 回调实现键盘跟随 |
| `page-meta` | 基本支持         | 全局页面滚动属性 `scroll-top` / `scroll-duration` 不支持；页面滚动需改用 `scroll-view` |

## WebView-only 属性、取值与行为

| 组件 | 不支持项 | 差异/替代                                                                                                                                                                                      |
| --- | --- |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `image` | `mode="top"` / `bottom` / `center` / `left` / `right` / `top left` / `top right` / `bottom left` / `bottom right` | 这些裁剪模式仅 WebView 支持；Skyline 稳定使用 `scaleToFill` / `aspectFit` / `aspectFill` / `widthFix` / `heightFix`                                                                                      |
| `image` | `lazy-load` / `forceHttps` | WebView 特有；Skyline 默认懒加载，无需设置 `lazy-load`                                                                                                                                                   |
| `image` | SVG 百分比单位、`<style>` 选择器匹配 | Skyline 下不支持；尺寸/坐标改为具体数值，样式改为内联属性                                                                                                                                                          |
| `image` | SVG + `mode="scaleToFill"` | 两端表现不一致：WebView 受 SVG 默认 `preserveAspectRatio` 影响居中留白（除非 SVG 根节点设置 `preserveAspectRatio="none"`），Skyline 会按 `image` 容器拉伸铺满；要求一致时显式设置 `preserveAspectRatio="none"`，或避免 SVG 使用 `scaleToFill` |
| `text` | `space` | Skyline 不支持；连续空格不要依赖该属性                                                                                                                                                                    |
| `text` | `decode` | Skyline 不支持；不要依赖 HTML 实体解码行为                                                                                                                                                               |
| `input` / `textarea` | `placeholder-class` | 仅 WebView 生效；Skyline 使用 `placeholder-style`                                                                                                                                                |
| `input` / `textarea` | `safe-password-cert-path` / `safe-password-length` / `safe-password-time-stamp` / `safe-password-nonce` / `safe-password-salt` / `safe-password-custom-hash` | 安全键盘属性仅 WebView 生效                                                                                                                                                                         |
| `swiper` | `snap-to-edge` | WebView 特性，Skyline 不支持                                                                                                                                                                     |

## Skyline 必填属性与结构约束

| 组件 | 约束 | 说明                                                                 |
| --- | --- |--------------------------------------------------------------------|
| `scroll-view` | 必须显式声明 `type` | 可选 `list` / `custom` / `nested`；遗漏会退化为 WebView 渲染路径或无法正常工作         |
| `scroll-view type="list"` | 列表项必须是 `scroll-view` 的直接子节点 | 只有一个直接子节点时，按需渲染会退化                                                 |
| `scroll-view type="nested"` | 外层必须使用 `type="nested"` | 内层 `scroll-view` 必须设置 `associative-container="nested-scroll-view"` |
| `navigator` | 只能嵌套 `text` 或纯文本 | 不能嵌套 `view` / `image` / 自定义组件                                      |
| `text` | 只能嵌套 `text` | 图文混排使用 `span`，仅微信支持，跨平台建议按 `<view mpxTagName@wx="span"></view>`    |

## Skyline 相对 WebView 的高频差异补充

| 组件 | 差异                                                                                                                                                                       |
| --- |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `picker-view` | `indicator-style` 仅支持 `height` / `border` / `background-color`；`indicator-class` / `mask-style` 暂未支持；Skyline 默认存在上下边框，无自定义边框需设置 `indicator-style="border: none;"` 去除默认边框 |
| `swiper` | `layout-type="stackLeft"` / `stackRight` / `tinder` 时仅支持 `indicator-type="normal"`                                                                                       |
| `swiper` | `indicator-type="scrollFixedCenter"` / `swap` / `swapYRotation` 时不支持 `circular`                                                                                          |
| `swiper` | `previous-margin` / `display-multiple-items` / `vertical` 的布局计算与 WebView 不一致；设置 `next-margin > 0` 时对齐 WebView 实现                                                         |
| `input` / `textarea` | 原生组件字体固定为系统字体，`font-family` 不生效；聚焦期间避免 CSS 动画                                                                                                                            |
| `video` | 全屏已支持，投屏暂未支持；开发者工具暂未支持调试，需真机预览                                                                                                                                           |
| `map` / `canvas` / `camera` | 开发者工具暂未支持调试，需真机预览                                                                                                                                                        |
| `rich-text` | 默认渲染模式不保证与 WebView 完全一致；`mode="web"` 时对齐 WebView                                                                                                                         |
| `scroll-view` | 滚动 `scroll-view` 会阻止页面回弹，无法触发页面级 `onPullDownRefresh`                                                                                                                     |
| `scroll-view` | `scroll-into-view` 优先级高于 `scroll-top`；目标 id 不能以数字开头                                                                                                                      |
| `scroll-view` | 自定义下拉刷新节点必须声明 `slot="refresher"`                                                                                                                                         |
| `scroll-view` | 滚动条长度为预估值；直接子节点高度差异较大时，滚动条长度不保证精确                                                                                                                                        |
| `scroll-view` | 横向滚动需同时开启 `enable-flex`，并设置横向布局样式（如 `flex-direction: row`）以兼容 WebView                                                                                                    |
| `scroll-view` | `type="list"` 下列表项可加 `list-item` 启用样式共享优化；列表项仍必须是直接子节点                                                                                                                   |
| `scroll-view` | 基础库 2.4.0 以下不支持嵌套 `textarea` / `map` / `canvas` / `video`                                                                                                                |
| `text` | `user-select` 会使节点变为 `inline-block`；除文本节点外，其他节点无法长按选中                                                                                                                    |
| `span` | 用于图文内联混排，仅微信支持，跨平台建议按 `<view mpxTagName@wx="span"></view>`                                                                                                               |
| `input` / `textarea` | `bindkeyboardheightchange` 存在多次触发场景，应忽略相同高度值避免重复布局                                                                                                                       |
| `sticky-section` / `sticky-header` | WebView 常用的 CSS `position: sticky` 在 Skyline 下应替换为 `scroll-view type="custom"` + `sticky-section` / `sticky-header`                                                      |
