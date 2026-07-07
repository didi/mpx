# 跨端输出 RN 样式能力参考

本文档详细描述了 Mpx 跨端输出 RN 的样式支持情况。

## 目录

- [样式的定义与使用](#样式的定义与使用)
  - [样式编写方式](#样式编写方式)
  - [类名和样式绑定](#类名和样式绑定)
- [样式能力支持情况](#样式能力支持情况)
  - [选择器支持](#选择器支持)
  - [样式单位与转换](#样式单位与转换)
  - [颜色值支持](#颜色值支持)
  - [文本样式继承](#文本样式继承)
  - [简写属性支持](#简写属性支持)
  - [CSS 变量与函数](#css-变量与函数)
  - [媒体查询](#媒体查询)
  - [动画支持](#动画支持)
  - [背景图支持](#背景图支持)
- [样式属性支持详情](#样式属性支持详情)
  - [布局属性 (Flexbox)](#布局属性-flexbox)
  - [定位与层级](#定位与层级)
  - [尺寸与溢出](#尺寸与溢出)
  - [间距 (Margin/Padding)](#间距-marginpadding)
  - [边框 (Border)](#边框-border)
  - [背景 (Background)](#背景-background)
  - [文本与字体](#文本与字体)
  - [变换 (Transform)](#变换-transform)
  - [阴影与不透明度](#阴影与不透明度)
  - [动画 (Animation)](#动画-animation)
  - [其他属性](#其他属性)
  - [不支持的属性](#不支持的属性)

---

## 样式的定义与使用

### 样式编写方式

Mpx 在 RN 平台支持使用标准的 CSS 语法编写样式，与小程序平台保持一致。开发者无需关心底层实现，只需按照 CSS 规范编写样式代码即可。

```html
<style>
  .container {
    width: 750rpx;
    padding: 20rpx;
    background-color: #fff;
  }
</style>
```

框架会自动处理样式的平台适配和转换。

### 类名和样式绑定

Mpx 在 RN 平台完整支持静态和动态的类名及样式绑定，与小程序平台保持一致。

#### 静态类名和样式

可以直接使用 `class` 和 `style` 属性：

```html
<template>
  <view class="container" style="color: red;"> 静态样式 </view>
</template>
```

#### 动态类名绑定（wx:class）

`wx:class` 支持对象语法和数组语法，可以与静态 `class` 属性同时使用。

**对象语法：**

```html
<view
  class="outer"
  wx:class="{{ {active: isActive, disabled: isDisabled} }}"
></view>
```

**数组语法：**

```html
<view class="outer" wx:class="{{ ['active', 'primary'] }}"></view>
```

#### 动态样式绑定（wx:style）

`wx:style` 支持对象语法和数组语法，可以与静态 `style` 属性同时使用。

**对象语法：**

```html
<view
  style="color: red;"
  wx:style="{{ {fontSize: '16px', fontWeight: 'bold'} }}"
></view>
```

**数组语法：**

```html
<view wx:style="{{ [baseStyle, activeStyle] }}"></view>
```

**注意事项：**

- 样式名必须使用驼峰写法（如 `fontSize`），不允许使用横杠写法（如 `font-size`），横杠写法会导致微信小程序模板编译报错
- `wx:class` 和 `wx:style` 在运行时动态计算，性能优良
- 支持与静态 `class` 和 `style` 属性同时使用，会自动合并

---

## 样式能力支持情况

### 选择器支持

RN 环境下支持的选择器范围有限，主要是**单类选择器**、`page` 选择器和 `:host` 选择器。

✅ **支持的选择器：**

```css
.container {
}
.button {
}
.text-primary {
}
.classA,
.classB {
} /* 逗号组合支持 */
page {
}
:host {
}
```

❌ **不支持的选择器：**

```css
view,
text {
} /* 标签选择器 */
.container .item {
} /* 后代选择器 */
.list > .item {
} /* 子选择器 */
.item + .item {
} /* 相邻选择器 */
.button:hover {
} /* 伪类选择器 */
.text::before {
} /* 伪元素选择器 */
[type="text"] {
} /* 属性选择器 */
.button.primary {
} /* 组合选择器 */
```

### 样式单位与转换

Mpx 在 RN 平台支持多种 CSS 单位，并在运行时进行转换。

#### 基础单位

| 单位 | 说明 | 转换规则 |
| --- | --- | --- |
| `px` | 绝对像素 | 直接转换为 RN 的无单位数值 |
| `rpx` | 响应式像素 | `rpx值 × 屏幕宽度 / 750` |
| `%` | 百分比 | 转换为字符串形式（如 `'50%'`），由 RN 原生支持或框架处理 |
| `vw` | 视口宽度百分比 | `vw值 × 屏幕宽度 / 100` |
| `vh` | 视口高度百分比 | `vh值 × 屏幕高度 / 100` |
| `hairlineWidth` | RN 特有极细线 | `StyleSheet.hairlineWidth` |

#### 样式计算基准与自定义

`rpx`、`vw`、`vh` 的计算默认基于运行时的 `screen.width` 和 `screen.height`。

同时支持通过运行时配置 `Mpx.config.rnConfig.customDimensions` 自定义样式计算基准：

```javascript
import mpx from "@mpxjs/core"

mpx.config.rnConfig = Object.assign({}, mpx.config.rnConfig, {
  customDimensions(dimensions) {
    const nextWindow = Object.assign({}, dimensions.window, {
      height: dimensions.window.height - 44
    })
    const nextScreen = Object.assign({}, dimensions.screen, {
      height: dimensions.screen.height - 44
    })
    return {
      window: nextWindow,
      screen: nextScreen
    }
  }
})
```

配置生效后，`rpx`、`vw`、`vh` 会按自定义后的 `screen` 宽高进行计算。

#### 百分比计算规则

跨端输出 RN 时， 部分百分比单位原生支持，而部分百分比单位则由框架进行计算抹平实现，详情如下：

1.  **原生支持（基于父节点宽高）**： `width`、`height`、`left`、`right`、`top`、`bottom`、`margin`、`padding` 等属性。

2.  **文本字号相关百分比**：`font-size` 百分比在文本样式透传阶段解析，基准优先使用继承文本样式中的 `font-size`，若不存在则使用默认字号 `16`；`line-height` 百分比和 unit-less 倍率会保留到最终 `text` 节点消费阶段，按该节点合并后的 `font-size` 解析。

    ```html
    <view style="font-size: 16px;">
      <text style="font-size: 120%;">文本内容</text>
    </view>
    ```

3.  **基于自身宽高计算**： `translateX`、`translateY`、`border-radius` 的百分比都是根据自身宽高来计算的（首次渲染不展示，在 `onLayout` 后计算生效）。其中 `translateX` / `translateY` 的百分比计算依赖 class 样式的编译转换；内联 `style` 中的字符串 transform 不会触发该计算。

4.  **calc() 函数内的百分比**：在 `calc()` 函数表达式内使用百分比时，需要开发者设置 `parent-width` 或 `parent-height` 属性。

### 颜色值支持

支持以下颜色值格式：

- **Named Color**: 预定义颜色名称（如 `red`、`blue`）
- **Hex Color**: 十六进制颜色（如 `#090`、`#009900`）
- **RGB/RGBA**: `rgb(34, 12, 64)`、`rgba(34, 12, 64, 0.6)`
- **HSL/HSLA**: `hsl(30, 100%, 50%)`
- **HWB**: `hwb(90 10% 10%)`
- **Color Ints**: RN 特有格式（如 `0xff00ff00`）

### 文本样式继承

Mpx 框架抹平了平台差异，使 `view` 等容器节点可以直接包裹文本，并向 Mpx 子树中的文本组件透传文本样式。

**继承规则：**

1.  **容器 -> text 继承**：容器节点上的文本样式会透传到其 Mpx 子树中的 `text` 节点，中间存在非 text 的 Mpx 组件时不会中断。
2.  **text 嵌套继承**：父级 `text` 节点的文本样式可以被嵌套的子 `text` 节点继承。
3.  **自动包裹**：`view` 节点直接包裹裸文本时，Mpx 编译时会自动添加 `text` 节点包裹文本。

**文本样式透传范围：**

- Mpx 会从容器的样式中拆分文本样式并透传到子树中的 `text` 节点，包括：`color`、`font*`、`text*`、`letterSpacing`、`lineHeight`、`includeFontPadding`、`writingDirection`
- 透传给 `text` 的祖先文本样式已经在祖先节点处理完成，不会在子 `text` 节点重复执行 CSS 变量、`calc()`、`font` 简写等运行时转换；但相对 `lineHeight` 会保留到最终文本节点，按该节点合并后的 `fontSize` 计算。

**文本属性迁移：**

- `numberOfLines`、`ellipsizeMode` 不是继承属性，只是 RN 适配中的迁移属性。
- Mpx 会将容器上的 `numberOfLines`、`ellipsizeMode` 迁移到最近的 `text` 节点；被该 `text` 消费后，不会继续向更深层的子 `text` 继承。
- `allowFontScaling` 不参与文本样式继承或属性迁移，应通过 `mpx.config.rnConfig.allowFontScaling` 设置全局默认值；组件显式设置的 `allowFontScaling` 优先。

**注意事项：**

出于性能考虑，文本样式和文本属性透传按需启用。如果容器后续可能通过动态样式或动态属性才出现文本样式、`numberOfLines`、`ellipsizeMode`，需要在首次渲染时显式声明 `enable-text-pass-through`。

多字号嵌套 `text` 混排时，RN 实际行盒渲染以首个子 `Text` 元素的 `lineHeight` 作为整行行高基准；此类场景须取消内层片段的 `line-height`，只在外层 `text` 显式声明整行最大行高。

```html
<view enable-text-pass-through wx:style="{{ textStyle }}">
  <text>动态文本样式</text>
</view>
```

```js
export default {
  data: {
    textStyle: {}
  },
  methods: {
    updateTextStyle () {
      this.textStyle = {
        color: '#ff0000'
      }
    }
  }
}
```

### 简写属性支持

RN 仅原生支持部分 CSS 简写属性，Mpx 分别在**编译时**和**运行时**对其他简写属性进行增强处理，以兼容 RN。

**RN 原生支持的简写属性：** 以下属性在 RN 中原生支持，可以在 在 `class` 类样式、`style` 内联样式和 CSS 变量中使用：

- **布局**：`flex`（支持 `flex: 1` / `flex: 0` 等）
- **间距**：`margin`、`padding`（**仅支持单值语法**，如 `margin: 10px`）
- **边框**：`border-width`、`border-color`、`border-radius`（**仅支持单值语法**，如 `border-width: 1px`）
- **阴影**：`box-shadow`（RN 0.76+ 原生支持，如 `box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1)`）
- **变换**：`transform`、`transform-origin`（支持字符串多值语法，如 `transform: 'rotate(45deg) scale(2)'`）

**Mpx 编译和运行时增强的简写属性：** 以下简写属性由 Mpx 在编译和运行时自动展开，支持在 `class` 类样式、`style` 内联样式和 CSS 变量中使用：

部分简写属性展开时会按照 CSS 规范根据值类型解析，合法值顺序与 CSS 规范保持一致，如 `border`、`text-shadow` 等；具有顺序语义的四值语法、长度组等仍按 CSS 顺序解析，如 `padding`、`margin` 等。

- **过渡简写**：`transition`
  - 在运行时将 `transition` 字符串简写解析为动画配置，如 `transition: opacity 0.3s ease` → 解析出 `property`、`duration`、`timingFunction` 等参数
  - 仅 `view` 组件支持；`transition-property` 不支持 `all`，需显式指定属性名；不支持 `step-start`、`step-end`、`steps()` 等阶梯时间函数
- **间距多值语法**：`margin`、`padding` 的 2-4 值语法
  - 如 `margin: 10px 20px` → `marginTop: 10, marginRight: 20, marginBottom: 10, marginLeft: 20`
  - 单值语法 RN 原生支持，运行时不展开
- **行列间距简写**：`gap`
  - 支持单值和双值语法，双值按 `row-gap column-gap` 展开，如 `gap: 10px 20px` → `rowGap: 10, columnGap: 20`
  - 百分比值会在运行时换算为数值，`row-gap` 基于 `parent-height`，`column-gap` 基于 `parent-width`
- **定位偏移简写**：`inset`
  - 单值语法 RN 0.74+ 原生支持，Mpx 保留 `inset` 单值写法
  - 2-4 值语法会展开为 `top` / `right` / `bottom` / `left`，如 `inset: 10px 20px` → `top: 10, right: 20, bottom: 10, left: 20`
- **边框多值语法**：`border-width`、`border-color`、`border-radius` 的 2-4 值语法
  - 如 `border-width: 1px 2px` → `borderTopWidth: 1, borderRightWidth: 2, borderBottomWidth: 1, borderLeftWidth: 2`
  - 单值语法 RN 原生支持，运行时不展开
- **边框简写**：`border`、`border-top`、`border-right`、`border-bottom`、`border-left`
  - 如 `border: 1px solid red` → `borderWidth: 1, borderStyle: 'solid', borderColor: 'red'`
  - 单边 `border-*` 中的 `<border-style>` 槽位会展开为 `borderStyle`（RN 不支持单边 `border-*-style`，统一作用于四边）
  - `border: none` / `border: 1px none red` 会先保留 `borderStyle: 'none'`，最终在运行时统一转换为 `borderWidth: 0`
- **外轮廓简写**：`outline`
  - 按值类型无序展开为 `outline-width` / `outline-style` / `outline-color`，合法值不强制书写顺序
  - `outline: none` / `outline: 0` / `outline: 1px none red` 会最终在运行时转换为 `outlineWidth: 0`
- **布局简写**：`flex`、`flex-flow`
  - `flex: 1` → `flexGrow: 1, flexShrink: 1, flexBasis: 0`；`flex: 1 1 auto` → `flexGrow: 1, flexShrink: 1, flexBasis: 'auto'`
  - `flex: none` → `flexGrow: 0, flexShrink: 0`；`flex: initial` → `flexGrow: 0, flexShrink: 1`
  - `flex-flow: row wrap` → `flexDirection: 'row', flexWrap: 'wrap'`
- **背景简写**：`background`、`background-size`、`background-position`（仅 `view` 支持）
  - `background: url(bg.png) no-repeat center/cover #fff` → 展开为 `backgroundImage`、`backgroundRepeat`、`backgroundPosition`、`backgroundSize`、`backgroundColor`
  - `background-size` 多值字符串自动转换为数组格式，支持 `cover`、`contain`、`auto` 及长度值
  - `background-position` 多值字符串自动转换为数组格式，支持关键字（`center`、`left`、`right`、`top`、`bottom`）、百分比及长度值
- **阴影简写**：`text-shadow`
  - 如 `text-shadow: 1px 2px 3px red` → `textShadowOffset`、`textShadowRadius`、`textShadowColor`
  - 颜色可写在长度组前后任意位置（如 `text-shadow: red 1px 2px`）
  - `<offset-x>` 与 `<offset-y>` 必填；缺省 `<offset-y>` 时会发出 warn 并按 `0` 兜底
- **装饰简写**：`text-decoration`
  - 如 `text-decoration: line-through solid red` → `textDecorationLine`、`textDecorationStyle`、`textDecorationColor`
  - `textDecorationLine` 支持多值组合 `underline line-through`
- **字体简写**：`font`
  - 展开为字体相关长属性，`font-size` 与 `font-family` 必填，如 `font: italic bold 16px / 1.5 Arial`
  - `font-family` 多字体 fallback 会自动取首值并去除引号

**使用限制：**
- ❌ **`border-style` 多值语法**：`border-style` 不支持 2-4 值语法（如 `border-style: solid dashed`），因为 RN 环境中不支持分别设置各方向的 `borderStyle`，仅支持统一设置单值（如 `border-style: solid`）。
- ❌ **单边 `border-*-style` 长属性**：`border-top-style` / `border-right-style` / `border-bottom-style` / `border-left-style` 直接书写会被编译期拦截报错；如需使用，请改用 `border-style` 或在单边 `border-*` 简写中给出 style 槽位（会展开为 `border-style`）。
- ❌ **`border-width` 枚举值**：`border-width` 不支持 `thin` / `medium` / `thick`，仅支持数值单位和 `hairlineWidth`。
- ⚠️ **`border` 简写中含 `none`**：根据 CSS 规范 `border-style: none` 等价于无边框；Mpx 会先按普通简写保留宽度、颜色与 `borderStyle: 'none'`，最终在运行时统一清除边框。
- ⚠️ **简写属性与展开属性的覆盖顺序**：在 `class` 类样式中，简写属性与展开属性的覆盖顺序按照样式定义的顺序决定，后定义的覆盖先定义的，与 CSS 规范一致；但在 `style` 内联样式中，Mpx 在运行时合并样式后无法保留属性的定义顺序信息，因此采用**展开属性优先**的策略，即简写属性无法覆盖已有的展开属性。例如在 `style` 中同时存在 `margin: 10px` 和 `margin-top: 20px` 时，无论书写顺序如何，`margin-top` 始终为 `20px`。

### CSS 变量与函数

#### CSS 变量 (Custom Properties)

支持定义和使用 CSS 变量，支持 fallback 值。

```css
:root {
  --main-color: #3498db;
}
.comp {
  color: var(--main-color, blue);
}
```

**自动检测与 enable-var：** 框架会自动检测样式中的 CSS 变量使用。如果样式中一开始不存在变量定义或使用，但后续需要动态添加（如通过 `wx:style`），建议使用 `enable-var` 属性预先声明，以确保运行时正确处理变量。

```html
<template>
  <!-- 动态添加 CSS 变量，需预先声明 -->
  <view enable-var wx:style="{{ dynamicStyle }}">
    <text>Dynamic Variable</text>
  </view>
</template>

<script>
  // ...
  this.dynamicStyle = {
    "--text-color": "red",
    color: "var(--text-color)"
  }
</script>
```

#### calc() 函数

支持四则运算（`+`、`-`、`*`、`/`），支持混合单位。

```css
width: calc(100% - 20px);
font-size: calc(16px / 2);
```

#### env() 函数

用于适配设备安全区域。

```css
padding-top: env(safe-area-inset-top, 20px);
```

支持的环境变量：`safe-area-inset-top`、`safe-area-inset-right`、`safe-area-inset-bottom`、`safe-area-inset-left`。

### 媒体查询

Mpx 在 RN 平台支持 `@media` 规则，但能力受限。

**支持特性：**

- 媒体类型：可书写 `screen`
- 媒体特性：`min-width`、`max-width`
- 逻辑运算符：`and`

**限制：**

- 媒体查询中的宽度条件仅支持 `px` 单位，并基于运行时 `screen.width` 判断。
- 不支持 `width` 精确匹配、`height`、`orientation`、`all` 等其他特性。

### 动画支持

Mpx 在 RN 平台支持以下动画方式：

- **CSS Transition**：支持过渡动画，推荐使用。
- **Animation API**：支持小程序风格的 `wx.createAnimation` API，需结合 `animation` 属性（组件属性，并非样式属性）使用。
- **不支持**：CSS Keyframes (`@keyframes`) 动画。

**使用限制：**

- 仅 `view` 组件支持动画相关属性。

**自动检测与 enable-animation：** 框架会自动检测样式和属性中的动画定义来确定动画类型（如检测到 `transition` 样式或 `animation` 属性）。如果样式中一开始不存在动画定义，但后续需要动态添加（如通过 `wx:style` 动态添加 `transition`），建议使用 `enable-animation` 属性预先声明动画类型。

```html
<template>
  <!-- 场景：动态添加 transition 样式，需预先声明 -->
  <view enable-animation="transition" wx:style="{{ dynamicStyle }}" />
</template>

<script>
  // ...
  this.dynamicStyle = {
    transition: "opacity 0.3s ease",
    opacity: 0.5
  }
</script>
```

### 背景图支持

Mpx 在 RN 平台支持 CSS 背景图及渐变背景，框架会自动处理样式转换。

**支持特性：**

- **背景颜色**：RN 原生支持 `background-color`。
- **背景图**：支持 `background-image: url()` 引用图片，也支持 `background-image: none` 清空背景图。
- **渐变背景**：支持 `background-image: linear-gradient()` 线性渐变。
- **相关属性**：完整支持 `background-size` 和 `background-position`。

**限制与注意事项：**

- **组件限制**：仅 `view` 组件支持除 `background-color` 外的背景相关属性。
- **简写属性**：`background` 简写属性支持 `<background-color>`、`<background-image>`、`<background-repeat>`，以及用 `/` 分隔的 `<background-position> / <background-size>` 语法。
- **背景重复**：`background-repeat` 仅支持 `no-repeat`。
- **多重背景**：不支持多重背景。
- **渐变类型**：仅支持 `linear-gradient()` 线性渐变，不支持 `radial-gradient()`、`conic-gradient()` 等其他渐变类型。
- **渐变颜色值**：避免在渐变中使用 `transparent` 关键字，RN 中 `transparent` 等价于 `rgba(0,0,0,0)`，会导致渐变过渡中出现灰色过渡带。应使用目标颜色的透明版本替代，如 `rgba(255,0,0,0)` 代替 `transparent`。
- **渐变位置百分比**：颜色停靠点仅支持百分比单位（如 `red 10%`），不支持 `px` 等长度单位。
- **渐变方向**：支持角度值（如 `45deg`）和 `to` 关键字方向（如 `to right`），未指定方向时默认 `180deg`（从上到下）。

**自动检测与 enable-background：** 框架会自动检测样式中的背景相关属性（如 `background-image`、`background-size` 等）。如果样式中一开始不存在背景定义，但后续需要动态添加（如通过 `wx:style`），建议使用 `enable-background` 属性预先声明，以确保运行时正确处理背景。

```html
<template>
  <!-- 动态添加背景图片，需预先声明 -->
  <view enable-background wx:style="{{ dynamicStyle }}">
    <text>Dynamic Background</text>
  </view>
</template>

<script>
  // ...
  this.dynamicStyle = {
    backgroundImage: "url(...)"
  }
</script>
```

---

## 样式属性支持详情

### 布局属性 (Flexbox)

| 属性 | 值类型 | 默认值 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| `display` | `flex` \| `none` | `flex` | RN 仅支持 Flex 布局。`display: none` 在 RN 中可能引发异常表现，不建议使用，推荐通过 `wx:if` 条件渲染或设置 `width: 0; height: 0; overflow: hidden` 等方式隐藏元素 | `display: flex` |
| `flex-direction` | `row` \| `column` \| `row-reverse` \| `column-reverse` | `column` | 主轴方向。RN 原生默认值为 `column`，但 Mpx 输出 RN 在显式声明 `display: flex` 且未声明 `flex-direction` 时会自动补充 `flex-direction: row` 来对齐小程序 / Web；需要纵向布局时请显式写 `flex-direction: column` | `flex-direction: row` 水平排列子元素 |
| `flex-wrap` | `nowrap` \| `wrap` \| `wrap-reverse` | `nowrap` | 换行控制 | `flex-wrap: wrap` 子元素超出时自动换行 |
| `justify-content` | `flex-start` \| `flex-end` \| `center` \| `space-between` \| `space-around` \| `space-evenly` | `flex-start` | 主轴对齐 | `justify-content: space-between` 两端对齐；`justify-content: center` 居中 |
| `align-items` | `flex-start` \| `flex-end` \| `center` \| `stretch` \| `baseline` | `stretch` | 交叉轴对齐 | `align-items: center` 垂直居中子元素 |
| `align-content` | `flex-start` \| `flex-end` \| `center` \| `stretch` \| `space-between` \| `space-around` \| `space-evenly` | `flex-start` | 多行交叉轴对齐 | `flex-wrap: wrap; align-content: space-between` 多行均匀分布 |
| `align-self` | `auto` \| `flex-start` \| `flex-end` \| `center` \| `stretch` \| `baseline` | `auto` | 单个元素交叉轴对齐 | `align-self: flex-end` 单独将某子元素对齐到底部 |
| `flex` | `none` \| `auto` \| `initial` \| `<flex-grow>` \| `<flex-grow> <flex-shrink>` \| `<flex-grow> <flex-basis>` \| `<flex-grow> <flex-shrink> <flex-basis>` | - | 简写属性 | `flex: 1` 填满剩余空间；`flex: 1 1 auto` 可伸缩且基于内容大小 |
| `flex-grow` | `number` | `0` | 放大比例 | `flex-grow: 1` 等比例分配剩余空间 |
| `flex-shrink` | `number` | `0` | 收缩比例 | `flex-shrink: 1` 空间不足时允许收缩 |
| `flex-basis` | `auto` \| `length` \| `%` | `auto` | 初始大小 | `flex-basis: 200rpx` 初始宽度 200rpx |
| `flex-flow` | `<flex-direction> <flex-wrap>` | - | 简写属性，运行时自动展开为 `flex-direction` 和 `flex-wrap` | `flex-flow: row wrap` |
| `gap` / `row-gap` / `column-gap` | `length` \| `%` | - | 行列间距；`gap` 支持单值和双值，双值按 `row-gap column-gap` 展开；百分比运行时换算为数值，`row-gap` 基于 `parent-height`，`column-gap` 基于 `parent-width` | `gap: 20rpx`；`gap: 10% 20%`；`row-gap: 10rpx; column-gap: 20rpx` |

### 定位与层级

| 属性 | 值类型 | 默认值 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| `position` | `relative` \| `absolute` \| `fixed` | `relative` | 不支持 `sticky` | `position: absolute; top: 0; left: 0` 绝对定位到左上角 |
| `top` / `right` / `bottom` / `left` | `length` \| `%` | - | 偏移量 | `top: 20rpx`；`left: 50%` |
| `inset` | `length` \| `%` | - | 定位偏移简写；单值透传给 RN，2-4 值展开为 `top` / `right` / `bottom` / `left` | `inset: 0`；`inset: 10rpx 20rpx` |
| `z-index` | `number` | - | 层级控制 | `z-index: 10` 提升元素层级使其覆盖在其他元素之上 |

### 尺寸与溢出

| 属性 | 值类型 | 默认值 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| `width` / `height` | `auto` \| `length` \| `%` | `auto` | 宽高 | `width: 750rpx; height: 200rpx`；`width: 100%` |
| `min-width` / `min-height` | `length` \| `%` | - | 最小尺寸 | `min-height: 100rpx` 保证最小高度 |
| `max-width` / `max-height` | `length` \| `%` | - | 最大尺寸 | `max-width: 600rpx` 限制最大宽度 |
| `aspect-ratio` | `auto` \| `number` \| `width / height` | - | 宽高比 | `aspect-ratio: 16 / 9` 保持 16:9 比例；`aspect-ratio: 1` 正方形 |
| `box-sizing` | `border-box` \| `content-box` | `content-box` | 盒模型，RN 原始默认值为 `border-box`，Mpx 中为了跨端表现一致统一默认值为 `content-box`，可通过 `mpx.config.rnConfig.defaultBoxSizing` 配置默认值 | `box-sizing: border-box` 宽高包含边框和内边距 |
| `overflow` | `visible` \| `hidden` \| `scroll` | `visible` | 溢出控制 | `overflow: hidden` 裁剪超出内容；`overflow: scroll` 允许滚动 |

### 间距 (Margin/Padding)

| 属性        | 值类型                    | 说明                   | 示例 |
| ----------- | ------------------------- | ---------------------- | --- |
| `margin`    | `auto` \| `length` \| `%` | 外边距简写（支持多值） | `margin: 20rpx`；`margin: 10rpx 20rpx`（上下 10 左右 20）；`margin: auto` 水平居中 |
| `margin-*`  | `auto` \| `length` \| `%` | 单边外边距             | `margin-top: 20rpx; margin-left: 30rpx` |
| `padding`   | `length` \| `%`           | 内边距简写（支持多值） | `padding: 20rpx`；`padding: 10rpx 20rpx 30rpx 40rpx` |
| `padding-*` | `length` \| `%`           | 单边内边距             | `padding-bottom: 40rpx` |

### 边框 (Border)

| 属性 | 值类型 | 说明 | 示例 |
| --- | --- | --- | --- |
| `border` | `width \|\| style \|\| color` | 边框简写 | `border: 1px solid #e5e5e5` |
| `border-width` | `length` | 边框宽度（支持多值） | `border-width: 1px`；`border-width: 1px 2px` |
| `border-color` | `color` | 边框颜色（支持多值） | `border-color: #ccc`；`border-color: red blue` |
| `border-style` | `solid` \| `dotted` \| `dashed` \| `none` | 边框样式（不支持单边设置）；`none` 会在运行时转换为 `border-width: 0` | `border-style: dashed`；`border-style: none` |
| `border-radius` | `length` \| `%` | 圆角半径（支持多值） | `border-radius: 16rpx`；`border-radius: 50%` 圆形 |
| `border-*-radius` | `length` \| `%` | 单角圆角 | `border-top-left-radius: 20rpx; border-top-right-radius: 20rpx` 顶部圆角 |
| `outline` | `width \|\| style \|\| color` | 外轮廓简写，按值类型无序展开为 `outline-width` / `outline-style` / `outline-color`；缺省 style 时补 `none`，最终在运行时清除 outline；RN 0.76+ 生效，低版本忽略 | `outline: 1px solid red`；`outline: none` |
| `outline-style` | `solid` \| `dotted` \| `dashed` \| `none` | 外轮廓样式；`none` 会在运行时转换为 `outline-width: 0` | `outline-style: dashed`；`outline-style: none` |

### 背景 (Background)

**注意**：仅 `view` 组件支持背景相关属性（除 `background-color` 外）。

| 属性 | 值类型 | 说明 | 示例 |
| --- | --- | --- | --- |
| `background` | `<background-color>` \| `<background-image>` \| `<background-repeat>` \| `<background-position>` / `<background-size>` | 背景简写，支持用 `/` 分隔的背景位置和尺寸 | `background: #f5f5f5`；`background: url(https://example.com/bg.png) no-repeat center/cover` |
| `background-color` | `color` | 背景色 | `background-color: #fff`；`background-color: rgba(0, 0, 0, 0.5)` 半透明黑色 |
| `background-image` | `url()` \| `linear-gradient()` \| `none` | 背景图/渐变 | `background-image: url(https://example.com/bg.png)`；`background-image: linear-gradient(to bottom, #ff0000, #0000ff)`；`background-image: none` |
| `background-size` | `cover` \| `contain` \| `auto` \| `length` \| `%` | 背景尺寸 | `background-size: cover` 覆盖填充；`background-size: 200rpx 100rpx` |
| `background-repeat` | `no-repeat` | 仅支持不重复 | `background-repeat: no-repeat` |
| `background-position` | `center` \| `left` \| `right` \| `top` \| `bottom` \| `number` \| `%` | 背景位置 | `background-position: center`；`background-position: 50% 50%` |

### 文本与字体

**注意**：文本样式需遵循继承规则。

| 属性 | 值类型 | 默认值 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| `color` | `color` | - | 文本颜色 | `color: #333`；`color: rgba(0, 0, 0, 0.8)` |
| `font` | `[font-style] [small-caps] [font-weight] font-size [ / line-height ] font-family` | - | 字体简写，展开为字体相关长属性；`font-size` 与 `font-family` 必填，`/` 两侧可有空格 | `font: italic bold 16px / 1.5 Arial` |
| `font-family` | `string` | - | 字体（仅支持单字体），多字体 fallback 自动取首值并去除引号 | `font-family: PingFangSC-Regular` |
| `font-size` | `length` \| `%` | - | 字体大小；百分比按文本透传字号基准解析 | `font-size: 28rpx`；`font-size: 16px`；`font-size: 120%` |
| `font-weight` | `normal` \| `bold` \| `100-900` | `normal` | 字体粗细 | `font-weight: bold`；`font-weight: 500` |
| `font-style` | `normal` \| `italic` | `normal` | 字体样式 | `font-style: italic` 斜体 |
| `line-height` | `length` \| `number` \| `%` | - | 行高，纯数字值自动转换为百分比（如 `1.5` → `150%`），最终按文本节点合并后的 `font-size` 解析；运行时数值型 `lineHeight` 表示绝对行高；多字号混排需统一设置外层行高 | `line-height: 40rpx`；`line-height: 1.5` |
| `text-align` | `left` \| `right` \| `center` \| `justify` | `auto` | 文本对齐；`auto` 是 RN 默认值，不支持在用户源码中显式书写 | `text-align: center` 文本居中 |
| `vertical-align` | `auto` \| `top` \| `bottom` \| `middle` | - | 垂直对齐（Android / Harmony 支持，iOS 不支持） | `vertical-align: middle` |
| `text-decoration` | `line \|\| style \|\| color` | - | 装饰线简写；`text-decoration-style` / `text-decoration-color` 仅 iOS 按差异化样式与颜色生效；Android / Harmony 下 style 固定等效为 `solid`，color 跟随文本色；line 支持多值组合 `underline line-through` | `text-decoration: underline`；`text-decoration: line-through solid red` |
| `text-transform` | `none` \| `uppercase` \| `lowercase` \| `capitalize` | `none` | 大小写转换 | `text-transform: uppercase` 全部大写 |
| `letter-spacing` | `length` | - | 字符间距 | `letter-spacing: 2rpx` |
| `text-shadow` | `offset-x offset-y blur color` | - | 文本阴影（Mpx 增强） | `text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3)` |
| `user-select` | `auto` \| `text` \| `none` \| `contain` \| `all` | `auto` | 文本选择控制 | `user-select: none` 禁止选择文本 |
| `font-variant` | `small-caps` \| `oldstyle-nums` \| `lining-nums` \| `tabular-nums` \| `proportional-nums` | - | 字体变体，支持空格分隔的多值 | `font-variant: tabular-nums`；`font-variant: small-caps tabular-nums` |
| `direction` | `ltr` \| `rtl` \| `inherit` | `ltr` | 文本方向 | `direction: rtl` 右到左排列（适用于阿拉伯语等） |

### 变换 (Transform)

| 属性               | 值类型                                | 说明         | 示例 |
| ------------------ | ------------------------------------- | ------------ | --- |
| `transform`        | `translate` \| `scale` \| `rotate`... | 变换函数列表 | `transform: translateX(20rpx) rotate(45deg)`；`transform: scale(1.5)` 放大 1.5 倍 |
| `transform-origin` | `length` \| `%` \| `keyword`          | 变换原点     | `transform-origin: center center`；`transform-origin: 0% 0%` 以左上角为变换原点 |

**不支持**：`translateZ`, `scaleZ`, `translate3d`, `scale3d`, `rotate3d`, `matrix3d`。

### 阴影与不透明度

| 属性 | 值类型 | 说明 | 示例 |
| --- | --- | --- | --- |
| `box-shadow` | `<offset-x> <offset-y> <blur-radius> <spread-radius> <color>` | 阴影简写（依赖宿主 RN/DRN 版本原生支持） | `box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1)` |
| `opacity` | `0-1` | 不透明度 | `opacity: 0.5` 半透明；`opacity: 0` 完全透明 |

### 动画 (Animation)

**注意**：仅 `view` 组件支持动画相关属性。

| 属性 | 值类型 | 说明 | 示例 |
| --- | --- | --- | --- |
| `transition` | `property duration timing-function delay` | 过渡简写 | `transition: opacity 0.3s ease`；`transition: width 0.5s ease-in-out 0.1s` |
| `transition-property` | `string` | 过渡属性（不支持 `all`） | `transition-property: opacity, width` 指定多个过渡属性 |
| `transition-duration` | `time` | 过渡持续时间 | `transition-duration: 0.3s`；`transition-duration: 300ms` |
| `transition-delay` | `time` | 过渡延迟时间 | `transition-delay: 0.1s` 延迟 0.1 秒后开始过渡 |
| `transition-timing-function` | `linear` \| `ease` \| `ease-in` \| `ease-out` \| `ease-in-out` \| `cubic-bezier` | 过渡时间函数 | `transition-timing-function: ease-in-out`；`transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)` |

### 其他属性

| 属性 | 值类型 | 说明 | 示例 |
| --- | --- | --- | --- |
| `pointer-events` | `auto` \| `none` \| `box-none` \| `box-only` | 点击穿透控制 | `pointer-events: none` 穿透点击事件到下层元素；`pointer-events: box-none` 自身不响应但子元素可响应 |
| `backface-visibility` | `visible` \| `hidden` | 背面可见性 | `backface-visibility: hidden` 翻转时隐藏背面（常配合 `transform: rotateY(180deg)` 使用） |
| `object-fit` | `cover` \| `contain` \| `fill` \| `scale-down` | 图片填充模式 | `object-fit: cover` 裁剪填充；`object-fit: contain` 完整显示 |

### 不支持的属性

以下属性在 RN 平台不支持：

- `white-space`
- `text-overflow`
- `animation` (CSS Keyframes)
- `font-variant-caps`
- `font-variant-numeric`
- `font-variant-east-asian`
- `font-variant-alternates`
- `font-variant-ligatures`
- `caret-color`
- `float`
- `clear`

以下属性存在平台差异：

- iOS 不支持 `vertical-align`
- Android / Harmony 不支持差异化的 `text-decoration-style`、`text-decoration-color`：`text-decoration-style` 会按 `solid` 生效，`text-decoration-color` 会跟随文本色；Android / Harmony 不支持 `shadow-offset`、`shadow-opacity`、`shadow-radius`
