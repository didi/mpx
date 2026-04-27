# 跨端输出 RN 样式开发最佳实践

## 目录

- [选择器使用建议](#选择器使用建议)
  - [复合选择器替换为等效单类选择器](#复合选择器替换为等效单类选择器)
  - [子元素伪类替代方案 (:first-child / :last-child / :nth-child)](#子元素伪类替代方案-first-child--last-child--nth-child)
  - [伪元素选择器替代方案 (::before / ::after)](#伪元素选择器替代方案-before--after)
  - [点击态处理 (:active)](#点击态处理-active)
- [样式单位使用建议](#样式单位使用建议)
  - [优先使用 px 和 rpx 单位](#优先使用-px-和-rpx-单位)
  - [百分比用于相对布局](#百分比用于相对布局)
  - [1 像素边框（极细线）](#1像素边框极细线)
  - [避免使用不兼容的单位 (rem/em)](#避免使用不兼容的单位-remem)
  - [谨慎使用 font-weight 数值](#谨慎使用-font-weight-数值)
- [布局最佳实践](#布局最佳实践)
  - [使用 Flexbox 布局](#使用-flexbox-布局)
  - [避免使用 Grid 布局](#避免使用-grid-布局)
  - [避免使用 Float 布局](#避免使用-float-布局)
- [文本溢出处理](#文本溢出处理)
- [隐藏元素](#隐藏元素)
- [文本垂直居中](#文本垂直居中)
- [渐变中避免使用 transparent](#渐变中避免使用-transparent)
- [提取公共样式](#提取公共样式)

## 选择器使用建议

Mpx 输出 RN 时仅支持**单类选择器**、`page` 选择器和 `:host` 选择器，但是大部分不支持的选择器都可以使用单类选择器进行等效替代实现。

### 复合选择器替换为等效单类选择器

Mpx 输出 RN 时通过类名样式映射模拟实现了 CSS 中定义样式的能力，从 RN 平台的技术限制和模拟实现的运行时开销考虑，当前主要支持了**单类选择器**，不支持复合选择器（如后代选择器 `.a .b`、交集选择器 `.a.b` 等）。

通常来说，复合选择器会基于视图结构作用于特定元素，在 Mpx 中，视图模板通常是静态的，我们可以结合视图模板的定义结构将其替换为等效的单类选择器，保证跨端样式表现一致。

#### 父子选择器

**`.a > .b`**：只匹配父节点下一层的子节点。在**直接子节点**上声明一个专用类名，把原父子关系编码进类名语义即可。

**❌ 避免：**RN 不支持 `.list > .item` 等组合选择器。下方为原平台中与该规则配套的常见结构：只有「挂在 `.list` 下的第一层 `.item`」需要缩进；内层仍用 `.item` 表示行，外面用非 `.item` 的 `item-group` 包裹，避免内层行误为 `.list` 的直接子级。

```html
<template>
  <view class="list">
    <view class="item">第一层行（.list 的直接子级）</view>
    <view class="item-group">
      <view class="item">分组内行（.item 非 .list 直接子级）</view>
    </view>
  </view>
</template>

<style>
  .list > .item {
    padding-left: 24rpx;
  }
</style>
```

**✅ 推荐：**去掉组合选择器，把「仅直接子级需要的那套样式」收拢到一个单类上，只绑在真正需要缩进的那一层节点上。

```html
<template>
  <view class="list">
    <view class="list-top-item">第一层行</view>
    <view class="item-group">
      <view class="item">分组内行</view>
    </view>
  </view>
</template>

<style>
  .list-top-item {
    padding-left: 24rpx;
  }
</style>
```

#### 后代选择器

**`.a .b`**：匹配祖先下任意深度的后代。用**命中该样式的那一层节点**上的单类表达「在某容器语境下」的样式。

**❌ 避免：**

```html
<template>
  <view class="page">
    <view class="header">
      <text class="title">标题</text>
    </view>
  </view>
</template>

<style>
  .page .title {
    font-size: 36rpx;
  }
</style>
```

**✅ 推荐：**在真正需要大字号的节点上使用语境类名（或业务语义类名）。

```html
<template>
  <view class="page">
    <view class="header">
      <text class="page-title">标题</text>
    </view>
  </view>
</template>

<style>
  .page-title {
    font-size: 36rpx;
  }
</style>
```

#### 相邻兄弟选择器

**`.a + .b`**：只匹配紧跟在前的兄弟。用列表下标、数据状态等在模板里**显式标出「第二个及以后」或「紧跟在 A 后的 B」**，再绑定单类。

**❌ 避免：**

```html
<template>
  <view class="list">
    <view class="row">第一行</view>
    <view class="row">第二行起依赖相邻兄弟选择器增加顶间距</view>
  </view>
</template>

<style>
  .row + .row {
    margin-top: 16rpx;
  }
</style>
```

**✅ 推荐：**

```html
<template>
  <view
    wx:for="{{rows}}"
    wx:key="id"
    class="row"
    wx:class="{{ { 'row-follow-row': index > 0 } }}"
  >
    {{item.text}}
  </view>
</template>

<style>
  .row-follow-row {
    margin-top: 16rpx;
  }
</style>
```

#### 后续兄弟选择器

**`.a ~ .b`**：匹配同一父级下、**位于某节点之后的所有符合条件的兄弟**。RN 无法用一条 CSS 表达该结构关系，需在脚本中维护布尔量或给受影响节点打标，用单类控制显示或样式。

**❌ 避免：**依赖 RN 不支持的 **`.error ~ .field-hint`**（有错误节点在前的兄弟关系时把说明文字标红）。

```html
<template>
  <view class="field">
    <input class="input" />
    <text wx:if="{{showError}}" class="error">格式错误</text>
    <text class="field-hint">填写说明</text>
  </view>
</template>

<style>
  .error ~ .field-hint {
    color: #ff4d4f;
  }
</style>
```

**✅ 推荐：**同一套视图与数据（`showError` 控制是否渲染错误文案），改为在说明文字上用 **`wx:class` 绑定单类** 表达标红，不再依赖后续兄弟选择器。

```html
<template>
  <view class="field">
    <input class="input" />
    <text wx:if="{{showError}}" class="error">格式错误</text>
    <text class="field-hint" wx:class="{{ { 'field-hint-error': showError } }}">填写说明</text>
  </view>
</template>

<style>
  .field-hint-error {
    color: #ff4d4f;
  }
</style>
```

#### 交集选择器

**`.a.b`**：匹配同时包含多个类名的元素。合并为一个**新的单类**（如 `btn-primary`）。

**❌ 避免：**

```html
<template>
  <view class="btn primary">主要按钮</view>
</template>

<style>
  .btn.primary {
    background-color: #1677ff;
  }
</style>
```

**✅ 推荐：**

```html
<template>
  <!-- 合并「按钮 + 主色」语义为单一类名，避免样式里写 .btn.primary -->
  <view class="btn-primary">主要按钮</view>
</template>

<style>
  .btn-primary {
    background-color: #1677ff;
  }
</style>
```

若基础按钮样式多处复用，可仍用单类选择器拆成 `.btn`、`.btn-primary` 等规则，由模板用 `class` / `wx:class` 组合绑定（每条样式仍只对应**单类选择器**）；核心是避免在 CSS 中写 `.btn.primary` 这类交集链式选择器。

#### 同步更新 `<script>` 中的 selector

将复合选择器替换为单类选择器时，不仅需要更新 `<template>` 和 `<style>` 中的类名引用，还需要同步更新 `<script>` 中涉及的动态类名绑定的字面量，以及使用 `selector` 作为参数的相关 API（小程序中主要包括：`createSelectorQuery`、`createIntersectionObserver`、`selectComponent` 和 `selectAllComponents`）。

**示例：**样式由 `.page .title` 改为模板上的单类 `page-title` 后，脚本里所有依赖旧选择器字符串的地方都要改成**与模板 `class` 一致的单类**。

```html
<template>
  <view class="page" id="page-root">
    <text class="page-title">{{title}}</text>
  </view>
</template>

<script>
export default {
  methods: {
    measureTitle() {
      // 勿再使用 '.page .title' 等复合选择器
      this.createSelectorQuery()
        .select('.page-title')
        .boundingClientRect()
        .exec()
    },
    watchTitleVisible() {
      this.createIntersectionObserver()
        .relativeTo('#page-root')
        .observe('.page-title', () => {})
    },
    focusInner() {
      // 子组件/自定义节点查询同理：'.toolbar .icon-btn' → '.toolbar-icon-btn'
      this.selectComponent('.toolbar-icon-btn')
      this.selectAllComponents('.list-row-item')
    }
  }
}
</script>
```

### 子元素伪类替代方案 (:first-child / :last-child / :nth-child)

RN 平台不支持 CSS 子元素伪类选择器（如 `:first-child`, `:last-child`, `:nth-child`）。建议在模版中通过数据下标 (`index`) 判断来动态应用样式类。

**❌ 避免：**

```html
<template>
  <view wx:for="{{list}}" wx:key="id" class="item">{{item.text}}</view>
</template>

<style>
  /* RN 不支持结构伪类 */
  .item:first-child {
    margin-top: 0;
  }
</style>
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
  /* 单独定义首项样式 */
  .first-item {
    margin-top: 0;
  }
</style>
```

### 伪元素选择器替代方案 (::before / ::after)

RN 平台不支持 `::before` 和 `::after` 伪元素选择器。对于需要在元素前后添加装饰性内容的需求，应使用真实的组件节点进行等效替代。

**❌ 避免：**容器 `.title-row` 内先出现「左侧色条」再跟标题文案。把色条画在 **`.title-row::before`**，RN 不支持伪元素。

```html
<template>
  <view class="title-row">
    <text class="title">标题内容</text>
  </view>
</template>

<style>
  /* RN 不支持伪元素：用容器 ::before 模拟「行首装饰块」 */
  .title-row::before {
    content: "";
    width: 10rpx;
    height: 30rpx;
    background-color: blue;
    margin-right: 10rpx;
  }
</style>
```

**✅ 推荐：**同一套 `title-row` + `title` 文案，将 **`.title-row::before` 等价替换为 `view.title-decorator`**（色条尺寸与间距与上例一致）。

```html
<template>
  <view class="title-row">
    <view class="title-decorator"></view>
    <text class="title">标题内容</text>
  </view>
</template>

<style>
  .title-decorator {
    width: 10rpx;
    height: 30rpx;
    background-color: blue;
    margin-right: 10rpx;
  }
</style>
```

### 点击态处理 (:active)

RN 平台不支持 `:active` 伪类选择器，如需实现点击态样式，可以使用 `hover-class` 组件属性进行跨端兼容实现。

**支持组件：** `view`、`button`、`navigator`

**❌ 避免：**

```html
<template>
  <view class="btn">点击我</view>
</template>

<style>
  /* RN 不支持 :active 伪类 */
  .btn:active {
    opacity: 0.8;
    background-color: #f5f5f5;
  }
</style>
```

**✅ 推荐：**

```html
<template>
  <!-- 使用 hover-class 指定点击态样式类 -->
  <!-- hover-stay-time 指定手指松开后点击态保留时间，单位毫秒 -->
  <view class="btn" hover-class="btn-hover" hover-stay-time="{{100}}">
    点击我
  </view>
</template>

<style>
  /* 定义点击态样式 */
  .btn-hover {
    opacity: 0.8;
    background-color: #f5f5f5;
  }
</style>
```

## 样式单位使用建议

### 优先使用 px 和 rpx 单位

px 和 rpx 在 RN 与小程序平台都具备良好兼容性，建议优先使用；其中 rpx 适合响应式尺寸，px 适合固定尺寸。

**✅ 推荐：**

```html
<template>
  <view class="container">内容区域</view>
</template>

<style>
  .container {
    width: 750rpx;
    height: 200rpx;
    padding: 20px;
    font-size: 28rpx;
  }
</style>
```

### 百分比用于相对布局

百分比单位在 RN 平台的处理分为两类：**React Native 原生支持的百分比**和**框架特殊处理的百分比**。

**✅ 推荐使用场景：**

```html
<template>
  <!-- 场景1：宽高与内外边距百分比 -->
  <view class="container">
    <!-- 场景2：Flex 子项宽度百分比 -->
    <view class="row">
      <view class="item">左</view>
      <view class="item">右</view>
    </view>
  </view>
</template>

<style>
  /* 场景1：宽度和高度百分比（RN 原生支持） */
  .container {
    width: 100%;
    height: 50%;
    padding: 5%;
    margin: 10%;
  }

  /* 场景2：Flexbox 中的相对布局 */
  .row {
    display: flex;
    flex-direction: row;
  }

  .item {
    width: 50%; /* 在 flex 容器中表现良好 */
  }
</style>
```

**⚠️ 需要辅助属性的场景：**

1. **`font-size` 的百分比**需要传递 `parent-font-size` 辅助属性
2. **`calc()` 中的百分比**需要传递相应的辅助属性（`calc()` 是框架模拟支持的特性）

```html
<template>
  <!-- 场景1：font-size 百分比需要 parent-font-size -->
  <view parent-font-size="{{16}}" class="text" />

  <!-- 场景2：calc() 中的百分比需要辅助属性 -->
  <view parent-width="{{750}}" parent-height="{{1000}}" class="box" />
</template>

<style>
  .text {
    font-size: 120%; /* 需要 parent-font-size */
  }

  .box {
    /* calc() 中的百分比需要辅助属性 */
    width: calc(50% - 20rpx); /* 需要 parent-width */
    height: calc(30% + 10rpx); /* 需要 parent-height */

    /* calc() 中的 translateX/Y 百分比会自动测量 */
    transform: translateX(calc(50% + 10rpx)); /* 自动测量元素 width */
  }
</style>
```

**❌ 避免的场景：**

```html
<template>
  <text class="text-bad">不推荐：字号用百分比（易漏 parent-font-size）</text>
  <text class="text-good">推荐：字号用 rpx</text>
  <view class="box-bad">不推荐：calc 内百分比缺辅助属性</view>
  <view class="box-good">推荐：calc 内用 rpx</view>
</template>

<style>
  /* 避免：字体大小使用百分比 */
  .text-bad {
    font-size: 120%; /* 需要 parent-font-size，容易出错 */
  }

  /* 推荐：使用 rpx */
  .text-good {
    font-size: 32rpx;
  }

  /* 避免：calc() 中使用百分比但不传递辅助属性 */
  .box-bad {
    width: calc(50% - 20rpx); /* 需要 parent-width，否则会报错 */
  }

  /* 推荐：使用 rpx */
  .box-good {
    width: calc(375rpx - 20rpx);
  }
</style>
```

**最佳实践：**

1. **优先使用 rpx**：对于固定尺寸，rpx 是最可靠的选择
2. **放心使用百分比**：`width`, `height`, `padding`, `margin` 等属性的百分比由 RN 原生支持，可以放心使用
3. **避免字体百分比**：`font-size` 的百分比需要辅助属性，建议使用 rpx 代替
4. **谨慎使用 calc() 中的百分比**：`calc()` 是框架模拟支持的，其中的百分比需要辅助属性，建议在 `calc()` 中使用 rpx 代替百分比
5. **使用 vh/vw**：对于视口相关的尺寸，vh/vw 是更好的选择

<span id="1像素边框极细线"></span>

### 1 像素边框（极细线）

在移动端开发中，常需要实现物理像素为 1px 的极细边框。

**原平台：** 使用 `1rpx` 可以很好地在不同设备上呈现细边框。

**RN 平台：** 使用 `hairlineWidth` 常量来实现平台最细边框。

**✅ 推荐写法（使用条件编译）：**

```html
<template>
  <view class="border">带极细边框的区域</view>
</template>

<style>
  .border {
    border-style: solid;
    border-color: #e5e5e5;
    /* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
    border-width: hairlineWidth;
    /* @mpx-else */
    border-width: 1rpx;
    /* @mpx-endif */
  }
</style>
```

### 避免使用不兼容的单位 (rem/em)

RN 不支持 `rem` 和 `em` 单位。需将其转换为 `rpx` 以实现响应式布局。

**转换说明：** `rpx` 是小程序和 Mpx RN 的响应式单位（规定屏幕宽为 750rpx）。若原项目使用 `rem` 进行响应式适配，通常存在固定的换算比例。例如：

- 若设定 `1rem = 100px` (基于 750px 设计稿)，则 `1rem = 100rpx`。
- 若基于浏览器默认字号 (`16px`)，则 `1rem = 32rpx` (1px = 2rpx)。

**❌ 避免：**

```html
<template>
  <view class="text">使用 rem/em 的示例</view>
</template>

<style>
  .text {
    width: 2rem; /* RN 不支持 */
    font-size: 1.2rem; /* RN 不支持 */
  }
</style>
```

**✅ 推荐（转换为 rpx）：**

```html
<template>
  <view class="text">转换为 rpx 的示例</view>
</template>

<style>
  .text {
    /* 假设转换比例 1rem = 100rpx */
    width: 200rpx;
    font-size: 120rpx;
  }
</style>
```

### 谨慎使用 font-weight 数值

由于 RN 平台数值类型的 `font-weight`（如 `400`, `500`, `700`）在不同系统和字体下的渲染表现，与小程序/Web 平台往往存在差异，容易导致跨端 UI 不一致。

**建议：** 尽量使用 `normal` 或 `bold` 关键字来控制字体粗细，以获得更稳定一致的跨平台表现。

**❌ 避免：**

```html
<template>
  <text class="text-normal">常规字重</text>
  <text class="text-bold">加粗字重</text>
</template>

<style>
  .text-normal {
    font-weight: 400; /* 跨端表现可能不一致 */
  }

  .text-bold {
    font-weight: 700; /* 跨端表现可能不一致 */
  }
</style>
```

**✅ 推荐：**

```html
<template>
  <text class="text-normal">常规字重</text>
  <text class="text-bold">加粗字重</text>
</template>

<style>
  .text-normal {
    font-weight: normal;
  }

  .text-bold {
    font-weight: bold;
  }
</style>
```

## 布局最佳实践

### 使用 Flexbox 布局

Flexbox 是跨平台最可靠的布局方式。

**✅ 推荐：**

```html
<template>
  <view class="container">
    <view class="row">
      <view class="item">A</view>
      <view class="item">B</view>
    </view>
  </view>
</template>

<style>
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
</style>
```

### 避免使用 Grid 布局

Grid 布局在 RN 平台不支持。

**❌ 避免：**

```html
<template>
  <view class="container">
    <view class="item">栅格列 1</view>
    <view class="item">栅格列 2</view>
  </view>
</template>

<style>
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
</style>
```

**替代方案：**

```html
<template>
  <view class="container">
    <view class="item">等宽列 1</view>
    <view class="item">等宽列 2</view>
  </view>
</template>

<style>
  .container {
    display: flex;
    flex-wrap: wrap;
  }

  .item {
    width: 50%;
  }
</style>
```

### 避免使用 Float 布局

`float` 在 RN 平台不支持，不应作为布局方案使用。

**❌ 避免：**

```html
<template>
  <view class="page">
    <view class="left">左栏</view>
    <view class="right">右栏</view>
  </view>
</template>

<style>
  .left {
    float: left;
    width: 50%;
  }

  .right {
    float: right;
    width: 50%;
  }
</style>
```

**替代方案：**

```html
<template>
  <view class="container">
    <view class="left">左栏</view>
    <view class="right">右栏</view>
  </view>
</template>

<style>
  .container {
    display: flex;
    flex-direction: row;
  }

  .left,
  .right {
    width: 50%;
  }
</style>
```

## 文本溢出处理

**原平台：**

```html
<template>
  <text class="text">{{text}}</text>
</template>

<style>
  .text {
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
```

**跨平台兼容方案：**

```html
<template>
  <!-- RN 平台内使用模板属性条件编译添加 numberOfLines 属性进行等效实现-->
  <text class="text" numberOfLines@ios|android|harmony="{{1}}"> {{text}} </text>

  <!-- numberOfLines 也可用于 view -->
  <view class="text" numberOfLines@ios|android|harmony="{{1}}"> {{text}} </view>
</template>

<style>
  /* 原平台内使用样式条件编译保留原有样式定义 */
  /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
  .text {
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  /* @mpx-endif */
</style>
```

## 隐藏元素

**❌ 避免：**

```html
<template>
  <view class="hidden">需要隐藏的内容</view>
</template>

<style>
  /* display: none 在 RN 平台中可能引发异常 */
  .hidden {
    display: none;
  }
</style>
```

**✅ 推荐：**

```html
<template>
  <view class="hidden">需要隐藏的内容</view>
</template>

<style>
  /* 可使用以下样式替代控制元素隐藏 */
  .hidden {
    flex: 0;
    height: 0;
    width: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }
</style>
```

## 文本垂直居中

在 Web 和小程序开发中，经常会使用设置 `line-height` 与容器 `height` 等高的方式来实现文本垂直居中，而在 RN 平台中，`line-height` 的实际表现存在差异，建议使用 `flex` 布局属性来实现文本垂直居中。

**❌ 避免：**

```html
<template>
  <view class="text-container">
    <text>垂直居中示例</text>
  </view>
</template>

<style>
  .text-container {
    height: 100px;
    line-height: 100px;
  }
</style>
```

**✅ 推荐：**

```html
<template>
  <view class="text-container">
    <text>垂直居中示例</text>
  </view>
</template>

<style>
  .text-container {
    display: flex;
    align-items: center;
    height: 100px;
  }
</style>
```

## 渐变中避免使用 transparent

当在渐变中需要使用透明作为过渡色时，建议使用与目标色相同的 `rgba` 透明色（如 `rgba(255,255,255,0)`），而不是直接使用 `transparent`。

因为 RN 中对 `transparent` 的实现是 `rgba(0,0,0,0)`（黑色透明）。当直接用 `transparent` 当做渐变色的色值时，会出现渐变区域发灰（Black Transition），而不是预期的颜色过渡。

**❌ 避免：**

```html
<template>
  <view class="gradient"></view>
</template>

<style>
  .gradient {
    /* transparent 会导致过渡区域发灰 */
    background: linear-gradient(
      to left,
      transparent 0%,
      #fff 50%,
      transparent 100%
    );
  }
</style>
```

**✅ 推荐：**

```html
<template>
  <view class="gradient"></view>
</template>

<style>
  .gradient {
    /* 使用 rgba(255,255,255,0) 确保过渡颜色正确 */
    background: linear-gradient(
      to left,
      rgba(255, 255, 255, 0) 0%,
      #fff 50%,
      rgba(255, 255, 255, 0) 100%
    );
  }
</style>
```

## 提取公共样式

对于多个组件复用的样式提取到公共样式文件中，减少包体积开销。

公共样式可放在独立文件 `common.css`（内容与下方 `.flex-center` 规则一致），在页面/组件中通过 `@import` 引用。

**示例（单文件内联等价写法；实际项目可将 `.flex-center` 迁至 `common.css` 后保留 `@import`）：**

```html
<template>
  <view class="page flex-center">
    <text>内容居中</text>
  </view>
</template>

<style>
  /* common.css 中可仅保留下列工具类 */
  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .page {
    min-height: 100vh;
  }

  /* 拆文件后改为：@import "./common.css"; */
</style>
```
