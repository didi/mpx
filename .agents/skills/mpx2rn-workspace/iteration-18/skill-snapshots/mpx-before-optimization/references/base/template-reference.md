# 模板基础

本页描述以微信小程序语法为基础的 Mpx 基准模板能力，以及适合跨端复用的基础组件。先按本页确定组件结构、数据类型与交互契约，再查 [支付宝差异](../ali/ali-template-reference.md) / [RN 差异](../rn/rn-template-reference.md) / [Web 差异](../web/web-template-reference.md) / [Skyline 差异](../skyline/skyline-template-reference.md)。基准不是全端能力的严格交集；宿主能力和增强属性不能因标签同名而推断等价。

## 目录

- [数据绑定与指令](#数据绑定与指令)
- [事件绑定](#事件绑定)
- [Slot 与动态组件](#slot-与动态组件)
- [具名模板](#具名模板)
- [i18n 国际化](#i18n-国际化)
- [无障碍访问](#无障碍访问)
- [样式与布局边界](#样式与布局边界)
- [基础组件](#基础组件)
  - [通用属性与事件](#通用属性与事件)
  - [view](#view)
  - [text](#text)
  - [rich-text](#rich-text)
  - [scroll-view](#scroll-view)
  - [swiper](#swiper)
  - [swiper-item](#swiper-item)
  - [movable-area](#movable-area)
  - [movable-view](#movable-view)
  - [image](#image)
  - [icon](#icon)
  - [progress](#progress)
  - [form](#form)
  - [button](#button)
  - [label](#label)
  - [input](#input)
  - [textarea](#textarea)
  - [checkbox](#checkbox)
  - [checkbox-group](#checkbox-group)
  - [radio](#radio)
  - [radio-group](#radio-group)
  - [switch](#switch)
  - [slider](#slider)
  - [picker](#picker)
  - [picker-view](#picker-view)
  - [picker-view-column](#picker-view-column)
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
- [跨端组合与验收](#跨端组合与验收)

## 数据绑定与指令

文本与属性使用 Mustache，例如 `<text>{{message}}</text>`、`value="{{value}}"`。支持算术、三元、逻辑、属性访问及可选链表达式；可直接访问编译常量 `__mpx_mode__`、`__mpx_env__` 和 `defs`。

Mustache 中不要调用普通 methods 或任意函数，派生展示值使用 computed 或 WXS。i18n 翻译函数可以在模板调用；事件内联传参是另一类语法。

| 指令 | 基准用法 |
| --- | --- |
| `wx:if` / `wx:elif` / `wx:else` | 条件渲染，移除不匹配分支。 |
| `wx:show` | 显示/隐藏。 |
| `wx:for` / `wx:for-item` / `wx:for-index` | 列表与局部变量命名。 |
| `wx:key` | 与列表配合，用 `wx:key="id"` 指向项字段，基本类型用 `*this`；不写 Mustache。优先稳定唯一的字符串/数字值，避免索引随插删变化。 |
| `wx:class` | 对象/数组动态类名，如 `wx:class="{{ {active: isActive} }}"`。 |
| `wx:style` | 动态样式，如 `wx:style="{{ {color: colorVar} }}"`。 |
| `wx:model` | 双向绑定，如 `<input wx:model="{{value}}" />`。 |
| `wx:model-prop` / `wx:model-event` | 指定自定义双向绑定的属性与事件。 |
| `wx:model-value-path` | 从 `e.detail` 取值的路径，默认 `value`；`[]` 表示整个 detail。 |
| `wx:model-filter` | 内建过滤器如 `trim`，或绑定实例方法处理更新值。 |
| `wx:ref` | 具名引用，如 `wx:ref="panel"` 对应实例 `$refs.panel` / setup `context.refs.panel`。 |

动态样式优先使用 `wx:class/wx:style`，避免在 `class/style` 属性里拼接 Mustache。RN 对 selector 查询额外要求空 `wx:ref`，不是所有平台都要添加的规则。

## 事件绑定

`bindtap="handleTap"` 绑定实例方法；内联参数用 `bindtap="handleTap(item, $event)"`，适合替代 dataset 绕行传参。动态方法名可使用 Mustache，结果须对应已声明的方法。

`catchtap` 表达阻止冒泡，`capture-bind:` / `capture-catch:` 表达捕获阶段处理；**哪些事件支持传播按端核对**，不能把基础触摸事件的规则扩展到组件自定义事件。也不要把 WXS 事件处理器、`mut-bind` 或事件内 `count++` 当作所有端均支持。

## Slot 与动态组件

自定义组件使用 `<slot />` 接收默认内容；具名插槽用 `<slot name="header" />`，调用方用 `slot="header"`。需兼容微信多插槽时在 `createComponent` 的 options 中声明 `multipleSlots: true`。

动态组件通过 `<component is="{{current}}" range="card-a,card-b" />` 切换已注册的自定义组件。候选组件在 `usingComponents` 注册，建议始终用 `range` 限定实际候选，避免小程序将全部注册组件纳入动态分发。不要把 `view/text` 作为自定义组件候选。切换组件类型会销毁并重建本地状态，需要持续的状态提升到外层。

## 具名模板

`<template name>` 定义片段，`<template is>` 指定片段名并通过 `data` 传值。

```html
<template>
  <template name="message"><text>{{title}}</text></template>
  <template is="message" data="{{title: messageTitle}}" />
</template>
```

`data` 可逐项传入，也可用 `data="{{ ...item }}"` 展开模板参数对象；这是模板数据语法，不是运行时脚本的对象合并。`is` 可用表达式动态选择已定义的片段。片段只访问显式传入字段，不隐式读取外层 data。外部文件用 `<import src="./message.wxml" />` 引入；import 只引入该文件直接定义的模板，不传递导入其他文件的模板。RN/Web 的 `include` 支持以及 Web 模板包装、事件透传限制见各端参考。

## i18n 国际化

在编译插件 `MpxWebpackPlugin` 的 `i18n` 配置中提供 `locale`、`messages` 或 `messagesPath`，之后才可使用模板与脚本翻译能力。

```js
// MpxWebpackPlugin 选项片段
i18n: {
  locale: 'zh-CN',
  messages: {
    'zh-CN': { greeting: '你好，{name}' }
  }
}
```

基准翻译与格式化函数范围如下；各目标端的支持限制见端参考。

| 选项式 API | 组合式 API | 用途 |
| --- | --- | --- |
| `$t` | `t` | 文案翻译，支持插值与复数选择；复数翻译统一使用此方法。 |
| `$te` | `te` | 检查指定语言中是否存在文案键。 |
| `$tm` | `tm` | 按键获取文案资源，可返回对象或数组。 |
| `$d` | `d` | 日期格式化。 |
| `$n` | `n` | 数字格式化。 |

选项式通过实例调用上述方法；组合式在 `setup` 顶层同步调用 `useI18n()`，以原名解构并向模板暴露所需函数；`<script setup>` 仍须 `defineExpose`。用于模板的翻译函数不能重命名，避免破坏编译识别。

目标端差异与扩展见 [RN i18n](../rn/rn-template-reference.md#i18n-国际化) / [Web i18n](../web/web-template-reference.md#i18n-国际化)。SSR 的实例和状态隔离另见 Web SSR 参考。

## 无障碍访问

使用 `aria-role` 声明元素的角色，使用 `aria-label` 提供读屏文案。公共模板沿用这两个属性，具体组件和目标端的支持限制见端参考。

| 属性 | 类型 | 用法 |
| --- | --- | --- |
| `aria-role` | string | 描述元素的交互角色，例如按钮使用 `button`；角色应与实际用途一致。 |
| `aria-label` | string | 描述元素名称或操作目的，例如“提交订单”；为仅有图标、缺少可读文字的操作提供明确文案。 |

```html
<view aria-role="button" aria-label="提交订单" bindtap="submitOrder">
  <text>提交</text>
</view>
```

两者均支持 Mustache 动态绑定，例如 `aria-role="{{role}}"`、`aria-label="{{label}}"`。声明角色不会自动添加点击、键盘操作或焦点管理，仍需实现对应交互；优先使用语义与用途一致的基础组件。

在实际宿主中验证读屏文案、焦点顺序和操作是否可完成；动态更新、条件渲染与隐藏节点也应检查。不要仅凭视觉显示正常判断无障碍可用。

## 样式与布局边界

Mpx 支持样式预处理、动态样式、rpx 与 `transRpxRules` 等能力，但选择器、布局、继承、页面滚动、CSS 变量和动画须查目标端。已有 `/*use rpx*/`、`/*use px*/` 单位注释需要保留。

RN 样式开发优先 [RN 样式实践](../rn/rn-style-practice.md)，明确查询属性再查能力表；Web 样式查 [Web 样式参考](../web/web-style-reference.md)。仅当目标含 RN 时采用其选择器与布局约束，Web 单端不统一改写为 RN 样式子集。

## 基础组件

本节描述 Mpx 基础组件技术基准，不承诺所述能力在所有平台均完全适用。输出 Web 或 RN 时，还须参考 [Web 基础组件差异](../web/web-template-reference.md#基础组件)或 [RN 基础组件差异](../rn/rn-template-reference.md#基础组件)，结合目标平台的支持范围、限制与行为差异使用。

### 通用属性与事件

| 属性 | 类型 | 用法 |
| --- | --- | --- |
| `id` | string | 节点标识；定位滚动目标、查询节点或关联控件时保持唯一且稳定。 |
| `class` / `style` | string | 样式类与内联样式；动态值优先 `wx:class/wx:style`。 |
| `hidden` | boolean | 默认 `false`；需要通用显隐时也可使用 `wx:show`，移除节点用 `wx:if`。 |
| `data-*` | any | 事件 dataset 数据；业务参数优先使用事件内联传参。 |
| `aria-role` / `aria-label` | string | 角色语义与读屏文案，见 [无障碍访问](#无障碍访问)。 |

布尔属性优先明确写为 `disabled="{{false}}"` / `scroll-y="{{true}}"`；只写属性名表示开启，字符串 `"false"` 不能代替布尔假值。数值、数组和对象使用 Mustache 传递，避免将复杂值写成普通字符串。

常用触摸事件为 `tap`、`longpress`、`touchstart`、`touchmove`、`touchend`、`touchcancel`。`longpress` 在触摸超过 350ms 后触发；不要用它判断手指已松开。`target` 是事件源，`currentTarget` 是当前绑定节点；坐标、布局信息与触摸列表按目标端核对。组件自身的 `change/input/load` 等事件按各组件契约处理，不能套用触摸事件的传播规则。

### view

普通布局容器。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `hover-class` | string | `none` | 按压期间使用的类；`none` 关闭点击态。 |
| `hover-stop-propagation` | boolean | `false` | 阻止祖先出现点击态，区别于阻止事件冒泡。 |
| `hover-start-time` / `hover-stay-time` | number | `50` / `400` | 点击态出现延迟与松手后保留时间，单位 ms。 |
| `animation` | object | — | 传入 `createAnimation().export()` 结果；动画实现和完成事件查端差异。 |

文字优先显式放在 `text` 中，便于控制文本样式和跨端布局；不要将容器布局等同于文本行内排版。

### text

展示纯文本，可嵌套文本片段；复杂富文本使用 `rich-text`。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `user-select` | boolean | `false` | 是否允许选择文字；旧属性 `selectable` 同为 boolean、默认 `false`，目标端支持有差异。 |
| `space` | string | — | 连续空格处理：`ensp` / `emsp` / `nbsp`。 |
| `decode` | boolean | `false` | 处理支持的字符实体，不等同于解析 HTML。 |

### rich-text

通过 `nodes`（array|string，默认 `[]`）传入节点数组或 HTML 字符串；元素节点用 `name/attrs/children`，文本节点用 `type: 'text'` 与 `text`。`space` 处理连续空格，值同 `text`。

内容需可信或经过清理；微信允许的节点、属性及安全过滤策略不自动适用于 RN/Web。不把富文本内部节点当作普通 Mpx 模板节点绑定事件或查询实例。

### scroll-view

局部滚动区域。纵向滚动须有确定高度，横向滚动须有确定宽度且内容能横向溢出；内容布局由样式控制。页面滚动与局部滚动分别处理。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `scroll-x` / `scroll-y` | boolean | `false` | 开启横向/纵向滚动。 |
| `upper-threshold` / `lower-threshold` | number|string | `50` | 距起点/终点的触发距离，单位 px；跨端优先传 number。 |
| `scroll-top` / `scroll-left` | number|string | — | 设置滚动位置；跨端优先传 number。 |
| `scroll-into-view` | string | — | 子节点 id，不能以数字开头；与 key 是不同用途。 |
| `scroll-into-view-offset` | number | `0` | 定位目标的额外偏移，支持范围按端核对。 |
| `scroll-with-animation` | boolean | `false` | 程序设置位置时是否使用过渡。 |
| `enhanced` | boolean | `false` | 启用增强能力；各增强属性的宿主支持不同。 |
| `bounces` / `show-scrollbar` / `paging-enabled` | boolean | `true` / `true` / `false` | 边界弹性、滚动条和整页停靠，微信 WebView 模式需配合增强能力。 |
| `enable-back-to-top` | boolean | `false` | 支持的宿主中点击状态栏回到顶部。 |
| `refresher-enabled` / `refresher-triggered` | boolean | `false` | 开启下拉刷新、控制刷新状态。 |
| `refresher-threshold` | number | `45` | 刷新触发距离，单位 px。 |
| `refresher-default-style` | string | `black` | 默认刷新样式：`black` / `white` / `none`。 |
| `refresher-background` | string | — | 刷新区域背景。 |

`scrolltoupper/scrolltolower` 表示抵达阈值；`scroll` 的微信 detail 含 `scrollLeft/scrollTop/scrollHeight/scrollWidth/deltaX/deltaY`，不要假定所有目标端返回全部字段。`dragstart/dragging/dragend` 属于增强事件；下拉刷新事件为 `refresherpulling/refresherrefresh/refresherrestore/refresherabort`，各端实现范围不同。

刷新回调中执行请求，完成后将 `refresher-triggered` 复位；触底加载须由业务控制加载中状态与是否还有数据，避免重复请求。`scrollend`、嵌套滚动、虚拟列表及 Skyline 专属配置不作为普通滚动的全端保证。

### swiper

轮播容器，直接子节点使用 `swiper-item`。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `indicator-dots` | boolean | `false` | 显示指示点。 |
| `indicator-color` / `indicator-active-color` | color | `rgba(0, 0, 0, .3)` / `#000000` | 普通/选中指示点颜色。 |
| `autoplay` / `circular` / `vertical` | boolean | `false` | 自动播放、循环、纵向切换。 |
| `current` | number | `0` | 当前项索引，从 0 开始。 |
| `interval` / `duration` | number | `5000` / `500` | 自动切换间隔与动画时长，单位 ms。 |
| `previous-margin` / `next-margin` | string | `0px` | 前后露出区域；单位支持按端核对。 |
| `easing-function` | string | `default` | 缓动；另有 `linear/easeInCubic/easeOutCubic/easeInOutCubic`，端实现有差异。 |

`change` 提供 `detail.current`，微信还提供 `source`；`transition` 的 detail 为 `{dx, dy}`；`animationfinish` detail 同 `change`。后二者及来源字段须查目标端支持。多项同屏、隐藏项布局优化及 Skyline 指示点增强不视为通用核心。

### swiper-item

只作为 `swiper` 的直接子项，宽高按容器设置为 100%；`item-id`（string）标识滑块。列表渲染仍须使用稳定的 `wx:key`。

### movable-area

定义可拖动区域；显式设置区域尺寸，内部使用直接子节点 `movable-view`。

### movable-view

拖动项必须直接放在 `movable-area` 中，并显式设置尺寸。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `direction` | string | `none` | `all/vertical/horizontal/none`。 |
| `x` / `y` | number|string | — | 偏移；跨端优先使用以 px 表示的 number。 |
| `inertia` / `out-of-bounds` / `disabled` | boolean | `false` | 惯性、允许越界、禁用。 |
| `animation` | boolean | `true` | 位移是否使用动画；区别于 view 的动画对象。 |
| `damping` / `friction` | number | `20` / `2` | 动画阻尼与惯性摩擦；实际物理表现按端验证。 |
| `scale` | boolean | `false` | 双指缩放，须核对目标端能力。 |
| `scale-min` / `scale-max` / `scale-value` | number | `0.5` / `10` / `1` | 缩放范围与倍数。 |

`change` 返回 `{x, y, source}`，缩放时 `scale` 返回 `{x, y, scale}`；`htouchmove/vtouchmove` 表示首次移动方向，传播能力按端核对。

### image

资源通过 `src`（string）传入：网络地址、支持的 base64 数据或本地静态资源；静态相对路径可交给 Mpx 构建处理。

`mode`（string，默认 `scaleToFill`）：`aspectFit` 完整展示，`aspectFill` 铺满并裁剪，`widthFix/heightFix` 按单边尺寸保留比例；另支持 `top/bottom/center/left/right/top left/top right/bottom left/bottom right` 定位裁剪。显式设置布局尺寸，避免依赖各端默认大小（微信默认 320×240px）。

`load` 返回 `{width, height}`；微信 `error` 返回 `{errMsg}`，错误字段按端核对。`lazy-load/show-menu-by-longpress`（boolean，默认 `false`）等能力须按端核实，不能以普通图片加载支持推断其可用。

### icon

`type`（string）可选 `success/success_no_circle/info/warn/waiting/cancel/download/search/clear`；`size`（number|string，默认 `23`）控制大小，`color`（string）控制颜色。不同宿主的图形与颜色呈现需视觉验收。

### progress

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `percent` | number | — | 进度 0–100，建议明确提供。 |
| `stroke-width` | number|string | `6` | 线宽，单位 px。 |
| `activeColor` / `backgroundColor` | string | `#09BB07` / `#EBEBEB` | 已完成/未完成颜色；不再采用旧 `color`。 |
| `active` / `active-mode` | boolean / string | `false` / `backwards` | 进度动画；`backwards` 从头播放，`forwards` 接续。 |
| `duration` | number | `30` | 每增加 1% 的动画时长，单位 ms。 |
| `show-info` / `border-radius` / `font-size` | boolean / number|string / number|string | `false` / `0` / `16` | 百分比文字、圆角和文字大小，支持范围按端核对。 |

动画完成触发 `activeend`；detail 的字段按端核对，不将端扩展字段视为微信保证。

### form

用 `name` 标识参与收集的表单控件；`form-type="submit"` 的按钮触发 `submit`，业务数据位于 `detail.value`，按控件 name 组织。`form-type="reset"` 触发 `reset`，重置后的值按端验证。自定义控件须接入该端表单机制才会被收集。

不要依赖微信宿主的 `report-submit/formId` 作为跨端提交契约。

### button

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `size` / `type` | string | `default` | 大小 `default/mini`；样式 `primary/default/warn`。 |
| `plain` / `disabled` / `loading` | boolean | `false` | 镂空、禁用、加载指示；loading 不代替业务防重复提交。 |
| `form-type` | string | — | `submit/reset`，与 form 配合。 |
| `hover-class` | string | `button-hover` | 按压类，`none` 关闭。 |
| `hover-stop-propagation` | boolean | `false` | 是否阻止祖先点击态。 |
| `hover-start-time` / `hover-stay-time` | number | `20` / `70` | 点击态延迟与松手保留时间，单位 ms。 |

`open-type` 属于宿主开放能力，分享、用户信息、手机号等必须逐端接入；普通按钮支持不代表开放能力可用。

### label

为表单选择控件扩大点击区域；可包裹控件，或通过 `for`（string）关联目标 id。可关联控件范围与 `for` 支持按端核对，跨端优先使用包裹结构。

### input

单行输入；业务状态通过 `wx:model` 或 `bindinput` 同步，读取 `detail.value`。避免依赖事件处理器返回字符串来改写输入，这不是所有控件与目标端的契约。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `value` / `placeholder` | string | — | 当前内容/空值提示。 |
| `type` | string | `text` | 常用 `text/number/digit/idcard`；不把键盘样式当作数据校验。 |
| `password` / `disabled` / `focus` | boolean | `false` | 密码、禁用、焦点请求；动态焦点与键盘弹起按端验证。 |
| `maxlength` | number | `140` | 长度限制；`-1` 表示不限制。 |
| `placeholder-class` / `placeholder-style` | string | `input-placeholder` / — | 占位符样式，端支持范围不同。 |
| `cursor` | number | — | 聚焦时的光标位置。 |
| `selection-start` / `selection-end` | number | `-1` | 配套设置选区；可用性与输入类型有关。 |
| `cursor-spacing` / `adjust-position` | number / boolean | `0` / `true` | 键盘距离及避让。 |
| `confirm-type` / `confirm-hold` | string / boolean | `done` / `false` | 确认键样式及确认后保留键盘；样式常用 `send/search/next/go/done`。 |
| `hold-keyboard` | boolean | `false` | 聚焦时点击其他位置是否保留键盘。 |

`auto-focus` 为旧的初始聚焦属性（boolean，默认 `false`）；新增代码优先 `focus`。`cursor-color` 以及安全密码、昵称、键盘高度/输入法事件等增强能力均需逐端核实。

| 事件 | 微信契约与跨端关注点 |
| --- | --- |
| `input` | `detail.value` 为 string；`cursor/keyCode` 属于需核对的附加字段。 |
| `focus` | `{value, height}`，height 是键盘高度，端实现可能缺失。 |
| `blur` / `confirm` | 以 `value` 为核心；安全输入相关的 `encryptedValue/encryptError` 不作为通用字段。 |
| `selectionchange` | `{selectionStart, selectionEnd}`，支持范围按端核对。 |
| `keyboardheightchange` | `{height, duration}`，不保证每端具有对应键盘通知。 |

### textarea

多行输入，共用 input 的 `value/placeholder/disabled/maxlength/focus`、占位符和选区契约；`placeholder-class` 默认 `textarea-placeholder`，`cursor` 默认 `-1`，`confirm-type` 默认 `return`。`auto-height`（boolean，默认 `false`）使高度随内容变化，开启后不依赖固定 `height`。

`input` detail 为 `{value, cursor, keyCode}`；`focus` 为 `{value, height}`；`blur` 为 `{value, cursor}`；`confirm` 为 `{value}`。`linechange` 提供 `{height, heightRpx, lineCount}`。这些附加字段和 `selectionchange/keyboardheightchange` 事件均需核对目标端支持。`confirm-hold`、固定定位、确认栏及默认内边距控制属于增强能力。

### checkbox

`value`（string）标识选项，`checked/disabled`（boolean，默认 `false`）控制选中和禁用，`color`（string，默认 `#09BB07`）指定颜色。放在 `checkbox-group` 中收集选择值；动态 checked 支持查端差异。

### checkbox-group

内部使用 checkbox；`change` 的 `detail.value` 是选中项 value 的 **string 数组**，通过 group 的 `name` 参与 form。

### radio

属性类型和默认值同 checkbox，放在 `radio-group` 内表示单选项。

### radio-group

`change` 的 `detail.value` 是选中项的 **单个 string**；通过 group 的 `name` 参与 form。

### switch

`checked/disabled`（boolean，默认 `false`），`type`（string，默认 `switch`，另可选 `checkbox`），`color`（string，默认 `#04BE02`）。用户切换后 `change` 返回 `{value}`，value 为 boolean。

### slider

`min/max/step/value` 均为 number，默认 `0/100/1/0`；step 须为正且能整除范围差。`disabled` 默认为 `false`，`show-value` 默认为 `false`。

`activeColor/backgroundColor/block-color` 控制已选部分、背景及滑块颜色，默认 `#1aad19/#e9e9e9/#ffffff`；旧 `color/selected-color` 不作为新代码首选。`block-size`（number，默认 `28`）范围 12–28。拖动中 `changing`、结束后 `change` 均返回 `{value}`，value 为 number。

### picker

弹出选择器，触发区域由子节点提供。`mode`（string，默认 `selector`），`disabled`（boolean，默认 `false`），`header-text`（string）设置标题，后者支持范围按端核对。

| mode | 数据契约 |
| --- | --- |
| `selector` | `range` 为数组（默认 `[]`），对象项用 `range-key`（string）指定展示字段；`value` 为索引 number，默认 `0`。 |
| `multiSelector` | `range` 为按列组织的二维数组；`value` 为各列索引数组，默认 `[]`；`columnchange` 返回 `{column, value}`。 |
| `time` | `value/start/end` 使用 `hh:mm` 字符串。 |
| `date` | `value/start/end` 使用 `YYYY-MM-DD` 字符串；微信 value 默认当天；`fields` 为 `year/month/day`，默认 `day`。 |
| `region` | `value` 为地区名称数组，默认 `[]`；`custom-item`（string）添加顶部项；`level` 为 `province/city/region`，默认 `region`。 |

`change` 返回 `{value}`，类型由 mode 决定；地区模式微信额外返回 `code/postcode`，不能假定目标端都提供。`cancel` 表示取消。跨端时间/日期选择显式传入有效的 value/start/end，避免依赖端默认值；级联选择更新 range 时同步校正各列索引。

### picker-view

嵌入式滚轮选择器，只放 `picker-view-column`；设置容器尺寸。`value` 为 number 数组（默认 `[]`），每项对应列索引；超出可选数量时取最后一项。`indicator-style/indicator-class` 设置选中框，`mask-style/mask-class` 设置蒙层，均为 string。`change` 返回 `{value}`，value 为各列索引数组。

`immediate-change`、滚动开始/结束通知与触感反馈按端核对。

### picker-view-column

必须直接放在 picker-view 中，子节点为候选项，其高度与选中框对齐。

### navigator

声明应用内导航：`url`（string）为页面路径，`open-type`（string，默认 `navigate`）使用 `navigate/redirect/navigateBack/reLaunch/switchTab`，具体支持查端差异；`navigateBack` 配合 `delta`（number，默认 `1`）。`navigateTo` 是 API 名，不是 open-type 的值。

点击态沿用 view 属性，默认 `hover-class="navigator-hover"`、`hover-start-time=50`、`hover-stay-time=600`、`hover-stop-propagation=false`。跨小程序导航的 `target/app-id/path/extra-data/version/short-link`、`exit` 及 `success/fail/complete` 不作为通用导航保证。

### video

基础播放属性：`src/poster` 为 string；`controls`（boolean）默认 `true`，`autoplay/loop/muted` 默认 `false`；`initial-time`（number）默认 `0` 秒；`object-fit`（string）默认 `contain`，另可选 `fill/cover`。

基本事件为 `play/pause/ended/waiting/error`；微信 `timeupdate` 返回 `{currentTime, duration}`，`loadedmetadata` 返回 `{width, height, duration}`，`fullscreenchange` 提供 boolean `fullScreen` 及方向信息。目标端字段、动态属性更新与自动播放限制见差异文档。

`show-progress/show-bottom-progress/show-fullscreen-btn/show-play-btn/show-center-play-btn` 为控件显隐配置（boolean，默认 `true`），`show-mute-btn` 默认 `false`；弹幕、DRM、投屏、旋转、手势和画中画不属于通用播放保证。

### canvas

跨端绘图优先使用节点式 2D Canvas：声明 `type="2d"` 并设置显示尺寸，节点就绪后通过 SelectorQuery 的 `fields({node: true, size: true})` 获取节点，再使用 `getContext('2d')`。绘图像素尺寸与显示尺寸分开设置，按设备像素比处理清晰度。

节点上的 `createImage/createImageData/getContext/toDataURL` 等方法及触摸、错误事件需核对端支持；创建图片、导出、路径对象、WebGL 和旧 `createCanvasContext` 不视为等价能力。宿主 API 统一从 `@mpxjs/api-proxy` 使用，完整签名查 [API 基准](./api-reference.md)。

### camera

相机属于宿主能力，使用前核对权限与原生依赖；Web 不因同名标签具备相机能力。

`mode` 默认 `normal`（另可 `scanCode`）；`resolution` 默认 `medium`（`low/medium/high`），`device-position` 默认 `back`（另可 `front`），`flash` 默认 `auto`（还有 `on/off/torch`，支持查端），`frame-size` 默认 `medium`（`small/medium/large`），均为 string。

`initdone` 返回 `{maxZoom}`；异常终止触发 `stop`、失败触发 `error`；`scanCode` 模式使用 `scancode` 获取识别结果。拍照、录像、缩放使用 CameraContext 的 `takePhoto/startRecord/stopRecord/setZoom`，签名与返回值查 API 参考。

### web-view

用 `src`（string）加载网页，宿主决定网页容器尺寸、域名许可、嵌入限制与通信方式。

微信 `load` detail 为 `{src}`、`error` 为 `{url, fullUrl}`；`message` 的 `detail.data` 是多次 postMessage 参数组成的数组，通常在后退、销毁、分享等特定时机交付。RN/Web 的消息协议、时机、数据形状与错误覆盖范围须分别对接，不能假设同一消息监听器可直接复用。

### cover-view

微信用于覆盖特定原生组件的视图层，嵌套与样式受宿主限制。跨端先核实层级问题是否仍存在；不能以普通 view 的能力推断原生覆盖能力。

### cover-image

覆盖层中的图片，通过 src 加载，原生层级、事件与嵌套限制同样按宿主确认，不等同于完整 image 接口。

### root-portal

将子树移出当前页面层级，适合弹出层；`enable`（boolean，默认 `true`）控制是否启用。目标端可用性、样式与事件行为须查差异。

### sticky-header

吸顶头必须是 scroll-view 或 sticky-section 的直接子节点；`offset-top`（number，默认 `0`）指定顶部距离，`padding`（array，默认 `[0, 0, 0, 0]`）按上右下左设置内边距，单位 px。`stickontopchange` 返回 `{isStickOnTop}`。

微信需使用 Skyline；RN/Web 是对应端适配实现，不因此具备其他 Skyline 属性或 worklet 能力。

### sticky-section

分组吸顶容器，必须直接放在 scroll-view 内；组内使用 sticky-header。微信需 Skyline，各端启用条件见差异文档。

## 跨端组合与验收

```html
<scroll-view class="list" scroll-y="{{true}}" bindscrolltolower="loadMore">
  <view wx:for="{{items}}" wx:key="id" class="row">
    <image class="cover" src="{{item.cover}}" mode="aspectFill" />
    <text>{{item.title}}</text>
    <button bindtap="selectItem(item.id)">选择</button>
  </view>
</scroll-view>
```

脚本提供 items、loadMore 与 selectItem；样式明确 list 高度、cover 尺寸和 row 布局。此结构复用普通组件契约；不要为了 Web 单端套用 RN 的 selector、页面滚动或样式限制。

验收时检查组件层级、稳定 key、值类型、真实事件字段和动态更新；再检查原平台功能与目标端宿主行为。不可用能力只隔离必要的属性、事件或节点，保留其余业务数据、入口和交互；媒体、输入法、滚动与无障碍需要在实际宿主验证。
