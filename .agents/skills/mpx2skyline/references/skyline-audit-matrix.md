# Skyline 适配检查矩阵

本矩阵用于把 Skyline 适配从经验扫描收敛为固定门禁。执行适配、排障、Code Review 时，按任务 scope 跑完整矩阵；不要只扫描本次怀疑的问题类型。

## 使用方式

- **指定单个 `.mpx` 组件**：以该文件为 scope 跑完整矩阵。
- **指定页面**：以页面文件、页面 json、app.json、模板实际引用的组件树为 scope 跑完整矩阵；若只处理部分子树，必须说明未覆盖范围。
- **最终输出**：对所有 `error` 命中给出处理结果：已修 / 保留原因 / 非目标平台分支 / 待确认。
- **例外规则**：`.ios.mpx`、RN-only、非 wx 分支、明确 WebView-only 页面可跳过，但要在结果中说明。

## 与其他参考的边界

- 本文件维护可扫描、可枚举的 Skyline 兼容规则。
- 组件事实查 [组件不支持与差异参考](./skyline-component-reference.md)。
- 样式事实查 [样式差异参考](./skyline-style-reference.md)。
- 改造写法查 [布局与样式适配实践](./skyline-layout-practice.md) / [运行时适配实践](./skyline-runtime-practice.md)。
- `SKILL.md` 只维护流程门禁和人工验收项；新增可扫描规则时只改本文件，不要同步复制到 `SKILL.md` checklist。

## 聚合扫描

第一阶段可用以下命令兜底扫描；多行标签、父子结构、平台条件仍需人工或脚本复核。

```bash
rg -n "rendererOptions|defaultDisplayBlock|defaultContentBox|tagNameStyleIsolation|enableScrollViewAutoSize|keyframeStyleIsolation|renderer|componentFramework|disableScroll|navigationStyle|@media screen|font-weight\\s*:?\\s*(500|600|bolder|lighter)|font-style\\s*:?\\s*oblique|@font-face|text-overflow|-webkit-line-clamp|truncate|line-clamp|<image|<rich-text|<special-text|<mpx-icon|min-width\\s*:?\\s*[0-9.]+%|flex\\s*:?\\s*1\\s+0\\s+auto|overflow-x|overflow-y|overflow\\s*:?\\s*(auto|scroll)|display\\s*:?\\s*(grid|flow-root)|position\\s*:?\\s*sticky|float\\s|contain\\s*:?|resize\\s*:?|writing-mode|text-indent|overflow-wrap|justify-items|direction\\s*:?|text-decoration|box-shadow:.*?,|background-(image|position|size|repeat|attachment|origin|clip)|mask-(image|repeat|origin|clip|mode)|filter\\s*:?|backdrop-filter|calc\\([^)]*(deg|rad|turn)|<scroll-view|<navigator|<text|movable-area|movable-view|web-view|editor|progress|navigation-bar|xr-frame|match-media|keyboard-accessory|lazy-load|forceHttps|placeholder-class|safe-password-|snap-to-edge|indicator-class|mask-style|wx-if|wx-for|<include|bind:scroll|bind:transition|bind:animationfinish|on-gesture-event|should-response-on-move|should-accept-gesture|\\.animate\\(|\\.applyAnimation\\(|\\.clearAnimation\\(|\\.setInitialRenderingCache\\(|wx\\.createAnimation|wx\\.createSelectorQuery|\\.node\\(\\)|default\\s*:" <scope> -g '*.mpx' -g '*.json' -g '*.js' -g '*.ts'
```

