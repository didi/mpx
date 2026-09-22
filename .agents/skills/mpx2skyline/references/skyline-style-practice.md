# Skyline 布局与样式适配实践

本文记录 WebView 迁移 Skyline 时偏视图层的改造方案，覆盖布局、样式、层级与文本适配。

## 目录

- [布局适配](#布局适配)
  - [垂直 margin 折叠处理](#垂直-margin-折叠处理)
  - [正常流占位与负 margin 重叠布局](#正常流占位与负-margin-重叠布局)
  - [内联混排](#内联混排)
  - [z-index 与层叠适配](#z-index-与层叠适配)
  - [sticky 吸顶替代方案](#sticky-吸顶替代方案)
  - [scroll-view 高度自适应](#scroll-view-高度自适应)
- [样式适配](#样式适配)
  - [文本溢出省略适配](#文本溢出省略适配)
  - [字体 PostScript name 兼容](#字体-postscript-name-兼容)
  - [伪元素不支持的 animation 需替换为真实节点](#伪元素不支持的-animation-需替换为真实节点)
  - [animation API 不支持 → 使用 CSS transition](#animation-api-不支持--使用-css-transition)
  - [text-decoration-line 多值适配](#text-decoration-line-多值适配)
  - [Flex 布局的子节点 min-width 百分比撑开失效](#flex-布局的子节点-min-width-百分比撑开失效)
  - [Flex 布局的子节点文本超出未自动换行](#flex-布局的子节点文本超出未自动换行)
  - [@media screen 兼容方案](#media-screen-兼容方案)


---

## 布局适配

### 垂直 margin 折叠处理

微信 WebView 的普通块级布局中，满足 CSS margin 折叠条件的节点关系可能发生垂直 `margin` 折叠：相邻兄弟元素、父元素与首个 / 末个流内后代、空块自身的上下 margin 都可能折叠。CSS margin 折叠只发生在垂直方向，水平方向的 `margin-left` / `margin-right` 不受影响。具体条件参考 [MDN · 掌握外边距折叠](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Box_model/Margin_collapsing)。

Skyline 没有 BFC 和 margin 折叠机制，`margin-top` / `margin-bottom` 会作为节点自身间距参与布局，相邻节点的垂直 margin 通常会叠加。因此适配普通块级布局中满足 margin 折叠条件的节点关系时，需要显式处理原平台发生的 margin 折叠，避免同一组 margin 在 Skyline 中产生更大的间距。

**先确认 WebView 会折叠，再改造：**不要仅因两个垂直 margin 同时存在就归到单侧。下表用于判断原 WebView 的最终渲染结构，不是 Skyline 的能力支持清单；例如 Flex / Grid、BFC 等条件描述的是原布局是否折叠。按节点关系逐项判断；命中任一“不要处理”条件，或无法确认原平台会发生折叠时，保留原 margin。

| 节点关系 | 确认会折叠 | 反向约束：以下情况不要处理 |
| --- | --- | --- |
| 相邻兄弟 | 最终渲染结果中相邻的普通块级兄弟，前项 `margin-bottom` 与后项 `margin-top` 之间没有其他内容 | 共享父容器为 Flex / Grid；任一节点浮动或使用 `position: absolute/fixed`；后一节点因 `clear` 产生 clearance；条件渲染后并不相邻 |
| 父元素与首个流内后代 | 两者的 `margin-top` 之间没有父元素的 `border-top`、`padding-top`、行内内容或 clearance，且父元素未建立新 BFC | 存在任一左述分隔条件；父元素通过 `overflow: hidden/auto/scroll`、`display: flow-root` 等建立 BFC；父元素为 Flex / Grid 容器 |
| 父元素与末个流内后代 | 两者的 `margin-bottom` 之间没有父元素的 `border-bottom`、`padding-bottom`，父元素没有明确 `height` / `min-height`，且未建立新 BFC | 存在任一左述分隔条件；父元素通过 `overflow: hidden/auto/scroll`、`display: flow-root` 等建立 BFC；父元素为 Flex / Grid 容器 |
| 空块自身 | `margin-top` 与 `margin-bottom` 之间没有 `border`、`padding`、行内内容、`height` 或 `min-height` | 存在任一左述分隔条件 |

在 WebView 中，`overflow: hidden/auto/scroll` 建立 BFC 后，会阻止父元素自身 margin 与其后代 margin 跨父子边界折叠；但该父元素的外边距是否与相邻兄弟折叠，仍须按“相邻兄弟”一行独立判断，不能仅凭 `overflow` 排除。

折叠后的值也不能一律用 `max()` 计算：两侧均为非负值时取较大值；同时存在正负 margin 时，取最大正值与最小负值之和；全部为负值时取最小值（绝对值最大的负值）。

**推荐处理原则：**

1. **容器边界间距由父容器单侧表达**：外部间距使用父容器 margin，内部留白使用父容器 padding，不要依赖首个 / 末个子节点的 margin 与父容器折叠。
2. **兄弟节点间距只交给一侧负责**：按模板顺序逐对检查普通块级布局中满足 margin 折叠条件的相邻兄弟节点，同时识别 `margin` 简写隐含的 `margin-top` / `margin-bottom`。将原平台折叠后的有效间距完整放在任意一侧，另一侧删除或置 `0`；常见的两侧非负 margin 场景取两者较大值，例如 `24rpx` 与 `12rpx` 归为单侧 `24rpx`，两侧均为 `20rpx` 时归为单侧 `20rpx`。不要因为 `margin` 属性本身受 Skyline 支持就跳过这项布局语义检查。
3. **用模板状态标记首尾项**：需要去掉首项或末项间距时，用 `wx:class` + `index` 显式绑定单类。
4. **必要时可显式声明纵向 Flex**：如果容器内仍存在难以拆解的垂直 margin 关系，可在确认不影响原布局的前提下，同时声明 `display: flex` 与 `flex-direction: column`，使原平台子节点也作为 flex item 参与布局，避免垂直 margin 折叠；若已通过 `padding` 和单侧 margin 明确处理间距，则不必额外添加 flex 声明。

Skyline 中的 `overflow: hidden` 用于裁剪，不会像 WebView 一样建立 BFC。原 WebView 已通过它阻止父子 margin 折叠的场景，不属于父子折叠差异；有裁剪需求时仍需保留。添加纵向 Flex 是为了使 WebView 也采用不折叠的布局，并非在 Skyline 中创建 BFC；应同时声明 `display: flex` 和 `flex-direction: column`，核对原本折叠的间距及默认拉伸行为。

**❌ 避免：**下例使用普通块级布局，其中“父元素与首个子元素”和“两个相邻兄弟元素”这两组节点关系均满足 margin 折叠条件。原平台中 `.card` 与标题的顶部 margin 折叠为 `24rpx`，标题和说明的相邻垂直 margin 折叠为 `16rpx`；Skyline 中兄弟间距为 `16 + 12 = 28rpx`，父子 margin 也分别参与布局，父容器外部 margin 为 `20rpx`，标题相对父容器顶部再偏移 `24rpx`，标题顶部的总偏移为 `44rpx`。下例父容器外部没有其他可折叠 margin，并显式使用普通块级布局。

```html
<!-- ❌ Bad — 依赖普通块级布局中的父子及兄弟垂直 margin 折叠 -->
<template>
  <view class="card">
    <view class="card-title">标题</view>
    <view class="card-desc">说明</view>
  </view>
</template>

<style>
  .card, .card-title, .card-desc {
    display: block;
  }

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

**✅ 推荐：**把父子顶部折叠后的 `24rpx` 外部间距归给 `.card` 的 `margin-top`，把标题和说明之间的 `16rpx` 间距交给单侧节点。两端的外部间距与项间距分别保持一致，不把外部 margin 改成内部 padding。

```html
<!-- ✅ Good — 父容器承接 24rpx 外部间距，说明节点承接 16rpx 兄弟间距 -->
<template>
  <view class="card">
    <view class="card-title">标题</view>
    <view class="card-desc">说明</view>
  </view>
</template>

<style>
  .card, .card-title, .card-desc {
    display: block;
  }

  .card {
    margin-top: 24rpx;
  }

  .card-desc {
    margin-top: 16rpx;
  }
</style>
```

**内部留白与外部间距分开验收**：父容器的外部间距由父 `margin` 表达，不能直接替换为内部 `padding`。若需求明确为子盒顶部距父容器上外沿 `20px`（父容器无边框），使用父 `padding-top: 20px`，并清理重复的子 `margin-top`；子盒自身还有 `padding-top: 10px` 时，其内容顶部距父外沿为 `30px`。先确认测量的是子盒边界还是内容起点。

**列表场景：**外沿到首尾子盒的内部留白由父 `padding` 表达，项间距按模板顺序只交给非首项的 `margin-top`。

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
  .list, .list-item {
    display: block;
  }

  .list {
    padding-top: 24rpx;
    padding-bottom: 24rpx;
  }

  .list-item-gap {
    margin-top: 16rpx;
  }
</style>
```

### 正常流占位与负 margin 重叠布局

当沿正常流排列的前后两个节点需要部分重叠，同时仍需为后续内容提供稳定的布局占位时，应分别明确前一节点的占位尺寸、后一节点的重叠偏移和两者的绘制顺序。常见场景包括背景与内容叠放、相邻区块搭接，以及提示区域被后续内容部分覆盖。

**❌ Bad：依赖子组件内部负 margin 推算外部占位**

```css
.tips-wrapper {
  position: relative;
  z-index: 1;
}

.content-card {
  position: relative;
  z-index: 3;
  margin-top: -92rpx;
}

.tips-bar-container {
  padding-bottom: 92rpx;
}

.tips-bar {
  height: 92rpx;
  margin-bottom: -28rpx;
}
```

**Skyline 下的表现**：`tips-bar` 高度偏高。内部 `.tips-bar` 的 `margin-bottom: -28rpx` 未按预期削减占位高度，导致装饰条的实际高度与预期不符。

**原因**：依赖自定义组件内部的 `height`、`padding-bottom` 和负 `margin-bottom` 共同决定正常流占位，Skyline 下 `margin-bottom: -28rpx` 没有产生预期的高度削减效果，因此基于预期组件高度设置的 `margin-top: -92rpx` 也无法得到目标露出高度。


**❌ Bad：前一节点脱离正常流，后一节点用正 margin 补偿占位**

```css
.tips-wrapper {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
}

.content-card {
  position: relative;
  z-index: 3;
  margin-top: 68rpx;
}
```

**Skyline 下的表现**：装饰条仍被后续卡片整体覆盖，无法形成装饰条上半部分露出、下半部分被卡片覆盖的包裹效果。

**原因**：装饰条和卡片分别设置为 `z-index: 1` 和 `z-index: 3`，Skyline 按共同父级下的兄弟分支比较层级，低层级的装饰条分支被后续卡片分支整体覆盖。


**✅ Good：前一节点显式占位，后一节点用负 margin 控制重叠量**

将两个节点放在同一父节点下，以真实 `view` 承载占位尺寸和层级样式，使二者成为可直接比较的兄弟节点。下面的 `tips-wrapper` 承载前一节点，`content-card` 为后续覆盖节点：

```html
<view class="card-container">
  <view class="tips-wrapper">
    <tips-bar />
  </view>
  <view class="content-card">卡片内容</view>
</view>
```

```css
.card-container {
  position: relative;
  overflow: hidden;
}

.tips-wrapper {
  position: relative;
  z-index: 1;
  height: 94rpx;
  overflow: visible;
}

.content-card {
  position: relative;
  z-index: 2;
  margin-top: -30rpx;
}
```

**Skyline 下的表现**：装饰条稳定露出 `64rpx`，卡片覆盖其余 `30rpx`；卡片顶部圆角外侧仍显示下层背景，装饰条不会因自定义组件内部布局变化而被整体覆盖。

**原因**：

- 前一节点的 wrapper 在正常流中显式占据完整高度，后一节点通过负 `margin-top` 定义重叠量。对于本例两个节点之间没有额外间距的纵向布局，露出高度 = 前一节点占位高度 - 重叠量，即 `94rpx - 30rpx = 64rpx`。
- 层级样式落在两个真实兄弟 `view` 上，`z-index` 只负责明确绘制顺序，不再承担布局修复。不要依赖子组件内部 `padding`、负 margin 与内容高度的隐式组合推算外部占位，也不要再通过 `top`、`transform` 或另一侧 margin 重复修正位置。

该方案适用于节点需要参与正常流占位、且重叠量可以明确确定的场景。内容尺寸动态变化时，应先明确占位尺寸的更新方式，再计算重叠关系，不直接套用示例中的固定高度。纯悬浮且不需要参与布局的元素仍可使用绝对定位。

### 内联混排

`span` 是 Skyline 的内联容器，用于将文本、图片、链接等组织为同一段内联内容。适用场景包括图标与文字、文字与 `navigator` 链接、不同字号或样式的价格文本，以及包含自定义文本组件（如 `rich-text` / `special-text`）的混排。

尤其内联混排场景下还带 `truncate` / `line-clamp` / `whitespace-nowrap` 等超长省略逻辑，不要只补 `max-lines` / `overflow`，需在容器上加上 `mpxTagName@wx="span"` 实现内联混排，否则 Skyline 下内联混排场景下文本无法按 WebView 预期实现超长省略。


**仅文本样式嵌套可使用 `text` 嵌套 `text`，包含图片或链接时使用 `span` 组织，Mpx 中沿用 `<view mpxTagName@wx="span">` 写法**

```html
<view mpxTagName@wx="span">
  <image src="/images/icon.png" style="width: 16px; height: 16px;" />
  <text>阅读并同意</text>
  <navigator url="/pages/agreement/index"><text>《用户协议》</text></navigator>
</view>
```

`span` 负责内联组织，截断按实际需求配置：需要单行或多行省略时再添加 `max-lines` / `overflow`，同时保留 WebView 对应的省略样式；允许自然换行的段落不要统一添加 `whitespace-nowrap` 或 `max-lines="{{1}}"`。

以下是**图标与自定义文本组件单行省略**的迁移示例，此处 `rich-text` 为接收 `text` 属性的业务组件，只补省略属性不能解决图文混排场景下的文本节点的超长省略问题。

```html
<view class="flex-1 w-0 truncate">
  <image
          class="v-middle flex-none w-10px h-10px mb-2px mr-2px"
          src="https://img-hxy021.didistatic.com/static/starimg/img/tbLezkOe9q1670901034023.png"
          mode="heightFix" />
  <rich-text text="儿童贴心服务｜设置本次乘车新偏好" />
</view>
```

**适配要点：**

1. 在 Skyline 下切换 `whitespace-nowrap`、`inline-block`、`inline-flex` 等兼容样式，非 Skyline 保持不变。
2. 图标、文本同属一段内联内容时，放在同一个 `mpxTagName@wx="span"` 容器内。
3. Skyline 下图片改为 `inline-block` 布局，组件 rich-text virtual-host 节点改为 `inline-flex`，此条规则仅用于现有业务结构的适配；基础 `span` + `text` / `image` / `navigator` 组合不能机械照搬样式，在有类似场景下再考虑应用这条规则。

```html
<!-- truncate 为原子类中超长打点类，包含样式 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
     Skyline 仅需保留 `white-space: nowrap;`
     Skyline 超长打点通过 `max-lines`/`overflow` 属性实现
-->
<view
        mpxTagName@wx="span"
        max-lines="{{1}}"
        overflow="ellipsis"
        class="flex-1 w-0"
        wx:class="{{ { 'whitespace-nowrap': renderer === 'skyline', truncate: renderer !== 'skyline' } }}">
  <!-- Skyline 下将 image 组件 节点改为 inline-block 布局 -->
  <image
          class="v-middle flex-none w-10px h-10px mb-2px mr-2px"
          wx:class="{{ { 'inline-block': renderer === 'skyline' } }}"
          src="https://img-hxy021.didistatic.com/static/starimg/img/tbLezkOe9q1670901034023.png"
          mode="heightFix"
  />
  <!-- Skyline 下将组件 virtual-host 节点改为 inline-flex 布局 -->
  <rich-text
          class="v-middle"
          wx:style="{{renderer === 'skyline' ? { display: 'inline-flex' } : {}}}"
          text="儿童贴心服务｜设置本次乘车新偏好"
  />
</view>
```

```html
<script setup>
import { getCurrentInstance } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy

defineExpose({ renderer })
</script>
```

### z-index 与层叠适配

Skyline 不使用 WebView 的层叠上下文模型，未设置的 `z-index` 按 `0` 处理。节点分为两套层级：

- **normal-context**：非 `fixed` 节点按共同父级下的兄弟分支比较 `z-index`；跨分支时，向上找到共同父级下对应的祖先兄弟，比较这两个分支。值相同时，DOM 靠后的分支层级更高。
- **fixed-context**：所有 `fixed` 节点全局提升，按自身 `z-index` 排序，整体位于非 `fixed` 内容之上。

适配时遵循以下约束：

1. 将需要直接比较层级的节点调整到同一父级下；局部重叠使用 `relative` + `absolute`，全屏弹层按需使用 `fixed`。
2. `transform` / `opacity` / `will-change` 不会建立层叠上下文或提升层级，不要依赖这些属性修复 `z-index`。
3. `scroll-view` 直接子节点的 `z-index` 不生效；需要控制滚动项层级时，在内部增加一层节点承载 `z-index`。

### sticky 吸顶替代方案

`position: sticky` 在 Skyline 下不可用，需用 `sticky-header` / `sticky-section` 组件替代。但 `sticky-header` / `sticky-section` 是 Skyline 专属组件，WebView 下不识别，而 WebView 的 `position: sticky` 本就可用，属于「Skyline 支持但 WebView 不需要」的写法，**不要替换 WebView 原生写法**，而是用 [运行时 renderer 判断](./skyline-runtime-practice.md#判断当前渲染模式) 隔离两条分支。

```html
<!-- 模板直接通过 renderer 判断当前渲染模式 -->
<scroll-view type="custom" scroll-y>
  <!-- Skyline：sticky-section + sticky-header 组件 -->
  <sticky-section wx:if="{{renderer === 'skyline'}}">
    <sticky-header class="sticky-title">吸顶标题</sticky-header>
    <view>列表内容</view>
  </sticky-section>
  <!-- WebView：保留 position: sticky 原生写法 -->
  <block wx:else>
    <view class="sticky-title webview-sticky">吸顶标题</view>
    <view>列表内容</view>
  </block>
</scroll-view>
```

```html
<script setup>
import { getCurrentInstance } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy

defineExpose({ renderer })
</script>
```

```css
/* 两端都需显式背景色，避免吸顶时透字穿透 */
.sticky-title { background: #fff; }
/* WebView 专属：position: sticky 在 Skyline 下静默失效，仅 WebView 分支使用 */
.webview-sticky { position: sticky; top: 0; }
```

**Skyline 分支结构约束**：

- `sticky-header` 必须是 `sticky-section` 的**第一个子节点**；每个 `sticky-section` 仅允许一个 `sticky-header`。
- `sticky-section` 必须放在 `scroll-view type="custom"` 内（不可裸用）。
- `sticky-header` **必须显式声明背景色**（`background` / `background-color`）。Skyline 下 `sticky-header` 默认透明，吸顶时下层列表内容会透字穿透，常见症状是“吸顶后文字与列表叠在一起”。

### scroll-view 高度自适应

Skyline 下 `scroll-view` 默认不会按内容高度自动撑开。优先在 `app.json` 中开启 `enableScrollViewAutoSize`，并用 `max-height` 限制滚动区域：内容未达到上限时自动撑开，超过上限后滚动。

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

## 样式适配

### 文本溢出省略适配

文本溢出省略，或者文本超长打点，在 Skyline 下需要在对应的 `view`/`text`/`rich-text`/`special-text` 组件上增加 `max-lines`/`overflow` 属性。

> **完整扫描要求**：适配时须扫描组件/页面内**所有**包含文本省略样式（`text-overflow: ellipsis` / `-webkit-line-clamp` / `overflow: hidden` + `white-space: nowrap` 组合）的节点，逐一为其补齐 `max-lines`/`overflow`。

> 注意事项
>
> **新增/替换 `text` 节点时务必把插值压回单行**：`<view>` 会折叠首尾空白，`<text>` 则字面保留。开闭标签之间留下换行 + 缩进会被当作前导/尾随空格渲染出来，影响 `max-lines`/`overflow` 的截断点与视觉对齐。属性多到必须折行时，只折属性、把插值紧贴 `>`。
> **WebView 样式与 Skyline 属性共存**：原 WebView 的 WebKit 省略样式（`-webkit-line-clamp`/`-webkit-box-orient`/`display:-webkit-box`/`text-overflow:ellipsis`/`white-space: nowrap`/`overflow: hidden;`）**保留不删**（WebView 仍需要），同时在承载文本的 `view` / `text` / `rich-text` / `special-text` 节点**新增** `max-lines`/`overflow` 属性给 Skyline 使用。两者共存互不冲突。

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

> 注意：文本省略场景下不要删除原 WebView 下的文本省略样式，尤其是 `display: -webkit-box;`。

```html
<view class="normal"
      wx:class="{{{ ellipsis: renderer !== 'skyline' }}}" max-lines="{{2}}" overflow="ellipsis">{{title}}</view>
```

```html
<script setup>
import { getCurrentInstance } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy

defineExpose({ renderer })
</script>
```

```css
.ellipsis {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis
}
```

### 字体 PostScript name 兼容

部分机型可能不支持 `font-weight: 500` / `600` 等数值加粗，但直接改为 `bold` / `700` 可能改变 WebView 视觉表现。命中时先澄清确认是否调整字重；确认后再统一修改，未确认时保留原值并说明 Skyline 兼容风险。涉及自定义字体时，先检查字体资源与 PostScript name 映射，再确定替代写法。

确认需要调整后，可参考以下自定义字体 PostScript name 映射：

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

> Skyline 支持的自定义字体格式有：TTF / OTF / WOFF2。

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

Skyline 不支持 `wx.createAnimation` API（`animation` 属性赋值方式），需要改用 CSS `transition` 或 Worklet 动画。

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
<!-- ✅ Good — 运行时判断：Skyline 嵌套 text 各承担一条装饰线；WebView 维持单节点双值 -->
<!-- 嵌套 text 的插值务必紧贴标签，text 节点会字面保留首尾空白 -->
<text wx:if="{{renderer === 'skyline'}}" class="underline"><text class="line-through">{{price}}</text></text>
<text wx:else class="dual-decoration">{{price}}</text>
```

```html
<script setup>
import { getCurrentInstance } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy

defineExpose({ renderer })
</script>
```

```css
/* WebView：单节点双值即可叠加两条线 */
.dual-decoration { text-decoration-line: underline line-through; }
/* Skyline：外层节点画下划线，内层节点画删除线，嵌套后两条线同时生效 */
.underline { text-decoration-line: underline; }
.line-through { text-decoration-line: line-through; }
```

> 嵌套的内外层只设 `text-decoration-line`，字号/颜色等由外层继承，避免重复声明导致两层样式打架。两条装饰线归属哪层不影响最终视觉，但内层文本节点要紧贴标签写，防止 `text` 字面保留空白把价格文案撑出多余间距。

### Flex 布局的子节点 min-width 百分比撑开失效

Skyline 下 Flex 布局子节点依赖百分比 `min-width` 撑开或等分时，百分比无法按预期生效，节点会按内容收缩。
这个 case 中，外层 `.estimate-form` 的 `min-width: 100%` 未能撑满一屏，子项 `.form-item` 的 `min-width: 25%` 也未能按四等分撑开。典型表现是业务工具栏在 WebView 下 4 个按钮均分一屏，但 Skyline 下子项宽度按内容收缩，导致间距和滚动范围异常。

```html
<!-- ❌ Bad — 子项依赖百分比 min-width 撑开 -->
<view class="estimate-form text-12px" id="estimate-form">
  <view class="form-item" wx:for="{{operationList}}" wx:key="key">
    <view class="form-item-content-wrapper normal">
      <image wx:if="{{item.icon}}" src="{{item.icon}}" class="form-item-icon normal" />
      <view wx:else class="form-item-text normal">{{item.title}}</view>
    </view>
  </view>
</view>
```

```stylus
/* ❌ Bad — flex 布局内的 min-width 百分比在 Skyline 下不生效 */
.estimate-form
  display flex
  // Skyline 下这里也未能按一屏宽度撑开
  min-width 100%
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
    // Skyline 下这里也未能按四等分宽度撑开
    min-width 25% 
    max-width 100%
    box-sizing border-box
```

```html
<!-- ✅ Good — 用 rpx 固定换算值替代百分比 min-width -->
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

1. 不再依赖 `min-width` 百分比撑开，按实际基准宽度换算为 `rpx` / `px` 等明确长度单位。若基准宽度是一屏，750rpx 代表屏宽，25% 可写为 187rpx。
2. 若外层内容容器预期至少撑满一屏，使用 `min-width: 750rpx`；若基准不是一屏，应按实际容器设计宽度换算，不要机械套用 750rpx。

### Flex 布局的子节点文本超出未自动换行

Skyline 下 Flex 布局的子节点文本超出后可能无法自动换行，因为此时子节点宽度由文本内容决定，需要显式指定宽度。

```html
<view class="wrapper">
  <text class="content">测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案</text>
  <view class="content">测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案</view>
  <span class="content">测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案测试文案</span>
</view>
```

```css
/* ❌ Bad — .content 未定义 width，Skyline 下未能自动换行 */
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

### @media screen 兼容方案

Skyline 不支持 `@media screen`，会忽略 `@media screen` 的条件，却保留其中的样式声明。因此，媒体查询中的选择器必须限定为**仅非 Skyline 节点持有的类**，不能直接匹配两种渲染模式共用的基础类。

两条路径按相同的业务断点条件实现响应式适配，可用于小屏、中屏、大屏或多个宽度区间：

- **WebView**：仅在 `renderer !== 'skyline'` 时添加媒体查询专用类，由 `@media screen` 判断是否命中业务断点条件。
- **Skyline**：根据运行时窗口宽度计算对应断点状态，仅在 `renderer === 'skyline'` 且条件满足时添加相应动态类。

以下仅以小屏适配为例：窗口宽度不大于 `320px` 时隐藏内容，分别使用 `wrapper-webview` 限定 WebView 规则、`isSmall` 与 `wrapper-small` 表达 Skyline 的小屏状态。实际业务按需调整断点条件、状态与类名；媒体查询和脚本须使用相同的窗口宽度口径、阈值及边界条件，屏幕物理尺寸不替代窗口尺寸。

```html
<template>
  <view
    class="wrapper"
    wx:class="{{ {
      'wrapper-webview': renderer !== 'skyline',
      'wrapper-small': renderer === 'skyline' && isSmall
    } }}"
  >内容</view>
</template>

<script setup>
import { getCurrentInstance, ref } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy
const isSmall = ref(false)

if (renderer === 'skyline') {
  isSmall.value = wx.getWindowInfo().windowWidth <= 320
}

defineExpose({ renderer, isSmall })
</script>

<style>
.wrapper {
  display: block;
}

/* 只有非 Skyline 节点持有 wrapper-webview 类 */
@media screen and (max-width: 320px) {
  .wrapper-webview {
    display: none;
  }
}

/* 只有 Skyline 小屏节点持有 wrapper-small 类 */
.wrapper-small {
  display: none;
}
</style>
```

> 注意事项：
> Skyline 节点始终不带 `wrapper-webview`，即使媒体条件被忽略，内部规则也无法匹配；
> Skyline 下依赖 API 动态计算添加动态类，WebView 继续依赖原生媒体查询。
> 迁移已有媒体查询时，要为其中每个选择器补齐非 Skyline 类限定，包括逗号分组中的每一项；仅给部分规则加限定仍会产生泄漏，调整业务断点条件或样式时，同步更新媒体查询与运行时判断及动态类样式。
