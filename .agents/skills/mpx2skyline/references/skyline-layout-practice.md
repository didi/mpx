# Skyline 布局与样式适配实践

本文记录 WebView 迁移 Skyline 时偏视图层的可复制改造方案，覆盖布局、样式、模板结构、页面滚动、层级、文本与 SVG 展示限制。

## 目录

- [布局适配](#布局适配)
  - [不要依赖 BFC 和 margin 合并](#不要依赖-bfc-和-margin-合并)
  - [图文混排](#图文混排)
  - [页面滚动替代方案](#页面滚动替代方案)
  - [z-index 与层叠适配](#z-index-与层叠适配)
  - [sticky 吸顶替代方案](#sticky-吸顶替代方案)
  - [scroll-view 高度自适应](#scroll-view-高度自适应)
- [样式适配](#样式适配)
  - [文本溢出省略适配](#文本溢出省略适配)
  - [字体 PostScript name 兼容](#字体-postscript-name-兼容)
  - [伪元素不支持的 animation 需替换为真实节点](#伪元素不支持的-animation-需替换为真实节点)
  - [animation API 不支持 → 使用 CSS transition](#animation-api-不支持--使用-css-transition)
  - [text-decoration-line 多值适配](#text-decoration-line-多值适配)
  - [flex 布局的子节点 min-width 百分比撑开失效](#flex-布局的子节点-min-width-百分比撑开失效)
  - [flex 布局的子节点文本超出未自动换行](#flex-布局的子节点文本超出未自动换行)
  - [@media screen 替换方案](#media-screen-替换方案)
- [模板结构适配](#模板结构适配)
  - [[必须] 模板中数据绑定外的转义改为标准 XML 转义](#必须-模板中数据绑定外的转义改为标准-xml-转义)
  - [[必须] wx:for 内嵌 include 时改为 template](#必须-wxfor-内嵌-include-时改为-template)
  - [navigator 嵌套限制](#navigator-嵌套限制)
  - [SVG 在 Skyline 下的限制与适配](#svg-在-skyline-下的限制与适配)

---

## 布局适配

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

### 图文混排

触发条件：同一视觉行内同时出现 `image` / icon 与 `text` / `rich-text` / `special-text` / 自定义文本组件，尤其容器带 `truncate` / `line-clamp` / `whitespace-nowrap` 或 `mpxTagName@wx="span"` 时，必须按本节处理。不要只补 `max-lines` / `overflow`，否则 Skyline 下图片、组件 virtual-host 与文本仍无法按 WebView 方式内联对齐或截断。

```html
<view class="flex-1 w-0 truncate">
  <image
          class="v-middle flex-none w-10px h-10px mb-2px mr-2px"
          src="https://img-hxy021.didistatic.com/static/starimg/img/tbLezkOe9q1670901034023.png"
          mode="heightFix" />
  <rich-text text="儿童贴心服务｜设置本次乘车新偏好" />
</view>
```

```html
<script setup lang="ts">
import useSkyline from 'common/skyline/useSkyline'

defineExpose({
  isSkyline: useSkyline()
})
</script>

<!-- truncate 为原子类中超长打点类，包含样式 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
     Skyline 仅需保留 `white-space: nowrap;`
     Skyline 超长打点通过 `max-lines`/`overflow` 属性实现
-->
<view
        mpxTagName@wx="span"
        mpxTagName@ios|android|harmony="text"
        max-lines="{{1}}"
        overflow="ellipsis"
        class="flex-1 w-0 {{isSkyline ? 'whitespace-nowrap' : 'truncate'}}">
  <!-- Skyline 下将 image 组件 节点改为 inline-block 布局 -->
  <image
          class="v-middle flex-none w-10px h-10px mb-2px mr-2px {{isSkyline ? 'inline-block' : ''}}"
          src="https://img-hxy021.didistatic.com/static/starimg/img/tbLezkOe9q1670901034023.png"
          mode="heightFix"
  />
  <!-- Skyline 下将组件 virtual-host 节点改为 inline-flex 布局 -->
  <rich-text
          class="v-middle"
          style="{{isSkyline ? 'display: inline-flex;' : ''}}"
          text="儿童贴心服务｜设置本次乘车新偏好"
  />
</view>
```

适配要点：

1. `isSkyline` 用运行时判断注入模板，只在 Skyline 下切换 `whitespace-nowrap`、`inline-block`、`inline-flex` 等兼容样式，非 Skyline 保持不变。
2. 图标、`rich-text`、分隔符同属一段图文混排时，放在同一个 `mpxTagName@wx="span"` 容器内；同时兼容 RN 侧时需用 `mpxTagName@ios|android|harmony="text"` 和 `numberOfLines` 对齐单行截断。

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

Skyline 没有层叠上下文（stacking-context）的概念。`z-index` 默认值为 `0`，**只在兄弟节点间生效**，节点的最终层级由两套机制决定：**normal-context**（非 fixed 节点）和 **fixed-context**（fixed 节点）。

**核心差异**：

| 维度 | WebView | Skyline |
| --- | --- | --- |
| 层叠上下文 | 有，子节点 z-index 在不同层叠上下文间不可比较 | 无，z-index 只在兄弟节点间直接比较 |
| 跨父级层级 | 由各自所属层叠上下文的层级决定 | 向上回溯到「共同父级下的那对兄弟节点」，比较这对兄弟的 z-index |
| fixed 节点 | 参与正常层叠上下文 | 全局提升到 fixed-context，整体层级永远高于 normal-context |
| 相同 z-index | 层叠水平 + 文档顺序决定 | DOM 靠后的层级更高 |
| `transform` / `opacity` | 会创建新层叠上下文，影响 z-index 比较 | 不创建层叠上下文，对层级无影响 |

**normal-context 机制**（非 fixed 节点）：

```
      a
   b      c
   ↓      ↓
   d      e
   ↓      ↓
   f      g
```

比较 f 和 g 的层级时，并不直接比较 f、g 自身的 z-index，而是向上回溯到它们在同一父级下的祖先分支 b 和 c，比较 b 与 c 的 z-index——谁更大，其整条子树的层级就更高。若 b、c 的 z-index 相同，则 DOM 靠后的层级更高。

**fixed-context 机制**（fixed 节点）：

不关心 fixed 节点在 DOM 中的父子层级，所有 fixed 节点在全局范围内统一提升到 fixed-context 上渲染：DOM 结构保持不变，但渲染时全部「拍平」为兄弟节点，再仅依据各自的 z-index 排序。

```
fixed-a (z-index: 2)
  fixed-b (z-index: 3)
    fixed-c (z-index: 1)
  fixed-d (未设置 → 0)
fixed-e (z-index: 4)

渲染层级排序：fixed-d(0) < fixed-c(1) < fixed-a(2) < fixed-b(3) < fixed-e(4)
```

注意 fixed-c 虽然 DOM 上嵌套最深，但因 z-index 最小（1），渲染层级反而靠下；fixed-b 的 z-index(3) 高于其父 fixed-a(2)，但因整体拍平比较，仍能盖住 fixed-a。

**适配方案**：

1. **把需要层级控制的节点重构为兄弟节点结构**：页面内非全屏元素用 `relative` + `absolute`，按 normal-context 规则确定层级；全屏元素（弹窗、弹层、toast）按需用 `fixed`，按 fixed-context 规则确定层级，且层级天然高于所有非 fixed 内容。
2. **不要依赖层叠上下文机制做层级控制**：WebView 上用 `transform` / `opacity` / `will-change` 隐式开启层叠上下文来抬升层级的技巧，在 Skyline 下完全失效。
3. **`z-index` 不能用在 `scroll-view` 的直接子节点上**：该位置设置 `z-index` 不生效；如需对滚动项做层级控制，应在其内部再包一层节点，或借助 fixed 元素提升到 fixed-context。

### sticky 吸顶替代方案

`position: sticky` 在 Skyline 下不可用，需用 `sticky-header` / `sticky-section` 组件替代。但 `sticky-header` / `sticky-section` 是 Skyline 专属组件，WebView 下不识别，而 WebView 的 `position: sticky` 本就可用，属于「Skyline 支持但 WebView 不需要」的写法，**不要替换 WebView 原生写法**，而是用 [运行时 renderer 判断](./skyline-runtime-practice.md#判断当前渲染模式) 隔离两条分支。

```html
<!-- isSkyline 来自 renderer 判断，见 skyline-runtime-practice.md 的「判断当前渲染模式」 -->
<scroll-view type="list" scroll-y="true">
  <!-- Skyline:sticky-section + sticky-header 组件 -->
  <sticky-section wx:if="{{isSkyline}}">
    <sticky-header class="sticky-title">吸顶标题</sticky-header>
    <view>列表内容</view>
  </sticky-section>
  <!-- WebView:保留 position: sticky 原生写法 -->
  <block wx:else>
    <view class="sticky-title webview-sticky">吸顶标题</view>
    <view>列表内容</view>
  </block>
</scroll-view>
```

```css
/* 两端都需显式背景色,避免吸顶时透字穿透 */
.sticky-title { background: #fff; }
/* WebView 专属:position: sticky 在 Skyline 下静默失效,仅 WebView 分支使用 */
.webview-sticky { position: sticky; top: 0; }
```

```js
// isSkyline 写入 data 供模板 wx:if 使用
createPage({
  onLoad() {
    this.isSkyline = this.renderer === 'skyline'
  }
})
```

**Skyline 分支结构约束**：

- `sticky-header` 必须是 `sticky-section` 的**第一个子节点**；每个 `sticky-section` 仅允许一个 `sticky-header`。
- `sticky-section` 必须放在 `scroll-view type="custom"` 或 `type="list"` 内（不可裸用）。
- `sticky-header` **必须显式声明背景色**（`background` / `background-color`）。Skyline 下 `sticky-header` 默认透明，吸顶时下层列表内容会透字穿透，常见症状是"吸顶后文字与列表叠在一起"。

### scroll-view 高度自适应

Skyline 下 `scroll-view` 默认不会按内容高度自动撑开。迁移时优先使用全局配置方案；只有在业务明确需要把内容实际高度写入 `scroll-view` 内联样式时，才使用动态测量方案。

**推荐方案：全局配置 + max-height**

在 `app.json` 的 `rendererOptions.skyline` 下开启 `enableScrollViewAutoSize`，让 `scroll-view` 按内容撑开；组件上继续保留 `max-height` 作为滚动区域上限。内容未超过上限时容器随内容高度变化，超过上限后由 `scroll-view` 承载滚动。

```json
{
  "rendererOptions": {
    "skyline": {
      "enableScrollViewAutoSize": true
    }
  }
}
```

```html
<!-- 常规写法：由 enableScrollViewAutoSize 负责按内容撑开，max-height 只限制最大高度 -->
<scroll-view
  type="list"
  scroll-y="{{true}}"
  style="max-height: 375px;"
>
  <view>
    <!-- 动态内容 -->
  </view>
</scroll-view>
```

**兜底方案：动态测量内容高度**

仅在要求明确动态计算 `scroll-view` 的实际高度时，再在内容渲染后通过 `createSelectorQuery` 查询内容节点高度，并将结果绑定到 `scroll-view` 的 `style`。

```ts
// 工具函数
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
import { getCurrentInstance, nextTick } from '@mpxjs/core'
import { getScrollViewHeight } from 'useSkyline'

const context = useContext()

const isSkyline = getCurrentInstance().proxy.renderer === 'skyline'

// isSkyline() 为 false（WebView）时退化为空实现，不影响 WebView 逻辑
const { height, updateHeight } = isSkyline()
        ? getScrollViewHeight(context, '#scrollContent')
        : {
          height: ref(''),
          updateHeight: () => {}
        }

// 在内容加载完成后调用 updateHeight，例如接口返回后
watch(isShow, (val) => {
  if (val) {
    fetchData().finally(() => {
      nextTick(() => {
        updateHeight()
      })
    })
  }
})
```

```html
<!-- 动态测量写法：max-height 是上限，height 是测量后的内容实际高度 -->
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

## 样式适配

### 文本溢出省略适配

文本溢出省略，或者文本超长打点，在 Skyline 下需要在对应的 `view`/`text`/`rich-text`/`special-text` 组件上增加 `max-lines`/`overflow` 属性

> **完整扫描要求**：适配时须扫描组件/页面内**所有**包含文本省略样式（`text-overflow: ellipsis` / `-webkit-line-clamp` / `overflow: hidden` + `white-space: nowrap` 组合）的节点，逐一为其补齐 `max-lines`/`overflow`。

> 注意事项
>
> **新增/替换 `text` 节点时务必把插值压回单行**：`<view>` 会折叠首尾空白，`<text>` 则字面保留。开闭标签之间留下换行 + 缩进会被当作前导/尾随空格渲染出来，影响 `max-lines`/`overflow` 的截断点与视觉对齐。属性多到必须折行时，只折属性、把插值紧贴 `>`
> **WebView 样式与 Skyline 属性共存**：原 WebView 的 webkit 省略样式（`-webkit-line-clamp`/`-webkit-box-orient`/`display:-webkit-box`/`text-overflow:ellipsis`/`white-space: nowrap`/`overflow: hidden;`）**保留不删**（WebView 仍需要），同时在承载文本的 `view` / `text` / `rich-text` / `special-text` 节点**新增** `max-lines`/`overflow` 属性给 Skyline 使用。两者共存互不冲突。

**单行省略**：

```html
<!-- ❌ Bad -->
<view class="ellipsis">
  {{title}}
</view>

<!-- ✅ Good -->
<view class="ellipsis" max-lines="{{1}}" overflow="ellipsis">{{title}}</view>
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
<view class="normal"
      wx:class="{{{ ellipsis: !isSkyline }}}" max-lines="{{2}}" overflow="ellipsis">{{title}}</view>
```

```css
.normal {
  white-space: nowrap;
}
.ellipsis {
  display: -webkit-box;
  overflow: hidden;
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
| `xx-Medium` | `font-family: xx; font-weight: bold;` | 若已通过 `@font-face` 将 `xx-Medium` 单独定义为 `font-family`，则无需更改 |
| `xx-Semibold` | `font-family: xx; font-weight: bold;` | 若已通过 `@font-face` 将 `xx-Semibold` 单独定义为 `font-family`，则无需更改 |
| `xx-Bold` | `font-family: xx; font-weight: bold;` | 若已通过 `@font-face` 将 `xx-Bold` 单独定义为 `font-family`，则无需更改 |

例如，以下写法已将 `XX-Medium` 定义为独立字体，使用 `font-family: 'XX-Medium'` 时无需更改；`XX-Semibold`、`XX-Bold` 同理：

```css
@font-face {
  font-family: 'XX-Medium';
  src: url('XX.otf');
}
```

> Skyline 支持的自定义字体格式有：ttf/otf/woff2

### 伪元素不支持的 animation 需替换为真实节点

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

### animation API 不支持 → 使用 CSS transition

Skyline 不支持 `wx.createAnimation` API（`animation` 属性赋值方式），需要改用 CSS `transition` 或 worklet 动画。

```js
// ❌ Bad — wx.createAnimation 在 Skyline 下无效
const animation = wx.createAnimation({
  duration: 300,
  timingFunction: 'ease'
})
const animationData = ref(animation.opacity(0).step().export())
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

### text-decoration-line 多值适配

Skyline 下 `text-decoration-line` 只取单值，`underline line-through` 这类双值组合会被截断为单值（实际只渲染其中一条线），WebView 则正常叠加两条线。删除线 + 下划线常见于「划线价 + 强调」类价格文案，直接迁移会丢失一条装饰线。

由于 Skyline 下装饰线只能由 `text` 节点单值承载，**双值需拆成嵌套 `text` 节点，每层承担一条装饰线**。用 [运行时 renderer 判断](./skyline-runtime-practice.md#判断当前渲染模式) 区分：Skyline 下增加一层 `text` 节点，WebView 维持单节点双值，避免给 WebView 引入无谓的嵌套。

```html
<!-- ❌ Bad — Skyline 下双值被截断，只剩一条装饰线 -->
<text class="dual-decoration">{{price}}</text>
```

```css
.dual-decoration {
  text-decoration-line: underline line-through;
}
```

```html
<!-- ✅ Good — 运行时判断:Skyline 嵌套 text 各承担一条装饰线;WebView 维持单节点双值 -->
<!-- 嵌套 text 的插值务必紧贴标签,text 节点会字面保留首尾空白 -->
<text wx:if="{{isSkyline}}" class="underline"><text class="line-through">{{price}}</text></text>
<text wx:else class="dual-decoration">{{price}}</text>
```

```css
/* WebView:单节点双值即可叠加两条线 */
.dual-decoration { text-decoration-line: underline line-through; }
/* Skyline:外层节点画下划线,内层节点画删除线,嵌套后两条线同时生效 */
.underline { text-decoration-line: underline; }
.line-through { text-decoration-line: line-through; }
```

```js
// isSkyline 来自 renderer 判断,在生命周期里写入 data 供模板使用
createPage({
  data: {
    isSkyline: false
  },
  onLoad() {
    this.isSkyline = this.renderer === 'skyline'
  }
})
```
> 嵌套的内外层只设 `text-decoration-line`，字号/颜色等由外层继承，避免重复声明导致两层样式打架。两条装饰线归属哪层不影响最终视觉，但内层文本节点要紧贴标签写,防止 `text` 字面保留空白把价格文案撑出多余间距。

### flex 布局的子节点 min-width 百分比撑开失效

Skyline 下 flex 布局子节点依赖百分比 `min-width` 撑开或等分时，百分比无法按预期生效，节点会按内容收缩。
这个 case 中，外层 `.estimate-form` 的 `min-width: 100%` 未能撑满一屏，子项 `.form-item` 的 `min-width: 25%` 也未能按四等分撑开。典型表现是业务工具栏在 WebView 下 4 个按钮均分一屏，但 Skyline 下子项宽度按内容收缩，导致间距和滚动范围异常。

```html
<!-- ❌ Bad — 子项依赖百分比 min-width 撑开 -->
<scroll-view
  class="operation-bar h-38px"
  scroll-x="{{true}}"
  enhanced="{{true}}"
  type="list"
>
  <view class="estimate-form text-12px" id="estimate-form">
    <view class="form-item" wx:for="{{operationList}}" wx:key="key">
      <view class="form-item-content-wrapper normal">
        <image wx:if="{{item.icon}}" src="{{item.icon}}" class="form-item-icon normal" />
        <view wx:else class="form-item-text normal">{{item.title}}</view>
      </view>
    </view>
  </view>
</scroll-view>
```

```stylus
/* ❌ Bad — flex 布局内的 min-width 百分比在 Skyline 下不生效 */
.estimate-form
  display flex
  min-width 100% // Skyline 下这里也未能按一屏宽度撑开
  box-sizing border-box
  min-height 38px
  color #444
  .form-item
    position relative
    display flex
    justify-content center
    align-items center
    padding 0 10px
    flex 1 0 auto
    min-width 25% // Skyline 下这里也未能按四等分宽度撑开
    max-width 100%
    box-sizing border-box
```

```html
<!-- ✅ Good — 用 rpx 固定换算值替代百分比 min-width -->
<scroll-view
  class="operation-bar h-38px"
  scroll-x="{{true}}"
  enhanced="{{true}}"
  type="list"
>
  <view class="estimate-form text-12px" id="estimate-form">
    <view class="form-item" wx:for="{{operationList}}" wx:key="key">
      <view class="form-item-content-wrapper normal">
        <image wx:if="{{item.icon}}" src="{{item.icon}}" class="form-item-icon normal" />
        <view
          wx:else
          class="form-item-text normal"
          max-lines="{{1}}"
          overflow="ellipsis"
        >
          {{item.title}}
        </view>
      </view>
    </view>
  </view>
</scroll-view>
```

```stylus
/* ✅ Good — 用 rpx 固定换算值替代百分比 min-width */
.estimate-form
  display flex
  flex-shrink 0
  box-sizing border-box
  min-height 38px
  color #444
  //  ✅ Good — min-width 100% 换算为 min-width 750rpx
  min-width 750rpx
  justify-content space-around
  .form-item
    position relative
    display flex
    justify-content center
    align-items center
    padding 0 10px
    flex 1 0 auto
    //  ✅ Good — min-width 25% 换算为 min-width 187rpx
    min-width 187rpx
    max-width 100%
    box-sizing border-box
```

适配要点：

1. 必须以 flex 容器链为单位处理，扫描并替换同一撑开/等分关系里的所有百分比 `min-width`；不要只处理命中的子项规则。
2. 不再依赖 `min-width` 百分比撑开，按实际基准宽度换算为 `rpx` / `px` 等明确长度单位。若基准宽度是一屏，750rpx 代表屏宽，25% 可写为 187rpx。
3. 若外层内容容器预期至少撑满一屏，使用 `min-width: 750rpx`；若基准不是一屏，应按实际容器设计宽度换算，不要机械套用 750rpx。

### flex 布局的子节点文本超出未自动换行

Skyline 下 flex 布局的子节点文本超出后可能无法自动换行，因为此时子节点宽度由文本内容决定，需要显式指定宽度。

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
/* ✅ Good — .content 显式定义 width 来支持自动换行  */
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

### @media screen 替换方案

Skyline 不支持 `@media screen` 的条件判断：`@media screen and (...)` 外层条件会被忽略，但内部样式仍会生效，等价于把媒体查询内的规则裸写到全局样式里。因此，原本依赖 `@media screen` 区分大小屏的逻辑，在 Skyline 下必须改为运行时动态类。

适配目标是：**WebView 继续使用原生 `@media` 实时响应屏幕变化；Skyline 只使用运行时类控制大小屏状态**。因此需要用 [运行时 renderer 判断](./skyline-runtime-practice.md#判断当前渲染模式) 隔离 WebView 与 Skyline，并在 Skyline 分支额外提供一个默认类，用来覆盖 `@media screen` 内部规则泄漏后的默认态。

❌ Bad — Skyline 下 `@media screen` 条件被忽略，内部规则全局生效
```html
<view class="wrapper"></view>
```

```css
@media screen and (max-width: 320px) {
  .wrapper { display: none; }
}
```

✅ Good — 用 `isSkyline` 门控 Skyline 默认类与状态类，WebView 仍走原生 `@media`
```html
<!-- 仅 Skyline 加 .wrapper-skyline / .small;WebView 不加,继续走原生 @media -->
<view wx:class="wrapper {{ { 'wrapper-skyline': isSkyline, small: isSkyline && isSmall } }}"></view>
```

```js
// isSkyline 来自 renderer 判断;isSmall 为屏宽快照
const isSmall = ref(mpx.getWindowInfo().screenWidth <= 320)
```

```css
/* 默认态先声明,WebView 大屏与 Skyline 默认态都以此为基准 */
.wrapper {
  display: block;
}

/* WebView:原生 @media 实时响应横竖屏/resize */
@media screen and (max-width: 320px) {
  .wrapper { display: none; }
}

/*
 * Skyline:上面的 @media 条件会被忽略,.wrapper { display: none; } 会泄漏为全局规则。
 * 必须在 @media 之后声明 Skyline 默认类,把非小屏状态覆盖回默认样式。
 */
.wrapper-skyline {
  display: block;
}

/* Skyline 小屏态 */
.wrapper-skyline.small { display: none; }
```

- WebView：`isSkyline=false` → 动态类永不加 → `@media` 生效，保留原生响应式。
- Skyline：`isSkyline=true` → `.wrapper-skyline` 先覆盖 `@media` 泄漏的默认态，`.small` 再表达小屏态。

> `@media` 与 `.small` 两份规则需同步（阈值 / 样式改动要两处一起改）。`getWindowInfo` 是一次性快照，若 Skyline 下需响应运行时屏宽变化（横竖屏），要再用 `wx.onWindowResize` / 页面 `onResize` 更新 `isSmall`。
> ⚠️ 声明顺序陷阱：不要直接把 `.wrapper { display: block; }` 写在 `@media` 后面覆盖泄漏规则，这会在 WebView 小屏下同样覆盖原生 `@media`。需要使用 `isSkyline` 门控的 Skyline 默认类（如 `.wrapper-skyline`）放在 `@media` 后面，只覆盖 Skyline 分支。

## 模板结构适配

### [必须] 模板中数据绑定外的转义改为标准 XML 转义

数据绑定**外**的引号须改用 XML 实体转义；数据绑定**内**无需再转义。

```html
<!-- ❌ Bad — 旧写法：反斜杠转义 -->
<view prop-a="\"test\"" prop-b="{{ test === \"test\" }}" />

<!-- ✅ Good — 新写法：XML 实体转义（外）、不转义（内） -->
<view prop-a="&quot;test&quot;" prop-b="{{ test === 'test' }}" />
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
```

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
