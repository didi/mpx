# Skyline 与 Web/W3C CSS 标准差异参考

本文只记录 Skyline WXSS 与 Web/W3C CSS 标准不一致、迁移时容易误判或静默失效的部分。它不是 Skyline 样式属性全量支持表。

使用方式：

- 从 WebView / Web CSS 迁移到 Skyline 时，优先查本文的差异项。
- 若属性未出现在本文中，不代表一定完全等同 Web 标准，只表示当前知识库没有记录明确差异。

## 目录

- [非标准默认值](#非标准默认值)
- [选择器支持](#选择器支持)
- [值类型支持](#值类型支持)
  - [长度、函数与单位](#长度函数与单位)
  - [CSS 变量](#css-变量)
  - [百分比支持情况](#百分比支持情况)
  - [颜色与渐变](#颜色与渐变)
- [布局、盒模型与层叠差异](#布局盒模型与层叠差异)
- [文本与字体差异](#文本与字体差异)
- [背景、边框与遮罩差异](#背景边框与遮罩差异)
- [滤镜差异](#滤镜差异)
- [动画与过渡差异](#动画与过渡差异)
- [其他 Skyline 不支持能力及兼容方案](#其他-skyline-不支持能力及兼容方案)

## 非标准默认值

| 属性 | Web/W3C CSS 标准默认值 | Skyline 默认值 | Mpx / Skyline 处理 |
| --- | --- | --- | --- |
| `display` | `inline` | `flex` | `defaultDisplayBlock: true` 后为 `block` |
| `position` | `static` | `relative` | 需要静态定位时显式写 `position: static` |
| `box-sizing` | `content-box` | `border-box` | `defaultContentBox: true` 后为 `content-box` |
| `flex-direction` | `row` | `column` | `defaultDisplayBlock: true` 后为 `row` |
| `align-items` | `normal` | `stretch` | `defaultDisplayBlock: true` 后为 `normal` |
| `text-align` | `start` 由书写方向解析；浏览器常见表现为 `left` | `start` | 需要固定方向时显式写 `left` / `right` / `center` |
| `mask-repeat` | `repeat` | `no-repeat` | 需要平铺时显式写 `mask-repeat: repeat` |

## 选择器支持

Skyline 选择器与 Web 标准的差异如下，常用可用伪类也在表中列出，便于迁移时判断是否需要替换：

| 选择器 | Web/W3C CSS | Skyline | 建议 |
| --- | --- | --- | --- |
| `*` | 支持 | 不支持 | 用页面根类或组件类选择器替代 |
| `[attr]` / `[attr=value]` | 支持 | 不支持 | 在模板中补 class，再用类选择器 |
| `::before` / `::after` 以外的伪元素 | 支持更多伪元素 | 不支持 | 只使用 `::before` / `::after` |
| `:active` | 支持 | 支持 | 可直接使用 |
| `:first-child` / `:last-child` | 支持 | 支持 | 可直接使用 |
| `a ~ b` / `a + b` | 支持 | 8.0.49+ | 暂不考虑低版本 |
| `:not` / `:only-child` / `:empty` | 支持 | 8.0.49+ | 暂不考虑低版本 |
| `:nth-child` | 支持 | 8.0.50+ | 暂不考虑低版本 |
| 其他伪类 | 支持更多伪类 | 不支持 | 使用动态类实现 |

## 值类型支持

### 长度、函数与单位

| 值类型 | Web/W3C CSS | Skyline 差异 | 建议 |
| --- | --- | --- | --- |
| `calc()` | 可用于长度、角度等多类计算 | 仅支持长度计算，不支持 `<angle>` 等类型；不要嵌套使用 | 角度直接写静态值，如 `135deg` |
| `env()` | 浏览器支持环境变量依宿主而定 | 仅支持 `safe-area-inset-top/right/bottom/left` | 只用于安全区 |
| `em` | 标准长度单位 | Skyline 支持，但 Mpx Skyline 适配规范不推荐依赖 | 优先使用 `rpx` / `px` / `rem` |
| `auto` | 多属性支持 | `overflow` 不支持 `auto`；`min-height` / `max-height` 默认不是 `auto` | 滚动用 `scroll-view` |

### CSS 变量

Skyline 支持 CSS 自定义属性与 `var()` fallback 语法，迁移时需要注意命名与作用域可读性：

| 写法 | Web/W3C CSS | Skyline 差异 | 建议 |
| --- | --- | --- | --- |
| CSS 变量名 | 自定义属性必须以 `--` 开头 | 同 Web 标准；非 `--` 开头不可作为变量 | 保持 `--name` 命名 |
| `var(--name, fallback)` | 支持 fallback | 支持 fallback | 可直接使用 |
| `currentColor` 作为变量值或颜色值 | 标准颜色关键字 | Skyline 支持，但适配中不建议依赖跨组件继承 | 关键颜色写明确值 |

### 百分比支持情况

Skyline 的 `%` 支持范围比 Web 标准更窄。迁移时只依赖下表记录的稳定场景。

**支持 `%` 的属性：**

| 属性 | Skyline 参照对象 |
| --- | --- |
| `line-height` | 当前 `font-size` |
| `transform-origin` | 元素自身的 `width` / `height` |
| `background-position` | 元素尺寸 - 背景图尺寸 |
| `width` / `height` | 包含块的同方向尺寸 |
| `min-width` / `min-height` / `max-width` / `max-height` | 包含块的同方向尺寸；Flex 子节点撑开或等分场景除外，见下文实践约束 |
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

实践约束：

- Flex 子节点依赖百分比 `min-width` 撑开或等分时，Skyline 下失效，优先替换为明确长度单位。
- 若基准宽度是一屏，可按 `750rpx` 换算，例如 `min-width: 25%` 改为 `187.5rpx`。

### 颜色与渐变

| 类型 | Web/W3C CSS | Skyline 差异 | 建议 |
| --- | --- | --- | --- |
| `currentColor` | 标准颜色关键字 | Skyline 支持，但跨组件继承与迁移可读性较弱 | 适配代码优先写明确颜色 |
| `linear-gradient()` | 颜色停止位置支持标准语法 | 停止位置仅支持 `%` 和固定长度单位 | 不使用复杂 calc / 关键字停止位置 |
| `radial-gradient()` | 支持 circle / ellipse、多种尺寸单位与停止位置 | 仅支持 `circle`；尺寸仅支持 `px`；颜色停止位置仅支持 `%` | ellipse 改为图片或拆分节点 |
| `conic-gradient()` | 支持 | Skyline 无额外限制 | 可直接使用 |

## 布局、盒模型与层叠差异

| 属性 / 行为 | Web/W3C CSS | Skyline | 建议 |
| --- | --- | --- | --- |
| `display: grid` | 支持 | 不支持 | 使用 Flex 或 `grid-view` 组件 |
| `display: flow-root` | 支持 | 不支持 | 不依赖 BFC；改用显式布局 |
| `position: sticky` | 支持 | 不支持 | 使用 `sticky-header` / `sticky-section` |
| `position: fixed` | 支持，参与 Web 标准层叠上下文 | 支持；fixed 节点会进入 fixed-context，整体层级高于 normal-context，并按全局 fixed 节点的 `z-index` 排序 | 全屏弹层、toast 等可使用 fixed；层级控制按 fixed-context 规则设计 |
| `overflow: auto` / `overflow: scroll` | 支持 | 不支持 | 使用 `scroll-view` |
| `overflow-x` / `overflow-y` | 支持 | 不支持单独设置 | 只用整体 `overflow` 或改组件 |
| `visibility: collapse` | 支持 | 不支持 | 使用 `hidden` |
| `box-sizing: padding-box` | 历史/非标准实现中存在 | 不支持 | 只用 `content-box` / `border-box` |
| BFC | 支持 | 不支持 | 不用 BFC 解决浮动、清除、margin 合并问题 |
| margin 合并 | 块级上下 margin 会合并 | 不合并 | 不依赖 margin collapse |
| `z-index` | 受层叠上下文影响 | 只在兄弟节点间生效 | 重新排布为同层级兄弟节点，避免负 `z-index` |
| `content: url()` | 支持 | 不支持 | 伪元素图片用真实节点或背景图 |
| `content: none` | 标准含义为不生成内容 | 等同 `normal`，都映射为空 | 不用 `none` 区分状态 |

## 文本与字体差异

| 属性 / 行为 | Web/W3C CSS | Skyline | 建议 |
| --- | --- | --- | --- |
| `direction` | 支持 | 不支持 | 避免 RTL 方向控制依赖 |
| `font-weight: bolder/lighter` | 支持 | 不支持 | 改为 `normal` / `bold` / `100-900` |
| `font-weight: 500/600` | 支持 | 部分机型不生效 | 使用 `bold` / `700` |
| `font-style: oblique` | 支持 | 不支持 | 使用 `italic` |
| `font-feature-settings` 动画 | Web 可作为字体属性参与部分动画/过渡实现 | Skyline 支持属性本身，但不支持 transition / animation | 不对该属性做动画 |
| `white-space: pre/pre-wrap/pre-line` | 支持 | 不支持 | 只使用 `normal` / `nowrap` |
| `word-break: keep-all` | 支持 | 可解析但无实际效果，等同 `normal` | 不依赖 `keep-all` |
| `word-break: break-word` | 浏览器常见支持 | 映射为 `normal` | 使用 `break-all` 或组件能力 |
| `text-align: justify-all/match-parent` | 支持情况依浏览器而定 | 不支持 | 使用 `left` / `center` / `right` / `justify` / `start` / `end` |
| `vertical-align: text-top/text-bottom` | 支持 | 不支持 | 使用 `top` / `middle` / `bottom` / `baseline` |
| `text-decoration` | 可作用于普通文本容器 | 仅 `<text>` 和 `<input>` 生效；`text-decoration-thickness` 不生效 | view 内文字用 `<text>` 包裹 |
| `text-decoration-line` 多值 | 支持组合值 | 仅支持单值 | 多装饰效果拆分节点 |
| `text-overflow: ellipsis` | 常见块级文本容器可用 | CSS 属性仅在 `<text>` 生效 | 优先使用 `<text overflow max-lines>` |
| `text-indent` | 支持 | 不支持 | 用 `padding-left` 或真实占位节点 |
| `overflow-wrap` | 支持 | 不支持 | 用 `word-break` |
| `writing-mode` | 支持 | 不支持 | 无等效 CSS 替代 |
| `list-style-*` | 支持 | 不支持 | 列表符号用真实节点 |

`text-decoration` 简写是“部分有效”：展开后的 `text-decoration-line` / `text-decoration-style` / `text-decoration-color` 可生效，但 `text-decoration-thickness` 不生效。

## 背景、边框与遮罩差异

| 属性 / 行为 | Web/W3C CSS | Skyline | 建议 |
| --- | --- | --- | --- |
| `background-image` | 支持多背景 | 最多 2 个值，超出值会被忽略 | 超过 2 层时拆节点 |
| `background-position` | 支持多组值 | 最多 2 组值 | 超过 2 组时拆节点 |
| `background-repeat` | 支持 `space` / `round` 和多组值 | 不支持 `space` / `round`；不要依赖多组值 | 使用单组 `repeat` / `repeat-x` / `repeat-y` / `no-repeat` |
| `background-size` | 支持多组值 | 不支持多组值 | 使用单组值；多背景尺寸拆节点处理 |
| `background-attachment` | 支持 | 不支持 | 无等效 CSS 替代 |
| `background-origin` | 支持 | 不支持 | 无等效 CSS 替代 |
| `background-clip` | 支持 | 不支持 | 无等效 CSS 替代 |
| `background` 简写 | 全量子属性按标准展开 | `attachment` / `origin` / `clip` 子属性不生效 | 不在简写里依赖这三个子属性 |
| `border-style: hidden/double/groove/ridge/inset/outset` | 支持 | 不支持 | 只用 `none` / `solid` / `dashed` / `dotted` |
| `border-radius` + 四边边框 | 四边颜色、样式可不同 | `border-radius` 非 0 时，四边 `border-color` / `border-style` 需一致 | 保持一致或拆节点 |
| `box-shadow` 多层 | 支持逗号叠加 | 不支持多个叠加 | 拆节点模拟多层阴影 |
| `mask-image` | 支持 url 与渐变 | 仅支持 `url()`，不支持渐变；最多 2 个值，超出值会被忽略 | 渐变遮罩改图片或真实节点 |
| `mask-repeat` | 默认 `repeat` | 默认 `no-repeat` | 需要平铺时显式写 |
| `mask-origin` / `mask-clip` / `mask-mode` | 支持 | 不支持 | 无等效 CSS 替代 |
| `mask` 简写 | 全量子属性按标准展开 | `origin` / `clip` / `mode` 子属性不生效 | 不在简写里依赖这三个子属性 |

## 滤镜差异

| 属性 / 行为 | Web/W3C CSS | Skyline | 建议 |
| --- | --- | --- | --- |
| `filter: url()` | 支持 | 不支持 | 不使用 SVG filter |
| `filter: drop-shadow()` | 支持 | 不支持 | 用 `box-shadow` 替代 |
| 多个 filter 函数组合 | 支持 | 不支持 | 保留单个滤镜函数 |
| `backdrop-filter: url()` | 支持 | 不支持 | 不使用 SVG filter |
| `backdrop-filter: drop-shadow()` | 支持 | 不支持 | 避免使用；阴影改用 `box-shadow` |
| `backdrop-filter` 多函数组合 | 支持 | 不支持 | 保留单个滤镜函数 |

Skyline 支持的单个滤镜函数包括：`blur()`、`brightness()`、`contrast()`、`grayscale()`、`hue-rotate()`、`invert()`、`opacity()`、`saturate()`、`sepia()`。

## 动画与过渡差异

| 属性 / 行为 | Web/W3C CSS | Skyline | 建议 |
| --- | --- | --- | --- |
| 伪元素 `animation` | 支持 | 不支持 | 改为真实节点 + CSS animation |
| `animation-fill-mode` 值域 | Web 标准支持 `none` / `forwards` / `backwards` / `both` | Skyline 稳定语义只有 `forwards` / `both`；`none` / `backwards` 可写但表现为 `forwards` | 只写 `forwards` / `both` |
| `animation-name` | 标准支持关键字或自定义标识符 | 支持 `none` / `<custom-ident>` / `<string>`，可逗号分隔 | 可直接使用，但伪元素 animation 仍不生效 |
| `@keyframes` 选择器 | 支持 `from` / `to` / 百分比 | 支持 `from` / `to` / 百分比，可逗号分隔 | 可直接使用 |
| `will-change: scroll-position` | 支持 | 不支持 | 只用 `auto` / `contents` |
| `will-change: <custom-ident>` | 支持 | 不支持 | 不声明自定义属性名 |
| `transition-property` / animation 可动画属性 | 浏览器覆盖面更广 | 仅支持 Skyline 白名单 | 只对下方白名单属性做 transition/animation |

Skyline 不支持 transition / animation 的属性：

- 文本：`text-align`、`text-shadow`、`direction`、`white-space`、`word-break`
- 字体：`color`、`font-size`、`font-weight`、`font-style`、`font-family`、`font-feature-settings`、`line-height`、`letter-spacing`、`word-spacing`
- 其他：`visibility`、`pointer-events`

Skyline 支持 transition / animation 的主要属性：

- `transform`、`transform-origin`、`opacity`
- `width`、`height`、`min-width`、`max-width`、`min-height`、`max-height`
- `margin-*`、`padding-*`
- `top`、`right`、`bottom`、`left`
- `flex`、`flex-grow`、`flex-shrink`、`flex-basis`
- `border-*`、`border-radius`
- `background-color`、`background-position`、`background-size`、`background`
- `filter`、`backdrop-filter`、`box-shadow`、`z-index`
- `text-decoration-color`
- `mask`、`mask-size`、`mask-position`

## 其他 Skyline 不支持能力及兼容方案

以下属性、行为与 API 在 WebView / Web CSS 中可用或常见，但 Skyline 下不可用或设置后不生效：

| 分类 | 属性 / 行为 / API | 兼容方案 |
| --- | --- | --- |
| 布局 | `float` / 清除浮动相关写法 | 使用 Flex |
| 布局 | `contain` | 使用 Skyline 私有 `-wx-contain` |
| 布局 | `resize` | 无等效替代 |
| 布局 | 多列布局 `column-*` | Flex 或 `grid-view` |
| 布局 | `outline` | 用 border / box-shadow 模拟 |
| 交互 | `cursor` | 无等效替代 |
| Flex | `justify-items` | 无等效替代 |
| 滚动 | 页面滚动 | `scroll-view type="list"` + 页面 `disableScroll: true` |
| 响应式 | `@media screen` | 使用动态类 |
| 动画 API | `wx.createAnimation` | CSS `transition` / `animation` 或 Skyline Worklet |
