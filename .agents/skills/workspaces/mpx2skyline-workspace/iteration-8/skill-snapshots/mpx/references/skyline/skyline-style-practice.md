# Skyline 样式最佳实践

本文记录 WebView 迁移 Skyline 时偏视图层的改造方案，覆盖布局、样式、层级与文本适配。通用用法见 [样式基准](../base/style-reference.md)，能力范围见 [Skyline 样式差异](./skyline-style-reference.md)，双模式选型见 [Skyline 入口](./index.md)。

文中 `renderer` 的获取方式见[判断当前渲染模式](./skyline-runtime-practice.md#判断当前渲染模式)，示例仅列出适配所需的结构与样式。

## 目录

- [布局适配](#布局适配)
  - [垂直 margin 折叠处理](#垂直-margin-折叠处理)
  - [Block 与 Inline 布局下子节点的垂直负 margin 失效问题](#block-与-inline-布局下子节点的垂直负-margin-失效问题)
  - [内联混排](#内联混排)
  - [z-index 与层叠适配](#z-index-与层叠适配)
  - [sticky 吸顶替代方案](#sticky-吸顶替代方案)
  - [scroll-view 高度自适应](#scroll-view-高度自适应)
  - [横向 scroll-view 内 Flex 子节点无法自动撑满](#横向-scroll-view-内-flex-子节点无法自动撑满)
- [样式适配](#样式适配)
  - [文本溢出省略适配](#文本溢出省略适配)
  - [字体 PostScript name 兼容](#字体-postscript-name-兼容)
  - [伪元素不支持的 animation 需替换为真实节点](#伪元素不支持的-animation-需替换为真实节点)
  - [animation API 不支持 → 使用 CSS transition](#animation-api-不支持--使用-css-transition)
  - [text-decoration-line 多值适配](#text-decoration-line-多值适配)
  - [Flex 布局的子节点文本超出未自动换行](#flex-布局的子节点文本超出未自动换行)
  - [@media screen 兼容方案](#media-screen-兼容方案)

---

## 布局适配

### 垂直 margin 折叠处理

Skyline 没有 BFC 和垂直 margin 折叠机制，原 WebView 中折叠的间距会叠加。适配规则：

1. **先确认折叠**：只处理普通块级流中的相邻兄弟、父子首尾或空块；Flex / Grid 子项、浮动和绝对定位节点的 margin 不折叠，不确定时保留原值。父子折叠还受边框、padding、行内内容、clearance、高度和 BFC 等条件影响，详见 [margin 折叠条件](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Box_model/Margin_collapsing)。
2. **间距只表达一次**：外部间距由父 margin 承接，内部留白由父 padding 表达，兄弟间距只留一侧；不要把外部 margin 直接换成内部 padding。列表首尾可用 `wx:class` + `index` 控制。
3. **保留折叠后的实际值**：全非负取最大值；正负混合取最大正值与最小负值之和；全负取最小值。
4. **区分 BFC 的作用范围**：WebView 的 `overflow: hidden/auto/scroll` 可阻止父子折叠，不能据此排除与相邻兄弟的折叠；Skyline 的 `overflow: hidden` 仅负责裁剪。
5. **必要时统一纵向 Flex**：同时设置 `display: flex` 和 `flex-direction: column`，并检查间距及默认拉伸；已用单侧间距解决时无需再改布局。

例：确认标题的 `margin-bottom: 16rpx` 与说明的 `margin-top: 12rpx` 在 WebView 折叠后，将间距统一为单侧 `16rpx`。

```html
<view style="display: block; margin-bottom: 0;">标题</view>
<view style="display: block; margin-top: 16rpx;">说明</view>
```

### Block 与 Inline 布局下子节点的垂直负 margin 失效问题

- **适用条件**：父节点为 block / inline，子节点依赖高度、padding 与负 `margin-bottom` 决定占位，后续兄弟再用负 `margin-top` 回拉重叠时，Skyline 的占位结果可能与 WebView 不同。
- **检查隐式布局**：开启 `defaultDisplayBlock` 后的 `view` 默认为 block；未开启 `virtualHost` 且未声明布局的自定义组件宿主默认为 inline。
- **先建立原布局基线**：沿父子与后续兄弟节点确认 WebView 中实际发生的 margin 折叠，计算或测量前一分支占位、后项起点和重叠距离；不能直接将所有负 margin 相加。
- **处理方式**：将相关父节点显式改为纵向 Flex；自定义组件需覆盖宿主，不能只改内部节点。Flex 会取消相关 margin 折叠，原负 margin 仅在重新核算后仍保持基线时保留，否则按差值调整间距或结构。普通单侧负 margin 不因数值为负而改布局。
- **验收条件**：改造后的 WebView 与 Skyline 都应保持改造前 WebView 的节点位置和重叠效果；仅有两端改造后结果一致不足以通过。静态盒模型推导与实际渲染验证分别记录，无法确认原基线时明确待验证。

例如，已确认前一分支末子节点的负 `margin-bottom` 经父节点与后续兄弟的负 `margin-top` 折叠时，设前项盒子外高为 `H`，两侧负 margin 为 `mb`、`mt`：原后项起点为 `H + min(mb, mt)`；改为不折叠的纵向 Flex 后为 `H + mb + mt`。应按两者差值调整一处间距或等效结构，并复核父容器占位；补偿值由实际结构计算，不固定套用示例数值。

例：为参与占位计算的组件宿主设置纵向 Flex；以下仅展示布局设置，具体间距仍须按原基线核算。

```html
<tips-bar style="display: flex; flex-direction: column;" />
```

### 内联混排

1. **容器选择**：纯文本样式嵌套可用 `text` 嵌套 `text`；文本与图片、链接或自定义文本组件混排时，用 `<view mpxTagName@wx="span">` 组织同一段内联内容。普通 Flex 行中的独立布局项不适用此规则。
2. **图片布局**：同一 `span` 内需要同一行图文混排时，Skyline 下图片须显式设置 `display: inline-block`，与是否使用自定义文本组件无关。
3. **溢出省略**：在 `span` 容器上配置受约束且可收缩的宽度、`max-lines` 和 `overflow="ellipsis"`；单行省略使用 `max-lines="{{1}}"` 并保留 `white-space: nowrap`。仅补省略属性不能替代 `span` 内联结构；自然换行场景不统一添加单行限制。
4. **自定义组件**：按组件实际结构适配宿主节点，例如业务 `rich-text` 的 virtual-host 节点可设为 `inline-flex`；不要将该设置推广到普通 `text` / `navigator`。
5. **双模式隔离**：通过 [renderer 判断](./skyline-runtime-practice.md#判断当前渲染模式) 切换 Skyline 专用样式，保留 WebView 原有省略样式。Skyline 的省略由 `max-lines` / `overflow` 属性实现，无需沿用 `truncate` 中的 `overflow: hidden; text-overflow: ellipsis`。

简例：图标与文字共同单行省略（使用原子类，`renderer` 按上文链接获取）。

```html
<view class="flex w-full">
  <view
    mpxTagName@wx="span"
    class="flex-1 w-0"
    max-lines="{{1}}"
    overflow="ellipsis"
    wx:class="{{ { 'whitespace-nowrap': renderer === 'skyline', truncate: renderer !== 'skyline' } }}"
  >
    <image
      src="/images/icon.png"
      class="w-16px h-16px v-middle"
      wx:class="{{ { 'inline-block': renderer === 'skyline' } }}"
    />
    <text>这是一段超出容器宽度后显示省略号的文字</text>
  </view>
</view>
```

### z-index 与层叠适配

- **非 fixed 节点**：找到共同父级下的兄弟分支，比较分支的 `z-index`；未设置按 `0`，相同则 DOM 靠后的分支更高。
- **fixed 节点**：全局按自身 `z-index` 排序，整体高于非 fixed 内容。
- **适配方式**：需要直接比较的节点放在同一父级；局部重叠用 `relative` + `absolute`，全屏弹层按需用 `fixed`。`transform` / `opacity` / `will-change` 不会建立层叠上下文或提升层级。
- **滚动项**：`scroll-view` 直接子节点的 `z-index` 不生效，需在内部增加一层承载。

```html
<view style="position: relative;">
  <view>底层内容</view>
  <view style="position: absolute; top: 0; z-index: 1;">浮层内容</view>
</view>
```

### sticky 吸顶替代方案

- Skyline 用 `sticky-section` / `sticky-header` 替代 `position: sticky`；通过 `renderer` 分支保留 WebView 原写法。
- `sticky-section` 必须位于 `scroll-view type="custom"` 内，且仅含一个作为首个子节点的 `sticky-header`。
- 吸顶节点须显式设置背景色，避免下层内容透出。

```html
<scroll-view type="custom" scroll-y>
  <sticky-section wx:if="{{renderer === 'skyline'}}">
    <sticky-header style="background: #fff;">标题</sticky-header>
    <view>内容</view>
  </sticky-section>
  <block wx:else>
    <view style="position: sticky; top: 0; background: #fff;">标题</view>
    <view>内容</view>
  </block>
</scroll-view>
```

### scroll-view 高度自适应

在 `app.json` 开启 `rendererOptions.skyline.enableScrollViewAutoSize`，并用 `max-height` 限高：内容不足时自动撑开，超过上限后滚动。

```json
{
  "rendererOptions": {
    "skyline": { "enableScrollViewAutoSize": true }
  }
}
```

```html
<scroll-view type="list" scroll-y style="max-height: 375px;">
  <view>动态内容</view>
</scroll-view>
```

### 横向 scroll-view 内 Flex 子节点无法自动撑满

- Skyline 横向 `scroll-view` 的直接内容子节点默认按内容定宽，内部子项的 Flex 不能反向将它撑满视口。
- **给直接内容子节点设置明确的 `width`**：铺满视口用 `100%`，需要宽于视口则按布局设置 `rpx` / `px` 宽度；仅设置 `min-width` / `max-width` 或子项的 `flex-grow` 不够。

```html
<scroll-view type="list" scroll-x>
  <view style="display: flex; width: 100%;">
    <view wx:for="{{items}}" wx:key="id" style="flex: 1 0 auto;">{{item.title}}</view>
  </view>
</scroll-view>
```

## 样式适配

### 文本溢出省略适配

- **覆盖全部省略节点**：检查 `text-overflow: ellipsis`、`-webkit-line-clamp`、`overflow: hidden` + `white-space: nowrap`，在实际显示文本的节点上补 `max-lines` / `overflow`；图文混排见[内联混排](#内联混排)。
- **保留 WebView 样式**：单行保留 nowrap、hidden、ellipsis；多行保留 `display: -webkit-box`、`-webkit-box-orient`、`-webkit-line-clamp` 等，通过 `renderer` 隔离专用样式。
- **避免额外空白**：`text` 会字面保留首尾空白，插值须紧贴标签；属性可折行，文本内容不额外换行缩进。

例：双模式两行省略，单行时改为 `max-lines="{{1}}"` 并使用对应单行样式。

```html
<view max-lines="{{2}}" overflow="ellipsis"
  wx:class="{{ { 'webview-ellipsis': renderer !== 'skyline' } }}">{{title}}</view>
```

```css
.webview-ellipsis {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 字体 PostScript name 兼容

- 部分机型的 `font-weight: 500` / `600` 可能异常；改为 `bold` / `700` 会影响视觉，须先确认是否允许调整，未确认时保留原值并说明风险。
- 自定义字体需核对资源与 PostScript name 映射；确认可调整后，`xx-Medium` / `xx-Semibold` / `xx-Bold` 可参考 `font-family: xx; font-weight: bold`。已通过 `@font-face` 定义为独立字体名的无需更改。
- Skyline 支持 TTF / OTF / WOFF2。

```css
@font-face {
  font-family: 'XX-Medium';
  src: url('XX.otf');
}
.title {
  font-family: 'XX-Medium';
}
```

### 伪元素不支持的 animation 需替换为真实节点

Skyline 下伪元素的 `animation` 不生效，将动画移到真实节点。

```html
<image class="loading-spinner" src="/images/loading.png" />
```

```css
.loading-spinner {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### animation API 不支持 → 使用 CSS transition

Skyline 不支持 `wx.createAnimation` 及其 `animation` 属性赋值方式；简单状态过渡改用 CSS `transition`，复杂动画按需使用 Worklet。

```html
<view class="fade-element" wx:class="{{ { 'is-hidden': hidden } }}">内容</view>
```

```css
.fade-element {
  transition: opacity 0.3s ease;
}
.is-hidden {
  opacity: 0;
}
```

### text-decoration-line 多值适配

Skyline 的 `text-decoration-line` 只支持单值；组合装饰线用嵌套 `text`，每层一条，字号和颜色沿用继承。WebView 保留单节点多值，嵌套文本紧贴标签以避免额外空白。

```html
<text wx:if="{{renderer === 'skyline'}}" class="underline"><text class="line-through">{{price}}</text></text>
<text wx:else class="dual-decoration">{{price}}</text>
```

```css
.underline {
  text-decoration-line: underline;
}
.line-through {
  text-decoration-line: line-through;
}
.dual-decoration {
  text-decoration-line: underline line-through;
}
```

### Flex 布局的子节点文本超出未自动换行

Skyline 中，Flex 子节点若按文本内容定宽，可能溢出而不换行。为文本节点显式限定宽度，例如纵向居中布局下设置 `width: 100%`。

```html
<view style="display: flex; flex-direction: column; align-items: center;">
  <text style="width: 100%;">这是一段需要按容器宽度自动换行的文本</text>
</view>
```

### @media screen 兼容方案

- **防止样式泄漏**：Skyline 忽略 `@media screen` 条件但保留内部声明，媒体查询中每个选择器（含逗号分组的每项）都须限定为仅非 Skyline 节点持有的类。
- **保持断点一致**：WebView 使用媒体查询，Skyline 根据运行时窗口宽度绑定动态类；两端使用相同阈值与边界条件，不以屏幕物理尺寸替代窗口尺寸。调整断点时同步修改两端规则。

例：窗口宽度不大于 `320px` 时隐藏内容。

```html
<template>
  <view wx:class="{{ {
    'wrapper-webview': renderer !== 'skyline',
    'wrapper-small': renderer === 'skyline' && isSmall
  } }}">内容</view>
</template>

<script setup>
import { getCurrentInstance } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy
const isSmall = renderer === 'skyline' && wx.getWindowInfo().windowWidth <= 320

defineExpose({ renderer, isSmall })
</script>

<style>
@media screen and (max-width: 320px) {
  .wrapper-webview {
    display: none;
  }
}
.wrapper-small {
  display: none;
}
</style>
```
