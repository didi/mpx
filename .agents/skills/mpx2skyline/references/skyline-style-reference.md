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
| 伪元素 | `::before {}` / `::after {}` | ✅ | | 只支持 ::before 和 ::after |

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

**支持 `%` 的属性**

| 属性 | `%` 参照对象 |
| --- | --- |
| `line-height` | 当前 `font-size` |
| `transform-origin` | 元素自身的 `width` / `height` |
| `background-position` | 元素尺寸 - 背景图尺寸 |
| `width` / `height` | 包含块的同方向尺寸 |
| `min-width` / `min-height` / `max-width` / `max-height` | 包含块的同方向尺寸 |
| `top` / `right` / `bottom` / `left` | 包含块的尺寸 |
| `padding` / `padding-*` | 包含块的同方向尺寸 |
| `margin` / `margin-*` | 包含块的同方向尺寸 |
| `flex-basis` | Flex 容器的主轴尺寸 |
| `gap` / `row-gap` / `column-gap` | Flex 容器的对应方向尺寸 |
| `border-radius` / `border-*-radius` | 元素自身的 border-box 尺寸 |
| `background-size` | 背景定位区域 - 背景图尺寸 |
| `box-shadow` / `text-shadow` 偏移 | 元素自身的 width / height |
| `letter-spacing` / `word-spacing` | 元素自身的 font-size |
| `transform: translate*()` / `translateZ()` | 元素自身的 width / height |

**不支持 `%` 的属性：**
- `border-width` / `border-*-width`
- `font-size`
- `box-shadow` / `text-shadow` 模糊半径
- `perspective`

> 实践建议：
> 
> 优先使用 `rpx` / `px` / `vw` / `vh` 等明确长度单位；
> `flex: 1 0 auto` + `min-width` 实现自动扩展的场景下，min-width 需要使用 rpx 单位

#### `auto` 关键字支持情况

**支持 `auto` 的属性：**

| 属性 | 文档原文（取值 / 默认值） |
| --- | --- |
| `pointer-events` | `auto / none`，默认 `auto` |
| `align-self` | `auto / stretch / center / flex-start / flex-end / baseline`，默认 `auto` |
| `background-size` | `contain / cover / [<length> | auto]{1, 2}`，默认 `auto` |
| `will-change` | `auto / contents`，默认 `auto` |
| `width` / `height` | `<length>`，默认 `auto` |
| `min-width` / `max-width` | `<length>`，默认 `auto` |
| `top` / `right` / `bottom` / `left` | `<length>`,默认 `auto` |
| `flex-basis` | `<length>`，默认 `auto` |
| `margin` / `margin-*` | `<length>{1,4} \| auto`，默认 `0` |

**不支持 `auto` 的属性：**

| 属性 | 文档原文 |
| --- | --- |
| `overflow` | 仅支持 `hidden` / `visible`，「scroll 不支持，只能通过 scroll-view 实现」（无 `auto`） |
| `min-height` / `max-height` | 默认值为 `none`（非 `auto`） |


#### 颜色值（`<color>`）

| 格式 | 支持 | 说明 |
| --- | -- | -- |
| color keywords（`red` 等） | ✅ | |
| `transparent` | ✅ | |
| `currentColor` | ✅ | |
| `#RGB` / `#RRGGBB` / `#RGBA` / `#RRGGBBAA` | ✅ | |
| `rgb()` / `rgba()` | ✅ | |
| `hsl()` / `hsla()` | ✅ | |
| `hwb()` | ✅ | |

**渐变（`<gradient>`）：**

| 格式 | 支持 | 限制 |
| --- | --- | --- |
| `linear-gradient()` | ✅ | 颜色停止位置仅支持 `%` 和固定长度单位（px、rpx 等） |
| `radial-gradient()` | ✅ | 仅支持 `circle` 形状（不支持 `ellipse`）；尺寸仅支持 `px`；颜色停止位置仅支持 `%` |
| `conic-gradient()` | ✅ | 完全支持 |

**其他类型：**

