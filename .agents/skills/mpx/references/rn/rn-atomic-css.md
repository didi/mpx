# RN 原子 CSS 差异

原子类属于 Mpx 基准能力，接入配置、模板绑定、动态类名、directives 与分组语法先读 [原子 CSS 基准](../base/atomic-css.md)。本文仅补充输出 RN 时的支持边界与迁移约束。

使用原子类时，以本文档与 [Mpx2RN 样式支持范围](./rn-style-reference.md)为准，不要仅根据 UnoCSS、Tailwind CSS 或 RN 原生样式文档判断。使用不支持的工具类或 variant 会导致编译报错。

## 目录

- [接入配置](#接入配置)
- [工具类](#工具类)
  - [颜色透明度约束](#颜色透明度约束)
- [Variants](#variants)
  - [支持](#支持)
  - [不支持](#不支持)
- [Directives](#directives)
- [Variant Groups](#variant-groups)
- [编译诊断与排查](#编译诊断与排查)
  - [使用了不支持的工具类](#使用了不支持的工具类)
  - [自定义 rule 生成失败](#自定义-rule-生成失败)
  - [类名存在但无样式](#类名存在但无样式)
- [检查清单](#检查清单)

## 接入配置

沿用 [基准接入配置](../base/atomic-css.md#接入配置)，并使用包含 RN 原子 CSS 能力的兼容版本。业务配置使用 `presetMpx()`，不直接引用 `preset-rn`。

任意值也必须符合 [RN 样式能力](./rn-style-reference.md)；UnoCSS 可识别不代表 Mpx2RN 可编译。

## 工具类

以下表格用于快速筛查。涉及具体属性和值时，继续对照 [跨端输出 RN 样式能力参考](./rn-style-reference.md)；两者均支持才可使用。

| 分类 | 支持情况 | 关键边界 |
| --- | --- | --- |
| Typography | 部分支持 | 支持常用字体、字号、字重、行高、字间距、文本对齐/颜色/装饰/阴影/转换；不支持 `white-space`、word break、text indent、text stroke、font variant numeric 等 |
| Flexbox | 支持 | 支持 `flex`、direction、wrap、basis、grow、shrink 及常用 align/justify；不支持 `inline-flex`，部分 justify/place/item/self 规则不支持 |
| Position / sizing | 部分支持 | 支持 `relative`、`absolute`、top/right/bottom/left、z-index、宽高及 min/max；Box Sizing 支持 `box-border`、`box-content`；不支持 `sticky`、float、clear、isolation |
| Spacing / gap | 部分支持 | 支持 margin、padding 与 flex gap；不支持 `space-x-*` / `space-y-*`、grid gap |
| Background / gradient | 部分支持 | 支持颜色、透明度、position、size、image、linear gradient；repeat 仅支持 `no-repeat`，不支持 attachment、clip、origin、blend mode |
| Border / outline | 部分支持 | 支持常用圆角、宽度、颜色、透明度、style 与 outline；不支持 logical border、`double`、`hidden` 等值 |
| Shadow / opacity | 支持 | 支持 box shadow、shadow color 与 opacity；颜色 alpha 写法遵循下文约束 |
| Transform | 支持 | 支持 origin、rotate、scale、skew、translate、perspective |
| Transition | 部分支持 | 支持单属性及逗号分隔的多属性 transition，以及对应的 duration、timing function、delay；每个属性都必须处于 Mpx2RN transition 支持范围内；RN preset 会屏蔽 `transition`、`transition-\d+`、`transition-all`、`transition-all-\d+` |
| Filter | 有条件支持 | 依赖 RN 0.76+，并存在机型兼容性差异；上线前必须覆盖目标 RN 版本和设备验证 |
| Overflow | 部分支持 | 仅使用 `hidden`、`scroll`、`visible` |
| Display | 部分支持 | 支持 `hidden`；不要使用 `block`、`inline`、`inline-block`、`contents` 等 Web display 工具类 |
| Interactivity | 少量支持 | pointer events 仅 `auto` / `none`，user select 支持 `none` / `auto` / `all` / `text`；其余多数规则不支持 |

以下类别默认不要使用：

- Grid、columns、container、table、divide、ring、line-clamp
- animation、view-transition
- SVG utilities、screen reader utilities
- backdrop filter、mix/background blend mode
- placeholder、list style、overscroll、scroll behavior、touch action、cursor、caret、resize、will-change

不要用多个原子类拼接出 RN 不支持的 CSS。原子类只简化书写，不会扩展 Mpx2RN 的样式能力上限。

### 颜色透明度约束

颜色透明度统一使用斜杠 alpha 语法，不要组合颜色工具类与独立 opacity 工具类：

| 不要使用 | 使用斜杠 alpha 语法 |
| --- | --- |
| `bg-red-500 bg-opacity-50` | `bg-red-500/50` |
| `text-blue-600 text-opacity-30` | `text-blue-600/30` |
| `border-gray-300 border-opacity-50` | `border-gray-300/50` |
| `shadow-black shadow-opacity-20` | `shadow-black/20` |

斜杠 alpha 语法在 Web 与 RN 端一致，也是跨端项目的统一写法。

## Variants

### 支持

- 屏幕断点：`sm:`、`md:`、`lg:`、`xl:`、`2xl:`，以及 `<sm:`、`@sm:` 等对应形式。
- 主题：`dark:`、`light:`。
- 方向：`portrait:`、`landscape:`。
- important：`!utility` / `important:`；仅在普通原子类无法满足覆盖需求时使用。

### 不支持

不要使用会生成复合选择器、父子关系或 RN 无法表达状态的 variants，例如：

- `hover:`、`active:`、`focus:`、`visited:` 等会生成 pseudo selector 的交互 variant
- child / sibling / combinator variants
- aria / data attribute variants
- container query、supports、scope、CSS layer variants
- placeholder、motion、contrast、space/divide 等 variants

这些交互伪类 variant 会产生编译错误，不会降级为普通工具类。其中 `hover:` 不会自动转换为组件 `hover-style`。需要按下态时，仅可在 Mpx 内建的 `view`、`button`、`navigator` 和 `cover-view` 组件上使用 `hover-class` 指向普通原子类：

```html
<view class="bg-white" hover-class="bg-blue-500/10"></view>
```

## Directives

按 [基准 Directives 配置](../base/atomic-css.md#directives)开启 `transformCSS` 后，还需满足以下 RN 边界。

Mpx2RN 已确认支持以下形式：

| 写法 | 支持情况 | RN 边界 |
| --- | --- | --- |
| `@apply ...` | 支持 | 其中的 utility 必须在 Mpx2RN 支持范围内 |
| `--at-apply`、`--uno-apply`、`--uno` | 支持 | 与 `@apply` 相同；值包含 `:` 时使用引号包裹完整值 |
| `@screen <breakpoint>` | 支持 | 仅使用 `min-width` / `max-width`、`and` 与 `px` 单位媒体查询 |
| `theme('path')` | 支持 | 解析出的属性值必须处于 Mpx2RN 支持值域内 |

使用 directives 时注意：

- `@apply` 中使用的 variants 仍以本文档的 [Variants](#variants)为准。
- 自定义 `theme.breakpoints` 应使用 `px`；`@screen` 不支持其他媒体特性。
- 不要使用 `@layer` 等非 `@media` 的 at-rule。
- `icon()` 依赖额外 preset 与背景图产物，当前未纳入 Mpx2RN 原子 CSS 的保证范围。

## Variant Groups

按 [基准 Variant Groups 配置](../base/atomic-css.md#variant-groups)开启 `transformGroups`。分组展开后的每个 utility 与 variant 都必须处于本文支持范围内，分组不会扩大 RN 样式能力。

## 编译诊断与排查

### 使用了不支持的工具类

典型错误包含：

```text
[Mpx Unocss]: all those '...' class utilities is not supported in react native mode
```

处理方式：

1. 在本参考的支持范围中确认所属类别。
2. 用受支持的 Flex、spacing、颜色、transform 等工具类重写。
3. 若无法等效实现，使用模板或文件级条件编译为 RN 与原平台分别提供实现。

不要通过自定义 rule 强制放开不支持的工具类，应改用本文档列出的支持写法。

### 自定义 rule 生成失败

自定义 UnoCSS rule 还需满足：

- 只生成 Mpx2RN 支持的 CSS 属性和值。
- 选择器最终为单类选择器，不包含伪类或伪元素。
- at-rule 仅使用 Mpx2RN 可转换的 `@media`。
- 不生成依赖 DOM 层级、伪元素或 Web 布局模型的 CSS。

所有来源生成的最终 pseudo selector 都会触发 `Only single class selector is supported` 编译错误。出现该错误、`Only @media rule is supported` 或 `[Mpx style error]` 时，按生成后的 CSS 定位，不要只检查模板 className。

### 类名存在但无样式

依次检查：

1. 工具类或 variant 是否在 RN 支持范围内。
2. 是否使用了独立的 `*-opacity-*` 颜色透明度类。
3. 是否被组件局部样式覆盖。
4. 自定义 rule 是否生成了 RN 不支持的属性、值、选择器或 at-rule。

## 检查清单

- [ ] 已完成基准接入，使用包含 RN 原子 CSS 能力的兼容版本。
- [ ] variant group 展开后的所有 utility 与 variant 均在 RN 支持范围内。
- [ ] directives 中只使用 RN 支持的 utility、属性、值、选择器和媒体查询。
- [ ] 所有工具类及其对应的 CSS 均在 RN 支持范围内。
- [ ] 仅使用 RN 支持的 variants，未使用 `hover:`、`active:`、`focus:` 等交互伪类 variant；按下态仅在 `view`、`button`、`navigator` 和 `cover-view` 上使用 `hover-class` 指向普通原子类。
- [ ] 颜色透明度使用 `color/alpha`，未使用独立 `*-opacity-*` 组合。
- [ ] filter 已按目标 RN 版本与设备验证。
- [ ] 构建中不存在 `[Mpx Unocss]`、`[Mpx style error]` 或相关 warning。
