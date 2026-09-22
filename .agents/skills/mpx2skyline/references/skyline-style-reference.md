# Skyline 与 WebView WXSS 差异参考

本文记录微信小程序从 WebView 迁移到 Skyline 时，WXSS 默认值、选择器、属性取值和渲染行为的差异，重点解释容易误判或静默失效的部分，不是属性全量支持表。

## 目录

- [阅读说明](#阅读说明)
- [默认值差异与配置影响](#默认值差异与配置影响)
- [选择器差异](#选择器差异)
- [值、单位与计算差异](#值单位与计算差异)
  - [长度、函数与单位](#长度函数与单位)
  - [百分比支持情况](#百分比支持情况)
  - [颜色与渐变](#颜色与渐变)
- [布局、盒模型与层叠差异](#布局盒模型与层叠差异)
- [文本与字体差异](#文本与字体差异)
- [背景、边框与阴影差异](#背景边框与阴影差异)
- [遮罩与滤镜差异](#遮罩与滤镜差异)
  - [遮罩差异](#遮罩差异)
  - [滤镜差异](#滤镜差异)
- [动画与过渡差异](#动画与过渡差异)
  - [可动画属性范围](#可动画属性范围)
- [媒体查询差异](#媒体查询差异)

## 阅读说明

- **比较基准**：以微信小程序 WebView 的对应组件、节点和布局场景为基准。CSS 初始值不等于组件实际默认样式；WebView 的能力也受微信版本和系统 WebView 影响。
- **差异类型**：表中区分“不支持”“取值受限”“行为不同”“条件限制”；“Mpx 适配建议”不等于引擎不支持。
- **使用边界**：未列出不代表完全等同 WebView。解析器接受某语法，不代表渲染生效；静态属性可用，也不代表能参与动画。
- **职责分工**：本文维护能力事实与简要迁移方向；完整改造示例查 [布局与样式适配实践](skyline-style-practice.md)，扫描规则查 [审计矩阵](skyline-audit-matrix.md)。页面滚动与宿主动画 API 查运行时参考，不归入 WXSS 属性限制。

## 默认值差异与配置影响

以下对比未显式声明样式时的表现；项目已有 WXSS、组件默认样式和 Skyline 配置均可能覆盖这些基线。配置的完整接入方式见 [rendererOptions.skyline](skyline-configuration.md#rendereroptionsskyline-配置项)。

| 属性 | WebView 基线 / 场景 | Skyline 默认值（未开启兼容配置） | 配置影响与迁移处理 |
| --- | --- | --- | --- |
| `display` | 普通 `view` 按块级布局 | `flex` | `defaultDisplayBlock: true` 后为 `block`；特殊组件仍核对自身布局 |
| `position` | 普通流中为 `static` | `relative` | 需要静态定位时显式声明 `static` |
| `box-sizing` | 常规 CSS 基线为 `content-box` | `border-box` | `defaultContentBox: true` 后为 `content-box` |
| `flex-direction` | Flex 容器默认 `row` | `column` | `defaultDisplayBlock: true` 时为 `row` |
| `align-items` | 默认 `normal`，Flex 场景通常表现为拉伸 | `stretch` | `defaultDisplayBlock: true` 时为 `normal` |
| `mask-repeat` | 默认为 `repeat` | `no-repeat` | 需要平铺时显式声明 `repeat` |
| `mask-position-x` / `mask-position-y` | [CSS 遮罩初始位置](https://www.w3.org/TR/css-masking-1/#the-mask-position)为 `0% 0%` | 默认 `center` | 不依赖默认定位；按原设计显式设置 `mask-position` |

> `text-align: start` 不作为独立默认值差异：两种渲染模式均需结合文本方向理解。若业务要求固定物理方向，显式设置 `left` / `right`；Skyline 的 `direction` 限制见 [文本与字体差异](#文本与字体差异)。

## 选择器差异

| 选择器 / 写法 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `*` | 通配匹配 | **不支持** | 使用页面根类或组件类 |
| `[attr]` / `[attr=value]` | 按属性匹配 | **不支持** | 用 `wx:class` 表达动态状态，再使用类选择器 |
| `::before` / `::after` 以外的伪元素 | 随 WebView 支持情况可用 | **取值受限**：仅使用已支持的 `::before` / `::after` | 其他伪元素改为真实节点 |
| `:active` | 可表达按压状态 | **不支持** | 使用组件的 `hover-class` / `hover-stay-time` |

> 其他可用选择器：
>
> 1. `:first-child` / `:last-child` 可用；
> 2. 兄弟选择器 `a ~ b` / `a + b` 及 `:not` / `:only-child` / `:empty` 微信 8.0.49+ 可用；
> 3. `:nth-child` 微信 8.0.50+ 可用。

## 值、单位与计算差异

### 长度、函数与单位

| 值 / 写法 | WebView 表现 | Skyline 差异                                                           | 迁移处理                                           |
| --- | --- |----------------------------------------------------------------------|------------------------------------------------|
| `calc()` | 可用于长度、角度等计算，具体取决于消费属性 | **取值受限**：仅支持长度计算，不支持角度类型                                             | 角度直接写确定值，动态计算放脚本；Mpx 适配推荐采用非嵌套写法   |
| `env()` | 可访问宿主提供的环境变量 | **取值受限**：仅支持 `safe-area-inset-top/right/bottom/left`；语法允许长度 fallback | 只依赖安全区变量，其他信息通过宿主 API 获取                       |
| `<length>` 中的 `%` / `auto` | 是否接受取决于具体属性 | **条件限制**：通用长度语法包含这些值，不代表每个属性均实现其语义                                   | 按属性核对；例如 `overflow` 的 `auto` 是关键字限制，不能由长度语法推断支持 |

> 注意事项：
> Skyline 支持的长度单位有 `px`、`rpx`、`vw`、`vh`、`vmin`、`vmax`、`rem`、`em`，**Mpx 适配建议**仍优先使用 `rpx` / `px`。
> Skyline 支持自定义属性及 `var(--name, fallback)`。

### 百分比支持情况

百分比必须分别确认“能否使用”和“相对谁计算”，以下为支持 `%` 的属性及参照对象。

| 属性 | Skyline 参照对象 |
| --- | --- |
| `line-height` | 当前 `font-size` |
| `transform-origin` | 元素自身的 `width` / `height` |
| `background-position` | 元素尺寸 - 背景图尺寸 |
| `width` / `height` | 包含块的同方向尺寸 |
| `min-width` / `min-height` / `max-width` / `max-height` | 包含块的同方向尺寸 |
| `top` / `right` / `bottom` / `left` | 包含块的尺寸 |
| `padding` / `padding-*` / `margin` / `margin-*` | 包含块的同方向尺寸 |
| `flex-basis` | Flex 容器的主轴尺寸 |
| `gap` / `row-gap` / `column-gap` | Flex 容器的对应方向尺寸 |
| `border-radius` / `border-*-radius` | 元素自身的 border-box 尺寸 |
| `background-size` | 背景定位区域 - 背景图尺寸 |
| `box-shadow` / `text-shadow` 偏移 | 元素自身的 width / height |
| `letter-spacing` / `word-spacing` | 元素自身的 font-size |
| `transform: translate*()` / `translateZ()` | 元素自身的 width / height |

**实践约束：**

- 先明确包含块、主轴和元素自身的尺寸；百分比不能补齐未确定的父级高度或主轴尺寸。

**其他属性的支持边界：**

- Skyline 下，`font-size`、`border-width`、阴影模糊半径、`perspective` 不支持 `%`。

### 颜色与渐变

| 值 / 写法 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `linear-gradient()` 的色标位置 | 使用颜色停止位置语法 | **取值受限**：停止位置仅支持 `%` 和固定长度单位（px、rpx 等） | 不依赖复杂计算或未列出的色标语法 |
| `radial-gradient()` | 可使用 circle / ellipse 等形状及相应尺寸规则 | **取值受限**：仅支持 `circle` 形状（不支持 `ellipse`），尺寸仅支持 `px`，颜色停止仅支持 `%` | 椭圆效果改图片或拆节点；迁移采用明确 `px` 尺寸 |

> 其他补充：
> `currentColor` 作为颜色值或变量值，Skyline 适配中不建议依赖跨组件继承，关键颜色显式声明。
> `conic-gradient()` 完全支持，无额外限制。

## 布局、盒模型与层叠差异

| 属性 / 写法 / 行为 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `direction` | 可控制文本、表格列和水平溢出的方向 | **不支持** | 不依赖该属性 |
| `display: grid` / `flow-root` | 可形成 Grid / 独立块格式化上下文 | **取值受限**：不支持 grid / flow-root | Grid 改 Flex 或 `grid-view`；内联场景仍按 [内联混排](skyline-style-practice.md#内联混排) 处理 |
| `position: sticky` | 随滚动吸顶 | **取值受限**：仅 `static` / `relative` / `absolute` / `fixed`；不支持 `sticky` | Skyline 使用 sticky 组件；WebView 保留 sticky，见 [吸顶实践](skyline-style-practice.md#sticky-吸顶替代方案) |
| `overflow` | 可指定滚动、裁剪及双轴值 | **取值受限**：仅支持单个 `visible` / `hidden`，同时作用于两轴；不支持 `auto` / `scroll` 或双值写法 | 滚动改 `scroll-view`；需要裁剪时确认两个方向都可裁剪 |
| `overflow-x` / `overflow-y` | 可独立控制两轴 | **不支持** | 使用整体 `overflow` 或滚动组件的方向属性 |
| BFC / margin 合并 | 满足条件时可形成 BFC，垂直 margin 可合并 | **行为不同**：没有 BFC 和 margin 合并；`overflow: hidden` 不能承担 BFC 的布局作用 | 保留有效间距，见 [margin 折叠处理](skyline-style-practice.md#垂直-margin-折叠处理) |
| `z-index` / `position: fixed` | 参与 Web 层叠上下文 | **行为不同**：非 fixed 节点按共同父级下的兄弟分支比较；fixed 节点全局提升并按自身 z-index 排序，整体高于非 fixed | 不跨分支猜测层级，见 [层叠实践](skyline-style-practice.md#z-index-与层叠适配) |
| `transform` / `opacity` 对层级的影响 | 可建立层叠上下文 | **行为不同**：不会按 WebView 方式建立该层叠上下文 | 不用变换或透明度抬升层级；属性本身可用不等于层叠语义相同 |
| `visibility: collapse` | 在特定布局中影响占位 | **取值受限**：仅 `visible` / `hidden` | 使用 hidden 前确认占位要求，不认为两者等价 |
| `box-sizing: padding-box` | 历史非标准写法，不是稳定 WebView 基线 | **取值受限**：仅 `content-box` / `border-box` | 存量命中时改为支持值并核对尺寸 |
| `float` / 清除浮动布局 | 可形成浮动排版 | **不支持**浮动布局 | 使用 Flex，不用 BFC 或清除浮动技巧补救 |
| `contain` | 提供 CSS containment | **不支持**标准属性 | `-wx-contain` 替代 |
| 多列布局 `column-*` | 可生成多列文本布局 | **不支持**该类多列布局 | 改 Flex / `grid-view` |
| `justify-items` | 在 Grid 等布局中有意义，不能泛称为 Flex 对齐能力 | **不支持** | 按现有布局选择 `align-items` / `justify-content` 等，不机械替换方向 |
| `outline` | 绘制轮廓，不按 border 方式占位 | **不支持** | 以 border / box-shadow 模拟前核对尺寸和外观 |
| `resize` / `cursor` | 按宿主支持提供调整尺寸 / 指针反馈 | **不支持**（cursor 为既有适配记录） | 无等效属性；按交互需求另行设计 |
| `content: url()` | 可生成图片内容 | **取值受限**：不支持 | 真实图片节点或背景图 |
| `content: none` | 与 normal 的生成内容语义不同 | **行为不同**：none 与 normal 均映射为空 | 不依赖两者区别控制伪元素展示 |


> 其他注意事项：
> Flex 布局属性均支持，但不能覆盖默认方向、百分比尺寸和文本换行的行为差异；分别查 [默认值](#默认值差异与配置影响)、[百分比](#百分比支持情况) 与 [Flex 文本换行实践](skyline-style-practice.md#flex-布局的子节点文本超出未自动换行)。
> 页面滚动及生命周期迁移见 [运行时参考](skyline-runtime-practice.md#页面滚动替代方案)，不作为 CSS overflow 的额外取值。

## 文本与字体差异

| 属性 / 写法 / 行为 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `font-weight: bolder/lighter` | 相对父级计算字重 | **取值受限**：仅 `normal` / `bold` / 数值 `100–900` | 先确认目标字重，再选择明确值 |
| `font-style: oblique` | 倾斜字体，可带角度 | **取值受限**：oblique 不支持；采用 `normal` / `italic` | 按视觉需求使用 italic，不视为完全等效 |
| `white-space` | 可保留换行和空白 | **取值受限**：仅 `normal` / `nowrap`，不支持 pre / pre-wrap / pre-line | 需要保留空白与换行时调整文本或节点结构并验证 |
| `word-break: keep-all` / `break-word` | 有各自断词语义 | **行为不同**：keep-all 可解析但渲染未实现；break-word 映射为 normal | 不依赖原断词语义；按目标选择 normal / break-all 或调整内容结构 |
| `text-align` | 取值支持依宿主而定 | **取值受限**：列出 `left` / `center` / `right` / `justify` / `start` / `end`；不支持 justify-all / match-parent | 选择已列值，并核对逻辑方向 |
| `vertical-align` | 可按文字或行框对齐 | **取值受限**：仅 `baseline` / `top` / `middle` / `bottom`；不支持 text-top / text-bottom | 核对基线与目标视觉后替换 |
| `text-decoration` 简写 | 可组合线型、样式、颜色和粗细 | **条件限制**：仅 text / input 生效；line / style / color 子属性有效，thickness 无效 | 文本节点承载装饰，不因简写可解析就认为粗细生效 |
| `text-decoration-line` | 可组合多种装饰线 | **取值受限**：仅单个 `none` / `underline` / `overline` / `line-through`，不支持组合与 blink | 多装饰拆节点，见 [多值实践](skyline-style-practice.md#text-decoration-line-多值适配) |
| `text-decoration-style` / `text-decoration-color` | 可控制装饰线样式与颜色 | **条件限制**：仅 text / input；style 列出 `solid` / `double` / `dotted` / `dashed` / `wavy` | 不把 border-style 的限制套到文字装饰；颜色仍按受支持颜色值设置 |
| `text-decoration-thickness` | 指定装饰线粗细 | **不支持** | 需精确粗细时使用真实装饰节点 |
| `text-overflow: ellipsis` | 常见块级文本容器可用，需配合溢出条件 | **条件限制**：CSS 属性只在 text 生效 | 用组件的 overflow / max-lines，并保留 WebView 省略样式，见 [文本省略实践](skyline-style-practice.md#文本溢出省略适配) |
| `text-indent` | 首行缩进 | **不支持** | 占位节点或 padding 需验证；padding 会缩进整个内容区，不能当作等效替换 |
| `overflow-wrap` | 控制长词溢出换行 | **不支持** | 按业务断词语义选择 word-break 或调整文本，不能仅换属性名 |
| `writing-mode` | 改变书写模式 | **不支持** | 无等效 WXSS 属性 |
| `list-style-type` / `list-style-image` / `list-style-position` | 定义列表标记 | **不支持** | 列表符号使用真实节点 |

字体和文本的静态支持不代表动画支持，`font-feature-settings` 等属性的动画限制统一见 [可动画属性范围](#可动画属性范围)。

## 背景、边框与阴影差异

| 属性 / 写法 / 行为 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `background-image` | 支持多层背景 | **取值受限**：最多 2 个值 | 超出范围拆节点，保留各层顺序 |
| `background-position` | 各背景可有独立定位 | **取值受限**：最多 2 组；position-x / position-y 支持 | 分组数与背景层数对应；百分比基准见 [百分比](#百分比支持情况) |
| `background-repeat` 的取值 | 支持 space / round 等平铺方式 | **取值受限**：列出 repeat-x / repeat-y，以及由 repeat / no-repeat 构成的一组单双轴值；不支持 space / round | 区分“一组中的两个轴值”和“逗号分隔的多组” |
| `background-repeat` / `background-size` 的多组值 | 可按背景层分别设置 | **取值受限**：最多 2 组；单组 size 列出 auto / cover / contain / 一至两个长度 | 暂采用单组，必要时拆节点 |
| `background-attachment` / `background-origin` / `background-clip` | 分别控制背景附着、定位区域与绘制区域 | **不支持**；在 background 简写中也不会因展开而生效 | 按设计拆分定位、背景或裁剪节点；不能仅删除后宣称视觉等价 |
| `background` 简写 | 将背景子属性组合声明 | **条件限制**：color / image / repeat / position / position-x / position-y / size 可生效，仍受各自层数与取值限制 | 避免依赖简写中被忽略的 attachment / origin / clip |
| `border-style` / 四边 style | 可指定更多边框线型 | **取值受限**：仅 none / solid / dashed / dotted；不支持 hidden / double / groove / ridge / inset / outset | 特殊边框视觉拆节点实现 |
| 非零 `border-radius` + 四边不同颜色 / 线型 | 可分别设置各边 | **条件限制**：四边 border-color / border-style 一致 | 保持一致或拆节点 |
| `box-shadow` 多层 | 逗号分隔叠加 | **条件限制**：按单层适配 | 保留单层迁移方案，多层效果拆同尺寸节点；若要直接使用多层，先验证目标运行环境 |

## 遮罩与滤镜差异

### 遮罩差异

| 属性 / 写法 / 行为 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `mask-image` | 支持图像与渐变遮罩 | **取值受限**：仅 none / url()；渐变不可用，最多 2 个值 | 渐变转换图片，超出层数拆节点并核对合成效果 |
| `mask-origin` / `mask-clip` / `mask-mode` | 控制定位、裁剪与遮罩模式 | **不支持** | 按资源与节点结构实现目标效果，不从 mask 简写推断支持 |
| `mask` 简写 | 组合遮罩子属性 | **条件限制**：image / repeat / position / position-x / position-y / size 可生效，origin / clip 不生效，mode 本身不支持 | 展开后逐项检查，不能以简写解析成功作为完整支持依据 |
| `mask-repeat` / `mask-position` 默认行为 | 默认平铺并从初始位置绘制 | **行为不同**：默认不平铺，定位轴记录为 center，见 [默认值](#默认值差异与配置影响) | 显式指定原设计要求的平铺与定位 |

>  注意事项：
>
> 1. `mask-position` 会展开为 position-x / position-y，不能与无效的 origin / clip 混淆；
> 2. `mask-size` 单组语法列出 auto / cover / contain / 长度
> 3. `mask-image` 最多两层，不代表其他 mask 子属性的多组值数量已得到同样验证。

### 滤镜差异

| 属性 / 写法 / 行为 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `filter` / `backdrop-filter` 的 url() | 可引用 SVG filter，依宿主能力生效 | **取值受限**：不支持 url() | 按效果使用受支持单函数或预渲染资源 |
| `filter` / `backdrop-filter` 的 drop-shadow() | 按图像轮廓产生阴影 | **取值受限**：不支持 drop-shadow() | box-shadow 仅适合盒阴影，不保证透明轮廓阴影等效 |
| 多个滤镜函数组合 | 按顺序组合多个效果 | **取值受限**：仅 none 或一个受支持函数 | 需要全部效果时按顺序拆层或改资源；backdrop-filter 拆层还需核对采样区域，不直接丢弃其他效果 |

支持的单函数范围：`blur()`、`brightness()`、`contrast()`、`grayscale()`、`hue-rotate()`、`invert()`、`opacity()`、`saturate()`、`sepia()`。

## 动画与过渡差异

| 属性 / 写法 / 行为 | WebView 表现 | Skyline 差异 | 迁移处理 |
| --- | --- | --- | --- |
| `animation-fill-mode: none/backwards` | 有独立的动画前后填充语义 | **行为不同**：可写但实际表现为 forwards；稳定值为 forwards / both | 显式处理初始与恢复状态，不机械替换后忽略视觉差异 |
| `will-change` | 可声明 scroll-position 或具体属性名 | **取值受限**：仅 auto / contents | 不使用 scroll-position 或自定义标识符；可省略该优化提示 |
| `transition-property` / keyframes 中的属性 | 依属性动画类型进行插值或离散变化 | **取值受限**：仅支持下列属性范围；all 也不会突破该范围 | 将不支持的属性改为状态切换或其他实现 |

> 注意事项：
>
> 1. 伪元素 animation 不生效，改真实节点，见 [伪元素动画实践](skyline-style-practice.md#伪元素不支持的-animation-需替换为真实节点) |
> 2. `animation-name`、`@keyframes` 的普通命名和百分比关键帧不另列为差异。
> 3. `transform` 的 2D / 3D 函数语法已列为支持，但不改变 Skyline 的层叠模型；
> 4. `calc()` 角度仍受 [值类型限制](#长度函数与单位)。

### 可动画属性范围

不以 `border-*` 等通配符推断全部后缀均可用；每项还受静态取值和节点限制。

| 类别 | 支持 transition / animation 的属性 |
| --- | --- |
| 变换与透明度 | `transform`、`transform-origin`、`opacity` |
| 尺寸 | `width`、`height`、`min-width`、`max-width`、`min-height`、`max-height` |
| 间距 | `margin`、`padding` 及各自 top / right / bottom / left 四个长属性 |
| 定位 | `top`、`right`、`bottom`、`left` |
| Flex | `flex`、`flex-grow`、`flex-shrink`、`flex-basis` |
| 边框 | `border`、`border-width`、`border-color`、`border-radius`；四边 border-top/right/bottom/left 简写、各边 width / color；四角 border-top-left/top-right/bottom-left/bottom-right-radius |
| 背景 | `background`、`background-color`、`background-position`、`background-position-x`、`background-position-y`、`background-size` |
| 视觉与层级 | `filter`、`backdrop-filter`、`box-shadow`、`z-index` |
| 文本装饰 | `text-decoration-color` |
| 遮罩 | `mask`、`mask-size`、`mask-position`、`mask-position-x`、`mask-position-y` |

**不支持 transition / animation 的属性：**
- 文本：`text-align`、`text-shadow`、`direction`、`white-space`、`word-break`。
- 字体与颜色：`color`、`font-size`、`font-weight`、`font-style`、`font-family`、`font-feature-settings`、`line-height`、`letter-spacing`、`word-spacing`。
- 其他：`visibility`、`pointer-events`。

> `wx.createAnimation` 等属于宿主 API，其替代方案统一见 [运行时动画方法](skyline-runtime-practice.md#必须-skyline-不支持的动画方法)

## 媒体查询差异

| 写法 | WebView 表现 | Skyline 差异                                    | 迁移处理 |
| --- | --- |-----------------------------------------------| --- |
| `@media screen` | 按媒体条件决定内部规则是否生效 | **行为不同**：其中的样式声明会忽略 `@media screen` 的限制条件直接生效 | 仅非 Skyline 节点添加专用类，并将媒体查询中的选择器限定到该类；Skyline 根据运行时窗口宽度生成对应业务断点的动态类，见 [媒体查询实践](skyline-style-practice.md#media-screen-兼容方案) |