| 类型 | 格式 | 支持 | 说明                                   |
| --- | --- | --- |--------------------------------------|
| `<url>` | `url()` | ✅ |                                      |
| `<angle>` | `deg` / `grad` / `rad` / `turn` | ✅ |                                      |
| `<time>` | `s` / `ms` | ✅ |                                      |
| `<border-style>` | `none` / `solid` / `dashed` / `dotted` / `hidden` | ✅ |                                      |
| `<timing-function>` | `ease` / `ease-in` / `ease-out` / `ease-in-out` / `linear` / `cubic-bezier()` / `steps()` | ✅ |                                      |
| `<filter-function>` | `blur()` / `brightness()` / `contrast()` / `grayscale()` / `hue-rotate()` / `invert()` / `opacity()` / `saturate()` / `sepia()` | 部分支持 | 不支持 `url()`/`drop-shadow()`；不支持多函数组合 |

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
| --- | --- |----------------------------------------------------------------------------------------------------------------| -- |
| `display` | `none` \| `block` \| `flex` \|`inline` \|`inline-flex` \| `inline-block` | `flex` | 默认值与 WebView（`block`）不同，`defaultDisplayBlock: true` 时默认值改为 `block`。不支持 `grid`、`flow-root` |
| `box-sizing` | `content-box` \| `border-box` | `border-box` | 默认值与 WebView（`content-box`）不同；配置 `defaultContentBox: true` 时改为 `content-box`。不支持`padding-box` |
| `overflow` | `visible` \| `hidden` | `visible` | 不支持 `auto`/`scroll`（滚动请使用 `scroll-view`）；不支持单独设置 `overflow-x`/`overflow-y` |
| `visibility` | `visible` \| `hidden` | `visible` | |
| `pointer-events` | `auto` \| `none` | `auto` | |
| `aspect-ratio` | `auto` \| `<number>` \| `<number> / <number>` | `auto` | |

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
| `z-index` | `auto` \| `<integer>` | `0` | **不支持 Web 标准的层叠上下文，`z-index` 只在同层级节点间有效** |


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
| `background-repeat` | `repeat-x` \| `repeat-y` \| `repeat` \| `no-repeat` | `repeat` | 不支持 `space`/`round`；最多支持 **2 组值** |
| `background` 简写 | | | 展开后 `background-attachment`/`background-origin`/`background-clip` 不生效，其余子属性正常 |

**渐变语法支持：**

- `background-attachment`/`background-origin`/`background-clip` 不支持
- `linear-gradient([ <angle> | to <side-or-corner> ,]? <color-stop-list>)` — 颜色停止位置仅支持 `%` 和固定长度单位（px、rpx 等）
- `radial-gradient(circle [<size>]? [at <position>]?, <color-stop-list>)` — 仅支持 `circle` 形状（不支持 `ellipse`）；尺寸仅支持 `px`；颜色停止位置仅支持 `%`
- `conic-gradient([from <angle>]? [at <position>]?, <angular-color-stop-list>)` — 完整支持

### 文本与字体

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `<color>` | `#000` | 继承属性 |
| `font-size` | `<length>` | `16px` | 继承；不支持百分比；不支持 `smaller` 等关键字 |
| `font-weight` | `normal` \| `bold` \| `100–900` | `normal` | 继承；不支持 `bolder`/`lighter`；**部分机型不支持 500/600 数值**，建议使用 `bold`/`700` |
| `font-style` | `normal` \| `italic` | `normal` | 不支持 `oblique` |
| `font-family` | `<family-name>` | | 继承；支持自定义字体（仅 ttf 格式） |
| `font-feature-settings` | `normal` \| `<feature-tag-value>` | `normal` | 继承 |
| `line-height` | `normal` \| `<number>` \| `<length>` \| `<percentage>` | `normal` | 继承 |
| `text-align` | `left` \| `center` \| `right` \| `justify` \| `start` \| `end` | `start` | 不支持 `justify-all`/`match-parent` |
| `vertical-align` | `baseline` \| `top` \| `middle` \| `bottom` | — | 不支持 `text-top`/`text-bottom` |
| `white-space` | `normal` \| `nowrap` | `normal` | 不支持 `pre`/`pre-wrap`/`pre-line` |
| `word-break` | `normal` \| `break-all` | `normal` | `keep-all` 可解析但无实际效果；`break-word` 映射为 `normal` |
| `letter-spacing` | `normal` \| `<length>` | `normal` | 继承 |
| `word-spacing` | `normal` \| `<length>` | `normal` | 继承 |
| `text-decoration` 简写 | | | `text-decoration-thickness` 不生效；**仅在 `<text>` 和 `<input>` 上生效** |
| `text-decoration-line` | `none` \| `underline` \| `overline` \| `line-through` | `none` | 仅支持单值；**仅在 `<text>` 和 `<input>` 上生效** |
| `text-decoration-style` | `solid` \| `double` \| `dotted` \| `dashed` \| `wavy` | `solid` | **仅在 `<text>` 和 `<input>` 上生效** |
| `text-decoration-color` | `<color>` | `black` | **仅在 `<text>` 和 `<input>` 上生效** |
| `text-shadow` | `none` \| `<length>{2,3} <color>?` | `none` | |
| `text-overflow` | `clip` \| `ellipsis` | `clip` | CSS 属性生效范围有限；文本超长打点推荐在承载文本的 `view` / `text` / `rich-text` / `special-text` 上使用 `overflow` / `max-lines` 属性 |
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

