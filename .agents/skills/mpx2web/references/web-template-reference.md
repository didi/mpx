# Mpx2Web 模板差异参考

本文档记录 Mpx 输出 Web 时的模板能力与平台差异，包括通用模板语法、Web 内建组件、浏览器原生能力和降级方案。通用部分与小程序、RN 保持同一套 `.mpx` 模板写法；涉及浏览器 DOM、Web 运行时组件或安全策略时，以本文的 Web 说明为准。

## 目录

- [数据绑定](#数据绑定)
- [模板指令](#模板指令)
- [事件处理](#事件处理)
- [Slot](#slot)
- [动态组件](#动态组件)
- [WXML 模板](#wxml-模板)
- [i18n 国际化](#i18n-国际化)
- [无障碍访问](#无障碍访问)
- [Web 原生标签](#web-原生标签)
- [Web 标准属性](#web-标准属性)
- [Web 模板编译限制](#web-模板编译限制)
- [Web 内建组件](#web-内建组件)
- [Web 组件降级](#web-组件降级)
- [专项入口](#专项入口)

---

## 数据绑定

Web 输出支持使用 Mustache 语法 `{{}}` 绑定 `data`、`computed` 和 `setup` 暴露的数据。

- 文本与属性均可插值，例如 `<text>{{ message }}</text>`、`value="{{ inputValue }}"`。
- 表达式支持算术、三元、逻辑运算、属性访问和可选链 `?.`。
- 模板中可访问 `__mpx_mode__`、`__mpx_env__` 以及编译配置 `defs` 注入的变量。
- 不支持在 Mustache 中一般性调用组件 `methods` 或任意函数；需要加工展示数据时使用 `computed` 或 `wxs`。i18n 翻译函数属于编译器支持的例外。

```html
<template>
  <view>
    <text>{{ user?.name || '游客' }}</text>
    <text>{{ displayTitle }}</text>
  </view>
</template>
```

---

## 模板指令

Web 输出支持以下通用模板指令：

| 指令 | 说明 |
| --- | --- |
| `wx:if` / `wx:elif` / `wx:else` | 条件渲染 |
| `wx:show` | 显示或隐藏节点 |
| `wx:for` / `wx:for-item` / `wx:for-index` | 列表渲染与循环变量命名 |
| `wx:key` | 列表节点标识 |
| `wx:class` | 动态类名绑定 |
| `wx:style` | 动态内联样式绑定 |
| `wx:model` | 双向数据绑定 |
| `wx:model-prop` / `wx:model-event` | 自定义双向绑定属性与事件 |
| `wx:model-value-path` | 从事件参数中提取更新值，默认路径为 `value` |
| `wx:model-filter` | 使用内建过滤器或组件方法处理双向绑定值 |
| `wx:ref` | 获取基础节点或自定义组件实例 |

动态样式与类名优先使用 `wx:style`、`wx:class`，避免在 `style`、`class` 字符串中混合多段插值。对象字面量的 key 使用无引号 camelCase 写法，以保持小程序模板兼容。

```html
<view
  class="card"
  wx:class="{{ {active: isActive} }}"
  wx:style="{{ {backgroundColor: cardColor} }}"
/>
```

---

## 事件处理

Web 输出支持 `bind`、`catch`、`capture-bind`、`capture-catch` 事件语法，由编译器转换为 Web 运行时监听。常见通用事件包括 `tap`、`longpress`、`touchstart`、`touchmove`、`touchend` 和 `touchcancel`；具体基础组件还会提供各自的组件事件。

```html
<view bindtap="handleTap">普通绑定</view>
<view catchtap="handleTap">阻止冒泡</view>
<view capture-bind:touchstart="handleCapture">捕获阶段</view>
<view bindtap="handleTap('card', index)">内联传参</view>
```

事件处理器需要动态选择时，可在事件属性中使用插值，例如 `bindtap="handleTap_{{index}}"`，也可以使用 `bindtap="{{handlerName}}"`。Web 事件代理会把表达式结果作为组件实例方法名，再通过 `this[handlerName]` 查找并调用，因此动态值必须是类似 `"handleTap"` 的方法名字符串，不能是布尔值、函数对象或其它非方法名值。

```html
<!-- Web 下不支持：true 不会被解释为“启用 tap 事件” -->
<view bindtap="{{true}}" />
```

该写法会让 Web 事件代理尝试查找 `this[true]`，无法得到可调用的实例方法。需要按条件启用事件时，使用固定实例方法并在方法内部判断，或者通过条件渲染分别输出有、无事件绑定的节点。

WXS 模块虽然会在 Web 运行时挂载到组件实例，但不能把 WXS 函数引用直接绑定为事件处理器：

```html
<!-- Web 下不支持：tool.onSliderClick 的求值结果是函数对象，不是实例方法名 -->
<view bindtap="{{tool.onSliderClick}}" />
```

该写法能够通过模板编译，但 Web 事件代理会尝试按 `this[tool.onSliderClick]` 查找实例方法，无法直接调用这个 WXS 函数。普通业务事件应改为固定的组件实例方法，全平台统一绑定：

```html
<view bindtap="onSliderClick" />
```

```js
createComponent({
  methods: {
    onSliderClick (event) {
      // 跨平台事件逻辑
    }
  }
})
```

如果小程序端为了高频触摸、拖动等交互必须使用 WXS 响应事件，保留小程序侧 WXS 绑定，并为 Web 提供普通实例方法的等效实现；每个 `@wx` 事件都必须在同一节点提供同事件类型的 `@web` 绑定，不能只增加 `@wx` 后结束改造。属性模式后缀会先于跨平台事件转换处理，因此 Web 分支直接使用转换后的 Vue 事件名 `@tap@web`，不要写 `bindtap@web`。不要在 Web 实例方法中调用 `this.tool` 作为通用跨端方案，因为 WXS 模块不是小程序脚本实例上的普通成员。

迁移连续手势时，将起点、位移、是否发生滑动等状态保存在组件实例上，避免多个组件实例共享普通脚本模块变量。为 `touchcancel` 提供与中断语义一致的收尾。若滑动节点内部还有点击行为，有效移动后的 `touchend` 只清理起点和位移，保留一次性误触标记；紧随其后的合成 `tap` 先消费该标记并直接返回，超时或消费后再清除。`touchcancel` 不会形成有效选择，应回弹并清理全部状态。

```html
<view
  bindtap@wx="{{tool.onSliderClick}}"
  @tap@web="onSliderClick"
/>
```

传递业务参数时优先使用内联传参，不要依赖 `data-*` 再从 dataset 中取值。

Web 的鼠标、触摸、PointerEvent 和浏览器默认行为并不完全等同于小程序触摸系统；涉及滚动、拖拽、文本选择、表单提交或原生 DOM 事件时，应同时验证冒泡路径、默认行为及移动端浏览器兼容性。

微信后续增加的 `mut-bind` 和 `mark:*` 不在当前 Web 模板转换链路明确支持范围内；需要这类能力时使用普通 `bind` / `catch`、内联参数或 Web-only 事件实现，不要仅凭模板能够解析就认定语义已对齐。Web 事件对象会基于浏览器事件补充 Mpx 字段，但 `target`、`currentTarget`、`dataset`、`touches`、`changedTouches` 和默认行为仍需按真实浏览器交互验证。

---

## Slot

Web 输出支持默认插槽和具名插槽。默认插槽直接使用 `<slot />`；使用多个具名插槽时，在组件的 `options.multipleSlots` 中启用 `multipleSlots`，并通过 `name` 与引用方的 `slot` 属性对应。

```html
<!-- 子组件 -->
<view class="panel">
  <slot name="header" />
  <slot />
</view>

<!-- 引用方 -->
<my-panel>
  <text slot="header">标题</text>
  <text>正文</text>
</my-panel>
```

```js
createComponent({
  options: {
    multipleSlots: true
  }
})
```

---

## 动态组件

Web 输出支持通过 `<component is="...">` 动态切换自定义组件。`is` 的值应为当前文件 `usingComponents` 中注册或全局可见的组件名；节点属性会作为 props 传入目标组件，子节点作为插槽内容。

建议使用 `range` 显式列出候选组件，避免其它平台构建时把 `usingComponents` 中所有组件都纳入候选集合。

```html
<component
  is="{{ current }}"
  range="card-a,card-b"
  title="{{ title }}"
/>
```

切换 `is` 会销毁旧组件并创建新组件，内部本地状态不会自动保留。`is` 用于自定义组件，不要传入 `view`、`text` 等基础组件名。

---

## WXML 模板

Web 输出支持 `<template name>`、`<template is>` 与 `<import>` 复用 WXML 具名模板。

```html
<template name="msgItem">
  <view>{{ index }}: {{ msg }}</view>
</template>

<template is="msgItem" data="{{ ...item }}" />
```

- 模板片段只能访问 `data` 显式传入的字段。
- `is` 可以使用表达式，但目标 `name` 必须在当前可见范围内定义。
- `<import>` 只引入目标文件直接定义的模板，不递归透传目标文件再次引入的模板。
- 跨端输出不支持使用 `include` 引用外联模板，应使用 `import`。
- Web 侧定义体的单根限制与外部模板限制见[Web 模板编译限制](#web-模板编译限制)。

---

## i18n 国际化

Web 输出支持 Mpx i18n。使用前需要在 `MpxWebpackPlugin` 中配置 `i18n` 的 `locale`、`messages` 或 `messagesPath`。

| 场景 | 可用函数 | 使用约束 |
| --- | --- | --- |
| 选项式 API | `$t`、`$tc`、`$te`、`$tm` | 模板中直接使用；脚本中通过组件实例调用 |
| 组合式 API | `t`、`tc`、`te`、`tm` | 在 `setup` 顶层调用 `useI18n()`，并以原名暴露给模板 |

```js
import { createComponent, useI18n } from '@mpxjs/core'

createComponent({
  setup () {
    const { t } = useI18n()
    return { t }
  }
})
```

```html
<text>{{ t('message.hello') }}</text>
```

组合式翻译函数不可重命名后再交给模板。列表文案建议先在脚本的 `computed` 中完成翻译，以保持 Web、小程序与 RN 行为一致。当前能力边界为上述文本、复数、存在性和消息对象函数，不包含 `$d`、`$n`。

---

## 无障碍访问

跨端模板优先使用 `aria-role`、`aria-label` 表达基础语义；Web 编译链路会将可映射属性交给浏览器节点或内建组件。图标按钮等无可见文本的可点击区域应补充 `aria-label`。

```html
<view
  aria-role="button"
  aria-label="{{ submitText }}"
  bindtap="onSubmit"
>
  <text>{{ submitText }}</text>
</view>
```

需要完整的浏览器 ARIA、键盘和焦点能力时，按下方 [Web 标准属性](#web-标准属性) 使用 Web-only 模板，并在桌面键盘、移动端和主流读屏软件中验证。

---

## Web 原生标签

Web 输出可使用 HTML / SVG 原生标签承载 Web-only 能力，例如 `<canvas>`、`<svg>`、`<audio>`、`<iframe>` 或业务 H5 容器节点。原生标签属于 Web-only 内容时，应与通用模板隔离，避免通用构建解析到浏览器专属节点。

```html
<template>
  <view class="chart-card">
    <canvas class="chart-canvas"></canvas>
    <svg class="chart-icon" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6"></circle>
    </svg>
  </view>
</template>
```

不要仅凭标签名判断最终产物是否为原生 DOM。部分 HTML 同名标签会按 Mpx 基础组件语义编译，例如 `<video>`、`<button>`、`<input>`、`<form>` 会使用对应的 Web 内建组件；需要直接操作原生 DOM 或接入 H5 SDK 时，先核对编译产物，必要时使用无冲突的容器标签或 Web-only Vue 组件封装。

节点访问优先使用 `wx:ref` 获取基础节点或组件实例；需要直接使用 `querySelector`、DOM API 或第三方 H5 SDK 时，应限制在 Web-only 逻辑中，并确认目标标签最终编译为原生 DOM 而非 Web 内建包装组件。

---

## Web 标准属性

小程序已支持的无障碍属性属于通用模板能力，不在本文重复记录。需要完整浏览器 ARIA 语义、焦点顺序或键盘导航时，可在 Web-only 模板中使用 `role`、`tabindex` 及浏览器支持的 `aria-*` 属性，并按 Web 可访问性标准设计交互。

---

## Web 模板编译限制

以下限制由 Web 模板编译链路决定：

- Web 当前基于 Vue 2.7，页面和组件的 `<template>` 保持单个根节点；存在多个并列节点时，用 `view` 或其它合适节点包裹。
- `.mpx` 文件中的 `<template>` 内容必须内联，暂不支持通过 `<template src="...">` 引入外部模板内容。
- Web 输出暂不支持 `<template lang="...">` 模板预处理语言。
- 具名模板 `<template name="...">` 的定义体必须只有一个元素根节点；多根时使用 `view` 或其它合适节点包裹。
- Web 子组件启用 `virtualHost` 后，模板也必须只有一个真实根节点，否则编译期会报错。

组件内可以声明具名模板。Web 编译器会把本地 `<template name="...">` 编译为内部模板组件；“不支持组件内声明模板”不是当前能力限制，但定义体仍受上述单根约束。

其它微信模板能力的 Web 边界：

- `<block>` 是虚拟组织节点，不应依赖它生成真实 DOM。
- `componentGenerics` / `generic:*` 和 `externalClasses` 有 Web 编译处理；前者仍要求候选组件进入 Web 组件映射，后者会转换为样式类 props，不能直接等同于浏览器全局 class 透传。
- `wx:key` 使用当前模板编译器支持的稳定字段；微信特有写法（如 `*this`）在用于 Web 前应通过真实编译与列表重排验证。
- 动态 slot 名、微信新增事件标记或未在本文明确列出的模板扩展，不默认视为 Web 已支持。

这些限制只描述 Web 输出差异；`wx:if`、`wx:for`、`template is`、`import` 等通用模板语法仍参考 Mpx 公共基础。

---

## Web 内建组件

部分小程序基础标签在 Web 输出时不会直接变成同名原生 DOM，而是由 `packages/webpack-plugin/lib/runtime/components/web` 下的 Vue 运行时组件承载。例如 `scroll-view`、`picker`、`swiper`、`movable-view`、`video`、表单控件和 `web-view`。

判断支持情况时分三层：

1. 目录或编译映射中存在对应实现，只能说明有 Web 内建承载。
2. 组件 `props`、事件绑定和方法中存在对应逻辑，才能说明具体属性、事件或实例行为已实现。
3. 有内建实现不代表与微信小程序当前版本的全部能力和边界行为完全一致。

`mpx-keep-alive`、`mpx-tab-bar`、`mpx-tab-bar-container` 等是框架内部组件，不是业务模板中的同名公共基础标签。使用 `webConfig.customBuiltInComponents` 覆盖实现后，应以自定义组件的属性、事件和子节点语义为准。

### 通用属性

除[模板指令](#模板指令)与[事件处理](#事件处理)外，Web 基础节点和内建组件通常可使用以下通用属性：

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 节点唯一标识 |
| class | string | 样式类名 |
| style | string | 内联样式 |
| hidden | boolean | 隐藏节点 |
| data-* | any | 业务自定义数据；事件传参优先使用内联传参 |
| aria-role | string | 跨端无障碍角色 |
| aria-label | string | 跨端无障碍文案 |

Web-only 原生节点还可使用浏览器标准属性；包装型内建组件不保证透传任意原生属性，只使用本参考明确列出的属性。

### view

Web 内建基础组件。Web 容器与事件透传；支持 `hover-class`、触发延迟、保持时间和阻止 hover 传播。它是 Vue 包装组件，不应默认当作无包装的原生 `div` 操作。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| hover-class | string |  | 指定按下去的样式类。 |
| hover-stop-propagation | boolean | `false` | 是否阻止祖先节点出现点击态 |
| hover-start-time | number | `50` | 按住后多久出现点击态，单位毫秒 |
| hover-stay-time | number | `400` | 手指松开后点击态保留时间，单位毫秒 |

`transitionend`、`animationstart`、`animationiteration`、`animationend` 等浏览器事件可按通用事件链路监听，但 Web `mpx-view` 没有 RN 的 `animation`、`enable-background`、`enable-animation`、`enable-fast-image` 等增强属性。

### text

Web 内建基础组件。内联文本渲染，处理 `selectable`、`space`、`decode` 及插槽文本。复杂富文本应使用 `rich-text`。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| selectable | boolean | `false` | 文本是否可选；这是当前 Web 内建实现实际消费的属性 |
| space | string |  | 连续空格显示方式，支持 `ensp`、`emsp`、`nbsp` |
| decode | boolean | `false` | 是否解码 |

#### 注意事项

- `selectable`、`space`、`decode` 或显式 `use-built-in` 会让 `text` 使用 Web 内建实现；普通 `text` 默认输出为 `span`。
- 当前 Web 内建实现没有独立的 `user-select` prop；需要文本可选时使用 `selectable`，不要把微信侧 `user-select` 属性直接视为 Web 已对齐。

### label

Web 下 `label` 使用浏览器原生标签语义。`for` 应指向目标表单控件的 `id`；实际点击聚焦、键盘和读屏行为受最终 DOM 结构与浏览器实现影响。跨端表单标签场景应验证 `label` 包裹控件与 `for` 关联两种写法。

### rich-text

Web 内建基础组件。使用 HTML 内容渲染 `nodes`；应关注内容可信度和 Web XSS 风险，不能等同于宿主侧富文本安全策略。

#### 属性

| 属性名 | 类型          | 默认值 | 说明     |
| ------ | ------------- | ------ | -------- |
| nodes  | array\|string |        | 节点列表 |
| space  | string        |        | 处理节点文本中的连续空格，支持 `ensp`、`emsp`、`nbsp` |

### image

Web 内建基础组件。把 `scaleToFill`、`aspectFit`、`aspectFill`、宽高自适应和裁剪定位类 `mode` 映射为 Web 尺寸、定位或 `object-fit` 行为，并转发加载/失败事件。宿主图片菜单等能力不能仅凭属性存在推断。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string |  | 图片资源地址、base64 格式数据或本地静态资源相对路径 |
| mode | string | `scaleToFill` | 图片裁剪、缩放的模式，可选值为 `scaleToFill`、`aspectFit`、`aspectFill`、`widthFix`、`heightFix`、`top`、`bottom`、`center`、`left`、`right`、`top left`、`top right`、`bottom left`、`bottom right` |
| lazy-load | boolean | `false` | Web 不支持图片懒加载 |
| show-menu-by-longpress | boolean | `false` | Web 不支持微信图片长按菜单 |

#### 事件

| 事件名    | 说明                                                     |
| --------- | -------------------------------------------------------- |
| binderror | 当错误发生时触发；当前 Web 内建实现的 `event.detail` 为空对象，不提供微信侧的 `errMsg` |
| bindload  | 当图片载入完毕时触发，`event.detail = { height, width }` |

#### 注意事项

- image 组件默认宽度 300px、高度 225px
- image 组件进行缩放时，计算出来的宽高可能带有小数，在不同 webview 内核下渲染可能会被抹去小数部分

### cover-view

Web 输出会将 `cover-view` 降级为普通 `div`；当节点使用双向绑定等需要内建组件承载的能力，或显式设置 `use-built-in` 时，转换为 `mpx-view`。Web 没有小程序原生组件层级覆盖问题，因此不要依赖 `cover-view` 获得额外层级能力。

### cover-image

Web 输出将 `cover-image` 转换为 `mpx-image`，图片能力与 [image](#image) 的 Web 内建实现一致。它不提供小程序原生组件覆盖层级语义。

### icon

Web 内建基础组件。提供内置状态图标，支持 `type`、`size`、`color`；只支持下表列出的图标类型。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | string |  | icon 的类型，有效值：success、success_no_circle、info、warn、waiting、cancel、download、search、clear |
| size | string\|number | `23` | icon 的大小 |
| color | string |  | icon 的颜色，同 css 的 color |

### progress

Web 内建基础组件。支持百分比、线宽、前景/背景颜色、文字和 active 动画；动画由 CSS transform/transition 模拟。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| percent | number | `0` | 百分比进度，范围 0-100 |
| show-info | boolean | `false` | 在进度条右侧显示百分比 |
| border-radius | number\|string | `0` | 进度条圆角大小 |
| font-size | number\|string | `16` | 右侧百分比文字大小 |
| stroke-width | number\|string | `6` | 进度条线的宽度，单位 px |
| color | string | `#09BB07` | 进度条颜色（已废弃，请使用 `active-color`） |
| active-color | string | `#09BB07` | 已选择的进度条颜色 |
| background-color | string | `#EBEBEB` | 未选择的进度条颜色 |
| active | boolean | `false` | 进度条从左往右的动画 |
| active-mode | string | `backwards` | 动画播放模式，`backwards`: 从头开始播放；`forwards`: 从上次结束点接着播放 |
| duration | number | `30` | 进度增加 1%所需毫秒数 |

#### 事件

| 事件名        | 说明                                         |
| ------------- | -------------------------------------------- |
| bindactiveend | 动画完成时触发，`event.detail = { curPercent }`；字段名与微信不一致 |

### form

Web 内建基础组件。注册后代表单项，按 `name` 汇总 `submit.detail.value`；`reset` 恢复挂载时保存的初始值。只有接入该注册协议的内建或兼容自定义控件才会自动进入表单值。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindsubmit | 携带 form 中的数据触发 submit 事件，`event.detail = {value : {'name': 'value'} }` |
| bindreset | 表单重置时会触发 reset 事件 |

### input

Web 内建基础组件。单行输入、value 同步、密码/输入类型、placeholder、disabled、maxlength 和焦点；底层受浏览器 input 类型、键盘和焦点策略约束。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | 输入框的初始内容 |
| type | string | `text` | input 的类型；`digit` 映射为浏览器 `number`，`text`、`number` 直接透传；`idcard` 会透传为非标准 HTML type 并由浏览器回退，不提供微信身份证键盘；不支持 `safe-password`、`nickname` |
| password | boolean | `false` | 是否是密码类型 |
| placeholder | string |  | 输入框为空时占位符 |
| disabled | boolean | `false` | 是否禁用 |
| maxlength | number | `140` | 最大输入长度，设置为 -1 的时候不限制最大长度 |
| auto-focus | boolean | `false` | 自动聚焦；受浏览器自动聚焦策略限制 |
| focus | boolean | `false` | 获取焦点 |
| cursor | number | `-1` | 指定光标位置；浏览器不支持选区的 input 类型可能受限 |
| selection-start | number | `-1` | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用 |
| selection-end | number | `-1` | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindinput | 键盘输入时触发，`event.detail = { value }` |
| bindfocus | 输入框聚焦时触发，`event.detail = { value }`，不支持 `height` |
| bindblur | 输入框失去焦点时触发，`event.detail = { value }`，不支持 `encryptedValue`、`encryptError` |

当前 Web 内建实现没有微信软键盘的 `confirm-type`、`confirm-hold`、`cursor-spacing`、`adjust-position`、`hold-keyboard` 等宿主语义，也没有转换 `confirm` / `selectionchange` 为微信事件详情；需要时使用 Web-only 原生键盘事件实现。

`auto-focus` 和 `focus` 只在渲染时写入原生 `autofocus` 属性，运行时没有监听它们的后续变化；不要依赖动态切换 `focus` 主动聚焦或失焦。

### textarea

Web 内建基础组件。多行输入、value 同步、placeholder、disabled、maxlength、焦点及输入事件；浏览器自动高度、键盘避让与宿主行为不能默认等同。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | 输入框内容 |
| placeholder | string |  | 输入框为空时占位符 |
| disabled | boolean | `false` | 是否禁用 |
| maxlength | number | `140` | 最大输入长度，设置为 -1 的时候不限制最大长度 |
| auto-focus | boolean | `false` | 自动聚焦；受浏览器自动聚焦策略限制 |
| focus | boolean | `false` | 获取焦点 |
| cursor | number | `-1` | 指定光标位置 |
| selection-start | number | `-1` | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用 |
| selection-end | number | `-1` | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindinput | 键盘输入时触发，`event.detail = { value }` |
| bindfocus | 输入框聚焦时触发，`event.detail = { value }`，不支持 `height` |
| bindblur | 输入框失去焦点时触发，`event.detail = { value }`，不支持 `encryptedValue`、`encryptError` |

`auto-focus` 和 `focus` 只在渲染时写入原生 `autofocus` 属性，运行时没有监听它们的后续变化；动态聚焦需使用 Web DOM 能力并做好条件编译。

#### 注意事项

- 当前 Web 内建实现不支持 `auto-height`、placeholder 样式、微信软键盘配置以及 `confirm`、`linechange`、`selectionchange` 的微信事件语义；需要时使用 CSS 或 Web-only 原生事件实现。

### button

Web 内建基础组件。支持小程序风格的尺寸、类型、plain、loading、disabled 和 hover；`form-type` 可触发表单 submit/reset。小程序宿主 `open-type` 能力在 Web 编译时会被提示为不支持，应使用浏览器 API 或业务组件替代。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| size | string | `default` | 按钮的大小，`default`：默认大小，`mini`：小尺寸 |
| type | string | `default` | 按钮的样式类型，`primary`：绿色，`default`：白色，`warn`：红色 |
| plain | boolean | `false` | 按钮是否镂空，背景色透明 |
| disabled | boolean | `false` | 是否禁用 |
| loading | boolean | `false` | 名称前是否带 loading 图标 |
| form-type | string |  | 用于 form 组件，点击分别会触发 form 组件的 submit/reset 事件，有效值为 `submit`、`reset` |
| hover-class | string | `button-hover` | 指定按钮按下去的样式类。当 hover-class="none" 时，没有点击态效果 |
| hover-stop-propagation | boolean | `false` | 是否阻止祖先节点出现点击态 |
| hover-start-time | number | `20` | 按住后多久出现点击态，单位毫秒 |
| hover-stay-time | number | `70` | 手指松开后点击态保留时间，单位毫秒 |

### switch

Web 内建基础组件。switch/checkbox 两种展示，支持 checked、disabled、color、change，并参与 form。

#### 属性

| 属性名   | 类型    | 默认值    | 说明                           |
| -------- | ------- | --------- | ------------------------------ |
| checked  | boolean | `false`   | 是否选中                       |
| disabled | boolean | `false`   | 是否禁用                       |
| type     | string  | `switch`  | 样式，有效值：switch, checkbox |
| color    | string  | `#04BE02` | switch 的颜色，同 css 的 color |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | 点击导致 checked 改变时会触发 change 事件，`event.detail = { value }` |

### slider

Web 内建基础组件。min/max/step/value、轨道和滑块样式、显示值；由触摸位置计算数值，触发 `changing` 和 `change`，并参与 form。鼠标、触控和无障碍键盘体验需单独验证。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| min | number | `0` | 最小值 |
| max | number | `100` | 最大值 |
| step | number | `1` | 步长 |
| disabled | boolean | `false` | 是否禁用 |
| value | number | `min` | 当前取值 |
| color | string |  | 背景条颜色（已废弃，请使用 backgroundColor） |
| selected-color | string |  | 已选择颜色（已废弃，请使用 activeColor） |
| activeColor | string | `#1aad19` | 已选择颜色 |
| backgroundColor | string | `#e9e9e9` | 背景条颜色 |
| block-size | number | `28` | 滑块大小 |
| block-color | string | `#ffffff` | 滑块颜色 |
| show-value | boolean | `false` | 是否在右侧显示当前值 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | 完成一次拖动后触发，`event.detail = { value }` |
| bindchanging | 拖动过程中触发，`event.detail = { value }` |

### radio-group

Web 内建基础组件。管理组内单选值并触发 `change`，通过 `name` 参与 form。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | radio-group 中选中项发生改变时触发 change 事件，`detail = { value }`，其中 `value` 为选中的 radio 值 |

### radio

Web 内建基础组件。支持 value、checked、disabled 和 color，必须放在兼容的 `radio-group` 关系中使用。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | radio 标识，当该 radio 选中时，radio-group 的 change 事件会携带 radio 的 value |
| disabled | boolean | false | 是否禁用 |
| checked | boolean | false | 当前是否选中，可用来设置默认选中 |
| color | string | `#09BB07` | Web 不支持通过该属性修改选中颜色 |

`checked` 只用于组件创建时初始化内部状态，当前 Web 实现没有监听后续 prop 变化；需要受控单选时应通过 group 交互更新并实测状态同步。

### checkbox-group

Web 内建基础组件。汇总组内选中值数组并触发 `change`，通过 `name` 参与 form。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | checkbox-group 中选中项发生改变时触发 change 事件，`detail = { value: [ 选中的 checkbox 的 value 的数组 ] } ` |

### checkbox

Web 内建基础组件。支持 value、checked、disabled 和 color，必须放在兼容的 `checkbox-group` 关系中使用。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | checkbox 标识，选中时触发 checkbox-group 的 change 事件，并携带 checkbox 的 value |
| disabled | boolean | `false` | 是否禁用 |
| checked | boolean | `false` | 当前是否选中，可用来设置默认选中 |
| color | string | `#09BB07` | checkbox 的颜色，同 css 的 color |

当前 Web 选中样式使用内置主题色，没有消费 `color` 的传入值；不要依赖该属性自定义颜色。

`checked` 只用于组件创建时初始化内部状态，当前 Web 实现没有监听后续 prop 变化；不要把它当作可动态更新的受控属性。

### scroll-view

Web 内建基础组件。基于 BetterScroll，支持横纵滚动、`scroll-top` / `scroll-left`、`scroll-into-view`、动画滚动、上下边界事件、滚动详情、鼠标滚轮、增强模式和自定义下拉刷新。使用 MutationObserver / ResizeObserver 刷新内容尺寸。行为、性能和原生页面滚动不同。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| scroll-x | boolean | `false` | 允许横向滚动 |
| scroll-y | boolean | `false` | 允许纵向滚动 |
| upper-threshold | number | `50` | 距顶部/左边多远时(单位 px),触发 scrolltoupper 事件 |
| lower-threshold | number | `50` | 距底部/右边多远时(单位 px),触发 scrolltolower 事件 |
| scroll-top | number | `0` | 设置纵向滚动条位置 |
| scroll-left | number | `0` | 设置横向滚动条位置 |
| scroll-with-animation | boolean | `false` | 在设置滚动条位置时使用动画过渡 |
| enhanced | boolean | `false` | scroll-view 组件功能增强 |
| refresher-enabled | boolean | `false` | 开启自定义下拉刷新 |
| refresher-threshold | number | `45` | 设置自定义下拉刷新阈值 |
| scroll-into-view | string |  | 值应为某子元素 id（id 不能以数字开头） |
| refresher-default-style | string | `'black'` | 设置下拉刷新默认样式，支持 `black`、`white` |
| refresher-background | string | `''` | 设置自定义下拉刷新背景颜色 |
| refresher-triggered | boolean | `false` | 设置当前下拉刷新状态,true 表示已触发 |
| enable-flex | boolean | `false` | Web 不支持该属性；需要 flex 布局时直接使用 Web CSS |

#### 事件

| 事件名               | 说明                                       |
| -------------------- | ------------------------------------------ |
| binddragstart        | 滑动开始事件，同时开启 enhanced 属性后生效 |
| binddragging         | 滑动事件，同时开启 enhanced 属性后生效     |
| binddragend          | 滑动结束事件，同时开启 enhanced 属性后生效 |
| bindscrolltoupper    | 滚动到顶部/左边触发                        |
| bindscrolltolower    | 滚动到底部/右边触发                        |
| bindscroll           | 滚动时触发                                 |
| bindrefresherpulling | 自定义下拉刷新控件被下拉时触发             |
| bindrefresherrefresh | 自定义下拉刷新被触发                       |
| bindrefresherrestore | 自定义下拉刷新被复位时触发                 |
| bindrefresherabort   | 自定义下拉刷新被中止时触发                 |

#### 注意事项

- Web 实现基于 BetterScroll；内容或容器尺寸动态变化后由 MutationObserver、ResizeObserver 刷新，复杂异步布局仍应验证滚动范围是否及时更新。
- `binddragstart`、`binddragging`、`binddragend` 仅在 `enhanced` 开启时触发。
- 下拉刷新和鼠标滚轮行为受 BetterScroll 配置及浏览器输入设备影响。

### sticky-header

Web 内建基础组件。消费 scroll-view 提供的滚动偏移，通过 transform 模拟吸顶并支持顶部偏移；只支持作为 `scroll-view` 或 `sticky-section` 的直接子节点。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| offset-top | number | `0` | 吸顶时与顶部的距离 |
| padding | array | `[0, 0, 0, 0] ` | 长度为 4 的数组，按 top、right、bottom、left 顺序指定内边距 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindstickontopchange | 吸顶状态变化事件, `event.detail = { isStickOnTop }`，当 sticky-header 吸顶时为 true，否则为 false |

#### 注意事项

- Web 运行时提供 sticky-header 内建实现；同一模板输出其它平台时需另行核对目标平台支持情况。
- Web 下只支持作为 `scroll-view` 或 `sticky-section` 的直接子节点；吸顶位置依赖父级提供的滚动偏移和自身布局测量。

### sticky-section

Web 内建基础组件。提供吸顶分组结构，自身逻辑较轻，需要与 sticky-header、scroll-view 组合。

#### 注意事项

- Web 运行时提供 sticky-section 内建实现；同一模板输出其它平台时需另行核对目标平台支持情况。

### swiper

Web 内建基础组件。基于 BetterScroll Slide，支持 current、指示点、自动播放、间隔、动画时长、循环和纵向切换，触发 change/transition/animationfinish；ResizeObserver 用于尺寸变化刷新。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| indicator-dots | boolean | `false` | 是否显示面板指示点 |
| indicator-color | color | `rgba(0, 0, 0, .3)` | 指示点颜色 |
| indicator-active-color | color | `#000000` | 当前选中的指示点颜色 |
| autoplay | boolean | `false` | 是否自动切换 |
| current | number | `0` | 当前所在滑块的 index |
| interval | number | `5000` | 自动切换时间间隔 |
| duration | number | `500` | 滑动动画时长 |
| circular | boolean | `false` | 是否采用衔接滑动 |
| vertical | boolean | `false` | 滑动方向是否为纵向 |
| easing-function | string | `default` | 支持 `linear`、`easeInCubic`、`easeOutCubic`、`easeInOutCubic`；`default` 使用 BetterScroll 默认缓动 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | current 改变时会触发 change 事件，`event.detail = {current, currentItemId, source}` |
| bindtransition | swiper-item 位置变化时触发，`event.detail = {dx, dy}` |
| bindanimationfinish | 动画结束时触发，`event.detail = {current, currentItemId, source}` |

Web 不支持 `previous-margin`、`next-margin`、`display-multiple-items`、`skip-hidden-item-layout`。

### swiper-item

Web 内建基础组件。提供 swiper 所需子项结构，应作为 swiper 直接子项使用，不是独立轮播容器。

#### 属性

| 属性名  | 类型   | 默认值 | 说明                    |
| ------- | ------ | ------ | ----------------------- |
| item-id | string |        | 该 swiper-item 的标识符 |

### picker

Web 内建基础组件。基于 BetterScroll Wheel 的弹层滚轮，支持 `selector`、`multiSelector`、`time`、`date`，处理确认、取消、change 和 columnchange。Web 不支持微信 `region` 模式。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| mode | string | `selector` | 选择器类型，目前支持 `selector`、`multiSelector`、`time`、`date` |
| disabled | boolean | `false` | 是否禁用 |

#### 事件

| 事件名     | 说明                                                   |
| ---------- | ------------------------------------------------------ |
| bindcancel | 取消选择时触发                                         |
| bindchange | value 改变时触发 change 事件，`event.detail = {value}` |

#### 普通选择器：mode = selector

##### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| range | array[object]/array | `[]` | mode 为 selector 或 multiSelector 时，range 有效 |
| range-key | string |  | 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器显示内容 |
| value | number | 0 | 表示选择了 range 中的第几个（下标从 0 开始） |

#### 多列选择器：mode = multiSelector

##### 属性与事件

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| range | array[object]/array | `[]` | mode 为 selector 或 multiSelector 时，range 有效 |
| range-key | string |  | 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器显示内容 |
| value | array | `[]` | 表示选择了 range 中的第几个（下标从 0 开始） |
| bindcolumnchange | function |  | 列改变时触发 |

#### 多列选择器：时间选择器：mode = time

##### 属性

| 属性名 | 类型   | 默认值  | 说明                                        |
| ------ | ------ | ------- | ------------------------------------------- |
| value  | string | `''` | 表示选中的时间，格式为"hh:mm"               |
| start  | string | `1970-01-01` | 时间模式使用时应显式传入合法的 "hh:mm" |
| end    | string | `2100-01-01` | 时间模式使用时应显式传入合法的 "hh:mm" |

#### 多列选择器：时间选择器：mode = date

##### 属性

| 属性名 | 类型   | 默认值  | 说明                                             |
| ------ | ------ | ------- | ------------------------------------------------ |
| value  | string | `''` | 表示选中的日期，格式为"YYYY-MM-DD"               |
| start  | string | `1970-01-01` | 表示有效日期范围的开始，字符串格式为"YYYY-MM-DD" |
| end    | string | `2100-01-01` | 表示有效日期范围的结束，字符串格式为"YYYY-MM-DD" |
| fields | string | `day`   | 有效值 year,month,day，表示选择器的粒度          |

fields 有效值： | 属性名 | 说明 | | -----------------------| ------------------------ | | year | 选择器粒度为年 | | month | 选择器粒度为月份 | | day | 选择器粒度为天 |

### picker-view

Web 内建基础组件。管理内嵌多列选择值、选中区域和 change 汇总。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | array\<number\> |  | 数组中的数字依次表示 picker-view 内的 [picker-view-column](#picker-view-column) 选择的第几项（下标从 0 开始），数字大于 [picker-view-column](#picker-view-column) 可选项长度时，选择最后一项；未传时运行时从各列读取当前索引。 |
| indicator-style | string |  | 设置选择器中间选中框的样式 |
| indicator-class | string |  | 设置选择器中间选中框的类名 |
| mask-style | string |  | 设置蒙层的样式 |
| mask-class | string |  | 设置蒙层的类名 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | 滚动选择时触发 change 事件，`event.detail = {value}`，其中 `value` 为数组，表示 picker-view 内的 [picker-view-column](#picker-view-column) 当前选择的是第几项（下标从 0 开始） |

### picker-view-column

Web 内建基础组件。单列 Wheel 实现，向直接父级 picker-view 汇报滚动开始、结束和索引变化；不要脱离 picker-view 独立使用。

### movable-area

Web 内建基础组件。提供移动边界和尺寸引用，使用 ResizeObserver 通知子项刷新。

### movable-view

Web 内建基础组件。基于 BetterScroll Movable/Zoom，支持 none、horizontal、vertical、all 方向，x/y 外部控制、惯性、越界回弹、阻尼、摩擦、禁用、动画和双指缩放；触发 change、scale 及触摸方向事件。必须与 movable-area 组合。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| direction | string | `none` | 目前支持 all、vertical、horizontal、none |
| inertia | boolean | `false` | movable-view 是否带有惯性 |
| out-of-bounds | boolean | `false` | 超过可移动区域后，movable-view 是否还可以移动 |
| x | number | `0` | 定义 x 轴方向的偏移 |
| y | number | `0` | 定义 y 轴方向的偏移 |
| disabled | boolean | `false` | 是否禁用 |
| animation | boolean | `true` | 是否使用动画 |
| damping | number | `20` | 阻尼系数，用于控制 x 或 y 改变时的动画和过界回弹的动画，值越大移动越快 |
| friction | number | `2` | 摩擦系数，用于控制惯性滑动的动画，值越大摩擦力越大，滑动越快停止 |
| scale | boolean | `false` | 是否支持双指缩放 |
| scale-min | number | `0.5` | 缩放最小值 |
| scale-max | number | `10` | 缩放最大值 |
| scale-value | number | `1` | 缩放倍数 |

#### 事件

| 事件名     | 说明                                                  |
| ---------- | ----------------------------------------------------- |
| bindchange | 拖动过程中触发的事件，`event.detail = {x, y, source}` |
| bindscale | 缩放过程中触发，`event.detail = {x, y, scale}` |
| htouchmove | 初次手指触摸后移动为横向的移动时触发                  |
| vtouchmove | 初次手指触摸后移动为纵向的移动时触发                  |

当前 Web 实现虽然通过 `bindscale` 派发缩放事件，但构造出的事件对象 `type` 为 `change`；业务应以绑定入口和 `detail` 为准，不要依赖 `event.type === 'scale'`。

### navigator

Web 内建基础组件。按 `open-type` 接入 navigate、redirect、navigateBack、reLaunch 等 Web 路由能力，并支持 hover 反馈。最终行为受 Mpx Web router 约束，不是浏览器普通链接的完整替代。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| hover-class | string | `none` | 指定按下去的样式类。 |
| hover-stop-propagation | boolean | `false` | 是否阻止祖先节点出现点击态 |
| hover-start-time | number | `50` | 按住后多久出现点击态，单位毫秒 |
| hover-stay-time | number | `600` | 手指松开后点击态保留时间，单位毫秒 |
| open-type | string | `navigate` | Web 编译规则明确支持 `navigate`、`redirect`、`navigateBack`、`reLaunch` |
| url | string |  | 跳转链接 |
| delta | number | `1` | 当 open-type 为 `navigateBack` 时有效，表示回退的层数 |

运行时组件保留了 `switchTab` 分支，但当前模板转换规则会对该值给出 Web 不支持提示，因此不要把它作为稳定能力使用；`navigateTo` 是 API 名，`navigator` 的 `open-type` 对应值是 `navigate`。

### video

Web 内建基础组件。包装 HTML video 并接入内置播放器控件，支持 src、poster、controls、autoplay、loop、muted、初始位置和下表列出的播放器配置，转换播放、暂停、结束、时间、全屏、错误、控件显隐事件。浏览器自动播放、全屏和媒体格式受浏览器策略限制。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string |  | 要播放视频的资源地址或本地静态资源相对路径 |
| controls | boolean | `true` | 是否显示默认播放控件 |
| autoplay | boolean | `false` | 是否自动播放 |
| loop | boolean | `false` | 是否循环播放 |
| muted | boolean | `false` | 是否静音播放 |
| initial-time | number | `0` | 指定视频初始播放位置 |
| object-fit | string | `contain` | 当视频大小与 video 容器大小不一致时，视频的表现形式 |
| poster | string |  | 视频封面的图片地址 |
| show-progress | boolean | `true` | 是否显示进度条 |
| show-bottom-progress | boolean | `true` | 是否显示底部进度条 |
| show-fullscreen-btn | boolean | `true` | 是否显示全屏按钮 |
| show-play-btn | boolean | `true` | 是否显示底部播放按钮 |
| show-center-play-btn | boolean | `true` | 是否显示中心播放按钮 |
| show-mute-btn | boolean | `false` | 是否显示静音按钮 |
| playsinline | boolean | `true` | 是否添加浏览器行内播放相关属性 |

运行时还声明了弹幕、投屏、画中画、旋转、手势等若干与微信同名的 props，但当前组件逻辑没有消费它们。仅声明 prop 不代表功能已实现，未列入上表的属性按 Web 不支持处理。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindplay | 当开始/继续播放时触发 play 事件 |
| bindpause | 当暂停播放时触发 pause 事件 |
| bindended | 当播放到末尾时触发 ended 事件 |
| bindtimeupdate | 播放进度变化时触发；当前 Web 实现转发播放器事件，不合成微信的 `{currentTime, duration}` detail |
| bindfullscreenchange | 视频进入和退出全屏时触发，`event.detail = {fullScreen}` |
| bindwaiting | 视频出现缓冲时触发 |
| binderror | 视频播放出错时触发 |
| bindloadedmetadata | 视频元数据加载完成时触发；当前 Web 实现转发播放器事件，不合成微信的 `{width, height, duration}` detail |
| bindcontrolstoggle | 切换 controls 显示隐藏时触发。`event.detail = {show}` |
| bindseekcomplete | seek 完成时触发，`event.detail = {position}` |
| bindprogress | 缓冲进度变化时触发，`event.detail = {buffered}` |

#### 注意事项

- 自动播放、行内播放和全屏能力受浏览器策略限制；部分移动浏览器要求静音或用户手势后才能开始播放。
- `controls="{{ false }}"` 时 Web 实现不会使用 `poster` 初始化播放器封面。

### web-view

Web 内建基础组件。使用 iframe 加载页面，追加实例标识并通过 postMessage 处理消息、导航和自定义 API 调用。仍受 X-Frame-Options/CSP、跨域、来源校验和浏览器嵌入策略约束；桥接细节读取 `webview-bridge-reference.md`。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string |  | webview 指向网页的链接，如果需要对跳转的 URL 设定白名单可跳转，需要在业务跳转之前处理该逻辑 |

#### 事件

| 事件名      | 说明                                |
| ----------- | ----------------------------------- |
| bindmessage | iframe 页面通过 postMessage 向容器传递数据 |
| bindload    | 网页加载成功时候触发此事件          |
| binderror   | 网页加载失败的时候触发此事件        |

#### 注意事项

- 被打开的 H5 页面需要按 [WebView Bridge 参考](./webview-bridge-reference.md) 接入通信 SDK；同时配置 Web 侧 host 白名单并遵守浏览器来源校验、跨域和 iframe 嵌入策略。

### 缺失与替代

以下宿主组件没有 Web 内建实现，不应因为同名标签被保留就认定可用：`camera`、直播/推流、`open-data`、广告、公众号、宿主地图、富文本编辑器、频道/实时音视频、键盘附件，以及微信新增的布局、滚动、门户和页面容器类组件。按 [Web 组件降级](#web-组件降级) 采用浏览器 API、H5 SDK 或 Web-only 业务组件替代。


---

## Web 组件降级

以下能力在 Web 下没有浏览器等价组件，需要 Web 方案替代：

| 组件 | Web 侧处理 |
| --- | --- |
| `camera` | 使用浏览器媒体能力或业务 H5 SDK。 |
| `live-player` / `live-pusher` | 使用 H5 播放 / 推流方案。 |
| `open-data` | 改为业务接口或 Web 用户体系。 |
| `official-account` | 改为 Web 侧业务入口。 |
| `ad` / `ad-custom` | 使用 Web 广告 SDK。 |
| `functional-page-navigator` | 使用 Web 页面或业务流程替代。 |
| `editor` | 使用 Web 富文本编辑器。 |
| `map` | 使用 Web 地图 SDK 或业务地图组件；浏览器原生 `<map>` 是图片热区标签，不具备地图能力。 |
| `channel-live` / `channel-video` / `voip-room` | 使用 Web 实时音视频 SDK 或业务组件。 |
| `keyboard-accessory` | 使用浏览器输入区布局或业务键盘组件替代。 |
| `page-meta` | 改用 Web 路由、Head 管理或 `document` 能力处理页面元信息。 |
| `native-component` / `aria-component` | 使用 Web 组件、Vue 组件或标准 HTML/ARIA 语义替代。 |
| `match-media` | 使用 CSS media query 或 Web `matchMedia`，并隔离浏览器监听与销毁逻辑。 |
| `root-portal` / `page-container` | 当前 Web 没有对应内建实现；使用 Vue portal/dialog 方案或 Web-only 业务组件。 |
| `share-element` / `snapshot` | 使用 Web View Transition、Canvas 或业务截图方案；不具备微信同名宿主语义。 |
| `grid-view` / `grid-item` / `list-view` / `list-item` | 使用 CSS Grid、普通列表或 Web 虚拟列表组件。 |
| `nested-scroll-header` / `nested-scroll-body` / `draggable-sheet` | 使用 Web-only 滚动协调或抽屉组件，并验证触摸和页面滚动冲突。 |
| `navigation-bar` | 使用 Mpx Web 路由、页面配置或 Web-only 导航组件。 |
| `custom-wrapper` | Web 没有微信原生自定义组件更新边界语义；使用普通容器并按 Web 渲染性能优化。 |

`canvas` 在 Web 下可作为原生 `<canvas>` 使用；复杂场景应结合 Web Canvas API 或业务封装处理。

未提供 Web 内建实现的宿主组件即使被保留为同名标签，也不代表对应宿主能力可用。不要只以“能够编译”为支持依据，应验证渲染、属性、事件和实例 API；无法对齐时使用 Web-only 组件替代。

---

## 专项入口

- `web-view` 的组件属性和事件保留在本文件；通信协议、宿主配置、白名单与来源安全统一见 [WebView Bridge 参考](./webview-bridge-reference.md)。
- 自定义或替换 Web 内建组件的配置与接入约束统一见 [H5 生态混合开发](./web-hybrid-dev.md#自定义-web-内建组件)。