## 配置规则

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 | 参考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `CONFIG_APP_SKYLINE_OPTIONS` | error | app.json | `rendererOptions` / `defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` / `keyframeStyleIsolation` | 迁移项目需补齐对齐 WebView 的推荐配置；缺失会放大默认布局、盒模型、样式隔离、scroll-view 自适应、keyframes 作用域差异 | app.json 顶层补 `lazyCodeLoading` / `convertRpxToVw`，`rendererOptions.skyline` 下补 5 个推荐项 | 非 Skyline 项目、明确只审单组件且无 app.json scope 时说明未覆盖 | [配置参考](./skyline-configuration.md#rendereroptionsskyline-配置项) |
| `CONFIG_PAGE_SKYLINE` | error | page.json | `renderer` / `componentFramework` / `disableScroll` / `navigationStyle` | Skyline 页面需显式声明渲染后端、glass-easel、禁用页面滚动和自定义导航 | 页面 json 补 `renderer: "skyline"`、`componentFramework: "glass-easel"`、`disableScroll: true`、`navigationStyle: "custom"` | 明确 WebView-only 页面 | [配置参考](./skyline-configuration.md#其他配置项) |
| `CONFIG_WORKLET_BABEL` | warn | script/config | `worklet:` / `'worklet'` / `wx.worklet` | 使用 worklet 时需确认 Babel 插件或开发者工具 worklet 编译配置 | 按需配置 `babel-plugin-worklet` overrides | 未使用 worklet；项目统一构建链已配置时说明 | [Worklet Babel 插件](./skyline-configuration.md#worklet-babel-插件) |

## 模板与组件规则

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 | 参考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `COMP_UNSUPPORTED` | error | template | `web-view\|editor\|movable-area\|movable-view\|progress\|navigation-bar\|xr-frame` | Skyline 不支持或不建议使用这些组件 | 替代组件、独立 WebView 页面或 renderer 降级 | 明确 WebView-only 页面 | [不支持组件](./skyline-component-reference.md#skyline-不支持或不建议使用的组件) |
| `COMP_PENDING_SUPPORT` | warn | template | `match-media\|keyboard-accessory` | 组件支持状态待考虑，不能默认按 Skyline 稳定能力处理 | 改为已记录替代方案，或回源确认后说明 | 已回源确认支持并记录依据 | [不支持组件](./skyline-component-reference.md#skyline-不支持或不建议使用的组件) |
| `COMP_WEBVIEW_ONLY_ATTR` | warn | template | `mode="(top\|bottom\|center\|left\|right\|top left\|top right\|bottom left\|bottom right)"\|lazy-load\|forceHttps\|space=\|decode=\|placeholder-class\|safe-password-\|snap-to-edge` | 命中 WebView-only 属性、取值或行为 | 删除或替换为 Skyline 支持写法；`placeholder-class` 改 `placeholder-style`；图片裁剪模式改稳定取值 | WebView-only 分支 | [WebView-only 属性](./skyline-component-reference.md#webview-only-属性取值与行为) |
| `COMP_IMAGE_SVG` | warn | template/assets | `<image[\s\S]*(\\.svg\|image/svg\|mode="scaleToFill")\|<svg[\s\S]*(<style\|%\|rgba\\()` | SVG 在 Skyline 下存在 `<style>`、百分比、rgba、`scaleToFill` 两端表现差异 | SVG 样式转内联，尺寸/坐标用具体值，透明度拆为 `*-opacity`；`scaleToFill` 需显式 `preserveAspectRatio="none"` 或避免使用 | 已确认 SVG 不含差异点 | [SVG 限制](./skyline-layout-practice.md#svg-在-skyline-下的限制与适配) |
| `COMP_SCROLL_TYPE` | error | template | `<scroll-view` | Skyline 下 `scroll-view` 必须显式声明 `type` | 补 `type="list"` / `nested` / `custom` | 无 | [结构约束](./skyline-component-reference.md#skyline-必填属性与结构约束) |
| `COMP_SCROLL_LIST_DIRECT_CHILD` | warn | template | `<scroll-view[^>]*type="list"` | `type="list"` 的列表项必须是直接子节点；只有一个直接 wrapper 会导致按需渲染退化 | 展平列表项，或确认该 scroll-view 不依赖按需渲染 | 非列表场景说明 | [列表按需渲染](./skyline-runtime-practice.md#列表用-list--custom-模式按需渲染) |
| `COMP_SCROLL_NESTED` | error | template | `<scroll-view[^>]*type="nested"\|associative-container="nested-scroll-view"` | 嵌套滚动需外层 `type="nested"`，内层显式 `type` 并设置 `associative-container` | 改成 `nested-scroll-header` / `nested-scroll-body` 结构；内层补 `type` 和 `associative-container` | 无 | [嵌套滚动](./skyline-runtime-practice.md#嵌套滚动适配) |
| `COMP_SCROLL_HORIZONTAL` | warn | template/style | `scroll-x\|enable-flex\|flex-direction\\s*:?\\s*row` | 横向滚动需同时开启 `enable-flex` 并设置横向布局样式以兼容 WebView | 补 `enable-flex` 与横向布局样式 | 非横向滚动容器 | [高频差异](./skyline-component-reference.md#相对-webview-的高频差异补充) |
| `COMP_SCROLL_REFRESHER_SLOT` | warn | template | `refresher-enabled\|slot="refresher"` | 自定义下拉刷新节点必须声明 `slot="refresher"` | 自定义 refresher 节点补 slot | 使用默认 refresher | [高频差异](./skyline-component-reference.md#相对-webview-的高频差异补充) |
| `COMP_NAVIGATOR_CHILDREN` | error | template | `<navigator[\s\S]*<(view\|image\|swiper\|rich-text\|[^/!][^\\s>]*)` | Skyline 下 `navigator` 只能嵌套 `text` 或纯文本 | 改为只包 `text`；复杂卡片用外层点击事件替代 | 人工确认子节点只有 `text` | [navigator 限制](./skyline-layout-practice.md#navigator-嵌套限制) |
| `COMP_TEXT_CHILDREN` | warn | template | `<text[\s\S]*<(view\|image\|rich-text\|special-text\|span\|[^/!][^\\s>]*)` | Skyline 下 `text` 只能嵌套 `text`；图文混排使用 `span` | 拆结构或改用 `span` 内联混排方案 | 人工确认只嵌套 `text` | [结构约束](./skyline-component-reference.md#skyline-必填属性与结构约束) |
| `COMP_INLINE_MIXED_CONTENT` | warn | template | `mpxTagName@wx="span"\|<image\|<rich-text\|<special-text\|<mpx-icon\|line-clamp\|truncate` | 同一视觉行内图标/图片与文本组件混排时，不能只补省略属性 | 按图文混排方案补 `isSkyline`、`mpxTagName@wx="span"`、`whitespace-nowrap`、图片 `inline-block`、组件 virtual-host `inline-flex`、文本 `max-lines` / `overflow` | 普通独立图片、独立图标按钮、非同段混排 | [图文混排](./skyline-layout-practice.md#图文混排) |
| `COMP_STICKY_STRUCTURE` | warn | template/style | `position\\s*:?\\s*sticky\|sticky-section\|sticky-header` | WebView `position: sticky` 需与 Skyline sticky 组件分支隔离；`sticky-header` 需首子节点且显式背景色 | Skyline 分支使用 `scroll-view` + `sticky-section` / `sticky-header`，WebView 分支保留 CSS sticky | 无吸顶需求或 WebView-only | [sticky 适配](./skyline-layout-practice.md#sticky-吸顶替代方案) |
| `COMP_PICKER_VIEW_INDICATOR` | warn | template | `picker-view[\s\S]*(indicator-class\|mask-style\|indicator-style)` | `indicator-style` 仅支持 `height` / `border` / `background-color`；`indicator-class` / `mask-style` 暂未支持 | 只保留支持的 `indicator-style` 子属性 | 已回源确认 | [高频差异](./skyline-component-reference.md#相对-webview-的高频差异补充) |
| `COMP_SWIPER_LIMIT` | warn | template | `layout-type="(stackLeft\|stackRight\|tinder)"\|indicator-type="(scrollFixedCenter\|swap\|swapYRotation)"\|snap-to-edge\|previous-margin\|display-multiple-items\|vertical` | swiper 部分布局和 indicator 组合与 WebView 不一致 | 按组件差异表调整组合；必要时补 `next-margin > 0` | 已真机验证并说明 | [高频差异](./skyline-component-reference.md#相对-webview-的高频差异补充) |

## 样式与布局规则

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 | 参考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `STYLE_MEDIA_SCREEN` | error | style | `@media screen` | Skyline 下 `@media screen` 条件不按 WebView 响应式语义工作，内部规则可能泄漏 | WebView 保留 `@media`；Skyline 用 `isSkyline && isSmall` 动态类，并在 `@media` 后声明 Skyline 默认类反向兜底 | 非 wx / RN-only | [media 替换](./skyline-layout-practice.md#media-screen-替换方案) |
| `STYLE_SELECTOR_UNSUPPORTED` | warn | style | `(^\|[\\s,{])\\*\\s*[,{]\|\\[[^\\]]+\\]\|::(?!before\|after)` | Skyline 不支持通配选择器、属性选择器和 `::before` / `::after` 以外伪元素 | 模板补 class，样式改类选择器；非支持伪元素改真实节点 | 非 wx 分支 | [选择器支持](./skyline-style-reference.md#选择器支持) |
| `STYLE_TEXT_OVERFLOW` | warn | template/style | `text-overflow\\s*:?\\s*ellipsis\|-webkit-line-clamp\|truncate\|line-clamp` | Skyline 省略需由承载文本组件的 `max-lines` / `overflow` 属性承载，WebView 省略样式仍需保留 | 扫描所有省略节点，补 `max-lines` + `overflow="ellipsis"`；插值压回单行 | 容器只做裁剪且无文本省略语义 | [文本省略](./skyline-layout-practice.md#文本溢出省略适配) |
| `STYLE_FLEX_MIN_WIDTH_PERCENT` | warn | style | `min-width\\s*:?\\s*[0-9.]+%\|flex\\s*:?\\s*1\\s+0\\s+auto` | flex 子节点依赖百分比 `min-width` 撑开或等分时，Skyline 下会按内容收缩 | 以同一 flex 容器链成组处理；按实际基准换算为 `rpx` / `px` | 非 flex 布局或百分比不承担撑开语义 | [flex min-width](./skyline-layout-practice.md#flex-布局的子节点-min-width-百分比撑开失效) |
| `STYLE_FLEX_TEXT_WRAP` | warn | style/template | `display\\s*:?\\s*flex\|flex-direction\\s*:?\\s*column\|align-items\\s*:?\\s*center` | flex 子节点文本可能因未设宽度无法自动换行 | 给承载文本的 flex 子节点显式宽度，如 `width: 100%` | 已有明确宽度 | [flex 文本换行](./skyline-layout-practice.md#flex-布局的子节点文本超出未自动换行) |
| `STYLE_OVERFLOW_AXIS` | error | style | `overflow-x\|overflow-y\|overflow\\s*:?\\s*(auto\|scroll)` | Skyline 不支持单轴 overflow 与 scroll/auto overflow | 改 `scroll-view` 或整体 `overflow: hidden` | 非 wx 分支 | [不支持属性](./skyline-style-reference.md#不支持的属性) |
| `STYLE_LAYOUT_UNSUPPORTED` | warn | style | `display\\s*:?\\s*(grid\|flow-root)\|float\\s\|contain\\s*:\|resize\\s*:\|visibility\\s*:?\\s*collapse\|outline\\s*:\|cursor\\s*:\|justify-items\|column-[a-z-]+` | Skyline 不支持或行为不同 | 使用 Flex / `grid-view` / `-wx-contain` / 真实节点等替代；无等效方案需说明 | 确认无视觉依赖 | [不支持属性](./skyline-style-reference.md#不支持的属性) |
| `STYLE_TEXT_UNSUPPORTED` | warn | style | `direction\\s*:\|text-indent\|overflow-wrap\|writing-mode\|text-decoration-thickness\|list-style-\|white-space\\s*:?\\s*(pre\|pre-wrap\|pre-line)\|word-break\\s*:?\\s*(keep-all\|break-word)\|text-align\\s*:?\\s*(justify-all\|match-parent)\|vertical-align\\s*:?\\s*(text-top\|text-bottom)` | Skyline 文本/列表相关属性不支持或语义不同 | 改支持值、真实节点或组件属性方案 | 确认无视觉依赖 | [文本与字体差异](./skyline-style-reference.md#文本与字体差异) |
| `STYLE_FONT` | warn | style/template/script | `font-weight\\s*:?\\s*(500\|600\|bolder\|lighter)\|font-style\\s*:?\\s*oblique\|@font-face\|format\\(['"]?(woff2?\|otf)` | 部分字体能力与 WebView 不一致，自定义字体 Skyline 至少需 ttf | 字重改 `bold` / `700`；`oblique` 改 `italic`；字体资源补 ttf | 已真机确认 | [字体兼容](./skyline-layout-practice.md#字体-postscript-name-兼容) |
| `STYLE_TEXT_DECORATION` | warn | style/template | `text-decoration(-line)?\\s*:[^;]*(underline\|line-through)[^;]*(underline\|line-through)` | `text-decoration-line` 仅支持单值，且主要作用于 `text` / `input` | 多装饰拆嵌套 `text`，用 renderer 分支隔离 | 单值装饰或 WebView-only | [text-decoration 多值](./skyline-layout-practice.md#text-decoration-line-多值适配) |
| `STYLE_BORDER_RADIUS_BORDER` | warn | style | `border-radius\|border-(top\|right\|bottom\|left)-(color\|style)` | `border-radius` 非 0 时四边边框颜色/样式需一致 | 保持四边一致或拆节点 | 无圆角或四边一致 | [背景边框差异](./skyline-style-reference.md#背景边框与遮罩差异) |
| `STYLE_BACKGROUND_MASK_LIMIT` | warn | style | `background-(image\|position\|repeat\|size\|attachment\|origin\|clip)\|mask-(image\|repeat\|origin\|clip\|mode)\|mask\\s*:` | 背景/遮罩多值和部分子属性受限；`mask-image` 不支持渐变 | 限制到支持范围；多层背景拆节点；遮罩渐变改图片或真实节点 | 单值且已确认支持 | [背景边框差异](./skyline-style-reference.md#背景边框与遮罩差异) |
| `STYLE_FILTER_LIMIT` | warn | style | `(backdrop-)?filter\\s*:[^;]*(url\\(\|drop-shadow\\(\|,[^;]*\\))` | Skyline 不支持 `url()`、`drop-shadow()` 及多 filter 函数组合 | `drop-shadow` 改 `box-shadow`；保留单个支持函数 | 单个支持函数 | [滤镜差异](./skyline-style-reference.md#滤镜差异) |
| `STYLE_BOX_SHADOW_MULTI` | warn | style | `box-shadow\\s*:.*?,` | Skyline 不支持多个 shadow 叠加 | 合并为单 shadow 或拆节点 | 无 | [背景边框差异](./skyline-style-reference.md#背景边框与遮罩差异) |
| `STYLE_CALC_ANGLE` | warn | style | `calc\\([^)]*(deg\|rad\|turn)` | Skyline `calc()` 不支持角度类型 | 直接写静态角度值 | 无 | [值类型支持](./skyline-style-reference.md#长度函数与单位) |
| `STYLE_PSEUDO_ANIMATION` | warn | style | `::(before\|after)[\\s\\S]*animation` | Skyline 下伪元素 animation 不生效 | 改真实节点 + CSS animation | 无动画依赖 | [伪元素 animation](./skyline-layout-practice.md#伪元素不支持的-animation-需替换为真实节点) |
| `STYLE_ANIMATION_FILL_MODE` | warn | style | `animation-fill-mode\\s*:?\\s*(none\|backwards)` | Skyline 下 `none` / `backwards` 实际表现为 `forwards` | 改 `forwards` / `both` 或调整动画逻辑 | 已确认视觉无影响 | [动画差异](./skyline-style-reference.md#动画与过渡差异) |
| `STYLE_ANIMATION_PROPERTY` | warn | style | `transition-property\|animation` | Skyline transition / animation 可动画属性是白名单 | 人工确认只驱动白名单属性；其他改 JS / class 切换 / worklet | 已确认不涉及不支持属性 | [动画差异](./skyline-style-reference.md#动画与过渡差异) |
| `STYLE_Z_INDEX_CONTEXT` | warn | style/template | `z-index\|transform\\s*:\|opacity\\s*:` | Skyline 无层叠上下文，`transform` / `opacity` 不会提升比较层级；`scroll-view` 直接子节点 `z-index` 不生效 | 将需比较层级的节点调整为兄弟节点；fixed 元素按 fixed-context 排序 | 简单同级 z-index 且已验证 | [z-index 适配](./skyline-layout-practice.md#z-index-与层叠适配) |

## 运行时与 glass-easel 规则

| id | level | scope | pattern | 判定 | 标准修复 | 允许例外 | 参考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GLASS_WX_DASH` | warn | template | `wx-if\|wx-for` | glass-easel 不再支持短横线写法，仅支持 `wx:if` / `wx:for` | 改 `wx:if` / `wx:for` | 旧编译链确认兼容时可延后 | [wx-if / wx-for](./skyline-runtime-practice.md#必须-不再支持-wx-if--wx-for仅支持-wxif--wxfor) |
| `GLASS_INCLUDE_IN_FOR` | warn | template | `<include\|wx:for` | `wx:for` 内嵌 `<include>` 时被引入模板中的 `item` / `index` 失效 | 改 `<import>` + `<template>`，显式传 `data` | include 不在循环内 | [include 适配](./skyline-runtime-practice.md#必须-wxfor-内嵌-include-时改为-template) |
| `GLASS_TEMPLATE_ESCAPE` | warn | template | `\\\\\\"\|\\\\'` | 数据绑定外的引号需改 XML 实体；数据绑定内无需反斜杠转义 | 外层属性值用 `&quot;`；绑定表达式内去掉多余转义 | 不是模板属性转义 | [模板转义](./skyline-runtime-practice.md#必须-模板中数据绑定外的转义改为标准-xml-转义) |
| `GLASS_SELECTOR_NUMERIC_ID` | error | template/script | `id=["']?[0-9]\|select\\(['"]#[0-9]` | glass-easel 下数字开头 id 选择器不合法 | id 改为字母前缀，如 `element-1`；SelectorQuery 同步改 | 非选择器用途需说明 | [SelectorQuery](./skyline-runtime-practice.md#必须-selectorquery-选择器不再支持以数字开头) |
| `WORKLET_OLD_EVENT` | warn | template | `on-gesture-event\|should-response-on-move\|should-accept-gesture\|bind:scroll-start\|bind:scroll\|bind:scroll-end\|adjust-deceleration-velocity\|bind:transition\|bind:animationfinish\|on-frame` | Skyline Worklet 事件名已更新 | 改 `worklet:*` 新事件名 | 非 worklet 普通事件需说明 | [Worklet 事件名](./skyline-runtime-practice.md#必须-skyline-worklet-回调函数名称变更) |
| `ANIMATION_WEBVIEW_API` | error | script/template | `\\.animate\\(\|\\.applyAnimation\\(\|\\.clearAnimation\\(\|\\.setInitialRenderingCache\\(\|wx\\.createAnimation` | Skyline 不支持这些动画 API 或静默不生效 | CSS transition / animation 或 Worklet；Skyline-only 逻辑需 renderer 隔离 | WebView-only 分支 | [实例方法](./skyline-runtime-practice.md#必须-skyline-不支持的组件实例方法) |
| `SCROLL_CONTEXT_ENHANCED` | warn | template/script | `\\.node\\(\\)[\\s\\S]*scrollTo\|ScrollViewContext\|<scroll-view` | 通过 `NodesRef.node()` 获取 `ScrollViewContext` 时，`scroll-view` 必须开启 `enhanced` | 对目标 `scroll-view` 补 `enhanced="true"` | 不获取 ScrollViewContext | [ScrollViewContext](./skyline-runtime-practice.md#scrollviewcontext必须开启-enhanced-属性) |
| `SELECTOR_QUERY_SCOPE` | warn | script | `wx\\.createSelectorQuery` | glass-easel 下推荐使用 `this.createSelectorQuery` | 改 `this.createSelectorQuery()` | 跨页面或非组件实例上下文需说明 | [SelectorQuery 推荐](./skyline-runtime-practice.md#推荐-用-thiscreateselectorquery-替代-wxcreateselectorquery) |
| `PROPS_DEFAULT_FIELD` | warn | script | `properties[\\s\\S]*default\\s*:` | glass-easel properties 默认值需使用 `value` 字段 | `default` 改 `value` | 非组件 properties 配置 | [properties 默认值](./skyline-runtime-practice.md#properties-默认值必须使用-value-而非-default) |
| `WX_FOR_COMPUTED_INIT` | warn | template/script | `wx:for=.*\\{\\{[^}]+\\}\\}\|computed\\s*:` | `wx:for` 绑定 computed 时初始化阶段可能收到 `undefined` | 通过 `initData` 提供数组 / 对象初始值 | 已有稳定初始值 | [for-list 报错](./skyline-runtime-practice.md#the-for-list-data-is-neither-array-nor-object-报错) |
| `PROPS_TYPE_CHECK` | warn | script | `properties[\\s\\S]*type\\s*:\\s*(Object\|Array\|String\|Number\|Boolean)` | glass-easel 会校验 properties type，传入值不匹配会报错 | 用 `optionalTypes` 补充类型、提供正确 `value`，或必要时 `type: null` | 已确认传参类型稳定 | [properties type](./skyline-runtime-practice.md#properties-type-校验报错) |
| `WXS_CROSS_PACKAGE` | warn | template/script | `\\.wxs\|wxs` | glass-easel 分包使用主包 wxs 时可能触发跨包引用错误 | 主包任一 glass-easel 页面/组件引用该 wxs，或按项目结构调整 | 无分包 / 无主包 wxs 复用 | [wxs 跨包](./skyline-runtime-practice.md#wxs-跨包引用错误typeerror-rwxsstringify4ccc0480-is-not-a-function) |
| `PERF_CACHE_EXTENT` | info | template | `cache-extent` | `cache-extent` 是内存换流畅，过大可能拖慢首屏 | 仅在真机出现白屏 / 掉帧时按需加，首屏敏感页谨慎调大 | 已有真机性能数据 | [cache-extent](./skyline-runtime-practice.md#cache-extent-预渲染按需启用) |
| `PERF_PRELOAD_SKYLINE` | info | script | `preloadSkylineView` | 前置页预加载可降低首次进入 Skyline 页冷启动 | 放在前置页 `onShow` 延迟调用 | 无前置跳转链路 | [预加载 Skyline](./skyline-runtime-practice.md#预加载-skyline-环境) |

## 复核要求

1. `rg` 命中只是候选项，必须结合 SFC 区块、平台条件、运行时 renderer 分支判断。
2. 多行 `<scroll-view>`、`<navigator>`、`<text>`、`sticky-section` 不能只靠单行 pattern 判定，需读取完整标签和直接子节点。
3. 保留 `@media screen` 时必须说明 WebView 路径仍需要它；Skyline 路径必须有动态类兜底。
4. 最终结果中 `error` 不允许无说明残留；`warn` 必须处理或说明为什么不影响当前 scope。
5. `COMP_INLINE_MIXED_CONTENT` 不能只按 `STYLE_TEXT_OVERFLOW` 处理；命中 `truncate` 且同一行附近存在 `image` / icon / `rich-text` / `special-text` 时，必须进一步套用图文混排规则或说明为什么不是同段混排。
6. `CONFIG_*` 规则需要同时检查 app.json、page.json 和构建配置；只审 `.mpx` 文件时要明确配置未覆盖。
7. 矩阵未收录的组件、属性、事件不能反推为支持；需回到对应 reference 或官方来源确认。
