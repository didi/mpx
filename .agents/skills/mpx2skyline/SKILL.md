---
name: mpx2skyline
description: |
  微信小程序 WebView 适配 Skyline 渲染引擎指南，覆盖布局、样式、组件、配置四大维度。
  当用户要求对已有微信小程序页面进行 Skyline 适配改造、创建符合 Skyline 兼容规范的页面、
  排查 Skyline 下样式不生效/组件不渲染/布局异常/层级错乱等问题、或查询某项能力在
  Skyline 下的支持情况时强制调用。当用户问题不涉及 Skyline 适配时不应调用，如
  Mpx 输出 RN 问题、支付宝小程序问题、纯 webview 小程序开发问题等。
metadata:
  version: "1.0.0"
---

# 微信小程序适配 Skyline 渲染引擎指南

## 背景介绍

Skyline 是微信小程序新一代渲染引擎，旨在替代 WebView 渲染以获得更接近原生的性能和体验。与 WebView 模式相比，Skyline 在布局模型、层叠机制、样式能力、组件支持、页面行为上存在系统性差异。

本 SKILL 面向以下两类任务：

1. **任务一**：对已有的 WebView 页面进行 Skyline 适配改造（已在 WebView 模式下运行，需补齐 Skyline 兼容性）。
2. **任务二**：从零创建一个符合 Skyline 兼容规范的页面。

## 知识库索引

| 知识库 | 说明                                             |
| --- |------------------------------------------------|
| [Skyline 基础组件支持与差异参考](./references/skyline-component-reference.md) | 查询组件支持情况与差异，涉及不支持组件的替代方案、Skyline 新增组件、组件使用注意事项 |
| [Skyline WXSS 样式能力参考](./references/skyline-style-reference.md) | 查询样式属性/选择器/单位是否支持，逐属性支持详情与 WebView 差异对比        |
| [WebView→Skyline 适配改造最佳实践](./references/skyline-migration-practice.md) | 进行适配改造时读取，覆盖布局适配、样式适配、组件适配、层叠适配的完整实操方案         |
| [Skyline 配置项与接入规范参考](./references/skyline-configuration.md) | 接入代码配置等项目级配置时读取                                |
| [Worklet 动画](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/worklet.html) | 使用 worklet 动画 Skyline 增强特性时读取                  |
| [手势系统参考](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/gesture.html) | 使用 手势系统 Skyline 增强特性时读取                        |


### 知识库使用建议

参考文档体量较大，**不要一次性预读全部参考**，按需取用即可：

1. **入口只读本 SKILL.md**：完整读完本文档（含下方通用约束与任务流程）足以覆盖 80% 常见场景的判断；不要在动笔前预读 references 目录。
2. **触发式读取**：只在任务流程或通用约束中**明确指向**某份参考时读取，且仅读取与当前问题相关的小节（参考文档均含目录与章节锚点，使用 grep / 锚点跳读，不要整文件 Read）。
3. **典型任务的最小阅读集**（仅当本 SKILL.md 已无法判断时再补充）：
   - 已有页面 Skyline 适配改造：识别问题维度后再读对应参考的相关小节，通常 1–2 份足够（如布局+样式改造主要查 `skyline-migration-practice.md`）。
   - 新建 Skyline 兼容页面：先按本 SKILL.md 的通用约束起手，遇到能力存疑（某属性是否支持、某组件是否存在）时再点查对应参考。
   - 排查 Skyline 下特定问题：直接定位到问题维度的参考文档相关小节。

## 通用约束与适配原则

### 跨渲染模式兼容约束

产物代码须在 WebView 模式与 Skyline 模式下均能正常运行。引入「Skyline 支持但 WebView 不需要」的写法时，**不要替换 WebView 原有写法**，而应：

- 通过运行时判断 `this.renderer === 'skyline'` 隔离 Skyline 专属逻辑；
- WebView 原有写法保持不变，避免适配引入 WebView 行为退化。
- 特定版本支持的 Skyline 特性按支持处理，不做低版本兼容（如 `position: fixed` 8.0.43+ 支持、`:nth-child` 8.0.50+ 支持）。

该原则贯穿布局 / 样式 / 组件 / 配置四个维度。

### 布局（layout）约束

