---
name: mpx-rn-style-guide
description: Mpx 跨端输出 RN 的样式能力说明与实践建议；当用户询问 Mpx 跨端输出 RN 样式相关问题时调用。
---

# Mpx 跨端输出 RN 样式开发指南

## 概述

Mpx 是一个增强型跨端框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）和 React Native 平台。由于小程序和 RN 在样式系统上存在本质差异，Mpx 在编译时和运行时对样式进行了不同的处理。本文档详细描述 Mpx 输出 RN 时的样式能力支持、与小程序平台的差异，以及跨平台开发的最佳实践。

## 跨平台样式适配改造约束

当对已有的 Mpx 组件进行跨平台样式适配改造时，需要严格遵循以下约束条件：

1. 当检测到不兼容的样式能力或属性时，优先改造为等效的跨平台兼容实现
2. 当检测到不兼容的样式能力或属性时，且没有等效兼容方案可用时，使用条件编译保留不兼容的样式属性，并添加 todo 注释信息
3. 避免大面积使用条件编译，仅在必要时局部使用，保持代码的可读性和维护性

### 适配改造检查项

- [ ] style区块中不包含 RN 平台不支持的选择器类型，仅允许包含**单类选择器**、`page` 选择器和 `:host` 选择器
- [ ] 所有 RN 平台中不兼容的样式能力或属性都必须被条件编译包裹，避免输出到 RN 平台，并且包含 todo 注释信息
- [ ] 产物中不包含大面积的条件编译，如整个 style 区块都被条件编译分流

## RN 平台样式能力详情

### 1. 样式编写方式

Mpx 在 RN 平台使用标准的 CSS 语法编写样式，与小程序平台保持一致。开发者无需关心底层实现，只需按照 CSS 规范编写样式代码即可。

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

### 2. 类名和样式绑定

Mpx 在 RN 平台完整支持静态和动态的类名及样式绑定，与小程序平台保持一致。

#### 2.1 静态类名和样式

可以直接使用 `class` 和 `style` 属性：

```html
<template>
  <view class="container" style="color: red;">
    静态样式
  </view>
</template>
```

#### 2.2 动态类名绑定（wx:class）

`wx:class` 支持对象语法和数组语法，可以与静态 `class` 属性同时使用。

**对象语法：**

```html
<template>
  <!-- 对象字面量 -->
  <view class="outer" wx:class="{{ {active: isActive, disabled: isDisabled} }}">
    <!-- 对象数据 -->
    <view class="inner" wx:class="{{classList}}" />
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    isActive: true,
    isDisabled: false,
    classList: {
      selected: true,
      highlighted: false
    }
  }
})
</script>
```

**数组语法：**

```html
<template>
  <!-- 数组字面量 -->
  <view class="outer" wx:class="{{ ['active', 'primary'] }}">
    <!-- 数组数据 -->
    <view class="inner" wx:class="{{classList}}" />
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    classList: ['selected', 'highlighted']
  }
})
</script>
```

#### 2.3 动态样式绑定（wx:style）

`wx:style` 支持对象语法和数组语法，可以与静态 `style` 属性同时使用。样式名支持驼峰写法。

**对象语法：**

```html
<template>
  <!-- 对象字面量 -->
  <view style="color: red;" wx:style="{{ {fontSize: '16px', fontWeight: 'bold'} }}">
    <!-- 对象数据 -->
    <view wx:style="{{styleObject}}" />
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    styleObject: {
      color: 'blue',
      fontSize: '14px',
      backgroundColor: '#f0f0f0'
    }
  }
})
</script>
```

**数组语法：**

```html
<template>
  <!-- 合并多个样式对象 -->
  <view wx:style="{{ [baseStyle, activeStyle] }}" />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    baseStyle: {
      color: 'blue',
      fontSize: '14px'
    },
    activeStyle: {
      backgroundColor: 'red',
      fontWeight: 'bold'
    }
  }
})
</script>
```

**注意事项：**
- 样式名可以使用驼峰写法（如 `fontSize`）或横杠写法（如 `font-size`）
- `wx:class` 和 `wx:style` 在运行时动态计算，性能优良
- 支持与静态 `class` 和 `style` 属性同时使用，会自动合并

### 3. 选择器支持

RN 环境下支持的选择器范围有限，主要是**单类选择器**、`page` 选择器和 `:host` 选择器。

✅ **支持的选择器：**
```css
.container { }
.button { }
.text-primary { }
.classA, .classB { }
page { }
:host { }
```

❌ **不支持的选择器：**
```css
/* 标签选择器（逗号组合） */
view, text { }

/* 后代选择器 */
.container .item { }

/* 子选择器 */
.list > .item { }

/* 伪类选择器 */
.button:hover { }
.item:first-child { }

/* 伪元素选择器 */
.text::before { }

/* 属性选择器 */
[type="text"] { }

/* 组合选择器 */
.button.primary { }
```

**补充说明：**
- 逗号组合选择器可以使用，但每一项都必须是单类选择器、`page` 或 `:host`
- 类名组合选择器（如 `.a.b`）在 RN 平台不支持

**错误提示：**
```
Only single class selector is supported in react native mode temporarily.
```

### 4. CSS 属性支持

#### 4.1 双端都不支持的属性

以下属性在 iOS 和 Android 上均不支持：

```css
white-space
text-overflow
animation
font-variant-caps
font-variant-numeric
font-variant-east-asian
font-variant-alternates
font-variant-ligatures
caret-color
```

#### 4.2 iOS 不支持的属性

```css
vertical-align
```

#### 4.3 Android/Harmony 不支持的属性

```css
text-decoration-style
text-decoration-color
shadow-offset
shadow-opacity
shadow-radius
```

#### 4.4 支持的核心属性

