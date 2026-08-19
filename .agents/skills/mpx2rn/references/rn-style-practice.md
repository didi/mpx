# 跨端输出 RN 样式开发最佳实践

## 目录

- [选择器使用建议](#选择器使用建议)
  - [复合选择器替换为等效单类选择器](#复合选择器替换为等效单类选择器)
  - [子元素伪类替代方案 (:first-child / :last-child / :nth-child)](#子元素伪类替代方案-first-child--last-child--nth-child)
  - [伪元素选择器替代方案 (::before / ::after)](#伪元素选择器替代方案-before--after)
  - [点击态处理 (:active)](#点击态处理-active)
- [按需样式能力预声明](#按需样式能力预声明)
  - [用户写法与预声明条件](#用户写法与预声明条件)
  - [什么时候需要声明 enable 属性](#什么时候需要声明-enable-属性)
- [样式单位使用建议](#样式单位使用建议)
  - [优先使用 px 和 rpx 单位](#优先使用-px-和-rpx-单位)
  - [使用百分比](#使用百分比)
  - [1 像素边框（极细线）](#1-像素边框极细线)
  - [避免使用不兼容的单位 (rem/em)](#避免使用不兼容的单位-remem)
  - [谨慎使用 font-weight 数值](#谨慎使用-font-weight-数值)
- [布局最佳实践](#布局最佳实践)
  - [使用 Flexbox 布局](#使用-flexbox-布局)
  - [position: sticky 替代方案](#position-sticky-替代方案)
  - [嵌套 fixed 定位](#嵌套-fixed-定位)
  - [处理垂直 margin 折叠](#处理垂直-margin-折叠)
  - [避免使用 Grid 布局](#避免使用-grid-布局)
  - [避免使用 Float 布局](#避免使用-float-布局)
- [文本溢出处理](#文本溢出处理)
- [混排文本 line-height 对齐](#混排文本-line-height-对齐)
- [隐藏元素](#隐藏元素)
- [文本垂直居中](#文本垂直居中)
- [渐变中避免使用 transparent](#渐变中避免使用-transparent)
- [提取公共样式](#提取公共样式)

---

## 选择器使用建议

Mpx 输出 RN 时仅支持**单类选择器**、`page` 选择器和 `:host` 选择器，但是大部分不支持的选择器都可以使用单类选择器进行等效替代实现。

> **关于"单类选择器"的口径**：用逗号分隔的并列写法（如 `.classA, .classB { ... }`）只是多条单类选择器规则共享同一个样式块的语法糖，等价于分别声明 `.classA { ... }` 与 `.classB { ... }`，仍属于**单类选择器**范畴，**可以直接使用**，不要误判为复合选择器去合并或拆分。
>
> ```css
> /* ✅ 支持：逗号并列的多个单类选择器 */
> .classA,
> .classB {
>   color: red;
> }
> ```

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

**支持组件：** `view`、`button`、`navigator`、`cover-view`

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

---

## 按需样式能力预声明

Mpx2RN 的内建 `view` 出于性能考虑，会在首次渲染时检测 CSS 变量、文本样式透传、背景、Hover 和动画等增强能力，并只调用已启用能力所需的 React Hooks。同一组件实例后续可以更新普通样式值，但不能动态改变这些能力的启用状态或动画类型，否则会因 Hook 调用需要保持稳定而触发运行时报错。

### 用户写法与预声明条件

| 能力 | 会启用能力的用户写法 | 动态变更预声明 |
| --- | --- | --- |
| Hover | 存在 `hover-class` | 没有预声明属性，需保证整个生命周期内 `hover-class` 的存在状态稳定，条件分支复用场景使用独立 `key` 重新创建节点 |
| CSS 变量 | 样式中声明普通 `--*` 变量或使用普通 `var(...)`；`--un-*` / `var(--un-*)` 不计入 | CSS 变量声明或使用可能发生动态变更时，添加 `enable-var="{{true}}"` |
| 文本样式与文本属性透传 | 使用 `color`、`letter-spacing`、`line-height`、`include-font-padding`、`writing-direction`、`font-*`、`text-*` 样式，或 `ellipsizeMode`、`numberOfLines` 属性 | 上述文本样式或属性可能发生动态变更时，添加 `enable-text-pass-through="{{true}}"` |
| 背景增强 | 使用 `background-image`、`background-size`、`background-repeat`、`background-position` 或包含这些属性的 `background` 简写；仅使用 `background-color` 不计入 | 上述背景样式可能发生动态变更时，添加 `enable-background="{{true}}"` |
| 动画 | 使用模板 `animation` 属性或 `transition` 样式；CSS `animation` 当前不支持 | 对应写法可能发生动态变更时，API 动画添加 `enable-animation="api"`，transition 添加 `enable-animation="transition"`；同一节点不要切换类型 |

仅普通属性值或样式值发生变化、能力类型始终存在时无需预声明。`enable-fast-image`、`background-color` 和普通布局样式不属于上述预声明条件。

### 什么时候需要声明 enable 属性

存在以下两种动态变更场景时，需要预声明或避免节点复用：

1. **节点自身动态定义相关样式或属性**：当相关能力可能发生动态变更时，添加对应的 `enable-*`。

```html
<!-- dynamicStyle 初始为空，后续可能加入 background-image -->
<view enable-background@ios|android|harmony="{{true}}" wx:style="{{dynamicStyle}}"></view>
```

2. **条件分支节点复用**：相邻条件分支的根节点标签相同且没有独立 `key` 时，分支切换可能复用同一节点。此时可以按各分支的能力并集预声明，更推荐为不同分支声明不同的 `key`，确保切换时不产生复用。

```html
<view
  wx:if="{{hasCompleted}}"
  key@ios|android|harmony="completed"
  hover-class="control-pressed"
>
  <text>Clear completed</text>
</view>
<view wx:else key@ios|android|harmony="placeholder"></view>
```

---

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

### 使用百分比

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

1. **`calc()` 中出现的任何百分比**都需要传递相应的 `parent-width` / `parent-height` 辅助属性（`calc()` 是框架模拟支持的特性）

```html
<template>
  <!-- 场景1：优先通过文本样式继承提供 font-size 百分比基准 -->
  <view class="text-parent">
    <text class="text">文本</text>
  </view>

  <!-- 场景2：仅在无法替代时，calc() 中的百分比需要父级布局宽高辅助计算 -->
  <view id="calc-parent" class="calc-parent" wx:ref>
    <view
      wx:if="{{layoutReady}}"
      class="box"
      parent-width="{{parentWidth}}"
      parent-height="{{parentHeight}}"
    />
  </view>
</template>

<script>
export default {
  data () {
    return {
      parentWidth: 0,
      parentHeight: 0,
      layoutReady: false
    }
  },
  ready() {
    this.createSelectorQuery()
      .select('#calc-parent')
      .boundingClientRect()
      .exec((res) => {
        const rect = res && res[0]
        if (rect) {
          this.parentWidth = rect.width
          this.parentHeight = rect.height
          this.layoutReady = true
        }
      })
  }
}
</script>

<style>
  .text {
    font-size: 120%; /* 优先基于继承字号；无继承字号时按默认字号 16 计算 */
    line-height: 150%; /* 按最终 text 节点合并后的 font-size 计算 */
  }

  .text-large {
    font-size: 160%; /* 与 .text 继承相同 line-height 时，会得到更大的最终行高 */
  }

  .text-parent {
    font-size: 16px;
  }

  .calc-parent {
    width: 100%;
    height: 400rpx;
  }

  .box {
    /* calc() 中的百分比需要辅助属性参与计算 */
    width: calc(50% - 20rpx); /* 需要 parent-width */
    height: calc(30% + 10rpx); /* 需要 parent-height */
    transform: translateX(calc(50% + 10rpx)); /* calc 内含百分比，同样需要 parent-width */
  }
</style>
```

如需使用 `calc() + 百分比`，父级宽高写死时可以直接传入固定的 `parent-width` / `parent-height`。更常见的场景，是使用 `createSelectorQuery()` 等布局查询 API 获取父级真实布局宽高后再传递给使用 `calc()` 的节点；在宽高信息获取完成前，建议先隐藏该节点展示（如使用 `wx:if` 延迟渲染，或使用 `opacity: 0` 隐藏），避免未完成辅助计算时出现闪动或错误布局。

这种兼容写法会带来一定的性能与体验开销。一般不建议使用 `calc() + 百分比`，优先考虑 RN 原生支持的百分比布局、Flex 布局、rpx / vw / vh 或固定尺寸表达；仅在确实无法替代时使用该兼容写法。

**最佳实践：**

1. **优先使用 rpx**：对于固定尺寸，rpx 是最可靠的选择
2. **放心使用百分比**：`width`, `height`, `padding`, `margin` 等属性的百分比由 RN 原生支持，可以放心使用
3. **谨慎使用 calc() 中的百分比**：该写法需要 `parent-width` / `parent-height` 辅助计算，通常还要查询父级布局并延迟展示，存在性能与体验开销；优先使用原生百分比、Flex、rpx / vw / vh 或固定尺寸替代
4. **使用 vh/vw**：对于视口相关的尺寸，vh/vw 是更好的选择

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

---

## 布局最佳实践

### 使用 Flexbox 布局

Flexbox 是跨平台最可靠的布局方式。

> **注意：**`view` 显式声明 `display: flex` 且未声明 `flex-direction` 时，Mpx2RN 会在内部补充 `flex-direction: row`，以对齐 W3C Flexbox 的默认行为；否则沿用 RN 默认的 `display: flex` + `flex-direction: column`，模拟 W3C 块级元素纵向流式布局的表现。

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

### text 跨平台布局对齐

原平台（小程序 / Web）中 `view` 默认为流式布局，`text` 等行内元素会排列在同一行；而 RN 中 `view` 默认使用纵向 Flex 布局（`flex-direction: column`），子元素会各占一行。例如：

```html
<view>
  <text>a</text>
  <text>b</text>
</view>
```

在原平台中 a 和 b 渲染在同一行，但在 RN 中会渲染为两行。为拉齐跨平台表现，建议在 `view` 中显式声明布局方向，不要依赖平台默认行为：

```html
<style>
  .container {
    display: flex;
    flex-direction: row;
  }
</style>

<template>
  <view class="container">
    <text>a</text>
    <text>b</text>
  </view>
</template>
```

如需将多段文字渲染为同一行且保持文本流式排版（如自动换行、基线对齐），可在拉齐容器布局的基础上，再进行一层 `text` 包裹，让内部的 `text` 进行行内布局：

```html
<template>
  <view class="container">
    <text>
      <text>a</text>
      <text>b</text>
    </text>
  </view>
</template>
```

### position: sticky 替代方案

Mpx2RN 不支持 `position: sticky`。不要直接使用 `position: fixed` 替代：`fixed` 相对页面固定且不占据原布局空间，无法实现 `sticky` 滚动到阈值后吸顶并受滚动容器边界约束的行为。

需要在滚动容器内实现吸顶时，使用 [`scroll-view`](./rn-template-reference.md#scroll-view) + [`sticky-header`](./rn-template-reference.md#sticky-header) 组件替代。`sticky-header` 必须是 `scroll-view` 的直接子节点，或作为 `sticky-section` 的直接子节点；RN 环境还必须在 `scroll-view` 上显式开启 `enable-sticky`。该属性是 RN 环境特有能力，应使用属性后缀将其限定在 RN 平台。

**❌ 避免：**RN 不支持通过 `position: sticky` 实现吸顶。

```html
<template>
  <scroll-view class="page-scroll" scroll-y>
    <view class="summary">概览内容</view>
    <view class="filter-bar">筛选条件</view>
    <view class="list">列表内容</view>
  </scroll-view>
</template>

<style>
  .page-scroll {
    flex: 1;
  }

  .filter-bar {
    position: sticky;
    top: 0;
  }
</style>
```

**✅ 推荐：**用 `sticky-header` 表达吸顶节点，并为 RN 侧开启 sticky 能力。

```html
<template>
  <scroll-view
    class="page-scroll"
    scroll-y
    enable-sticky@ios|android|harmony="{{true}}"
  >
    <view class="summary">概览内容</view>
    <sticky-header offset-top="{{0}}">
      <view class="filter-bar">筛选条件</view>
    </sticky-header>
    <view class="list">列表内容</view>
  </scroll-view>
</template>

<style>
  .page-scroll {
    flex: 1;
  }

  .filter-bar {
    background-color: #fff;
  }
</style>
```

存在多组吸顶区域时，可将 [`sticky-section`](./rn-template-reference.md#sticky-section) 作为 `scroll-view` 的直接子节点，再把 `sticky-header` 放在对应的 `sticky-section` 内。需要注意：

1. `sticky-header` / `sticky-section` 目前仅支持 RN、Web 和微信小程序 Skyline；还需输出其他平台时，应通过条件编译保留该平台原有的吸顶实现。
2. RN Android 下更适合内容稳定、状态不频繁更新的吸顶区域；吸顶动画过程中立即更新状态、滚动内容高度突变，或通过 `scroll-into-view` / `scroll-top` 主动改变滚动位置时，可能出现闪烁或抖动。

### 嵌套 fixed 定位

Mpx2RN 中 `position: fixed` 不是由 RN 原生定位直接承载，而是通过 portal 将 fixed 节点提升到 page root 下，再使用 `position: absolute` 模拟固定定位。因此模板中嵌套的 fixed 节点，在 RN 视图实现层会变成 page root 下的兄弟节点，无法继续保持原模板里的父子关系。

这会影响依赖父子关系的能力，常见问题包括：

1. **层级不再由父子关系兜底**：外层 fixed 声明了较高的 `z-index`，内层 fixed 未声明 `z-index` 时，RN 侧提升后的外层节点可能遮挡内层节点。
2. **不要依赖事件冒泡穿透父级**：内层 fixed 已不再是外层 fixed 的真实子节点，依赖父子关系的事件冒泡、统一拦截或关闭逻辑可能与原平台表现不一致。

**❌ 避免：**内层 fixed 依赖外层 fixed 的层级上下文与事件冒泡。

```html
<template>
  <view class="mask" bindtap="close">
    <view class="panel">
      <view class="toast" bindtap="handleToastTap">提示内容</view>
    </view>
  </view>
</template>

<style>
  .mask {
    position: fixed;
    z-index: 1000;
  }

  .toast {
    position: fixed;
  }
</style>
```

**✅ 推荐：**嵌套 fixed 需要覆盖外层 fixed 时，在内层显式声明更高的 `z-index`；事件逻辑上避免依赖从内层 fixed 冒泡到外层 fixed，可分别绑定明确的处理函数，或通过共享状态 / 自定义事件完成联动。

```html
<template>
  <view class="mask" bindtap="closeMask">
    <view class="panel">
      <view class="toast" catchtap="handleToastTap">提示内容</view>
    </view>
  </view>
</template>

<style>
  .mask {
    position: fixed;
    z-index: 1000;
  }

  .toast {
    position: fixed;
    z-index: 1001;
  }
</style>
```

### 处理垂直 margin 折叠

小程序 / Web 的普通块级布局中，满足 CSS margin 折叠条件的节点关系可能发生垂直 `margin` 折叠：相邻兄弟元素、父元素与首个 / 末个流内后代、空块自身的上下 margin 都可能折叠。CSS margin 折叠只发生在垂直方向，水平方向的 `margin-left` / `margin-right` 不受影响。具体条件参考 [MDN · 掌握外边距折叠](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Box_model/Margin_collapsing)。

RN 基于 Yoga 布局，没有 BFC 和 margin 折叠概念。输出 RN 时，`marginTop` / `marginBottom` 会作为节点自身间距参与布局，相邻节点的垂直 margin 通常会叠加。因此适配普通块级布局中满足 margin 折叠条件的节点关系时，需要显式处理原平台发生的 margin 折叠，避免同一组 margin 在 RN 中产生更大的间距。

**先确认会折叠，再改造：**不要仅因两个垂直 margin 同时存在就归到单侧。按节点关系应用下表；命中任一“不要处理”条件，或无法确认原平台会发生折叠时，保留原 margin。

| 节点关系 | 确认会折叠 | 反向约束：以下情况不要处理 |
| --- | --- | --- |
| 相邻兄弟 | 最终渲染结果中相邻的普通块级兄弟，前项 `margin-bottom` 与后项 `margin-top` 之间没有其他内容 | 共享父容器为 Flex / Grid；任一节点浮动或使用 `position: absolute/fixed`；后一节点因 `clear` 产生 clearance；条件渲染后并不相邻 |
| 父元素与首个流内后代 | 两者的 `margin-top` 之间没有父元素的 `border-top`、`padding-top`、行内内容或 clearance，且父元素未建立新 BFC | 存在任一左述分隔条件；父元素通过 `overflow: hidden/auto/scroll`、`display: flow-root` 等建立 BFC；父元素为 Flex / Grid 容器 |
| 父元素与末个流内后代 | 两者的 `margin-bottom` 之间没有父元素的 `border-bottom`、`padding-bottom`，父元素没有明确 `height` / `min-height`，且未建立新 BFC | 存在任一左述分隔条件；父元素通过 `overflow: hidden/auto/scroll`、`display: flow-root` 等建立 BFC；父元素为 Flex / Grid 容器 |
| 空块自身 | `margin-top` 与 `margin-bottom` 之间没有 `border`、`padding`、行内内容、`height` 或 `min-height` | 存在任一左述分隔条件 |

`overflow: hidden/auto/scroll` 建立 BFC 后，会阻止父元素自身 margin 与其后代 margin 跨父子边界折叠；但该父元素的外边距是否与相邻兄弟折叠，仍须按“相邻兄弟”一行独立判断，不能仅凭 `overflow` 排除。

折叠后的值也不能一律用 `max()` 计算：两侧均为非负值时取较大值；同时存在正负 margin 时，取最大正值与最小负值之和；全部为负值时取最小值（绝对值最大的负值）。

**推荐处理原则：**

1. **容器边界间距由父容器单侧表达**：外部间距使用父容器 margin，内部留白使用父容器 padding，不要依赖首个 / 末个子节点的 margin 与父容器折叠。
2. **兄弟节点间距只交给一侧负责**：按模板顺序逐对检查普通块级布局中满足 margin 折叠条件的相邻兄弟节点，同时识别 `margin` 简写隐含的 `margin-top` / `margin-bottom`。将原平台折叠后的有效间距完整放在任意一侧，另一侧删除或置 `0`；常见的两侧非负 margin 场景取两者较大值，例如 `24rpx` 与 `12rpx` 归为单侧 `24rpx`，两侧均为 `20rpx` 时归为单侧 `20rpx`。不要因为 `margin` 属性本身受 RN 支持就跳过这项布局语义检查。
3. **用模板状态标记首尾项**：需要去掉首项或末项间距时，用 `wx:class` + `index` 显式绑定单类。
4. **必要时可显式声明纵向 Flex**：如果容器内仍存在难以拆解的垂直 margin 关系，可在确认不影响原布局的前提下，同时声明 `display: flex` 与 `flex-direction: column`，使原平台子节点也作为 flex item 参与布局，避免垂直 margin 折叠；若已通过 `padding` 和单侧 margin 明确处理间距，则不必额外添加 flex 声明。

注意，Mpx 输出 RN 时，如果显式声明了 `display: flex` 但未声明 `flex-direction`，会自动补充 `flex-direction: row` 与小程序 / Web 对齐。为了保持原本块级纵向布局，选择添加 flex 声明时必须同步声明 `flex-direction: column`。

**❌ 避免：**下例使用普通块级布局，其中“父元素与首个子元素”和“两个相邻兄弟元素”这两组节点关系均满足 margin 折叠条件。原平台中 `.card` 与标题的顶部 margin 折叠为 `24rpx`，标题和说明的相邻垂直 margin 也会折叠；RN 中这些 margin 会分别参与布局，父子顶部间距会叠加为 `44rpx`。

```html
<template>
  <view class="card">
    <view class="card-title">标题</view>
    <view class="card-desc">说明</view>
  </view>
</template>

<style>
  .card {
    margin-top: 20rpx;
  }

  .card-title {
    margin-top: 24rpx;
    margin-bottom: 16rpx;
  }

  .card-desc {
    margin-top: 12rpx;
  }
</style>
```

**✅ 推荐：**把父子顶部折叠后的 `24rpx` 外部间距归给 `.card` 的 `margin-top`，把标题和说明之间的间距交给单侧节点，跨端都会得到明确且稳定的布局结果。

```html
<template>
  <view class="card">
    <view class="card-title">标题</view>
    <view class="card-desc">说明</view>
  </view>
</template>

<style>
  .card {
    margin-top: 24rpx;
  }

  .card-desc {
    margin-top: 16rpx;
  }
</style>
```

**列表场景：**

```html
<template>
  <view class="list">
    <view
      wx:for="{{items}}"
      wx:key="id"
      class="list-item"
      wx:class="{{ { 'list-item-gap': index > 0 } }}"
    >
      {{item.text}}
    </view>
  </view>
</template>

<style>
  .list {
    padding-top: 24rpx;
    padding-bottom: 24rpx;
  }

  .list-item-gap {
    margin-top: 16rpx;
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

---

## 文本溢出处理

### 溢出打点（text-overflow: ellipsis）

**原平台：**

```html
<template>
  <text class="text">{{text}}</text>
  <view class="text">{{text}}</view>
</template>

<style>
  .text {
    overflow: hidden;
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
  .text {
    overflow: hidden;
    /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
    white-space: nowrap;
    text-overflow: ellipsis;
    /* @mpx-endif */
  }
</style>
```

### 溢出截断（text-overflow: clip）

**原平台：**

```html
<template>
  <text class="text">{{text}}</text>
  <view class="text">{{text}}</view>
</template>

<style>
  .text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: clip;
  }
</style>
```

**跨平台兼容方案：**

```html
<template>
  <!-- RN 平台内使用 numberOfLines + ellipsizeMode="clip" 实现等效裁剪效果 -->
  <text class="text" numberOfLines@ios|android|harmony="{{1}}" ellipsizeMode@ios|android|harmony="clip">{{text}}</text>
  <!-- numberOfLines + ellipsizeMode 也可用于 view -->
  <view class="text" numberOfLines@ios|android|harmony="{{1}}" ellipsizeMode@ios|android|harmony="clip">{{text}}</view>
</template>

<style>
  .text {
    overflow: hidden;
    /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
    white-space: nowrap;
    text-overflow: clip;
    /* @mpx-endif */
  }
</style>
```

---

## 混排文本 line-height 对齐

W3C 行内排版中，同一行内混排不同字号文字时，整行高度会按该行中最大的 `line-height` 计算；RN 原生文本排版会以首个子 `Text` 元素的 `lineHeight` 作为整行行高基准。典型问题是价格、单位、标签等混排场景里，小字号文字排在大字号前面时，首个子 `text` 继承父级的小字号行高，RN 会按该行高计算整行高度，导致后面的大字号片段被较小行高约束。

Mpx2RN 在文本样式继承与 `line-height` 计算口径上对齐 W3C，但 RN 在嵌套 `Text` 混排场景中的实际行盒渲染行为与 W3C 不一致，不会按同一行内最大的 `line-height` 撑开整行。因此处理同一行多字号混排时，不要让内外层分别维护多套行高；应取消内层片段的所有 `line-height` 设置，只在承载整行文本流的外层 `text` 上显式声明整行期望行高，取该行各片段中的最大行高。

**❌ 避免：**在内层不同字号片段上分别声明 `line-height`。这种写法把整行行高拆散到多个片段上，首个子 `text` 会继承父级小字号行高，RN 会以首个子 `Text` 的行高排版整行，也会让后续维护者误以为内层最大行高会自动影响外层。

```html
<template>
  <text class="price-line">
    <text>到手价 </text>
    <text class="price-amount">99</text>
    <text> 元</text>
  </text>
</template>

<style>
  .price-line {
    font-size: 24rpx;
    line-height: 32rpx; /* 首个子 text 继承父行高，RN 整行以 32rpx 为准 */
  }

  .price-amount {
    font-size: 48rpx;
    line-height: 56rpx; /* 该大行高不会撑开整行，RN 仍以首个子 text 继承到的 32rpx 为准 */
  }
</style>
```

**✅ 推荐：**外层 `text` 承载同一行文本流，并显式声明整行期望行高；内层 `text` 只声明自身字号等片段样式，不再设置 `line-height`。下例中整行最大行高按大字号片段取 `56rpx`，因此只在外层 `.price-line` 声明 `line-height: 56rpx`。

```html
<template>
  <text class="price-line">
    <text>到手价 </text>
    <text class="price-amount">99</text>
    <text> 元</text>
  </text>
</template>

<style>
  .price-line {
    font-size: 24rpx;
    line-height: 56rpx;
  }

  .price-amount {
    font-size: 48rpx;
  }
</style>
```

如果原样式中内层使用百分比或 unit-less 倍率表达相对行高，迁移到混排场景时先换算出整行需要的最大行高，再统一写到外层。不要在内层继续保留相对 `line-height`，避免 RN 按片段各自字号计算出多套行高。

---

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

---

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

---

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

---

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