1. **默认布局差异**：Skyline 默认 `display: flex`，WebView 默认 `display: block` → 配置 `defaultDisplayBlock` 或改造为显式 flex 写法。
2. **页面滚动**：Skyline 不支持页面滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发 → 使用 `scroll-view type="list"` 替代，页面需声明 `disableScroll: true`。
3. **自定义导航**：Skyline 不支持默认导航 → 自定义导航栏，页面需声明 `navigationStyle: 'custom'`。
4. **z-index 与层叠**：z-index 仅兄弟节点生效，无层叠上下文机制 → 需重构层级结构为兄弟节点，全局层级使用 `root-portal`。详见 [适配最佳实践 · z-index 与层叠适配](./references/skyline-migration-practice.md#z-index-与层叠适配)。
5. **inline / inline-block**：Skyline 不支持 inline 和 inline-block 布局 → 使用 `<text>` 组件、`<span>` 组件或 flex 布局替代。

### 样式（style）约束

1. **选择器**：不支持通配选择器 `*` 和属性选择器 `[attr]`；伪元素仅 `::before` / `::after` 且**必须双冒号**；`:nth-child` 需 8.0.50+。详见 [样式能力参考 · 选择器支持](./references/skyline-style-reference.md#选择器支持)。
2. **单位**：避免 `em` / `currentColor`，使用 `rpx` / `px` / `rem`。
3. **overflow**：`overflow: scroll` 不支持 → 使用 `scroll-view` 组件；不支持单独设置 `overflow-x` / `overflow-y`。
4. **text 限定属性**：`text-decoration` / `text-overflow` 仅 `text` 节点生效 → `view` 内文字需用 `<text>` 包裹。
5. **边框一致性**：`border-radius` 非 0 时四边 `border-color` / `border-style` 需一致。
6. **box-sizing 默认值**：Skyline 默认 `border-box`（WebView 默认 `content-box`），遇到 padding 未撑开布局时手动指定 `box-sizing: content-box`。
7. **伪元素 animation**：Skyline 下伪元素的 `animation` 不生效 → 使用真实节点 + CSS animation。
8. **font-weight**：部分机型不支持 `font-weight: 500` / `600` 数值加粗，需使用 `bold` / `700`。
9. **box-shadow**：不支持多个叠加。
10. **不支持 CSS 属性**：`float` / `contain` / `resize` / `writing-mode` / `text-indent` / `overflow-wrap` / `background-attachment` / `background-clip` / `background-origin` / `mask-origin` / `mask-clip` / `mask-mode` / `justify-items` 等属性设置后静默不生效，需替换为等效方案。详见 [样式适配 · 不支持的 CSS 属性](./references/skyline-migration-practice.md#不支持的-css-属性)。
11. **渐变与背景多值限制**：`radial-gradient` 仅支持 `circle`（不支持 `ellipse`）；`background-image` / `mask-image` 最多支持 2 个值；`background-repeat` / `background-size` 不支持多组值。详见 [样式适配 · 渐变与背景多值限制](./references/skyline-migration-practice.md#渐变与背景多值限制)。
12. **filter / backdrop-filter**：不支持 `url()` / `drop-shadow()` 及多函数组合；用 `box-shadow` 替代 `drop-shadow`。详见 [样式适配 · filter / backdrop-filter 限制](./references/skyline-migration-practice.md#filter--backdrop-filter-限制)。
13. **text-decoration-line 单值**：仅支持单个值，多值组合（如 `underline line-through`）不生效。
14. **calc() 不支持角度**：`calc()` 支持长度计算但不支持角度类型，需直接写角度值（如 `135deg`）。

### 组件（component）约束

1. **scroll-view 必须指定 type**：`<scroll-view type="list">`，Skyline 下缺少 type 属性将无法正常工作。
2. **横向滚动需 enable-flex**：scroll-view 横向滚动需同时开启 `enable-flex` 以兼容 WebView。
3. **不支持组件**：`web-view` / `movable-area` / `movable-view` / `editor` / `progress` / `navigation-bar` → 使用替代方案，详见 [组件支持参考](./references/skyline-component-reference.md)。
4. **自定义组件样式隔离**：`tag` / `id` 选择器不支持跨自定义组件匹配，`class` 遵循组件样式隔离机制。

[//]: # (5. **组件根节点**：默认 `block` + `relative`，宽高 `100%` 可能失效。)
[//]: # (6. **不使用 WebView-only** image 的 WebView-only 裁剪模式（`top` / `bottom` / `center` / `left` / `right`）)

### 配置（config）约束

1. **app.json 三项必需**：`renderer: "skyline"`、`componentFramework: "glass-easel"`、`lazyCodeLoading: "requiredComponents"` 三项必须同时配置，缺少任何一项会导致 Skyline 功能不完整或编译报错。详见 [页面配置适配 · app.json 全局配置三项必需](./references/skyline-migration-practice.md#appjson-全局配置三项必需)。

### 滚动 API（Scroll API）约束

1. **ScrollViewContext 需 enhanced 属性**：通过 `NodesRef.node()` 获取 `ScrollViewContext` 时，`scroll-view` 必须开启 `enhanced` 属性，否则返回的不是 ScrollViewContext 实例。详见 [Scroll API 适配 · ScrollViewContext：必须开启 enhanced 属性](./references/skyline-migration-practice.md#scrollviewcontext必须开启-enhanced-属性)。
2. **worklet.scrollViewContext 必须通过 ref() 获取**：在 worklet 中控制滚动须用 `NodesRef.ref()` + `SharedValue`，不能用 `node()`（`node()` 返回的是逻辑线程 ScrollViewContext，无法在 UI 线程使用）。详见 [Scroll API 适配 · worklet.scrollViewContext：必须通过 ref 获取](./references/skyline-migration-practice.md#workletscrollviewcontext必须通过-ref-获取)。
3. **worklet.scrollViewContext.scrollTo 只能在 worklet 中调用**：调用该 API 的函数必须声明 `'worklet'` 指令（仅 UI 线程可用），且不支持小程序插件。详见 [Scroll API 适配 · worklet.scrollViewContext.scrollTo：调用函数必须声明 'worklet' 指令](./references/skyline-migration-practice.md#workletscrollviewcontextscrollto调用函数必须声明-worklet-指令)。
4. **DraggableSheetContext.scrollTo 的 size 与 pixels 互斥**：同时传入时仅 `size` 生效，`pixels` 被静默忽略。详见 [Scroll API 适配 · DraggableSheetContext：size 和 pixels 不可同时传入](./references/skyline-migration-practice.md#draggablesheetcontextsize-和-pixels-不可同时传入)。

### Worklet 动画约束

1. **必须声明 'worklet' 指令**：在 UI 线程执行的函数（手势/滚动回调等）必须在函数顶部声明 `'worklet'` 字符串，缺少指令将在逻辑线程执行，导致动画延迟。详见 [Worklet 动画适配 · worklet 函数必须声明 'worklet' 指令](./references/skyline-migration-practice.md#worklet-函数必须声明-worklet-指令)。
2. **SharedValue 通过 .value 读写**：`wx.worklet.shared()` 创建的共享变量必须通过 `.value` 读写，直接赋值会替换对象本身导致动画驱动失效。详见 [Worklet 动画适配 · SharedValue 必须通过 .value 读写](./references/skyline-migration-practice.md#sharedvalue-必须通过-value-读写)。
3. **worklet 中调用普通函数必须使用 runOnJS**：worklet 运行在 UI 线程，不能直接调用页面方法或 `wx.*` API，必须通过 `runOnJS` 切换回 JS 线程。详见 [Worklet 动画适配 · 在 worklet 中调用普通函数必须使用 runOnJS](./references/skyline-migration-practice.md#在-worklet-中调用普通函数必须使用-runonjs)。
4. **runOnJS 调用页面方法必须 bind(this)**：通过 `runOnJS` 调用页面方法前必须先 `bind(this)`，否则 `this` 指向丢失。详见 [Worklet 动画适配 · 页面方法必须通过 bind(this) 绑定后传入 runOnJS](./references/skyline-migration-practice.md#页面方法必须通过-bindthis-绑定后传入-runonjs)。
5. **禁止在 worklet 中解构 this.data**：解构赋值会触发 `Object.freeze` 冻结 `this.data`，导致页面后续所有 `setData` 失效。详见 [Worklet 动画适配 · 禁止在 worklet 中解构 this.data](./references/skyline-migration-practice.md#禁止在-worklet-中解构-thisdata)。

## 任务一：对已有 WebView 页面进行 Skyline 适配改造

### 输入

基于 WebView 模式编写的 `.mpx` 页面（已在微信 WebView 模式下运行，但未适配 Skyline）。

### 输出

以用户指示为准；若无特殊指示则默认在原文件中进行修改。输出修改后代码时应输出完整页面代码，避免使用省略号，确保用户可以直接复制或应用修改。

### 任务流程

#### 1. 页面配置适配

- 页面 json 新增 `renderer: 'skyline'`、`componentFramework: 'glass-easel'`、`disableScroll: true`、`navigationStyle: 'custom'`。
- 读取 [配置参考](./references/skyline-configuration.md) 确认全局 skyline 配置（`lazyCodeLoading` / `rendererOptions` 等）是否已就绪。

#### 2. 布局适配改造

- 读取 [适配最佳实践 · 布局适配](./references/skyline-migration-practice.md#布局适配)，对页面的布局与层叠逐一核对 Skyline 兼容性。
- 默认 flex 布局差异处理（`defaultDisplayBlock` 或显式 flex 写法）。
- 页面滚动 → `scroll-view type="list"` 替代。
- 自定义导航替代默认导航。
- inline / inline-block → `<text>` / `<span>` 替代。

#### 3. 样式适配改造

- 读取 [样式能力参考](./references/skyline-style-reference.md) 检查 `<style>` 中所有样式属性的 Skyline 支持情况。
- 读取 [适配最佳实践 · 样式适配](./references/skyline-migration-practice.md#样式适配) 改造为 Skyline 兼容实现。
- 伪元素单冒号 → 双冒号（全局搜索 `([^:]):((before)|(after))` 替换为 `$1::$2`）。
- 不支持选择器替代（`*` → 类选择器、`[attr]` → 类选择器、`:nth-child` 低版本 → 动态类）。
- 不支持属性替代或运行时隔离（`overflow: scroll` → `scroll-view` 等）。
- box-sizing 差异处理。
- 文本溢出省略适配（`text-overflow: ellipsis` 仅 `text` 组件生效）。
- 字体 PostScript name 兼容。

#### 4. 组件适配改造

- 读取 [组件支持参考](./references/skyline-component-reference.md)，对 `<template>` 中使用的组件及其属性与事件逐一核对 Skyline 支持情况。
- `scroll-view` 必须指定 `type`。
- 自定义组件样式隔离处理。
- 组件根节点表现异常处理。

#### 5. 检查与确认

按页面各部分逐项核对：

**跨渲染模式兼容**
- [ ] 引入的 Skyline 专属写法均已通过运行时判断隔离；WebView 原有写法未因 Skyline 适配而被替换或删除。

**页面配置**
- [ ] 页面 `renderer` / `componentFramework` / `disableScroll` / `navigationStyle` 配置已添加。
- [ ] 全局 skyline 配置（`lazyCodeLoading` / `rendererOptions`）已就绪。

**布局**
- [ ] 默认布局模式已处理（flex vs block / `defaultDisplayBlock`）。
- [ ] 页面滚动已替换为 `scroll-view type="list"`。
- [ ] 自定义导航已替代默认导航。
- [ ] `inline` / `inline-block` 已替换为 `text` / `span` 或 flex 方案。
- [ ] `position: sticky` 已替换为 `sticky-header` / `sticky-section`。

**样式**
- [ ] 伪元素已改为双冒号 `::` 声明。
- [ ] 不支持选择器（`*` / `[attr]` 等）已替代。
- [ ] `overflow: scroll` 已替换为 `scroll-view`；不单独设置 `overflow-x` / `overflow-y`。
- [ ] `text-decoration` / `text-overflow` 等 text 限定属性已确保仅在 `text` 节点使用。
- [ ] `box-sizing` 差异已处理。
- [ ] 字体 PostScript name 已兼容（`font-weight` 使用 `bold` / `700`）。
- [ ] 伪元素 `animation` 不支持已处理。
- [ ] `border-radius` 非 0 时 `border-color` / `border-style` 四边一致性已检查。
- [ ] `box-shadow` 不使用多个叠加。
- [ ] `/*use rpx*/` / `/*use px*/` 单位注释已保留。

**组件**
- [ ] 不支持组件已有替代方案或单独配置 `renderer: "webview"` 页面。
- [ ] `scroll-view` 已指定 `type` 属性。
- [ ] 自定义组件样式隔离已处理（tag/id 不跨组件、class 遵循隔离）。
- [ ] 组件根节点行为已检查（默认 block + relative、宽高 100% 可能失效）。
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
- 若页面需要交互动画或自定义转场，读取 [Worklet 动画与手势系统参考](./references/skyline-worklet-animation.md)，确定增强方案。

#### 2. 实施阶段

按 SFC 各区块依次实现，全程遵循 [通用约束与适配原则](#通用约束与适配原则)：

- **JSON 配置**：页面必须配置 `renderer: 'skyline'`、`componentFramework: 'glass-easel'`、`disableScroll: true`、`navigationStyle: 'custom'`。读取 [配置参考](./references/skyline-configuration.md) 确认项目全局配置。
- **`<template>`**：读取 [组件支持参考](./references/skyline-component-reference.md)，仅选用 Skyline 支持的组件、属性与事件；`scroll-view` 必须指定 `type`；页面滚动使用 `scroll-view` 包裹；文本内容使用 `<text>` 组件。
- **`<style>`**：读取 [样式能力参考](./references/skyline-style-reference.md) 与 [适配最佳实践](./references/skyline-migration-practice.md)，从一开始就使用 flex 布局、`rpx` 单位、双冒号伪元素、`text` 组件限定属性等 Skyline 兼容写法。
- **`<script>`**：通过 `this.renderer === 'skyline'` 判断渲染模式，Skyline 专属逻辑做运行时隔离；需要 worklet 能力时按 [Worklet 参考](./references/skyline-worklet-animation.md) 配置 Babel 插件。

#### 3. 检查与确认

复用 [任务一 · 检查与确认](#5-检查与确认) 的清单，确认新建页面不引入任何 Skyline 不兼容写法。
