# Mpx2Web 模板差异参考

本文只记录 Mpx 输出 Web 时需要核对的模板差异、内建组件边界和降级方案；通用语法沿用输入项目与 Mpx 文档。

## 目录

- [事件处理](#事件处理)
- [i18n 国际化](#i18n-国际化)
- [使用 Vue 组件](#使用-vue-组件)
  - [注册与使用](#注册与使用)
  - [通过脚本注册](#通过脚本注册)
- [模板定义与使用](#模板定义与使用)
  - [同文件定义与使用](#同文件定义与使用)
  - [模板复用](#模板复用)
- [基础组件](#基础组件)
  - [通用属性](#通用属性)
  - [view](#view)
  - [text](#text)
  - [label](#label)
  - [rich-text](#rich-text)
  - [image](#image)
  - [cover-view](#cover-view)
  - [cover-image](#cover-image)
  - [icon](#icon)
  - [progress](#progress)
  - [form](#form)
  - [input](#input)
  - [textarea](#textarea)
  - [button](#button)
  - [switch](#switch)
  - [slider](#slider)
  - [radio-group](#radio-group)
  - [radio](#radio)
  - [checkbox-group](#checkbox-group)
  - [checkbox](#checkbox)
  - [scroll-view](#scroll-view)
  - [sticky-header](#sticky-header)
  - [sticky-section](#sticky-section)
  - [swiper](#swiper)
  - [swiper-item](#swiper-item)
  - [picker](#picker)
  - [picker-view](#picker-view)
  - [picker-view-column](#picker-view-column)
  - [movable-area](#movable-area)
  - [movable-view](#movable-view)
  - [navigator](#navigator)
  - [video](#video)
  - [canvas](#canvas)
  - [web-view](#web-view)
- [不支持组件与降级处理](#不支持组件与降级处理)

---

## 事件处理

Web 支持绑定组件实例方法和内联传参，例如 `bindtap="handleTap"`、`bindtap="handleTap(item, $event)"`。主要限制如下：

- **不支持事件表达式**：不能直接在事件绑定中执行 `count++`、`active && handleTap()` 等表达式，应将逻辑放入实例方法。动态选择方法名（如 `bindtap="{{active ? 'onActive' : 'onIdle'}}"`）仍可使用，表达式结果须为已声明的实例方法名字符串。
- **不支持 WXS 响应事件**：不能直接绑定 `bindtap="{{tool.onTap}}"` 这类 WXS 处理器。通过条件编译保留小程序实现，在 Web 侧提供等效的实例方法。
- **组件自定义事件不支持冒泡和捕获**：`triggerEvent` 不支持 `bubbles`、`composed`、`capturePhase` 选项；组件跨层通信使用 `provide/inject` 传递回调，或使用全局状态管理。
- **不支持 `mut-bind`**：Web 未实现互斥事件绑定语义，需通过事件处理方法协调响应，不能直接用 `catch` 代替其互斥行为。
- 事件数据方面，Web 不会将 `mark:*` 收集到 `event.mark`；需要传递的数据可通过内联参数传入。

---

## i18n 国际化

Web 输出支持 Mpx i18n。使用前需要在 `MpxWebpackPlugin` 中配置 `i18n` 的 `locale`、`messages` 或 `messagesPath`。

| 场景 | 可用函数 | 使用约束 |
| --- | --- | --- |
| 选项式 API | `$t`、`$te`、`$tm`、`$d`、`$n` | 模板中直接使用，脚本中通过组件实例调用 |
| 组合式 API | `t`、`te`、`tm`、`d`、`n` | 在 `setup` 顶层调用 `useI18n()`，将所需方法暴露给模板 |

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

---

## 使用 Vue 组件

Mpx Web 基于 Vue 2.7，可在页面或组件的 JSON 配置中通过 `usingComponents` 注册兼容 Vue 2.7 的 `.vue` 组件，再在模板中使用注册的标签名。只支持 Vue 3 的组件不能直接使用，需选择 Vue 2 兼容版本。

### 注册与使用

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

### 通过脚本注册

Web 还支持在 `createPage` / `createComponent` 中的 `components` 配置进行 Vue 组件注册，当 Vue 组件模块还提供其他导出（如工具函数、常量）时，推荐采用这种方式，因为在 `usingComponents` 中无法获取其他导出。

在跨端共用的 `.mpx` 文件中，必须通过条件编译隔离 Vue 组件引用与注册，避免影响原平台产物。

---

## 模板定义与使用

Web 支持通过 `<template name="...">` 定义可复用的具名模板，再通过 `<template is="..." data="{{...}}" />` 使用。页面和组件内均可声明，模板所需数据通过 `data` 传入。

### 同文件定义与使用

在 `.mpx` 文件的 `<template>` 区块内定义片段，并在需要的位置引用：

```html
<template>
  <template name="message">
    <view class="message">
      <text>{{title}}</text>
      <text>{{content}}</text>
    </view>
  </template>

  <template is="message" data="{{ title: '提示', content: '欢迎使用' }}" />
</template>
```

`data` 可逐个传入字段，也可用 `data="{{ ...item }}"` 展开对象。`is` 支持动态表达式，例如 `is="{{ compact ? 'compactMessage' : 'message' }}"`，对应名称的模板需提前定义或引入。同一文件内的模板名称不能重复。

### 模板复用

将具名模板定义放入独立的 `.wxml` 文件，在使用方通过 `<import src="..." />` 引入后按名称引用。例如，`message.wxml`：

```html
<template name="message">
  <view class="message">{{content}}</view>
</template>
```

使用方的 `.mpx` 模板区块：

```html
<template>
  <import src="./message.wxml" />
  <template is="message" data="{{ content: '欢迎使用' }}" />
</template>
```

- Web 不支持通过 `<include src="..." />` 引用外部模板文件。
- 模板必须满足单根节点要求。

---

## 基础组件

以下属性、事件表列出已确认可用的能力；不支持或有限制的能力在对应组件下单独说明。

### 通用属性

Web 基础节点和内建组件通常可使用以下通用属性：

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 节点唯一标识 |
| class | string | 样式类名 |
| style | string | 内联样式 |
| hidden | boolean | 隐藏节点 |
| data-* | any | 业务自定义数据；事件传参优先使用内联传参 |
| aria-role | string | 小程序角色语义；Web 不会自动转成标准 `role`。业务需要该语义时补 `role@web` |
| aria-label | string | 跨端无障碍文案 |

Web-only 原生节点还可使用浏览器标准属性；包装型内建组件不保证透传任意原生属性，只使用本参考明确列出的属性。

### view

`view` 支持下列点击态属性。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| hover-class | string | `'none'` | 指定按下去的样式类。 |
| hover-stop-propagation | boolean | `false` | 是否阻止祖先节点出现点击态 |
| hover-start-time | number | `50` | 按住后多久出现点击态，单位毫秒 |
| hover-stay-time | number | `400` | 手指松开后点击态保留时间，单位毫秒 |

另支持 `animation="{{ animationData }}"`（由 `createAnimation().export()` 生成）及 `transitionend`、`animationstart`、`animationiteration`、`animationend` 事件。

### text

复杂富文本使用 `rich-text`。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| selectable | boolean | `false` | 文本是否可选 |
| space | string |  | 连续空格显示方式，支持 `ensp`、`emsp`、`nbsp` |
| decode | boolean | `false` | 是否解码 |

不支持微信的 `user-select` 属性；需要文本可选时使用 `selectable`。

### label

`for` 应指向目标表单控件的 `id`；使用标签包裹控件或 `for` 关联控件时，点击聚焦行为按目标浏览器验证。

### rich-text

`nodes` 中的 HTML 需确保来源可信；小程序的富文本安全策略不能直接等同于 Web。

#### 属性

| 属性名 | 类型          | 默认值 | 说明     |
| ------ | ------------- | ------ | -------- |
| nodes  | array\|string |        | 节点列表 |
| space  | string        |        | 处理节点文本中的连续空格，支持 `ensp`、`emsp`、`nbsp` |

### image

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string |  | 图片资源地址、base64 格式数据或本地静态资源相对路径 |
| mode | string | `scaleToFill` | 图片裁剪、缩放的模式，可选值为 `scaleToFill`、`aspectFit`、`aspectFill`、`widthFix`、`heightFix`、`top`、`bottom`、`center`、`left`、`right`、`top left`、`top right`、`bottom left`、`bottom right` |

#### 事件

| 事件名    | 说明                                                     |
| --------- | -------------------------------------------------------- |
| binderror | 加载失败时触发；`event.detail` 为空对象，不含微信的 `errMsg` |
| bindload  | 当图片载入完毕时触发，`event.detail = { height, width }` |

#### 注意事项

- 不支持 `lazy-load`、`show-menu-by-longpress`；使用懒加载或图片长按菜单时，分别接入 Web 方案，保留其余图片能力。
- image 组件默认宽度 300px、高度 225px
- image 组件进行缩放时，计算出来的宽高可能带有小数，在不同 webview 内核下渲染可能会被抹去小数部分

### cover-view

`cover-view` 在 Web 可作为普通容器使用，但不提供小程序覆盖原生组件的层级能力。

### cover-image

`cover-image` 的 Web 图片能力见 [image](#image)；不提供小程序覆盖原生组件的层级能力。

### icon

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | string |  | icon 的类型，有效值：success、success_no_circle、info、warn、waiting、cancel、download、search、clear |
| size | string\|number | `23` | icon 的大小 |
| color | string |  | icon 的颜色，同 css 的 color |

### progress

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| percent | number | `0` | 百分比进度，范围 0-100 |
| show-info | boolean | `false` | 在进度条右侧显示百分比 |
| border-radius | number\|string | `0` | 进度条圆角大小 |
| font-size | number\|string | `16` | 右侧百分比文字大小 |
| stroke-width | number\|string | `6` | 进度条线的宽度，单位 px |
| active-color | string | `#09BB07` | 已选择的进度条颜色 |
| background-color | string | `#EBEBEB` | 未选择的进度条颜色 |
| active | boolean | `false` | 进度条从左往右的动画 |
| active-mode | string | `backwards` | 动画播放模式，`backwards`: 从头开始播放；`forwards`: 从上次结束点接着播放 |
| duration | number | `30` | 进度增加 1%所需毫秒数 |

设置进度条颜色请使用 `active-color`。仅设置旧属性 `color` 会被 `active-color` 的默认值 `#09BB07` 覆盖，无法改变进度条颜色。

#### 事件

| 事件名        | 说明                                         |
| ------------- | -------------------------------------------- |
| bindactiveend | 动画完成时触发，`event.detail = { curPercent }`；字段名与微信不一致 |

### form

仅收集已接入表单的控件，并按 `name` 汇总；`reset` 恢复控件初始值。自定义控件不会自动进入提交数据。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindsubmit | 携带 form 中的数据触发 submit 事件，`event.detail = {value : {'name': 'value'} }` |
| bindreset | 表单重置时会触发 reset 事件 |

### input

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | 输入框的初始内容 |
| type | string | `text` | 支持 `text`、`number`；`digit` 按浏览器数字输入处理 |
| password | boolean | `false` | 是否是密码类型 |
| placeholder | string |  | 输入框为空时占位符 |
| disabled | boolean | `false` | 是否禁用 |
| maxlength | number | `140` | 最大输入长度，设置为 -1 的时候不限制最大长度 |
| auto-focus | boolean | `false` | 仅初始自动聚焦；受浏览器策略限制 |
| focus | boolean | `false` | 仅初始聚焦，后续变更不会主动聚焦或失焦 |
| cursor | number | `-1` | 指定光标位置；浏览器不支持选区的 input 类型可能受限 |
| selection-start | number | `-1` | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用 |
| selection-end | number | `-1` | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindinput | 键盘输入时触发，`event.detail = { value }` |
| bindfocus | 输入框聚焦时触发，`event.detail = { value }`，不支持 `height` |
| bindblur | 输入框失去焦点时触发，`event.detail = { value }`，不支持 `encryptedValue`、`encryptError` |

不支持微信 `idcard` 键盘、`safe-password`、`nickname`、`confirm-type`、`confirm-hold`、`cursor-spacing`、`adjust-position`、`hold-keyboard`，也不提供 `confirm` / `selectionchange` 的微信事件详情。需要时在 Web 接入浏览器输入能力。

### textarea

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | 输入框内容 |
| placeholder | string |  | 输入框为空时占位符 |
| disabled | boolean | `false` | 是否禁用 |
| maxlength | number | `140` | 最大输入长度，设置为 -1 的时候不限制最大长度 |
| auto-focus | boolean | `false` | 仅初始自动聚焦；受浏览器策略限制 |
| focus | boolean | `false` | 仅初始聚焦，后续变更不会主动聚焦或失焦 |
| cursor | number | `-1` | 指定光标位置 |
| selection-start | number | `-1` | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用 |
| selection-end | number | `-1` | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindinput | 键盘输入时触发，`event.detail = { value }` |
| bindfocus | 输入框聚焦时触发，`event.detail = { value }`，不支持 `height` |
| bindblur | 输入框失去焦点时触发，`event.detail = { value }`，不支持 `encryptedValue`、`encryptError` |

不支持 `auto-height`、placeholder 样式、微信软键盘配置以及 `confirm`、`linechange`、`selectionchange` 的微信事件语义；需要时按 Web 交互接入。

### button

不支持小程序宿主 `open-type` 能力；使用时按业务需求接入 Web 方案。

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

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| min | number | `0` | 最小值 |
| max | number | `100` | 最大值 |
| step | number | `1` | 步长 |
| disabled | boolean | `false` | 是否禁用 |
| value | number | `0` | 初始取值，初始化时限制到 `[min, max]` 范围内；后续动态修改不会同步内部滑块值 |
| activeColor | string | `#1aad19` | 已选择颜色 |
| backgroundColor | string | `#e9e9e9` | 背景条颜色 |
| block-size | number | `28` | 滑块大小 |
| block-color | string | `#ffffff` | 滑块颜色 |
| show-value | boolean | `false` | 是否在右侧显示当前值 |

不支持 `color`、`selected-color`，分别使用 `backgroundColor`、`activeColor` 设置背景条和已选择部分的颜色。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | 完成一次拖动后触发，`event.detail = { value }` |
| bindchanging | 拖动过程中触发，`event.detail = { value }` |

### radio-group

通过 `name` 参与 form。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | radio-group 中选中项发生改变时触发 change 事件，`detail = { value }`，其中 `value` 为选中的 radio 值 |

### radio

与 `radio-group` 配合使用。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | radio 标识，当该 radio 选中时，radio-group 的 change 事件会携带 radio 的 value |
| disabled | boolean | false | 是否禁用 |
| checked | boolean | false | 初始是否选中 |

不支持通过 `color` 修改选中颜色；`checked` 只用于初始选中，后续动态变更不会同步。

### checkbox-group

通过 `name` 参与 form。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | checkbox-group 中选中项发生改变时触发 change 事件，`detail = { value: [ 选中的 checkbox 的 value 的数组 ] } ` |

### checkbox

与 `checkbox-group` 配合使用。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string |  | checkbox 标识，选中时触发 checkbox-group 的 change 事件，并携带 checkbox 的 value |
| disabled | boolean | `false` | 是否禁用 |
| checked | boolean | `false` | 初始是否选中 |

不支持通过 `color` 修改选中颜色；`checked` 只用于初始选中，后续动态变更不会同步。

### scroll-view

Web 滚动基于 BetterScroll，与原生页面滚动行为不同。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| scroll-x | boolean | `false` | 允许横向滚动 |
| scroll-y | boolean | `false` | 允许纵向滚动 |
| upper-threshold | number | `50` | 距顶部/左边多远时(单位 px),触发 scrolltoupper 事件 |
| lower-threshold | number | `50` | 距底部/右边多远时(单位 px),触发 scrolltolower 事件 |
| scroll-top | number | `0` | 设置纵向滚动条位置 |
| scroll-left | number | `0` | 设置横向滚动条位置 |
| scroll-options | object | `{}` | Web 专属滚动配置；不能通过 `observeDOM` 开启自动 DOM 监听 |
| scroll-with-animation | boolean | `false` | 在设置滚动条位置时使用动画过渡 |
| enhanced | boolean | `false` | scroll-view 组件功能增强 |
| refresher-enabled | boolean | `false` | 开启自定义下拉刷新 |
| refresher-threshold | number | `45` | 设置自定义下拉刷新阈值 |
| scroll-into-view | string |  | 值应为某子元素 id（id 不能以数字开头） |
| refresher-default-style | string | `'black'` | 设置下拉刷新默认样式，支持 `black`、`white`、`none`；`none` 不显示默认刷新样式 |
| refresher-background | string | `''` | 设置自定义下拉刷新背景颜色 |
| refresher-triggered | boolean | `false` | 设置当前下拉刷新状态,true 表示已触发 |

开启 `refresher-enabled` 并设置 `refresher-default-style="none"` 时，可通过 `refresher` 具名插槽（`slot="refresher"`）提供自定义刷新内容；未提供该插槽时不渲染刷新内容。

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

不支持 `enable-flex`，需要 Flex 布局时使用 Web CSS。复杂异步布局完成后，检查滚动范围是否更新；下拉刷新与鼠标滚轮受浏览器输入设备影响。

### sticky-header

只支持作为 `scroll-view` 或 `sticky-section` 的直接子节点。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| offset-top | number | `0` | 吸顶时与顶部的距离 |
| padding | array | `[0, 0, 0, 0] ` | 长度为 4 的数组，按 top、right、bottom、left 顺序指定内边距 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindstickontopchange | 吸顶状态变化事件, `event.detail = { isStickOnTop }`，当 sticky-header 吸顶时为 true，否则为 false |

### sticky-section

与 `scroll-view`、`sticky-header` 配合使用。

### swiper

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
| previous-margin | string |  | 前边距 |
| next-margin | string |  | 后边距 |
| scroll-options | object | `{}` | Web 专属 BetterScroll 初始化选项；仅需调整默认滑动行为时传入 |

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindchange | current 改变时会触发 change 事件，`event.detail = {current, currentItemId, source}` |
| bindtransition | swiper-item 位置变化时触发，`event.detail = {dx, dy}` |
| bindanimationfinish | 动画结束时触发，`event.detail = {current, currentItemId, source}` |

不支持 `display-multiple-items`、`skip-hidden-item-layout`；只隔离这两个属性，保留其他轮播能力。需要多项同屏时接入实际 Web 轮播方案。

### swiper-item

作为 `swiper` 的直接子项使用。

#### 属性

| 属性名  | 类型   | 默认值 | 说明                    |
| ------- | ------ | ------ | ----------------------- |
| item-id | string |        | 该 swiper-item 的标识符 |

### picker

不支持 `region`；需要地区选择时单独接入 Web 方案，并保留原页面使用的地区名称与代码。

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
| start  | string | `1970-01-01` | 时间模式传入时使用 "hh:mm" |
| end    | string | `2100-01-01` | 时间模式传入时使用 "hh:mm" |

`time` 模式省略 `start` / `end` 时，默认值格式不符，可能使滚轮异常；遇到问题时，仅在 Web 提供符合业务的 `hh:mm` 范围，已有有效范围的调用无需修改。

#### 多列选择器：时间选择器：mode = date

##### 属性

| 属性名 | 类型   | 默认值  | 说明                                             |
| ------ | ------ | ------- | ------------------------------------------------ |
| value  | string | `''` | 表示选中的日期，格式为"YYYY-MM-DD"               |
| start  | string | `1970-01-01` | 表示有效日期范围的开始，字符串格式为"YYYY-MM-DD" |
| end    | string | `2100-01-01` | 表示有效日期范围的结束，字符串格式为"YYYY-MM-DD" |
| fields | string | `day`   | 有效值 year,month,day，表示选择器的粒度          |

fields 有效值：

| 属性名 | 说明 |
| --- | --- |
| year | 选择器粒度为年 |
| month | 选择器粒度为月份 |
| day | 选择器粒度为天 |

### picker-view

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

作为 `picker-view` 的直接子节点使用。

### movable-area

与 `movable-view` 配合使用。

### movable-view

与 `movable-area` 配合使用。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| direction | string | `none` | 目前支持 all、vertical、horizontal、none |
| inertia | boolean | `false` | movable-view 是否带有惯性 |
| out-of-bounds | boolean | `false` | 超过可移动区域后，movable-view 是否还可以移动 |
| x | number | `0` | 定义 x 轴方向的偏移 |
| y | number | `0` | 定义 y 轴方向的偏移 |
| disabled | boolean | `false` | 是否禁用 |
| damping | number | `20` | 阻尼系数，仅控制过界回弹时间，正值越大回弹越快；不影响 x 或 y 更新时的位移动画 |
| friction | number | `2` | 摩擦系数，用于控制惯性滑动的动画，值越大摩擦力越大，滑动越快停止 |
| scale | boolean | `false` | 是否支持双指缩放 |
| scale-min | number | `0.5` | 缩放最小值 |
| scale-max | number | `10` | 缩放最大值 |
| scale-value | number | `1` | 缩放倍数 |

`animation` 在 Web 下不生效，不能通过它开关动画。

#### 事件

| 事件名     | 说明                                                  |
| ---------- | ----------------------------------------------------- |
| bindchange | 拖动过程中触发的事件，`event.detail = {x, y, source}` |
| bindscale | 缩放过程中触发，`event.detail = {x, y, scale}` |
| htouchmove | 初次手指触摸后移动为横向的移动时触发                  |
| vtouchmove | 初次手指触摸后移动为纵向的移动时触发                  |

`bindscale` 的 `event.type` 在 Web 为 `change`；识别缩放请根据绑定入口与 `event.detail`，不要判断 `event.type === 'scale'`。

### navigator

用于 Mpx 应用内路由，支持的 `open-type` 见下表。

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

不支持 `open-type="switchTab"`；tabBar 跳转使用 `mpx.switchTab`。`navigateTo` 是 API 名，`navigator` 的对应值是 `navigate`。

普通跳转继续使用 `navigator`；只有 Web 需要通过 `navigateTo({ events, success })` 建立 EventChannel 时，才为 Web 接入脚本导航并保留小程序原入口，不要同时显示两个可点击入口。

### video

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

`src`、`controls`、`autoplay`、`loop`、`poster`、`initial-time`、`playsinline` 及表中的 `show-*` 属性仅在播放器初始化时生效，后续更新不会同步；不能通过动态修改 `src` 切换视频地址，也不能通过动态修改 `controls` 切换播放控件显隐。播放器初始化后，`muted` 和 `object-fit` 支持动态更新。

不支持微信的弹幕、投屏、画中画、旋转和手势类属性；使用时单独接入 Web 方案。

#### 事件

| 事件名 | 说明 |
| --- | --- |
| bindplay | 当开始/继续播放时触发 play 事件 |
| bindpause | 当暂停播放时触发 pause 事件 |
| bindended | 当播放到末尾时触发 ended 事件 |
| bindtimeupdate | 播放进度变化时触发；不保证微信的 `event.detail.currentTime` / `event.detail.duration` 字段 |
| bindfullscreenchange | 视频进入和退出全屏时触发，`event.detail = {fullScreen}` |
| bindwaiting | 视频出现缓冲时触发 |
| binderror | 视频播放出错时触发 |
| bindloadedmetadata | 视频元数据加载完成时触发；不保证微信的 `event.detail.width` / `event.detail.height` / `event.detail.duration` 字段 |
| bindseekcomplete | seek 完成时触发，`event.detail = {position}` |
| bindprogress | 缓冲进度变化时触发，`event.detail = {buffered}` |

### canvas

可按微信新版 Canvas 方式正常使用：节点渲染完成后，通过 SelectorQuery 的 `fields({ node: true, size: true })` 获取节点与尺寸，再调用 `getContext('2d')` 绘制。图片绘制和帧动画可沿用文档写法，`wx.getWindowInfo()` 改用 `@mpxjs/api-proxy` 导出的 `getWindowInfo()`。

- 导出图片：不支持 `canvasToTempFilePath`，Web 侧使用 `canvas.toBlob()` / `canvas.toDataURL()`。
- 创建路径：不支持 `canvas.createPath2D()`，Web 侧通过条件编译使用 `new Path2D(...)`。
- 不支持旧版 `wx.createCanvasContext`方式。

### web-view

加载 Web 页面；消息接收能力见下表。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string |  | iframe 页面地址；配置 `webviewConfig.hostWhitelists` 后按名单校验来源 |

#### 事件

| 事件名      | 说明                                |
| ----------- | ----------------------------------- |
| bindmessage | 接收 iframe 按桥接协议发送的消息，业务数据位于 `event.detail.data` |
| bindload    | 转发 iframe 的 `load` 事件，不保证业务页面内容成功可用 |
| binderror   | 空地址或来源白名单拒绝时触发；不覆盖网络、HTTP 或嵌入策略错误 |

iframe 页面需向父窗口发送符合桥接协议的消息对象或其 JSON 字符串，例如 `{ type: 'postMessage', args: [{ data: { value: 1 } }] }`；也可使用 `{ type: 'postMessage', payload: { data: { value: 1 } } }`。仅发送普通业务数据不会触发 `bindmessage`。

`args` 为数组时优先使用 `args[0]`，否则使用 `payload`；`event.detail.data` 取该参数的 `data`（为真值时），否则取参数本身，不会自动包装成数组。消息需通过来源白名单校验；若提供 `clientUid`，其数值还必须匹配当前 web-view 实例。

---

## 不支持组件与降级处理

下表记录当前 Web 中不支持的基础组件及降级处理方向。

| 组件 | Web 降级处理 |
| --- | --- |
| `camera` | 使用浏览器媒体能力或业务 H5 SDK。 |
| `live-player` / `live-pusher` | 使用 H5 播放 / 推流方案。 |
| `open-data` | 改为业务接口或 Web 用户体系。 |
| `official-account` | 改为 Web 侧业务入口。 |
| `ad` / `ad-custom` | 使用 Web 广告 SDK。 |
| `functional-page-navigator` | 使用 Web 页面或业务流程替代。 |
| `editor` | 使用 Web 富文本编辑器。 |
| `map` | Web 地图 SDK 或业务地图组件，并继续传入中心点、markers 和真实 ID；浏览器原生 `<map>` 是图片热区标签，不具备地图能力。 |
| `channel-live` / `channel-video` / `voip-room` | 使用 Web 实时音视频 SDK 或业务组件。 |
| `keyboard-accessory` | 使用浏览器输入区布局或业务键盘组件替代。 |
| `page-meta` | 改用 Web 路由、Head 管理或 `document` 能力处理页面元信息。 |
| `native-component` / `aria-component` | 使用 Web 组件、Vue 组件或标准 HTML/ARIA 语义替代。 |
| `match-media` | 使用 CSS media query 或 Web `matchMedia`，并隔离浏览器监听与销毁逻辑。 |
| `root-portal` / `page-container` | portal/dialog 或业务组件，并接入原状态和事件。 |
| `share-element` / `snapshot` | 使用 Web View Transition、Canvas 或业务截图方案；不具备微信同名宿主语义。 |
| `grid-view` / `grid-item` / `list-view` / `list-item` | 业务列表或网格组件，并接入原数据、稳定 key 和真实 ID；CSS Grid、Flex 或普通列表只提供简单布局，不具备原组件语义。 |
| `section-list`（RN 扩展组件） | 当前仅支持 RN；Web 需要列表时接入 Web 组件，并隔离 RN 组件注册与依赖。 |
| `nested-scroll-header` / `nested-scroll-body` / `draggable-sheet` | 使用 Web-only 滚动协调或抽屉组件，并验证触摸和页面滚动冲突。 |
| `navigation-bar` | 使用 Mpx Web 路由、页面配置或 Web-only 导航组件。 |
| `custom-wrapper` | Web 没有微信原生自定义组件更新边界语义；使用普通容器并按 Web 渲染性能优化。 |
