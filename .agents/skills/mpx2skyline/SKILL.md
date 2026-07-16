---
name: mpx2skyline
description: |
  基于 Mpx 开发实现的微信小程序 WebView 适配 Skyline 渲染引擎指南，覆盖布局、样式、组件、配置四大维度。
  当用户要求对已有微信小程序页面或组件进行 Skyline 适配、创建符合 Skyline 兼容规范的页面或组件、
  排查 Skyline 下样式不生效/组件不渲染/布局异常/层级错乱等问题、或查询某项能力在
  Skyline 下的支持情况时强制调用。当用户问题不涉及 Skyline 适配时不应调用，如
  Mpx 输出 RN 问题、支付宝小程序问题、纯微信原生小程序、纯 WebView 小程序开发问题等。
metadata:
  version: "1.0.1"
---

# Mpx 输出 Skyline 渲染引擎的开发&适配指南

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。

Skyline 是微信小程序新一代渲染引擎，旨在替代 WebView 渲染以获得更接近原生的性能和体验。与 WebView 模式相比，Skyline 在布局模型、层叠机制、样式能力、组件支持、页面行为上存在系统性差异。

### 适用场景

本 SKILL 是 Mpx WebView 适配 Skyline 渲染引擎的统一指南，覆盖布局、样式、组件、配置四大维度。涉及 Mpx Skyline 适配的任务均应在动笔前阅读本 SKILL 的[通用约束与适配原则](#通用约束与适配原则)，包括但不限于：

- **技术方案设计**：评估需求在 Skyline 下的可行性、跨渲染模式（WebView 与 Skyline）兼容方案选型、是否需要通过 `this.renderer === 'skyline'` 进行运行时模式隔离等；
- **WebView 页面 Skyline 适配改造**：对已基于 WebView 模式编写、未适配 Skyline 的存量页面进行兼容性补齐（参见下文[任务一](#任务一对已有-webview-页面或组件进行-skyline-适配改造)）；
- **页面 / 组件开发迭代**：从零编写或迭代符合 WebView 与 Skyline 双模式兼容规范的 `.mpx` 页面与组件（参见下文[任务二](#任务二创建符合-skyline-兼容规范的页面或组件)）；
- **运行时报错与异常排查**：定位 Skyline 下样式不生效（如不支持选择器/属性静默失效）、组件不渲染（如 `scroll-view` 缺失 `type`）、布局异常（如默认 `display: flex` / `border-box` 引发的差异）、层级错乱（z-index 无层叠上下文）、模板转义、SelectorQuery 数字开头等问题；
- **能力查询**：查询基础组件、属性、样式、API、滚动 API 在 Skyline 下的支持情况、版本要求与 WebView 差异；涉及 Worklet 动画、手势系统、自定义路由、共享元素时，本 SKILL 仅判断 Mpx 双模式接入边界，具体能力回源[微信官方 Skyline Skills](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills)；
- **Code Review**：以本 SKILL 的[通用约束与适配原则](#通用约束与适配原则)为标准对照检查 Skyline 兼容性与跨渲染模式兼容性。

### 不适用场景

以下场景与 Mpx Skyline 适配无关，**不应调用**本 SKILL：

- 仅面向微信小程序 WebView 的开发和适配问题（不涉及 Skyline 适配，无需 Skyline 兼容性约束）；
- 支付宝、百度、抖音等其他小程序平台的开发问题（Skyline 是微信小程序专属渲染引擎，不适用于其他厂商）；
- Skyline only 项目的开发问题（本 SKILL 强调 Mpx 框架下 WebView 与 Skyline 双模式兼容，纯 Skyline 项目应直接参考 [微信官方 Skyline Skills](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills)）；
- Mpx 跨端输出 RN（Mpx2RN / Mpx2DRN）相关问题；
- Mpx 跨端输出 Web（Mpx2Web）相关问题；
- 不经 Mpx 框架编译的纯微信原生小程序开发问题。

## 知识库索引

| 知识库 | 说明                                                                                     |
| --- |----------------------------------------------------------------------------------------|
| [Skyline 组件不支持与差异参考](./references/skyline-component-reference.md) | 查询 WebView 迁移 Skyline 时的组件差异，覆盖不支持组件、WebView-only 属性/取值、必填属性、结构约束与高频行为差异；不是完整组件手册，未收录能力需回源确认 |
| [Skyline 与 Web/W3C CSS 标准差异参考](./references/skyline-style-reference.md) | 查询 Skyline 样式与 Web/W3C CSS 标准不一致的部分，覆盖默认值、选择器、值类型、布局层叠、文本、背景遮罩、滤镜、动画等差异                |
| [Skyline 布局与样式适配实践](./references/skyline-layout-practice.md) | 进行视图层适配改造时读取，覆盖布局/层叠、页面滚动、图文混排、sticky、文本省略、flex、媒体查询与 SVG 展示限制等改造方案                    |
| [Skyline 运行时适配实践](./references/skyline-runtime-practice.md) | 进行运行时常见问题或者性能相关问题时读取，覆盖渲染模式判断、SelectorQuery、组件实例方法、Scroll API、常见报错与性能优化等               |
| [Skyline 配置项与接入规范参考](./references/skyline-configuration.md) | 接入项目级与页面级配置时读取；按需点查 app.json 顶层配置、rendererOptions.skyline、页面配置示例与 Worklet Babel 插件配置   |
| [Skyline 适配检查矩阵](./references/skyline-audit-matrix.md) | 适配完成前强制执行的审计矩阵，覆盖扫描 pattern、判定、修复、例外与验证要求                                              |

### Skyline 高级能力

Worklet 动画、手势系统、自定义路由、共享元素均属于 Skyline 高级能力。本 SKILL **只负责方案路由与 Mpx 接入边界**，具体 API、事件参数、版本要求、线程模型或完整实现规则参考以下官方 SKILL：

| 能力 | 官方来源 | 本 SKILL 负责 |
| --- | --- | --- |
| Worklet 动画 | [skyline-worklet](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills/skyline-worklet) | 判断是否确需 UI 线程驱动；补充 Mpx Babel 构建配置、`renderer === 'skyline'` 隔离与 WebView 降级方案 |
| 手势系统 | [gesture-system](https://github.com/wechat-miniprogram/skyline-skills/blob/master/skills/skyline-components/references/gesture/gesture-system.md) / [gesture-negotiation](https://github.com/wechat-miniprogram/skyline-skills/blob/master/skills/skyline-components/references/gesture/gesture-negotiation.md) | 判断是否需要 Skyline 手势能力；处理 Mpx 模板与脚本接入、跨渲染模式隔离 |
| 自定义路由 | [skyline-route](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills/skyline-route) | 判断转场需求与 Mpx 页面配置、生命周期及 WebView 降级边界 |
| 共享元素 | [share-element](https://github.com/wechat-miniprogram/skyline-skills/blob/master/skills/skyline-components/references/special/share-element.md) | 判断是否采用共享元素方案；处理 Mpx 页面结构、双模式隔离与降级边界 |

处理上述能力时，先读取对应官方 Skill 确认能力约束与实现方案，再应用本 SKILL 的 Mpx 编译接入和 WebView 与 Skyline 兼容约束。官方 Skill 未明确支持的能力不得依据本地经验推断；两者冲突时，Skyline 能力事实以官方 Skill 为准，Mpx 接入方式以本 SKILL 为准。

### 知识库使用建议

参考文档体量较大，**不要一次性预读全部参考**，按需取用即可：

1. **入口只读本 SKILL.md**：完整读完本文档（含下方通用约束与任务流程）足以覆盖 80% 常见场景的判断；不要在动笔前预读 references 目录。
2. **触发式读取**：只在任务流程或通用约束中**明确指向**某份参考时读取，且仅读取与当前问题相关的小节（参考文档均含目录与章节锚点，使用 `rg` / 锚点跳读，不要整文件 Read）。
3. **典型任务的最小阅读集**：
   - 已有 WebView 页面 Skyline 适配改造：识别问题维度后再读对应能力参考的相关小节，通常 1–2 份足够（如样式能力差异查 `skyline-style-reference.md`，布局或模板结构改造查 `skyline-layout-practice.md`，组件差异查 `skyline-component-reference.md`，运行时问题查 `skyline-runtime-practice.md`）。未收录的组件或能力不要反推结论，需回源确认。
   - 新建 WebView / Skyline 双模式兼容页面或组件：先按本 SKILL.md 的通用约束起手，遇到能力存疑（某属性是否支持、某 API 是否存在）时再点查对应参考。
   - 项目级配置接入：app.json 顶层项查 [`app.json 顶层配置`](./references/skyline-configuration.md#appjson-顶层配置)，`rendererOptions.skyline` 查 [`rendererOptions.skyline 配置项`](./references/skyline-configuration.md#rendereroptionsskyline-配置项)，页面配置示例查 [`适配参考`](./references/skyline-configuration.md#适配参考)，Worklet 构建配置查 [`Worklet Babel 插件`](./references/skyline-configuration.md#worklet-babel-插件)。
   - Worklet 动画、手势系统、自定义路由或共享元素：按[高级能力](#skyline-高级能力)读取对应官方 Skill，不预读无关高级能力参考。
4. **何时读取 `skyline-audit-matrix.md`**：仅在适配完成前检查或 Code Review 时读取，并按要求执行完整矩阵；不要在方案设计或编码前预读。

### 内容职责与同步规则

- **本 SKILL.md**：维护任务流程、决策优先级、高频跨维度约束、知识路由与人工验收，确保只读入口即可完成常见判断；不复制扫描 pattern、规则 ID 或完整能力枚举。
- **`references/`**：维护能力事实、适用条件、实现细节与示例。能力支持情况或实现方案变化时，先更新对应 reference。
- **审计矩阵**：维护可扫描规则的 ID、level、候选 pattern、判定、修复与例外。reference 中的变化可被源码扫描或结构复核发现时，再同步更新矩阵。
- 仅当变化影响通用决策、知识路由或人工验收时才同步本 SKILL.md；任务流程引用通用约束或 reference，不重复具体规则。内容冲突时，能力事实以 reference 为准，扫描与分级以审计矩阵为准，执行顺序与确认门禁以本 SKILL.md 为准。

## 通用约束与适配原则

适配改造、新建页面或组件、重构与 Code Review 均须遵循本节约束。应用本 Skill 的具体规则时，按以下优先级处理：

- 规则明确指向知识库或外部文档时，先读取与当前问题相关的小节，再实施改动；
- 规则已给出明确实现（属性值、CSS 片段、组件属性写法等）时，默认直接采用，不自行扩展替代方案；
- Skill 未给出替代方案、规则含义不明确或文档存在歧义时，不推断实现，先说明不确定点并请求确认；
- Skill 方案与更简写法、邻近代码风格或其他实现冲突时，先验证语义是否等价，以及 Skill 方案是否覆盖了未显式声明的上下文；验证后仍需偏离 Skill 方案的，说明差异并确认后再改。

### 跨渲染模式兼容约束

产物代码须在 WebView 与 Skyline 下均正常运行，按以下顺序选择方案：

- **优先采用通用方案**：新方案若同时兼容 WebView、Skyline 与 RN，直接统一为新方案，无需按渲染模式分支；
- **隔离 Skyline-only 方案**：仅 Skyline 可用的新逻辑默认通过 `this.renderer === 'skyline'` 运行时隔离。仅当细则明确要求该逻辑在 WebView 下保留，或已确认其在 WebView 下无副作用时，才可不作隔离；
- **保留在 Skyline 下静默失效的 WebView 方案**：既有 WebView 方案若在 Skyline 下静默失效，确认其在 Skyline 下无副作用后可保留原逻辑，仅新增 Skyline 兼容实现。静默失效不等于无副作用；无法确认时，仍须按渲染模式隔离；
- **不处理 Skyline 低版本兼容**：通过 Skyline 开量开关控制最低基础库版本，未达到要求的版本降级为 WebView 渲染。

运行时隔离方式见 [判断当前渲染模式](./references/skyline-runtime-practice.md#判断当前渲染模式)。上述原则贯穿模板 / 脚本 / 样式 / JSON 四个维度。

### 布局（layout）约束

1. **先对齐默认布局基线**：在 `rendererOptions.skyline` 中开启 `defaultDisplayBlock` 与 `defaultContentBox`，分别对齐 WebView 的 `display: block` 和 `box-sizing: content-box`；需要静态定位时仍须显式声明 `position: static`。配置位置见 [rendererOptions.skyline 配置项](./references/skyline-configuration.md#rendereroptionsskyline-配置项)，其余默认值差异见 [非标准默认值](./references/skyline-style-reference.md#非标准默认值)。
2. **不依赖 BFC 与 margin 合并**：Skyline 没有 BFC 和 margin 合并机制，`overflow: hidden` 仅用于裁剪。容器外沿空间用父容器 `padding` 表达，兄弟间距只由一侧承担；复杂存量布局按 [不要依赖 BFC 和 margin 合并](./references/skyline-layout-practice.md#不要依赖-bfc-和-margin-合并) 改造。
3. **页面滚动统一迁移到 scroll-view**：Skyline 不支持页面滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发。页面声明 `disableScroll: true`，使用 `scroll-view` 承载滚动，并根据直接子节点结构选择 `list` / `custom` / `nested`，常见为列表模式 `type="list"`。原生命周期同步迁移到 `bindrefresherrefresh` / `bindscrolltolower` / `bindscroll`，WebView 对齐同一事件链路；详见 [页面滚动替代方案](./references/skyline-layout-practice.md#页面滚动替代方案)。
4. **按 normal-context / fixed-context 设计层级**：Skyline 没有 WebView 层叠上下文，非 fixed 节点最终比较共同父级下的兄弟分支；fixed 节点会全局提升并按自身 `z-index` 排序，整体高于非 fixed 内容。`transform` / `opacity` 不会抬升层级，`scroll-view` 直接子节点的 `z-index` 不生效。需要比较层级的节点应调整为可比较的兄弟结构，避免依赖负 `z-index`；详见 [z-index 与层叠适配](./references/skyline-layout-practice.md#z-index-与层叠适配)。
5. **吸顶逻辑双分支保留**：Skyline 不支持 `position: sticky`，Skyline 分支使用 `sticky-section` / `sticky-header`，WebView 分支保留 CSS sticky。`sticky-header` 必须是 section 的第一个子节点且显式设置背景色，完整结构见 [sticky 吸顶替代方案](./references/skyline-layout-practice.md#sticky-吸顶替代方案)。
6. **使用自定义导航**：Skyline 页面声明 `navigationStyle: 'custom'` 并实现自定义导航栏，不依赖默认导航；页面配置见 [适配参考](./references/skyline-configuration.md#适配参考)。

### 样式（style）约束

1. **只使用受支持的选择器**：不使用通配选择器和属性选择器；伪元素只使用 `::before` / `::after`，其他伪类按 [选择器支持](./references/skyline-style-reference.md#选择器支持) 核对版本与替代方案，不能用时改为模板动态类或真实节点。
2. **值类型按稳定范围使用**：长度优先使用 `rpx` / `px` / `rem`；百分比仅用于 [百分比支持情况](./references/skyline-style-reference.md#百分比支持情况) 明确记录的属性，Flex 子节点不能依赖百分比 `min-width` 撑开或等分。`calc()` 只用于非嵌套的长度计算，不用于角度等类型；详见 [长度、函数与单位](./references/skyline-style-reference.md#长度函数与单位)。
3. **滚动与特殊布局改用组件或显式布局**：不使用 `overflow: auto` / `scroll`、`overflow-x` / `overflow-y`、`display: grid` / `flow-root` 或 `position: sticky`；分别改用 `scroll-view`、Flex / `grid-view`、sticky 组件。其他布局差异按 [布局、盒模型与层叠差异](./references/skyline-style-reference.md#布局盒模型与层叠差异) 处理。
4. **文本省略同时保留两端实现**：保留 WebView 的 `text-overflow` / `-webkit-line-clamp` 等样式，并在承载文本的组件上新增 `max-lines` 与 `overflow` 供 Skyline 使用；新增或替换为 `text` 时将插值紧贴标签，避免字面空白影响截断。完整规则见 [文本溢出省略适配](./references/skyline-layout-practice.md#文本溢出省略适配)。
5. **字体与文本能力先核对再替换**：`font-weight: 500/600` 在部分机型不生效，命中时先检查字体资源与 PostScript name，再确认是否改为 `bold` / `700`，未确认时保留并说明风险。`white-space`、`word-break`、`text-decoration` 等能力按 [文本与字体差异](./references/skyline-style-reference.md#文本与字体差异) 处理；`text-decoration-line` 多值按 [多值适配](./references/skyline-layout-practice.md#text-decoration-line-多值适配) 拆分节点。
6. **背景、边框、遮罩与滤镜遵循层数和值域限制**：圆角非 0 时四边边框颜色和样式保持一致；多层背景、遮罩或阴影超出支持范围时拆节点；`mask-image` 不使用渐变；`filter` / `backdrop-filter` 不使用 `url()`、`drop-shadow()` 或多函数组合。具体值域见 [背景、边框与遮罩差异](./references/skyline-style-reference.md#背景边框与遮罩差异) 与 [滤镜差异](./references/skyline-style-reference.md#滤镜差异)。
7. **媒体查询保留 WebView、补 Skyline 动态类**：Skyline 会忽略 `@media screen` 条件但可能保留内部规则，不能直接删除或全局覆盖。WebView 继续使用原媒体查询，Skyline 通过运行时状态类表达条件，并在媒体查询后补 Skyline 默认类兜底；详见 [@media screen 替换方案](./references/skyline-layout-practice.md#media-screen-替换方案)。
8. **未支持属性按跨渲染原则处理**：命中未支持或静默失效的 CSS 时，先在 [其他 Skyline 不支持能力及兼容方案](./references/skyline-style-reference.md#其他-skyline-不支持能力及兼容方案) 查询替代方案；确认原 WebView 样式在 Skyline 下无副作用后可保留，仅新增 Skyline 实现。没有等效方案或副作用不明确时，说明风险并请求确认。

### 组件（component）约束

组件参考只记录 WebView 迁移 Skyline 的差异，不是完整组件手册；未收录的组件、属性或事件不得反推为支持，需回源确认。

1. **scroll-view 必须显式选型**：每个 `scroll-view` 都声明 `type`。`type="list"` 仅用于列表项是直接子节点的场景，单一外层 wrapper 会使按需渲染退化；嵌套滚动时外层使用 `type="nested"`，内层显式使用 `list` / `custom` 并设置 `associative-container="nested-scroll-view"`。选型与结构约束见 [Skyline 必填属性与结构约束](./references/skyline-component-reference.md#skyline-必填属性与结构约束)。
2. **scroll-view 行为按需补齐**：横向滚动同时开启 `enable-flex` 并设置横向布局；自定义下拉刷新节点声明 `slot="refresher"`；需要内容撑高时开启 `enableScrollViewAutoSize`。通过 `NodesRef.node()` 获取 `ScrollViewContext` 时，目标滚动容器必须开启 `enhanced`；详见 [组件高频差异](./references/skyline-component-reference.md#skyline-相对-webview-的高频差异补充) 与 [ScrollViewContext](./references/skyline-runtime-practice.md#必须-scrollviewcontext开启-enhanced-属性)。
3. **不支持组件采用替代或降级**：命中 `web-view`、富文本编辑、可移动视图等不支持能力时，按 [不支持或不建议使用的组件](./references/skyline-component-reference.md#skyline-不支持或不建议使用的组件) 选择替代组件、独立 WebView 页面或 renderer 降级；复杂交互无明确等效方案时说明风险并请求确认。
4. **WebView-only 属性与取值不得作为 Skyline 方案**：例如 `image` 的 WebView-only 裁剪模式、`text` 的 `space` / `decode`、输入组件的 `placeholder-class` 等，确认在 Skyline 下无副作用后可保留给 WebView，并补充 Skyline 实现；存在副作用时替换为双端支持写法或按 renderer 隔离，不明确时说明风险并请求确认。完整范围见 [WebView-only 属性、取值与行为](./references/skyline-component-reference.md#webview-only-属性取值与行为)。
5. **遵守组件子节点结构**：`navigator` 只能嵌套 `text` 或纯文本，`text` 只能嵌套 `text`；复杂卡片改为外层点击事件。图标、图片与文本处于同一行时使用 `span` 方案，并补齐 Skyline 的内联布局与截断属性；详见 [图文混排](./references/skyline-layout-practice.md#图文混排)。
6. **模板结构按 glass-easel 规则改造**：数据绑定外的引号使用 XML 实体，数据绑定内不使用反斜杠转义；`wx:for` 子树中的 `<include>` 改为 `<import>` + `<template>` 并显式传入 `item` / `index`。详见 [模板结构适配](./references/skyline-layout-practice.md#模板结构适配)。
7. **节点查询使用合法选择器**：id 不以数字开头；glass-easel 组件实例内优先使用 `this.createSelectorQuery()`。详见 [SelectorQuery 约束](./references/skyline-runtime-practice.md#必须-selectorquery-选择器不再支持以数字开头) 与 [SelectorQuery 推荐](./references/skyline-runtime-practice.md#推荐-用-thiscreateselectorquery-替代-wxcreateselectorquery)。

### 动画策略约束

若需同时兼容 WebView、Skyline、RN，动画方案的选择优先级：

1. **简单状态切换优先 CSS transition**：缩放、透明度、位移等交互反馈通过 class 或动态 style 驱动，优先选择三端均支持的通用方案。Skyline 动画属性为白名单，只对 `transform`、`opacity`、尺寸、间距、定位等受支持属性使用 transition；字体、颜色、文本排版等未支持属性改为直接状态切换或其他方案，完整范围见 [动画与过渡差异](./references/skyline-style-reference.md#动画与过渡差异)。
2. **循环或多步骤动画使用真实节点**：WebView 与 Skyline 可使用 CSS `animation` + `@keyframes`，RN 按需保留独立动画路径。伪元素 animation 在 Skyline 下不生效，改为真实节点；`animation-fill-mode` 只使用 `forwards` / `both`，迁移项目同时核对 `keyframeStyleIsolation`。
3. **WebView 动画 API 在 Skyline 下补替代实现**：`wx.createAnimation` 以及 `animate` / `applyAnimation` / `clearAnimation` / `setInitialRenderingCache` 在 Skyline 下不支持，需改造为 CSS transition / animation；详见 [不支持的组件实例方法](./references/skyline-runtime-practice.md#必须-skyline-不支持的组件实例方法) 与 [animation API 替代方案](./references/skyline-layout-practice.md#animation-api-不支持--使用-css-transition)。
4. **Worklet 只用于 UI 线程实时驱动**：手势跟随、滚动联动等需要 UI 线程及时反馈的场景才使用 Worklet。先按[高级能力](#skyline-高级能力)读取官方 Skill，再补 Mpx Babel 配置、renderer 隔离与 WebView 降级；简单交互不要仅为“性能最优”引入 Worklet。

## 任务一：对已有 WebView 页面或组件进行 Skyline 适配改造

### 输入

基于 WebView 模式编写的 `.mpx` 页面或组件（已在微信 WebView 模式下运行，但未适配 Skyline）。

### 输出

以用户指示为准；若无特殊指示则默认在原文件中进行修改。输出修改后代码时应输出完整页面或组件代码，避免使用省略号，确保用户可以直接复制或应用修改。

### 任务流程

#### 1. 页面配置适配（组件无需配置）

- 页面任务按 [配置参考 · 适配参考](./references/skyline-configuration.md#适配参考) 补齐页面 JSON 和全局 app.json 配置；组件任务跳过页面专属配置。

#### 2. 布局适配改造

- 识别默认布局、页面滚动、层叠与导航等命中维度，先应用[布局约束](#布局layout约束)，再按实际问题点读取 [布局适配实践](./references/skyline-layout-practice.md#布局适配) 的对应小节。
- 页面滚动改造需同时迁移业务事件并按结构选择 `scroll-view` 类型，常见为列表模式 `type="list"`。

#### 3. 样式适配改造

- 先应用[样式约束](#样式style约束)，根据实际命中项读取 [样式差异参考](./references/skyline-style-reference.md) 的对应小节。
- 需要结构性改造时，再按问题点读取 [布局适配实践 · 样式适配](./references/skyline-layout-practice.md#样式适配) 中对应的文本、flex、媒体查询或动画方案。

#### 4. 组件适配改造

- 先应用[组件约束](#组件component约束)，根据模板中的实际组件读取 [组件不支持与差异参考](./references/skyline-component-reference.md) 对应小节；未收录能力需回源确认，不要反推结论。
- 命中图文混排、sticky 或其他结构改造时，再读取 [布局适配实践](./references/skyline-layout-practice.md) 的对应小节；命中高级能力时按[高级能力](#skyline-高级能力) 回源官方 Skill。

#### 5. 检查与确认

检查前必须读取并执行 [Skyline 适配检查矩阵](./references/skyline-audit-matrix.md)。

执行要求：
- 指定单个 `.mpx` 组件：以该文件为 scope 跑完整矩阵。
- 指定页面：先确认页面和组件范围，按反馈后的 scope 跑完整矩阵，最终输出必须说明覆盖以及未覆盖的范围。
- 不允许只扫描本次怀疑的问题类型。
- 每个 `error` 命中必须处理或说明例外；最终输出需概述 `error` / `warn` 残留原因。

人工复核：
- 跨渲染模式：Skyline-only 逻辑已通过 `renderer === 'skyline'` 或项目封装隔离，WebView 原有逻辑保留。
- 页面配置：页面 JSON 与 app.json Skyline 配置齐全；涉及 Worklet 时 Babel 插件已配置。
- 页面滚动：页面滚动、下拉刷新、触底、滚动监听已迁移到 `scroll-view` 对应事件。
- 层级结构：z-index 仅依赖兄弟层级，未引入负 z-index 或跨层叠上下文假设。
- 覆盖范围：页面适配时已说明覆盖到的组件树和未覆盖子树。

## 任务二：创建符合 Skyline 兼容规范的页面或组件

### 输入

用户描述的页面或组件需求，包括视图结构、交互、数据来源、目标平台范围、是否有复杂动画或者手势需要 Worklet 动画、手势系统、自定义路由、共享元素等 Skyline 高级能力。

### 输出

完整的 `{name}.mpx` 组件文件，结构包含 `<template>`、`<script>`、`<style>` 与 JSON 配置区块。代码须直接满足 [通用约束与适配原则](#通用约束与适配原则)，避免新建后再走一轮适配改造。

### 任务流程

#### 1. 设计阶段

- 与用户对齐需求要点：组件视图结构、props / 事件、数据流、目标平台、是否需要 Skyline 高级能力（Worklet 动画、手势系统、自定义路由、共享元素）。
- 命中任一高级能力时，按[高级能力](#skyline-高级能力)读取对应官方 Skill，先确定 Skyline 方案，再补充 Mpx 接入、运行时隔离与 WebView 降级方案；不得仅依据本 SKILL 补全高级能力实现细节。

#### 2. 实施阶段

按 SFC 各区块依次实现，全程遵循 [通用约束与适配原则](#通用约束与适配原则)：

- **JSON 配置**：页面按 [配置参考 · 适配参考](./references/skyline-configuration.md#适配参考) 补齐页面 JSON 和全局 app.json 配置，组件无需配置。
- **`<template>`**：按[组件约束](#组件component约束)设计组件语义与结构，仅针对实际使用的组件点读 [组件不支持与差异参考](./references/skyline-component-reference.md)；未收录能力需回源确认。
- **`<style>`**：按[布局约束](#布局layout约束)与[样式约束](#样式style约束)实现；能力或改造方式存疑时，再读取样式 reference 或布局实践的对应小节。
- **`<script>`**：按[跨渲染模式兼容约束](#跨渲染模式兼容约束)组织通用实现、Skyline 隔离与 WebView 保留逻辑；需要高级能力时按[高级能力](#skyline-高级能力)读取官方 Skill，并补齐 Mpx 构建接入。

#### 3. 检查与确认

复用 [任务一 · 检查与确认](#5-检查与确认) 的清单，确认新建页面或组件及其 scope 不引入任何 Skyline 不兼容写法。
