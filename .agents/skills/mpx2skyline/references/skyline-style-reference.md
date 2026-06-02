# Skyline WXSS 样式能力参考

## 目录

- [选择器支持](#选择器支持)
- [布局模块支持](#布局模块支持)
- [样式属性支持详情](#样式属性支持详情)
  - [布局属性](#布局属性)
  - [定位与层级](#定位与层级)
  - [尺寸与溢出](#尺寸与溢出)
  - [间距](#间距)
  - [边框](#边框)
  - [背景](#背景)
  - [文本与字体](#文本与字体)
  - [变换](#变换)
  - [阴影与不透明度](#阴影与不透明度)
  - [动画与过渡](#动画与过渡)
  - [滤镜与遮罩](#滤镜与遮罩)
  - [其他属性](#其他属性)
  - [不支持的属性](#不支持的属性)
- [单位与类型支持](#单位与类型支持)
- [与 WebView 模式的关键样式差异汇总](#与-webview-模式的关键样式差异汇总)

---

## 选择器支持

| 类别 | 示例 | 支持度 | 最低版本要求 | 备注 |
| --- | --- | --- | --- | --- |
| 通配选择器 | `* {}` | × | | |
| 元素选择器 | `tag {}` | ✓ | | |
| 类选择器 | `.class {}` | ✓ | | |
| ID 选择器 | `#id {}` | ✓ | | |
| 分组选择器 | `a, b {}` | ✓ | | |
| 直接子代选择器 | `a > b {}` | ✓ | | |
| 后代选择器 | `a b {}` | ✓ | | |
| 属性选择器 | `[attr] {}` | × | | |
| 一般兄弟选择器 | `a ~ b {}` | ✓ | 8.0.49 | |
| 紧邻兄弟选择器 | `a + b {}` | ✓ | 8.0.49 | |
| 伪类 :active | `:active {}` | ✓ | | |
| 伪类 :first-child / :last-child | | ✓ | | |
| 伪类 :not / :only-child / :empty | | ✓ | 8.0.49 | |
| 伪类 :nth-child | | ✓ | 8.0.50 | 对应 Skyline 1.3.3 |
| 伪元素 | `::before {}` / `::after {}` | ✓ | | **仅此两种，必须双冒号声明** |

## 布局模块支持

| 模块 | 支持情况 | 备注 |
| --- | --- | --- |
| CSS Animation | ✓ | 安卓 8.0.37，iOS 8.0.39 |
| 背景与边框 | ✓ | 常用的基本支持 |
| 盒子模型 | ✓ | 支持 `border-box` 和 `content-box`，**没有 BFC** |
| Inline 布局 | × | 开发中 |
| Inline-Block 布局 | × | 仅支持在 text 组件里的嵌套结构使用，完整版本开发中 |
| Block 布局 | ✓ | 需配置 `defaultDisplayBlock` 开启，默认为 flex |
| Flex 布局 | ✓ | 包括 inline-flex 布局 |
| 字体 | ✓ | 基本支持，也支持自定义字体 |
| Positioned 布局 | ✓ | `sticky` 可使用 `sticky-header`/`sticky-section` 替代 |
| CSS Transition | ✓ | |
| CSS Variable | ✓ | 安卓 8.0.35，iOS 8.0.38 |
| Media queries | ✓ | 只支持 DarkMode |
| Font-face | ✓ | 只支持 ttf 格式 |

## 样式属性支持详情

### 布局属性

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `display` | `none` / `flex` / `block` | **`flex`** | **默认值与 WebView 不同**（WebView 为 `block`）；可通过配置 `defaultDisplayBlock` 改为 `block` |
| `flex-direction` | `row` / `row-reverse` / `column` / `column-reverse` | `column` | |
| `flex-wrap` | `nowrap` / `wrap` / `wrap-reverse` | `nowrap` | |
| `flex-grow` | `<float>` | `0` | |
| `flex-shrink` | `<float>` | `1` | |
| `flex-basis` | `<length>` / `auto` | `auto` | |
| `order` | `<float>` | `0` | |
| `gap` | `<length>` | `0` | |
| `flex` | 简写 | | 支持解析但以展开属性为准 |
| `align-items` | `stretch` / `center` / `flex-start` / `flex-end` / `baseline` | `stretch` | |
| `align-self` | `auto` / `stretch` / `center` / `flex-start` / `flex-end` / `baseline` | `auto` | |
| `align-content` | `stretch` / `center` / `flex-start` / `flex-end` / `space-between` / `space-around` | `auto` | |
| `justify-content` | `center` / `flex-start` / `flex-end` / `space-between` / `space-around` / `space-evenly` | `flex-start` | |

### 定位与层级

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `position` | `relative` / `absolute` / `fixed` | `relative` | `fixed` 在 8.0.43 开始支持，**不支持 `top`/`left`/`bottom`/`right` 默认值 `auto` 解析**；`sticky` 使用 `sticky-header`/`sticky-section` 替代 |
| `z-index` | `<float>` | `0` | **仅兄弟节点生效，无层叠上下文机制**；不支持在 scroll-view 下的直接子节点上应用 |
| `left` / `right` / `top` / `bottom` | `<length>` | `auto` | `fixed` 定位时不支持默认值 `auto` 解析 |
| `overflow` | `hidden` / `visible` | `visible` | **不支持 `scroll`**，只能通过 scroll-view 实现；**不支持单独设置 `overflow-x`/`overflow-y`** |
| `pointer-events` | `auto` / `none` | `auto` | |
| `visibility` | `visible` / `hidden` | `visible` | |

### 尺寸与溢出

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `width` / `height` | `<length>` | `auto` | |
| `min-width` / `min-height` | `<length>` | `auto` / `none` | |
| `max-width` / `max-height` | `<length>` | `auto` | |
| `box-sizing` | `border-box` / `content-box` | **`border-box`** | **默认值与 WebView 不同**（WebView 为 `content-box`）；可通过配置 `defaultContentBox` 改为 `content-box` |

### 间距

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `padding` / `padding-left` / `padding-top` / `padding-right` / `padding-bottom` | `<length>{1,4}` | `0` | |
| `margin` / `margin-left` / `margin-top` / `margin-right` / `margin-bottom` | `<length>{1,4}` | `0` | inline-block 元素 margin 不生效，只能用 padding |

### 边框

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `border-left-width` 等 | `<length>` | `3` | |
| `border-left-style` 等 | `<border-style>` | `none` | 支持 `none` / `hidden` / `solid` / `dashed` / `dotted` |
| `border-left-color` 等 | `<color>` | `black` | **默认值与 WebView 不同**（WebView 为 `currentColor`） |
| `border-radius` / `border-top-left-radius` 等 | `<length>{1,2}` | `0` | **`border-radius` 非 0 时，四边的 `border-color` 和 `border-style` 需一致**，`border-width` 可不一致 |
| `border` / `border-left` 等简写 | | | 支持解析但以展开属性为准 |

### 背景

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `background-color` | `<color>` | `transparent` | |
| `background-image` | `none` / `<image>` | `none` | **不支持多张图片** |
| `background-size` | `contain` / `cover` / `[<length>\|auto]{1,2}` | `auto` | |
| `background-position` | 完整 `<bg-position>#` | `0 0` | 参考 MDN |
| `background-repeat` | `repeat-x` / `repeat-y` / `repeat` / `no-repeat` | `repeat` | |
| `background` 简写 | | | 支持解析但以展开属性为准 |

### 文本与字体

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `font-size` | `<length>` | `16px` | **不支持百分比**；不支持 keyword (`smaller` 等) |
| `font-weight` | `normal` / `bold` / `<float>` | `normal` | **部分机型不支持 500/600 数值**，需使用 `bold`/`700` |
| `font-family` | 通用字体族 / `<string>` | | |
| `font-style` | `normal` / `italic` | `normal` | |
| `line-height` | `normal` / `<number>` / `<length>` / `<percent>` | `normal` | |
| `text-align` | `left` / `center` / `right` / `justify` / `start` / `end` | `start` | |
| `white-space` | `normal` / `nowrap` | `normal` | |
| `text-overflow` | `clip` / `ellipsis` | `clip` | **仅作用于 text 节点** |
| `word-break` | `normal` / `break-all` | `normal` | |
| `word-spacing` | `normal` / `<length>` | `normal` | |
| `letter-spacing` | `normal` / `<length>` | `normal` | |
| `text-decoration-line` | `none` / `underline` / `overline` / `line-through` | `none` | **仅作用于 text 节点** |
| `text-decoration-style` | `solid` / `double` / `dotted` / `dashed` / `wavy` | `solid` | **仅作用于 text 节点** |
| `text-decoration-color` | `<color>` | `black` | **仅作用于 text 节点**；默认值与 WebView 不同（WebView 为 `currentColor`） |
| `text-decoration` 简写 | | | 支持解析但以展开属性为准；当前仅支持设置一种类型 |
| `text-shadow` | `none` / `<color>? && <length>{2,3}` | `none` | |

### 变换

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `transform` | `none` / `<transform-function>` | `none` | |
| `transform-origin` | `left` / `center` / `right` / `top` / `bottom` / `<length>{1,2}` | `50% 50%` | |

### 阴影与不透明度

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `box-shadow` | `none` / `inset? && <length>{2,4} && <color>?` | `none` | **不支持多个叠加** |
| `opacity` | `<float>` | `1` | |
| `color` | `<color>` | `black` | |

### 动画与过渡

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `transition-property` | `none` / `all` / `transform` / `opacity` 等 | `all` | 基本都支持 |
| `transition-duration` | `<time>` | `0` | |
| `transition-timing-function` | `<timing-function>` | | |
| `transition-delay` | `<time>` | `0` | |
| `transition` 简写 | | | 支持解析但以展开属性为准 |
| `animation-name` | `none` / `<custom-ident>` | `none` | **伪元素的 animation 不支持** |
| `animation-duration` | `<time>` | `0` | |
| `animation-timing-function` | `<timing-function>` | | |
| `animation-delay` | `<time>` | `0` | |
| `animation-iteration-count` | `infinite` / `<number>` | `1` | |
| `animation-direction` | `normal` / `reverse` / `alternate` / `alternate-reverse` | `normal` | |
| `animation-fill-mode` | `forwards` / `both` | `none` | **`none` 与 `backwards` 暂未支持**，表现均为 `forwards` |
| `animation` 简写 | | | 支持解析但以展开属性为准 |

### 滤镜与遮罩

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `backdrop-filter` | `none` / `[<filter-function>]` | `none` | **不支持 multi function**；不支持 `drop-shadow`；不支持 `url`；与 `opacity` 混合有问题；blur 某些情况表现不一致 |
| `filter` | `none` / `[<filter-function>]` | `none` | **不支持 multi function**；不支持 `drop-shadow`；不支持 `url` |
| `mask-image` | `none` / `<image>` | `none` | **不支持多张图片** |

### 其他属性

| 属性 | 支持格式 | 默认值 | 备注 |
| --- | --- | --- | --- |
| `will-change` | `auto` / `contents` | `auto` | 声明绘制边界，优化渲染性能 |

### 不支持的属性

以下属性在 Skyline 下不支持，如需使用需通过替代方案或运行时隔离处理：

- `float` 及相关清除浮动属性 → 使用 Flex 布局替代
- `display: grid` → 使用 Flex 布局替代
- `display: inline` / `display: inline-block` → 使用 `<text>` / `<span>` 或 Flex 布局替代
- `overflow: scroll` / `overflow-x` / `overflow-y` 单独设置 → 使用 scroll-view 组件
- `position: sticky` → 使用 `sticky-header` / `sticky-section` 组件
- `column-*` 多列布局属性 → 使用 Flex 布局或 grid-view 组件
- `outline` → 使用 border 模拟
- `resize` → 不支持
- `cursor` → 不支持（移动端无意义）
- `table-*` 表格布局属性 → 使用 Flex 布局模拟

## 单位与类型支持

### 长度单位

| 格式 | 支持度 | 备注 |
| --- | --- | --- |
| `auto` | ✓ | |
| `px` | ✓ | |
| `rem` | ✓ | |
| `em` | × | |
| `rpx` | ✓ | |
| `vw` / `vh` | ✓ | |
| `vmin` / `vmax` | ✓ | |
| `ratio` | ✓ | |
| `env()` | ✓ | 只支持 `safe-area-inset-*` 系列 |
| `calc()` | ✓ | |

### 颜色值

| 格式 | 支持度 | 备注 |
| --- | --- | --- |
| color keywords | ✓ | |
| `transparent` | ✓ | |
| `currentColor` | × | 考虑支持 |
| `rgb[a]` | ✓ | |
| `#RRGGBB` / `#RGB` | ✓ | |
| `hsl` / `hsla` | ✓ | |

### 渐变

| 格式 | 支持度 |
| --- | --- |
| `linear-gradient()` | ✓ |
| `radial-gradient()` | ✓ |
| `conic-gradient()` | ✓ |

### 其他类型

| 格式 | 支持度 | 备注 |
| --- | --- | --- |
| `url()` | ✓ | |
| `<border-style>` | ✓ | `none` / `hidden` / `solid` / `dashed` / `dotted` |
| `<timing-function>` | ✓ | `ease` / `ease-in` / `ease-out` / `ease-in-out` / `linear` / `cubic-bezier` / `steps` / `step-start` / `step-end` |
| `<filter-function>` | 部分支持 | `brightness` / `contrast` / `saturate` / `hue-rotate` / `invert` / `opacity` / `grayscale` / `sepia`；**不支持 `drop-shadow`**；**不支持多个 function 叠加** |
| `<angle>` | ✓ | `deg` / `grad` / `rad` / `turn` |

## 与 WebView 模式的关键样式差异汇总

| 属性/行为 | WebView | Skyline | 兼容方案 |
| --- | --- | --- | --- |
| `display` 默认值 | `block` | **`flex`** | 配置 `defaultDisplayBlock` 或改造为显式 flex 写法 |
| `box-sizing` 默认值 | `content-box` | **`border-box`** | 配置 `defaultContentBox` 或手动指定 |
| `overflow: scroll` | 支持 | **不支持** | 使用 scroll-view 组件 |
| `overflow-x` / `overflow-y` | 支持单独设置 | **不支持** | 整体 overflow 或 scroll-view |
| `position: fixed` | 完全支持 | 降级为 absolute，**不支持 `auto` 默认值** | 使用 `root-portal` + `skyline-root` |
| `position: sticky` | 支持 | **不支持** | 使用 `sticky-header` / `sticky-section` |
| `z-index` | 层叠上下文机制 | **仅兄弟节点生效**，无层叠上下文 | 重构为兄弟节点结构，全局用 root-portal |
| `*` 通配选择器 | 支持 | **不支持** | 使用具体类选择器 |
| `[attr]` 属性选择器 | 支持 | **不支持** | 使用类选择器 |
| `:before` / `:after` 单冒号 | 支持 | **不支持**，必须双冒号 | 替换为 `::before` / `::after` |
| `:nth-child` | 支持 | 需 **8.0.50+** | 低版本使用动态类 + index 判断 |
| 伪元素 `animation` | 支持 | **不支持** | 真实节点 + CSS animation 或 worklet |
| `em` 单位 | 支持 | **不支持** | 使用 `rpx` / `px` / `rem` |
| `currentColor` | 支持 | **不支持** | 显式指定颜色值 |
| `text-decoration` 作用范围 | 所有元素 | **仅 text 节点** | view 内文字用 `<text>` 包裹 |
| `text-overflow` 作用范围 | 所有元素 | **仅 text 节点** | view 内文字用 `<text>` 包裹 |
| `border-color/style` 随意 | 四边可不同 | **border-radius 非 0 时需一致** | 保持四边一致或拆分节点 |
| `font-weight` 数值 | 完全支持 | **部分机型 500/600 不生效** | 使用 `bold` / `700` |
| `box-shadow` 多层 | 支持 | **不支持多个叠加** | 拆分节点或合并 |
| `animation-fill-mode` | `none`/`forwards`/`backwards`/`both` | **不支持 `none`/`backwards`**，表现为 `forwards` | 注意动画行为差异 |
| inline / inline-block 布局 | 支持 | **不支持** | 使用 `<text>` / `<span>` 或 Flex 布局 |
| BFC | 支持 | **不支持** | 不依赖 BFC，使用 Flex 布局 |
| 页面滚动 | 支持 | **不支持** | 使用 scroll-view type="list" |
| 默认导航 | 支持 | **不支持** | 自定义导航栏 |
| `margin` 合并 | 相邻块级元素上下 margin 合并（BFC） | **不合并**，间距翻倍 | 使用 `flex gap` 替代 `margin` |
| `wx.createAnimation` | 支持 | **不支持** | 使用 CSS `transition` 或 worklet 动画 |
| `apng` 动画 | 支持 | **不支持**，只显示首帧 | 使用 `awebp` / `gif` 替代 |
| `max-width` 在 image 上 | 正常 | **行为异常** | 使用明确 `width` 值替代 |
| image 的 `border`/`padding` | 正常 | **导致图片尺寸异常** | 外层 view 包裹设置 border/padding |
| `backdrop-filter` 在 map 上 | 正常 | **iOS 不生效** | 使用其他方案实现模糊 |
| `flex + column` + `overflow:hidden` | 正常 | **可能失效** | 显式约束子节点 `flex-shrink:0` |