**布局属性：**
- `display`: `flex`, `none`
- `flex-direction`: `row`, `row-reverse`, `column`, `column-reverse`
- `flex-wrap`: `wrap`, `nowrap`, `wrap-reverse`
- `justify-content`: `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly`
- `align-items`: `flex-start`, `flex-end`, `center`, `stretch`, `baseline`
- `align-content`: `flex-start`, `flex-end`, `center`, `stretch`, `space-between`, `space-around`, `space-evenly`
- `position`: `relative`, `absolute`, `fixed`

**尺寸属性：**
- `width`, `height`: 支持数值、百分比、`auto`
- `min-width`, `max-width`, `min-height`, `max-height`
- `flex-basis`: 支持数值、百分比、`auto`

**间距属性：**
- `margin`, `margin-*`: 支持数值、百分比、`auto`
- `padding`, `padding-*`: 支持数值、百分比

**边框属性：**
- `border-width`, `border-*-width`
- `border-color`, `border-*-color`
- `border-style`: `solid`, `dotted`, `dashed`
- `border-radius`, `border-*-radius`

**文本属性：**
- `color`: 支持颜色值
- `font-size`, `font-weight`, `font-style`, `font-family`
- `line-height`: 数值会自动转换为百分比
- `text-align`: `left`, `right`, `center`, `justify`
- `text-decoration-line`: `none`, `underline`, `line-through`, `underline line-through`
- `text-transform`: `none`, `uppercase`, `lowercase`, `capitalize`

**背景属性：**
- `background-color`: 支持颜色值
- `background-image`: 支持 `url()` 和 `linear-gradient()`，仅 `view` 组件支持
- `background-size`: `contain`, `cover`, `auto`, 或数值，仅 `view` 组件支持
- `background-repeat`: 仅支持 `no-repeat`，且仅 `view` 组件支持
- `background-position`: 完整支持，且仅 `view` 组件支持

**变换属性：**
- `transform`: 支持 `translate`, `scale`, `rotate`, `skew` 等

**其他属性：**
- `opacity`: 0-1 之间的数值
- `overflow`: `visible`, `hidden`, `scroll`
- `z-index`: 整数值

#### 4.5 文本样式继承

Mpx 对 RN 文本样式继承做了跨端抹平，但继承规则仍受 RN `Text` 节点机制约束。

**继承规则：**
1. `view` 节点上的文本样式，只会作用于其直接子 `text` 节点
2. `text` 节点样式可被其嵌套的子 `text` 节点继承
3. `view` 直接包裹纯文本时，编译期会自动补充 `text` 包裹

**便捷透传特性：**
- Mpx 会从 `view` 上拆分文本属性（`TEXT_PROPS_REGEX`）并透传到直接子 `text` 节点：`ellipsizeMode`、`numberOfLines`、`allowFontScaling`
- Mpx 会从 `view` 的样式中拆分文本样式（`TEXT_STYLE_REGEX`）并透传到直接子 `text` 节点：`color`、`font*`、`text*`、`letterSpacing`、`lineHeight`、`includeFontPadding`、`writingDirection`
- 该能力用于简化 `<view>` 直接包裹字符串字面量时的文本配置

**示例：**
```html
<view class="wrapper">
  文本1
  <text class="content">文本2</text>
  <text class="content"><text>文本3</text></text>
  <view class="content">文本4</view>
  <view class="content"><view>文本5</view></view>
</view>
```

```css
.wrapper {
  font-size: 20px;
  color: #333;
  line-height: 32px;
}

.content {
  text-align: right;
}
```

```html
<view
  style="color: #333; font-size: 16px;"
  numberOfLines="{{1}}"
  ellipsizeMode="tail"
>
  这段文本会被自动包裹为 text，并继承/透传上述文本样式与文本属性
</view>
```

### 5. 单位转换

Mpx 在 RN 平台支持多种 CSS 单位，并在运行时进行转换。

#### 5.1 rpx（响应式像素）

rpx 是小程序的响应式单位，Mpx 在 RN 中也支持该单位。

**转换公式：**
```javascript
// 基准屏幕宽度：750rpx
实际像素 = rpx值 × 屏幕宽度 / 750
```

**示例：**
```css
.container {
  width: 750rpx;  /* 等于屏幕宽度 */
  height: 375rpx; /* 等于屏幕宽度的一半 */
}
```

#### 5.2 vw/vh（视口单位）

```javascript
// vw: 视口宽度的百分比
实际像素 = vw值 × 屏幕宽度 / 100

// vh: 视口高度的百分比
实际像素 = vh值 × 屏幕高度 / 100
```

**示例：**
```css
.full-width {
  width: 100vw;  /* 屏幕宽度 */
}

.half-height {
  height: 50vh;  /* 屏幕高度的一半 */
}
```

#### 5.3 计算基准与自定义（customDimensions）

`rpx`、`vw`、`vh` 的换算默认基于运行时的 `screen.width` 和 `screen.height`。

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

#### 5.4 px（像素）

px 会直接转换为 React Native 的数值（无单位）。

```css
.box {
  width: 100px;  /* 转换为 width: 100 */
}
```

#### 5.5 百分比

百分比单位在 RN 平台的处理分为两类：**React Native 原生支持的百分比**和**框架特殊处理的百分比**。

**React Native 原生支持的百分比：**

大部分 CSS 属性的百分比由 React Native 原生支持，会保留为字符串形式（如 `"50%"`），不需要额外的辅助属性：

```css
.container {
  /* 以下百分比由 RN 原生支持，无需辅助属性 */
  width: 50%;        /* 相对于父元素宽度 */
  height: 30%;       /* 相对于父元素高度 */
  padding: 5%;       /* 相对于父元素宽度 */
  margin: 10%;       /* 相对于父元素宽度 */
  top: 10%;          /* 相对于父元素高度 */
  left: 20%;         /* 相对于父元素宽度 */
}
```

**框架特殊处理的百分比：**

只有以下百分比需要框架进行计算，可能需要辅助属性：

