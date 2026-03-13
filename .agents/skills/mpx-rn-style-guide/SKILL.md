---
name: mpx-rn-style-guide
description: Mpx 跨端输出 RN 的样式能力说明与实践建议；当用户询问 Mpx 跨端输出 RN 样式相关问题时调用。
---

# Mpx 跨端输出 RN 样式开发指南

## 概述

Mpx 是一个增强型跨端框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）和 React Native 平台。由于小程序和 RN 在样式系统上存在本质差异，Mpx 在编译时和运行时对样式进行了不同的处理。本文档详细描述 Mpx 输出 RN 时的样式能力支持、与小程序平台的差异，以及跨平台开发的最佳实践。

## 跨平台样式适配改造

### 强约束条件

对已有的 Mpx 组件进行跨平台样式适配改造时，需要严格遵循以下约束条件：

1. style 区块中的所有选择器必须全部改造为 RN 平台支持的选择器类型，仅允许包含**单类选择器**、`page` 选择器和 `:host` 选择器
2. 对于不兼容的样式属性，**必须通过条件编译局部保留原样式属性**，同时添加 todo 注释信息提示用户手动处理
3. **禁止出现大块的条件编译**，仅在必要时局部使用，保持代码的可读性和维护性
4. **保留样式定义中/*use rpx*/和/*use px*/注释**，用于编译期间批量切换样式单位

### 适配改造检查项

对已有的 Mpx 组件进行跨平台样式适配改造后，需要执行并通过以下全部检查项：

- [ ] style 区块中不包含 RN 平台不支持的选择器类型，仅允许包含**单类选择器**、`page` 选择器和 `:host` 选择器
- [ ] 所有 RN 平台中不兼容的样式属性都必须被条件编译局部保留，避免输出到 RN 平台，并且包含 todo 注释信息
- [ ] 禁止出现大块的条件编译，仅在必要时局部使用，保持代码的可读性和维护性

