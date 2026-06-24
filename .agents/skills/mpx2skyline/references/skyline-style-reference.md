# Skyline WXSS 样式能力参考

Skyline 渲染引擎 CSS 支持范围与 WebView 有所不同。本文档说明 Skyline 下的样式能力支持情况与属性差异。

## 目录


- [Skyline WXSS 样式能力参考](#skyline-wxss-样式能力参考)
  - [目录](#目录)
  - [样式能力支持情况](#样式能力支持情况)
    - [模块支持](#模块支持)
    - [选择器支持](#选择器支持)
    - [值类型支持](#值类型支持)
    - [CSS 变量与函数](#css-变量与函数)
  - [样式属性支持详情](#样式属性支持详情)
    - [布局](#布局)
    - [Flex布局](#flex布局)
    - [定位与层级](#定位与层级)
    - [尺寸（Width/Height）](#尺寸widthheight)
    - [间距（Margin/Padding）](#间距marginpadding)
    - [边框（Border）](#边框border)
    - [背景（Background）](#背景background)
    - [文本与字体](#文本与字体)
    - [变换（Transform）](#变换transform)
    - [阴影与不透明度](#阴影与不透明度)
    - [动画与过渡](#动画与过渡)
    - [滤镜与遮罩](#滤镜与遮罩)
    - [其他属性](#其他属性)
    - [不支持的属性](#不支持的属性)
  - [与 WebView 模式的关键样式差异](#与-webview-模式的关键样式差异及兼容方案)

---

## 样式能力支持情况

### 模块支持

| 模块 | 支持情况 | 备注 |
| --- | --- | --- |
| Flex 布局 | ✅ | 含 `inline-flex`，是 Skyline 默认布局 |
| Block 布局 | ✅ | 推荐开启默认Block布局，配置 `rendererOptions.skyline.defaultDisplayBlock: true` |
| Positioned 布局 | ✅ | `sticky` 不支持，使用 `sticky-header`/`sticky-section` 替代 |
| CSS Animation | ✅ | Android 8.0.37+，iOS 8.0.39+ |
| CSS Transition | ✅ | |
| CSS Variable | ✅ | Android 8.0.35+，iOS 8.0.38+ |
| 背景与边框 | ✅ | |
| 盒子模型 | ✅ | 支持 `border-box` 和 `content-box`，**无 BFC** |
| 字体 / `@font-face` | ✅ | 仅支持 ttf 格式 |
| Inline / Inline-Block 布局 | ❌ | 可在 `<text>` 内嵌套使用 |
| Media queries | 部分支持 | 仅支持 DarkMode（`@media (prefers-color-scheme: dark)`） |
| Grid 布局 | ❌ | 使用 Flex 布局或 `grid-view` 组件替代 |


### 选择器支持

| 类别 | 示例 | 支持 | 最低版本 | 备注 |
| --- | --- | --- | --- | --- |
| 通配选择器 | `* {}` | ❌ | | |
| 元素选择器 | `tag {}` | ✅ | | |
| 类选择器 | `.class {}` | ✅ | | |
| ID 选择器 | `#id {}` | ✅ | | |
| 分组选择器 | `a, b {}` | ✅ | | |
| 后代选择器 | `a b {}` | ✅ | | |
| 直接子代选择器 | `a > b {}` | ✅ | | |
| 一般兄弟选择器 | `a ~ b {}` | ✅ | 8.0.49 | |
| 紧邻兄弟选择器 | `a + b {}` | ✅ | 8.0.49 | |
| 属性选择器 | `[attr] {}` | ❌ | | |
| 伪类 `:active` | `:active {}` | ✅ | | |
| 伪类 `:first-child` / `:last-child` | | ✅ | | |
| 伪类 `:not` / `:only-child` / `:empty` | | ✅ | 8.0.49 | |
| 伪类 `:nth-child` | | ✅ | 8.0.50 | 对应 Skyline 1.3.3 |
| 伪元素 | `::before {}` / `::after {}` | ✅ | | 只支持 ::before 和 ::after，必须双冒号声明 |

### 值类型支持

#### 长度（`<length>`）

| 单位/格式 | 支持 | 说明 |
| --- | --- | --- |
| `px` | ✅ | 物理像素 |
| `rpx` | ✅ | 响应式像素，按设备宽度 750rpx 折算 |
| `vw` / `vh` | ✅ | 视口宽 / 高的 1% |
| `vmin` / `vmax` | ✅ | 视口宽高中的较小 / 较大值的 1% |
| `rem` | ✅ | 相对根节点 `font-size`（Skyline 默认根 `font-size` 为 `16px`） |
| `em` | ❌ | 使用 `rpx` / `px` / `rem` 替代 |
| `auto` | ✅ | 用于尺寸、定位、外边距等场景 |
| `calc()` | ✅ | 仅支持长度类型计算（加减乘除、混合单位），**不支持 `<angle>` 等其他类型计算**；不要嵌套使用 |
| `env()` | ✅ | 仅支持 `safe-area-inset-*` 系列：`safe-area-inset-top` / `safe-area-inset-right` / `safe-area-inset-bottom` / `safe-area-inset-left` |

#### 百分比（`%`）支持情况

⚠️ Skyline 官方文档的「值类型支持列表」中，`<length>` 一列**并未列出 `%`**。`%` 的支持需按属性逐个判断，**不要默认所有 `<length>` 类属性都接受 `%`**。

**① 文档明确提到 `%` 的属性：**

| 属性 | 文档原文 | `%` 参照对象 |
| --- | --- | --- |
| `line-height` | 类型列含 `<percent>` | 当前 `font-size` |
| `transform-origin` | 默认值 `50% 50%` | 元素自身的 `width` / `height` |
| `background-position` | 「完全支持 `<bg-position>#`，参考 MDN」 | 元素尺寸 - 背景图尺寸 |

**② 文档明确**不**支持 `%` 的属性：**

| 属性 | 文档原文 |
| --- | --- |
| `font-size` | 「不支持百分比；不支持 keyword (smaller..)」 |

**③ 文档未声明、需实测的属性：**

下列属性在官方文档中类型仅写为 `<length>`，未声明是否接受 `%`。在 Skyline 真机/模拟器上落地前请逐项验证，不要直接迁移 WebView 的 `%` 用法：

- 尺寸类：`width` / `height` / `min-width` / `min-height` / `max-width` / `max-height`
- 定位类：`top` / `right` / `bottom` / `left`
- 盒模型：`padding` / `padding-*` / `margin` / `margin-*`
- Flex：`flex-basis` / `gap` / `row-gap` / `column-gap`
- 边框：`border-radius` / `border-*-radius` / `border-width` / `border-*-width`
- 背景：`background-size`
- 阴影：`box-shadow` / `text-shadow` 的偏移与模糊半径
- 文本：`letter-spacing` / `word-spacing`
- 变换：`transform: translate*()` / `translateZ()` / `perspective`

> 实践建议：
> 
> 除上文 ① 列明确支持的属性外，优先使用 `rpx` / `px` / `vw` / `vh` 等明确长度单位；
> `flex: 1 0 auto` + `min-width` 实现自动扩展的场景下，min-width 需要使用 rpx 单位
> 如必须使用 `%`，请在目标平台（iOS / Android / 开发者工具）三端实测后再纳入产线代码。

#### `auto` 关键字支持情况

⚠️ Skyline 官方文档中，`auto` 在不同属性的「取值」列和「默认值」列出现情况不一致：有的属性把 `auto` 写进取值，有的只把 `auto` 列作默认值，还有部分属性明确不支持 `auto`。**不要默认所有 `<length>` 类属性都接受 `auto`**。

**① 文档支持 `auto` 的属性（含取值列明确列出 `auto`，或默认值为 `auto`）：**

| 属性 | 文档原文（取值 / 默认值） | 备注 |
| --- | --- | --- |
| `pointer-events` | `auto / none`，默认 `auto` | 取值列明确列出 |
| `align-self` | `auto / stretch / center / flex-start / flex-end / baseline`，默认 `auto` | 取值列明确列出 |
| `background-size` | `contain / cover / [<length> | auto]{1, 2}`，默认 `auto` | 取值列明确列出 |
| `will-change` | `auto / contents`，默认 `auto` | 取值列明确列出 |
| `width` / `height` | `<length>`，默认 `auto` | 取值列仅写 `<length>`，靠默认值兜底 |
| `min-width` / `max-width` | `<length>`，默认 `auto` | 取值列仅写 `<length>`，靠默认值兜底 |
| `top` / `right` / `bottom` / `left` | `<length>`,默认 `auto` | **`position: fixed` 下 top/left/bottom/right 默认值 `auto` 不解析**（文档原文，需显式设值） |
| `flex-basis` | `<length>`，默认 `auto` | 取值列仅写 `<length>`，靠默认值兜底 |

**② 文档明确不支持 `auto` 的属性：**

| 属性 | 文档原文 |
| --- | --- |
| `overflow` | 仅支持 `hidden` / `visible`，「scroll 不支持，只能通过 scroll-view 实现」（无 `auto`） |
| `min-height` / `max-height` | 默认值为 `none`（非 `auto`） |

**③ 文档未声明、需实测的属性：**

下列属性在 WebView 下常用 `auto`，但官方文档「取值」与「默认值」列均未列出 `auto`，落地前请实测：

- `margin` / `margin-*`：文档类型仅 `<length>{1,4}`，未列 `auto`；`margin: 0 auto` 水平居中等用法需实测
- `padding` / `padding-*`：CSS 规范本身不支持 `padding: auto`，此处一致

> 实践建议：
>
> 仅在上文 ① 明确支持的场景使用 `auto`；
> `position: fixed` 元素必须显式声明 `top` / `left` / `bottom` / `right`；
> 居中布局优先使用 Flex（`justify-content` / `align-items`）而非 `margin: auto`

#### 颜色值（`<color>`）

| 格式 | 支持 | 说明 |
| --- | --- | --- |
| color keywords（`red` 等） | ✅ | |
| `transparent` | ✅ | |
| `currentColor` | ❌ | 计划支持，目前请显式指定颜色值 |
| `#RGB` / `#RRGGBB` / `#RGBA` / `#RRGGBBAA` | ✅ | |
| `rgb()` / `rgba()` | ✅ | |
| `hsl()` / `hsla()` | ✅ | |

**渐变（`<gradient>`）：**

| 格式 | 支持 | 限制 |
| --- | --- | --- |
| `linear-gradient()` | ✅ | 颜色停止位置仅支持 `%` 和固定长度单位（px、rpx 等） |
| `radial-gradient()` | ✅ | 仅支持 `circle` 形状（不支持 `ellipse`）；尺寸仅支持 `px`；颜色停止位置仅支持 `%` |
| `conic-gradient()` | ✅ | 完全支持 |

**其他类型：**

| 类型 | 格式 | 支持 | 说明 |
| --- | --- | --- | --- |
| `<url>` | `url()` | ✅ | |
| `<angle>` | `deg` / `grad` / `rad` / `turn` | ✅ | |
| `<time>` | `s` / `ms` | ✅ | |
| `<border-style>` | `none` / `solid` / `dashed` / `dotted` / `hidden` | ✅ | |
| `<timing-function>` | `ease` / `ease-in` / `ease-out` / `ease-in-out` / `linear` / `cubic-bezier()` / `steps()` | ✅ | |
| `<filter-function>` | `blur()` / `brightness()` / `contrast()` / `grayscale()` / `hue-rotate()` / `invert()` / `opacity()` / `saturate()` / `sepia()` | 部分支持 | 不支持 `drop-shadow()`；不支持多函数组合 |

### CSS 变量与函数

```css
page {
  --primary-color: #1890ff;
  --spacing: 16px;
}

.container {
  color: var(--primary-color);
  padding: var(--spacing);
  width: var(--box-width, 100px);  /* 支持默认值 */
}
```

- 变量名必须以 `--` 开头
- `var()` 支持 fallback 默认值语法：`var(--name, fallback)`

---

## 样式属性支持详情

### 布局

| 属性 | 值 | 默认值                                                                                                            | 说明 |
| --- | --- |----------------------------------------------------------------------------------------------------------------| --- |
| `display` | `none` \| `block` \| `flex` \|`inline` \|`inline-flex` \| `inline-block` | `flex` | 与 WebView（`block`）不同，`defaultDisplayBlock: true` 时默认值改为 `block`。不支持 `grid`、`flow-root` |
| `box-sizing` | `content-box` \| `border-box` | `border-box` | 默认值与 WebView（`content-box`）不同；配置 `defaultContentBox: true` 时改为 `content-box`。不支持`padding-box` |
| `overflow` | `visible` \| `hidden` | `visible` | 不支持 `auto`/`scroll`（滚动请使用 `scroll-view`）；不支持单独设置 `overflow-x`/`overflow-y` |
| `visibility` | `visible` \| `hidden` | `visible` | |
| `pointer-events` | `auto` \| `none` | `auto` | |
| `aspect-ratio` | `auto` \| `<number>` \| `<number> / <number>` | `auto` |                                                                              |

### Flex布局

| 属性 | 值 | 默认值                                                                                                            | 说明 |
| --- | --- |----------------------------------------------------------------------------------------------------------------| --- |
| `flex-direction` | `row` \| `row-reverse` \| `column` \| `column-reverse` | `column`                                                                                                       | `defaultDisplayBlock: true` 时默认值改为 `row` |
| `flex-wrap` | `nowrap` \| `wrap` \| `wrap-reverse` | `nowrap`                                                                                                       | |
| `flex` | `none`\|`auto`\| 简写属性 |                                                                                                                | 简写属性，支持解析但以展开属性为准 |
| `flex-grow` | `<number>` | `0`                                                                                                            | |
| `flex-shrink` | `<number>` | `1`                                                                                                            | |
| `flex-basis` | `<length>` \| `auto` | `auto`                                                                                                         | |
| `order` | `<integer>` | `0`                                                                                                            | |
| `align-items` | `stretch` \| `center` \| `flex-start` \| `flex-end` \| `baseline` \| `normal` \| `start` \| `end` \| `self-start` \| `self-end` | `stretch`                                                                                                      | `defaultDisplayBlock: true` 时默认值改为 `normal` |
| `align-self` | `auto` \| `stretch` \| `center` \| `flex-start` \| `flex-end` \| `baseline` \| `start` \| `end` \| `self-start` \| `self-end` \| `normal` | `auto`                                                                                                         | |
| `align-content` | `stretch` \| `center` \| `flex-start` \| `flex-end` \| `space-between` \| `space-around` \| `space-evenly` \| `normal` \| `start` \| `end` \| `baseline` | `normal`                                                                                                       | |
| `justify-content` | `center` \| `flex-start` \| `flex-end` \| `space-between` \| `space-around` \| `space-evenly` \| `start` \| `end` \| `left` \| `right` \| `baseline` \| `stretch` | `flex-start`                                                                                                   | |
| `gap` / `row-gap` / `column-gap` | `<length>` | `0`                                                                                                            | |
| `justify-items` | — | —                                                                                                              | ⛔ 不可用 |

### 定位与层级

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `position` | `static` \| `relative` \| `absolute` \| `fixed` | `relative` | 不支持 `sticky`（使用 `sticky-header`/`sticky-section` 替代）；`fixed` 不支持 `auto` 偏移默认值解析 |
| `top` / `right` / `bottom` / `left` | `<length>` | `auto` | |
| `z-index` | `auto` \| `<integer>` | `0` | **仅兄弟节点间生效，无层叠上下文机制**；不支持在 `scroll-view` 直接子节点上应用 |


### 尺寸（Width/Height）

| 属性 | 值 | 默认值 | 说明                                                                           |
| --- | --- | --- |------------------------------------------------------------------------------|
| `width` / `height` | `<length>` \| `auto` | `auto` |                                                                              |
| `min-width` / `min-height` | `<length>` | `0` |                                                                              |
| `max-width` / `max-height` | `<length>` | `none` |                                                                              |

### 间距（Margin/Padding）

| 属性 | 值 | 说明 |
| --- | --- | --- |
| `padding` / `padding-*` | `<length>{1,4}` | 内边距，支持 1-4 值简写 |
| `margin` / `margin-*` | `<length>{1,4}` \| `auto` | 外边距，支持 1-4 值简写；`auto` 可用于水平居中 |

### 边框（Border）

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `border-width` / `border-*-width` | `thin` \| `medium` \| `thick` \| `<length>` | `3` | 支持 1-4 值简写 |
| `border-style` / `border-*-style` | `none` \| `solid` \| `dashed` \| `dotted` \| `hidden` | `none` | 支持 1-4 值简写 |
| `border-color` / `border-*-color` | `<color>` | `black` | 支持 1-4 值简写 |
| `border-radius` / `border-*-radius` | `<length>{1,4} [ / <length>{1,4} ]?` | `0` | **`border-radius` 非 0 时，四边的 `border-color` 和 `border-style` 需一致**（`border-width` 可不一致）；支持双值语法 `X/Y` |
| `border` / `border-*` 简写 | | | 支持解析，展开后以子属性为准 |

### 背景（Background）

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `background-color` | `<color>` | `transparent` | |
| `background-image` | `none` \| `<url>` \| `<gradient>` | `none` | 最多支持 **2 个值** |
| `background-size` | `auto` \| `cover` \| `contain` \| `<length>{1,2}` | `auto` | 最多支持 **2 组值** |
| `background-position` | `<bg-position>` | `0 0` | 最多支持 **2 组值** |
| `background-repeat` | `repeat-x` \| `repeat-y` \| `repeat` \| `no-repeat` | `repeat` | 最多支持 **2 组值** |
| `background` 简写 | | | 展开后 `background-attachment`/`background-origin`/`background-clip` 不生效，其余子属性正常 |

**渐变语法支持：**

- `linear-gradient([ <angle> | to <side-or-corner> ,]? <color-stop-list>)` — 颜色停止位置仅支持 `%` 和固定长度单位（px、rpx 等）
- `radial-gradient(circle [<size>]? [at <position>]?, <color-stop-list>)` — 仅 `circle` 形状；尺寸仅支持 `px`；颜色停止位置仅支持 `%`
- `conic-gradient([from <angle>]? [at <position>]?, <angular-color-stop-list>)` — 完整支持

### 文本与字体

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `<color>` | `#000` | 继承属性 |
| `font-size` | `<length>` | `16px` | 继承；不支持百分比；不支持 `smaller` 等关键字 |
| `font-weight` | `normal` \| `bold` \| `100–900` | `normal` | 继承；**部分机型不支持 500/600 数值**，建议使用 `bold`/`700` |
| `font-style` | `normal` \| `italic` | `normal` | 不支持 `oblique` |
| `font-family` | `<family-name>` | | 继承；支持自定义字体（仅 ttf 格式） |
| `font-feature-settings` | `normal` \| `<feature-tag-value>` | `normal` | 继承 |
| `line-height` | `normal` \| `<number>` \| `<length>` \| `<percentage>` | `normal` | 继承 |
| `text-align` | `left` \| `center` \| `right` \| `justify` \| `start` \| `end` | `start` | |
| `vertical-align` | `baseline` \| `top` \| `middle` \| `bottom` | — | |
| `white-space` | `normal` \| `nowrap` | `normal` | |
| `word-break` | `normal` \| `break-all` | `normal` | `keep-all` 可解析但无实际效果；`break-word` 映射为 `normal` |
| `letter-spacing` | `normal` \| `<length>` | `normal` | 继承 |
| `word-spacing` | `normal` \| `<length>` | `normal` | 继承 |
| `text-decoration` 简写 | | | `text-decoration-thickness` 不生效；**仅在 `<text>` 和 `<input>` 上生效** |
| `text-decoration-line` | `none` \| `underline` \| `overline` \| `line-through` | `none` | 仅支持单值；**仅在 `<text>` 和 `<input>` 上生效** |
| `text-decoration-style` | `solid` \| `double` \| `dotted` \| `dashed` \| `wavy` | `solid` | **仅在 `<text>` 和 `<input>` 上生效** |
| `text-decoration-color` | `<color>` | `black` | **仅在 `<text>` 和 `<input>` 上生效** |
| `text-shadow` | `none` \| `<length>{2,3} <color>?` | `none` | |
| `text-overflow` | `clip` \| `ellipsis` | `clip` | **仅在 `<text>` 上生效**，`<view>` 等无效；推荐使用 `<text>` 的 `overflow`/`max-lines` 属性 |
| `direction` | — | — | ⛔ 不可用 |

### 变换（Transform）

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `transform` | `none` \| `<transform-function>+` | `none` | 支持 `matrix()` / `matrix3d()` / `translate()` / `translateX()` / `translateY()` / `translateZ()` / `translate3d()` / `scale()` / `scaleX()` / `scaleY()` / `scaleZ()` / `scale3d()` / `rotate()` / `rotateX()` / `rotateY()` / `rotateZ()` / `rotate3d()` / `skew()` / `skewX()` / `skewY()` / `perspective()` |
| `transform-origin` | `<length> && <length> && <length>?` | `50% 50% 0` | |

### 阴影与不透明度

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `box-shadow` | `inset? && <length>{2,4} && <color>?` | `none` | 不支持多个叠加 |
| `opacity` | `<number>` | `1` | |

### 动画与过渡

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `transition-property` | `none` \| `all` \| `<property-name>` | `all` | 可动画属性见下方列表 |
| `transition-duration` | `<time>` | `0s` | |
| `transition-timing-function` | `<timing-function>` | `ease` | |
| `transition-delay` | `<time>` | `0s` | |
| `transition` 简写 | | | |
| `animation-name` | `none` \| `<custom-ident>` | `none` | 伪元素的 `animation` 不支持 |
| `animation-duration` | `<time>` | `0s` | |
| `animation-timing-function` | `<timing-function>` | `ease` | |
| `animation-delay` | `<time>` | `0s` | |
| `animation-iteration-count` | `infinite` \| `<number>` | `1` | |
| `animation-direction` | `normal` \| `reverse` \| `alternate` \| `alternate-reverse` | `normal` | |
| `animation-fill-mode` | `forwards` \| `both` | — | `none` 和 `backwards` 可写但实际均表现为 `forwards` |
| `animation-play-state` | `running` \| `paused` | `running` | |
| `animation` 简写 | | | |

**缓动函数：** `linear` / `ease` / `ease-in` / `ease-out` / `ease-in-out` / `cubic-bezier(<n>,<n>,<n>,<n>)` / `steps(<integer>[, start|end|jump-*]?)`

**不支持 transition/animation 的属性：**

- 文本：`text-align`、`text-shadow`、`direction`、`white-space`、`word-break`
- 字体：`color`、`font-size`、`font-weight`、`font-style`、`font-family`、`font-feature-settings`、`line-height`、`letter-spacing`、`word-spacing`
- 其他：`visibility`、`pointer-events`

**`transition-property` 可用值（部分列举）：**

`transform` / `transform-origin` / `opacity` / `width` / `height` / `min-*` / `max-*` / `margin-*` / `padding-*` / `top` / `right` / `bottom` / `left` / `flex` 相关 / `border` 相关 / `background-color` / `background-position` / `background-size` / `filter` / `backdrop-filter` / `box-shadow` / `z-index` / `text-decoration-color` / `mask` 相关

### 滤镜与遮罩

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `filter` | `none` \| `<filter-function>` | `none` | 不支持多函数组合；不支持 `drop-shadow()`、`url()` |
| `backdrop-filter` | `none` \| `<filter-function>` | `none` | 同 `filter`；与 `opacity` 混合有问题；iOS `blur` 在某些情况表现不一致 |
| `mask-image` | `none` \| `<url>` | `none` | 最多 **2 个值**；不支持渐变 |
| `mask-size` | `auto` \| `cover` \| `contain` \| `<length>{1,2}` | `auto` | |
| `mask-repeat` | `<repeat-style>` | `no-repeat` | 默认值与 Web 标准（`repeat`）不同 |
| `mask-position` | `<bg-position>` | `center` | 简写有效，自动展开为 `mask-position-x` + `mask-position-y` |
| `mask-position-x` / `mask-position-y` | `<bg-position-value>` | `center` | |
| `mask` 简写 | | | 展开后 `mask-origin`/`mask-clip`/`mask-mode` 不生效，其余子属性正常 |

### 其他属性

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `will-change` | `auto` \| `contents` | `auto` | 声明绘制边界，优化渲染性能；不支持 `scroll-position` 和自定义属性名 |
| `content` | `normal` \| `<string>` | `normal` | `none` 等同于 `normal`；不支持 `url()` |
| `-wx-contain` | | | `contain` 属性的 Skyline 替代写法 |

### 不支持的属性

- `float` 及相关清除浮动属性 → 使用 Flex 布局替代
- `display: grid` → 使用 Flex 布局或 `grid-view` 组件
- `display: inline` / `display: inline-block` → 使用 `<text>` / `<span>` 或 Flex 布局（完整支持开发中）
- `overflow: scroll` / 单独设置 `overflow-x`/`overflow-y` → 使用 `scroll-view` 组件
- `position: sticky` → 使用 `sticky-header`/`sticky-section` 组件
- `justify-items` / `direction` → ⛔ 不可用
- `text-indent` / `overflow-wrap` / `writing-mode` / `text-decoration-thickness` → ⛔ 不可用
- `list-style-type` / `list-style-image` / `list-style-position` → ⛔ 列表样式属性不可用
- `em` 单位 → 使用 `rpx` / `px` / `rem`
- `currentColor` → 显式指定颜色值
- 多列布局（`column-*`）→ 使用 Flex 布局或 `grid-view` 组件
- `outline` / `resize` / `cursor` → 不支持
- `calc()` 角度类型计算 → 不支持
- `backdrop-filter` / `filter` 多函数组合 → 不支持
- `mask-image` 渐变值 → 不支持

---

## 与 WebView 模式的关键样式差异及兼容方案

| 属性/行为 | WebView | Skyline | 兼容方案 |
| --- | --- | --- | --- |
| `display` 默认值 | `block` | **`flex`** | 配置 `defaultDisplayBlock: true` 或改造为显式 flex 写法 |
| `box-sizing` 默认值 | `content-box` | **`border-box`** | 配置 `defaultContentBox: true` 或手动指定 |
| `overflow: scroll` | 支持 | **不支持** | 使用 `scroll-view` 组件 |
| `overflow-x` / `overflow-y` | 支持单独设置 | **不支持** | 整体 `overflow` 或 `scroll-view` |
| `position: sticky` | 支持 | **不支持** | 使用 `sticky-header` / `sticky-section` |
| `z-index` | 层叠上下文机制 | **仅兄弟节点生效**，无层叠上下文，不支持在 scroll-view 下的直接子节点上应用 | 重构为兄弟节点结构 |
| `*` 通配选择器 | 支持 | **不支持** | 使用具体类选择器 |
| `[attr]` 属性选择器 | 支持 | **不支持** | 使用类选择器 |
| `:before` / `:after` 单冒号 | 支持 | **不支持**，必须双冒号 | 替换为 `::before` / `::after` |
| `:nth-child` | 支持 | 需 **8.0.50+** | 低版本用动态类 + index 判断 |
| 伪元素 `animation` | 支持 | **不支持** | 真实节点 + CSS animation 或 worklet |
| `em` 单位 | 支持 | **不支持** | 使用 `rpx` / `px` / `rem` |
| `currentColor` | 支持 | **不支持** | 显式指定颜色值 |
| `text-decoration` 作用范围 | 所有元素 | **仅 `<text>` 和 `<input>`** | view 内文字用 `<text>` 包裹 |
| `text-overflow` 作用范围 | 所有元素 | **仅 `<text>`** | view 内文字用 `<text>` 包裹 |
| `border-color`/`border-style` 四边 | 四边可不同 | **`border-radius` 非 0 时需一致** | 保持四边一致或拆分节点 |
| `font-weight` 数值 | 完全支持 | **部分机型 500/600 不生效** | 使用 `bold` / `700` |
| `box-shadow` 多层 | 支持 | **不支持多个叠加** | 拆分节点或合并 |
| `animation-fill-mode` | `none`/`forwards`/`backwards`/`both` | **`none`/`backwards` 表现均为 `forwards`** | 注意动画行为差异 |
| inline / inline-block 布局 | 支持 | **开发中**，使用受限 | 使用 `<text>` / `<span>` 或 Flex 布局 |
| BFC | 支持 | **不支持** | 不依赖 BFC，使用 Flex 布局 |
| 页面滚动 | 支持 | **不支持** | 使用 `scroll-view type="list"` |
| `margin` 合并 | 相邻块级元素上下合并 | **不合并** | 使用 `flex gap` 替代 `margin` |
| `wx.createAnimation` | 支持 | **不支持** | 使用 CSS `transition` 或 worklet 动画 |
| `apng` 动画 | 支持 | **仅显示首帧** | 使用 `awebp` / `gif` 替代 |
| `max-width` 在 `<image>` 上 | 正常 | **行为异常** | 使用明确 `width` 值替代 |
| `<image>` 的 `border`/`padding` | 正常 | **导致图片尺寸异常** | 外层 `<view>` 包裹设置 |
| `backdrop-filter` 在 `<map>` 上 | 正常 | **iOS 不生效** | 使用其他方案实现模糊 |
| `flex + column` + `overflow: hidden` | 正常 | **可能失效** | 显式约束子节点 `flex-shrink: 0` |