| CSS 属性 | 基准值 | 是否需要辅助属性 |
|---------|--------|-----------------|
| `font-size` | 父元素字体大小 | 需要 `parent-font-size` |
| `line-height` | 当前元素字体大小 | 自动计算，无需辅助属性 |
| `calc()` 中的 `translateX/Y` | 元素自身尺寸 | 自动测量，无需辅助属性 |
| `calc()` 中的 `border-radius` | 元素自身宽度 | 自动测量，无需辅助属性 |

**自动测量机制：**

对于 `calc()` 中依赖元素自身尺寸的百分比（如 `translateX`, `borderRadius`），框架会自动通过 `onLayout` 事件获取元素尺寸：

```html
<template>
  <!-- 框架会自动测量元素尺寸，无需手动处理 -->
  <view class="box" />
</template>

<style>
.box {
  width: 200rpx;
  height: 200rpx;
  /* calc() 中的 translateX 百分比会基于元素自身的 width (200rpx) 计算 */
  transform: translateX(calc(50% + 10rpx));
}
</style>
```

**注意：**
- 在首次布局完成前，使用自身尺寸百分比的元素会被临时隐藏（`opacity: 0`），布局完成后会自动显示
- 动画执行不会触发 `onLayout`，不建议在动画中使用这类依赖自身尺寸的百分比计算

**需要辅助属性的场景：**

只有 `font-size` 的百分比需要传递 `parent-font-size` 辅助属性：

```html
<template>
  <!-- 传递父元素字体大小 -->
  <view
    parent-font-size="{{16}}"
    class="child"
  />
</template>

<style>
.child {
  /* 这个百分比需要 parent-font-size */
  font-size: 120%;  /* 120% * 16 = 19.2 */
}
</style>
```

**错误处理：**

如果 `font-size` 百分比缺少 `parent-font-size`，会收到运行时错误：

```
[fontSize] can not contain % unit unless you set [parent-font-size] with a number for the percent calculation.
```

**解决方案：**
1. 为元素添加 `parent-font-size` 属性
2. 或者使用固定单位（rpx、px）代替百分比

**calc() 中的百分比：**

`calc()` 是框架模拟支持的特性，其中的所有百分比都需要框架计算，需要相应的辅助属性：

```css
.box {
  /* calc() 中的百分比需要 parent-width */
  width: calc(50% - 20rpx);  /* 需要 parent-width */
  padding: calc(5% + 10rpx); /* 需要 parent-width */

  /* calc() 中的百分比需要 parent-height */
  height: calc(30% + 10rpx); /* 需要 parent-height */
  top: calc(10% - 5rpx);     /* 需要 parent-height */

  /* calc() 中的 translateX/Y 百分比需要元素自身尺寸，框架会自动测量 */
  transform: translateX(calc(50% + 10rpx));  /* 自动测量元素 width */

  /* calc() 中的 borderRadius 百分比需要元素自身尺寸，框架会自动测量 */
  border-radius: calc(10% + 5rpx);  /* 自动测量元素 width */
}
```

**示例：**

```html
<template>
  <!-- 使用 calc() 需要传递辅助属性 -->
  <view
    parent-width="{{750}}"
    parent-height="{{1000}}"
    class="box"
  />
</template>

<style>
.box {
  /* 这些 calc() 中的百分比需要辅助属性 */
  width: calc(50% - 20rpx);   /* 需要 parent-width */
  height: calc(30% + 10rpx);  /* 需要 parent-height */

  /* 这些 calc() 中的百分比会自动测量 */
  transform: translateX(calc(50% + 10rpx));  /* 自动测量 */
}
</style>
```

#### 5.6 hairlineWidth（特殊单位）

React Native 提供的最细线宽度，通常用于边框。

```css
.divider {
  border-width: hairlineWidth;
}
```

**转换为：**
```javascript
{
  borderWidth: StyleSheet.hairlineWidth
}
```

### 6. 媒体查询支持

Mpx 在 RN 平台支持 `@media` 规则，但能力受限，主要用于宽度相关场景。

**媒体类型支持：**
- `screen`：支持
- `all`：支持
- `print`：不支持

**支持的媒体特性：**
- `width`：支持
- `min-width`: 最小宽度
- `max-width`: 最大宽度
- `height`: 暂不支持
- `aspect-ratio`: 暂不支持
- `orientation`: 暂不支持
- `prefers-color-scheme`: 暂不支持

**逻辑运算符支持：**
- `and`：支持
- `not`：不支持
- `only`：不支持
- `or`：不支持

**单位限制：**
- 媒体查询中的宽度条件仅支持 `px`

**示例：**
```css
.container {
  padding: 20px;
}

@media screen and (min-width: 750px) {
  .container {
    padding: 40px;
  }
}

@media (min-width: 375px) and (max-width: 750px) {
  .container {
    padding: 30px;
  }
}

/* 不支持：单位为 em */
@media (max-width: 30em) {
  .container {
    padding: 16px;
  }
}
```

**运行时处理：**
媒体查询会被转换为包含 `_default` 和 `_media` 的对象结构，在运行时根据屏幕宽度动态计算。

```javascript
{
  container: {
    _default: { padding: 20 },
    _media: [
      {
        options: { minWidth: 750 },
        value: { padding: 40 }
      }
    ]
  }
}
```

### 7. 简写属性展开

RN 不支持某些 CSS 简写属性，Mpx 会自动将其展开。

#### 7.1 margin/padding

```css
/* 输入 */
.box {
  margin: 10rpx 20rpx 30rpx 40rpx;
}

/* 转换为 */
{
  marginTop: 10,
  marginRight: 20,
  marginBottom: 30,
  marginLeft: 40
}
```

**简写规则：**
- 1个值：`margin: 10rpx` → 四边都是 10
- 2个值：`margin: 10rpx 20rpx` → 上下10，左右20
- 3个值：`margin: 10rpx 20rpx 30rpx` → 上10，左右20，下30
- 4个值：`margin: 10rpx 20rpx 30rpx 40rpx` → 上右下左

#### 7.2 border

```css
/* 输入 */
.box {
  border: 2rpx solid #000;
}

/* 转换为 */
{
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: '#000'
}
```

