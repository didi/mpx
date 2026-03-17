## 跨端输出 RN 样式开发最佳实践

## 目录

- [1. 样式单位使用建议](#1-样式单位使用建议)
  - [1.1 优先使用 px 和 rpx 单位](#11-优先使用-px-和-rpx-单位)
  - [1.2 百分比用于相对布局](#12-百分比用于相对布局)
  - [1.3 1像素边框（极细线）](#13-1像素边框极细线)
  - [1.4 避免使用不兼容的单位 (rem/em)](#14-避免使用不兼容的单位-remem)
  - [1.5 谨慎使用 font-weight 数值](#15-谨慎使用-font-weight-数值)
- [2. 布局最佳实践](#2-布局最佳实践)
  - [2.1 使用 Flexbox 布局](#21-使用-flexbox-布局)
  - [2.2 避免使用 Grid 布局](#22-避免使用-grid-布局)
  - [2.3 避免使用 Float 布局](#23-避免使用-float-布局)
- [3. 文本溢出处理](#3-文本溢出处理)
- [4. 隐藏元素](#4-隐藏元素)
- [5. 文本垂直居中](#5-文本垂直居中)
- [6. 渐变中避免使用 transparent](#6-渐变中避免使用-transparent)
- [7. 子元素伪类替代方案 (:first-child / :last-child / :nth-child)](#7-子元素伪类替代方案-first-child--last-child--nth-child)
- [8. 伪元素选择器替代方案 (::before / ::after)](#8-伪元素选择器替代方案-before--after)
- [9. 点击态处理](#9-点击态处理)
- [10. 使用条件编译](#10-使用条件编译)
  - [10.1 样式条件编译](#101-样式条件编译)
  - [10.2 模版条件编译](#102-模版条件编译)
- [11. 提取公共样式](#11-提取公共样式)

### 1. 样式单位使用建议

#### 1.1 优先使用 px 和 rpx 单位

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

#### 1.2 百分比用于相对布局

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

#### 1.3 1像素边框（极细线）

在移动端开发中，常需要实现物理像素为 1px 的极细边框。

**小程序平台：**
使用 `1rpx` 可以很好地在不同设备上呈现细边框。

**RN 平台：**
使用 `hairlineWidth` 常量来实现平台最细边框。

**✅ 推荐写法（使用条件编译）：**

```css
.border {
  border-style: solid;
  border-color: #e5e5e5;
  /* @mpx-if (__mpx_mode__ === 'wx') */
  border-width: 1rpx;
  /* @mpx-endif */
  /* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
  border-width: hairlineWidth;
  /* @mpx-endif */
}
```

#### 1.4 避免使用不兼容的单位 (rem/em)

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

#### 1.5 谨慎使用 font-weight 数值

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

### 2. 布局最佳实践

#### 2.1 使用 Flexbox 布局

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

#### 2.2 避免使用 Grid 布局

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

#### 2.3 避免使用 Float 布局

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

### 3. 文本溢出处理

**小程序平台：**
```css
.text {
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

**跨平台兼容方案：**
```html
<style>
/* 小程序平台内使用样式条件编译保留原有样式定义 */
/* @mpx-if (__mpx_mode__ === 'wx') */
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

### 4. 隐藏元素

**小程序平台：**
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

### 5. 文本垂直居中

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

### 6. 渐变中避免使用 transparent

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

### 7. 子元素伪类替代方案 (:first-child / :last-child / :nth-child)

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

### 8. 伪元素选择器替代方案 (::before / ::after)

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

### 9. 点击态处理

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

### 10. 使用条件编译

对于跨平台无法兼容的样式，局部使用条件编译进行分平台定义是可以接受的。

#### 10.1 样式条件编译

```html
<style>
/* 微信小程序 */
/* @mpx-if (__mpx_mode__ === 'wx') */
.container {
  padding-top: 88rpx; /* 包含导航栏高度 */
}
/* @mpx-endif */

/* RN 平台 */
/* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
.container {
  padding-top: 0; /* RN 自行处理安全区域 */
}
/* @mpx-endif */
</style>
```

#### 10.2 模版条件编译

```html
<template>
  <!-- 属性维度条件编译：仅在 RN 平台注入 numberOfLines -->
  <text
    class="title"
    numberOfLines@ios|android|harmony="{{1}}"
  >
    {{title}}
  </text>
</template>
```

```html
<template>
  <!-- 节点维度条件编译：节点仅在指定平台输出 -->
  <view @ios|android|harmony class="rn-only">仅 RN 可见</view>
  <view @wx class="wx-only">仅微信小程序可见</view>

  <!-- 使用 @_mode 仅做节点显隐，仍保留属性语法跨平台转换 -->
  <view @_ali bindtap="handleTap">仅 ali 输出，且属性继续参与语法转换</view>
</template>
```

### 11. 提取公共样式

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