## RN 与小程序平台的样式能力差异

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
| 基础布局（Flexbox） | ✅ 支持 | ✅ 完整支持 |
| Grid 布局 | ⚠️ [存在兼容方案](#42-避免使用-Grid-布局) | ✅ 部分平台支持 |
| Float 布局 | ⚠️ [存在兼容方案](#43-避免使用-Float-布局) | ✅ 完整支持 |
| 隐藏（display: none） | ⚠️ [存在兼容方案](#6-隐藏元素) | ✅ 完整支持 |
| 定位（position） | ✅ relative, absolute, fixed | ✅ 完整支持（含 sticky） |
| 层级（z-index） | ✅ 支持 | ✅ 完整支持 |
| 垂直对齐（vertical-align） | ⚠️ iOS 不支持 | ✅ 完整支持 |
| 尺寸（width/height） | ✅ 长度单位（px, rpx, vw, vh）, %, auto | ✅ 完整支持 |
| 极值尺寸（min/max-*） | ✅ 长度单位（px, rpx, vw, vh）, %, auto | ✅ 完整支持 |
| 间距（margin/padding） | ✅ 长度单位（px, rpx, vw, vh）, %, auto | ✅ 完整支持 |
| 边框宽度（border-width） | ✅ 支持 | ✅ 完整支持 |
| 边框颜色（border-color） | ✅ 支持 | ✅ 完整支持 |
| 边框样式（border-style） | ✅ solid, dotted, dashed | ✅ 完整支持 |
| 边框圆角（border-radius） | ⚠️ 仅支持单值 | ✅ 完整支持 |
| 文本颜色（color） | ✅ 支持 | ✅ 完整支持 |
| 字体（font-*） | ✅ size, weight, style, family | ✅ 完整支持 |
| 文本对齐（text-align） | ✅ left, right, center, justify | ✅ 完整支持 |
| 行高（line-height） | ✅ 支持（数值自动转 %） | ✅ 完整支持 |
| 文本装饰（text-decoration） | ✅ text-decoration-line | ✅ 完整支持 |
| 文本转换（text-transform） | ✅ uppercase, lowercase, capitalize | ✅ 完整支持 |
| 文本溢出（text-overflow） | ⚠️ [存在兼容方案](#5-文本溢出处理) | ✅ 完整支持 |
| 空白处理（white-space） | ⚠️ [存在兼容方案](#5-文本溢出处理) | ✅ 完整支持 |
| CSS 动画（@keyframes） | ❌ 暂不支持 | ✅ 完整支持 |
| CSS 过渡（transition） | ⚠️ 部分支持 | ✅ 完整支持 |
| 变换（transform） | ⚠️ 部分支持 | ✅ 完整支持 |
| 变换原点（transform-origin） | ✅ 支持 | ✅ 完整支持 |
| 溢出（overflow） | ✅ visible, hidden, scroll | ✅ 完整支持 |
| 透明度（opacity） | ✅ 支持 | ✅ 完整支持 |
| 阴影（box-shadow） | ✅ 支持 | ✅ 完整支持 |
| 滤镜（filter）| ✅ brightness, opacity | ✅ 部分平台支持 |
| 背景颜色（background-color） | ✅ 支持 | ✅ 完整支持 |
| 背景图（background-image） | ✅ url(), linear-gradient() | ✅ 完整支持 |
| 背景图尺寸（background-size） | ✅ contain, cover, auto, 数值 | ✅ 完整支持 |
| 背景图重复（background-repeat） | ⚠️ 仅支持 no-repeat | ✅ 完整支持 |
| 背景图定位（background-position） | ✅ 支持 | ✅ 完整支持 |
| 多重背景 | ❌ 不支持 | ✅ 完整支持 |
| 渐变背景 | ✅ linear-gradient | ✅ 完整支持 |

**RN 平台特有限制：**
- **不支持的属性**：`caret-color`、`font-variant-*`（如 `font-variant-caps` 等）
- **transition 限制**：不支持 `transition-property: all` 和 `transition: all ...`
- **background 限制**：除 `background-color` 外仅 `view` 组件支持；`background-repeat` 仅支持 `no-repeat`
- **transform 限制**：不支持 `translateZ`、`scaleZ`、`translate3d`、`scale3d`、`rotate3d`、`matrix3d`

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
- RN 平台在运行时计算 rpx、vw、vh
- RN 平台的 px 会转换为无单位数值

### 4. 样式格式对比

| 特性 | RN 平台 | 小程序平台 |
|-----|---------|-----------|
| 样式编写 | CSS 语法 | CSS 语法（WXSS） |
| 样式文件 | `.mpx` 文件中的 `<style>` | `.wxss` 文件 |
| 媒体查询 | ✅ 有限支持（width/min-width/max-width，单位仅支持 px） | ✅ 支持 |
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

**RN 平台特有限制：**
- 简写属性在编译时展开，因此 `style` 内联样式中不支持使用简写属性，仅在 `class` 类样式定义中支持

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
/* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
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

#### 3.1 优先使用 px 和 rpx 单位

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

#### 4.3 避免使用 Float 布局

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

### 5 文本溢出处理

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

### 6. 隐藏元素

**小程序平台：**
```css
.hidden {
  display: none;
}
```

**跨平台兼容方案：**

```css
/* display: none 在 RN 平台中可能引发异常，可使用以下样式控制元素隐藏 */
{
  flex: 0;
  height: 0;
  width: 0;
  padding: 0;
  margin: 0;
  overflow: 'hidden';
}
```

### 7. 背景处理最佳实践

#### 7.1 背景颜色

跨平台完全兼容：
```css
.container {
  background-color: #fff;
}
```

#### 7.2 背景图片

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

#### 7.3 渐变背景

**✅ 推荐：**
```css
.gradient {
  background-image: linear-gradient(to bottom, #fff, #f0f0f0);
}
```

### 8. 变换和动画最佳实践

#### 8.1 Transform 变换

**✅ 推荐使用的变换：**
```css
.box {
  transform: translateX(10rpx) translateY(20rpx);
  transform: scale(1.2);
  transform: rotate(45deg);
  transform-origin: center top;
}
```

**❌ 避免使用：**
```css
.box {
  transform: translateZ(10rpx);  /* RN 不支持 */
  transform: rotate3d(1, 1, 1, 45deg);  /* RN 不支持 */
}
```

#### 8.2 动画处理

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

### 9. 提取公共样式

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


### 10. 条件编译

需要实现跨平台难以兼容的样式效果时，局部使用条件编译进行分平台定义是一个好的选择。

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

## RN 平台样式能力详情

如需进一步了解 RN 平台的样式能力支持详情，请参考 [RN 平台样式能力详情](./reference/rn-style-detail.md)。

## 总结

Mpx 框架在 RN 和小程序平台上提供了强大的样式支持，但由于平台特性差异，开发者需要注意以下关键点：

**RN 平台限制：**
1. 仅支持单类选择器、`page` 选择器和 `:host` 选择器
2. 不支持 CSS animation（@keyframes），但支持 CSS transition 和 Animation API
3. 部分 CSS 属性不支持

**跨平台开发建议：**
1. 使用单类选择器
2. 使用 Flexbox 布局
3. 避免使用不兼容的 CSS 属性
4. 合理使用条件编译
5. 充分测试目标平台

通过遵循本文档的最佳实践，可以编写出高质量的跨平台样式代码，实现一套代码多端运行的目标。
