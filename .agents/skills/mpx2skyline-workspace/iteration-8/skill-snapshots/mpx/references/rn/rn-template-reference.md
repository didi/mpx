# RN 模板与基础组件差异

本页以 [模板基础](../base/template-reference.md) 为基准，记录 Mpx 输出 RN 时的模板语法、基础组件支持情况、属性、事件与行为差异，以及平台扩展。

## 目录

- [使用说明](#使用说明)
- [数据绑定与指令](#数据绑定与指令)
- [事件绑定](#事件绑定)
- [Slot 与动态组件](#slot-与动态组件)
- [具名模板](#具名模板)
- [i18n 国际化](#i18n-国际化)
- [无障碍访问](#无障碍访问)
- [基础组件](#基础组件)
  - [通用属性与事件](#通用属性与事件)
  - [view](#view)
  - [text](#text)
  - [rich-text](#rich-text)
  - [scroll-view](#scroll-view)
  - [swiper](#swiper)
  - [swiper-item](../base/template-reference.md#swiper-item)（基准）
  - [movable-area](#movable-area)
  - [movable-view](#movable-view)
  - [image](#image)
  - [icon](../base/template-reference.md#icon)（基准）
  - [progress](#progress)
  - [form](#form)
  - [button](#button)
  - [label](#label)
  - [input](#input)
  - [textarea](#textarea)
  - [checkbox](../base/template-reference.md#checkbox)（基准）
  - [checkbox-group](../base/template-reference.md#checkbox-group)（基准）
  - [radio](../base/template-reference.md#radio)（基准）
  - [radio-group](../base/template-reference.md#radio-group)（基准）
  - [switch](../base/template-reference.md#switch)（基准）
  - [slider](#slider)
  - [picker](#picker)
  - [picker-view](#picker-view)
  - [picker-view-column](../base/template-reference.md#picker-view-column)（基准）
  - [navigator](#navigator)
  - [video](#video)
  - [canvas](#canvas)
  - [camera](#camera)
  - [web-view](#web-view)
  - [cover-view](#cover-view)
  - [cover-image](#cover-image)
  - [root-portal](#root-portal)
  - [sticky-header](#sticky-header)
  - [sticky-section](#sticky-section)
- [平台扩展](#平台扩展)
  - [模板相关编译配置](#模板相关编译配置)
  - [自定义基础组件](#自定义基础组件)
  - [section-list](#section-list)（扩展）

## 使用说明

- 基础组件目录中标记“基准”的组件直接链接基础文档，表示本页比较范围内的能力与基准一致；其余组件在本页说明差异。差异说明仅覆盖基准收录的组件，平台扩展单独说明。
- 基础组件按基准文档的顺序排列。差异统一使用“差异类型｜说明”表格，按支持范围、属性差异、事件差异和使用约束列出适用项；扩展属性另表列出类型、默认值和用途。
- “基准”不代表微信完整组件能力均已适配；未收录的属性、事件及渲染器专属能力仍须核实。组件行为和使用条件也属于本页比较范围。

## 数据绑定与指令

Mustache 与指令的基准写法见 [数据绑定与指令](../base/template-reference.md#数据绑定与指令)。

| 差异类型 | 说明 |
| --- | --- |
| 属性差异 | `wx:key` 解析为对象时 RN 会回退列表索引；使用唯一、稳定的字符串或数字 key。 |
| 使用约束 | 同标签条件分支可被 React 复用；涉及不同按需样式能力时提供独立 `key` / `wx:key`，或预声明能力并集，见 [按需样式能力预声明](./rn-style-practice.md#按需样式能力预声明)。 |
| 使用约束 | selector API 目标须声明 `wx:ref`，空值或具名均可，支持 `#id` / `.class` 及 `.a.b` 这样的连续类选择器；`wx:ref="name"` 同时提供具名访问，见 [RN 脚本](./rn-script-reference.md#页面与组件实例属性与方法)。 |

## 事件绑定

通用事件定义与绑定写法见 [模板基础](../base/template-reference.md)。

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | RN 仅 `tap`、`longpress`、`touchstart`、`touchmove`、`touchend`、`touchcancel` 支持阻止冒泡和捕获；其他事件使用 `catch`、`capture-bind` 或 `capture-catch` 时，会警告并降级为普通 `bind`。 |
| 事件差异 | 子组件绑定 `catchtouchend` 后，父组件的 `tap` 不会响应。 |
| 使用约束 | iOS 中目标或祖先的 `opacity: 0` 会使目标无法响应事件，点击可能穿透到底层；恢复为 `1` 后可正常响应。极低的非零 opacity 也可能影响点击，仅背景透明不影响点击响应。 |
| 使用约束 | 事件内联传参优先于 dataset；基准写法见 [模板基础](../base/template-reference.md)。 |

## Slot 与动态组件

基准写法见 [Slot 与动态组件](../base/template-reference.md#slot-与动态组件)。

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 多插槽在 RN 默认已支持；保留 `options.multipleSlots: true` 可兼容微信多插槽。 |

## 具名模板

基准写法见 [具名模板](../base/template-reference.md#具名模板)。

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | RN 支持具名模板的内联和 `import`；不支持 `include`。 |

## i18n 国际化

配置与通用调用原则见 [i18n 基准](../base/template-reference.md#i18n-国际化)，函数支持范围与行为差异如下。

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 受运行环境限制，暂不支持基准中的 `$d/d` 日期格式化与 `$n/n` 数字格式化；`$t/t`、`$te/te`、`$tm/tm` 沿用基准。 |
| 行为差异 | RN 不受小程序 `i18n.useComputed` 无法引用循环局部变量的限制；同一模板还输出小程序时，列表翻译仍建议在 JS 中预先完成。 |

## 无障碍访问

| 差异类型 | 说明 |
| --- | --- |
| 使用约束 | 沿用 [基准](../base/template-reference.md#无障碍访问) 的 `aria-role`、`aria-label`，不要在公共模板中直接改成 `accessibilityRole`、`accessibilityLabel` 等 RN 原生属性。确有 RN 专有需求时，通过条件编译隔离；`wx:show` 或样式隐藏后的焦点与读屏顺序应单独验证。关键交互分别在 iOS VoiceOver 和 Android TalkBack 上检查。 |

## 基础组件

组件用途、属性和事件契约见 [基础组件](../base/template-reference.md#基础组件)。仅有差异的组件在此展开；一致项直接使用目录中的基准链接。

### 通用属性与事件

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 以下扩展不能直接当作小程序或 Web 属性使用。 |
| 使用约束 | `view`、`text`、`scroll-view`、`image`、`input` 还可透传对应 RN 原生组件属性；这些属性不属于跨端基准。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable-offset` | boolean | `false` | 获取布局偏移；触摸事件的 `currentTarget`、组件自定义事件的 `target` 提供 `offsetLeft`、`offsetTop` |
| `enable-var` | boolean | `true` | 启用 CSS variable 计算 |
| `enable-text-pass-through` | boolean | `false` | 开启文本样式与文本属性透传上下文；会动态添加这些能力时预先开启 |
| `parent-width` | number | — | 提供父容器宽度，用于百分比、`calc()` 等计算 |
| `parent-height` | number | — | 提供父容器高度，用于百分比、`calc()` 等计算 |

### view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `hover-stop-propagation`。 |
| 事件差异 | `transitionend.detail` 为 `{ elapsedTime, finished, current }`。 |
| 使用约束 | `enable-background`、`enable-animation` 等样式能力须在首次渲染确定；生命周期内可能使用时，首次就显式开启。无需求时不开启，避免额外消耗；背景图相关 CSS 仅 `view` 支持，开启 `enable-background` 时提供唯一 key。 |
| 使用约束 | 非 `text` 容器中的裸文字会被自动包装；会增加节点与渲染开销，优先显式使用 `text`。布局对齐见 [text 跨平台布局对齐](./rn-style-practice.md#text-跨平台布局对齐)。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable-background` | boolean | `false` | 启用 background-image、background-size、background-position 计算与渲染 |
| `enable-animation` | boolean | `false` | 启用动画渲染 |
| `enable-fast-image` | boolean | `true` | 渲染背景图片时默认使用 `@d11/react-native-fast-image`，设为 `false` 时使用 React Native 原生 `Image` |
| `is-simple` | 标记 | — | 使用精简实现，不提供 CSS variable、calc、ref 等扩展 |

### text

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `space`。 |
| 使用约束 | `enable-offset` 的布局信息仅在首次渲染时获取。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `is-simple` | 标记 | — | 使用精简文本实现，不提供 CSS variable、calc、ref 等扩展。 |

### rich-text

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 基于 WebView 渲染 `nodes`；只按基准使用节点数组或 HTML 字符串，不保证微信 `space/user-select` 等其他属性或节点交互能力等价。 |

### scroll-view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | `enable-back-to-top` 仅 iOS；`bounces` 为 iOS 边界弹性，须同时启用 `enhanced`。`paging-enabled`、`show-scrollbar`、`dragstart/dragging/dragend` 也依赖 `enhanced`。 |
| 支持范围 | `refresher-default-style`、`refresher-background` 仅 Android；`refresher-threshold` 仅对自定义下拉节点生效，当前编译规则仍可能对此属性给出不支持警告。 |
| 支持范围 | 不支持 `enable-passive`、`scroll-anchoring`、`using-sticky`、`fast-deceleration`；不需要 `enable-flex` 开启横向 flex 布局。不支持 `refresherpulling/refresherrestore/refresherabort`。 |
| 属性差异 | `upper-threshold` / `lower-threshold`：仅 number，默认 `50`；不支持基准的字符串类型 |
| 属性差异 | `scroll-top` / `scroll-left`：仅 number，默认 `0`；不支持基准的字符串类型 |
| 属性差异 | `refresher-background`：未指定固定默认值；自定义刷新节点背景回退透明色，原生刷新控件使用宿主默认背景 |
| 事件差异 | 滚动过程中自身及子组件不会响应 `touchend`，不要据此判断滚动结束；可使用 `scrollend`。Android 触发默认下拉刷新时可能仅触发 `dragstart`，不触发 `dragend`。 |
| 使用约束 | `scroll-into-view` 的目标必须是已声明 `wx:ref` 的内置基础组件；不支持以自定义组件为目标。支持基准中的 `scroll-into-view-offset`。 |
| 使用约束 | 监听滚动导致的节点曝光变化时，在影响目标位置的 `scroll-view` 上开启 `enable-trigger-intersection-observer`。 |
| 使用约束 | 手势协同语义见 [simultaneousWithExternalGesture](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/#simultaneouswithexternalgesture) 与 [requireExternalGestureToFail](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/#requireexternalgesturetofail)。下文同名扩展遵循相同约定。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable-trigger-intersection-observer` | boolean | `false` | 滚动时按观察器节流配置重新测量相交区域 |
| `simultaneous-handlers` | array\<object> | `[]` | 允许多个手势同时识别；可传入通过 `this.$refs.xxx` 获取的组件实例 |
| `wait-for` | array\<object> | `[]` | 等待指定手势识别失败后再激活；实例获取方式同上 |
| `scroll-event-throttle` | number | `0` | 控制 scroll 事件触发频率 |
| `enable-sticky` | boolean | `false` | 使用 sticky 组件时必须开启 |

### swiper

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `display-multiple-items`、`snap-to-edge`，也不支持 `transition`、`animationfinish` 事件。 |
| 属性差异 | `previous-margin`、`next-margin` 使用 px。 |
| 属性差异 | `easing-function` 运行时支持 `default`、`linear`、`easeInCubic`、`easeOutCubic`、`easeInOutCubic`，默认 `default`；当前编译规则仍会对此属性给出不支持警告，需结合工程版本验证。 |
| 事件差异 | `change.detail.source` 当前固定为 `touch`，不能据此判断切换是否由手势、自动播放或代码引起。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `indicator-width` / `indicator-height` | number | `8` | 指示点宽、高 |
| `indicator-spacing` | number | `4` | 指示点间距 |
| `indicator-radius` | number | `4` | 指示点圆角 |
| `indicator-margin` | number | `10` | 指示点外边距 |
| `scale` | boolean | `false` | 滑动时将前后元素缩小为 0.7 倍，不支持自定义缩放比 |
| `simultaneous-handlers` / `wait-for` | array\<object> | `[]` | 见 scroll-view 手势协同 |
| `disableGesture` | boolean | `false` | 禁用滑动手势；仍可通过 `current` 或 `autoplay` 切换 |

### movable-area

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 父子结构沿用 [基准](../base/template-reference.md#movable-area)，RN 不支持通过 movable 组件实现缩放。 |

### movable-view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `scale`、`scale-min`、`scale-max`、`scale-value` 及缩放事件。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `workletChange` | function | — | 在 UI 线程即时接收 `{ x, y, source }`，不受 `changeThrottleTime` 影响；函数体须含 `'worklet'`，参数不是完整 Mpx 事件 |
| `simultaneous-handlers` / `wait-for` | array\<object> | `[]` | 见 scroll-view 手势协同 |
| `disable-event-passthrough` | boolean | `false` | 消费非移动方向上的手势，例如横向移动时也阻止竖向手势传递给其他组件 |

### image

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 支持本地静态资源 `src="./logo.png"`、`src="./icon.svg"`；动态绑定本地资源时在脚本中 `import` 后绑定。不支持 `lazy-load`、`show-menu-by-longpress`、`fade-in` 等微信平台能力。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable-fast-image` | boolean | `true` | 默认使用 `@d11/react-native-fast-image` 渲染非 SVG 图片，设为 `false` 时使用 React Native 原生 `Image` |
| `is-svg` | boolean | `false` | 强制使用 SVG 方式渲染 |

### progress

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `show-info`、`border-radius`、`font-size`；百分比文案需另行渲染。 |
| 属性差异 | `percent` 默认 `0`。 |
| 事件差异 | `activeend.detail = { percent }`。 |

### form

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 支持基准的 `name` 收集及 `submit/reset`；不支持 `report-submit/report-submit-timeout`。 |
| 事件差异 | 提交结果仅提供 `detail.value`，不提供微信 `formId`。 |

### button

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | `open-type` 仅适配 `share/getUserInfo`；不能直接使用手机号、客服、授权、开放 App 等其他开放能力及其配套属性/事件。`hover-stop-propagation` 不支持。 |
| 事件差异 | `getuserinfo` 回调直接接收宿主提供的对象，不能假设字段包装与微信事件相同。 |
| 使用约束 | 须在运行时 `mpx.config.rnConfig` 注册对应的 `onShareAppMessage/onUserInfo` 能力。 |

### label

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `for` 按 id 关联控件；仅支持包裹 `checkbox`、`radio`、`switch` 进行关联。 |

### input

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | `type` 支持 `text/number/idcard/digit`，不支持 `safe-password/nickname`；`idcard` 映射为文本输入模式。 |
| 支持范围 | `confirm-type` 支持基准值及 `return`；`confirm-hold` 支持。`hold-keyboard` 自 2.10.18 起支持。 |
| 支持范围 | 不支持 `always-embed`、`safe-password-*`、`nicknamereview`、`keyboardheightchange` 及输入法组合事件等 `keyboard*` 事件。 |
| 属性差异 | `placeholder-class`、`placeholder-style` 仅支持 color。 |
| 事件差异 | `input`：`detail = { value, cursor }`，无 `keyCode` |
| 事件差异 | `focus`：`detail = { value }`，无键盘 `height` |
| 事件差异 | `blur`：`detail = { value }`，无 `encryptedValue/encryptError` |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `keyboard-type` | string | — | 指定 RN 键盘类型。 |

### textarea

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `confirm-hold/fixed/show-confirm-bar/always-embed/disable-default-padding/adjust-keyboard-to`。 |
| 属性差异 | placeholder 的样式限制、`keyboard-type` 扩展及 `hold-keyboard` 的使用限制见 [input](#input)；`confirm-type` 默认 `return`。 |
| 事件差异 | `input/focus` 的字段差异同 input；`blur.detail` 仅有 `{value}`，缺少基准中的 `cursor`。 |
| 事件差异 | `linechange` 仅在 `auto-height` 开启且内容高度改变时触发，返回 `{height, lineHeight, lineCount}`，不提供 `heightRpx`。 |

### slider

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `show-value`；值文案需另行渲染。 |
| 属性差异 | `block-size` 限制为 12–28；未提供 `value` 时使用 `min`。 |

### picker

| 差异类型 | 说明 |
| --- | --- |
| 属性差异 | `time` 模式省略值时，`value/start/end` 分别为 `00:00/00:00/23:59`。 |
| 属性差异 | `date` 模式默认可选范围为 `1900-01-01` 至 `2099-12-31`。 |
| 事件差异 | `region` 的 `change.detail` 仅提供 `value`，不提供微信的 `code/postcode`。 |
| 使用约束 | 支持基准中的五种模式。`picker` 节点的文本样式会透传给触发区域子节点。 |

### picker-view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持 `pickstart/pickend` 事件及 `immediate-change` 能力。 |
| 使用约束 | 可注册运行时 `mpx.config.rnConfig.onPickerVibrate`，在每次滚动选择时执行自定义触感反馈。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable-wheel-animation` | boolean | `true` | 控制滚轮动画，2.10.17+。 |

### navigator

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 支持 `navigate/redirect/switchTab/reLaunch/navigateBack`；不支持 `exit`、跳转其他小程序、`hover-stop-propagation` 和 `short-link`。不要将 API 名 `navigateTo` 写成 `open-type` 值。 |
| 属性差异 | `hover-stay-time` 默认 `400`，不同于微信的 `600`；不自带微信 `navigator-hover` 默认点击态。 |
| 事件差异 | 不支持 `success/fail/complete`。 |

### video

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | `controls=false` 时不显示 `poster`。默认播放控件之外的按钮布局、弹幕、页面手势、画中画、投屏、后台播放等微信能力不保证支持。 |
| 支持范围 | 不支持 `progress`、画中画进入/离开、投屏系列事件。 |
| 事件差异 | 手动拖动进度条时，Android 可触发 `seekcomplete`，iOS 不支持此场景；`controlstoggle` 仅 Android。`seekcomplete.detail.position` 在 Android 为毫秒、iOS 为秒，跨系统消费前须统一单位。 |
| 事件差异 | `fullscreenchange.detail.fullScreen` 为数值 `1/0`，没有微信 `direction` 字段；不要按布尔严格相等判断。 |
| 使用约束 | 需在宿主安装 `react-native-video`。 |

**扩展属性**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable-auto-rotation` | boolean | `false` | 仅 iOS，系统开启自动旋转时生效 |
| `preferred-peak-bit-rate` | number | `0` | 码率上界，单位比特/秒 |
| `is-drm` | boolean | `false` | 是否使用 DRM 视频源 |
| `provision-url` | string | — | Android DRM 认证地址 |
| `certificate-url` | string | — | iOS DRM 认证地址 |
| `license-url` | string | — | DRM 授权地址，与 `is-drm` 配合 |

### canvas

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 仅支持 2D，不支持 WebGL；不支持 `canvas-id`、`disable-scroll`，也不能通过 `type` 切换绘图后端。支持基准中的 `createImage/createImageData/getContext/toDataURL`，但经 WebView 消息通信绘制，依赖执行顺序的操作须按异步方式组织，例如 `drawImage` 后 `getImageData` 使用 `await` 保证时序。`createImage` 的图片 URL 避免特殊字符，否则 Android 可能加载失败。 |

### camera

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 支持基准的 `normal/scanCode`、分辨率、朝向、帧尺寸及初始化/扫码事件；扫码仅识别二维码，`flash` 仅 `auto/on/off`，不支持 `torch`。 |
| 支持范围 | 上下文支持 `setZoom/takePhoto/startRecord/stopRecord`，不保证微信逐帧回调等其他能力。 |
| 使用约束 | 需在宿主安装 `react-native-vision-camera` 并完成相机权限配置。 |

### web-view

| 差异类型 | 说明 |
| --- | --- |
| 事件差异 | 被打开的 H5 需使用 `@mpxjs/webview-bridge@2.9.68` 或以上版本通信，见 [H5 Bridge 接入说明](https://mpxjs.cn/guide/extend/webview-bridge.html)；不要依赖微信网页 JS SDK 直接驱动 RN。`message` 在收到消息时直接触发，`detail.data` 直接透传本次发送的数据，不是微信在特定时机累积的消息数组。 |
| 使用约束 | 自动铺满整个 RN 页面，不支持通过 `style` 修改容器。需要 URL 白名单时由业务在跳转前校验。 |

### cover-view

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | RN 中按普通 [view](#view) 渲染，不提供微信原生组件覆盖层语义；微信的嵌套与覆盖层限制不能据此套用到 RN。 |

### cover-image

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | RN 中按普通 [image](#image) 渲染，不提供微信原生组件覆盖层语义；不支持 `referrer-policy`。 |

### root-portal

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 不支持在 style 中使用百分比计算或 CSS variable。 |

### sticky-header

| 差异类型 | 说明 |
| --- | --- |
| 使用约束 | 父级 `scroll-view` 须开启 `enable-sticky`。适合内容稳定的场景；Android 在吸顶动画期间立即更新状态（如在 `stickontopchange` 中更新）、滚动内容高度减小、通过 `scroll-into-view/scroll-top` 滚动时，可能闪烁或抖动。 |

### sticky-section

| 差异类型 | 说明 |
| --- | --- |
| 支持范围 | 作为 `scroll-view` 的直接子节点使用，父级须开启 RN 扩展 `enable-sticky`。不提供微信 Skyline 的 `push-pinned-header`、`padding` 属性适配；需要内边距时使用 RN 支持的样式。 |

## 平台扩展

### 模板相关编译配置

通用配置定义见 [模板与样式配置](../base/config-reference.md#模板与样式配置)。RN 需额外注意：

- `autoVirtualHostRules` 命中后不生成实体 host，外层 class/style/显隐作用到根结构，不能再按组件 host 测量布局。
- `customTextRules` 将自定义组件识别为文本类；仍需实体 host 时采用文本容器，用于文本嵌套与透传。
- `rnConfig.customBuiltInComponents` 可覆盖或扩展 RN 基础组件，见 [自定义基础组件](#自定义基础组件)；这是编译配置。

### 自定义基础组件

编译配置 `rnConfig.customBuiltInComponents` 的同名 key 可覆盖内置组件，新 key 可扩展基础组件，无需在每个 `.mpx` 的 `usingComponents` 中重复注册。这是 `@mpxjs/webpack-plugin` 的编译配置，不是应用运行时 `mpx.config.rnConfig`。

### section-list

Mpx 扩展虚拟列表组件，可自定义分组头、列表头、列表项；本节描述 RN 契约，不是微信标准基础组件，也不代表 Web 支持。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| height | string \| number | `100%` | 组件高度 |
| width | string \| number | `100%` | 组件宽度 |
| list-data | array | `[]` | 列表数据；分组头数据需包含 `isSectionHeader: true`，分组尾数据需包含 `isSectionFooter: true` |
| enable-sticky | boolean | `false` | 启用分组吸顶 |
| scroll-event-throttle | number | `0` | 控制 scroll 事件触发频率 |
| enhanced | boolean | `false` | 开启滚动增强能力 |
| bounces | boolean | `true` | iOS 下边界弹性控制，需同时开启 `enhanced` |
| use-list-header | boolean | `false` | 使用自定义列表头 |
| list-header-data | object | `{}` | 列表头数据 |
| use-list-footer | boolean | `false` | 使用自定义列表页脚 |
| list-footer-data | object | `{}` | 列表页脚数据 |
| generic:recycle-item | string |  | 列表项抽象节点组件名 |
| generic:section-header | string |  | 列表分组头抽象节点组件名 |
| generic:section-footer | string |  | 列表分组尾抽象节点组件名 |
| generic:list-header | string |  | 列表头抽象节点组件名 |
| generic:list-footer | string |  | 列表页脚抽象节点组件名 |
| item-height | object | `{}` | 列表项高度配置，支持 `getter` / `value` |
| section-header-height | object | `{}` | 分组头部高度配置，支持 `getter` / `value` |
| section-footer-height | object | `{}` | 分组尾部高度配置，支持 `getter` / `value` |
| list-header-height | number | `0` | 列表头部固定高度，不支持 `getter` / `value` |
| enable-back-to-top | boolean | `false` | 点击状态栏时滚动到顶部，仅 iOS 环境支持 |
| end-reached-threshold | number | `0.1` | 触底事件触发阈值 |
| refresher-enabled | boolean | `false` | 开启自定义下拉刷新 |
| refresher-triggered | boolean | `false` | 设置当前下拉刷新状态，true 表示已触发 |
| show-scrollbar | boolean | `true` | 滚动条显隐控制 |
| enable-item-exposure | boolean | `false` | 开启列表项曝光通知 |
| item-exposure-threshold | number | `0` | 列表项露出比例达到多少后触发曝光通知，取值 0-100 |
| simultaneous-handlers | array\<object> | `[]` | RN 环境特有属性，允许多个手势同时识别和处理 |
| wait-for | array\<object> | `[]` | RN 环境特有属性，允许延迟激活处理某些手势 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| scroll | 滚动时触发，`event.detail.scrollTop` 返回纵向滚动位置 |
| scrolltolower | 滚动到底部 / 触底通知 |
| refresherrefresh | 自定义下拉刷新被触发 |
| itemexposure | 列表项露出比例达到阈值时触发 |

#### 方法

| 方法名 | 说明 |
| --- | --- |
| scrollToIndex | 通过 ref 获取实例后可调用，`scrollToIndex({ index, animated, viewOffset, viewPosition })`，用于滚动到指定索引 |

#### 注意事项

- 当使用列表项、列表头、自定义分组头或者自定义分组尾，必须配置对应 `item-height`、`section-header-height`、`section-footer-height`、`list-header-height` 高度参数，否则会出现滚动异常。
- `enable-item-exposure` 与 `item-exposure-threshold` 不支持运行时动态修改，请在组件初始化时确定。
- `section-header` 曝光统计仅支持 `enable-sticky=false` 场景；开启 `enable-sticky` 时暂不支持统计 `section-header` 曝光。
