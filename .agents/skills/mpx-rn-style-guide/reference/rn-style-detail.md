# RN 平台样式能力详情

## 1. 样式编写方式

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

## 2. 类名和样式绑定

Mpx 在 RN 平台完整支持静态和动态的类名及样式绑定，与小程序平台保持一致。

### 2.1 静态类名和样式

可以直接使用 `class` 和 `style` 属性：

```html
<template>
  <view class="container" style="color: red;">
    静态样式
  </view>
</template>
```

### 2.2 动态类名绑定（wx:class）

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

### 2.3 动态样式绑定（wx:style）

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

## 3. 选择器支持

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

## 4. CSS 属性支持

### 4.1 双端都不支持的属性

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

### 4.2 iOS 不支持的属性

```css
vertical-align
```

### 4.3 Android/Harmony 不支持的属性

```css
text-decoration-style
text-decoration-color
shadow-offset
shadow-opacity
shadow-radius
```

### 4.4 支持的核心属性

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
- `transform-origin`: 完整支持

**其他属性：**
- `opacity`: 0-1 之间的数值
- `overflow`: `visible`, `hidden`, `scroll`
- `z-index`: 整数值

### 4.5 文本样式继承

Mpx 对 RN 文本样式继承做了跨端抹平，但继承规则仍受 RN `Text` 节点机制约束。

**继承规则：**
1. `view` 节点上的文本样式，只会作用于其直接子 `text` 节点
2. `text` 节点样式可被其嵌套的子 `text` 节点继承
3. `view` 直接包裹纯文本时，编译期会自动补充 `text` 包裹

**文本样式及属性透传特性：**
- Mpx 会从 `view` 上拆分文本属性（`TEXT_PROPS_REGEX`）并透传到直接子 `text` 节点：`ellipsizeMode`、`numberOfLines`、`allowFontScaling`
- Mpx 会从 `view` 的样式中拆分文本样式（`TEXT_STYLE_REGEX`）并透传到直接子 `text` 节点：`color`、`font*`、`text*`、`letterSpacing`、`lineHeight`、`includeFontPadding`、`writingDirection`
- 该能力用于简化 `<view>` 直接包裹字符串字面量时进行文本配置

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

## 5. 单位转换

Mpx 在 RN 平台支持多种 CSS 单位，并在运行时进行转换。

### 5.1 rpx（响应式像素）

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

### 5.2 vw/vh（视口单位）

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

### 5.3 计算基准与自定义（customDimensions）

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

### 5.4 px（像素）

px 会直接转换为 React Native 的数值（无单位）。

```css
.box {
  width: 100px;  /* 转换为 width: 100 */
}
```

### 5.5 百分比

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

### 5.6 hairlineWidth（特殊单位）

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

## 6. 媒体查询支持

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

## 7. 简写属性展开

RN 不支持某些 CSS 简写属性，Mpx 会自动将其展开。

### 7.1 margin/padding

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

### 7.2 border

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

### 7.3 border-radius

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

### 7.4 flex

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

### 7.5 transform

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

**支持的 transform 能力：**
**函数：**
- `translateX`, `translateY`, `translate`
- `scaleX`, `scaleY`, `scale`
- `rotateX`, `rotateY`, `rotateZ`, `rotate`
- `skewX`, `skewY`, `skew`
- `perspective`
- `matrix`

**属性：**
- `transform-origin`：完整支持

**不支持：**
- `translateZ`, `scaleZ`
- `translate3d`, `scale3d`, `rotate3d`
- `matrix3d`

### 7.6 background

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

### 7.7 使用限制

> [!tip] 编译时 vs 运行时
>
> - ✅ `class` 类样式中的简写属性会在编译时自动展开
> - ❌ `style` 属性不会做简写展开，RN 不支持的简写在运行时不可用
>
> **CSS 变量限制**
> - ❌ 简写属性不支持单个 `var()`（如 `margin: var(--spacing)`）
> - ✅ 多值简写可使用多个 `var()`，按顺序展开到各子属性

## 8. CSS 变量支持

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

## 9. 特殊样式处理

### 9.1 line-height

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

### 9.2 font-family

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

## 10. 动画支持

Mpx 在 RN 平台提供了两种动画方式，满足不同的使用场景。

### 10.1 CSS Transition（推荐）

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

### 10.2 Animation API

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

**支持动画的属性：**
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

**事件说明：**
- Animation API 在 RN 侧复用 `transitionend` 事件通道，因此同样使用 `bindtransitionend` 监听动画结束

**注意事项：**
- 动画数据通过 `animation.export()` 导出
- 支持动画队列和链式调用
- 如果样式或属性中一开始不存在动画定义，建议使用 `enable-animation` 预先声明动画类型

### 10.3 不支持的动画方式

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

### 10.4 动画类型控制

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
