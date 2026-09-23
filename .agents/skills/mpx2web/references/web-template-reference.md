# Mpx2Web 模板差异参考

本文只记录 Mpx 输出 Web 时需要核对的模板差异、内建组件边界和降级方案；通用语法沿用输入项目与 Mpx 文档。

## 目录

- [事件处理](#事件处理)
- [i18n 国际化](#i18n-国际化)
- [Web 原生标签](#web-原生标签)
- [Web 样式差异](#web-样式差异)
- [Vue 组件接入](#vue-组件接入)
- [Web 模板编译限制](#web-模板编译限制)
- [Web 内建组件](#web-内建组件)
- [Web 组件降级](#web-组件降级)

---

## 事件处理

事件绑定与传参沿用 Mpx 通用语法。Web 适配只需关注以下差异：

- 绑定的处理器必须是已声明的组件实例方法，并保留原业务逻辑；动态绑定值应为方法名字符串，不能是 `{{true}}` 或函数对象。条件判断放在处理方法中，原有 `catch` 拦截行为应保留。
- Web 不支持直接绑定 WXS 响应事件。需要保留小程序 WXS 路径时，使用平台隔离，为 Web 提供等效实例方法；不要将小程序 WXS 当作脚本中的 `this.tool` 调用。
- 自定义事件的 `bubbles`、`composed`、`capturePhase` 在 Web 不生效，跨层通知见[脚本参考](./web-script-reference.md#triggerevent-的传播选项)。
- Web 不支持 `mut-bind` 的互斥事件绑定，也不会将 `mark:*` 的值放入 `event.mark`。用到时保留小程序写法，在 Web 分支分别实现需要的事件处理和数据传递。
- 只在使用自定义 `wx:model-filter` 时核对：当前 Web 不会执行自定义过滤方法，可能把方法本身写入绑定值；Web 侧改为从输入事件取值、调用原过滤方法再更新字段。普通 `wx:model` 和内建 `trim` 保持不变。

例如，保留微信 WXS 绑定，仅为 Web 切换处理器；`onSliderClick` 需实现原有交互：

```html
<view
  bindtap@wx="{{tool.onSliderClick}}"
  @tap@web="onSliderClick"
/>
```

涉及拖动时，保持手势状态按实例隔离、取消时正确收尾，并避免拖动触发误点击或吞掉后续正常点击；在目标浏览器验证原有交互，不限定某套手势实现。

---

## i18n 国际化

Web 输出支持 Mpx i18n。使用前需要在 `MpxWebpackPlugin` 中配置 `i18n` 的 `locale`、`messages` 或 `messagesPath`。

| 场景 | 可用函数 | 使用约束 |
| --- | --- | --- |
| 选项式 API | `$t`、`$tc`、`$te`、`$tm`、`$d`、`$n` | 模板中直接使用；脚本中通过组件实例调用，具体方法以项目安装的 Vue i18n 版本为准 |
| 组合式 API | `t`、`te`、`tm`、`d`、`n` | 在 `setup` 顶层调用 `useI18n()`，将所需方法暴露给模板；复数翻译使用 `t` 的复数参数，不使用 `tc` |

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

Web 的 `useI18n` 直接来自 `vue-i18n-bridge`。当前验证版本 9.14.1 的组合式接口没有 `tc`，但支持 `d` / `n`；日期与数字格式需配置对应格式选项。Web 模板允许将 `t` 改名后暴露，例如 `return { translate: t }`。通用模板另需核对其他目标端的编译限制，不将跨端命名建议当作 Web 禁令。

---

## Web 原生标签

Web 输出可使用 HTML / SVG 原生标签承载 Web-only 能力，例如 `<canvas>`、`<svg>`、`<audio>`、`<iframe>` 或业务 H5 容器节点。原生标签属于 Web-only 内容时，应与通用模板隔离，避免通用构建解析到浏览器专属节点。

不要仅凭标签名判断最终产物是否为原生 DOM。部分 HTML 同名标签会按 Mpx 基础组件语义编译，例如 `<video>`、`<button>`、`<input>`、`<form>` 会使用对应的 Web 内建组件；需要直接操作原生 DOM 或接入 H5 SDK 时，先核对编译产物，必要时使用无冲突的容器标签或 Web-only Vue 组件封装。

---

## Web 样式差异

- Web 的 `rpx` 默认按 `750rpx = 100vw` 换算，可通过 `webConfig.transRpxFn`（自包含的普通函数表达式）自定义，移动端需在 HTML 中配置 viewport。
- `view`、`image` 等基础标签在 Web 编译后可能变化，样式应使用稳定的类选择器。
- 微信组件默认的样式隔离不会自动带到 Web。只有实际出现组件样式互相影响时，单个组件可用 `<style scoped>`；需要按文件范围统一隔离时，再用构建期 `autoScopeRules` 的 `include` / `exclude` 选取文件。
- `externalClasses`：默认转换 `custom-class`、`i-class`。使用其它外部类名时，在实际构建配置的 Mpx 插件 `externalClasses` 数组中加入该名称（Mpx CLI 项目为 `mpx.config.js` 的 `pluginOptions.mpx.plugin.externalClasses`），同时保留已有名称；组件声明、调用方属性和模板占位类也须同名。

---

## Vue 组件接入

Vue 组件的兼容版本与 Web 专属依赖隔离见[主 Skill](../SKILL.md#vue-组件接入)。

---

## Web 模板编译限制

以下限制由 Web 模板编译链路决定：

- 单根要求针对最终 Vue 模板，不等于所有 `.mpx` 源模板必须单根。微信源码输出 Web 时，普通页面和未启用虚拟宿主的组件会由编译器注入根容器，可容纳多个并列节点；不要默认再添加包裹节点，以免改变布局或滚动结构。
- `.mpx` 文件中的 `<template>` 内容必须内联，暂不支持通过 `<template src="...">` 引入外部模板内容。
- Web 输出暂不支持 `<template lang="...">` 模板预处理语言。
- 具名模板 `<template name="...">` 的定义体必须只有一个元素根节点；多根时使用 `view` 或其它合适节点包裹。
- Web 子组件命中 `autoVirtualHostRules`、实际按虚拟宿主编译时，不再注入普通组件根容器，模板必须只有一个真实根节点；多个根元素会在编译期报错。

组件内可以声明具名模板。Web 编译器会把本地 `<template name="...">` 编译为内部模板组件；“不支持组件内声明模板”不是当前能力限制，但定义体仍受上述单根约束。

---

## Web 内建组件

以下属性、事件表列出已确认可用的能力；不支持或有限制的能力在对应组件下单列。

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
| refresher-default-style | string | `'black'` | 设置下拉刷新默认样式，支持 `black`、`white` |
| refresher-background | string | `''` | 设置自定义下拉刷新背景颜色 |
| refresher-triggered | boolean | `false` | 设置当前下拉刷新状态,true 表示已触发 |

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
| controls | boolean | `true` | 初始是否显示默认播放控件 |
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

不可靠：动态修改 `controls` 可能报错，`bindcontrolstoggle` 不能作为有效的 `{show}` 通知。初始 `controls=false` 时也不会显示 `poster` 封面。自动播放、行内播放和全屏受浏览器策略限制，部分设备要求静音或用户手势。

### web-view

加载 Web 页面；消息接收能力见下表。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string |  | iframe 页面地址；配置 `webviewConfig.hostWhitelists` 后按名单校验来源 |

#### 事件

| 事件名      | 说明                                |
| ----------- | ----------------------------------- |
| bindmessage | iframe 页面通过 postMessage 向容器传递数据 |
| bindload    | 转发 iframe 的 `load` 事件，不保证业务页面内容成功可用 |
| binderror   | 空地址或来源白名单拒绝时触发；不覆盖网络、HTTP 或嵌入策略错误 |

---

## Web 组件降级

下表记录当前没有 Web 实现的组件及可用方案方向。

| 组件 | Web 侧处理 |
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

`canvas` 在 Web 下可作为原生 `<canvas>` 使用；复杂场景应结合 Web Canvas API 或业务封装处理。
