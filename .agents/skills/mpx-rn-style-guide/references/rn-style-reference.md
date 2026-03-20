# 跨端输出 RN 样式能力支持详情

本文档基于 RN 的原生样式能力及 Mpx 框架的增强处理机制，详细描述了 RN 平台下的样式支持情况。

## 目录

- [1. 样式的定义与使用](#1-样式的定义与使用)
  - [1.1 样式编写方式](#11-样式编写方式)
  - [1.2 类名和样式绑定](#12-类名和样式绑定)
- [2. 样式能力支持情况](#2-样式能力支持情况)
  - [2.1 选择器支持](#21-选择器支持)
  - [2.2 样式单位与转换](#22-样式单位与转换)
  - [2.3 颜色值支持](#23-颜色值支持)
  - [2.4 文本样式继承](#24-文本样式继承)
  - [2.5 简写属性支持](#25-简写属性支持)
  - [2.6 CSS 变量与函数](#26-css-变量与函数)
  - [2.7 媒体查询](#27-媒体查询)
  - [2.8 动画支持](#28-动画支持)
  - [2.9 背景图支持](#29-背景图支持)
- [3. 样式属性支持详情](#3-样式属性支持详情)
  - [3.1 布局属性 (Flexbox)](#31-布局属性-flexbox)
  - [3.2 定位与层级](#32-定位与层级)
  - [3.3 尺寸与溢出](#33-尺寸与溢出)
  - [3.4 间距 (Margin/Padding)](#34-间距-marginpadding)
  - [3.5 边框 (Border)](#35-边框-border)
  - [3.6 背景 (Background)](#36-背景-background)
  - [3.7 文本与字体](#37-文本与字体)
  - [3.8 变换 (Transform)](#38-变换-transform)
  - [3.9 阴影与不透明度](#39-阴影与不透明度)
  - [3.10 动画 (Animation)](#310-动画-animation)
  - [3.11 其他属性](#311-其他属性)
  - [3.12 不支持的属性](#312-不支持的属性)

## 1. 样式的定义与使用

### 1.1 样式编写方式

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

### 1.2 类名和样式绑定

Mpx 在 RN 平台完整支持静态和动态的类名及样式绑定，与小程序平台保持一致。

#### 静态类名和样式
可以直接使用 `class` 和 `style` 属性：

```html
<template>
  <view class="container" style="color: red;">
    静态样式
  </view>
</template>
```

#### 动态类名绑定（wx:class）
`wx:class` 支持对象语法和数组语法，可以与静态 `class` 属性同时使用。

**对象语法：**
```html
<view class="outer" wx:class="{{ {active: isActive, disabled: isDisabled} }}">
```

**数组语法：**
```html
<view class="outer" wx:class="{{ ['active', 'primary'] }}">
```

#### 动态样式绑定（wx:style）
`wx:style` 支持对象语法和数组语法，可以与静态 `style` 属性同时使用。样式名支持驼峰写法。

**对象语法：**
```html
<view style="color: red;" wx:style="{{ {fontSize: '16px', fontWeight: 'bold'} }}">
```

**数组语法：**
```html
<view wx:style="{{ [baseStyle, activeStyle] }}">
```

**注意事项：**
- 样式名可以使用驼峰写法（如 `fontSize`）或横杠写法（如 `font-size`）
- `wx:class` 和 `wx:style` 在运行时动态计算，性能优良
- 支持与静态 `class` 和 `style` 属性同时使用，会自动合并

## 2. 样式能力支持情况

### 2.1 选择器支持

RN 环境下支持的选择器范围有限，主要是**单类选择器**、`page` 选择器和 `:host` 选择器。

✅ **支持的选择器：**
```css
.container { }
.button { }
.text-primary { }
.classA, .classB { } /* 逗号组合支持 */
page { }
:host { }
```

❌ **不支持的选择器：**
```css
view, text { }       /* 标签选择器 */
.container .item { } /* 后代选择器 */
.list > .item { }    /* 子选择器 */
.button:hover { }    /* 伪类选择器 */
.text::before { }    /* 伪元素选择器 */
[type="text"] { }    /* 属性选择器 */
.button.primary { }  /* 组合选择器 */
```

### 2.2 样式单位与转换

Mpx 在 RN 平台支持多种 CSS 单位，并在运行时进行转换。

#### 基础单位

| 单位 | 说明 | 转换规则 |
|------|------|----------|
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
import mpx from '@mpxjs/core'

mpx.config.rnConfig = Object.assign({}, mpx.config.rnConfig, {
  customDimensions (dimensions) {
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

1.  **原生支持（基于父节点宽高）**：
    `width`、`height`、`left`、`right`、`top`、`bottom`、`margin`、`padding` 等属性。

2.  **需辅助属性（基于父节点字体）**：
    `font-size` 的百分比计算依赖开发者传入的 `parent-font-size` 属性。
    ```html
    <text parent-font-size="16" style="font-size: 120%;">文本内容</text>
    ```

3.  **基于自身宽高计算**：
    `translateX`、`translateY`、`border-radius` 的百分比都是根据自身宽高来计算的（首次渲染不展示，在 `onLayout` 后计算生效）。

4.  **calc() 函数内的百分比**：
    在 `calc()` 函数表达式内使用百分比时，需要开发者设置 `parent-width` 或 `parent-height` 属性。

### 2.3 颜色值支持

支持以下颜色值格式：
- **Named Color**: 预定义颜色名称（如 `red`、`blue`）
- **Hex Color**: 十六进制颜色（如 `#090`、`#009900`）
- **RGB/RGBA**: `rgb(34, 12, 64)`、`rgba(34, 12, 64, 0.6)`
- **HSL/HSLA**: `hsl(30, 100%, 50%)`
- **HWB**: `hwb(90 10% 10%)`
- **Color Ints**: RN 特有格式（如 `0xff00ff00`）

### 2.4 文本样式继承

Mpx 框架抹平了平台差异，使 `view` 节点可以直接包裹文本并继承样式。

**继承规则：**
1.  **view -> text 继承**：只有 `view` 节点下的**直接子** `text` 节点可以继承 `view` 节点上的文本样式。
2.  **text 嵌套继承**：父级 `text` 节点的样式可以被嵌套的子 `text` 节点继承。
3.  **自动包裹**：`view` 节点直接包裹文本时，Mpx 编译时会自动添加 `text` 节点包裹文本。

**透传属性：**
- Mpx 会从 `view` 上拆分文本组件属性并透传到直接子 `text` 节点，包括：`ellipsizeMode`、`numberOfLines`、`allowFontScaling`
- Mpx 会从 `view` 的样式中拆分文本样式并透传到直接子 `text` 节点，包括：`color`、`font*`、`text*`、`letterSpacing`、`lineHeight`、`includeFontPadding`、`writingDirection`

### 2.5 简写属性支持

RN 仅原生支持部分 CSS 简写属性，Mpx 会在**编译时**对其他简写属性进行展开，以兼容 RN。

**RN 原生支持的简写属性：**
以下属性在 RN 中原生支持，可以在 `style` 内联样式和 `class` 类样式中使用，无需编译转换：
- **布局**：`flex`（支持 `flex: 1` / `flex: 0` 等）
- **间距**：`margin`、`padding`（**仅支持单值语法**，如 `margin: 10px`）
- **边框**：`border-width`、`border-color`、`border-radius`（**仅支持单值语法**，如 `border-width: 1px`）
- **阴影**：`box-shadow`（RN 0.76+ 原生支持）

**Mpx 编译时增强的简写属性：**
以下属性及其多值语法 RN 不原生支持，Mpx 会在编译时自动将其展开为 RN 支持的多属性结构：

- **间距多值语法**：`margin`、`padding` 的 2-4 值语法
  - 如 `margin: 10px 20px` → `marginTop: 10, marginRight: 20...`
- **边框多值语法**：`border-width`、`border-color`、`border-radius` 的 2-4 值语法
  - 如 `border-width: 1px 2px` → `borderTopWidth: 1, borderRightWidth: 2...`
- **边框简写**：`border`
  - 如 `border: 1px solid red` → `borderWidth: 1, borderStyle: 'solid', borderColor: 'red'`
- **方向边框简写**：`border-top`、`border-right`、`border-bottom`、`border-left`
- **布局简写**：`flex` 的多值语法、`flex-flow`
  - 如 `flex: 1 1 auto` → `flexGrow: 1, flexShrink: 1, flexBasis: 'auto'`
- **背景简写**：`background`（仅 `view` 支持）
- **阴影简写**：`text-shadow`
- **装饰简写**：`text-decoration`

**使用限制：**
- ✅ **class 类样式**：支持所有简写属性及其多值语法，Mpx 会在编译时自动展开。
- ❌ **style 属性**：仅支持 RN 原生支持的简写属性（如 `margin`、`padding` 的单值语法）。**不支持** Mpx 编译增强的简写属性（如 `border`、多值 `margin` 等），在内联样式中使用这些属性会导致 RN 运行时报错或无效。
- ❌ **CSS 变量**：编译增强的简写属性不支持单个 `var()` 函数（如 `margin: var(--spacing)`），但支持多值简写中使用多个 `var()`（如 `margin: var(--v) var(--h)`）。RN 原生支持的简写属性（如单值 `margin`）支持单个 `var()`。

### 2.6 CSS 变量与函数

#### CSS 变量 (Custom Properties)
支持定义和使用 CSS 变量，支持 fallback 值。

```css
:root { --main-color: #3498db; }
.comp { color: var(--main-color, blue); }
```

**自动检测与 enable-var：**
框架会自动检测样式中的 CSS 变量使用。如果样式中一开始不存在变量定义或使用，但后续需要动态添加（如通过 `wx:style`），建议使用 `enable-var` 属性预先声明，以确保运行时正确处理变量。

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
    '--text-color': 'red',
    color: 'var(--text-color)'
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

### 2.7 媒体查询

Mpx 在 RN 平台支持 `@media` 规则，但能力受限。

**支持特性：**
- 媒体类型：`screen`、`all`
- 媒体特性：`width`、`min-width`、`max-width`
- 逻辑运算符：`and`

**限制：**
- 媒体查询中的宽度条件仅支持 `px` 单位。
- 不支持 `height`、`orientation` 等其他特性。

### 2.8 动画支持

Mpx 在 RN 平台支持以下动画方式：

- **CSS Transition**：支持过渡动画，推荐使用。
- **Animation API**：支持小程序风格的 `wx.createAnimation` API，需结合 `animation` 属性（组件属性，并非样式属性）使用。
- **不支持**：CSS Keyframes (`@keyframes`) 动画。

**使用限制：**
- 仅 `view` 组件支持动画相关属性。

**自动检测与 enable-animation：**
框架会自动检测样式和属性中的动画定义来确定动画类型（如检测到 `transition` 样式或 `animation` 属性）。如果样式中一开始不存在动画定义，但后续需要动态添加（如通过 `wx:style` 动态添加 `transition`），建议使用 `enable-animation` 属性预先声明动画类型。


```html
<template>
  <!-- 场景：动态添加 transition 样式，需预先声明 -->
  <view enable-animation="transition" wx:style="{{ dynamicStyle }}" />
</template>

<script>
  // ...
  this.dynamicStyle = {
    transition: 'opacity 0.3s ease',
    opacity: 0.5
  }
</script>
```

### 2.9 背景图支持

Mpx 在 RN 平台支持 CSS 背景图及渐变背景，框架会自动处理样式转换。

**支持特性：**
- **背景颜色**：RN 原生支持 `background-color`。
- **背景图**：支持 `background-image: url()` 引用图片。
- **渐变背景**：支持 `background-image: linear-gradient()` 线性渐变。
- **相关属性**：完整支持 `background-size` 和 `background-position`。

**限制与注意事项：**
- **组件限制**：仅 `view` 组件支持除 `background-color` 外的背景相关属性。
- **简写属性**：`background` 简写属性仅支持 `<background-color>`、`<background-image>` 和 `<background-repeat>`，不支持 `background-position` 和 `background-size` 简写。
- **背景重复**：`background-repeat` 仅支持 `no-repeat`
- **多重背景**：不支持多重背景。

**自动检测与 enable-background：**
框架会自动检测样式中的背景相关属性（如 `background-image`、`background-size` 等）。如果样式中一开始不存在背景定义，但后续需要动态添加（如通过 `wx:style`），建议使用 `enable-background` 属性预先声明，以确保运行时正确处理背景。

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
    backgroundImage: 'url(...)'
  }
</script>
```

## 3. 样式属性支持详情

### 3.1 布局属性 (Flexbox)

| 属性 | 值类型 | 默认值 | 说明 |
|------|--------|--------|------|
| `display` | `flex` \| `none` | `flex` | RN 仅支持 Flex 布局 |
| `flex-direction` | `row` \| `column` \| `row-reverse` \| `column-reverse` | `column` | 主轴方向（RN 默认为 column） |
| `flex-wrap` | `nowrap` \| `wrap` \| `wrap-reverse` | `nowrap` | 换行控制 |
| `justify-content` | `flex-start` \| `flex-end` \| `center` \| `space-between` \| `space-around` \| `space-evenly` | `flex-start` | 主轴对齐 |
| `align-items` | `flex-start` \| `flex-end` \| `center` \| `stretch` \| `baseline` | `stretch` | 交叉轴对齐 |
| `align-content` | `flex-start` \| `flex-end` \| `center` \| `stretch` \| `space-between` \| `space-around` \| `space-evenly` | `flex-start` | 多行交叉轴对齐 |
| `align-self` | `auto` \| `flex-start` \| `flex-end` \| `center` \| `stretch` \| `baseline` | `auto` | 单个元素交叉轴对齐 |
| `flex` | `none` \| `auto` \| `initial` \| `<flex-grow>` \| `<flex-grow> <flex-shrink>` \| `<flex-grow> <flex-basis>` \| `<flex-grow> <flex-shrink> <flex-basis>` | - | 简写属性 |
| `flex-grow` | `number` | `0` | 放大比例 |
| `flex-shrink` | `number` | `0` | 收缩比例 |
| `flex-basis` | `auto` \| `length` \| `%` | `auto` | 初始大小 |
| `gap` / `row-gap` / `column-gap` | `length` | - | 行列间距 |

### 3.2 定位与层级

| 属性 | 值类型 | 默认值 | 说明 |
|------|--------|--------|------|
| `position` | `relative` \| `absolute` \| `fixed` | `relative` | 不支持 `sticky` |
| `top` / `right` / `bottom` / `left` | `length` \| `%` | - | 偏移量 |
| `z-index` | `number` | - | 层级控制 |

### 3.3 尺寸与溢出

| 属性 | 值类型 | 默认值 | 说明 |
|------|--------|--------|------|
| `width` / `height` | `auto` \| `length` \| `%` | `auto` | 宽高 |
| `min-width` / `min-height` | `length` \| `%` | - | 最小尺寸 |
| `max-width` / `max-height` | `length` \| `%` | - | 最大尺寸 |
| `aspect-ratio` | `auto` \| `number` \| `width / height` | - | 宽高比 |
| `box-sizing` | `border-box` \| `content-box` | `border-box` | 盒模型 |
| `overflow` | `visible` \| `hidden` \| `scroll` | `visible` | 溢出控制 |

### 3.4 间距 (Margin/Padding)

| 属性 | 值类型 | 说明 |
|------|--------|------|
| `margin` | `auto` \| `length` \| `%` | 外边距简写（支持多值） |
| `margin-*` | `auto` \| `length` \| `%` | 单边外边距 |
| `padding` | `length` \| `%` | 内边距简写（支持多值） |
| `padding-*` | `length` \| `%` | 单边内边距 |

### 3.5 边框 (Border)

| 属性 | 值类型 | 说明 |
|------|--------|------|
| `border` | `width style color` | 边框简写 |
| `border-width` | `length` | 边框宽度（支持多值） |
| `border-color` | `color` | 边框颜色（支持多值） |
| `border-style` | `solid` \| `dotted` \| `dashed` | 边框样式（不支持单边设置） |
| `border-radius` | `length` \| `%` | 圆角半径（支持多值） |
| `border-*-radius` | `length` \| `%` | 单角圆角 |

### 3.6 背景 (Background)

> **注意**：仅 `view` 组件支持背景相关属性（除 `background-color` 外）。

| 属性 | 值类型 | 说明 |
|------|--------|------|
| `background` | `<background-color>` \| `<background-image>` \| `<background-repeat>` | 背景简写，不支持 `background-position` 和 `background-size` 简写 |
| `background-color` | `color` | 背景色 |
| `background-image` | `url()` \| `linear-gradient()` | 背景图/渐变 |
| `background-size` | `cover` \| `contain` \| `auto` \| `length` \| `%` | 背景尺寸 |
| `background-repeat` | `no-repeat` | 仅支持不重复 |
| `background-position` | `center` \| `left` \| `right` \| `top` \| `bottom` \| `number` \| `%` | 背景位置 |

### 3.7 文本与字体

> **注意**：文本样式需遵循继承规则。

| 属性 | 值类型 | 默认值 | 说明 |
|------|--------|--------|------|
| `color` | `color` | - | 文本颜色 |
| `font-family` | `string` | - | 字体（仅支持单字体） |
| `font-size` | `length` | - | 字体大小 |
| `font-weight` | `normal` \| `bold` \| `100-900` | `normal` | 字体粗细 |
| `font-style` | `normal` \| `italic` | `normal` | 字体样式 |
| `line-height` | `length` \| `number` \| `%` | - | 行高 |
| `text-align` | `auto` \| `left` \| `right` \| `center` \| `justify` | `auto` | 文本对齐 |
| `vertical-align` | `auto` \| `top` \| `bottom` \| `middle` | - | 垂直对齐（仅 Android） |
| `text-decoration` | `line style color` | - | 装饰线简写 |
| `text-transform` | `none` \| `uppercase` \| `lowercase` \| `capitalize` | `none` | 大小写转换 |
| `letter-spacing` | `length` | - | 字符间距 |
| `text-shadow` | `offset-x offset-y blur color` | - | 文本阴影（Mpx 增强） |
| `user-select` | `auto` \| `text` \| `none` \| `contain` \| `all` | `auto` | 文本选择控制 |
| `font-variant` | `small-caps` \| `oldstyle-nums` \| `lining-nums` \| `tabular-nums` \| `proportional-nums` | - | 字体变体 |
| `direction` | `ltr` \| `rtl` \| `inherit` | `ltr` | 文本方向 |

### 3.8 变换 (Transform)

| 属性 | 值类型 | 说明 |
|------|--------|------|
| `transform` | `translate` \| `scale` \| `rotate`... | 变换函数列表 |
| `transform-origin` | `length` \| `%` \| `keyword` | 变换原点 |

**不支持**：`translateZ`, `scaleZ`, `translate3d`, `scale3d`, `rotate3d`, `matrix3d`。

### 3.9 阴影与不透明度

| 属性 | 值类型 | 说明 |
|------|--------|------|
| `box-shadow` | `<offset-x> <offset-y> <blur-radius> <spread-radius> <color>` | 阴影简写（RN 0.76+ 原生支持） |
| `opacity` | `0-1` | 不透明度 |

### 3.10 动画 (Animation)

> **注意**：仅 `view` 组件支持动画相关属性。

| 属性 | 值类型 | 说明 |
|------|--------|------|
| `transition` | `property duration timing-function delay` | 过渡简写 |
| `transition-property` | `string` | 过渡属性（不支持 `all`） |
| `transition-duration` | `time` | 过渡持续时间 |
| `transition-delay` | `time` | 过渡延迟时间 |
| `transition-timing-function` | `linear` \| `ease` \| `ease-in` \| `ease-out` \| `ease-in-out` \| `cubic-bezier` | 过渡时间函数 |

### 3.11 其他属性

| 属性 | 值类型 | 说明 |
|------|--------|------|
| `pointer-events` | `auto` \| `none` \| `box-none` \| `box-only` | 点击穿透控制 |
| `backface-visibility` | `visible` \| `hidden` | 背面可见性 |
| `object-fit` | `cover` \| `contain` \| `fill` \| `scale-down` | 图片填充模式 |

### 3.12 不支持的属性

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