#### 7.3 border-radius

```css
/* 输入 */
.box {
  border-radius: 10rpx 20rpx 30rpx 40rpx;
}

/* 转换为 */
{
  borderTopLeftRadius: 10,
  borderTopRightRadius: 20,
  borderBottomRightRadius: 30,
  borderBottomLeftRadius: 40
}
```

#### 7.4 flex

```css
/* 输入 */
.box {
  flex: 1;
}

/* 转换为 */
{
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 0
}
```

**特殊值：**
- `flex: initial` → `flexGrow: 0, flexShrink: 1`
- `flex: none` → `flexGrow: 0, flexShrink: 0`

#### 7.5 transform

```css
/* 输入 */
.box {
  transform: translateX(10rpx) scale(1.5) rotate(45deg);
}

/* 转换为 */
{
  transform: [
    { translateX: 10 },
    { scaleX: 1.5 },
    { scaleY: 1.5 },
    { rotateZ: '45deg' }
  ]
}
```

**支持的 transform 函数：**
- `translateX`, `translateY`, `translate`
- `scaleX`, `scaleY`, `scale`
- `rotateX`, `rotateY`, `rotateZ`, `rotate`
- `skewX`, `skewY`, `skew`
- `perspective`
- `matrix`

**不支持：**
- `translateZ`, `scaleZ`
- `translate3d`, `scale3d`, `rotate3d`
- `matrix3d`

#### 7.6 background

`background` 在 RN 平台为部分支持的简写属性。

**值类型：**`<background-image>` | `<background-color>` | `<background-size>` | `<background-repeat>` | `<background-position>`（具体支持情况以各子属性能力为准）

```css
background: url("image.jpg") no-repeat center;
background: linear-gradient(45deg, red, blue);
background: #f0f0f0;
```

**限制说明：**
- `background` 简写仅 `view` 组件支持；除 `background-color` 外，其他 `background-*` 属性也仅 `view` 组件支持
- `background-repeat` 在 RN 平台中仅支持 `no-repeat`
- 不支持多重背景

#### 7.7 使用限制

> [!tip] 编译时 vs 运行时
>
> - ✅ `class` 类样式中的简写属性会在编译时自动展开
> - ❌ `style` 属性不会做简写展开，RN 不支持的简写在运行时不可用
>
> **CSS 变量限制**
> - ❌ 简写属性不支持单个 `var()`（如 `margin: var(--spacing)`）
> - ✅ 多值简写可使用多个 `var()`，按顺序展开到各子属性

### 8. CSS 变量支持

Mpx 在 RN 平台支持 CSS 变量（CSS Custom Properties）。

**定义变量：**
```css
.theme {
  --primary-color: #007aff;
  --spacing: 20rpx;
}
```

**使用变量：**
```css
.button {
  background-color: var(--primary-color);
  padding: var(--spacing);
}
```

**带 fallback 的变量：**
```css
.button {
  color: var(--text-color, #333);
}
```

**自动检测与 enable-var：**

框架会自动检测样式中的 CSS 变量使用和定义：
- 如果样式中包含变量定义（`--xxx`）或使用（`var()`），会自动启用变量处理
- 如果样式中一开始不存在变量定义或使用，但后续需要动态添加，建议使用 `enable-var` 预先声明

```html
<template>
  <!-- 场景1：样式中已有 CSS 变量，无需显式声明 -->
  <view class="theme" />

  <!-- 场景2：动态添加 CSS 变量，建议预先声明 -->
  <view
    enable-var
    wx:style="{{ dynamicStyle }}"
  />

  <!-- 场景3：使用外部变量上下文 -->
  <view
    enable-var
    external-var-context="{{ varContext }}"
  />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    dynamicStyle: {},
    varContext: {
      '--theme-color': '#007aff'
    }
  },
  methods: {
    addVariable() {
      // 动态添加 CSS 变量
      this.dynamicStyle = {
        '--primary-color': '#ff0000',
        'color': 'var(--primary-color)'
      }
    }
  }
})
</script>

<style>
.theme {
  --primary-color: #007aff;
  color: var(--primary-color);
}
</style>
```

**注意事项：**
- CSS 变量在运行时解析
- 简写属性不支持单个 CSS 变量（会导致运行时无法正确展开）
- 支持 fallback 值，用于变量未定义时的兜底
- 变量使用/定义在组件生命周期内应保持稳定
- 如果需要动态添加变量，建议使用 `enable-var` 预先声明

### 9. 样式缓存机制

Mpx 在 RN 平台实现了全局样式缓存机制，提升性能。

**缓存结构：**
```javascript
global.__classCaches = []  // 所有 classCache 实例
global.__GCC(className, classMap, classMapValueCache)  // 获取缓存的样式
```

**屏幕尺寸变化处理：**
当设备屏幕尺寸变化（如折叠屏展开/折叠）时，Mpx 会：
1. 监听 `Dimensions` 的 `change` 事件
2. 清空所有样式缓存
3. 更新全局尺寸计数器
4. 触发页面重新计算样式

**代码示例：**
```javascript
Dimensions.addEventListener('change', ({ window, screen }) => {
  // 清空缓存
  global.__classCaches?.forEach(cache => cache?.clear())

  // 更新尺寸标记
  global.__mpxSizeCount++
})
```

### 10. 特殊样式处理

#### 10.1 display: none

RN 中 `display: none` 可能引发异常，Mpx 使用布局样式模拟：

```javascript
{
  flex: 0,
  height: 0,
  width: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  overflow: 'hidden'
}
```

#### 10.2 line-height

数值型 line-height 会自动转换为百分比：

```css
/* 输入 */
.text {
  line-height: 1.5;
}

/* 转换为 */
{
  lineHeight: '150%'
}
```

**注意事项：**
- `line-height: 12` 会被按百分比处理（等价于 `1200%`）
- `line-height: 12px` 会按带单位的固定值处理

