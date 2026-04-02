## 跨端输出 RN 样式开发最佳实践

## 目录

- [1. 选择器使用建议](#1-选择器使用建议)
  - [1.1 后代选择器/子选择器/交集选择器替代方案](#11-后代选择器子选择器交集选择器替代方案)
    - [1.1.1 后代选择器替代](#111-后代选择器替代)
    - [1.1.2 子选择器替代](#112-子选择器替代)
    - [1.1.3 交集选择器替代](#113-交集选择器替代)
    - [1.1.4 同步更新相关 API](#115-同步更新相关-api)
    - [1.1.5 预处理语言嵌套选择器展开](#116-预处理语言嵌套选择器展开)
  - [1.2 结构伪类替代方案 (:first-child / :last-child / :nth-child / :nth-of-type)](#12-结构伪类替代方案-first-child--last-child--nth-child--nth-of-type)
  - [1.3 伪元素替代方案 (::before / ::after)](#13-伪元素替代方案-before--after)
  - [1.4 相邻兄弟选择器替代方案 (+ / ~)](#14-相邻兄弟选择器替代方案---)
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
- [9. 行内样式的简写属性限制](#9-行内样式的简写属性限制)
- [10. 选择器条件编译注释规则](#10-选择器条件编译注释规则)

### 1. 选择器使用建议

Mpx 输出 RN 时仅支持**单类选择器**、`page` 选择器和 `:host` 选择器，但是大部分不支持的选择器都可以使用单类选择器进行等效替代实现。

Mpx 输出 RN 时通过类名样式映射模拟实现了 CSS 中定义样式的能力，从 RN 平台的技术限制和模拟实现的运行时开销考虑，当前主要支持了**单类选择器**，不支持复杂的选择器类型：

| 不支持的类型 | 示例 |
|-------------|------|
| 后代选择器 | `.parent .child` |
| 子选择器 | `.parent > .child` |
| 交集选择器 | `.classA.classB` |
| 兄弟选择器 | `.item + .sibling` / `.item ~ .siblings` |

为了保证跨端样式表现一致，需要将复杂选择器转换为等效的单类选择器实现。

#### 1.1 后代选择器/子选择器/交集选择器替代方案

##### 1.1.1 后代选择器替代

后代选择器（`.container .item`）用于为嵌套在父元素内的子元素定义样式。RN 不支持此选择器，需要在每个子元素上单独添加类名。

**❌ 避免：**

```css
/* RN 不支持后代选择器 */
.list .item {
  padding: 20rpx;
}
.list .item .title {
  font-size: 32rpx;
}
```

**✅ 推荐：**

```html
<template>
  <view class="list">
    <view class="list-item">
      <text class="list-item-title">标题1</text>
    </view>
    <view class="list-item">
      <text class="list-item-title">标题2</text>
    </view>
  </view>
</template>

<style>
.list-item {
  padding: 20rpx;
}

.list-item-title {
  font-size: 32rpx;
}
</style>
```

当需要根据元素状态动态切换样式时，也要避免使用后代选择器，改为在每个后代元素上单独添加类名。

**❌ 避免：**

```html
<template>
  <view class="list">
    <view wx:for="{{items}}" wx:key="id" class="list-item">
      <text
        class="title"
        wx:class="{{ { 'title-highlight': item.isHighlight } }}"
      >
        {{item.title}}
      </text>
    </view>
  </view>
</template>

<script>
export default {
  data () {
    return {
      items: [
        { id: 1, title: '标题1', isHighlight: true },
        { id: 2, title: '标题2', isHighlight: false },
        { id: 3, title: '标题3', isHighlight: true }
      ]
    }
  }
}
</script>

<style>
.list-item {
  padding: 20rpx;
}
/* ❌ 避免 RN 不支持后代选择器 */
.list-item .title-highlight {
  color: #ff6600;
  font-weight: bold;
}
/* ❌ 避免 RN 不支持后代选择器 */
.list-item .title {
  font-size: 32rpx;
  color: #333;
}
</style>
```

**✅ 推荐：**

```html
<template>
  <view class="list">
    <view wx:for="{{items}}" wx:key="id" class="list-item">
      <text
        class="list-item-title"
        wx:class="{{ { 'list-item-title-highlight': item.isHighlight } }}"
      >
        {{item.title}}
      </text>
    </view>
  </view>
</template>

<script>
export default {
  data () {
    return {
      items: [
        { id: 1, title: '标题1', isHighlight: true },
        { id: 2, title: '标题2', isHighlight: false },
        { id: 3, title: '标题3', isHighlight: true }
      ]
    }
  }
}
</script>

<style>
.list-item {
  padding: 20rpx;
}

.list-item-title {
  font-size: 32rpx;
  color: #333;
}
/* 推荐 */
.list-item-title-highlight {
  color: #ff6600;
  font-weight: bold;
}
</style>
```

##### 1.1.2 子选择器替代

子选择器（`.parent > .child`）仅匹配直接子元素。RN 不支持此选择器，同样需要在直接子元素上添加类名。

**❌ 避免：**

```css
/* RN 不支持子选择器 */
.card > .title {
  font-size: 36rpx;
  font-weight: bold;
}
```

**✅ 推荐：**

```html
<template>
  <view class="card">
    <text class="card-title">卡片标题</text>
    <view class="card-content">内容区域</view>
  </view>
</template>

<style>
.card {
  padding: 20rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
}

.card-content {
  margin-top: 16rpx;
}
</style>
```

当需要根据元素状态动态切换样式时，也要避免使用子选择器，改为在每个子元素上单独添加类名。

**❌ 避免：**
```css
/* RN 不支持子选择器 */
.accordion-icon > .rotate {
  transform: rotate(180deg);
}
```

**✅ 推荐：**

```html
<template>
  <view class="accordion">
    <view class="accordion-header" bindtap="toggle">
      <text class="accordion-title">点击展开</text>
      <text
        class="accordion-icon"
        wx:class="{{ { 'accordion-icon-rotate': isExpanded } }}"
      >▼</text>
    </view>
    <view wx:if="{{isExpanded}}" class="accordion-content">
      展开的内容区域
    </view>
  </view>
</template>

<script>
export default {
  data () {
    return {
      isExpanded: false
    }
  },
  methods: {
    toggle () {
      this.setData({ isExpanded: !this.data.isExpanded })
    }
  }
}
</script>

<style>
.accordion-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f5f5f5;
}

.accordion-title {
  flex: 1;
  font-size: 32rpx;
}

.accordion-icon {
  font-size: 24rpx;
  color: #666;
}
/* 推荐 */
.accordion-icon-rotate {
  transform: rotate(180deg);
}

.accordion-content {
  padding: 20rpx;
  font-size: 28rpx;
}
</style>
```

##### 1.1.3 交集选择器替代

交集选择器（`.base.active`）用于同时匹配具有多个类名的元素。RN 不支持此选择器，需要使用独立的类名组合。

**❌ 避免：**

```css
/* RN 不支持交集选择器 */
.btn.primary {
  background-color: #007aff;
}
.btn.danger {
  background-color: #ff3b30;
}
```

**✅ 推荐：**

```html
<template>
  <view class="btn btn-primary">主要按钮</view>
  <view class="btn btn-danger">危险按钮</view>
</template>

<style>
.btn {
  padding: 16rpx 32rpx;
  border-radius: 8rpx;
}

.btn-primary {
  background-color: #007aff;
  color: #fff;
}

.btn-danger {
  background-color: #ff3b30;
  color: #fff;
}
</style>
```
当需要根据元素状态动态切换样式时，避免使用交集选择器，改为使用独立的组合类名。

**✅ 推荐：**

```html
<template>
  <view
    class="item"
    wx:class="{{ { 'item-active': isActive } }}"
  >
    {{text}}
  </view>
</template>

<style>
.item {
  padding: 20rpx;
}

.item-active {
  color: red;
  background-color: #f0f0f0;
}
</style>
```

##### 1.1.4 同步更新相关 API

**注意：** 替换为单类选择器时，不仅需要更新 `<template>` 和 `<style>` 中的类名引用，还需要同步更新 `<script>` 中涉及的动态类名绑定的字面量，以及使用 `selector` 作为参数的相关 API。

**涉及 API：**
- `createSelectorQuery`
- `createIntersectionObserver`
- `selectComponent`
- `selectAllComponents`

**❌ 避免：**

```javascript
ready() {
  // 使用复合选择器
  this.createSelectorQuery().select('.list .item').boundingClientRect().exec()
  this.createIntersectionObserver().relativeTo('.list').observe('.item.active', () => {})
  this.selectComponent('.list .item')
}
```

**✅ 推荐：**

```javascript
ready() {
  // 使用单类选择器
  this.createSelectorQuery().select('.list-item').boundingClientRect().exec()
  this.createIntersectionObserver().relativeTo('.list').observe('.list-item-active', () => {})
  this.selectComponent('.list-item')
}
```

##### 1.1.5 预处理语言嵌套选择器展开

对于 `sass`、`less`、`stylus` 等支持嵌套选择器写法的预处理语言，在进行 RN 适配前，需要先将嵌套选择器展开铺平为传统的选择器写法。

**❌ 避免（嵌套未展开）：**

```less
.list {
  .item {
    padding: 20rpx;
    &.active {
      color: red;
    }
    .title {
      font-size: 32rpx;
    }
  }
}
```

**✅ 推荐（嵌套已展开）：**

```less
// 展开为单类选择器
.list-item {
  padding: 20rpx;
}

.list-item-active {
  color: red;
}

.list-item-title {
  font-size: 32rpx;
}
```

#### 1.2 结构伪类替代方案 (:first-child / :last-child / :nth-child / :nth-of-type)

RN 平台不支持 CSS 结构伪类选择器（如 `:first-child`, `:last-child`, `:nth-child`, `:nth-of-type`）。应将伪类选择器转换为静态类名等效实现，并在模板中根据数据下标或位置关系动态绑定类名。

**❌ 避免：**

```css
/* RN 不支持结构伪类 */
.item:first-child {
  margin-top: 0;
}
.item:nth-of-type(2) {
  flex-basis: 40%;
}
```

**✅ 推荐（静态类名）：**

```html
<template>
  <view class="form-item form-item-first">
    <!-- 首项 -->
  </view>
  <view class="form-item form-item-second">
    <!-- 第二项 -->
  </view>
  <view class="form-item">
    <!-- 其他项 -->
  </view>
</template>

<style>
.form-item {
  padding: 20rpx;
  border-bottom-width: 1rpx;
}

.form-item-first {
  margin-top: 0;
}

.form-item-second {
  flex-basis: 40%;
}
</style>
```

**✅ 推荐（动态绑定，适用于列表渲染）：**

```html
<template>
  <view
    wx:for="{{list}}"
    wx:key="id"
    class="item"
    wx:class="{{ {
      'item-first': index === 0,
      'item-last': index === list.length - 1,
      'item-even': index % 2 === 0
    } }}"
  >
    {{item.text}}
  </view>
</template>

<style>
.item {
  padding: 20rpx;
}

.item-first {
  margin-top: 0;
}

.item-last {
  margin-bottom: 0;
}

.item-even {
  background-color: #f5f5f5;
}
</style>
```

#### 1.3 伪元素替代方案 (::before / ::after)

RN 平台不支持 `::before` 和 `::after` 伪元素选择器。对于需要使用伪元素添加装饰性内容的需求，应使用模板中的实际节点进行等效替代。

**❌ 避免：**

```css
/* RN 不支持伪元素 */
.title::before {
  content: '';
  width: 10rpx;
  height: 30rpx;
  background-color: blue;
}

.title::after {
  content: '>';
  margin-left: 10rpx;
}
```

**✅ 推荐：**

```html
<template>
  <view class="form-item">
    <!-- 使用实际的 view 节点替代 ::before -->
    <view class="form-item-divider"></view>
    <text class="title">选项内容</text>
    <!-- 使用实际的 text 节点替代 ::after -->
    <text class="title-arrow">></text>
  </view>
</template>

<style>
.form-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
}

.form-item-divider {
  width: 10rpx;
  height: 30rpx;
  background-color: blue;
  margin-right: 10rpx;
}

.title {
  flex: 1;
}

.title-arrow {
  margin-left: 10rpx;
}
</style>
```

#### 1.4 相邻兄弟选择器替代方案 (+ / ~)

RN 平台不支持 CSS 相邻兄弟选择器（`+` 和 `~`）。应将兄弟选择器转换为静态类名等效实现，并通过模板中的位置关系手动添加对应的类名。

**❌ 避免：**

```css
/* RN 不支持相邻兄弟选择器 */
.item + .item {
  margin-top: 10rpx;
}
```

**✅ 推荐：**

```html
<template>
  <view class="form-item form-item-first">
    <text>第一项</text>
  </view>
  <view class="form-item form-item-with-top">
    <text>第二项</text>
  </view>
  <view class="form-item form-item-with-top">
    <text>第三项</text>
  </view>
</template>

<style>
/* 单独定义带顶部间距的类名 */
.form-item {
  padding: 20rpx;
}

.form-item-with-top {
  margin-top: 10rpx;
}
</style>
```

**❌ 避免：**

```html
<template>
  <view wx:if={{isActive}} class="form-item form-item-first">
    <text>第一项</text>
  </view>
  <view class="form-item form-item-with-top">
    <text>第二项</text>
  </view>
</template>

<style>

.form-item-first + .form-item-with-top {
  padding: 20rpx;
}
</style>
```

**✅ 推荐：**

```html
<template>
  <view wx:if={{isActive}} class="form-item form-item-first">
    <text>第一项</text>
  </view>
  <view class="form-item" wx:class="{{{'form-item-with-top': isActive }}}">
    <text>第二项</text>
  </view>
</template>

<style>
.form-item-with-top {
  margin-top: 10rpx;
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

1. **`font-size`** **的百分比**需要传递 `parent-font-size` 辅助属性
2. **`calc()`** **中的百分比**需要传递相应的辅助属性（`calc()` 是框架模拟支持的特性）

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

### 9. 行内样式的简写属性限制

RN 平台中，`style` 属性（以及通过 `wx:style`、组件 props 等方式传入的动态样式）**仅支持 RN 原生简写属性**，Mpx 的编译时展开**不会作用于动态样式**。这是一个非常容易踩坑的限制点。

#### class 类样式 vs style 内联样式的关键区别

| 样式位置 | 简写属性支持 | 说明 |
|---------|------------|------|
| `<style>` class 类样式 | ✅ Mpx 编译时自动展开 | `margin: 10px 20px` → 编译为 `marginTop`/`marginRight` 等 |
| `style` 属性（静态/style binding/组件 props） | ❌ 不支持编译展开 | 需手动使用展开后的独立属性 |

#### 受影响的场景

| 场景 | 示例 |
|------|------|
| 静态 `style` 属性 | `<view style="margin: 10px 20px">` |
| `wx:style` 动态绑定 | `<view wx:style="{{ {margin: '10px 20px'} }}">` |
| 组件 props 传入的样式字符串 | `<child customStyle="margin: 10px; background: red">` |

#### 常见问题示例

**❌ 错误：computed 中返回带简写属性的样式字符串**

```javascript
// 问题：RN 中 style 属性不支持多值 margin、background 简写、box-sizing
const submitBtnStyle = computed(() => {
  return `height: 55px; border-radius: 999px; box-sizing: border-box; background: ${bg};`
})
```

**✅ 正确：统一使用展开后的独立属性（所有平台统一，无需条件编译）**

```javascript
// 使用 RN 兼容的属性写法，rpx 响应式，background-color 展开写法
const submitBtnStyle = computed(() => {
  const bg = isReady.value || isLoading.value ? '#FF6435' : '#D3D6DC'
  return `height: 110rpx; border-radius: 999px; box-sizing: border-box; background-color: ${bg};`
})
```

**❌ 错误：组件样式 props 中使用简写**

```html
<!-- 问题：customStyle 为 style 属性，RN 不支持 background 简写和 box-sizing -->
<submit-order customStyle="height: 55px; border-radius: 999px; box-sizing: border-box; background: #FF6435;" />
```

**✅ 正确：组件 props 样式也使用展开写法**

```html
<submit-order customStyle="height: 110rpx; border-radius: 999px; background-color: #FF6435;" />
```

#### style 属性支持的属性速查

| 属性 | style 属性支持情况 | 推荐替代写法 |
|------|------|------|
| `margin: 10px` | ✅ 单值可用 | — |
| `margin: 10px 20px` | ❌ 不支持 | `marginTop: 10px; marginRight: 20px;` 或 `margin: 10px` |
| `border-radius: 8px` | ✅ 单值可用 | — |
| `border-radius: 8px 4px` | ❌ 不支持 | `borderTopLeftRadius: 8px; borderTopRightRadius: 4px;` |
| `border: 1px solid red` | ❌ 不支持 | `borderWidth: 1px; borderColor: red;` |
| `background: red` | ❌ 不支持 | `background-color: red`（写法更明确） |
| `background: url(...)` | ❌ 不支持 | `background-image: url(...)` |
| `background: linear-gradient(...)` | ❌ 不支持 | `background-image: linear-gradient(...)` |
| `flex: 1` | ✅ | — |

#### 最佳实践总结

1. **尽量所有平台统一**：行内样式中的简写使用 RN 原生支持的写法，在没有对应兼容写法时可采取条件编译。
2. **避免简写**：动态样式中完全不使用 `margin`/`padding` 多值、`border`/`background` 简写等。
3. **明确属性名**：使用 `background-color` 而非 `background`、`marginTop` 而非 `margin` 多值。

### 10. 选择器条件编译注释规则

当使用条件编译包裹 RN 平台不支持的样式时，如果某个 class 选择器内**所有样式属性行都变成注释状态**，则应将 class 选择器行也一起注释掉，避免输出无效的空 class。

#### 规则说明

使用条件编译指令（`@mpx-if` / `@mpx-else` / `@mpx-endif`）包裹不兼容 RN 的样式时，需要注意选择器和样式的注释层级关系。

#### 将 class 选择器行也包裹在条件编译注释内

**❌ 避免：**
```css
.invisible
  /* @mpx-if (!__ISRN__) */
  visibility hidden
  /* @mpx-endif */
```

**✅ 推荐：** 整个 class 块都被条件编译包裹，确保 RN 平台完全排除这些样式。
```css
/* @mpx-if (!__ISRN__) */
.invisible
  visibility hidden
/* @mpx-endif */
```

**✅ 推荐：** 当一个 class 同时包含兼容和不兼容 RN 的样式时，只对不兼容的部分进行条件编译
```css
/* RN 使用 flex 布局隐藏 */
.mask
    /* @mpx-if (!__ISRN__) */
    display none
    /* @mpx-endif */
    /* RN 使用 flex:0 隐藏 */
    flex 0
    width 0
    height 0
```

#### 原因说明

1. **避免无效输出**：当 class 选择器未被注释而所有样式属性都被条件编译排除时，会在 RN 输出产物中产生空的 class 定义，这是不必要的冗余代码。

2. **条件编译指令正常处理**：条件编译指令（`@mpx-if` / `@mpx-endif`）可以被 Mpx 正常识别和处理，而被注释的 class 选择器和样式内容在 CSS 注释中不会生效。

3. **保持产物整洁**：RN 平台的输出产物中不会包含被注释掉的 class 和样式规则。
