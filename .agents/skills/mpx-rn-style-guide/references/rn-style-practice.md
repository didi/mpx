## 跨端输出 RN 样式开发最佳实践

## 目录

- [1. 选择器使用建议](#1-选择器使用建议)
  - [1.1 复合选择器替换为等效单类选择器](#11-复合选择器替换为等效单类选择器)
  - [1.2 子元素伪类替代方案 (:first-child / :last-child / :nth-child)](#12-子元素伪类替代方案-first-child--last-child--nth-child)
  - [1.3 伪元素选择器替代方案 (::before / ::after)](#13-伪元素选择器替代方案-before--after)
  - [1.4 点击态处理 (:active)](#14-点击态处理-active)
- [2. 样式单位使用建议](#2-样式单位使用建议)
  - [2.1 优先使用 px 和 rpx 单位](#21-优先使用-px-和-rpx-单位)
  - [2.2 百分比用于相对布局](#22-百分比用于相对布局)
  - [2.3 1像素边框（极细线）](#23-1像素边框极细线)
  - [2.4 避免使用不兼容的单位 (rem/em)](#24-避免使用不兼容的单位-remem)
  - [2.5 谨慎使用 font-weight 数值](#25-谨慎使用-font-weight-数值)
- [3. 布局最佳实践](#3-布局最佳实践)
  - [3.1 使用 Flexbox 布局](#31-使用-flexbox-布局)
  - [3.2 避免使用 Grid 布局](#32-避免使用-grid-布局)
  - [3.3 避免使用 Float 布局](#33-避免使用-float-布局)
- [4. 文本溢出处理](#4-文本溢出处理)
- [5. 隐藏元素](#5-隐藏元素)
- [6. 文本垂直居中](#6-文本垂直居中)
- [7. 渐变中避免使用 transparent](#7-渐变中避免使用-transparent)
- [8. 提取公共样式](#8-提取公共样式)

### 1. 选择器使用建议

Mpx 输出 RN 时仅支持**单类选择器**、`page` 选择器和 `:host` 选择器，但是大部分不支持的选择器都可以使用单类选择器进行等效替代实现。

#### 1.1 复合选择器替换为等效单类选择器

Mpx 输出 RN 时通过类名样式映射模拟实现了 CSS 中定义样式的能力，从 RN 平台的技术限制和模拟实现的运行时开销考虑，当前主要支持了**单类选择器**，不支持复杂的复合选择器（如后代选择器 `.parent .child`、交集选择器 `.classA.classB` 等）。为了保证跨端样式表现一致，建议将复合选择器替换为等效的单类选择器。

**注意：** 替换为单类选择器时，不仅需要更新 `<template>` 和 `<style>` 中的类名引用，还需要同步更新 `<script>` 中涉及的动态类名绑定的字面量，以及使用 `selector` 作为参数的相关 API（小程序中主要包括：`createSelectorQuery`、`createIntersectionObserver`、`selectComponent` 和 `selectAllComponents`）。

**❌ 避免：**
```html
<template>
  <view class="list">
    <!-- 避免：使用需要交集选择器匹配的修饰类名 -->
    <view class="item" wx:class="{{dynamicClass}}">
      <text class="title">标题</text>
    </view>
  </view>
</template>

<style>
/* 避免使用后代选择器和交集选择器 */
.list .item {
  padding: 20rpx;
}
.item.active {
  color: red;
}
</style>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    isActive: true
  },
  computed: {
    // script 中返回交集修饰类名
    dynamicClass() {
      return this.isActive ? 'active' : ''
    }
  },
  ready() {
    // 避免在 API 中使用复合选择器
    this.createSelectorQuery().select('.list .item').boundingClientRect().exec()
    this.createIntersectionObserver().relativeTo('.list').observe('.item.active', () => {})
    this.selectComponent('.list .item')
    this.selectAllComponents('.list .item')
  }
})
</script>
```

**✅ 推荐：**
```html
<template>
  <view class="list">
    <!-- 推荐：直接使用等效的单类名并使用 wx:class 进行动态绑定 -->
    <view class="list-item" wx:class="{{dynamicClass}}">
      <text class="title">标题</text>
    </view>
  </view>
</template>

<style>
/* 推荐使用单类选择器 */
.list-item {
  padding: 20rpx;
}
.list-item-active {
  color: red;
}
</style>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    isActive: true
  },
  computed: {
    // script 中的动态类名绑定也需要同步更新为完整的单类名
    dynamicClass() {
      return this.isActive ? 'list-item-active' : ''
    }
  },
  ready() {
    // 使用 selector 作为参数的 API 也需要同步更新为单类名
    this.createSelectorQuery().select('.list-item').boundingClientRect().exec()
    this.createIntersectionObserver().relativeTo('.list').observe('.list-item-active', () => {})
    this.selectComponent('.list-item')
    this.selectAllComponents('.list-item')
  }
})
</script>
```


#### 1.2 子元素伪类替代方案 (:first-child / :last-child / :nth-child)

RN 平台不支持 CSS 子元素伪类选择器（如 `:first-child`, `:last-child`, `:nth-child`）。建议在模版中通过数据下标 (`index`) 判断来动态应用样式类。

**❌ 避免：**
```css
/* RN 不支持结构伪类 */
.item:first-child {
  margin-top: 0;
}
```

**✅ 推荐：**
```html
<template>
  <!-- 建议使用 wx:class 进行动态样式绑定 -->
  <view
    wx:for="{{list}}"
    wx:key="id"
    class="item"
    wx:class="{{ { 'first-item': index === 0 } }}"
  >
    {{item.text}}
  </view>
</template>

<style>
.item {
  margin-top: 20rpx;
  border-bottom-width: 1rpx;
}

/* 单独定义首项样式 */
.first-item {
  margin-top: 0;
}
</style>
```

#### 1.3 伪元素选择器替代方案 (::before / ::after)

RN 平台不支持 `::before` 和 `::after` 伪元素选择器。对于需要在元素前后添加装饰性内容的需求，应使用真实的组件节点进行等效替代。

**❌ 避免：**
```css
/* RN 不支持伪元素 */
.title::before {
  content: '';
  width: 10rpx;
  height: 30rpx;
  background-color: blue;
}
```

**✅ 推荐：**
```html
<template>
  <view class="title-container">
    <!-- 使用真实的 view 节点替代 ::before -->
    <view class="title-decorator"></view>
    <text class="title">标题内容</text>
  </view>
</template>

<style>
.title-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.title-decorator {
  width: 10rpx;
  height: 30rpx;
  background-color: blue;
  margin-right: 10rpx;
}
</style>
```

#### 1.4 点击态处理 (:active)

RN 平台不支持 `:active` 伪类选择器，如需实现点击态样式，可以使用 `hover-class` 组件属性进行跨端兼容实现。

**支持组件：**
`view`、`button`、`navigator`

**❌ 避免：**
```css
/* RN 不支持 :active 伪类 */
.btn:active {
  opacity: 0.8;
  background-color: #f5f5f5;
}
```

**✅ 推荐：**
```html
<template>
  <!-- 使用 hover-class 指定点击态样式类 -->
  <!-- hover-stay-time 指定手指松开后点击态保留时间，单位毫秒 -->
  <view
    class="btn"
    hover-class="btn-hover"
    hover-stay-time="{{100}}"
  >
    点击我
  </view>
</template>

<style>
.btn {
  background-color: #ffffff;
}

/* 定义点击态样式 */
.btn-hover {
  opacity: 0.8;
  background-color: #f5f5f5;
}
</style>
```

### 2. 样式单位使用建议

#### 2.1 优先使用 px 和 rpx 单位

px 和 rpx 在 RN 与小程序平台都具备良好兼容性，建议优先使用；其中 rpx 适合响应式尺寸，px 适合固定尺寸。

**✅ 推荐：**
```css
.container {
  width: 750rpx;
  height: 200rpx;
  padding: 20px;
  font-size: 28rpx;
}
```

#### 2.2 百分比用于相对布局

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

#### 2.3 1像素边框（极细线）

在移动端开发中，常需要实现物理像素为 1px 的极细边框。

**原平台：**
使用 `1rpx` 可以很好地在不同设备上呈现细边框。

**RN 平台：**
使用 `hairlineWidth` 常量来实现平台最细边框。

**✅ 推荐写法（使用条件编译）：**

```css
.border {
  border-style: solid;
  border-color: #e5e5e5;
  /* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
  border-width: hairlineWidth;
  /* @mpx-else */
  border-width: 1rpx;
  /* @mpx-endif */
}
```

#### 2.4 避免使用不兼容的单位 (rem/em)

RN 不支持 `rem` 和 `em` 单位。需将其转换为 `rpx` 以实现响应式布局。

**转换说明：**
`rpx` 是小程序和 Mpx RN 的响应式单位（规定屏幕宽为 750rpx）。
若原项目使用 `rem` 进行响应式适配，通常存在固定的换算比例。
例如：
- 若设定 `1rem = 100px` (基于 750px 设计稿)，则 `1rem = 100rpx`。
- 若基于浏览器默认字号 (`16px`)，则 `1rem = 32rpx` (1px = 2rpx)。

**❌ 避免：**
```css
.text {
  width: 2rem;       /* RN 不支持 */
  font-size: 1.2rem; /* RN 不支持 */
}
```

**✅ 推荐（转换为 rpx）：**
```css
.text {
  /* 假设转换比例 1rem = 100rpx */
  width: 200rpx;
  font-size: 120rpx;
}
```

#### 2.5 谨慎使用 font-weight 数值

由于 RN 平台数值类型的 `font-weight`（如 `400`, `500`, `700`）在不同系统和字体下的渲染表现，与小程序/Web 平台往往存在差异，容易导致跨端 UI 不一致。

**建议：**
尽量使用 `normal` 或 `bold` 关键字来控制字体粗细，以获得更稳定一致的跨平台表现。

**❌ 避免：**
```css
.text-normal {
  font-weight: 400;  /* 跨端表现可能不一致 */
}
.text-bold {
  font-weight: 700;  /* 跨端表现可能不一致 */
}
```

**✅ 推荐：**
```css
.text-normal {
  font-weight: normal;
}
.text-bold {
  font-weight: bold;
}
```

### 3. 布局最佳实践

#### 3.1 使用 Flexbox 布局

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

#### 3.2 避免使用 Grid 布局

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

#### 3.3 避免使用 Float 布局

`float` 在 RN 平台不支持，不应作为布局方案使用。

**❌ 避免：**
```css
.left {
  float: left;
  width: 50%;
}

.right {
  float: right;
  width: 50%;
}
```

**替代方案：**
```css
.container {
  display: flex;
  flex-direction: row;
}

.left,
.right {
  width: 50%;
}
```

### 4. 文本溢出处理

**原平台：**
```css
.text {
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

**跨平台兼容方案：**
```html
<style>
/* 原平台内使用样式条件编译保留原有样式定义 */
/* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
.text {
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* @mpx-endif */
</style>

<template>
  <!-- RN 平台内使用模板属性条件编译添加 numberOfLines 属性进行等效实现-->
  <text
    class="text"
    numberOfLines@ios|android|harmony="{{1}}"
  >
    {{text}}
  </text>

  <!-- numberOfLines 也可用于 view -->
  <view
    class="text"
    numberOfLines@ios|android|harmony="{{1}}"
  >
    {{text}}
  </view>
</template>
```

### 5. 隐藏元素

**原平台：**
```css
.hidden {
  display: none;
}
```

**跨平台兼容方案：**

```css
/* display: none 在 RN 平台中可能引发异常，可使用以下样式控制元素隐藏 */
.hidden {
  flex: 0;
  height: 0;
  width: 0;
  padding: 0;
  margin: 0;
  overflow: 'hidden';
}
```

### 6. 文本垂直居中

在 Web 和小程序开发中，经常会使用设置 `line-height` 与容器 `height` 等高的方式来实现文本垂直居中，而在 RN 平台中，`line-height` 的实际表现存在差异，建议使用 `flex` 布局属性来实现文本垂直居中。

**❌ 避免：**
```css
.text-container {
  height: 100px;
  line-height: 100px;
}
```

**✅ 推荐：**
```css
.text-container {
  display: flex;
  align-items: center;
  height: 100px;
}
```

### 7. 渐变中避免使用 transparent

当在渐变中需要使用透明作为过渡色时，建议使用与目标色相同的 `rgba` 透明色（如 `rgba(255,255,255,0)`），而不是直接使用 `transparent`。

因为 RN 中对 `transparent` 的实现是 `rgba(0,0,0,0)`（黑色透明）。当直接用 `transparent` 当做渐变色的色值时，会出现渐变区域发灰（Black Transition），而不是预期的颜色过渡。

**❌ 避免：**
```css
.gradient {
  /* transparent 会导致过渡区域发灰 */
  background: linear-gradient(to left, transparent 0%, #fff 50%, transparent 100%);
}
```

**✅ 推荐：**
```css
.gradient {
  /* 使用 rgba(255,255,255,0) 确保过渡颜色正确 */
  background: linear-gradient(to left, rgba(255,255,255,0) 0%, #fff 50%, rgba(255,255,255,0) 100%);
}
```

### 8. 提取公共样式

对于多个组件复用的样式提取到公共样式文件中，减少包体积开销。

创建公共样式文件：
```css
/* common.css */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

引用公共样式：
```html
<template>
  <view class="page flex-center">
    <text>内容居中</text>
  </view>
</template>

<style>
@import "./common.css";

.page {
  min-height: 100vh;
}
</style>
```