#### 10.3 font-family

仅支持单个字体，多个字体会取第一个：

```css
/* 输入 */
.text {
  font-family: "PingFang SC", "Helvetica", sans-serif;
}

/* 转换为 */
{
  fontFamily: 'PingFang SC'
}
```

**警告提示：**
```
Value of [font-family] only supports one in .text, received ["PingFang SC", "Helvetica", sans-serif], and the first one is used by default.
```

### 11. 动画支持

Mpx 在 RN 平台提供了两种动画方式，满足不同的使用场景。

#### 11.1 CSS Transition（推荐）

RN 平台支持 CSS transition，可以直接在样式中使用。

**基础用法：**
```css
.box {
  opacity: 0;
  transform: translateY(20rpx);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.box-active {
  opacity: 1;
  transform: translateY(0);
}
```

**支持的 transition 属性：**
- `transition-property`: 指定要过渡的属性
- `transition-duration`: 过渡持续时间
- `transition-timing-function`: 缓动函数（ease, linear, ease-in, ease-out, ease-in-out）
- `transition-delay`: 延迟时间
- 不支持 `transition-property: all` 和 `transition: all ...`

**简写形式：**
```css
.box {
  transition: opacity 0.3s ease 0s;
}
```

**多属性过渡：**
```css
.box {
  transition: opacity 0.3s ease, transform 0.5s ease-in-out;
}
```

**监听过渡结束事件：**
```html
<template>
  <view
    class="box"
    wx:class="{{ { 'box-active': isActive } }}"
    bindtransitionend="handleTransitionEnd"
  />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    isActive: false
  },
  methods: {
    handleTransitionEnd(e) {
      console.log('过渡结束', e.detail)
      // e.detail.elapsedTime - 过渡持续时间（秒）
      // e.detail.finished - 是否完成
    }
  }
})
</script>
```

#### 11.2 Animation API

Mpx 支持小程序风格的 Animation API，适合需要精确控制动画的场景。

**基础用法：**
```html
<template>
  <view animation="{{animationData}}" />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    animationData: null
  },
  attached() {
    this.startAnimation()
  },
  methods: {
    startAnimation() {
      // 创建动画实例
      const animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease',
        delay: 0
      })

      // 定义动画
      animation
        .opacity(1)
        .translateY(0)
        .step()

      // 导出动画数据
      this.animationData = animation.export()
    }
  }
})
</script>
```

**说明：**
- 当传入 `animation` prop 时，框架会自动检测并使用 Animation API
- 无需显式设置 `enable-animation="api"`，除非需要预先声明（如动态添加动画的场景）

**支持的动画方法：**
- **样式属性**：`opacity`, `backgroundColor`, `width`, `height` 等
- **变换**：`translate`, `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `skew`, `skewX`, `skewY`
- **不支持**：`matrix`, `matrix3d`

**链式调用：**
```javascript
animation
  .opacity(0.5)
  .scale(1.2)
  .rotate(45)
  .step({ duration: 300 })
  .opacity(1)
  .scale(1)
  .rotate(0)
  .step({ duration: 300 })
```

**动画队列：**
```javascript
// 第一段动画
animation.translateX(100).step({ duration: 300 })
// 第二段动画
animation.translateY(100).step({ duration: 300 })
// 第三段动画
animation.translateX(0).translateY(0).step({ duration: 300 })