#### 过渡（Transition）

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `transition-property` | `none` \| `all` \| `<animatable-property>#` | `all` | 支持逗号分隔的多属性列表;可动画属性见下方完整列表 |
| `transition-duration` | `<time>#` | `0s` | 支持逗号分隔的多值,与 `transition-property` 一一对应 |
| `transition-timing-function` | `<timing-function>#` | `ease` | 支持逗号分隔的多值 |
| `transition-delay` | `<time>#` | `0s` | 支持逗号分隔的多值 |
| `transition` 简写 | | | 展开为上述四个子属性 |

#### 动画（Animation）

| 属性 | 值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `animation-name` | `none` \| `<custom-ident>` \| `<string>` | `none` | 引用 `@keyframes` 名称,支持逗号分隔的多值;**伪元素的 `animation` 不支持** |
| `animation-duration` | `<time>#` | `0s` | 支持逗号分隔的多值 |
| `animation-timing-function` | `<timing-function>#` | `ease` | 支持逗号分隔的多值 |
| `animation-delay` | `<time>#` | `0s` | 支持逗号分隔的多值 |
| `animation-iteration-count` | `infinite` \| `<number>` | `1` | 支持逗号分隔的多值 |
| `animation-direction` | `normal` \| `reverse` \| `alternate` \| `alternate-reverse` | `normal` | 支持逗号分隔的多值 |
| `animation-fill-mode` | `forwards` \| `both` | — | `none` 和 `backwards` 可写但实际均表现为 `forwards` |
| `animation-play-state` | `running` \| `paused` | `running` | 支持逗号分隔的多值 |
| `animation` 简写 | | | 展开为上述子属性 |

**`@keyframes`**

```css
@keyframes <animation-name> {
  <keyframe-selector># { <declaration-list> }
}
```

- `<keyframe-selector>`(关键帧选择器)取值:`from` \| `to` \| `<percentage>`(如 `0%` / `50%` / `100%`)
- 单条规则可用逗号分隔多个选择器,如 `0%, 100% { ... }`

```css
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.box {
  animation: fade-in 0.3s ease-in-out forwards;
}
```

#### 缓动函数（`<timing-function>`）

`linear` / `ease` / `ease-in` / `ease-out` / `ease-in-out` / `cubic-bezier(<n>,<n>,<n>,<n>)` / `steps(<integer>[, start|end|jump-*]?)`

#### `transition-property` / 可动画属性完整列表

| 类别 | 可动画属性 |
| --- | --- |
| 通用 | `all` \| `none` |
| 变换与不透明度 | `transform` / `transform-origin` / `opacity` |
| 尺寸 | `width` / `height` / `min-width` / `max-width` / `min-height` / `max-height` |
| 外边距 | `margin` / `margin-top` / `margin-right` / `margin-bottom` / `margin-left` |
| 内边距 | `padding` / `padding-top` / `padding-right` / `padding-bottom` / `padding-left` |
| 定位 | `top` / `right` / `bottom` / `left` |
| Flex | `flex` / `flex-grow` / `flex-shrink` / `flex-basis` |
| 边框宽度/颜色/圆角 | `border` / `border-width` / `border-color` / `border-radius` |
| 边框单边宽度 | `border-top-width` / `border-right-width` / `border-bottom-width` / `border-left-width` |
| 边框单边颜色 | `border-top-color` / `border-right-color` / `border-bottom-color` / `border-left-color` |
| 边框单角圆角 | `border-top-left-radius` / `border-top-right-radius` / `border-bottom-left-radius` / `border-bottom-right-radius` |
| 边框单边简写 | `border-top` / `border-right` / `border-bottom` / `border-left` |
| 背景 | `background-color` / `background-position` / `background-position-x` / `background-position-y` / `background-size` / `background` |
| 滤镜与层级 | `filter` / `backdrop-filter` / `box-shadow` / `z-index` |
| 文本 | `text-decoration-color` |
| 遮罩 | `mask` / `mask-size` / `mask-position` / `mask-position-x` / `mask-position-y` |

