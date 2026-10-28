# RN 样式最佳实践

本页按选择器、样式单位、布局与常见样式场景组织 RN 适配实践。通用用法见 [样式基准](../base/style-reference.md)，选择器、单位与属性支持范围见 [RN 样式差异](./rn-style-reference.md)。

## 目录

- [选择器使用建议](#选择器使用建议)
  - [复合选择器替换为等效单类选择器](#复合选择器替换为等效单类选择器)
  - [子元素伪类替代方案 (:first-child / :last-child / :nth-child)](#子元素伪类替代方案-first-child--last-child--nth-child)
  - [伪元素选择器替代方案 (::before / ::after)](#伪元素选择器替代方案-before--after)
  - [点击态处理 (:active)](#点击态处理-active)
- [按需样式能力预声明](#按需样式能力预声明)
  - [用户写法与预声明条件](#用户写法与预声明条件)
  - [什么时候使用 enable-* 预声明](#什么时候使用-enable--预声明)
- [样式单位使用建议](#样式单位使用建议)
  - [优先使用 px 和 rpx 单位](#优先使用-px-和-rpx-单位)
  - [使用百分比](#使用百分比)
  - [单边边框](#单边边框)
  - [1 像素边框（极细线）](#1-像素边框极细线)
  - [避免使用不兼容的单位 (rem/em)](#避免使用不兼容的单位-remem)
  - [谨慎使用 font-weight 数值](#谨慎使用-font-weight-数值)
- [布局最佳实践](#布局最佳实践)
  - [使用 Flexbox 布局](#使用-flexbox-布局)
  - [text 跨平台布局对齐](#text-跨平台布局对齐)
  - [position: sticky 替代方案](#position-sticky-替代方案)
  - [嵌套 fixed 定位](#嵌套-fixed-定位)
  - [处理垂直 margin 折叠](#处理垂直-margin-折叠)
  - [避免使用 Grid 布局](#避免使用-grid-布局)
  - [避免使用 Float 布局](#避免使用-float-布局)
- [文本溢出处理](#文本溢出处理)
  - [溢出打点（text-overflow: ellipsis）](#溢出打点text-overflow-ellipsis)
  - [溢出截断（text-overflow: clip）](#溢出截断text-overflow-clip)
  - [为 iOS 单行文本保留足够行高](#为-ios-单行文本保留足够行高)
- [混排文本 line-height 对齐](#混排文本-line-height-对齐)
- [文本垂直居中](#文本垂直居中)
- [隐藏元素](#隐藏元素)
- [渐变中避免使用 transparent](#渐变中避免使用-transparent)
- [提取公共样式](#提取公共样式)

## 选择器使用建议

RN 支持单类、`page` 和 `:host` 选择器。逗号并列的 `.a, .b { ... }` 等价于两条单类规则，可以直接使用；`.a .b`、`.a.b` 等复合选择器需改为单类。

### 复合选择器替换为等效单类选择器

根据模板结构和数据状态，将原选择器的匹配条件转换为目标节点上的专用类；保留原匹配范围，不把局部样式扩散到其他节点。

#### 父子选择器

`.a > .b` 只匹配直接子节点，专用类仅绑定到这一层。

**改造前：**

```html
<view class="list">
  <view class="item">直接子项</view>
  <view><view class="item">嵌套子项</view></view>
</view>
```

```css
.list > .item {
  padding-left: 24rpx;
}
```

**改造后：**

```html
<view class="list">
  <view class="item list-top-item">直接子项</view>
  <view><view class="item">嵌套子项</view></view>
</view>
```

```css
.list-top-item {
  padding-left: 24rpx;
}
```

#### 后代选择器

`.a .b` 匹配任意深度的后代，将语境类绑定到真正命中的节点。

**改造前：**

```html
<view class="page"><view><text class="title">标题</text></view></view>
```

```css
.page .title {
  font-size: 36rpx;
}
```

**改造后：**

```html
<view class="page"><view><text class="title page-title">标题</text></view></view>
```

```css
.page-title {
  font-size: 36rpx;
}
```

#### 相邻兄弟选择器

`.a + .b` 用模板状态标记“紧跟在 A 后的 B”。同类连续列表可用 `index > 0`；存在条件渲染或不同类型节点时，按实际相邻关系判断。

**改造前：**

```html
<view wx:for="{{rows}}" wx:key="id" class="row">{{item.text}}</view>
```

```css
.row + .row {
  margin-top: 16rpx;
}
```

**改造后：**

```html
<view wx:for="{{rows}}" wx:key="id" class="row"
  wx:class="{{ { 'row-gap': index > 0 } }}">{{item.text}}</view>
```

```css
.row-gap {
  margin-top: 16rpx;
}
```

#### 后续兄弟选择器

`.a ~ .b` 用数据状态标记同一父级下、A 之后的所有目标 B；例如错误节点出现时，将后续说明标红。

**改造前：**

```html
<view>
  <text class="error" wx:if="{{showError}}">格式错误</text>
  <text class="hint">填写说明</text>
</view>
```

```css
.error ~ .hint {
  color: #ff4d4f;
}
```

**改造后：**

```html
<view>
  <text class="error" wx:if="{{showError}}">格式错误</text>
  <text class="hint" wx:class="{{ { 'hint-error': showError } }}">填写说明</text>
</view>
```

```css
.hint-error {
  color: #ff4d4f;
}
```

#### 交集选择器

`.a.b` 改为表达组合条件的单类。基础类仍可独立复用，模板可绑定多个类，但每条 CSS 规则只使用单类选择器。

**改造前：**

```html
<view class="btn" wx:class="{{ { primary: primary } }}">按钮</view>
```

```css
.btn {
  padding: 16rpx;
}
.btn.primary {
  background-color: #1677ff;
}
```

**改造后：**

```html
<view class="btn" wx:class="{{ { 'btn-primary': primary } }}">按钮</view>
```

```css
.btn {
  padding: 16rpx;
}
.btn-primary {
  background-color: #1677ff;
}
```

#### 同步更新 `<script>` 中的 selector

新增或替换专用类名时同步更新模板、样式、脚本中的动态类名字面量，以及 `createSelectorQuery`、`createIntersectionObserver`、`selectComponent`、`selectAllComponents` 使用的选择器。

```js
// 为目标节点添加 page-title 和 wx:ref 后，同步替换原 '.page .title'
this.createSelectorQuery().select('.page-title').boundingClientRect().exec()
```

### 子元素伪类替代方案 (:first-child / :last-child / :nth-child)

RN 不支持子元素伪类，用数据下标或渲染状态绑定单类。

**改造前：**

```html
<view wx:for="{{list}}" wx:key="id" class="item">{{item.text}}</view>
```

```css
.item {
  margin-top: 16rpx;
}
.item:first-child {
  margin-top: 0;
}
```

**改造后：**

```html
<view wx:for="{{list}}" wx:key="id" class="item"
  wx:class="{{ { 'first-item': index === 0 } }}">{{item.text}}</view>
```

```css
.item {
  margin-top: 16rpx;
}
.first-item {
  margin-top: 0;
}
```

### 伪元素选择器替代方案 (::before / ::after)

RN 不支持 `::before` / `::after`，改用真实节点承载装饰，保留尺寸、位置和间距。

```html
<view style="display: flex; flex-direction: row; align-items: center;">
  <view style="width: 10rpx; height: 30rpx; margin-right: 10rpx; background-color: blue;" />
  <text>标题</text>
</view>
```

### 点击态处理 (:active)

RN 不支持 `:active`，改用 `hover-class`，支持 `view`、`button`、`navigator`、`cover-view`。`hover-stay-time` 控制松手后保留时间（毫秒）；动态启用限制见[能力预声明](#按需样式能力预声明)。

```html
<view class="btn" hover-class="btn-hover" hover-stay-time="{{100}}">点击我</view>
```

```css
.btn-hover {
  opacity: 0.8;
  background-color: #f5f5f5;
}
```

## 按需样式能力预声明

同一基础组件实例须在首次渲染时确定能力是否启用及动画类型。普通样式值可更新；后续可能新增或移除能力时，需预声明或重建节点。

### 用户写法与预声明条件

下列能力均不支持 `is-simple` 组件。

| 能力 | 基础组件 | 启用条件 | 预声明 / 限制 |
| --- | --- | --- | --- |
| Hover | `view`、`cover-view`、`navigator`、`button` | 有效的 `hover-class` | 无预声明属性；有效类与 `none` / 空值之间不能切换，需稳定启用状态或用独立 `key` 重建 |
| CSS 变量 | 所有基础组件 | 声明 `--*` 或使用 `var(...)` | `enable-var="{{true}}"` |
| 文本样式与属性透传 | 除 `text` 外的基础组件；`text` 默认支持 | `color`、`letter-spacing`、`line-height`、`include-font-padding`、`writing-direction`、`font-*`、`text-*`，或 `ellipsizeMode`、`numberOfLines` | `enable-text-pass-through="{{true}}"` |
| 背景图像 | `view`、`cover-view`、`navigator` | `background-image`、`background-size`、`background-repeat`、`background-position` 或包含它们的 `background` 简写 | `enable-background="{{true}}"`；仅 `background-color` 不计入 |
| 动画 | `view`、`cover-view`、`navigator` | 模板 `animation` 属性或 `transition` 样式 | 分别用 `enable-animation="api"` / `enable-animation="transition"`；同一实例不切换类型，CSS `animation` 不支持 |

仅属性值变化且能力类型始终存在时无需预声明；`enable-fast-image`、`background-color`、普通布局样式不属于上述条件。`text` 无需预声明文本透传。

### 什么时候使用 enable-* 预声明

1. **自身动态样式**：初始没有、后续可能出现相关能力时，添加对应 `enable-*`。
2. **条件分支复用**：相邻分支根标签相同且无独立 `key` 时可能复用。优先为分支设置不同的有效 `key`；可预声明的能力也可取各分支并集，统一加到所有分支根节点。
3. **列表复用**：缺少 `wx:key`、使用 `index` / `_`，或 key 属性缺失、值为对象、重复或不稳定时，增删重排可能复用节点。优先使用稳定唯一的业务 key；无法提供时，在每项根节点预声明所有项可能用到的能力并集。Hover 与动画类型仍须遵守上表限制。
4. **禁用 / 只读切换**：不要将 `hover-class` 在有效类与 `none` / 空值间切换。两态均使用真实有效的类，禁用态 Hover 类与普通禁用样式相同即可消除按压反馈；也可用不同 key 的条件分支重建。事件处理器仍须先执行 `if (this.disabled || this.readonly) return`，仅改样式不能阻止操作。

动态背景与条件分支重建：

```html
<!-- dynamicStyle 初始为空，后续可能加入 background-image -->
<view enable-background@ios|android|harmony="{{true}}" wx:style="{{dynamicStyle}}" />

<view wx:if="{{enabled}}" key@ios|android|harmony="enabled" hover-class="control-pressed">确认</view>
<view wx:else key@ios|android|harmony="disabled">不可用</view>
```

复用同一节点时，保持 Hover 有效启用：

```html
<view wx:class="{{ { 'control-muted': disabled || readonly } }}"
  hover-class="{{disabled || readonly ? 'control-muted' : 'control-pressed'}}"
  bindtap="handleTap">确认</view>
```

```css
.control-muted {
  opacity: 0.4;
}
.control-pressed {
  opacity: 0.7;
}
```

## 样式单位使用建议

### 优先使用 px 和 rpx 单位

优先用 `px` 表达固定尺寸，`rpx` 表达响应式尺寸；视口尺寸可用 `vw` / `vh`。

```css
.container {
  width: 750rpx;
  padding: 20px;
  font-size: 28rpx;
}
```

### 使用百分比

- **原生支持**：`width`、`height`、`padding`、`margin` 等百分比可直接使用。
- **文本基准**：`font-size` 百分比基于继承字号，无继承时按默认字号 `16`；`line-height` 百分比按最终文本节点合并后的字号计算。统一倍率不等于统一行高，见[混排行高](#混排文本-line-height-对齐)。
- **`calc()` 特例**：其中任何百分比（包括 `transform` 内）都需相应的 `parent-width` / `parent-height`。父尺寸固定时直接传入，否则先用 `createSelectorQuery()` 获取真实布局尺寸，准备好前用 `wx:if` 延迟创建。
- **优先替代**：`calc() + 百分比` 有测量、渲染与体验开销，优先改用原生百分比、Flex、rpx / vw / vh 或固定尺寸。

例：`layoutReady`、`parentWidth`、`parentHeight` 由父级布局查询结果赋值。

```html
<view wx:if="{{layoutReady}}" class="box"
  parent-width="{{parentWidth}}" parent-height="{{parentHeight}}" />
```

```css
.box {
  width: calc(50% - 20rpx);
  height: calc(30% + 10rpx);
  transform: translateX(calc(50% + 10rpx));
}
```

### 单边边框

优先用 `border-top` / `border-right` / `border-bottom` / `border-left` 简写同时表达宽度、样式和颜色。RN 仅支持统一的 `border-style`；必须拆写时，先用 `border-width: 0` 清零其他方向，再设置目标方向宽度，避免合并样式产生意外边框。

```css
.divider {
  border-bottom: 1rpx solid #e5e5e5;
}
```

### 1 像素边框（极细线）

RN 使用 `hairlineWidth` 表达平台最细边框，其他端保留 `1rpx`。

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

### 避免使用不兼容的单位 (rem/em)

RN 不支持 `rem` / `em`，需按原字号或设计稿基准换算。Mpx RN 以窗口宽度为 `750rpx`：750px 设计稿下若 `1rem = 100px`，对应 `100rpx`；若窗口宽为 375px、根字号为 16px，则 `1rem = 32rpx`，不能脱离基准固定套比例。

```css
/* 按 1rem = 100rpx，将 width: 2rem 转换为： */
.box {
  width: 200rpx;
}
```

### 谨慎使用 font-weight 数值

数值字重在不同系统、字体及小程序 / Web 间可能存在视觉差异，优先使用 `normal` / `bold`。

```css
.text-normal {
  font-weight: normal;
}
.text-bold {
  font-weight: bold;
}
```

## 布局最佳实践

### 使用 Flexbox 布局

优先使用 Flex。Mpx RN 的 `view` 未声明 `display: flex` 时默认纵向；显式声明后，未设置 `flex-direction` 会按 `row` 横排，纵向布局必须同时声明 `column`。

```css
.column {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  flex-direction: row;
}
.item {
  flex: 1;
}
```

### text 跨平台布局对齐

小程序 / Web 中 `view` 内的行内 `text` 可同排，RN 默认会纵排。独立文本项同排时显式设置横向 Flex；需要自动换行、基线对齐等文本流行为时，再用外层 `text` 包裹内层片段。

```html
<!-- 独立文本项：显式横向 Flex -->
<view style="display: flex; flex-direction: row;">
  <text>a</text><text>b</text>
</view>

<!-- 需要文本流时：用外层 text 组织片段 -->
<view><text><text>a</text><text>b</text></text></view>
```

### position: sticky 替代方案

- RN 不支持 `position: sticky`，使用 [`scroll-view`](./rn-template-reference.md#scroll-view) + [`sticky-header`](./rn-template-reference.md#sticky-header)，并在 RN 侧显式开启 `enable-sticky`。`fixed` 不占原布局空间、相对页面固定，不能等效替代。
- `sticky-header` 必须直接位于 `scroll-view` 或 [`sticky-section`](./rn-template-reference.md#sticky-section) 下；分组吸顶时，`sticky-section` 直接位于 `scroll-view` 下。
- 这两种吸顶组件仅支持 RN、Web、微信 Skyline；其他目标端通过条件编译保留原实现。
- RN Android 更适合内容稳定的吸顶区域；动画中立即更新状态、内容高度突变或用 `scroll-into-view` / `scroll-top` 主动滚动，可能闪烁或抖动。

以下展示 RN 分支结构，其他目标端按上文通过条件编译保留原实现。

```html
<scroll-view scroll-y style="flex: 1;" enable-sticky@ios|android|harmony="{{true}}">
  <view>概览</view>
  <sticky-header offset-top="{{0}}"><view style="background-color: #fff;">筛选条件</view></sticky-header>
  <view>列表内容</view>
</scroll-view>
```

### 嵌套 fixed 定位

RN 中嵌套 fixed 节点会提升为页面根下的兄弟，不能依赖模板父子关系维持层级或事件冒泡。内层需覆盖外层时显式设置更高 `z-index`；关闭、拦截等逻辑分别绑定处理函数，或用共享状态 / 自定义事件联动。

```html
<view style="position: fixed; z-index: 1000;" bindtap="closeMask">
  <view style="position: fixed; z-index: 1001;" catchtap="handleToastTap">提示</view>
</view>
```

### 处理垂直 margin 折叠

RN 没有 BFC 和 margin 折叠，相邻垂直 margin 会叠加。**先确认原小程序 / Web 确实发生折叠再改造**；不确定时保留原值，水平 margin 不处理。

| 原平台节点关系 | 折叠判断要点 |
| --- | --- |
| 相邻兄弟 | 实际相邻的普通块级流节点；Flex / Grid 子项、浮动、absolute / fixed、clearance 或条件渲染后不相邻时不处理 |
| 父与首个流内后代 | 顶部无 border、padding、行内内容或 clearance，父未建立 BFC，也不是 Flex / Grid 容器 |
| 父与末个流内后代 | 底部无 border、padding，父无明确 height / min-height，且未建立 BFC，也不是 Flex / Grid 容器 |
| 空块自身 | 无 border、padding、行内内容、height / min-height 阻隔上下 margin |

- **按实际边界判断**：祖先是 Flex 不代表所有后代都是 flex item；`scroll-view` 按原端实现与配置判断。`overflow: hidden/auto/scroll` 建立 BFC 可阻止父子折叠，不排除该父节点与相邻兄弟折叠。详见 [margin 折叠条件](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Box_model/Margin_collapsing)。
- **统一间距归属**：外部间距交给父 margin，内部留白交给父 padding，兄弟间距只保留一侧；检查 `margin` 简写与长写覆盖后的实际值，首尾项用 `wx:class` + `index` 控制。
- **保留折叠结果**：全非负取最大值，正负混合取最大正值与最小负值之和，全负取最小值。
- **必要时统一纵向 Flex**：同时声明 `display: flex` 与 `flex-direction: column`，检查间距和拉伸；单侧间距已解决时无需额外改布局。

例：确认相邻项的 `16rpx` / `12rpx` 会折叠后，统一为单侧 `16rpx`。

```html
<view style="margin-bottom: 0;">标题</view>
<view style="margin-top: 16rpx;">说明</view>
```

### 避免使用 Grid 布局

RN 不支持 Grid，等宽栅格改用 Flex 换行与百分比宽度。

模板为 .grid 包含多个 .grid-item。

```css
.grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.grid-item {
  width: 50%;
}
```

### 避免使用 Float 布局

RN 不支持 Float，左右分栏改用横向 Flex。

模板为 .columns 依次包含 .left、.right。

```css
.columns {
  display: flex;
  flex-direction: row;
}
.left, .right {
  width: 50%;
}
```

## 文本溢出处理

RN 用 `numberOfLines` / `ellipsizeMode` 控制文本溢出，`text` 和 `view` 均可使用。保留原平台 CSS，通过条件编译隔离 RN 专用属性与非 RN 样式；动态透传遵循[能力预声明](#按需样式能力预声明)。

### 溢出打点（text-overflow: ellipsis）

单行添加 `numberOfLines="{{1}}"`，多行按需修改行数。

```html
<text class="ellipsis" numberOfLines@ios|android|harmony="{{1}}">{{text}}</text>
```

```css
.ellipsis {
  overflow: hidden;
  /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
  white-space: nowrap;
  text-overflow: ellipsis;
  /* @mpx-endif */
}
```

### 溢出截断（text-overflow: clip）

在行数限制之外添加 `ellipsizeMode="clip"`。`.clip` 沿用上例 `.ellipsis` 的条件编译结构，将 `text-overflow` 改为 `clip`。

```html
<text class="clip" numberOfLines@ios|android|harmony="{{1}}"
  ellipsizeMode@ios|android|harmony="clip">{{text}}</text>
```

### 为 iOS 单行文本保留足够行高

某些 iOS RN 单行文本在紧凑行高下会顶部裁切。复现后增加 iOS RN 行高，同时检查外层固定高度与裁剪，并在目标容器验证单行和混排文字完整显示；不要从小程序或其他系统的表现推断。

```css
.label {
  font-size: 24rpx;
  line-height: 26rpx;
  /* @mpx-if (__mpx_mode__ === 'ios') */
  line-height: 32rpx;
  /* @mpx-endif */
}
```

`32rpx` 仅为案例值，不是跨字体、设备或 RN 版本的统一下限；`ios` 目标不包含 iPhone 上的微信 / 支付宝小程序。混排规则见[下节](#混排文本-line-height-对齐)。

## 混排文本 line-height 对齐

- RN 嵌套文本以首个子 `Text` 的行高为整行基准，不会自动按后续片段的最大行高撑开；小字号在前时可能裁切大字号。
- **整行只设一处行高**：在承载文本流的外层 `text` 上，用明确 `px` / `rpx` 设置各片段所需的最大行高；移除全部内层 `line-height`，内层只设置字号等片段样式。
- **倍率先换算**：Mpx2RN 的相对行高会向下继承，再按各节点自身字号计算；`20px` / `30px` 配 `1.2` 实际得到 `24px` / `36px`。不要在页面、公共文本样式或混排外层用统一倍率 / 百分比代替统一行高，应按字号与字体换算并留足空间。

```html
<text class="price-line"><text>到手价 </text><text class="price-amount">99</text><text> 元</text></text>
```

```css
.price-line {
  font-size: 24rpx;
  line-height: 56rpx;
}
.price-amount {
  font-size: 48rpx;
}
```

## 文本垂直居中

使用 Flex 对齐，不依赖 `line-height` 等于容器高度。

```html
<view style="display: flex; flex-direction: row; align-items: center; height: 100px;">
  <text>垂直居中</text>
</view>
```

## 隐藏元素

`display: none` 在 RN 中可能异常，可通过尺寸、间距归零并裁剪隐藏。`opacity: 0` 仍占布局空间，且 iOS 下不能响应点击，恢复 `1` 后可正常响应。

```css
.hidden {
  flex: 0;
  width: 0;
  height: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
}
```

## 渐变中避免使用 transparent

RN 的 `transparent` 为黑色透明，渐变可能发灰。用与目标色相同 RGB、alpha 为 `0` 的颜色过渡。

```css
.gradient {
  background: linear-gradient(to left, rgba(255, 255, 255, 0) 0%, #fff 50%, rgba(255, 255, 255, 0) 100%);
}
```

## 提取公共样式

复用样式放入公共 CSS 文件，在页面 / 组件中通过 `@import` 引入，减少重复声明与包体积开销。

```css
/* common.css */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

```html
<template><view class="flex-center">内容居中</view></template>
<style>
@import "./common.css";
</style>
```