this.animationData = animation.export()
```

**监听动画结束：**
```html
<template>
  <view
    animation="{{animationData}}"
    bindtransitionend="handleAnimationEnd"
  />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  methods: {
    handleAnimationEnd(e) {
      console.log('动画结束', e.detail)
    }
  }
})
</script>
```

**注意事项：**
- 动画数据通过 `animation.export()` 导出
- 支持动画队列和链式调用
- 如果样式或属性中一开始不存在动画定义，建议使用 `enable-animation` 预先声明动画类型

#### 11.3 不支持的动画方式

**CSS Animation（@keyframes）暂不支持：**

```css
/* ❌ RN 平台不支持 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.box {
  animation: fadeIn 0.3s;
}
```

如果在代码中使用了 CSS animation，会收到错误提示：
```
[Mpx runtime error]: CSS animation is not supported yet
```

**替代方案：**
使用 CSS transition 或 Animation API 实现相同效果。

#### 11.4 动画类型控制

Mpx 会自动检测样式和属性中的动画定义来确定动画类型，但也可以通过 `enable-animation` 属性显式指定。

**自动检测规则：**

框架会按以下优先级自动检测动画类型：

1. **CSS Transition**（最高优先级）：如果样式中包含 `transition` 属性或 `transitionProperty` + `transitionDuration`
2. **Animation API**：如果传入了 `animation` prop 或 `enable-animation="true"`
3. **CSS Animation**：如果样式中包含 `animation` 属性或 `animationName` + `animationDuration`（暂不支持，会报错）

**显式指定动画类型：**

当样式或属性中一开始不存在动画定义时，建议使用 `enable-animation` 预先声明动画类型，确保 hooks 执行稳定：

```html
<template>
  <!-- 预先声明使用 CSS transition -->
  <view enable-animation="transition" />

  <!-- 预先声明使用 Animation API -->
  <view enable-animation="api" animation="{{animationData}}" />

  <!-- 禁用动画 -->
  <view enable-animation="none" />
</template>
```

**示例场景：**

```html
<template>
  <!-- 场景1：样式中已有 transition，无需显式声明 -->
  <view class="box" wx:class="{{ { 'box-active': isActive } }}" />

  <!-- 场景2：动态添加 transition，建议预先声明 -->
  <view
    enable-animation="transition"
    wx:style="{{ dynamicStyle }}"
  />

  <!-- 场景3：使用 Animation API，建议预先声明 -->
  <view
    enable-animation="api"
    animation="{{animationData}}"
  />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    isActive: false,
    dynamicStyle: {}
  },
  methods: {
    addTransition() {
      // 动态添加 transition
      this.dynamicStyle = {
        transition: 'opacity 0.3s ease'
      }
    }
  }
})
</script>

<style>
.box {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.box-active {
  opacity: 1;
}
</style>
```

**动画类型优先级：**
1. `enable-animation` 属性显式指定的类型（最高优先级）
2. 样式中的 `transition` 属性
3. `animation` prop 或 `enable-animation="true"`
4. 样式中的 `animation` 属性

**注意事项：**
- 动画类型在组件生命周期内必须保持稳定
- 不建议在运行时切换动画类型（会触发错误提示）
- 如果样式中已有动画定义，框架会自动检测，无需显式声明
- 如果需要动态添加动画，建议使用 `enable-animation` 预先声明类型

## 与小程序平台的样式能力差异

### 1. 选择器支持对比

| 选择器类型 | RN 平台 | 小程序平台 |
|-----------|---------|-----------|
| 单类选择器 `.class` | ✅ | ✅ |
| `page` 选择器 | ✅ | ✅ |
| `:host` 选择器 | ✅ | ✅ |
| ID 选择器 `#id` | ❌ | ✅ |
| 标签选择器 `view` | ❌ | ✅ |
| 后代选择器 `.a .b` | ❌ | ✅ |
| 子选择器 `.a > .b` | ❌ | ✅ |
| 伪类选择器 `:hover` | ❌ | ✅ |
| 伪元素选择器 `::before` | ❌ | ✅ |
| 属性选择器 `[type]` | ❌ | ✅ |
| 组合选择器 `.a.b` | ❌ | ✅ |

**关键差异：**
- RN 平台仅支持单类选择器、`page` 选择器和 `:host` 选择器
- 小程序平台支持完整的 CSS 选择器

### 2. CSS 属性支持对比

| 属性类别 | RN 平台 | 小程序平台 |
|---------|---------|-----------|
| 基础布局（Flexbox） | ✅ 完整支持 | ✅ 完整支持 |
| Grid 布局 | ❌ | ✅ 部分平台支持 |
| 定位（position） | ✅ relative, absolute, fixed | ✅ 完整支持（含 sticky） |
| 文本溢出 | ❌ `text-overflow`（使用 `numberOfLines="{{1}}"`） | ✅ 完整支持 |
| 空白处理 | ❌ white-space | ✅ 完整支持 |
| CSS 动画（@keyframes） | ❌ 暂不支持 | ✅ 完整支持 |
| CSS 过渡（transition） | ✅ 支持 | ✅ 完整支持 |
| Animation API | ✅ 支持 | ✅ 完整支持 |
| 阴影（box-shadow） | ✅ 支持 | ✅ 完整支持 |
| 滤镜（filter）| ✅ brightness, opacity | ✅ 部分平台支持 |
| 背景图定位（background-position） | ✅ 支持 | ✅ 完整支持 |
| 多重背景 | ❌ | ✅ 完整支持 |
| 渐变背景 | ✅ linear-gradient | ✅ 完整支持 |

**RN 平台特有限制：**
- 不支持 CSS animation（`@keyframes`）
- 不支持 `transition-property: all` 和 `transition: all ...`
- 不支持 `text-overflow` 和 `white-space`
- 不支持伪元素（`::before`, `::after`）

### 3. 单位处理对比

| 单位 | RN 平台 | 小程序平台 |
|-----|---------|-----------|
| rpx | ✅ 运行时转换 | ✅ 原生支持 |
| px | ✅ 直接转换为数值 | ✅ 物理像素 |
| % | ✅ 字符串形式 | ✅ 百分比 |
| vw/vh | ✅ 运行时转换 | ✅ 视口单位 |
| rem | ❌ | ✅ 相对单位 |
| em | ❌ | ✅ 相对单位 |
| hairlineWidth | ✅ RN 特有 | ❌ |

**转换差异：**
- RN 平台在运行时转换 rpx、vw、vh
- 小程序平台在编译时处理单位转换
- RN 平台的 px 会转换为无单位数值
- 小程序平台的 px 保持为物理像素

### 4. 样式格式对比

| 特性 | RN 平台 | 小程序平台 |
|-----|---------|-----------|
| 样式编写 | CSS 语法 | CSS 语法（WXSS） |
| 样式文件 | `.mpx` 文件中的 `<style>` | `.wxss` 文件 |
| 媒体查询 | ✅ 有限支持（width/min-width/max-width，单位仅 px） | ✅ 支持 |
| CSS 变量 | ✅ 支持 | ✅ 支持 |

**示例对比：**

两个平台都使用相同的 CSS 语法编写样式：

```css
/* 源码 */
.container {
  background-color: #fff;
  padding-top: 20rpx;
}
```

开发者无需关心平台差异，框架会自动处理样式的平台适配。

### 5. 简写属性对比

| 简写属性 | RN 平台 | 小程序平台 |
|---------|---------|-----------|
| margin | ✅ 自动展开 | ✅ 原生支持 |
| padding | ✅ 自动展开 | ✅ 原生支持 |
| border | ✅ 自动展开 | ✅ 原生支持 |
| border-radius | ✅ 自动展开 | ✅ 原生支持 |
| flex | ✅ 自动展开 | ✅ 原生支持 |
| background | ⚠️ 部分支持 | ✅ 完整支持 |
| font | ❌ | ✅ 完整支持 |

**RN 平台展开示例：**
```css
/* 输入 */
.box {
  margin: 10rpx 20rpx;
}

/* RN 平台展开 */
{
  marginTop: 10,
  marginRight: 20,
  marginBottom: 10,
  marginLeft: 20
}

/* 小程序平台保持 */
.box {
  margin: 10rpx 20rpx;
}
```

## 跨平台样式开发最佳实践

### 1. 选择器使用建议

**✅ 推荐做法：**
```css
/* 使用单类选择器 */
.container { }
.item { }
.button-primary { }
```

**❌ 避免使用：**
```css
/* 避免复杂选择器（RN 不支持）*/
.container .item { }
.list > .item { }
.button:hover { }
```

**兼容方案：**
如果必须使用复杂选择器，可以通过条件编译：

```html
<style>
/* 小程序平台 */
/* @mpx-if (__mpx_mode__ === 'wx') */
.container .item {
  color: red;
}
/* @mpx-endif */