**不支持 transition/animation 的属性：**

- 文本：`text-align`、`text-shadow`、`direction`、`white-space`、`word-break`
- 字体：`color`、`font-size`、`font-weight`、`font-style`、`font-family`、`font-feature-settings`、`line-height`、`letter-spacing`、`word-spacing`
- 其他：`visibility`、`pointer-events`

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
- 多列布局（`column-*`）→ 使用 Flex 布局或 `grid-view` 组件
- `outline` / `resize` / `cursor` → 不支持
- `calc()` 角度类型计算 → 不支持
- `backdrop-filter` / `filter` 多函数组合 → 不支持
- `mask-image` 渐变值 → 不支持

---

## 与 WebView 模式的关键样式差异及兼容方案

| 属性/行为                             | WebView | Skyline | 兼容方案                                                        |
|-----------------------------------| --- | --- |-------------------------------------------------------------|
| `display` 默认值                     | `block` | **`flex`** | 配置 `defaultDisplayBlock: true`                              |
| `box-sizing` 默认值                  | `content-box` | **`border-box`** | 配置 `defaultContentBox: true`                    |
| `overflow: scroll`                | 支持 | **不支持** | 使用 `scroll-view` 组件                                         |
| `overflow-x` / `overflow-y`       | 支持单独设置 | **不支持** | 整体 `overflow` 或 `scroll-view`                               |
| `position: sticky`                | 支持 | **不支持** | 使用 `sticky-header` / `sticky-section`                       |
| `z-index`                         | 层叠上下文机制 | **仅兄弟节点生效**，无层叠上下文 | [z-index 与层叠适配](./skyline-migration-practice.md#z-index-与层叠适配) |
| `*` 通配选择器                         | 支持 | **不支持** | 使用类选择器替代                                                    |
| `[attr]` 属性选择器                    | 支持 | **不支持** | 使用类选择器替代                                                    |
| `:nth-child`                      | 支持 | 需 **8.0.50+** |                                                             |
| 伪元素 `animation`                   | 支持 | **不支持** | 真实节点 + CSS animation                                        |
| `em` 单位                           | 支持 | **不支持** | 使用 `rpx` / `px` / `rem`                                     |
| `text-decoration` 作用范围            | 所有元素 | **仅 `<text>` 和 `<input>`** | view 内文字用 `<text>` 包裹                                       |
| `text-overflow` 作用范围              | 所有元素 | CSS 属性生效范围有限；组件属性可覆盖 `view` / `text` / `rich-text` / `special-text` | 文本超长打点优先补 `max-lines` / `overflow` 属性，`view` 可直接承载 |
| `border-color`/`border-style` 四边  | 四边可不同 | **`border-radius` 非 0 时需一致** | 保持四边一致或拆分节点                                                 |
| `font-weight` 数值                  | 完全支持 | **部分机型 500/600 不生效** | 使用 `bold` / `700`                                           |
| `box-shadow` 多层                   | 支持 | **不支持多个叠加** | 拆分节点或合并                                                     |
| `animation-fill-mode`             | `none`/`forwards`/`backwards`/`both` | **`none`/`backwards` 表现均为 `forwards`** | 注意动画行为差异    |
| inline / inline-block 布局          | 支持 | **不支持** | 使用 `<text>` / `<span>` 或 Flex 布局                            |
| BFC                               | 支持 | **不支持** | 不依赖 BFC，使用 Flex 布局                                          |
| 页面滚动                              | 支持 | **不支持** | 使用 `scroll-view type="list"`                                |
| `margin` 合并                       | 相邻块级元素上下合并 | **不合并** | 不依赖上下合并                                                       |
| `wx.createAnimation`              | 支持 | **不支持** | 使用 CSS `transition`                           |
