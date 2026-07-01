---
name: mpx2skyline
description: |
  微信小程序 WebView 适配 Skyline 渲染引擎指南，覆盖布局、样式、组件、配置四大维度。
  当用户要求对已有微信小程序页面进行 Skyline 适配、创建符合 Skyline 兼容规范的页面、
  排查 Skyline 下样式不生效/组件不渲染/布局异常/层级错乱等问题、或查询某项能力在
  Skyline 下的支持情况时强制调用。当用户问题不涉及 Skyline 适配时不应调用，如
  Mpx 输出 RN 问题、支付宝小程序问题、纯 webview 小程序开发问题等。
metadata:
  version: "1.0.1"
---

# Mpx 输出 Skyline 渲染引擎的开发&适配指南

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。

Skyline 是微信小程序新一代渲染引擎，旨在替代 WebView 渲染以获得更接近原生的性能和体验。与 WebView 模式相比，Skyline 在布局模型、层叠机制、样式能力、组件支持、页面行为上存在系统性差异。

### 适用场景

本 SKILL 是 Mpx WebView 适配 Skyline 渲染引擎的统一指南，覆盖布局、样式、组件、配置四大维度。涉及 Mpx Skyline 适配的任务均应在动笔前阅读本 SKILL 的[通用约束与适配原则](#通用约束与适配原则)，包括但不限于：

- **技术方案设计**：评估需求在 Skyline 下的可行性、跨渲染模式（WebView & Skyline）兼容方案选型、是否需要通过 `this.renderer === 'skyline'` 进行运行时模式隔离等;
- **WebView 页面 Skyline 适配改造**：对已基于 WebView 模式编写、未适配 Skyline 的存量页面进行兼容性补齐（参见下文[任务一](#任务一对已有-webview-页面进行-skyline-适配改造)）;
- **页面 / 组件开发迭代**：从零编写或迭代符合 WebView & Skyline 双模式兼容规范的 `.mpx` 页面与组件（参见下文[任务二](#任务二创建符合-skyline-兼容规范的页面)）;
- **运行时报错与异常排查**：定位 Skyline 下样式不生效（如不支持选择器/属性静默失效）、组件不渲染（如 `scroll-view` 缺失 `type`）、布局异常（如默认 `display: flex` / `border-box` 引发的差异）、层级错乱（z-index 无层叠上下文）、glass-easel 框架变更点（如 `wx-if` 废弃、模板转义、SelectorQuery 数字开头）、worklet 动画失效等问题;
- **能力查询**：查询某项基础组件、属性、样式、API、滚动 API、worklet 能力在 Skyline 下的支持情况、版本要求与 WebView 差异;
- **Code Review**：以本 SKILL 的[通用约束与适配原则](#通用约束与适配原则)为标准对照检查 Skyline 兼容性与跨渲染模式兼容性。

### 不适用场景

以下场景与 Mpx Skyline 适配无关，**不应调用**本 SKILL：

- 仅面向微信小程序 Webview 的开发和适配问题（不涉及 Skyline 适配，无需 Skyline 兼容性约束）;
- 支付宝、百度、抖音等其他小程序平台的开发问题（Skyline 是微信小程序专属渲染引擎，不适用于其他厂商）;
- Skyline only 项目的开发问题（本 SKILL 强调 Mpx 框架下 WebView & Skyline 双模式兼容，纯 Skyline 项目应直接参考 [微信官方Skyline skills](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills)）;
- Mpx 跨端输出 RN（Mpx2RN / Mpx2DRN）相关问题;
- Mpx 跨端输出 Web（Mpx2Web）相关问题;
- 不经 Mpx 框架编译的纯微信原生小程序开发问题。

## 知识库索引

| 知识库 | 说明                                             |
| --- |------------------------------------------------|
| [Skyline 基础组件支持与差异参考](./references/skyline-component-reference.md) | 查询组件支持情况与差异，涉及不支持组件的替代方案、Skyline 新增组件、组件使用注意事项 |
| [Skyline WXSS 样式能力参考](./references/skyline-style-reference.md) | 查询样式属性/选择器/单位是否支持，逐属性支持详情与 WebView 差异对比        |
| [WebView→Skyline 适配改造最佳实践](./references/skyline-migration-practice.md) | 进行适配改造时读取，覆盖布局适配、样式适配、组件适配、层叠适配的完整实操方案         |
| [Skyline 配置项与接入规范参考](./references/skyline-configuration.md) | 接入代码配置等项目级配置时读取                                |

> 若有涉及到纯 Skyline 相关的问题（比如共享元素、手势系统、worklet 动画）可查询 [微信官方Skyline skills](https://github.com/wechat-miniprogram/skyline-skills/tree/master/skills)

### 知识库使用建议

参考文档体量较大，**不要一次性预读全部参考**，按需取用即可：

1. **入口只读本 SKILL.md**：完整读完本文档（含下方[通用约束与适配原则](#通用约束与适配原则)与任务流程）足以覆盖 80% 常见场景的判断；不要在动笔前预读 references 目录。
2. **触发式读取**：只在通用约束或任务流程中**明确指向**某份参考（及其锚点）时读取，且仅读取与当前问题相关的小节——四份参考均含目录与章节锚点，用 grep / 锚点跳读，不要整文件 Read。
3. **典型任务的最小阅读集**（仅当本 SKILL.md 已无法判断时再补充）：
   - **存量 WebView 页面 Skyline 适配改造**：先按本 SKILL.md 的[通用约束](#通用约束与适配原则)逐维度核对，识别出问题维度后再点读对应参考的相关小节，通常 1–2 份足够——样式属性/选择器/单位是否支持查 [`skyline-style-reference.md`](./references/skyline-style-reference.md)，具体改造写法（布局/样式/组件/层叠的可复制方案）查 [`skyline-migration-practice.md`](./references/skyline-migration-practice.md) 对应小节。
   - **组件能力存疑**（某组件/属性/裁剪模式是否支持、替代方案）：点查 [`skyline-component-reference.md`](./references/skyline-component-reference.md) 相关行。
   - **新建双模式兼容页面/组件**：先按通用约束起手，遇到能力存疑（某属性是否支持、某 API 是否存在）时再点查对应参考。
   - **项目级配置接入**（app.json / page.json / worklet Babel）：直接读 [`skyline-configuration.md`](./references/skyline-configuration.md)。
   - **排查 Skyline 运行时问题**（样式静默失效 / 组件不渲染 / 布局异常 / 层级错乱 / worklet 失效）：先定位到报错所属维度，再读该维度能力参考的相关小节。

## 通用约束与适配原则

适配改造、新建组件、Code Review 均须遵循以下约束：

适配/重构类任务，读到 skill 给出的具体改造规则时：
- 规则带有知识库路由或外链的，**先读链接文档**再动手；
- skill 给出明确可复制代码片段（属性值、CSS snippet、组件属性写法）→ 默认按 skill 执行；
- skill 方案明显偏复杂且有公认更简写法需要澄清确认；
- skill 没有明确替代方案的组件或者样式属性、规则不清楚、文档有歧义等场景先要求澄清；
- skill 方案与其他方案（如"和邻近文件保持一致""拆开写更精确""有更简单的写法"）冲突时，先验证两点：语义是否等价；skill 方案是否在未显式声明的上下文里更稳，再确认是否改方案

### 跨渲染模式兼容约束

产物代码须在 WebView 与 Skyline 下均正常运行：

- 新方案若 WebView & Skyline & RN 三端兼容，直接对齐为新方案；
- 新方案若属 Skyline-only 改造，**必须**通过 `this.renderer === 'skyline'` 运行时隔离，若有细则明确要求 WebView 保留原有逻辑且 Skyline 无副作用则保留，阅读 [运行时 renderer 判断](./references/skyline-migration-practice.md#判断当前渲染模式)；
- 特定版本起支持的 Skyline 特性（如 `position: fixed` 8.0.43+、`:nth-child` 8.0.50+）按已支持处理，不做低版本兼容。

该原则贯穿模板 / 脚本 / 样式 / JSON 四个维度。

### 布局（layout）约束

1. **默认布局差异**：Skyline 默认 `display: flex`，WebView 默认 `display: block` → app.json 配置 `defaultDisplayBlock` 对齐 WebView 默认 `display:block`。
2. **box-sizing 默认值**：Skyline 默认 `border-box`（WebView 默认 `content-box`）→ app.json  配置 `defaultContentBox` 对齐 WebView 默认 `content-box`。
3. **页面滚动**：Skyline 不支持页面滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发 → 使用 `scroll-view type="list"` 替代，页面需声明 `disableScroll: true`。**原页面生命周期需迁移到 scroll-view 对应事件**（`bindrefresherrefresh` / `bindscrolltolower` / `bindscroll`），WebView 对齐 Skyline 写法。事件映射与示例详见 [适配最佳实践 · 页面滚动替代方案](./references/skyline-migration-practice.md#页面滚动替代方案)。
4. **自定义导航**：Skyline 不支持默认导航 → 自定义导航栏，页面需声明 `navigationStyle: 'custom'`。
5. **inline / inline-block**：Skyline 不支持 inline 和 inline-block 布局 → 使用 flex 布局或 `mpxTagName@wx="span"` 替代，阅读 [适配最佳实践 · inline/inline-block 替代方案](./references/skyline-migration-practice.md#inlineinline-block-替代方案)。
6. **z-index 与层叠**：z-index 仅兄弟节点生效，无层叠上下文机制 → 阅读 [适配最佳实践 · z-index 与层叠适配](./references/skyline-migration-practice.md#z-index-与层叠适配)，理解 WebView & Skyline 层级差异，重新排布页面内所有子孙节点的层级结构。**优先用非负兄弟序（不要调整 DOM 顺序，需要调整 DOM 顺序时需先确认）控制层级，尽量避免负 z-index**。

### 样式（style）约束

1. **选择器**：不支持通配选择器 `*` 和属性选择器 `[attr]`；伪元素仅 `::before` / `::after`；`:nth-child` 需 8.0.50+，选择器支持详情阅读 [样式能力参考 · 选择器支持](./references/skyline-style-reference.md#选择器支持)。
2. **单位**：避免 `em` / `currentColor`，使用 `rpx` / `px` / `rem`，单位支持阅读 [样式能力参考 · 值类型支持](./references/skyline-style-reference.md#值类型支持)。
3. **overflow**：`overflow: scroll` 不支持 → 使用 `scroll-view` 组件；不支持单独设置 `overflow-x` / `overflow-y`。
4. **边框一致性**：`border-radius` 非 0 时四边 `border-color` / `border-style` 需一致。
5. **伪元素 animation**：Skyline 下伪元素的 `animation` 不生效 → 使用真实节点 + CSS animation。
6. **font-weight**：部分机型不支持 `font-weight: 500` / `600` 数值加粗，需使用 `bold` / `700`，webview 对齐 skyline，可直接全局替换。
7. **box-shadow**：不支持多个叠加。
8. **不支持 CSS 属性**：`float` / `contain` / `resize` / `writing-mode` / `text-indent` / `overflow-wrap` / `background-attachment` / `background-clip` / `background-origin` / `mask-origin` / `mask-clip` / `mask-mode` / `justify-items` 等属性设置后静默不生效，阅读 [样式适配 · 不支持的 CSS 属性](./references/skyline-migration-practice.md#不支持的-css-属性)，无等效方案时抛出提示
9. **渐变与背景多值限制**：`radial-gradient` 仅支持 `circle`（不支持 `ellipse`）；`background-image` / `mask-image` 最多支持 2 个值；`background-repeat` / `background-size` 不支持多组值，阅读 [样式适配 · 渐变与背景多值限制](./references/skyline-migration-practice.md#渐变与背景多值限制)。
10. **filter / backdrop-filter**：不支持 `url()` / `drop-shadow()` 及多函数组合；用 `box-shadow` 替代 `drop-shadow`。详见 [样式适配 · filter / backdrop-filter 限制](./references/skyline-migration-practice.md#filter--backdrop-filter-限制)。
11. **text-decoration-line 单值**：仅支持单个值，多值组合（如 `underline line-through`）不生效 → 需双值时用运行时判断嵌套 `text` 节点拆分，详见 [适配最佳实践 · text-decoration-line 多值适配](./references/skyline-migration-practice.md#text-decoration-line-多值适配)。
12. **calc() 不支持角度**：`calc()` 支持长度计算但不支持角度类型，需直接写角度值（如 `135deg`）。
13. 同一类型的元素(如同段 stylus 内多个 inline/inline-block 替换)用同一种 skill 方案,不要混搭。

### 组件（component）约束

1. **scroll-view 必须指定 type**：`<scroll-view type="list">`，Skyline 下缺少 type 属性将无法正常工作。**嵌套场景下每一层 scroll-view 都必须显式声明 type**（外层 `type="nested"`、内层 `type="list"` / `"custom"`），遗漏内层 type 会让内层退化为 WebView 渲染路径。
2. **横向滚动必要条件，缺一不可**：scroll-view 横向滚动**必须同时**满足 ① `enable-flex="true"` ② 自身 `display: flex; flex-direction: row` ③ 每个子节点 `flex-shrink: 0`。三者缺一则横向滚动不生效（这是 Skyline 适配最常漏的一条），最小示例与版本兼容写法详见 [适配最佳实践 · 横向 scroll-view 适配](./references/skyline-migration-practice.md#横向-scroll-view-适配)。
3. **不支持组件**：`web-view` / `movable-area` / `movable-view` / `editor` / `progress` / `navigation-bar` → 简单场景使用替代方案，复杂场景给出替代方案或者降级方案待确认，参考 [组件支持详情](./references/skyline-component-reference.md#组件支持详情)。
4. **自定义组件样式隔离**：`tag` / `id` 选择器不支持跨自定义组件匹配，`class` 遵循组件样式隔离机制 → 全局配置 `"tagNameStyleIsolation": "legacy"` 对齐 WebView 标签选择器全局匹配。
5. **不使用 WebView-only** image 的 WebView-only 裁剪模式（`top` / `bottom` / `center` / `left` / `right`）。
6. **sticky-header 必须显式声明背景色**：Skyline 下 `sticky-header` 默认透明，吸顶时会与下层列表内容透字穿透；同时 `sticky-header` 必须是 `sticky-section` 的第一个子节点（且每个 section 仅一个 header）。详见 [适配最佳实践 · sticky 吸顶替代方案](./references/skyline-migration-practice.md#sticky-吸顶替代方案)。
7. **navigator 嵌套限制**：`<navigator>` 内**只能嵌套 `<text>` 或纯文本**，不能嵌套 `<view>` / `<image>` 等其他组件；
8. **图文混排须用 `<span>` 内联包裹**：Skyline 下 `<view>`/`<text>` 无法直接图文内联混排，需用 `<span>` 包裹各内联片段，实现参考 [图文混排](./references/skyline-migration-practice.md#inlineinline-block-替代方案)。
9. **scroll-view 按内容撑开**：需在 app.json 配置 `enableScrollViewAutoSize` 对齐 Webview scroll-view 自动撑开高度。

### 滚动 API（Scroll API）约束

1. **ScrollViewContext 需 enhanced 属性**：通过 `NodesRef.node()` 获取 `ScrollViewContext` 时，`scroll-view` 必须开启 `enhanced` 属性，否则返回的不是 ScrollViewContext 实例。详见 [Scroll API 适配 · ScrollViewContext：必须开启 enhanced 属性](./references/skyline-migration-practice.md#scrollviewcontext必须开启-enhanced-属性)。
2. **worklet.scrollViewContext 必须通过 ref() 获取**：在 worklet 中控制滚动须用 `NodesRef.ref()` + `SharedValue`，不能用 `node()`（`node()` 返回的是逻辑线程 ScrollViewContext，无法在 UI 线程使用）。详见 [Scroll API 适配 · worklet.scrollViewContext：必须通过 ref 获取](./references/skyline-migration-practice.md#workletscrollviewcontext必须通过-ref-获取)。
3. **worklet.scrollViewContext.scrollTo 只能在 worklet 中调用**：调用该 API 的函数必须声明 `'worklet'` 指令（仅 UI 线程可用），且不支持小程序插件。详见 [Scroll API 适配 · worklet.scrollViewContext.scrollTo：调用函数必须声明 'worklet' 指令](./references/skyline-migration-practice.md#workletscrollviewcontextscrollto调用函数必须声明-worklet-指令)。
4. **DraggableSheetContext.scrollTo 的 size 与 pixels 互斥**：同时传入时仅 `size` 生效，`pixels` 被静默忽略。详见 [Scroll API 适配 · DraggableSheetContext：size 和 pixels 不可同时传入](./references/skyline-migration-practice.md#draggablesheetcontextsize-和-pixels-不可同时传入)。

### 动画策略约束

跨端（WebView + Skyline + RN）场景下，动画方案的选择优先级：

1. 简单状态切换动画（缩放、透明度、位移等交互反馈）：**CSS `transition`**：三端均支持，通过 class 切换或动态 style 触发，无需平台判断。
2. 循环/多步骤动画：**CSS `animation` + `@keyframes`**：Webview & Skyline支持，RN 暂不支持可暂时区分平台使用 API `mpx.createAnimation`。
3. 手势/滚动场景：**Skyline Worklet 动画**，仅用于需要 UI 线程 60fps 驱动的场景（手势跟手、滚动联动），必须通过 `this.renderer === 'skyline'` 隔离。
4. **禁止使用** `this.animate` / `this.applyAnimation` — 这些是 WebView-only API，Skyline 下静默不生效，RN 下不存在。
5. `wx.createAnimation` mpx2RN & WebView 支持，Skyline 不支持，Skyline 适配时需改造为 CSS `transition` 或者 CSS `animation` + `@keyframes`

> 简单交互动画（如按钮缩放、卡片翻转）直接用 transition，不要为了"性能最优"引入 worklet — worklet 的价值在于手势跟手的实时性，不在于简单状态动画。

### Worklet 动画约束

1. **必须声明 'worklet' 指令**：在 UI 线程执行的函数（手势/滚动回调等）必须在函数顶部声明 `'worklet'` 字符串，缺少指令将在逻辑线程执行，导致动画延迟。详见 [Worklet 动画适配 · worklet 函数必须声明 'worklet' 指令](./references/skyline-migration-practice.md#worklet-函数必须声明-worklet-指令)。
2. **SharedValue 通过 .value 读写**：`wx.worklet.shared()` 创建的共享变量必须通过 `.value` 读写，直接赋值会替换对象本身导致动画驱动失效。详见 [Worklet 动画适配 · SharedValue 必须通过 .value 读写](./references/skyline-migration-practice.md#sharedvalue-必须通过-value-读写)。
3. **worklet 中调用普通函数必须使用 runOnJS**：worklet 运行在 UI 线程，不能直接调用页面方法或 `wx.*` API，必须通过 `runOnJS` 切换回 JS 线程。详见 [Worklet 动画适配 · 在 worklet 中调用普通函数必须使用 runOnJS](./references/skyline-migration-practice.md#在-worklet-中调用普通函数必须使用-runonjs)。
4. **runOnJS 调用页面方法必须 bind(this)**：通过 `runOnJS` 调用页面方法前必须先 `bind(this)`，否则 `this` 指向丢失。详见 [Worklet 动画适配 · 页面方法必须通过 bind(this) 绑定后传入 runOnJS](./references/skyline-migration-practice.md#页面方法必须通过-bindthis-绑定后传入-runonjs)。
5. **禁止在 worklet 中解构 this.data**：解构赋值会触发 `Object.freeze` 冻结 `this.data`，导致页面后续所有 `setData` 失效。详见 [Worklet 动画适配 · 禁止在 worklet 中解构 this](./references/skyline-migration-practice.md#禁止在-worklet-中解构-this)。

### glass-easel 框架约束

1. **模板转义改用 XML 实体**：数据绑定**外**的引号须改为 `&quot;`，数据绑定**内**无需转义（不再用反斜杠）。详见 [glass-easel 变更点适配 · 模板转义](./references/skyline-migration-practice.md#必须-模板中数据绑定外的转义改为标准-xml-转义)。
2. **不再支持 wx-if / wx-for**：短横线写法已废弃，仅支持冒号写法 `wx:if` / `wx:for`（两种框架均支持冒号写法，可直接改）。详见 [glass-easel 变更点适配 · wx-if / wx-for](./references/skyline-migration-practice.md#必须-不再支持-wx-if--wx-for仅支持-wxif--wxfor)。
3. **wx:for 内嵌 include 须改为 template**：`<include>` 引入的模板中 `item` / `index` 变量失效，须改用 `<template>` + `<import>` 方案。详见 [glass-easel 变更点适配 · wx:for 内嵌 include](./references/skyline-migration-practice.md#必须-wxfor-内嵌-include-时改为-template)。
4. **SelectorQuery 选择器不支持以数字开头**：`#1` 等以数字开头的 id 选择器不合 CSS 规范，需重命名（如 `#element-1`）。详见 [glass-easel 变更点适配 · SelectorQuery](./references/skyline-migration-practice.md#必须-selectorquery-选择器不再支持以数字开头)。
5. **[仅 Skyline] 不支持 animate / applyAnimation / clearAnimation / setInitialRenderingCache**：调用后静默不生效，须改用 CSS transition 或 Worklet 动画。详见 [glass-easel 变更点适配 · 不支持的实例方法](./references/skyline-migration-practice.md#必须仅-skyline-不支持的组件实例方法)。

## 任务一：对已有 WebView 页面进行 Skyline 适配改造

### 输入

基于 WebView 模式编写的 `.mpx` 页面（已在微信 WebView 模式下运行，但未适配 Skyline）。

### 输出

以用户指示为准；若无特殊指示则默认在原文件中进行修改。输出修改后代码时应输出完整页面代码，避免使用省略号，确保用户可以直接复制或应用修改。

### 任务流程

#### 1. 页面配置适配

- 页面 json 需新增 `renderer` / `componentFramework` / `disableScroll` / `navigationStyle` `renderer: 'skyline'`、`componentFramework: 'glass-easel'`、`disableScroll: true`、`navigationStyle: 'custom'`
- 全局配置 app.json 需新增 `lazyCodeLoading`（顶层），以及 `rendererOptions.skyline` 下的 `defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize`，阅读[配置参考](./references/skyline-configuration.md)

#### 2. 布局适配改造

- 读取 [适配最佳实践 · 布局适配](./references/skyline-migration-practice.md#布局适配)，对页面的布局与层叠逐一核对 Skyline 兼容性。
- 默认 flex 布局差异处理（配置 `defaultDisplayBlock`）。
- 页面滚动 → `scroll-view type="list"` 替代。
- 自定义导航替代默认导航。
- inline / inline-block → flex 布局替代。

#### 3. 样式适配改造

- 读取 [样式能力参考](./references/skyline-style-reference.md) 检查 `<style>` 中所有样式属性的 Skyline 支持情况。
- 读取 [适配最佳实践 · 样式适配](./references/skyline-migration-practice.md#样式适配) 改造为 Skyline 兼容实现。
- 不支持选择器替代（`*` → 类选择器、`[attr]` → 类选择器）。
- 不支持属性替代（`overflow: scroll` → `scroll-view` 等）读取 [与 webview 的关键样式差异及替代方案](./references/skyline-style-reference.md#与-webview-模式的关键样式差异及兼容方案)。
- 增加配置 `defaultContentBox` `defaultDisplayBlock` 默认样式对齐 webview。
- 文本溢出省略适配（`text-overflow: ellipsis`），需新增 Skyline 特有属性 overflow 与 max-lines，阅读 [适配最佳实践 · 文本溢出省略适配](./references/skyline-migration-practice.md#文本溢出省略适配)。
- `flex-basis: auto; min-width: 25%` 同时使用的场景下，`min-width` 的百分比不生效，需替换为 rpx 单位 `flex 1 0 auto; min-width: 25%;` → `flex 1 0 auto; min-width 187rpx`（mpx/小程序里 rpx 是按"设计稿基准 750rpx = 屏幕宽度"的方式设计的，所以 750rpx 默认就代表 100% 屏宽，750rpx * 25% = 187.5rpx），详见 [样式能力参考·百分比支持情况](./references/skyline-style-reference.md#百分比支持情况)
- 媒体查询 `@media screen` 替换为动态类，详见[适配最佳实践 · @media screen 替换方案](./references/skyline-migration-practice.md#media-screen-替换方案)

#### 4. 组件适配改造

- 读取 [组件支持参考](./references/skyline-component-reference.md)，对 `<template>` 中使用的组件及其属性与事件逐一核对 Skyline 支持情况。
- `scroll-view` 必须指定 `type`。
- 配置 `tagNameStyleIsolation": "legacy"` 自定义组件样式隔离处理对齐 webview。
- `picker-view` skyline 下默认会有上下边框，适配 skyline 时没有自定义边框时需设置 `indicator-style="border: none;"` 去除默认边框，`indicator-style` 仅支持 `height`、`border`、`background-color`。

#### 5. 检查与确认

按 SFC 各区块逐项核对：

**跨渲染模式兼容**
- [ ] 引入的 Skyline 专属写法均已通过运行时判断隔离，且引入 Skyline 专属写法时 WebView 原有写法保留。

**页面配置**
- [ ] 全局配置：顶层 `lazyCodeLoading`；`rendererOptions.skyline` 下 `defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` 四项齐全。页面配置 `renderer` / `componentFramework` / `disableScroll` / `navigationStyle` 均已添加。
- [ ] 使用 worklet 函数时已配置 Babel 插件，详见 [配置参考 · Worklet Babel 插件](./references/skyline-configuration.md#worklet-babel-插件)。

**布局**
- [ ] 默认布局模式已处理（app.json 配置 `defaultDisplayBlock`）。
- [ ] 页面滚动已替换为 `scroll-view type="list"`。
- [ ] 原 `onPullDownRefresh` / `onReachBottom` / `onPageScroll` 已迁移到 scroll-view 的 `bindrefresherrefresh` / `bindscrolltolower` / `bindscroll`。
- [ ] 横向 scroll-view 已满足`enable-flex` + 自身 `display:flex;flex-direction:row` + 子节点 `flex-shrink:0`。
- [ ] 自定义导航已替代默认导航。
- [ ] `inline` / `inline-block` 节点确认已**补齐 flex 容器属性**（`display:flex` + `flex-direction`）或改 `text` / `span`。
- [ ] `position: sticky` 已替换为 `sticky-header` / `sticky-section`。

**样式**
- [ ] 不支持选择器（`*` / `[attr]` 等）已替代。
- [ ] `overflow: scroll` 已替换为 `scroll-view`；不单独设置 `overflow-x` / `overflow-y`。
- [ ] 有文本溢出的省略样式`text-overflow` 的组件或节点逐个确认对应节点为 `<text>` 且带 `max-lines` + `overflow="ellipsis"` 属性。
- [ ] 字体 PostScript name 已兼容（`font-weight` 使用 `bold` / `700`）。
- [ ] `@font-face` 已声明 ttf 格式。
- [ ] 伪元素 `animation` 不支持已处理。
- [ ] 所有非 0 的 `border-radius` 选择器（即排除 `border-radius: 0`），逐个核对所属选择器的 `border-color` / `border-style` 四边一致。
- [ ] `box-shadow` 不使用多个叠加。
- [ ] `display: flex; flex-direction: row` 逐个确认带 `align-items: center`。

**组件**
- [ ] 不支持组件已有替代方案或单独配置 `renderer: "webview"` 页面。
- [ ] 逐个确认所有 `<scroll-view>` 标签已指定 `type` 属性（嵌套场景每层都需声明，外层 `type="nested"`、内层 `type="list"` / `"custom"`）。
- [ ] 横向 scroll-view 已满足 `enable-flex` + 自身 `display:flex;flex-direction:row` + 子节点 `flex-shrink:0`。
- [ ] `sticky-header` 显式声明背景色（避免吸顶透字穿透），且是 `sticky-section` 的第一个子节点。
- [ ] `<navigator>` 内仅嵌套 `<text>` 或纯文本；
- [ ] 图文混排已用 `<span>` 包裹——排查「文字与图标/图片同行内联」的节点确认已用 `<span>` 内联包裹。
- [ ] scroll-view 自适应高度场景已开启 `enableScrollViewAutoSize` 或采用动态获取高度方案。
- [ ] glass-easel 下 properties 默认值使用 `value` 而非 `default`。
- [ ] wx:for 绑定 computed 属性已提供 initData 默认值防护。
- [ ] properties type 校验异常已处理（`type: null` 或 `initData`）。

## 任务二：创建符合 Skyline 兼容规范的页面

### 输入

用户描述的页面需求，包括视图结构、交互、数据来源、是否需要使用 worklet 增强特性等。

### 输出

完整的 `.mpx` 页面文件，结构包含 `<template>`、`<script>`、`<style>` 与 JSON 配置区块。代码须直接满足 [通用约束与适配原则](#通用约束与适配原则)，避免新建后再走一轮适配改造。

### 任务流程

#### 1. 设计阶段

- 与用户对齐需求要点：页面视图结构、数据流、是否需要 Skyline 增强特性（worklet 动画、手势、自定义路由）。
- 若页面需要交互动画或自定义转场，读取 [适配最佳实践 · Worklet 动画适配](./references/skyline-migration-practice.md#worklet-动画适配) 及 [Worklet 动画](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/worklet.html) / [手势系统](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/gesture.html) 官方文档，确定增强方案。

#### 2. 实施阶段

按 SFC 各区块依次实现，全程遵循 [通用约束与适配原则](#通用约束与适配原则)：

- **JSON 配置**：页面必须配置 `renderer: 'skyline'`、`componentFramework: 'glass-easel'`、`disableScroll: true`、`navigationStyle: 'custom'`。读取 [配置参考](./references/skyline-configuration.md) 确认项目全局配置。
- **`<template>`**：读取 [组件支持参考](./references/skyline-component-reference.md)，仅选用 Skyline 支持的组件、属性与事件；`scroll-view` 必须指定 `type`；页面滚动使用 `scroll-view` 包裹；文本内容使用 `<text>` 组件。
- **`<style>`**：读取 [样式能力参考](./references/skyline-style-reference.md) 与 [适配最佳实践](./references/skyline-migration-practice.md)，从一开始就使用 flex 布局、`rpx` 单位、双冒号伪元素、`text` 组件限定属性等 Skyline 兼容写法。
- **`<script>`**：通过 `this.renderer === 'skyline'` 判断渲染模式，Skyline 专属逻辑做运行时隔离；需要 worklet 能力时按 [配置参考 · Worklet Babel 插件](./references/skyline-configuration.md#worklet-babel-插件) 配置 Babel 插件。

#### 3. 检查与确认

复用 [任务一 · 检查与确认](#5-检查与确认) 的清单，确认新建页面不引入任何 Skyline 不兼容写法。