/* RN 平台 */
/* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android') */
.container-item {
  color: red;
}
/* @mpx-endif */
</style>
```

### 2. CSS 属性使用建议

#### 2.1 使用跨平台支持的属性

**✅ 推荐使用：**
```css
.container {
  /* 布局 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  /* 尺寸 */
  width: 100%;
  height: 200rpx;

  /* 间距 */
  padding: 20rpx;
  margin: 10rpx;

  /* 边框 */
  border-width: 1rpx;
  border-color: #ddd;
  border-radius: 10rpx;

  /* 文本 */
  color: #333;
  font-size: 28rpx;
  text-align: center;

  /* 背景 */
  background-color: #fff;
}
```

#### 2.2 避免使用不兼容的属性

**❌ 避免使用：**
```css
.text {
  /* RN 不支持 */
  white-space: nowrap;
  text-overflow: ellipsis;

  /* RN 不支持 CSS animation（@keyframes） */
  animation: fadeIn 0.3s;
}
```

**兼容方案：**
```html
<style>
/* 小程序平台 */
/* @mpx-if (__mpx_mode__ === 'wx') */
.text {
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* @mpx-endif */
</style>
```

### 3. 单位使用建议

#### 3.1 优先使用 rpx

rpx 是跨平台最佳选择，在 RN 和小程序平台都有良好支持。

**✅ 推荐：**
```css
.container {
  width: 750rpx;
  height: 200rpx;
  padding: 20rpx;
  font-size: 28rpx;
}
```

#### 3.2 百分比用于相对布局

百分比单位在 RN 平台的处理分为两类：**React Native 原生支持的百分比**和**框架特殊处理的百分比**。

**✅ 推荐使用场景：**

```css
/* 场景1：宽度和高度百分比（RN 原生支持） */
.container {
  width: 100%;
  height: 50%;
  padding: 5%;
  margin: 10%;
}

/* 场景2：Flexbox 中的相对布局 */
.item {
  width: 50%;  /* 在 flex 容器中表现良好 */
}
```

**⚠️ 需要辅助属性的场景：**

1. **`font-size` 的百分比**需要传递 `parent-font-size` 辅助属性
2. **`calc()` 中的百分比**需要传递相应的辅助属性（`calc()` 是框架模拟支持的特性）

```html
<template>
  <!-- 场景1：font-size 百分比需要 parent-font-size -->
  <view
    parent-font-size="{{16}}"
    class="text"
  />

  <!-- 场景2：calc() 中的百分比需要辅助属性 -->
  <view
    parent-width="{{750}}"
    parent-height="{{1000}}"
    class="box"
  />
</template>

<style>
.text {
  font-size: 120%;  /* 需要 parent-font-size */
}

.box {
  /* calc() 中的百分比需要辅助属性 */
  width: calc(50% - 20rpx);   /* 需要 parent-width */
  height: calc(30% + 10rpx);  /* 需要 parent-height */

  /* calc() 中的 translateX/Y 百分比会自动测量 */
  transform: translateX(calc(50% + 10rpx));  /* 自动测量元素 width */
}
</style>
```

**❌ 避免的场景：**

```css
/* 避免：字体大小使用百分比 */
.text {
  font-size: 120%;  /* 需要 parent-font-size，容易出错 */
}

/* 推荐：使用 rpx */
.text {
  font-size: 32rpx;
}

/* 避免：calc() 中使用百分比但不传递辅助属性 */
.box {
  width: calc(50% - 20rpx);  /* 需要 parent-width，否则会报错 */
}

/* 推荐：使用 rpx */
.box {
  width: calc(375rpx - 20rpx);
}
```

**最佳实践：**

1. **优先使用 rpx**：对于固定尺寸，rpx 是最可靠的选择
2. **放心使用百分比**：`width`, `height`, `padding`, `margin` 等属性的百分比由 RN 原生支持，可以放心使用
3. **避免字体百分比**：`font-size` 的百分比需要辅助属性，建议使用 rpx 代替
4. **谨慎使用 calc() 中的百分比**：`calc()` 是框架模拟支持的，其中的百分比需要辅助属性，建议在 `calc()` 中使用 rpx 代替百分比
5. **使用 vh/vw**：对于视口相关的尺寸，vh/vw 是更好的选择

#### 3.3 避免使用不兼容的单位

**❌ 避免：**
```css
.text {
  font-size: 1.2rem;  /* RN 不支持 */
  padding: 1em;       /* RN 不支持 */
}
```

### 4. 布局最佳实践

#### 4.1 使用 Flexbox 布局

Flexbox 是跨平台最可靠的布局方式。

**✅ 推荐：**
```css
.container {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.item {
  flex: 1;
}
```

#### 4.2 避免使用 Grid 布局

Grid 布局在 RN 平台不支持。

**❌ 避免：**
```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

**替代方案：**
```css
.container {
  display: flex;
  flex-wrap: wrap;
}

.item {
  width: 50%;
}
```

### 5. 文本处理最佳实践

#### 5.1 文本溢出处理

**小程序平台：**
```css
.text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

**RN 平台：**
```html
<template>
  <text numberOfLines="{{1}}">{{text}}</text>
</template>
```

**跨平台方案：**
```html
<style>
/* @mpx-if (__mpx_mode__ === 'wx') */
.text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* @mpx-endif */
</style>

<template>
  <!-- RN 平台使用 numberOfLines -->
  <text
    class="text"
    numberOfLines="{{1}}"
  >
    {{text}}
  </text>
</template>
```

#### 5.2 行高处理

**✅ 推荐：**
```css
.text {
  line-height: 1.5;  /* 数值会自动转换 */
}
```

或使用具体单位：
```css
.text {
  font-size: 28rpx;
  line-height: 40rpx;
}
```

### 6. 背景处理最佳实践

#### 6.1 背景颜色

跨平台完全兼容：
```css
.container {
  background-color: #fff;
}
```

#### 6.2 背景图片

**✅ 推荐：**
```css
.banner {
  background-image: url('/images/banner.png');
  background-size: cover;
  background-repeat: no-repeat;
}
```

**自动检测与 enable-background：**

框架会自动检测样式中的背景相关属性：
- 如果样式中包含 `background-image`、`background-size`、`background-position`、`background-repeat`，会自动启用背景处理
- 如果样式中一开始不存在背景定义，但后续需要动态添加，建议使用 `enable-background` 预先声明

```html
<template>
  <!-- 场景1：样式中已有背景，无需显式声明 -->
  <view class="banner" />

  <!-- 场景2：动态添加背景，建议预先声明 -->
  <view
    enable-background
    wx:style="{{ dynamicStyle }}"
  />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    dynamicStyle: {}
  },
  methods: {
    addBackground() {
      // 动态添加背景
      this.dynamicStyle = {
        backgroundImage: 'url(/images/bg.png)',
        backgroundSize: 'cover'
      }
    }
  }
})
</script>

