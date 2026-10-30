# Web 模板与基础组件差异

本页以 [模板基础](../base/template-reference.md) 为基准，记录 Mpx 输出 Web 时的模板语法、基础组件支持情况、属性、事件与行为差异，以及平台扩展。

## 目录

- [使用说明](#使用说明)
- [事件绑定](#事件绑定)
- [具名模板](#具名模板)
- [i18n 国际化](#i18n-国际化)
- [基础组件](#基础组件)
  - [通用属性与事件](#通用属性与事件)
  - [view](#view)
  - [text](#text)
  - [rich-text](#rich-text)
  - [scroll-view](#scroll-view)
  - [swiper](#swiper)
  - [swiper-item](../base/template-reference.md#swiper-item)（基准）
  - [movable-area](../base/template-reference.md#movable-area)（基准）
  - [movable-view](#movable-view)
  - [image](#image)
  - [icon](../base/template-reference.md#icon)（基准）
  - [progress](#progress)
  - [form](#form)
  - [button](#button)
  - [label](#label)
  - [input](#input)
  - [textarea](#textarea)
  - [checkbox](#checkbox)
  - [checkbox-group](../base/template-reference.md#checkbox-group)（基准）
  - [radio](#radio)
  - [radio-group](../base/template-reference.md#radio-group)（基准）
  - [switch](../base/template-reference.md#switch)（基准）
  - [slider](#slider)
  - [picker](#picker)
  - [picker-view](#picker-view)
  - [picker-view-column](../base/template-reference.md#picker-view-column)（基准）
  - [navigator](#navigator)
  - [video](#video)
  - [canvas](#canvas)
  - [web-view](#web-view)
  - [cover-view](#cover-view)
  - [cover-image](#cover-image)
  - [sticky-header](#sticky-header)
  - [sticky-section](#sticky-section)
- [不支持组件与降级处理](#不支持组件与降级处理)
- [平台扩展](#平台扩展)
  - [使用 Vue 组件](#使用-vue-组件)（扩展）

## 使用说明

- 基础组件目录中标记“基准”的组件直接链接基础文档，表示本页比较范围内的能力与基准一致；其余组件在本页说明差异。差异说明仅覆盖基准收录的组件，平台扩展单独说明。
- 基础组件按基准文档的顺序排列。差异统一使用“差异类型｜说明”表格，按支持范围、属性差异、事件差异和使用约束列出适用项；扩展属性另表列出类型、默认值和用途。
- “基准”不代表微信完整组件能力均已适配；未收录的属性、事件及渲染器专属能力仍须核实。组件行为和使用条件也属于本页比较范围。

## 事件绑定

绑定语法见 [事件基准](../base/template-reference.md#事件绑定)，Web 的限制如下：

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持事件表达式：不能直接在事件绑定中执行 `count++`、`active && handleTap()` 等表达式，应将逻辑放入实例方法。动态选择方法名（如 `bindtap="{{active ? 'onActive' : 'onIdle'}}"`）仍可使用，表达式结果须为已声明的实例方法名字符串。 |
| 支持范围 | 不支持 WXS 响应事件：不能直接绑定 `bindtap="{{tool.onTap}}"` 这类 WXS 处理器。通过条件编译保留小程序实现，在 Web 侧提供等效的实例方法。 |
| 支持范围 | 组件自定义事件不支持冒泡和捕获：`triggerEvent` 不支持 `bubbles`、`composed`、`capturePhase` 选项；组件跨层通信使用 `provide/inject` 传递回调，或使用全局状态管理。 |
| 支持范围 | 不支持 `mut-bind`：Web 未实现互斥事件绑定语义，需通过事件处理方法协调响应，不能直接用 `catch` 代替其互斥行为。 |
| 事件差异 | 事件数据方面，Web 不会将 `mark:*` 收集到 `event.mark`；需要传递的数据可通过内联参数传入。 |

## 具名模板

基准中的 `<template name/is>` 与 `import`、data 作用域见 [具名模板](../base/template-reference.md#具名模板)。Web 支持同文件定义和外联 import，额外注意：

| 差异类型 | 说明 |
| --- | --- |
| 使用约束 | 同文件模板名不能重复；动态 is 的所有候选都须预先定义或引入。 |
| 使用约束 | Web 中的具名模板必须满足单根节点要求。 |
| 支持范围 | 不支持 `<include src="..." />`。 |

## i18n 国际化

配置、翻译与格式化函数范围及通用调用原则沿用 [i18n 基准](../base/template-reference.md#i18n-国际化)。

## 基础组件

组件用途、属性和事件契约见 [基础组件](../base/template-reference.md#基础组件)。仅有差异的组件在此展开；一致项直接使用目录中的基准链接，不支持项见 [不支持组件与降级处理](#不支持组件与降级处理)。

### 通用属性与事件

| 差异类型 | 说明 |
| --- | --- |
| 使用约束 | Web-only 原生节点可使用浏览器标准属性；包装型内建组件不保证任意原生属性透传。 |

### view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 点击态属性沿用基准，支持 `animation`。 |
| 事件差异 | 提供 `transitionend/animationstart/animationiteration/animationend`；事件详情以 Web 为准。 |

### text

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持微信的 `user-select`；需要选择文本时使用 `selectable`。 |

### rich-text

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 支持基准的 `nodes/space`；HTML 内容的安全策略与微信不等价，不保证其他微信属性或内部节点交互语义。 |

### scroll-view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `enable-flex`，直接使用 Web CSS。微信的 `enable-back-to-top`、`scroll-into-view-offset`、`bounces/paging-enabled/show-scrollbar` 等增强能力不能由同名属性推定可用。 |
| 属性差异 | `scroll-top/scroll-left` 默认 `0`；位置和阈值均接受基准中的 number\|string。 |
| 属性差异 | `refresher-background` 默认空字符串。开启 `refresher-enabled` 且设置 `refresher-default-style="none"` 时，可通过 `slot="refresher"` 提供刷新内容；未提供时不渲染刷新内容。 |
| 事件差异 | 支持基准中的滚动、阈值、下拉刷新事件，`dragstart/dragging/dragend` 需 `enhanced`；`dragend.detail` 不提供微信的 velocity。 |
| 使用约束 | Web 使用 BetterScroll，区别于浏览器原生页面滚动。 |
| 使用约束 | 下拉刷新与鼠标滚轮表现受浏览器输入设备影响，不应将所有交互等同于触屏宿主。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `scroll-options` | object | `{}` | 设置滚动选项；不能通过 `observeDOM` 开启自动 DOM 监听。异步内容布局完成后检查滚动范围是否更新。 |
| `enable-sticky` | boolean | `false` | 用于吸顶场景，关闭滚动的 CSS transition，并取消 scroll 回调的常规节流间隔。 |

### swiper

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `display-multiple-items/skip-hidden-item-layout`，需要多项同屏时接入 Web 轮播方案，保留其他轮播功能。 |
| 属性差异 | `previous-margin/next-margin` 未提供时为空值；`easing-function="default"` 使用 BetterScroll 默认缓动。 |
| 事件差异 | `change/animationfinish` 的 detail 除基准的 current/source 外还提供 `currentItemId`；不要依赖此字段作为全端保证。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `scroll-options` | object | `{}` | 作为 BetterScroll 初始化选项。 |

### movable-view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | `animation` 不生效，不能以此开关动画。 |
| 属性差异 | `x/y` 为 number、默认 `0`，不把微信 string 偏移当作 Web 支持保证。 |
| 属性差异 | `damping` 仅影响越界回弹时间，正值越大回弹越快；不影响程序更新 x/y 的位移动画。 |
| 事件差异 | `scale` 回调的 `event.type` 为 `change`；根据绑定入口和 detail 判断缩放，不要判断 `event.type === 'scale'`。 |

### image

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `lazy-load/show-menu-by-longpress`；需要时分别接入 Web 懒加载与长按交互。 |
| 属性差异 | 默认尺寸为 300×225px，不同于微信的 320×240px；需要一致布局时明确设置尺寸。 |
| 事件差异 | `error.detail` 为空对象，不提供微信的 `errMsg`。 |
| 使用约束 | 缩放计算可能产生小数尺寸，实际显示受 WebView 内核取整影响。 |

### progress

| 差异类型 | 说明 |
| --- | --- |
| 属性差异 | 使用 `active-color/background-color` 设置颜色。旧 `color` 会被默认 `active-color="#09BB07"` 覆盖，不能单独用它改变颜色。 |
| 属性差异 | `percent` 默认 `0`。 |
| 事件差异 | `activeend.detail = {curPercent}`。 |

### form

| 差异类型 | 说明 |
| --- | --- |
| 事件差异 | `submit.detail` 只提供 `value`，不提供微信 `formId`；`reset` 恢复控件初始值。 |
| 使用约束 | 仅收集已接入的控件，自定义控件不会自动进入提交数据。 |

### button

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 普通样式、点击态和表单提交属性沿用基准。不支持小程序宿主 `open-type` 及配套事件，分享、授权等须接入 Web 方案。 |

### label

| 差异类型 | 说明 |
| --- | --- |
| 使用约束 | 支持基准的包裹结构及 `for` 关联，点击后的控件响应与聚焦行为需在目标浏览器验证。 |

### input

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `placeholder-class/placeholder-style` 和微信 `confirm-type/confirm-hold/cursor-spacing/adjust-position/hold-keyboard` 的软键盘语义，也不提供 `confirm/selectionchange/keyboardheightchange` 的微信事件契约。 |
| 属性差异 | `type`：支持 `text/number`；`digit` 按浏览器数字输入处理，不支持微信 `idcard/safe-password/nickname`。 |
| 属性差异 | `auto-focus/focus`：仅初始聚焦，受浏览器策略限制；动态修改 focus 不会主动聚焦或失焦。 |
| 属性差异 | `cursor`：默认 `-1`；选区控制受 input 类型与浏览器支持限制。 |
| 事件差异 | `input/focus/blur`：detail 均只提供 `{value}`；input 无 cursor/keyCode，focus 无键盘 height，blur 无安全输入字段。 |

### textarea

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `auto-height`、`placeholder-class/placeholder-style` 和微信软键盘配置；需要时接入 Web 的输入与布局能力。 |
| 属性差异 | `auto-focus/focus` 与 [input](#input) 一样仅初始生效。 |
| 事件差异 | `input/focus/blur` 的 detail 均只提供 `{value}`，缺少基准中的 cursor/keyCode/height 等附加字段；不支持 `confirm/linechange/selectionchange/keyboardheightchange` 的微信事件语义。 |

### checkbox

| 差异类型 | 说明 |
| --- | --- |
| 属性差异 | 不支持通过 `color` 改变选中颜色；`checked` 只控制初始选中，后续动态修改不会同步。 |

### radio

| 差异类型 | 说明 |
| --- | --- |
| 属性差异 | 不支持通过 `color` 改变选中颜色；`checked` 只控制初始选中，后续动态修改不会同步。 |

### slider

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持旧 `color/selected-color`，分别使用 `backgroundColor/activeColor`。 |
| 属性差异 | `value` 仅初始化时限制到 `[min, max]` 并设置内部值，后续动态修改不会同步滑块。 |

### picker

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `region`；需要时单独接入地区选择方案并保留原地区名称和代码，不用普通索引替代地区语义。`header-text` 不生效，不能通过它设置弹层标题。 |
| 属性差异 | `time/date` 的 `value` 默认空字符串；`start/end` 默认 `1970-01-01/2100-01-01`。这对 time 模式不是合法的 `hh:mm` 范围，可能使滚轮异常；仅在 Web 为缺失范围的时间选择器提供业务有效值，已有有效范围无需修改。 |

### picker-view

| 差异类型 | 说明 |
| --- | --- |
| 属性差异 | 未传 `value` 时从各列读取当前索引，不预设统一的空数组默认状态。选中框、蒙层与 change 契约沿用基准；不保证微信滚动开始/结束事件或其他增强属性。 |

### navigator

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 支持 `navigate/redirect/navigateBack/reLaunch`；不支持 `switchTab` 属性值，tabBar 跳转改用 `mpx.switchTab`。不支持跨小程序导航。 |
| 属性差异 | `hover-class` 默认 `none`。 |
| 事件差异 | 不支持跨小程序导航的 `success/fail/complete`。 |
| 使用约束 | 只有需要通过 `navigateTo({events, success})` 建立 Web EventChannel 时，才在 Web 接入脚本导航并保留小程序原入口；不要同时显示两个可点击入口。 |

### video

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持微信弹幕、投屏、画中画、旋转和手势类属性。 |
| 属性差异 | `src/controls/autoplay/loop/poster/initial-time/playsinline` 及基准中的 `show-*` 属性仅初始化生效；动态修改不能切换视频地址或控件显隐。`muted/object-fit` 支持动态更新。 |
| 事件差异 | `timeupdate`：不保证微信 `detail.currentTime/duration`。 |
| 事件差异 | `loadedmetadata`：不保证微信 `detail.width/height/duration`。 |
| 事件差异 | `fullscreenchange`：detail 为 `{fullScreen}`，无微信 direction。 |
| 事件差异 | `seekcomplete`：detail 为 `{position}`。 |
| 事件差异 | `progress`：detail 为 `{buffered}`。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `playsinline` | boolean | `true` | 控制浏览器行内播放相关属性。 |

### canvas

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 支持基准中的节点式 2D 绘图；与浏览器 Canvas 的差异通过对应环境 API 处理。 |
| 支持范围 | 不支持 `canvasToTempFilePath`，Web 使用 `canvas.toBlob()` / `canvas.toDataURL()`。 |
| 支持范围 | 不支持 `canvas.createPath2D()`，Web 条件编译使用 `new Path2D(...)`。 |
| 支持范围 | 不支持旧版 `wx.createCanvasContext`。 |

### web-view

| 差异类型 | 说明 |
| --- | --- |
| 事件差异 | `message` 接收符合桥接协议的 iframe 消息，业务数据位于 `detail.data`，不会自动包装成微信的消息数组。 |
| 事件差异 | `load` 转发 iframe load，不能保证业务页面成功可用。 |
| 事件差异 | `error` 只覆盖空地址或白名单拒绝，不覆盖网络、HTTP 或嵌入策略错误。 |
| 使用约束 | 使用 iframe；`src` 配合 `webviewConfig.hostWhitelists` 校验来源，不沿用微信业务域名配置。 |
| 使用约束 | iframe 向父窗口发送对象或其 JSON 字符串，例如 `{type: 'postMessage', args: [{data: {value: 1}}]}`，也支持 `{type: 'postMessage', payload: {data: {value: 1}}}`；普通业务数据不会触发 message。 |
| 使用约束 | `args` 为数组时优先使用 `args[0]`，否则使用 payload；`detail.data` 取该参数的 data（为真值时），否则取参数本身。消息须通过来源白名单；如提供 clientUid，其数值还须匹配当前实例。交付时机不同于微信后退、销毁等阶段的聚合消息。 |

### cover-view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 按普通容器使用，不提供微信覆盖原生组件的层级能力。 |

### cover-image

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 图片能力见 [image](#image)，不提供微信覆盖原生组件的层级能力。 |

### sticky-header

| 差异类型 | 说明 |
| --- | --- |
| 使用约束 | 结构、offset-top、padding 与事件沿用 [基准](../base/template-reference.md#sticky-header)。Web 由滚动组件模拟吸顶，不依赖微信 Skyline 渲染器，也不提供其 worklet 能力。 |

### sticky-section

| 差异类型 | 说明 |
| --- | --- |
| 使用约束 | 结构沿用 [基准](../base/template-reference.md#sticky-section)，与 Web 的 scroll-view、sticky-header 实现配合。 |

## 不支持组件与降级处理

以下仅列出基准范围内当前 Web 不支持的组件及替代方向。

- `camera`：使用浏览器媒体能力或业务 H5 SDK。
- `root-portal`：portal/dialog 或业务组件，并接入原状态和事件。

## 平台扩展

### 使用 Vue 组件

Mpx Web 基于 Vue 2.7，可在页面或组件的 JSON 配置中通过 `usingComponents` 注册兼容 Vue 2.7 的 `.vue` 组件，再在模板中使用注册的标签名。只支持 Vue 3 的组件不能直接使用，需选择 Vue 2 兼容版本。

#### 注册与使用

例如，在 `.mpx` 文件中通过动态 JSON 为同一标签选择不同平台的实现，并通过 `title` 属性和默认插槽传入内容：

```html
<template>
  <info-card title="{{title}}">
    <text>卡片内容</text>
  </info-card>
</template>

<script name="json">
module.exports = {
  usingComponents: {
    // Web 使用 Vue 组件，其他平台使用 Mpx 组件
    // 两侧组件需提供相同的属性、事件和插槽接口
    // 若接口无法完全对齐，模板使用时也应进行条件编译隔离
    'info-card': __mpx_mode__ === 'web'
      ? './InfoCard.vue'
      : './info-card.mpx'
  }
}
</script>
```

调用方需在脚本中提供 `title` 数据；`InfoCard.vue` 按 Vue 2.7 的写法声明 `title` prop，并使用 `<slot />` 渲染插槽内容。`.mpx` 调用方沿用 Mpx 的模板绑定语法，`.vue` 组件内部使用 Vue 语法。

#### 通过脚本注册

Web 还支持在 `createPage` / `createComponent` 中的 `components` 配置进行 Vue 组件注册，当 Vue 组件模块还提供其他导出（如工具函数、常量）时，推荐采用这种方式，因为在 `usingComponents` 中无法获取其他导出。

在跨端共用的 `.mpx` 文件中，必须通过条件编译隔离 Vue 组件引用与注册，避免影响原平台产物。
