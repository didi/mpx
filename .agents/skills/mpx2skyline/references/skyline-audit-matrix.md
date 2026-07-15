# Skyline 适配检查矩阵

本矩阵用于把 Skyline 适配从经验扫描收敛为固定门禁。执行适配、排障、Code Review 时，按任务 scope 跑完整矩阵；不要只扫描本次怀疑的问题类型。

## 目录

- [使用方式](#使用方式)
- [与其他参考的边界](#与其他参考的边界)
- [聚合扫描](#聚合扫描)
- [配置规则](#配置规则)
- [模板与组件规则](#模板与组件规则)
- [样式与布局规则](#样式与布局规则)
- [运行时规则](#运行时规则)
- [复核要求](#复核要求)

## 使用方式

- **指定单个 `.mpx` 组件**：以该文件为 scope 跑完整矩阵。
- **指定页面**：先确认本次页面适配范围；按确认范围纳入页面文件、页面 JSON、app.json、模板实际引用的组件树执行矩阵；若只覆盖部分子树，必须说明未覆盖范围。
- **最终输出**：对所有 `error` 命中给出处理结果：已修 / 保留原因 / 非目标平台分支 / 待确认。
- **例外规则**：`.ios.mpx`、RN-only、非 wx 分支、明确 WebView-only 页面可跳过，但要在结果中说明。

## 与其他参考的边界

- 本文件维护可扫描、可枚举的 Skyline 兼容规则。
- 组件事实查 [组件不支持与差异参考](./skyline-component-reference.md)。
- 样式事实查 [样式差异参考](./skyline-style-reference.md)。
- 运行时与性能事实查 [运行时适配实践](./skyline-runtime-practice.md)。
- 布局、样式与模板结构改造写法查 [布局与样式适配实践](./skyline-layout-practice.md)。
- `SKILL.md` 只维护流程门禁和人工验收项；新增可扫描规则时只改本文件，不要同步复制到 `SKILL.md` checklist。

## 聚合扫描

第一阶段可用以下命令兜底扫描；`-U` 仅用于允许读取多行内容，聚合表达式仍只负责召回候选。矩阵中包含 `[\s\S]*` 的 pattern 是结构关系描述，不应直接作为单条 `rg` 结论；多行标签、父子结构、平台条件仍需人工读取完整节点，或交由语法解析脚本复核。

```bash
rg -n -U "lazyCodeLoading|rendererOptions|defaultDisplayBlock|defaultContentBox|tagNameStyleIsolation|enableScrollViewAutoSize|keyframeStyleIsolation|renderer|componentFramework|disableScroll|navigationStyle|@media screen|font-family\\s*:?\\s*[^;]+-(Medium|Semibold|Bold)|font-weight\\s*:?\\s*(500|600|bolder|lighter)|font-style\\s*:?\\s*oblique|@font-face|text-overflow|-webkit-line-clamp|truncate|line-clamp|<image|<rich-text|<special-text|<mpx-icon|min-width\\s*:?\\s*[0-9.]+%|flex\\s*:?\\s*1\\s+0\\s+auto|overflow-x|overflow-y|overflow\\s*:?\\s*(auto|scroll)|display\\s*:?\\s*(grid|flow-root)|position\\s*:?\\s*sticky|float\\s|contain\\s*:?|resize\\s*:?|writing-mode|text-indent|overflow-wrap|justify-items|direction\\s*:?|text-decoration|box-shadow\\s*:?|background-(image|position|size|repeat|attachment|origin|clip)|mask-(image|repeat|origin|clip|mode)|filter\\s*:?|backdrop-filter|calc\\([^)]*(deg|rad|turn)|<scroll-view|<navigator|<text|movable-area|movable-view|web-view|editor|progress|navigation-bar|xr-frame|match-media|keyboard-accessory|lazy-load|forceHttps|placeholder-class|safe-password-|snap-to-edge|indicator-class|mask-style|wx-if|wx-for|<include|\\.animate\\(|\\.applyAnimation\\(|\\.clearAnimation\\(|\\.setInitialRenderingCache\\(|wx\\.createAnimation|wx\\.createSelectorQuery|\\.node\\(\\)|default\\s*:" <scope> -g '*.mpx' -g '*.json' -g '*.js' -g '*.ts'
```

## 配置规则

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 | 参考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `CONFIG_APP_SKYLINE_OPTIONS` | error | app.json | `lazyCodeLoading` / `rendererOptions` / `defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` / `keyframeStyleIsolation` | 迁移项目需补齐对齐 WebView 的推荐配置；缺失会放大默认布局、盒模型、样式隔离、scroll-view 自适应、keyframes 作用域差异 | app.json 顶层补 `lazyCodeLoading`，`rendererOptions.skyline` 下补 5 个推荐项 | 非 Skyline 项目、明确只审单组件且无 app.json scope 时说明未覆盖 | [rendererOptions.skyline](./skyline-configuration.md#rendereroptionsskyline-配置项)、[app.json 顶层配置](./skyline-configuration.md#appjson-顶层配置) |
| `CONFIG_PAGE_SKYLINE` | error | page.json | `renderer` / `componentFramework` / `disableScroll` / `navigationStyle` | Skyline 页面需显式声明渲染后端、glass-easel、禁用页面滚动和自定义导航 | 页面 JSON 补 `renderer: "skyline"`、`componentFramework: "glass-easel"`、`disableScroll: true`、`navigationStyle: "custom"` | 明确 WebView-only 页面 | [配置参考](./skyline-configuration.md#适配参考) |
| `CONFIG_WORKLET_BABEL` | warn | script/config | `worklet:` / `'worklet'` / `wx.worklet` | 使用 Worklet 时需确认 Babel 插件或开发者工具 Worklet 编译配置 | 按需配置 `babel-plugin-worklet` overrides | 未使用 Worklet；项目统一构建链已配置时说明 | [Worklet Babel 插件](./skyline-configuration.md#worklet-babel-插件) |

## 模板与组件规则

| id | level | scope | pattern | 判定 | 标准修复                                                                                                                                       | 允许例外 | 参考 |
| --- | --- | --- | --- | --- |--------------------------------------------------------------------------------------------------------------------------------------------| --- | --- |
| `GLASS_INCLUDE_IN_FOR` | error | template | `<include\|wx:for` | 候选召回；必须读取模板结构，判断 `<include>` 是否位于 `wx:for` 子树中 | 改 `<import>` + `<template>`，显式传 `data` | include 不在循环子树中 | [include 适配](./skyline-layout-practice.md#必须-wxfor-内嵌-include-时改为-template) |
| `GLASS_TEMPLATE_ESCAPE` | error | template | `\\\\\\"\|\\\\'` | 候选召回；必须结合完整模板属性判断转义位于数据绑定内还是绑定外 | 外层属性值用 `&quot;`；绑定表达式内去掉多余转义 | 不是模板属性转义 | [模板转义](./skyline-layout-practice.md#必须-模板中数据绑定外的转义改为标准-xml-转义) |
| `COMP_UNSUPPORTED` | error | template | `web-view\|editor\|movable-area\|movable-view\|progress\|navigation-bar\|xr-frame` | Skyline 不支持或不建议使用这些组件 | 替代组件、独立 WebView 页面或 renderer 降级                                                                                                            | 明确 WebView-only 页面 | [不支持组件](./skyline-component-reference.md#skyline-不支持或不建议使用的组件) |
| `COMP_PENDING_SUPPORT` | warn | template | `match-media\|keyboard-accessory` | 组件支持状态待考虑，不能默认按 Skyline 稳定能力处理 | 改为已记录替代方案，或回源确认后说明                                                                                                                         | 已回源确认支持并记录依据 | [不支持组件](./skyline-component-reference.md#skyline-不支持或不建议使用的组件) |
| `COMP_WEBVIEW_ONLY_ATTR` | warn | template | `mode="(top\|bottom\|center\|left\|right\|top left\|top right\|bottom left\|bottom right)"\|lazy-load\|forceHttps\|space=\|decode=\|placeholder-class\|safe-password-\|snap-to-edge` | 命中 WebView-only 属性、取值或行为 | 替换为 Skyline 支持写法或 renderer 隔离；`placeholder-class` 改 `placeholder-style`；图片裁剪模式改稳定取值                                                        | WebView-only 分支 | [WebView-only 属性](./skyline-component-reference.md#webview-only-属性取值与行为) |
| `COMP_IMAGE_SVG` | warn | template/assets | `<image[\s\S]*(\\.svg\|image/svg\|mode="scaleToFill")\|<svg[\s\S]*(<style\|%\|rgba\\()` | SVG 在 Skyline 下存在 `<style>`、百分比、rgba、`scaleToFill` 两端表现差异 | SVG 样式转内联，尺寸/坐标用具体值，透明度拆为 `*-opacity`；`scaleToFill` 需显式 `preserveAspectRatio="none"` 或避免使用                                                 | 已确认 SVG 不含差异点 | [SVG 限制](./skyline-layout-practice.md#svg-在-skyline-下的限制与适配) |
| `COMP_SCROLL_TYPE` | error | template | `<scroll-view` | Skyline 下 `scroll-view` 必须显式声明 `type` | 补 `type="list"` / `nested` / `custom`                                                                                                      | 无 | [结构约束](./skyline-component-reference.md#skyline-必填属性与结构约束) |
| `COMP_SCROLL_LIST_DIRECT_CHILD` | warn | template | `<scroll-view[^>]*type="list"` | `type="list"` 的列表项必须是直接子节点；只有一个直接 wrapper 会导致按需渲染退化 | 展平列表项，或确认该 scroll-view 不依赖按需渲染                                                                                                             | 非列表场景说明 | [列表按需渲染](./skyline-runtime-practice.md#列表用-list--custom-模式按需渲染) |
| `COMP_SCROLL_NESTED` | error | template | `<scroll-view[^>]*type="nested"\|associative-container="nested-scroll-view"` | 嵌套滚动需外层 `type="nested"`，内层显式 `type` 并设置 `associative-container` | 外层补 `type="nested"`；内层补显式 `type` 和 `associative-container="nested-scroll-view"`                                                   | 无 | [结构约束](./skyline-component-reference.md#skyline-必填属性与结构约束) |
| `COMP_SCROLL_HORIZONTAL` | warn | template/style | `scroll-x\|enable-flex\|flex-direction\\s*:?\\s*row` | 横向滚动需同时开启 `enable-flex` 并设置横向布局样式以兼容 WebView | 补 `enable-flex` 与横向布局样式                                                                                                                    | 非横向滚动容器 | [高频差异](./skyline-component-reference.md#skyline-相对-webview-的高频差异补充) |
| `COMP_SCROLL_REFRESHER_SLOT` | warn | template | `refresher-enabled\|slot="refresher"` | 自定义下拉刷新节点必须声明 `slot="refresher"` | 自定义 refresher 节点补 slot                                                                                                                     | 使用默认 refresher | [高频差异](./skyline-component-reference.md#skyline-相对-webview-的高频差异补充) |
| `COMP_NAVIGATOR_CHILDREN` | error | template | `<navigator[\s\S]*<(view\|image\|swiper\|rich-text\|[^/!][^\\s>]*)` | Skyline 下 `navigator` 只能嵌套 `text` 或纯文本 | 改为只包 `text`；复杂卡片用外层点击事件替代                                                                                                                  | 人工确认子节点只有 `text` | [navigator 限制](./skyline-layout-practice.md#navigator-嵌套限制) |
| `COMP_TEXT_CHILDREN` | warn | template | `<text[\s\S]*<(view\|image\|rich-text\|special-text\|span\|[^/!][^\\s>]*)` | Skyline 下 `text` 只能嵌套 `text`；图文混排使用 `span` | 拆结构或改用 `span` 内联混排方案                                                                                                                       | 人工确认只嵌套 `text` | [结构约束](./skyline-component-reference.md#skyline-必填属性与结构约束) |
| `COMP_INLINE_MIXED_CONTENT` | warn | template | `mpxTagName@wx="span"\|<image\|<rich-text\|<special-text\|<mpx-icon\|line-clamp\|truncate` | 同一视觉行内图标/图片与文本组件混排时，不能只补省略属性 | 按图文混排方案补 `isSkyline`、`mpxTagName@wx="span"`、`whitespace-nowrap`、图片 `inline-block`、组件 virtual-host `inline-flex`、文本 `max-lines` / `overflow` | 普通独立图片、独立图标按钮、非同段混排 | [图文混排](./skyline-layout-practice.md#图文混排) |
| `COMP_STICKY_STRUCTURE` | warn | template/style | `position\\s*:?\\s*sticky\|sticky-section\|sticky-header` | WebView `position: sticky` 需与 Skyline sticky 组件分支隔离；`sticky-header` 需首子节点且显式背景色 | Skyline 分支使用 `scroll-view` + `sticky-section` / `sticky-header`，WebView 分支保留 CSS sticky                                                    | 无吸顶需求或 WebView-only | [sticky 适配](./skyline-layout-practice.md#sticky-吸顶替代方案) |
| `COMP_PICKER_VIEW_INDICATOR` | warn | template | `picker-view[\s\S]*(indicator-class\|mask-style\|indicator-style)` | `indicator-style` 仅支持 `height` / `border` / `background-color`；`indicator-class` / `mask-style` 暂未支持 | 只保留支持的 `indicator-style` 子属性                                                                                                               | 已回源确认 | [高频差异](./skyline-component-reference.md#skyline-相对-webview-的高频差异补充) |
| `COMP_SWIPER_LIMIT` | warn | template | `layout-type="(stackLeft\|stackRight\|tinder)"\|indicator-type="(scrollFixedCenter\|swap\|swapYRotation)"\|snap-to-edge\|previous-margin\|display-multiple-items\|vertical` | swiper 部分布局和 indicator 组合与 WebView 不一致 | 按组件差异表调整组合；必要时补 `next-margin > 0`                                                                                                          | 已真机验证并说明 | [高频差异](./skyline-component-reference.md#skyline-相对-webview-的高频差异补充) |

## 样式与布局规则

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 | 参考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `STYLE_MEDIA_SCREEN` | error | style | `@media screen` | Skyline 下 `@media screen` 条件不按 WebView 响应式语义工作，内部规则可能泄漏 | WebView 保留 `@media`；Skyline 用 `isSkyline && isSmall` 动态类，并在 `@media` 后声明 Skyline 默认类反向兜底 | 非 wx / RN-only | [media 替换](./skyline-layout-practice.md#media-screen-替换方案) |
| `STYLE_SELECTOR_UNSUPPORTED` | warn | style | `(^\|[\\s,{])\\*\\s*[,{]\|\\[[^\\]]+\\]\|::[a-zA-Z-]+` | Skyline 不支持通配选择器、属性选择器和 `::before` / `::after` 以外伪元素；伪元素命中需先排除 `::before` / `::after` | 模板补 class，样式改类选择器；非支持伪元素改真实节点 | 非 wx 分支 | [选择器支持](./skyline-style-reference.md#选择器支持) |
| `STYLE_TEXT_OVERFLOW` | warn | template/style | `text-overflow\\s*:?\\s*ellipsis\|-webkit-line-clamp\|truncate\|line-clamp` | Skyline 省略需由承载文本组件的 `max-lines` / `overflow` 属性承载，WebView 省略样式仍需保留 | 扫描所有省略节点，补 `max-lines` + `overflow="ellipsis"`；插值压回单行 | 容器只做裁剪且无文本省略语义 | [文本省略](./skyline-layout-practice.md#文本溢出省略适配) |
| `STYLE_FLEX_MIN_WIDTH_PERCENT` | warn | style | `min-width\\s*:?\\s*[0-9.]+%\|flex\\s*:?\\s*1\\s+0\\s+auto` | flex 子节点依赖百分比 `min-width` 撑开或等分时，Skyline 下会按内容收缩 | 以同一 flex 容器链成组处理；按实际基准换算为 `rpx` / `px` | 非 flex 布局或百分比不承担撑开语义 | [flex min-width](./skyline-layout-practice.md#flex-布局的子节点-min-width-百分比撑开失效) |
| `STYLE_FLEX_TEXT_WRAP` | warn | style/template | `display\\s*:?\\s*flex\|flex-direction\\s*:?\\s*column\|align-items\\s*:?\\s*center` | flex 子节点文本可能因未设宽度无法自动换行 | 给承载文本的 flex 子节点显式宽度，如 `width: 100%` | 已有明确宽度 | [flex 文本换行](./skyline-layout-practice.md#flex-布局的子节点文本超出未自动换行) |
| `STYLE_OVERFLOW_AXIS` | error | style | `overflow-x\|overflow-y\|overflow\\s*:?\\s*(auto\|scroll)` | Skyline 不支持单轴 overflow 与 scroll/auto overflow | 改 `scroll-view` 或整体 `overflow: hidden` | 非 wx 分支 | [布局差异](./skyline-style-reference.md#布局盒模型与层叠差异) |
| `STYLE_LAYOUT_UNSUPPORTED` | warn | style | `display\\s*:?\\s*(grid\|flow-root)\|float\\s\|contain\\s*:\|resize\\s*:\|visibility\\s*:?\\s*collapse\|outline\\s*:\|cursor\\s*:\|justify-items\|column-[a-z-]+` | Skyline 不支持或行为不同 | 使用 Flex / `grid-view` / `-wx-contain` / 真实节点等替代；无等效方案需说明 | 确认无视觉依赖 | [布局差异](./skyline-style-reference.md#布局盒模型与层叠差异)、[其他不支持能力](./skyline-style-reference.md#其他-skyline-不支持能力及兼容方案) |
| `STYLE_TEXT_UNSUPPORTED` | warn | style | `direction\\s*:\|text-indent\|overflow-wrap\|writing-mode\|text-decoration-thickness\|list-style-\|white-space\\s*:?\\s*(pre\|pre-wrap\|pre-line)\|word-break\\s*:?\\s*(keep-all\|break-word)\|text-align\\s*:?\\s*(justify-all\|match-parent)\|vertical-align\\s*:?\\s*(text-top\|text-bottom)` | Skyline 文本/列表相关属性不支持或语义不同 | 改支持值、真实节点或组件属性方案 | 确认无视觉依赖 | [文本与字体差异](./skyline-style-reference.md#文本与字体差异) |
| `STYLE_FONT_POSTSCRIPT_NAME` | error | style/template/script | `font-family\\s*:?\\s*[^;]+-(Medium\|Semibold\|Bold)` | 自定义字体直接使用加粗 PostScript name 时，部分机型无法正确匹配字重；命中 `xx-Medium` / `xx-Semibold` / `xx-Bold` 时先检查是否存在同名字体族的独立 `@font-face` 定义 | 确认不存在同名字体族的独立 `@font-face` 后，先澄清是否调整字重；确认后改为 `font-family: xx; font-weight: bold`，未确认时保留并说明风险 | 非 wx / RN-only；已通过 `@font-face` 将命中的名称单独定义为 `font-family`；用户未确认字重改动 | [字体兼容](./skyline-layout-practice.md#字体-postscript-name-兼容) |
| `STYLE_FONT` | warn | style/template/script | `font-weight\\s*:?\\s*(500\|600\|bolder\|lighter)\|font-style\\s*:?\\s*oblique` | `font-weight: 500/600` 在部分机型不生效，`bolder` / `lighter` 与 `oblique` 不支持 | 字重命中先澄清是否调整；确认后改为明确的受支持字重，未确认时保留并说明风险；`oblique` 改 `italic` | 用户未确认字重改动；已真机确认当前字重表现 | [字体兼容](./skyline-layout-practice.md#字体-postscript-name-兼容) |
| `STYLE_TEXT_DECORATION` | warn | style/template | `text-decoration(-line)?\\s*:[^;]*(underline\|line-through)[^;]*(underline\|line-through)` | `text-decoration-line` 仅支持单值，且主要作用于 `text` / `input` | 多装饰拆嵌套 `text`，用 renderer 分支隔离 | 单值装饰或 WebView-only | [text-decoration 多值](./skyline-layout-practice.md#text-decoration-line-多值适配) |
| `STYLE_BORDER_RADIUS_BORDER` | warn | style | `border-radius\|border-(top\|right\|bottom\|left)-(color\|style)` | `border-radius` 非 0 时四边边框颜色/样式需一致 | 保持四边一致或拆节点 | 无圆角或四边一致 | [背景边框差异](./skyline-style-reference.md#背景边框与遮罩差异) |
| `STYLE_BACKGROUND_MASK_LIMIT` | warn | style | `background-(image\|position\|repeat\|size\|attachment\|origin\|clip)\|mask-(image\|repeat\|origin\|clip\|mode)\|mask\\s*:` | 背景/遮罩多值和部分子属性受限；`mask-image` 不支持渐变 | 限制到支持范围；多层背景拆节点；遮罩渐变改图片或真实节点 | 单值且已确认支持 | [背景边框差异](./skyline-style-reference.md#背景边框与遮罩差异) |
| `STYLE_FILTER_LIMIT` | warn | style | `(backdrop-)?filter\\s*:` | 候选召回；读取完整声明值，命中 `url()`、`drop-shadow()` 或两个及以上以空格分隔的滤镜函数时不兼容 | `drop-shadow` 改 `box-shadow`；多函数组合只保留单个支持函数，或拆节点实现 | 单个受支持滤镜函数 | [滤镜差异](./skyline-style-reference.md#滤镜差异) |
| `STYLE_BOX_SHADOW_MULTI` | warn | style | `box-shadow\\s*:` | 候选召回；读取完整声明值，仅将函数括号外的顶层逗号判定为多个 shadow，`rgb()` / `rgba()` 等颜色函数内部逗号不算 | 合并为单 shadow 或拆节点 | 单个 shadow，包括使用 `rgb()` / `rgba()` 等颜色函数的写法 | [背景边框差异](./skyline-style-reference.md#背景边框与遮罩差异) |
| `STYLE_CALC_ANGLE` | warn | style | `calc\\([^)]*(deg\|rad\|turn)` | Skyline `calc()` 不支持角度类型 | 直接写静态角度值 | 无 | [值类型支持](./skyline-style-reference.md#长度函数与单位) |
| `STYLE_PSEUDO_ANIMATION` | warn | style | `::(before\|after)[\\s\\S]*animation` | Skyline 下伪元素 animation 不生效 | 改真实节点 + CSS animation | 无动画依赖 | [伪元素 animation](./skyline-layout-practice.md#伪元素不支持的-animation-需替换为真实节点) |
| `STYLE_ANIMATION_FILL_MODE` | warn | style | `animation-fill-mode\\s*:?\\s*(none\|backwards)` | Skyline 下 `none` / `backwards` 实际表现为 `forwards` | 改 `forwards` / `both` 或调整动画逻辑 | 已确认视觉无影响 | [动画差异](./skyline-style-reference.md#动画与过渡差异) |
| `STYLE_ANIMATION_PROPERTY` | warn | style | `transition-property\|animation` | Skyline transition / animation 可动画属性是白名单 | 人工确认只驱动白名单属性；其他改 JS / class 切换 / Worklet | 已确认不涉及不支持属性 | [动画差异](./skyline-style-reference.md#动画与过渡差异) |
| `STYLE_Z_INDEX_CONTEXT` | warn | style/template | `z-index\|transform\\s*:\|opacity\\s*:` | Skyline 无层叠上下文，`transform` / `opacity` 不会提升比较层级；`scroll-view` 直接子节点 `z-index` 不生效 | 将需比较层级的节点调整为兄弟节点；fixed 元素按 fixed-context 排序 | 简单同级 z-index 且已验证 | [z-index 适配](./skyline-layout-practice.md#z-index-与层叠适配) |

## 运行时规则

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 | 参考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GLASS_SELECTOR_NUMERIC_ID` | error | template/script | `id=["']?[0-9]\|select\\(['"]#[0-9]` | glass-easel 下数字开头 id 选择器不合法 | id 改为字母前缀，如 `element-1`；SelectorQuery 同步改 | 非选择器用途需说明 | [SelectorQuery](./skyline-runtime-practice.md#必须-selectorquery-选择器不再支持以数字开头) |
| `ANIMATION_WEBVIEW_API` | error | script/template | `\\.animate\\(\|\\.applyAnimation\\(\|\\.clearAnimation\\(\|\\.setInitialRenderingCache\\(\|wx\\.createAnimation` | Skyline 不支持这些动画 API 或静默不生效 | CSS transition / animation 或 Worklet；Skyline-only 逻辑需 renderer 隔离 | WebView-only 分支 | [实例方法](./skyline-runtime-practice.md#必须-skyline-不支持的组件实例方法)、[wx.createAnimation](./skyline-layout-practice.md#animation-api-不支持--使用-css-transition) |
| `SCROLL_CONTEXT_ENHANCED` | error | template/script | `\\.node\\(\\)\|ScrollViewContext\|<scroll-view` | 候选召回；必须建立 `select('#id').node()` 与对应 `scroll-view` 的关联，并检查目标标签是否开启 `enhanced` | 对目标 `scroll-view` 补 `enhanced="true"` | `.node()` 不用于获取 ScrollViewContext | [ScrollViewContext](./skyline-runtime-practice.md#必须-scrollviewcontext开启-enhanced-属性) |
| `SELECTOR_QUERY_SCOPE` | warn | script | `wx\\.createSelectorQuery` | glass-easel 下推荐使用 `this.createSelectorQuery` | 改 `this.createSelectorQuery()` | 跨页面或非组件实例上下文需说明 | [SelectorQuery 推荐](./skyline-runtime-practice.md#推荐-用-thiscreateselectorquery-替代-wxcreateselectorquery) |
| `PROPS_DEFAULT_FIELD` | error | script | `properties[\\s\\S]*default\\s*:` | 候选召回；必须逐个读取 properties descriptor，确认 `default` 是否属于属性默认值 | `default` 改 `value` | 命中位于 properties 对象外 | [properties 默认值](./skyline-runtime-practice.md#必须-properties-默认值使用-value-而非-default) |
| `WX_FOR_DATA_TYPE` | warn | template/script | `wx:for=.*\\{\\{[^}]+\\}\\}` | 追踪每个 `wx:for` 数据源的默认值、赋值和 computed 返回路径；任意阶段都必须稳定返回 Array/Object | 补正确默认值；computed/异步路径返回 `[]` 或 `{}`；初始化时可同时使用 `initData` | 所有数据路径已确认类型稳定 | [for-list 报错](./skyline-runtime-practice.md#必须-确保-wxfor-数据始终为-array-或-object) |
| `PROPS_UNION_TYPE` | error | script | `type\\s*:\\s*\\[[^\\]]+\\]` | `type: [...]` 联合类型声明不合法 | 选择主 `type`，其余类型放入 `optionalTypes`；类型确实不可知时才用 `type: null` | 命中不位于 properties descriptor 内时说明 | [properties type](./skyline-runtime-practice.md#必须-properties-声明类型与实际值保持一致) |

## 复核要求

1. `rg` 命中只是候选项，必须结合 SFC 区块、平台条件、运行时 renderer 分支判断。
2. 多行 `<scroll-view>`、`<navigator>`、`<text>`、`sticky-section` 不能只靠单行 pattern 判定，需读取完整标签和直接子节点。
3. `SCROLL_CONTEXT_ENHANCED` 必须把 `select('#id').node()` 关联到对应 `scroll-view`；不能因文件内存在其他已开启 `enhanced` 的滚动容器而放行。
4. `GLASS_INCLUDE_IN_FOR` 必须检查祖先关系；`GLASS_TEMPLATE_ESCAPE` 必须按完整属性区分数据绑定内外，聚合扫描结果不能直接作为最终结论。
5. 保留 `@media screen` 时必须说明 WebView 路径仍需要它；Skyline 路径必须有动态类兜底。
6. 最终结果中 `error` 不允许无说明残留；`warn` 必须处理或说明为什么不影响当前 scope。
7. `COMP_INLINE_MIXED_CONTENT` 不能只按 `STYLE_TEXT_OVERFLOW` 处理；命中 `truncate` 且同一行附近存在 `image` / icon / `rich-text` / `special-text` 时，必须进一步套用图文混排规则或说明为什么不是同段混排。
8. `CONFIG_*` 规则需要同时检查 app.json、page.json 和构建配置；只审 `.mpx` 文件时要明确配置未覆盖。
9. 矩阵未收录的组件、属性、事件不能反推为支持；需回到对应 reference 或官方来源确认。
10. properties 类型一致性属于人工复核项：逐项核对声明 `type`、默认值与调用侧实际传值；正常的 `Object` / `Array` / `String` / `Number` / `Boolean` 声明不作为扫描命中，只有 `type: [...]` 由 `PROPS_UNION_TYPE` 直接报错。