<style>
.banner {
  background-image: url('/images/banner.png');
  background-size: cover;
}
</style>
```

**注意事项：**
- `background-repeat` 在 RN 平台仅支持 `no-repeat`
- 除 `background-color` 外，其他 `background-*` 属性在 RN 平台仅 `view` 组件支持
- 避免使用多重背景（RN 不支持）
- 背景使用在组件生命周期内应保持稳定
- 如果需要动态添加背景，建议使用 `enable-background` 预先声明

#### 6.3 渐变背景

**✅ 推荐：**
```css
.gradient {
  background-image: linear-gradient(to bottom, #fff, #f0f0f0);
}
```

### 7. 变换和动画最佳实践

#### 7.1 Transform 变换

**✅ 推荐使用的变换：**
```css
.box {
  transform: translateX(10rpx) translateY(20rpx);
  transform: scale(1.2);
  transform: rotate(45deg);
}
```

**❌ 避免使用：**
```css
.box {
  transform: translateZ(10rpx);  /* RN 不支持 */
  transform: rotate3d(1, 1, 1, 45deg);  /* RN 不支持 */
}
```

#### 7.2 动画处理

Mpx 在 RN 平台支持两种动画方式：

**方式一：CSS Transition（推荐）**

RN 平台支持 CSS transition，可以直接使用：

```css
.box {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.box-active {
  opacity: 1;
}
```

**方式二：Animation API**

使用小程序风格的 Animation API：

```html
<template>
  <view animation="{{animationData}}" />
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    animationData: null
  },
  methods: {
    startAnimation() {
      const animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease'
      })
      animation.opacity(1).step()
      this.animationData = animation.export()
    }
  }
})
</script>
```

**不支持：CSS Animation（@keyframes）**

RN 平台暂不支持 CSS animation 和 @keyframes：

```css
/* ❌ RN 平台不支持 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.box {
  animation: fadeIn 0.3s;
}
```

如果需要复杂动画，建议使用 CSS transition 或 Animation API。

### 8. 样式组织建议

#### 8.1 使用 Scoped 样式

避免样式污染：
```html
<style scoped>
.container {
  padding: 20rpx;
}
</style>
```

#### 8.2 提取公共样式

创建公共样式文件：
```css
/* common.css */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

```

#### 8.3 使用 CSS 变量

定义主题变量：
```css
.root {
  --primary-color: #007aff;
  --text-color: #333;
  --bg-color: #fff;
  --border-color: #ddd;
  --spacing: 20rpx;
}

.button {
  background-color: var(--primary-color);
  padding: var(--spacing);
}
```

### 9. 性能优化建议

#### 9.1 避免过深的选择器嵌套

**❌ 避免：**
```css
.page .container .list .item .content .text {
  color: red;
}
```

**✅ 推荐：**
```css
.item-text {
  color: red;
}
```

#### 9.2 优化媒体查询

**✅ 推荐：**
```css
.container {
  padding: 20rpx;
}

@media (min-width: 750px) {
  .container {
    padding: 40px;
  }
}
```

避免过多的媒体查询断点。

### 10. 调试和测试建议

#### 10.1 使用条件编译

```html
<style>
/* 调试样式 */
/* @mpx-if (__mpx_env__ === 'DEBUG') */
.debug-border {
  border: 1rpx solid red;
}
/* @mpx-endif */
</style>
```

#### 10.2 平台特定样式

```html
<style>
/* 微信小程序 */
/* @mpx-if (__mpx_mode__ === 'wx') */
.container {
  padding-top: 88rpx; /* 包含导航栏高度 */
}
/* @mpx-endif */

/* RN 平台 */
/* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android') */
.container {
  padding-top: 0; /* RN 自行处理安全区域 */
}
/* @mpx-endif */
</style>
```

#### 10.3 测试清单

跨平台样式测试要点：
- ✅ 在目标平台上实际测试
- ✅ 测试不同屏幕尺寸
- ✅ 修复样式警告和错误
- ✅ 验证性能表现

## 总结

Mpx 框架在 RN 和小程序平台上提供了强大的样式支持，但由于平台特性差异，开发者需要注意以下关键点：

**RN 平台限制：**
1. 仅支持单类选择器、`page` 选择器和 `:host` 选择器
2. 不支持 CSS animation（@keyframes），但支持 CSS transition 和 Animation API
3. 部分 CSS 属性不支持

**跨平台开发建议：**
1. 优先使用单类选择器
2. 使用 Flexbox 布局
3. 避免使用不兼容的 CSS 属性
4. 合理使用条件编译
5. 充分测试目标平台

通过遵循本文档的最佳实践，可以编写出高质量的跨平台样式代码，实现一套代码多端运行的目标。
