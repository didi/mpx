# WebView → Skyline 适配改造最佳实践

## 目录

- [判断当前渲染模式](#判断当前渲染模式)
- [skyline 配置](#skyline-配置)
- [布局适配](#布局适配)
  - [默认 Flex 布局差异处理](#默认-flex-布局差异处理)
  - [不要依赖 BFC 和 margin 合并](#不要依赖-bfc-和-margin-合并)
  - [Inline/Inline-Block 替代方案](#inlineinline-block-替代方案)
  - [页面滚动替代方案](#页面滚动替代方案)
  - [z-index 与层叠适配](#z-index-与层叠适配)
  - [sticky 吸顶替代方案](#sticky-吸顶替代方案)
  - [scroll-view 高度自适应](#scroll-view-高度自适应)
- [样式适配](#样式适配)
  - [CSS 属性值不支持替代](#css-属性值不支持替代)
  - [不支持的 CSS 属性](#不支持的-css-属性)
  - [渐变与背景多值限制](#渐变与背景多值限制)
  - [filter / backdrop-filter 限制](#filter--backdrop-filter-限制)
  - [选择器适配](#选择器适配)
  - [伪元素适配（单冒号→双冒号）](#伪元素适配单冒号双冒号)
  - [伪类适配](#伪类适配)
  - [单位适配](#单位适配)
  - [overflow 适配](#overflow-适配)
  - [box-sizing 差异处理](#box-sizing-差异处理)
  - [文本溢出省略适配](#文本溢出省略适配)
  - [字体 PostScript name 兼容](#字体-postscript-name-兼容)
  - [@font-face 仅支持 ttf 格式](#font-face-仅支持-ttf-格式)
  - [伪元素 animation 不支持的处理](#伪元素-animation-不支持的处理)
  - [其他属性适配](#其他属性适配)
- [组件适配](#组件适配)
  - [不支持组件的替代方案](#不支持组件的替代方案)
  - [scroll-view 行为差异](#scroll-view-行为差异)
  - [横向 scroll-view 适配](#横向-scroll-view-适配)
  - [list-view / grid-view 适配](#list-view--grid-view-适配)
  - [嵌套滚动适配](#嵌套滚动适配)
  - [自定义组件样式隔离](#自定义组件样式隔离)
  - [组件根节点表现异常](#组件根节点表现异常)
  - [navigator 嵌套限制](#navigator-嵌套限制)
- [Scroll API 适配](#scroll-api-适配)
  - [ScrollViewContext：必须开启 enhanced 属性](#scrollviewcontext必须开启-enhanced-属性)
  - [worklet.scrollViewContext：必须通过 ref 获取](#workletscrollviewcontext必须通过-ref-获取)
  - [worklet.scrollViewContext.scrollTo：调用函数必须声明 'worklet' 指令](#workletscrollviewcontextscrollto调用函数必须声明-worklet-指令)
  - [DraggableSheetContext：size 和 pixels 不可同时传入](#draggablesheetcontextsize-和-pixels-不可同时传入)
- [Worklet 动画适配](#worklet-动画适配)
  - [worklet 函数必须声明 'worklet' 指令](#worklet-函数必须声明-worklet-指令)
  - [SharedValue 必须通过 .value 读写](#sharedvalue-必须通过-value-读写)
  - [在 worklet 中调用普通函数必须使用 runOnJS](#在-worklet-中调用普通函数必须使用-runonjs)
  - [页面方法必须通过 bind(this) 绑定后传入 runOnJS](#页面方法必须通过-bindthis-绑定后传入-runonjs)
  - [禁止在 worklet 中解构 this](#禁止在-worklet-中解构-this)
- [glass-easel 变更点适配](#glass-easel-变更点适配)
  - [[必须] 模板转义改为标准 XML 转义](#必须-模板中数据绑定外的转义改为标准-xml-转义)
  - [[必须] 不再支持 wx-if / wx-for](#必须-不再支持-wx-if--wx-for仅支持-wxif--wxfor)
  - [[必须] wx:for 内嵌 include 改为 template](#必须-wxfor-内嵌-include-时改为-template)
  - [[推荐] 用 this.createSelectorQuery 替代 wx.createSelectorQuery](#推荐-用-thiscreateselectorquery-替代-wxcreateselectorquery)
  - [[必须] SelectorQuery 选择器不再支持以数字开头](#必须-selectorquery-选择器不再支持以数字开头)
  - [[必须·仅 Skyline] Worklet 回调函数名称变更](#必须仅-skyline-worklet-回调函数名称变更)
  - [[必须·仅 Skyline] 不支持的组件实例方法](#必须仅-skyline-不支持的组件实例方法)
- [常见问题与踩坑记录](#常见问题与踩坑记录)
  - [properties 默认值必须使用 value 而非 default](#properties-默认值必须使用-value-而非-default)
  - [The for-list data is neither Array nor Object 报错](#the-for-list-data-is-neither-array-nor-object-报错)
  - [properties type 校验报错](#properties-type-校验报错)
  - [animation API 不支持 → 使用 CSS transition](#animation-api-不支持--使用-css-transition)
  - [movable-area / movable-view 替代方案](#movable-area--movable-view-替代方案)
  - [wxs 跨包引用错误](#wxs-跨包引用错误typeerror-rwxsstringify4ccc0480-is-not-a-function)
  - [SVG 在 Skyline 下的限制与适配](#svg-在-skyline-下的限制与适配)
  - [flex 布局的子节点文本超出未自动换行](#flex-布局的子节点文本超出未自动换行)
  - [@media screen 替换为动态类](#media-screen-替换为动态类)

---

## 判断当前渲染模式

在页面或组件实例上可读取 `renderer` 成员，取值为 `webview` 或 `skyline`。如果在模板中要判断，可以拿到值后设置到 data 上。

在生命周期（如 `onLoad`）中赋值到 data，供模板使用：

```js
// 选项式 API
createPage({
  onLoad() {
    this.setData({ isSkyline: this.renderer === 'skyline' })
  }
})
```

```js
// setup script
import { getCurrentInstance, onMounted } from '@mpxjs/core'

const instance = getCurrentInstance()
const renderer = instance.proxy.renderer

onMounted(() => {
  console.log('当前 renderer:', renderer)
})
```


## skyline 配置

Skyline 不支持默认导航也不支持页面滚动，故支持 Skyline 的页面都需要声明**禁止滚动**和**自定义导航**。

**如有同时支持输出支付宝，为了对齐微信和支付宝的表现，页面也需增加支付宝 json 配置**： 为了避免 ali 和 wx 下要处理两套不一样的导航和滚动逻辑，统一使用 scroll-view 替代页面滚动，自定义导航替代默认导航。

```json5
{
  // skyline页面 json 配置
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "disableScroll": true,
  "navigationStyle": "custom",
  // 支付宝页面 json 配置，注意有输出支付宝小程序才需要加
  "titlePenetrate": "YES",
  "transparentTitle": "always"
}
```

```json5
// 全局配置
{
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "enableScrollViewAutoSize": true
    }
  }
}
```

## 布局适配

### 默认 Flex 布局差异处理

Skyline 下节点默认为 `display: flex` 布局，WebView 下默认为 `display: block`，这导致 WebView 下正常排列的元素在 Skyline 下表现为 Flex 行为，可在 `app.json` 或 `page.json` 中配置 `rendererOptions`，将 Skyline 默认布局改为 block。

### 不要依赖 BFC 和 margin 合并

Skyline 没有 BFC（块级格式化上下文），也没有 margin 合并机制：相邻节点的垂直 `margin` 总是相加，`overflow: hidden` 不会创建 BFC 隔离子节点的 margin。WebView 上依赖 margin 合并或 BFC hack 得到的最终间距，在 Skyline 下会出现叠加，需改为显式、单向地定义间距归属。

**适配原则**：

1. **容器外沿空间用父容器 `padding` 表达**：不要依赖首项 / 末项 margin 与父容器合并。
2. **兄弟节点间距只交给一侧负责**：列表项之间统一使用后一项的 `margin-top` 或前一项的 `margin-bottom`，避免双向 margin 叠加。
3. **首尾项差异化用模板状态标记**：需要去掉首项或末项间距时，用 `wx:class` + `index` 显式绑定单类。
4. **不要把 BFC hack 当作 Skyline 布局手段**：`overflow: hidden` 在 Skyline 中仅用于裁剪，不再具备隔离 margin 的副作用。
5. **必要时显式声明纵向 Flex**：容器内仍存在难以拆解的垂直 margin 关系时，可同时声明 `display: flex` 与 `flex-direction: column`,使子节点作为 flex item 参与布局,进一步避免垂直 margin 合并。

```html
<!-- ❌ Bad — 依赖 overflow: hidden 创建 BFC 隔离父子 margin 合并 -->
<view class="card">
  <view class="card-title">标题</view>
  <view class="card-desc">说明</view>
</view>

<!-- ✅ Good — 父容器 padding 表达外沿空间,兄弟间距交给单侧节点 -->
<view class="card">
  <view class="card-title">标题</view>
  <view class="card-desc">说明</view>
</view>
```

```css
/* ❌ Bad */
.card { overflow: hidden; }
.card-title { margin-top: 24rpx; margin-bottom: 16rpx; }
.card-desc { margin-top: 12rpx; }

/* ✅ Good */
.card { padding-top: 24rpx; }
.card-desc { margin-top: 16rpx; }
```

**列表场景**：用 `index > 0` 标记非首项,只对非首项加 `margin-top`：

```html
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
```

```css
.list { padding-top: 24rpx; padding-bottom: 24rpx; }
.list-item-gap { margin-top: 16rpx; }
```

### inline/inline-block 替代方案

> 保留多行文本省略场景下的 `display -webkit-box` 布局，webview 实现多行文本省略需要

Skyline 不支持 `display: inline` 和 `display: inline-block` 布局

优先使用**flex 布局替代**：使用 `flex-direction: row` + `align-items: center` 实现内联效果

若为**多段文本**场景：使用 `<text>` 组件包裹

```html
<text>文本1</text>
<text>文本2</text>
```

若为**图文混排**：文本与图片混合内联，使用 `<span>` 组件

```html
<!-- 使用 span 的条件编译方式 -->
<view  mpxTagName@wx="span">
  <image src="icon.png" style="width:16px;height:16px;" />
  <text>更多文字</text>
</view>
```

### 页面滚动替代方案

Skyline 不支持页面滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发。需要滚动的页面必须使用 `scroll-view` 替代页面滚动，页面 json 同时声明 `disableScroll: true`。

```html
<scroll-view type="list" style="height:100%" show-scrollbar="{{false}}" scroll-y="true">
  <!-- 页面内容 -->
</scroll-view>
```

**原页面生命周期需迁移到 scroll-view 对应事件**（不要只删不补，否则下拉刷新/触底加载/滚动监听等业务逻辑会静默失效）：

| 原页面生命周期 | scroll-view 事件 | 备注 |
| --- | --- | --- |
| `onPullDownRefresh` | `bindrefresherrefresh` | 需同时开 `refresher-enabled` |
| `onReachBottom` | `bindscrolltolower` | 可配合 `lower-threshold` 调阈值 |
| `onPageScroll(e.scrollTop)` | `bindscroll(e.detail.scrollTop)` | 高频事件，按需节流 |

WebView 直接对齐 Skyline 写法（统一走 scroll-view 事件），避免双份实现带来的维护成本与行为漂移。

```html
<scroll-view
  type="list"
  scroll-y="true"
  enhanced="true"
  refresher-enabled="{{true}}"
  bindrefresherrefresh="onRefresh"
  bindscrolltolower="onLoadMore"
  bindscroll="onScroll"
>
  <!-- 页面内容 -->
</scroll-view>
```

```js
createPage({
  onRefresh() {
    // 原 onPullDownRefresh 的逻辑
  },
  onLoadMore() {
    // 原 onReachBottom 的逻辑
  },
  onScroll(e) {
    const scrollTop = e.detail.scrollTop  // 原 onPageScroll 的 e.scrollTop
  }
})
```

### z-index 与层叠适配

Skyline 没有层叠上下文（stacking-context）的概念，替换为两种机制：**normal-context**（非 fixed 节点）和 **fixed-context**（fixed 节点）。

**核心差异**：

| 机制 | WebView | Skyline |
| --- | --- | --- |
| 层叠上下文 | 有，子节点 z-index 在不同层叠上下文间不可比较 | 无，z-index 直接在兄弟节点间比较 |
| fixed 节点 | 参与正常层叠上下文 | 全局提升到 fixed-context，层级永远高于 normal-context |
| z-index 比较规则 | 向上找到兄弟层叠上下文再比较 | 直接向上找直接父级 → 兄弟元素 z-index 比较 |
| 相同 z-index | 层叠水平顺序决定 | DOM 靠后的层级更高 |

**normal-context 机制**：

```
      a
   b      c
   ↓      ↓
   d      e
   ↓      ↓
   f      g
```

比较 f 和 g 的层级时，直接比较 b 和 c 的 z-index，谁更大谁的子元素层级就更高。如果 z-index 相同，DOM 元素靠后的层级更高。

**fixed-context 机制**：

无论 fixed 节点的父子层级，在全局范围内统一提升到 fixed-context 上渲染，DOM 形式保持不变，但渲染形式变成兄弟节点，然后依靠 z-index 进行排序。

```
fixed-a (z-index: 2)
  fixed-b (z-index: 3)
    fixed-c (z-index: 1)
  fixed-d (未设置 → 0)
fixed-e (z-index: 4)

渲染层级排序：fixed-d(0) < fixed-c(1) < fixed-a(2) < fixed-b(3) < fixed-e(4)
```

**适配方案**：

1. 将需要层级控制的节点重构为兄弟节点结构
2. 避免依赖层叠上下文机制实现层级控制（如用 `transform` / `opacity` 开启层叠上下文的技巧在 Skyline 下不生效）

### sticky 吸顶替代方案

`position: sticky` 在 Skyline 下不可用，使用 `sticky-header` / `sticky-section` 组件替代：

```html
<scroll-view type="list" scroll-y="true">
  <sticky-section>
    <sticky-header>吸顶标题</sticky-header>
    <view>列表内容</view>
  </sticky-section>
</scroll-view>
```

**结构约束**：

- `sticky-header` 必须是 `sticky-section` 的**第一个子节点**；每个 `sticky-section` 仅允许一个 `sticky-header`。
- `sticky-section` 必须放在 `scroll-view type="custom"` 或 `type="list"` 内（不可裸用）。
- `sticky-header` **必须显式声明背景色**（`background` / `background-color`）。Skyline 下 `sticky-header` 默认透明，吸顶时下层列表内容会透字穿透，常见症状是"吸顶后文字与列表叠在一起"。

```html
<sticky-header style="background: #fff;">吸顶标题</sticky-header>
```
或在样式表中：

```css
.sticky-title { background: #fff; }
```


### scroll-view 高度自适应

Skyline 下 scroll-view 默认不会自动根据内容撑开，需配置 `enableScrollViewAutoSize` 开启自动撑开。

- **全局配置**：8.0.54+ 可配置 `enableScrollViewAutoSize` 开启自动撑开

**动态获取方案（getScrollViewHeight）**

适用场景：scroll-view 内容高度不固定，或需在弹窗、浮层中限制 scroll-view 最大高度并自适应内容。

原理：在内容渲染后通过 `createSelectorQuery` 查询内容节点的实际高度，将结果写入 style 绑定到 scroll-view。

```ts
// useSkyline.ts — 工具函数
import { nextTick, ref } from '@mpxjs/core'

export function getScrollViewHeight(context: Obj, query: string, defaultHeight = 0) {
  // height 初始为空（或传入兜底高度），格式为内联 style 字符串
  const height = ref(defaultHeight ? `height:${defaultHeight}px;` : '')

  const updateHeight = () => {
    // 必须在 nextTick 后查询，确保内容已渲染到 DOM
    nextTick(() => {
      context.createSelectorQuery()
        .select(query)
        .boundingClientRect((rect: Obj) => {
          height.value = `height:${Math.ceil(rect?.height || 0)}px;`
        })
        .exec()
    })
  }

  return { height, updateHeight }
}
```

```ts
// 组件 setup 中使用（仅 Skyline 模式下启用）
import isSkyline, { getScrollViewHeight } from 'useSkyline'

const context = useContext()

// isSkyline() 为 false（WebView）时退化为空实现，不影响 WebView 逻辑
const { height, updateHeight } = isSkyline()
  ? getScrollViewHeight(context, '#scrollContent')
  : { height: ref(''), updateHeight: () => {} }

// 在内容加载完成后调用 updateHeight，例如接口返回后
watch(isShow, (val) => {
  if (val) {
    fetchData().finally(() => {
      nextTick(() => { updateHeight() })
    })
  }
})
```

```html
<!-- 模板：scroll-view 同时设置 max-height（上限）和动态 height（内容实际高度） -->
<!-- height 为空时 max-height 生效兜底；height 有值时以实际内容高度为准 -->
<scroll-view
  type="list"
  scroll-y="{{true}}"
  enhanced="{{true}}"
  show-scrollbar="{{false}}"
  style="max-height: 375px;{{ height }}"
>
  <view id="scrollContent">
    <!-- 动态内容 -->
  </view>
</scroll-view>
```

**全局配置**：8.0.54+ 可配置 `enableScrollViewAutoSize` 开启自动撑开（适合简单场景，弹窗等需限高场景仍推荐动态获取方案）：

```json
{
  "rendererOptions": {
    "skyline": {
      "enableScrollViewAutoSize": true
    }
  }
}
```

## 样式适配

### CSS 属性值不支持替代

部分 CSS 属性的特定值在 Skyline 下不生效，需替换为等效方案：

```css
/* ❌ Bad — 以下属性值在 Skyline 下不生效 */
.container {
  display: grid;     /* 不支持 grid，改用 flex */
  position: sticky;  /* 不支持 sticky，改用 sticky-header 组件 */
  overflow: auto;    /* 不支持 auto */
  overflow: scroll;  /* 不支持 scroll，改用 scroll-view */
}

/* ✅ Good */
.container {
  display: flex;      /* 使用 flex 替代 grid */
  position: relative; /* sticky 效果使用 sticky-header / sticky-section 组件 */
  overflow: hidden;   /* 截断溢出内容 */
}
```

### 不支持的 CSS 属性

以下属性在 Skyline 下设置后**静默不生效**，需替换为等效方案：

| 属性 | 替代方案 |
| --- | --- |
| `float` | 使用 flex 布局 |
| `contain` | 使用 `-wx-contain` |
| `resize` | 无替代 |
| `writing-mode` | 无替代 |
| `text-indent` | 使用 `padding-left` 模拟 |
| `overflow-wrap` | 使用 `word-break` |
| `background-attachment` | 无替代 |
| `background-clip` | 无替代 |
| `background-origin` | 无替代 |
| `mask-origin` / `mask-clip` / `mask-mode` | 无替代 |
| `justify-items` | 无替代 |
| `list-style-type` / `list-style-image` / `list-style-position` | 无替代 |

### 渐变与背景多值限制

- **radial-gradient**：仅支持 `circle` 形状，不支持 `ellipse`；尺寸仅支持 `px`；颜色停止仅支持 `%`
- **linear-gradient**：停止位置仅支持 `%` 和固定长度单位（px、rpx 等）
- **conic-gradient**：完全支持，无额外限制
- **background-image / mask-image**：最多支持 **2 个值**，超出忽略
- **background-repeat / background-size**：不支持多组值

```css
/* ❌ Bad — ellipse 形状不支持 */
.bg {
  background: radial-gradient(ellipse at center, #fff, #000);
}

/* ✅ Good — 使用 circle */
.bg {
  background: radial-gradient(circle at center, #fff, #000);
}
```

### filter / backdrop-filter 限制

不支持 `url()` 和 `drop-shadow()`，也不支持多函数组合。用 `box-shadow` 替代 `drop-shadow`。

支持的函数：`blur()`, `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `opacity()`, `saturate()`, `sepia()`

```css
/* ❌ Bad — 多函数组合 / drop-shadow() 不支持 */
.el {
  filter: blur(4px) drop-shadow(2px 2px 4px #000);
}

/* ✅ Good — 单个支持的函数，drop-shadow 改用 box-shadow */
.el {
  filter: blur(4px);
  box-shadow: 2px 2px 4px #000;
}
```

### 选择器适配

| 不支持的选择器 | 替代方案 |
| --- | --- |
| `* {}` 通配选择器 | 使用具体类选择器替代 |
| `[attr] {}` 属性选择器 | 使用类选择器替代 |

### 伪元素适配（单冒号→双冒号）

Skyline 下伪元素只支持 `::before` 和 `::after`，且必须以双冒号 `::` 形式声明。单冒号写法在 Skyline 下不生效。

**全局搜索替换**：在需要适配 Skyline 的文件或文件夹下，搜索 `([^:]):((before)|(after))` 替换为 `$1::$2`。

```css
/* ❌ Bad — 单冒号，Skyline 不识别 */
.item:before { content: ''; }
.item:after { content: ''; }

/* ✅ Good — 双冒号 */
.item::before { content: ''; }
.item::after { content: ''; }
```

其他伪元素在 Skyline 下不支持，需使用真实节点替代。

### 伪类适配

| 伪类 | 支持情况 | 替代方案 |
| --- | --- | --- |
| `:first-child` / `:last-child` | ✓ 支持 | 直接使用 |
| `:not` / `:only-child` / `:empty` | ✓ 支持（8.0.49+） | 直接使用 |
| `:nth-child` | ✓ 支持（8.0.50+） | 直接使用 |
| `:active` | ✓ 支持 | 直接使用 |
| 其他伪类 | × 不支持 | 使用动态类或兄弟/后代选择器实现 |

### 单位适配

| 不支持的单位/值 | 替代方案 |
| --- | --- |
| `em` | 使用 `rpx` / `px` / `rem` |
| `currentColor` | 显式指定颜色值 |

### overflow 适配

Skyline 下 `overflow: scroll` 不支持，只能通过 `scroll-view` 组件实现滚动。不支持单独设置 `overflow-x` / `overflow-y`。

```css
/* ❌ Bad — Skyline 不支持 overflow-x/y 单独设置 */
.scrollable {
  overflow-y: scroll;
}
.overflow-x-hidden {
  overflow-x: hidden;
}

/* ✅ Good — 使用 scroll-view 组件代替 overflow: scroll */
/* <scroll-view type="list" scroll-y>...</scroll-view> */
```

### box-sizing 差异处理

Skyline 下 `box-sizing` 默认为 `border-box`，WebView 下默认为 `content-box`。这个差异可能导致 padding 撑开布局的表现不同。

**遇到 padding 未撑开布局异常时**，手动指定 `box-sizing: content-box`：

```css
.container {
  /* Skyline 默认 border-box，如需 content-box 行为需显式声明 */
  box-sizing: content-box;
  padding: 20rpx;
}
```

**全局配置**：8.0.42+ 可配置 `defaultContentBox` 将默认盒模型改为 `content-box`：

```json
{
  "rendererOptions": {
    "skyline": {
      "defaultContentBox": true
    }
  }
}
```

### 文本溢出省略适配

文本溢出省略，或者文本超长打点，在 Skyline 下需要在对应的  `text` 组件上增加 `max-lines`/`overflow` 属性

> 如果文本省略样式 `text-overflow: ellipsis` 等是设置在 `view` 组件上，则 `max-lines`/`overflow` 属性加在其子 `text` 节点上，如果 `view` 没有子 `text` 节点就创建一个 `text` 节点来包裹文本

**单行省略**：

```html
<view class="ellipsis"><text max-lines="1" overflow="hidden">{{text}}</text></view>
```

```css
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**多行省略**：

> 注意：文本省略场景下不要删除原 webview 下的文本省略样式，尤其是 `display: -webkit-box;`

```html
<view class="ellipsis"><text max-lines="2" overflow="hidden">{{text}}</text></view>
```

```css
.test {
  overflow: hidden;
  white-space: nowrap;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis
}
```

### 字体 PostScript name 兼容

部分机型不支持 `font-weight: 500` / `600` 等数值加粗，只能使用 `font-weight: bold` / `700`。

自定义字体的 PostScript name 映射：

| PostScript name | CSS 写法 | 备注 |
| --- | --- | --- |
| `xx-Regular` | `font-family: xx;` | 默认值可不加后缀 |
| `xx-Medium` | `font-family: xx; font-weight: bold;` | |
| `xx-Semibold` | `font-family: xx; font-weight: bold;` | |
| `xx-Bold` | `font-family: xx; font-weight: bold;` | |

### @font-face 仅支持 ttf 格式

Skyline 下 `@font-face` 仅支持 `ttf` 格式字体文件，`woff` / `woff2` / `otf` / `eot` 等其它格式均不生效（声明后字体加载失败，会静默 fallback 到系统字体，常见症状是"自定义字体看起来没生效"）。

```css
/* ❌ Bad — woff2 / otf 在 Skyline 下不生效 */
@font-face {
  font-family: 'BrandFont';
  src: url('https://cdn.example.com/brand.woff2') format('woff2'),
       url('https://cdn.example.com/brand.otf') format('opentype');
}

/* ✅ Good — 仅声明 ttf */
@font-face {
  font-family: 'BrandFont';
  src: url('https://cdn.example.com/brand.ttf') format('truetype');
}
```

如需兼容 WebView 同时使用其它格式，但至少需要有 ttf 格式来保证 skyline 上的展示

```css
@font-face {
  font-family: 'BrandFont';
  src: url('https://cdn.example.com/brand.ttf') format('truetype'),
  url('https://cdn.example.com/brand.woff2') format('woff2');
}
```

### 伪元素 animation 不支持的处理

Skyline 下伪元素的 `animation` 不生效，需要改用真实节点。

**使用真实节点 + CSS animation**

```css
/* ❌ Bad — 伪元素 animation 在 Skyline 不生效 */
.loading::after {
  content: '';
  animation: spin 1s linear infinite;
}

/* ✅ Good — 使用真实节点 animation */
.loading-spinner {
  animation: spin 1s linear infinite;
}
```

### 其他属性适配

| 不支持/受限属性 | 限制说明 | 替代方案 |
| --- | --- | --- |
| `box-shadow` 多层 | 不支持多个叠加 | 拆分为多节点或合并为单层 |
| `text-decoration` | 仅 text 节点生效 | view 内文字用 `<text>` 包裹 |
| `text-overflow` | 仅 text 节点生效 | 同上 |
| `backdrop-filter` | 不支持 multi function / drop-shadow / url | 简化滤镜 |
| `filter` | 不支持 multi function / drop-shadow / url | 简化滤镜 |
| `border-radius` 非 0 | 四边 border-color / border-style 需一致 | 保持一致或拆分节点 |
| `animation-fill-mode` | 不支持 `none` / `backwards` | 注意默认表现为 `forwards` |
| `text-decoration-line` | 仅支持单值，`underline line-through` 等多值组合不生效 | 使用单个值 |
| `calc()` | 不支持角度类型计算（`calc(90deg + 45deg)`） | 直接写角度值（`135deg`） |

## 组件适配

### 不支持组件的替代方案

| 组件 | 替代方案 |
| --- | --- |
| `web-view` | 建议承载 web-view 的页面单独配置 `"renderer": "webview"` |
| `movable-area` / `movable-view` | 手势组件 + worklet 动画方案替代 |
| `navigation-bar` | 自定义导航栏（`common-nav` 通用组件） |
| `editor` | 暂无替代方案 |
| `progress` | 自定义实现 |

### scroll-view 行为差异

- **必须指定 `type` 属性**：`type="list"`（列表滚动）、`type="custom"`（自定义布局）、`type="nested"`（嵌套滚动）
- `show-scrollbar` / `enhanced` 等属性在 Skyline 下行为可能略有差异
- 暂不支持自动撑开（8.0.54+ 可配置 `enableScrollViewAutoSize`）

### 横向 scroll-view 适配

横向滚动需同时满足三个条件：`scroll-view` 开启 `enable-flex`（兼容 WebView）、`scroll-view` 设置 `display: flex; flex-direction: row;`、子节点设置 `flex-shrink: 0;`（防止子节点被压缩），否则 scroll-view 横向滚动在 skyline下不生效

```html
<!-- ❌ Bad — 缺少 enable-flex / display:flex / flex-shrink:0，WebView 下横向布局异常 -->
<scroll-view scroll-x="true">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>

<!-- ✅ Good — enable-flex + flex 横向布局 + 子节点禁止压缩 -->
<scroll-view
  scroll-x="true"
  enable-flex="true"
  style="display: flex; flex-direction: row;"
>
  <view wx:for="{{list}}" wx:key="id" style="flex-shrink: 0;">{{item.name}}</view>
</scroll-view>
```

### list-view / grid-view 适配

`list-view` 和 `grid-view` 必须放在 `type="custom"` 的 `scroll-view` 内，否则无法正常工作。

```html
<!-- ❌ Bad — list-view 必须在 type="custom" 的 scroll-view 内 -->
<scroll-view scroll-y="true">
  <list-view>
    <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
  </list-view>
</scroll-view>

<!-- ✅ Good — 使用 type="custom" -->
<scroll-view type="custom" scroll-y="true">
  <list-view>
    <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
  </list-view>
</scroll-view>
```

### 嵌套滚动适配

父子 `scroll-view` 嵌套时，外层必须使用 `type="nested"` 配合 `nested-scroll-header` 和 `nested-scroll-body`，内层设置 `associative-container="nested-scroll-view"`。直接嵌套两个 `scroll-view` 会导致滚动联动失效。

**重要：嵌套场景下每一层 `scroll-view` 都必须显式声明 `type`**——外层 `type="nested"`、内层 `type="list"` / `"custom"`。遗漏内层 `type` 会让内层退化为 WebView 渲染路径，性能与手势均异常。`list-view` / `grid-view` 仅在 `type="custom"` 或 `sticky-section` 的直接子节点位置生效，放在 `type="list"` 或裸 scroll-view 内不会生效。

```html
<!-- ❌ Bad — 直接嵌套 scroll-view 导致滚动联动失效 -->
<scroll-view scroll-y="true">
  <view>顶部区域</view>
  <scroll-view scroll-y="true">
    <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
  </scroll-view>
</scroll-view>

<!-- ❌ Bad — 内层 scroll-view 缺 type -->
<scroll-view type="nested" scroll-y="true">
  <nested-scroll-body>
    <scroll-view scroll-y="true" associative-container="nested-scroll-view">...</scroll-view>
  </nested-scroll-body>
</scroll-view>

<!-- ✅ Good — 使用 type="nested" + nested-scroll-header/body，且每层都显式 type -->
<scroll-view type="nested" scroll-y="true">
  <nested-scroll-header>
    <view>顶部固定区域</view>
  </nested-scroll-header>
  <nested-scroll-body>
    <scroll-view
      type="list"
      scroll-y="true"
      associative-container="nested-scroll-view"
    >
      <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
    </scroll-view>
  </nested-scroll-body>
</scroll-view>
```

### 自定义组件样式隔离

Skyline 下自定义组件的样式隔离与 WebView 存在差异：

**tag / id 选择器不支持跨自定义组件匹配**

```css
/* ❌ Bad — Skyline 下 tag/id 选择器无法跨组件匹配 */
child-component { color: red; }
#child-id { color: blue; }

/* ✅ Good — 使用 class 选择器 + 样式隔离配置 */
.child-component { color: red; }
```

**class 遵循组件样式隔离机制**：需注意 Skyline 下 tag 选择器遵循样式隔离机制（WebView 下不受样式隔离约束）。可通过 `tagNameStyleIsolation: "legacy"` 对齐 WebView 表现。

### 组件根节点表现异常

Skyline 下自定义组件根节点有以下默认行为：

- 默认 `block` 布局 + `relative` 定位
- 不支持 `inline` 布局
- `position: relative` 会改变定位基准
- 宽高 `100%` 可能失效

**处理方式**：

- 手动设置显式宽高

### navigator 嵌套限制

Skyline 下 `<navigator>` 内**只能嵌套 `<text>` 组件或纯文本节点**，**不能嵌套** `<view>` / `<image>` / `<swiper>` 等任意其他组件。WebView 下常见的"navigator 内放图标 + 文字"业务结构会让 Skyline 静默渲染异常（图标不显示，或点击区域错位）。

```html
<!-- ❌ Bad — navigator 内嵌 view + image 在 Skyline 下渲染异常 -->
<navigator url="/pages/chat/index">
  <view class="row">
    <image src="/static/chat.png" />
    <text>联系客服</text>
  </view>
</navigator>

<!-- ✅ Good — 仅嵌套 text -->
<navigator url="/pages/chat/index">
  <text>联系客服</text>
</navigator>

<!-- ✅ Good — 图文混排改用 span 组件包裹（Skyline 专属内联容器） -->
<navigator url="/pages/chat/index">
  <span>
    <image src="/static/chat.png" />
    <text>联系客服</text>
  </span>
</navigator>
```

## Scroll API 适配

### ScrollViewContext：必须开启 enhanced 属性

通过 `NodesRef.node()` 获取 `ScrollViewContext` 时，`scroll-view` 必须开启 `enhanced` 属性，否则返回的不是 ScrollViewContext 实例，调用 `scrollTo` 等方法会报错。

```html
<!-- ❌ Bad — 未开启 enhanced，node() 返回的不是 ScrollViewContext -->
<scroll-view type="list" scroll-y="true" id="sv">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>

<!-- ✅ Good — 开启 enhanced，才能获取 ScrollViewContext 实例 -->
<scroll-view type="list" scroll-y="true" enhanced="true" id="sv">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>
```

```js
createPage({
  onReady() {
    this.createSelectorQuery().select('#sv').node()
      .exec(res => {
        const ctx = res[0].node  // 只有开启 enhanced 才是 ScrollViewContext
        ctx.scrollTo({ top: 200, animated: true })
      })
  }
})
```

### worklet.scrollViewContext：必须通过 ref 获取

在 worklet 函数中控制 scroll-view 滚动，必须使用 `NodesRef.ref()` 获取引用并存入 SharedValue，不能用 `node()`。`node()` 返回的是逻辑线程的 ScrollViewContext，不能在 UI 线程使用。

```js
// ❌ Bad — 使用 node() 返回的是逻辑线程 ScrollViewContext，无法在 worklet 中使用
createPage({
  onLoad() {
    this.createSelectorQuery().select('.scroll').node()
      .exec(res => { /* 这是逻辑线程的 ScrollViewContext，不能在 worklet 中使用 */ })
  }
})

// ✅ Good — 使用 ref() + shared() 存入 SharedValue，供 worklet 使用
createPage({
  onLoad() {
    this.scrollRef = wx.worklet.shared(null)
    this.createSelectorQuery().select('.scroll')
      .ref(res => { this.scrollRef.value = res.ref })
      .exec()
  }
})
```

### worklet.scrollViewContext.scrollTo：调用函数必须声明 'worklet' 指令

调用 `wx.worklet.scrollViewContext.scrollTo` 的函数必须在 UI 线程执行，即函数顶部必须声明 `'worklet'` 指令。

```js
// ❌ Bad — 缺少 'worklet' 指令，该 API 只能在 UI 线程调用
createPage({
  onTap() {
    wx.worklet.scrollViewContext.scrollTo(this.scrollRef.value, { top: 200 })
  }
})

// ✅ Good — 声明 'worklet' 指令，在 UI 线程执行
createPage({
  onTap() {
    'worklet'
    wx.worklet.scrollViewContext.scrollTo(this.scrollRef.value, { top: 200 })
  }
})
```

### DraggableSheetContext：size 和 pixels 不可同时传入

`DraggableSheetContext.scrollTo` 中 `size`（相对比例 0–1）和 `pixels`（绝对像素）是互斥参数，同时传入时仅 `size` 生效，`pixels` 被静默忽略。

```js
// ❌ Bad — 同时传入 size 和 pixels，pixels 被静默忽略
sheetContext.scrollTo({ size: 0.7, pixels: 200 })

// ✅ Good — size 和 pixels 二选一
sheetContext.scrollTo({ size: 0.7 })    // 相对比例（0 ~ 1）
sheetContext.scrollTo({ pixels: 200 })  // 绝对像素值
```

## Worklet 动画适配

### worklet 函数必须声明 'worklet' 指令

在 UI 线程执行的函数（手势回调、滚动回调等）必须在函数体顶部声明 `'worklet'` 字符串指令。缺少指令时函数在逻辑线程执行，手势动画会有明显延迟。

```js
// ❌ Bad — 缺少 'worklet' 指令，函数在逻辑线程执行，手势动画有延迟
createPage({
  handleGesture(evt) {
    this.offset.value += evt.deltaX
  }
})

// ✅ Good — 声明 'worklet' 指令，函数在 UI 线程直接响应
createPage({
  handleGesture(evt) {
    'worklet'
    this.offset.value += evt.deltaX
  }
})
```

### SharedValue 必须通过 .value 读写

`wx.worklet.shared()` 创建的共享变量必须通过 `.value` 属性读写。直接赋值会替换整个 SharedValue 对象，之后动画驱动失效。

```js
// ❌ Bad — 直接赋值替换整个 SharedValue 对象，动画驱动失效
const { shared } = wx.worklet
let offset = shared(0)
offset = 100

// ✅ Good — 通过 .value 读写，驱动所有绑定节点更新
const { shared } = wx.worklet
const offset = shared(0)
offset.value = 100
```

### 在 worklet 中调用普通函数必须使用 runOnJS

worklet 函数运行在 UI 线程，不能直接调用普通 JS 函数（页面方法、`wx.showToast` 等）。必须通过 `runOnJS` 切换回 JS 线程执行。

```js
// ❌ Bad — worklet 运行在 UI 线程，不能直接调用普通 JS 函数
createPage({
  showTip(msg) {
    wx.showToast({ title: msg })
  },
  handleTap() {
    'worklet'
    this.showTip('操作成功')  // 直接调用会报错
  }
})

// ✅ Good — 通过 runOnJS 切换回 JS 线程执行
const { runOnJS } = wx.worklet

createPage({
  showTip(msg) {
    wx.showToast({ title: msg })
  },
  handleTap() {
    'worklet'
    const fn = this.showTip.bind(this)
    runOnJS(fn)('操作成功')
  }
})
```

### 页面方法必须通过 bind(this) 绑定后传入 runOnJS

在 worklet 中通过 `runOnJS` 调用页面方法时，必须先 `bind(this)` 绑定上下文，否则执行时 `this` 指向丢失。

```js
// ❌ Bad — 未 bind(this)，runOnJS 调用时 this 指向丢失
createPage({
  handleTap() {
    'worklet'
    runOnJS(this.showTip)(msg)
  }
})

// ✅ Good — 先 bind(this) 再传入 runOnJS
createPage({
  handleTap() {
    'worklet'
    const showTip = this.showTip.bind(this)
    runOnJS(showTip)(msg)
  }
})
```

### 禁止在 worklet 中解构 this

在 worklet 函数中对 `this` 进行解构赋值，会触发 `Object.freeze` 冻结整个 `this` 对象，导致页面后续所有 `setData` 调用全部失效。

```js
// ❌ Bad — 解构触发 Object.freeze 冻结 this.data，后续 setData 全部失效
createPage({
  handleTap() {
    'worklet'
    const { msg, count } = this
  }
})

// ✅ Good — 逐属性访问，不冻结 this
createPage({
  handleTap() {
    'worklet'
    const msg = this.msg
    const count = this.count
  }
})
```

## glass-easel 变更点适配

glass-easel 在设计上兼容绝大多数旧版组件框架 exparser 的接口，仅有少数地方需要适配。以下变更点来自[官方适配指引](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/glass-easel/migration.html)。

### [必须] 模板中数据绑定外的转义改为标准 XML 转义

数据绑定**外**的引号须改用 XML 实体转义；数据绑定**内**无需再转义。

```html
<!-- ❌ Bad — 旧写法：反斜杠转义 -->
<view prop-a="\"test\"" prop-b="{{ test === \"test\" }}" />

<!-- ✅ Good — 新写法：XML 实体转义（外）、不转义（内） -->
<view prop-a="&quot;test&quot;" prop-b="{{ test === "test" }}" />
```

### [必须] 不再支持 wx-if / wx-for，仅支持 wx:if / wx:for

`wx-if` / `wx-for`（短横线写法）已废弃，仅支持 `wx:if` / `wx:for`（冒号写法）。exparser 同样支持冒号写法，可直接变更。

```html
<!-- ❌ Bad -->
<view wx-if="{{ arr }}" />

<!-- ✅ Good -->
<view wx:if="{{ arr }}" />
```

### [必须] wx:for 内嵌 &lt;include&gt; 时改为 &lt;template&gt;

在 `wx:for` 中使用 `<include>` 时，被引入的模板中的 `item` / `index` 变量不再有效，需改为 `<template>` + `<import>` 方案。

```html
<!-- ❌ Bad -->
<block wx:for="{{ arr }}">
  <include src="inc.wxml" />
</block>

<!-- inc.wxml -->
<view>{{ index }}. {{ item }}</view>
```

```html
<!-- ✅ Good -->
<import src="inc.wxml" />
<block wx:for="{{ arr }}">
  <template is="wx-for-content" data="{{ index, item }}" />
</block>

<!-- inc.wxml -->
<template name="wx-for-content">
  <view>{{ index }}. {{ item }}</view>
</template>
```

### [推荐] 用 this.createSelectorQuery 替代 wx.createSelectorQuery

glass-easel 下 `wx.createSelectorQuery` 性能不如 `this.createSelectorQuery`，推荐使用后者（exparser 同样支持）。

```js
// ❌ Bad
wx.createSelectorQuery().in(this).select('#el').exec(res => {})

// ✅ Good
this.createSelectorQuery().select('#el').exec(res => {})
```

### [必须] SelectorQuery 选择器不再支持以数字开头

`#1` 等以数字开头的 id 选择器在 glass-easel 下不合法（与 CSS 选择器规范保持一致），需重命名。

```js
// ❌ Bad
this.createSelectorQuery().select('#1').exec(res => {})

// ✅ Good
this.createSelectorQuery().select('#element-1').exec(res => {})
```

### [必须·仅 Skyline] Worklet 回调函数名称变更

Skyline 渲染后端上的 Worklet 事件名已更新，旧版本基础库同样支持新事件名，可直接变更。

| 组件 | 旧 Worklet 事件名 | 新 Worklet 事件名 |
| --- | --- | --- |
| `pan-gesture-handler` | `on-gesture-event` | `worklet:ongesture` |
| `pan-gesture-handler` | `should-response-on-move` | `worklet:should-response-on-move` |
| `pan-gesture-handler` | `should-accept-gesture` | `worklet:should-accept-gesture` |
| `scroll-view` | `bind:scroll-start` | `worklet:onscrollstart` |
| `scroll-view` | `bind:scroll` | `worklet:onscrollupdate` |
| `scroll-view` | `bind:scroll-end` | `worklet:onscrollend` |
| `scroll-view` | `adjust-deceleration-velocity` | `worklet:adjust-deceleration-velocity` |
| `swiper` | `bind:transition` | `worklet:onscrollstart` / `worklet:onscrollupdate` |
| `swiper` | `bind:animationfinish` | `worklet:onscrollend` |
| `share-element` | `on-frame` | `worklet:onframe` |

```html
<!-- ❌ Bad -->
<scroll-view bindscroll="onScrollWorklet" />
<swiper bind:transition="onTransitionWorklet" />

<!-- ✅ Good -->
<scroll-view worklet:onscrollupdate="onScrollWorklet" />
<swiper
  worklet:onscrollstart="onTransitionWorklet"
  worklet:onscrollupdate="onTransitionWorklet"
  worklet:onscrollend="onTransitionWorklet"
/>
```

### [必须·仅 Skyline] 不支持的组件实例方法

Skyline 下以下组件实例方法暂不支持，调用后静默不生效，需改用 CSS transition 或 Worklet 动画替代：

- `animate`
- `applyAnimation`
- `clearAnimation`
- `setInitialRenderingCache`

## 常见问题与踩坑记录

### properties 默认值必须使用 `value` 而非 `default`

glass-easel 要求组件 properties 的默认值通过 `value` 字段声明，使用 `default` 字段会被忽略，导致属性值为 `undefined`。

```js
// ❌ Bad — glass-easel 下 default 字段无效，属性值为 undefined
createComponent({
  properties: {
    title: {
      type: String,
      default: ''
    }
  }
})

// ✅ Good — 使用 value 字段声明默认值
createComponent({
  properties: {
    title: {
      type: String,
      value: ''
    }
  }
})
```

### The for-list data is neither Array nor Object 报错

当 `wx:for` 绑定的数据是 computed 计算属性时，组件初始化阶段 computed 尚未计算完成，`wx:for` 会收到 `undefined`，触发 `"The for-list data is neither Array nor Object"` 错误。

```js
// ❌ Bad — 初始化阶段 computed 未完成，wx:for 收到 undefined 导致崩溃
createComponent({
  properties: {
    compData: {
      type: Object,
      value: () => ({
        data: {}
      })
    }
  },
  computed: {
    list() {
      return this.compData?.data.recommend_info
    }
  }
})

// ✅ Good — 通过 initData 提供初始值防护
createComponent({
  properties: {
    compData: {
      type: Object,
      value: () => ({
        data: {}
      })
    }
  },
  initData: {
    list: []
  },
  computed: {
    list() {
      return this.compData?.data.recommend_info
    }
  }
})
```

### properties type 校验报错

在 glass-easel 下，如果 properties 的 type 声明与实际传入值不匹配，会触发 `"the tyle of property "xxx" is not illegal"` 类型校验错误。两种解决方式：


方式一：initData 提供正确类型（更推荐）

```js
createComponent({
  properties: {
    config: {
      // 通过 optionalTypes 补充定义其他类型
      type: Object,
      optionalTypes: [Array],
      value: () => {}
    }
  }
})
```

方式二：type 设为 null 跳过校验

> 2.17.2 及以上的基础库增加了对未填写的兼容（未填写时兼容为填写 null），更低版本的基础库无法处理未填写的情况

```js
createComponent({
  properties: {
    config: {
      // 跳过类型校验
      type: null,
      value: {}
    }
  }
})
```

### animation API 不支持 → 使用 CSS transition

Skyline 不支持 `wx.createAnimation` API（`animation` 属性赋值方式），需要改用 CSS `transition` 或 worklet 动画。

```js
// ❌ Bad — wx.createAnimation 在 Skyline 下无效
const animation = wx.createAnimation({
  duration: 300,
  timingFunction: 'ease'
})
this.setData({ animation: animation.opacity(0).step().export() })
```

```css
/* ✅ Good — 使用 CSS transition 替代 */
.fade-element {
  transition: opacity 0.3s ease;
}
.fade-element.hidden {
  opacity: 0;
}
```

### movable-area / movable-view 替代方案

Skyline 不支持 `movable-area` / `movable-view`，必须使用手势组件 + worklet 动画方案替代：

```html
<!-- 使用手势组件 + worklet 动画替代 movable-view -->
<horizontal-drag-gesture-handler worklet:ongesture="onDrag">
  <view style="transform: translateX({{translateX}})">
    可拖拽内容
  </view>
</horizontal-drag-gesture-handler>
```

详见 [Worklet 动画与手势系统参考](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/gesture.html)。

**2. picker-view 双列同时滚动问题**

Skyline 下 `picker-view` 存在双列同时滚动时索引错乱的问题，特别是日期选择器切换日期后可能出现索引越界。建议：
- 使用 `picker` 组件替代（非自定义场景）
- 自定义实现时做好边界校验

**3. swiper 单项无限滚动与 item 宽度设置**

Skyline 下 `swiper` 在单项无限循环时可能表现异常，`swiper-item` 设置自定义宽度可能不生效。建议：
- 避免单项无限循环场景
- `swiper-item` 宽度通过内部节点控制而非直接设置

**4. map 组件 API 兼容**

- `map.getScale()` 在 Skyline 下可能无响应，需通过 `bindregionchange` 事件获取缩放级别
- Android 上 map 组件高度动态变化时可能出现渲染异常，建议固定高度或通过 `wx:if` 重新创建

**5. 键盘收起/恢复问题**

Skyline 下 `input` / `textarea` 的键盘收起和恢复行为与 WebView 有差异，可能导致页面布局跳动。需额外测试键盘弹出/收起场景。

**6. scrollOffset 节点限制**

`scrollOffset` 相关字段（如 `scrollLeft` / `scrollTop`）仅在 `scroll-view` 和 `viewport` 节点上生效，不能在普通 view 上使用。

```html
<scroll-view id="view1"
             type="list"
             style="height:300px"
             show-scrollbar="false"
             enhanced="true"
             scroll-y="true">
  <!-- 页面内容 -->
</scroll-view>
```
```js
this.createSelectorQuery().select(`#view1`).fields({
  // id=view1 的节点必须是 scroll-view 或 viewport
  // 非 scroll-view 或者 viewport 节点设置 scrollOffset=true skyline 会报错
  scrollOffset: true,
  size: true
}, function(rect) {

})
```

### wxs 跨包引用错误：TypeError: R.wxs/stringify4ccc0480 is not a function

触发条件：当主包的 wxs 在分包中被 "componentFramework" 为 "glass-easel" 的组件/页面的使用，且在主包没有使用 "componentFramework" 为 "glass-easel" 的组件/页面的时会出现

规避方案：在主包的任意一个 "componentFramework" 为 "glass-easel" 的组件/页面的 wxml 中引用一下这个 wxs 即可，如果没有可以创建一个空组件来引用。

### SVG 在 Skyline 下的限制与适配

**1. 不支持 `<style>` 选择器匹配**

SVG 内嵌的 `<style>` 标签中的 CSS 选择器在 Skyline 下不生效，需将样式转为内联属性。

```xml
<!-- ❌ Bad — <style> 选择器在 Skyline 下不匹配 -->
<svg>
  <style>.icon { fill: #FF6400; }</style>
  <path class="icon" d="..." />
</svg>

<!-- ✅ Good — 改为内联样式属性 -->
<svg>
  <path fill="#FF6400" d="..." />
</svg>
```

**2. 不支持 `rgba()` 颜色格式**

SVG 属性中的 `rgba()` 颜色值在 Skyline 下不生效，需拆分为颜色值 + `fill-opacity` / `stroke-opacity`。

```xml
<!-- ❌ Bad — rgba() 在 Skyline 下不生效 -->
<path fill="rgba(255, 100, 0, 0.5)" d="..." />

<!-- ✅ Good — 用 fill-opacity 替代透明度 -->
<path fill="#FF6400" fill-opacity="0.5" d="..." />
```

> 建议用 [SVGO 在线工具](https://jakearchibald.github.io/svgomg/) 优化 SVG，可自动清理冗余属性、合并路径，减小体积并降低兼容性风险。


###  flex 布局的子节点文本超出未自动换行

skyline 下 flex 布局的子节点文本超出未能自动换行，原因是这种场景下 skyline 下 width 为文本内容的宽，需要自行指定宽度来实现自动换行

```html
<view class="wrapper">
  <text class="content">测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案</text>
  <view class="content">测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案</view>
  <span class="content">测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案</span>
</view>
```

```css
/* ❌ Bad — .content 未定义 width skyline 下未能自动换行  */
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
```

```css
/* ✅ Good — .content 显示定义 width 来支持自动换行  */
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.content {
  width: 100%;
}
```

### @media screen 替换为动态类

Skyline 不支持 @media screen，原 webview 基于 @media screen 适配的大小屏逻辑需要改为动态类的形式

❌ Bad — Skyline 不支持 @media screen
```html
<view class="wrapper"></view>
```

```css
@media screen and (max-width <= 320px) {
  .wrapper {
    display: none
  }
}
```

✅ Good — 使用动态类
```html
<view wx:class="{{{ small }}"></view>
```

```js
const small = ref(mpx.getWindowInfo().screenWidth <= 320 ? 'small' : '')
```

```css
.small {
  display: none
}
```

