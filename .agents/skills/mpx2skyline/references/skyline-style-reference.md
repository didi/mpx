# Skyline 样式支持程度与兼容方案

本文整理当前知识库已确认的 Skyline WXSS 支持范围、差异与不支持能力。支持表按属性或能力分类；不支持清单按具体属性、取值、行为及 API 列出兼容方案。某属性“部分支持”不等于所有用法均可用。

- “支持”表示表中所列用法可用；“部分支持”表示存在取值、节点、版本或机型限制，详情见说明。
- 不支持项集中在[Skyline 不支持能力及兼容方案](#skyline-不支持能力及兼容方案)。未收录能力需要回源确认，不以未列出推断支持。
- 本文覆盖样式、布局及相关动画 API；组件专属属性与行为见[组件参考](./skyline-component-reference.md)，运行时约束见[运行时参考](./skyline-runtime-practice.md)。

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
- [Skyline 不支持能力及兼容方案](#skyline-不支持能力及兼容方案)

## 非标准默认值

| 属性 / 行为 | Skyline 支持程度 | 说明                                                                                              |
| --- | --- |-------------------------------------------------------------------------------------------------|
| `display` | 部分支持 | 默认 `flex`；`defaultDisplayBlock: true` 后为默认 `block`。`grid` / `flow-root` 不支持，替代方案见末尾清单。          |
| `position` | 部分支持 | 默认 `relative`；需要静态定位时显式写 `static`。支持 `fixed`，`sticky` 使用组件替代。                                   |
| `box-sizing` | 部分支持 | 默认 `border-box`；`defaultContentBox: true` 后为默认 `content-box`。有效值为 `content-box` / `border-box`。 |
| `flex-direction` | 支持 | 默认 `column`；`defaultDisplayBlock: true` 后为默认 `row`，纵向 Flex 显式声明 `column`。                       |
| `align-items` | 支持 | 默认 `stretch`；`defaultDisplayBlock: true` 后为默认 `normal`。                                           |
| `text-align` | 部分支持 | 默认 `start`；可用 `left` / `center` / `right` / `justify` / `start` / `end`。                        |
| `mask-repeat` | 支持 | 默认 `no-repeat`，需要平铺时显式声明。                                                                       |

## 选择器支持

| 属性 / 行为 | Skyline 支持程度 | 说明                                                      |
| --- | --- |---------------------------------------------------------|
| 类选择器 | 支持 | 可将属性或交互状态映射为模板 class。                                   |
| `::before` / `::after` | 部分支持 | 支持静态伪元素；伪元素 animation 与 `content: url()` 不支持，替代方案见末尾清单。 |
| `:first-child` / `:last-child` | 支持 | 可直接使用。                                                  |
| `a ~ b` / `a + b` | 部分支持 | 微信 8.0.49+ 支持；低版本需要模板动态类替代。                             |
| `:not` / `:only-child` / `:empty` | 部分支持 | 微信 8.0.49+ 支持；低版本需要模板动态类替代。                             |
| `:nth-child` | 部分支持 | 微信 8.0.50+ 支持；低版本通过 index 动态类实现。                        |

## 值类型支持

### 长度、函数与单位

| 属性 / 行为 | Skyline 支持程度 | 说明                                                                          |
| --- | --- |-----------------------------------------------------------------------------|
| `calc()` | 部分支持 | 仅支持长度计算；角度等其他类型与嵌套计算不支持，详见末尾清单。                                             |
| `env()` | 部分支持 | 仅支持 `safe-area-inset-top/right/bottom/left` 四个安全区变量。                        |
| `em` | 支持 | Mpx 适配优先使用 `rpx` / `px`                                     |
| `auto` | 部分支持 | 取决于属性：`overflow` 的 `auto` 用法见末尾清单；`min-height` / `max-height` 默认值不是 `auto`。 |

### CSS 变量

| 属性 / 行为 | Skyline 支持程度 | 说明 |
| --- | --- | --- |
| CSS 自定义属性 | 支持 | 变量名以 `--` 开头，例如 `--name`。 |
| `var(--name, fallback)` | 支持 | 支持 fallback 语法；变量命名与作用域应清晰。 |

### 百分比支持情况

本表的支持程度仅评价百分比用法，不代表该属性的所有取值或组合均受支持。

| 属性 / 行为 | Skyline 支持程度 | 说明 |
| --- | --- | --- |
| `line-height` | 支持 | 百分比参照当前 `font-size`。 |
| `transform-origin` | 支持 | 参照元素自身 `width` / `height`。 |
| `background-position` | 支持 | 参照元素尺寸减背景图尺寸。 |
| `width` / `height` | 支持 | 参照包含块的同方向尺寸。 |
| `min-width` / `min-height` / `max-width` / `max-height` | 部分支持 | 通常参照包含块同方向尺寸；Flex 子节点依赖百分比 `min-width` 撑开或等分的场景失效，应使用明确长度。 |
| `top` / `right` / `bottom` / `left` | 支持 | 参照包含块尺寸。 |
| `padding` / `padding-*`、`margin` / `margin-*` | 支持 | 参照包含块的同方向尺寸。 |
| `flex-basis` | 支持 | 参照 Flex 容器主轴尺寸。 |
| `gap` / `row-gap` / `column-gap` | 支持 | 参照 Flex 容器对应方向尺寸。 |
| `border-radius` / `border-*-radius` | 支持 | 参照元素自身 border-box 尺寸。 |
| `background-size` | 支持 | 参照背景定位区域减背景图尺寸。 |
| `box-shadow` / `text-shadow` 偏移 | 支持 | 参照元素自身 width / height；模糊半径的百分比见末尾清单。 |
| `letter-spacing` / `word-spacing` | 支持 | 参照元素自身 font-size。 |
| `transform: translate*()` / `translateZ()` | 支持 | 参照元素自身 width / height。 |

### 颜色与渐变

| 属性 / 行为 | Skyline 支持程度 | 说明 |
| --- | --- | --- |
| `currentColor` | 支持 | 可作为颜色值或变量值；跨组件继承及迁移可读性需留意，关键颜色可显式声明。 |
| `linear-gradient()` | 部分支持 | 颜色停止位置仅支持 `%` 和固定长度单位。 |
| `radial-gradient()` | 部分支持 | 仅支持 `circle`；尺寸仅支持 `px`；颜色停止位置仅支持 `%`。 |
| `conic-gradient()` | 支持 | Skyline 无额外限制。 |

## 布局、盒模型与层叠差异

| 属性 / 行为 | Skyline 支持程度 | 说明                                                                                                              |
| --- | --- |-----------------------------------------------------------------------------------------------------------------|
| `position: fixed` | 支持 | 节点进入 fixed-context，整体高于 normal-context；所有 fixed 节点按全局 z-index 排序。                                               |
| `overflow` | 部分支持 | 使用整体 overflow 控制裁剪；滚动及分轴设置见末尾清单。`overflow: hidden` 不建立 BFC。                                                     |
| `visibility` | 部分支持 | 隐藏使用 `hidden`；`collapse` 不支持，替代方案见末尾清单。                                                                         |
| `margin` | 部分支持 | 支持节点自身间距，但没有垂直 margin 折叠。先确认原 WebView 是否折叠，再保留其有效间距，详见[布局实践](./skyline-layout-practice.md#垂直-margin-折叠处理)。      |
| `z-index` | 部分支持 | 普通节点按共同父级下的兄弟分支比较；fixed 节点按全局 fixed-context 比较。transform/opacity 不创建 Web 式层叠上下文；scroll-view 直接子节点的 z-index 不生效。 |
| `content: none` / `normal` | 部分支持 | 均映射为空；不能用两者区分状态。                                                                                                |

## 文本与字体差异

| 属性 / 行为 | Skyline 支持程度 | 说明                                                                                                                                               |
| --- | --- |--------------------------------------------------------------------------------------------------------------------------------------------------|
| `font-weight` | 部分支持 | 可用 `normal` / `bold` / `100-900`；500/600 在部分 Android 机型不生效。                                                   |
| `font-style` | 部分支持 | 斜体使用 `italic`；`oblique` 不支持，替代方案见末尾清单。                                                                                                           |
| `font-feature-settings` | 部分支持 | 静态属性可用，transition/animation 用法见末尾清单。                                                                                                             |
| `white-space` | 部分支持 | 使用 `normal` / `nowrap`；保留空白、换行的其他值见末尾清单。                                                                                                         |
| `word-break` | 部分支持 | `keep-all` / `break-word` 可解析但映射为 `normal`；需强制断词时按语义使用 `break-all`。                                                                              |
| `vertical-align` | 部分支持 | 使用 `top` / `middle` / `bottom` / `baseline`。                                                                                                     |
| `text-decoration` | 部分支持 | 仅 `<text>` / `<input>` 生效；简写展开后的 `text-decoration-line` / `text-decoration-style` / `text-decoration-color` 可生效，`text-decoration-thickness` 不生效。 |
| `text-decoration-line` | 部分支持 | 仅支持单值，多装饰效果需要拆分节点。                                                                                                                               |
| `text-overflow: ellipsis` | 部分支持 | CSS 属性仅在 `<text>` 生效；Skyline 文本截断优先使用承载节点的 `overflow` / `max-lines` 属性。                                                                          |

## 背景、边框与遮罩差异

| 属性 / 行为 | Skyline 支持程度 | 说明                                                                                |
| --- | --- |-----------------------------------------------------------------------------------|
| `background-image` | 部分支持 | 最多 2 个值，超出的值忽略；更多背景层拆节点。                                                          |
| `background-position` | 部分支持 | 最多 2 组值，更多位置组拆节点。                                                                 |
| `background-repeat` | 部分支持 | 使用单组 `repeat` / `repeat-x` / `repeat-y` / `no-repeat`；space/round 及多组值不支持，详见末尾清单。 |
| `background-size` | 部分支持 | 仅单组值；多背景需要不同尺寸时拆节点。                                                               |
| `background` 简写 | 部分支持 | attachment/origin/clip 子属性不生效；其他子属性仍受各自支持范围约束。                                    |
| `border-style` | 部分支持 | 使用 `none` / `solid` / `dashed` / `dotted`。                                        |
| `border-radius` 与四边边框 | 部分支持 | 圆角非 0 时，四边 border-color / border-style 需一致；不同效果拆节点。                               |
| `box-shadow` | 部分支持 | 支持单层阴影，包括 rgba 颜色；颜色函数内部逗号不代表多层阴影。多层效果拆节点。                                        |
| `mask-image` | 部分支持 | 仅支持 `url()`，最多 2 个值，超出值忽略；渐变遮罩不支持，详见末尾清单。                                         |
| `mask` 简写 | 部分支持 | origin/clip/mode 子属性不生效；其余能力遵循各子属性限制。                                             |

## 滤镜差异

| 属性 / 行为 | Skyline 支持程度 | 说明                                                                                                                                      |
| --- | --- |-----------------------------------------------------------------------------------------------------------------------------------------|
| `filter` / `backdrop-filter` | 部分支持 | 支持单个 blur()/brightness()/contrast()/grayscale()/hue-rotate()/invert()/opacity()/saturate()/sepia()；url()/drop-shadow()及多函数组合不支持，详见末尾清单。 |

## 动画与过渡差异

| 属性 / 行为 | Skyline 支持程度 | 说明                                                  |
| --- | --- |-----------------------------------------------------|
| 真实节点 CSS `animation` | 部分支持 | 支持节点动画；作用属性限于下方白名单，伪元素动画及不支持的属性动画详见末尾清单。             |
| `animation-fill-mode` | 部分支持 | 稳定语义为 forwards/both；none/backwards 可写但表现为 forwards。 |
| `animation-name` | 支持 | 支持 `none` / `<custom-ident>` / `<string>`，可逗号分隔。    |
| `@keyframes` 选择器 | 支持 | 支持 from/to/百分比，可逗号分隔。                               |
| `will-change` | 部分支持 | 使用 auto/contents；scroll-position及自定义属性名不支持，详见末尾清单。  |
| `transition-property` / animation 可动画属性 | 部分支持 | 仅支持 Skyline 白名单；属性静态可用不代表它可参与动画。                    |

Skyline 支持 transition / animation 的主要属性如下；每项仍受其静态值域与节点约束限制，通配写法不意味着任意后缀均可用：

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

## Skyline 不支持能力及兼容方案

以下集中列出本文涉及的全部已确认不支持项，包括可解析但原语义不生效的用法。支持属性的受限取值在此单列，不代表整个属性不受支持。替代方案应保留原视觉与交互；无等效方案时明确差异。

| 属性 / 行为 / API | 兼容方案 |
| --- | --- |
| `*` | 使用页面根类或组件类。 |
| `[attr]` / `[attr=value]` | 模板绑定 class，以类选择器表达状态。 |
| `::before` / `::after` 以外的伪元素 | 用受支持伪元素或真实节点。 |
| `:active` | 使用 hover-class / hover-stay-time。 |
| 低于微信8.0.49的相邻/通用兄弟选择器及:not/:only-child/:empty；低于8.0.50的:nth-child | 模板按节点关系及index绑定动态类，或明确最低微信版本。 |
| 支持表未列出的其他伪类 | 使用模板动态类。 |
| `calc()` 角度等非长度计算、嵌套计算 | 静态计算后写明确值，如 135deg；动态计算放脚本中。 |
| `env()` 的非 safe-area-inset-* 变量 | 使用对应宿主信息或显式状态值，按需求核验来源。 |
| `border-width` / `border-*-width`、`font-size` 的 `%` | 换为明确长度单位。 |
| `box-shadow` / `text-shadow` 模糊半径、`perspective` 的 `%` | 使用明确长度；偏移百分比支持范围见前表。 |
| Flex 子节点通过百分比 min-width 撑开或等分 | 按实际基准尺寸换算明确长度，或改用等分 Flex 布局。 |
| linear-gradient 的复杂 calc/关键字停止位置 | 改为百分比或固定长度停止位置。 |
| radial-gradient 的 ellipse、非px尺寸、非百分比停止位置 | 用支持的 circle/px/%，需保留椭圆视觉时改图片或分层节点。 |
| `display: grid` | Flex 或 grid-view 组件。 |
| `display: flow-root` / BFC | 使用显式布局；按原WebView是否折叠确定间距，保留必要裁剪。 |
| 垂直 margin 折叠 | 保留原折叠后的有效间距；外部margin和内部padding分别处理。 |
| `float` / 清除浮动相关写法 | 使用 Flex。 |
| `position: sticky` | 使用 custom 类型 scroll-view 内的 sticky-section/sticky-header。 |
| Web式层叠上下文（含transform/opacity创建上下文） | 按普通兄弟分支或fixed-context比较层级，详见[层叠实践](./skyline-layout-practice.md#z-index-与层叠适配)。 |
| scroll-view 直接子节点的 z-index | 在滚动项内部增加节点承载层级，或按需求移到fixed层。 |
| `visibility: collapse` | 按需求使用hidden；布局占位变化需单独确认。 |
| `box-sizing: padding-box` | 使用content-box / border-box。 |
| `contain` | 使用Skyline私有 -wx-contain，并核验实际约束。 |
| `resize` | 无直接等效替代；需要交互时单独实现尺寸状态。 |
| 多列布局 `column-*` | Flex 或 grid-view；此处指多列布局属性，不含支持的column-gap。 |
| `outline` | border / box-shadow模拟，检查盒尺寸及外观差异。 |
| `justify-items` | 无直接等效替代；按实际Flex布局选择对齐方式。 |
| 页面滚动 | 普通长列表使用scroll-view type=list及页面disableScroll:true，迁移刷新/触底/滚动事件。 |
| `overflow: auto` / `overflow: scroll` | 使用scroll-view。 |
| `overflow-x` / `overflow-y` 单独设置 | 整体overflow裁剪，或使用scroll-view的方向属性。 |
| `@media screen` | Skyline用renderer及屏宽动态类；WebView媒体查询保留，详见[媒体查询实践](./skyline-layout-practice.md#media-screen-替换方案)。 |
| `cursor` | 无等效指针样式替代。 |
| `content: url()` | 用真实图片节点或背景图。 |
| 通过content:none区别于normal的Web语义 | 两者均映射为空；通过状态控制真实节点展示。 |
| `direction` | 无等效CSS方向控制；按目标语言设计并验证排版。 |
| `font-weight: bolder/lighter` | 澄清目标字重后使用normal/bold/100-900，500/600机型风险见支持表。 |
| `font-weight: 500/600` 在部分机型不生效 | 保留原设计并记录真机风险；澄清并获确认后才调整到bold/700，或核验独立字体族。 |
| `font-style: oblique` | 按视觉要求使用italic。 |
| `white-space: pre/pre-wrap/pre-line` | 使用normal/nowrap；需保留空白与换行时拆文本或真实节点并验证。 |
| `word-break: keep-all/break-word` 的原有断词语义 | 当前映射为normal；按目标使用break-all或调整文本结构。 |
| `text-align: justify-all/match-parent` | 使用left/center/right/justify/start/end。 |
| `vertical-align: text-top/text-bottom` | 使用top/middle/bottom/baseline。 |
| text/input以外节点的text-decoration | 用text包裹文字。 |
| `text-decoration-thickness` | 无等效属性；需指定粗细时用真实装饰节点。 |
| `text-decoration-line` 多值组合 | 多装饰效果拆节点。 |
| 非text节点上的CSS text-overflow:ellipsis | 普通文本改用text；混排使用[span方案](./skyline-layout-practice.md#图文混排)及实际承载节点overflow/max-lines。 |
| `text-indent` | padding-left或真实占位节点，核对首行缩进与整体缩进差异。 |
| `overflow-wrap` | 按断词语义使用word-break。 |
| `writing-mode` | 无等效CSS替代。 |
| `list-style-*` | 列表符号使用真实节点。 |
| background-image超过2层、background-position超过2组 | 拆节点保留全部背景效果。 |
| `background-repeat: space/round` 及多组值 | 使用单组repeat/repeat-x/repeat-y/no-repeat；复杂重复布局拆节点。 |
| `background-size` 多组值 | 单组值或拆节点分别设置尺寸。 |
| `background-attachment` / `background-origin` / `background-clip`（含background简写对应子项） | 无直接等效CSS替代；按目标拆分定位、背景或裁剪节点并验证。 |
| `border-style: hidden/double/groove/ridge/inset/outset` | 使用none/solid/dashed/dotted；特殊视觉拆节点实现。 |
| 非零border-radius配合四边不同border-color/border-style | 保持四边一致或拆节点。 |
| 单节点多层box-shadow | 同尺寸节点分层，保留原始参数及前后关系；rgba内部逗号不作多层分隔。 |
| mask-image渐变、超过2个值 | 渐变转图片；更多层拆节点，保留合成效果。 |
| `mask-origin` / `mask-clip` / `mask-mode`（含mask简写对应子项） | 无直接等效CSS替代，按目标调整资源和节点结构。 |
| filter/backdrop-filter的url() | SVG filter无直接等效支持；按效果使用支持的单函数或预渲染资源。 |
| filter/backdrop-filter的drop-shadow() | 可用box-shadow替代盒阴影；轮廓阴影需核对视觉差异。 |
| filter/backdrop-filter多函数组合 | 按作用顺序分层或提供等效资源，保留各效果；backdrop-filter分层还需核验采样范围。 |
| 伪元素animation | 真实节点加CSS animation。 |
| animation-fill-mode:none/backwards的Web语义 | 当前表现为forwards；使用forwards/both，或显式设置初始/恢复状态。 |
| will-change:scroll-position / <custom-ident> | 使用auto/contents，或省略该优化提示。 |
| 文本属性transition/animation：text-align、text-shadow、direction、white-space、word-break | 直接切换静态值或调整节点结构；可动画属性见白名单。 |
| 字体属性transition/animation：color、font-size、font-weight、font-style、font-family、font-feature-settings、line-height、letter-spacing、word-spacing | 直接切换静态值；确需过渡时另行设计支持的transform/opacity方案。 |
| visibility / pointer-events 的transition/animation | 状态直接切换；渐显渐隐用opacity并单独管理交互。 |
| `wx.createAnimation` | 简单状态动画用CSS transition，循环动画用真实节点CSS animation；确需UI线程实时驱动时采用Skyline Worklet并隔离renderer。 |
| `animate` / `applyAnimation` / `clearAnimation` / `setInitialRenderingCache` | 用CSS状态/animation及显式复位，或按需求使用Worklet；详见[运行时参考](./skyline-runtime-practice.md#必须-skyline-不支持的组件实例方法)。 |
