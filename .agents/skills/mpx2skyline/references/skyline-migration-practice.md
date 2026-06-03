# WebView → Skyline 适配改造最佳实践

## 目录

- [判断当前渲染模式](#判断当前渲染模式)
- [页面配置适配](#页面配置适配)
- [布局适配](#布局适配)
  - [默认 Flex 布局差异处理](#默认-flex-布局差异处理)
  - [Inline/Inline-Block 替代方案](#inlineinline-block-替代方案)
  - [页面滚动替代方案](#页面滚动替代方案)
  - [自定义导航](#自定义导航)
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
  - [伪元素 animation 不支持的处理](#伪元素-animation-不支持的处理)
  - [其他属性适配](#其他属性适配)
  - [隐藏元素](#隐藏元素)
- [组件适配](#组件适配)
  - [不支持组件的替代方案](#不支持组件的替代方案)
  - [scroll-view 行为差异](#scroll-view-行为差异)
  - [横向 scroll-view 适配](#横向-scroll-view-适配)
  - [list-view / grid-view 适配](#list-view--grid-view-适配)
  - [嵌套滚动适配](#嵌套滚动适配)
  - [自定义组件样式隔离](#自定义组件样式隔离)
  - [组件根节点表现异常](#组件根节点表现异常)
- [Scroll API 适配](#scroll-api-适配)
- [Worklet 动画适配](#worklet-动画适配)
- [适配检查清单](#适配检查清单)
- [常见问题与踩坑记录](#常见问题与踩坑记录)
  - [glass-easel 适配注意](#glass-easel-适配注意)
  - [布局踩坑](#布局踩坑)
  - [样式踩坑](#样式踩坑)
  - [组件踩坑](#组件踩坑)
  - [其他踩坑](#其他踩坑)

---

## 判断当前渲染模式

在页面或组件实例上可读取 `renderer` 成员，取值为 `webview` 或 `skyline`。如果在模板中要判断，可以拿到值后设置到 data 上。

```js
const isSkyline = this.renderer === 'skyline'
```

在生命周期（如 `onLoad`）中赋值到 data，供模板使用：

```js
createPage({
  onLoad() {
    this.setData({ isSkyline: this.renderer === 'skyline' })
  }
})
```

## 页面配置适配

Skyline 不支持默认导航也不支持页面滚动，故支持 Skyline 的页面都需要声明**禁止滚动**和**自定义导航**。

为了避免 ali 和 wx 下要处理两套不一样的导航和滚动逻辑，统一使用 scroll-view 替代页面滚动，自定义导航替代默认导航。

**微信页面 json 配置**：

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "disableScroll": true,
  "navigationStyle": "custom"
}
```

**支付宝页面 json 配置**：

```json
{
  "titlePenetrate": "YES",
  "transparentTitle": "always"
}
```

### app.json 全局配置三项必需

`app.json` 必须同时包含 `renderer`、`componentFramework`、`lazyCodeLoading` 三项，缺少任何一项都会导致 Skyline 功能不完整或报错。

```json5
// ❌ Bad — 缺少 componentFramework 和 lazyCodeLoading，Skyline 功能不完整
{
  "pages": ["pages/index/index"],
  "renderer": "skyline"
}

// ✅ Good — 三项缺一不可
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents"
}
```

### rendererOptions 建议配置 defaultDisplayBlock 和 defaultContentBox

```json5
// ❌ Bad — 未配置 rendererOptions，迁移时布局和盒模型可能不一致
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents"
}

// ✅ Good — 配置 defaultDisplayBlock 和 defaultContentBox 对齐 WebView
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true
    }
  }
}
```

## 布局适配

### 默认 Flex 布局差异处理

Skyline 下节点默认为 `display: flex` 布局，WebView 下默认为 `display: block`。这个差异可能导致 WebView 下正常排列的元素在 Skyline 下表现为 Flex 行为。

**方案一：全局配置对齐 WebView**

在 `app.json` 或 `page.json` 中配置 `rendererOptions`，将 Skyline 默认布局改为 block：

```json
{
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true
    }
  }
}
```

**方案二：改造为显式 flex 写法**

逐个元素显式声明 `display: flex` 或 `display: block`，避免依赖默认值。

**无 BFC**：Skyline 没有 BFC（块级格式化上下文）机制，依赖 BFC 的方案（如浮动清除 `overflow: hidden` 触发 BFC）需要替换为其他方案，优先方案二。

### Inline/Inline-Block 替代方案

Skyline 不支持 `display: inline` 和 `display: inline-block` 布局（开发中）。

**多段文本**：使用 `<text>` 组件包裹

```html
<text>文本1</text>
<text>文本2</text>
```

**文本与图片混合内联**：使用 `<span>` 组件

```html
<span>
  <text>文字内容</text>
  <image src="icon.png" style="width:16px;height:16px;" />
  <text>更多文字</text>
</span>
```

**Mpx 中使用 span 的条件编译方式**：

```html
<view mpxTagName@wx="span">
  <view mpxTagName@wx="text">文本1</view>
  <view mpxTagName@wx="text">文本2</view>
</view>
```

**flex 布局替代**：使用 `flex-direction: row` + `align-items: center` 实现内联效果。

### 页面滚动替代方案

Skyline 不支持页面滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发。需要滚动的页面必须使用 `scroll-view` 替代页面滚动。

```html
<scroll-view type="list" style="height:100%" show-scrollbar="{{false}}" enhanced scroll-y>
  <!-- 页面内容 -->
</scroll-view>
```

已有 `page-container` 组件可集成导航与滚动，页面根节点如无特殊情况可以直接替换成 `page-container`。

### 自定义导航

Skyline 不支持默认导航，需要自定义实现导航栏。已有通用组件 `common-nav` 可直接使用。

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
2. 需要全局层级控制的使用 `root-portal` 提升到根节点
3. 避免依赖层叠上下文机制实现层级控制（如用 `transform` / `opacity` 开启层叠上下文的技巧在 Skyline 下不生效）

### sticky 吸顶替代方案

`position: sticky` 在 Skyline 下不可用，使用 `sticky-header` / `sticky-section` 组件替代：

```html
<scroll-view type="list" scroll-y>
  <sticky-section>
    <sticky-header>吸顶标题</sticky-header>
    <view>列表内容</view>
  </sticky-section>
</scroll-view>
```

### scroll-view 高度自适应

Skyline 下 scroll-view 默认需要指定宽高撑开，不会自动根据内容撑开。

- **flex 子节点**：设置 `height` 为任意值后设置 `flex` 属性
- **动态获取**：使用 `getScrollViewHeight` 方法动态计算
- **全局配置**：8.0.54+ 可配置 `enableScrollViewAutoSize` 开启自动撑开

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

`[attr] {}` 替代示例：（Todo 待补充）

```html
<!-- ❌ Bad — :nth-child 在低版本 Skyline 不支持 -->
<style>
  .item:nth-child(2n) { background: #f5f5f5; }
</style>

<!-- ✅ Good — 动态类 + index 判断兼容低版本 -->
<view wx:for="{{list}}" wx:key="index">
  <view class="item {{index % 2 === 1 ? 'item-even' : ''}}">{{item}}</view>
</view>
```

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

其他伪元素（如 `::-webkit-scrollbar`）在 Skyline 下不支持，可使用真实节点替代。

### 伪类适配

| 伪类 | 支持情况 | 替代方案 |
| --- | --- | --- |
| `:first-child` / `:last-child` | ✓ 支持 | 直接使用 |
| `:not` / `:only-child` / `:empty` | ✓ 支持（8.0.49+） | 直接使用 |
| `:nth-child` | ✓ 支持（8.0.50+） | 低版本用动态类 + index |
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

`text-overflow: ellipsis` 在 Skyline 下只在 `text` 组件上生效，不能应用在 `view` 组件上。

**单行省略**：

```html
<text class="ellipsis">{{text}}</text>
```

```css
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**多行省略**：

```html
<text max-lines="2" overflow="hidden">{{text}}</text>
```

**注意**：flex 布局下的子节点 `text` 换行&溢出隐藏可能存在失效问题（已反馈给微信）。

### 字体 PostScript name 兼容

部分机型不支持 `font-weight: 500` / `600` 等数值加粗，只能使用 `font-weight: bold` / `700`。

自定义字体的 PostScript name 映射：

| PostScript name | CSS 写法 | 备注 |
| --- | --- | --- |
| `xx-Regular` | `font-family: xx;` | 默认值可不加后缀 |
| `xx-Medium` | `font-family: xx; font-weight: bold;` | |
| `xx-Semibold` | `font-family: xx; font-weight: bold;` | |
| `xx-Bold` | `font-family: xx; font-weight: bold;` | |

### 伪元素 animation 不支持的处理

Skyline 下伪元素的 `animation` 不生效，需要改用真实节点或 worklet 动画。

**替代方案一**：使用真实节点 + CSS animation

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

**替代方案二**：使用 worklet 动画

```js
const { shared, timing, Easing } = wx.worklet
```

详见 [Worklet 动画与手势系统参考](./skyline-worklet-animation.md)。

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
| inline-block margin | 不生效 | 使用 padding 替代（注意 padding-box 增大可能影响定位基准） |
| `text-decoration-line` | 仅支持单值，`underline line-through` 等多值组合不生效 | 使用单个值 |
| `calc()` | 不支持角度类型计算（`calc(90deg + 45deg)`） | 直接写角度值（`135deg`） |

### 隐藏元素

- `display: none`：支持，注意 Skyline 默认值是 `flex` 不是 `block`
- `visibility: hidden`：支持
- `opacity: 0`：支持
- 避免使用 `display: none` 后又依赖默认 `block` 布局，显式声明 `display: block`

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

横向滚动的 `scroll-view` 需同时开启 `enable-flex`，否则在 WebView 模式下横向布局可能异常。

```html
<!-- ❌ Bad — 缺少 enable-flex，WebView 模式下横向布局可能异常 -->
<scroll-view scroll-x="true" style="flex-direction: row;">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>

<!-- ✅ Good — 同时开启 enable-flex 兼容 WebView -->
<scroll-view scroll-x="true" enable-flex="true" style="flex-direction: row;">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
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

```html
<!-- ❌ Bad — 直接嵌套 scroll-view 导致滚动联动失效 -->
<scroll-view scroll-y="true">
  <view>顶部区域</view>
  <scroll-view scroll-y="true">
    <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
  </scroll-view>
</scroll-view>

<!-- ✅ Good — 使用 type="nested" + nested-scroll-header/body -->
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

**宽高 100% 可能失效**：Skyline 下设置了 `defaultDisplayBlock` 后，组件的宽高 `100%` 可能失效，需手动设置宽高。

**root-portal 内样式选择器限制**：`root-portal` 会将节点移动到根节点下，外部选择器无法匹配内部节点。详见 [fixed 定位替代方案](#fixed-定位替代方案) 中的说明。

### 组件根节点表现异常

Skyline 下自定义组件根节点有以下默认行为：

- 默认 `block` 布局 + `relative` 定位
- 不支持 `inline` 布局
- `position: relative` 会改变定位基准
- 宽高 `100%` 可能失效

**处理方式**：

- 手动设置显式宽高
- 加 `skyline-root` 类处理定位
- 自定义组件内用 `pointer-events: auto` 抵消 `skyline-root` 的 `pointer-events: none`

## Scroll API 适配

### ScrollViewContext：必须开启 enhanced 属性

通过 `NodesRef.node()` 获取 `ScrollViewContext` 时，`scroll-view` 必须开启 `enhanced` 属性，否则返回的不是 ScrollViewContext 实例，调用 `scrollTo` 等方法会报错。

```html
<!-- ❌ Bad — 未开启 enhanced，node() 返回的不是 ScrollViewContext -->
<scroll-view type="list" scroll-y="true" id="sv">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>

<!-- ✅ Good — 开启 enhanced，才能获取 ScrollViewContext 实例 -->
<scroll-view type="list" scroll-y="true" enhanced id="sv">
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

### 禁止在 worklet 中解构 this.data

在 worklet 函数中对 `this.data` 进行解构赋值，会触发 `Object.freeze` 冻结整个 `this.data` 对象，导致页面后续所有 `setData` 调用全部失效。

```js
// ❌ Bad — 解构触发 Object.freeze 冻结 this.data，后续 setData 全部失效
createPage({
  handleTap() {
    'worklet'
    const { msg, count } = this.data
  }
})

// ✅ Good — 逐属性访问，不冻结 this.data
createPage({
  handleTap() {
    'worklet'
    const msg = this.data.msg
    const count = this.data.count
  }
})
```

## 适配检查清单

按页面各部分逐项核对：

**跨渲染模式兼容**
- [ ] 引入的 Skyline 专属写法均已通过运行时判断隔离；WebView 原有写法未因 Skyline 适配而被替换或删除。

**页面配置**
- [ ] 页面 `renderer` / `componentFramework` / `disableScroll` / `navigationStyle` 配置已添加。
- [ ] 全局 skyline 配置（`lazyCodeLoading` / `rendererOptions`）已就绪。

**布局**
- [ ] 默认布局模式已处理（flex vs block / `defaultDisplayBlock`）。
- [ ] 页面滚动已替换为 `scroll-view type="list"`。
- [ ] 自定义导航已替代默认导航。
- [ ] `inline` / `inline-block` 已替换为 `text` / `span` 或 flex 方案。
- [ ] `position: sticky` 已替换为 `sticky-header` / `sticky-section`。

**样式**
- [ ] 伪元素已改为双冒号 `::` 声明。
- [ ] 不支持选择器（`*` / `[attr]` 等）已替代。
- [ ] `overflow: scroll` 已替换为 `scroll-view`；不单独设置 `overflow-x` / `overflow-y`。
- [ ] `text-decoration` / `text-overflow` 等 text 限定属性已确保仅在 `text` 节点使用。
- [ ] `box-sizing` 差异已处理。
- [ ] 字体 PostScript name 已兼容（`font-weight` 使用 `bold` / `700`）。
- [ ] 伪元素 `animation` 不支持已处理。
- [ ] `border-radius` 非 0 时 `border-color` / `border-style` 四边一致性已检查。
- [ ] `box-shadow` 不使用多个叠加。
- [ ] `/*use rpx*/` / `/*use px*/` 单位注释已保留。

**组件**
- [ ] 不支持组件已有替代方案或单独配置 `renderer: "webview"` 页面。
- [ ] `scroll-view` 已指定 `type` 属性。
- [ ] 自定义组件样式隔离已处理（tag/id 不跨组件、class 遵循隔离）。
- [ ] 组件根节点行为已检查（默认 block + relative、宽高 100% 可能失效）。
- [ ] glass-easel 下 properties 默认值使用 `value` 而非 `default`。
- [ ] wx:for 绑定 computed 属性已提供 initData 默认值防护。
- [ ] properties type 校验异常已处理（`type: null` 或 `initData`）。

## 常见问题与踩坑记录

以下问题来自生产环境 Skyline 适配的实际踩坑记录，按类别整理。

### glass-easel 适配注意

Skyline 使用 `glass-easel` 作为组件框架，与 WebView 下的旧组件框架存在行为差异。

**1. properties 默认值必须使用 `value` 而非 `default`**

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

**2. wx:for 使用 computed 属性需 initData 防护**

当 `wx:for` 绑定的数据是 computed 计算属性时，组件初始化阶段 computed 尚未计算完成，`wx:for` 会收到 `undefined`，触发 `"for-list data is neither Array nor Object"` 错误。

```js
// ❌ Bad — 初始化阶段 computed 未完成，wx:for 收到 undefined 导致崩溃
createComponent({
  computed: {
    list() {
      return this.data.rawList.filter(item => item.active)
    }
  }
})

// ✅ Good — 通过 initData 提供初始值防护
createComponent({
  data: {
    rawList: []
  },
  initData: {
    list: []
  },
  computed: {
    list() {
      return this.data.rawList.filter(item => item.active)
    }
  }
})
```

**3. properties type 校验报错**

在 glass-easel 下，如果 properties 的 type 声明与实际传入值不匹配，会触发 `"xxx is not illegal"` 类型校验错误。两种解决方式：

方式一：type 设为 null 跳过校验

```js
createComponent({
  properties: {
    config: {
      type: null,   // 跳过类型校验
      value: {}
    }
  }
})
```

方式二：initData 提供正确类型

```js
createComponent({
  initData: {
    config: {}
  }
})
```

**4. 异步组件样式乱序**

基础库 3.0.0+ 中，异步组件（按需注入的组件）在 Skyline 下可能出现样式加载顺序与 WebView 不一致，导致样式覆盖关系异常。需测试异步加载组件的样式表现。

**5. 异步组件 attached 生命周期时序差异**

Skyline 下异步组件的 `attached` 生命周期触发时机与 WebView 不同，可能在实际渲染完成前触发。依赖 DOM 布局信息的逻辑（如 `getBoundingClientRect`）应移至 `ready` 生命周期。

### 布局踩坑

**1. flex + column 导致 overflow:hidden 失效**

在 Skyline 下，`display: flex; flex-direction: column` 的容器设置 `overflow: hidden` 可能失效，子节点仍会溢出显示。

```css
/* ❌ Bad — flex-direction: column 容器的 overflow: hidden 可能失效 */
.container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ✅ Good — 子节点加 flex-shrink: 0 确保高度约束 */
.container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.child {
  flex-shrink: 0;
}
```

**2. inline-block 元素 margin 不生效**

Skyline 不支持 inline-block 布局，即使在 text 组件内部使用了类似 inline-block 的布局方式，`margin` 也不生效，只能使用 `padding` 替代。注意 padding 会增大元素盒尺寸（默认 border-box），可能影响定位基准。

**3. margin 合并行为差异**

WebView 中相邻块级元素的上下 margin 会合并（BFC 机制），Skyline 没有 BFC，margin 不会合并。这会导致 WebView 下视觉间距较小的元素在 Skyline 下间距翻倍。

```css
/* ❌ Bad — WebView 下间距 20rpx（margin 合并），Skyline 下间距 40rpx（不合并） */
.item {
  margin-bottom: 20rpx;
}

/* ✅ Good — 使用 flex gap 替代 margin，行为一致 */
.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
```

**4. fixed 节点页面转场时裁切异常**

Skyline 页面转场过程中，使用 `transform: translateX(-100%)` 等方式隐藏的 fixed 节点（如侧边栏）可能在转场动画期间短暂可见。这是因为页面转场时 transform 作用域与 fixed-context 的交互与 WebView 不同。

处理方式：转场期间通过 `opacity: 0` 配合隐藏，或在转场完成后才设置 fixed 节点内容。

**5. image 组件 max-width 行为异常**

Skyline 下 image 组件设置 `max-width` 后，实际渲染宽度可能与预期不符。建议使用明确的 `width` 值而非依赖 `max-width` 约束。

**6. image 组件不支持 border/padding**

Skyline 下 image 组件设置 `border` 或 `padding` 会导致图片尺寸计算异常（图片被撑大）。需要边框或内边距效果时，用 view 包裹 image，在 view 上设置 border/padding：

```html
<!-- ❌ Bad — image 上设置 border/padding 导致图片尺寸计算异常 -->
<image src="x.png" style="border: 1rpx solid #ccc; padding: 10rpx;" />

<!-- ✅ Good — 外层 view 包裹，在 view 上设置 border/padding -->
<view style="border: 1rpx solid #ccc; padding: 10rpx; display: inline-flex;">
  <image src="x.png" style="width: 100rpx; height: 100rpx;" />
</view>
```

**7. z-index 实践分层方案**

生产环境推荐的 z-index 分层方案（需配合 `root-portal` 使用）：

| 层级 | z-index 值 | 用途 | 示例 |
| --- | --- | --- | --- |
| Layer 100 | 100 | 全局模态弹窗 | privacy-dialog、common-dialog、common-toast |
| Layer 100 | 100 | 底部导航栏 | 底部 tab 导航 |
| Layer 10 | 10 | 业务弹窗 | auth-scene、资源弹窗、home-popup |
| Layer 0 | 0 / 不设置 | 正常文档流 | 页面内容 |
| Layer -1 | -1 | 需要置于底层的组件 | map 组件 |

**原则**：
- 同一层级内的兄弟节点靠 DOM 顺序决定层叠
- 跨层级通过 z-index 差值保证互不干扰
- 所有需要全局层级的节点通过 `root-portal` 提升到根节点

### 样式踩坑

**1. animation API 不支持 → 使用 CSS transition**

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

**2. apng 不支持动画**

Skyline 下 apng 格式图片不支持动画播放，只会显示第一帧。需要动画效果时使用 awebp 或 gif 格式替代。

**3. backdrop-filter 在 map 组件上不生效（iOS）**

iOS 上 `backdrop-filter: blur()` 应用在 map 组件上时不生效。需使用原生导航栏或其他非 map 区域的模糊效果方案。

### 组件踩坑

**1. movable-area / movable-view 替代方案**

Skyline 不支持 `movable-area` / `movable-view`，必须使用手势组件 + worklet 动画方案替代：

```html
<!-- 使用手势组件 + worklet 动画替代 movable-view -->
<horizontal-drag-gesture-handler worklet:ongesture="onDrag">
  <view style="transform: translateX({{translateX}})">
    可拖拽内容
  </view>
</horizontal-drag-gesture-handler>
```

详见 [Worklet 动画与手势系统参考](./skyline-worklet-animation.md)。

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

Skyline 下 `scrollOffset` 相关字段（如 `scrollLeft` / `scrollTop`）仅在 `scroll-view` 和 `viewport` 节点上生效，不能在普通 view 上使用。

### 其他踩坑

**1. vConsole 内存泄漏**

Skyline 下 vConsole 存在内存泄漏，长时间开启可能导致页面崩溃。**测试 Skyline 时务必关闭 vConsole**。

**2. redirectTo 跳转预加载 Skyline 页面退出异常**

`wx.redirectTo` 跳转到已调用 `wx.preloadSkylineView` 预加载的页面后，退出操作可能异常。如遇到此问题，暂时移除 `preloadSkylineView` 调用。

**3. wx:for 绑定 undefined 数据崩溃**

Skyline 对 `wx:for` 数据校验更严格，绑定 `undefined` 值会直接崩溃。需确保 `wx:for` 绑定的数据始终为数组或对象，并提供 `wx:key`：

Todo 确认示例是否保留

```html
<!-- ❌ Bad — list 可能为 undefined，Skyline 校验更严格会直接崩溃 -->
<view wx:for="{{list}}" wx:key="index">

<!-- ✅ Good — 提供默认值防护 + 有意义的 wx:key -->
<view wx:for="{{list || []}}" wx:key="id">
```

**4. wxs 跨包引用错误**

当主包中没有 glass-easel 组件时，wxs 跨包引用可能报错。解决方案是在主包中添加一个空的 glass-easel 组件（声明 `componentFramework: 'glass-easel'`），确保 glass-easel 运行时被加载。
