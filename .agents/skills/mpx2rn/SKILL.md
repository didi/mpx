---
name: mpx2rn
description: Mpx 跨端输出 RN（简称 Mpx2RN 或 Mpx2DRN）的开发适配指南，覆盖模板、脚本、样式、JSON 配置四大维度。当用户进行 Mpx2RN 相关任务时强制调用，包括但不限于：技术方案设计、页面 / 组件的开发迭代、旧项目跨端适配改造、编译和运行时报错排查、Code Review 等。当用户问题不涉及 Mpx2RN 时不应调用，如 Mpx 小程序开发问题，RN 原生开发问题、Mpx2Web 相关问题等。
metadata:
  version: "2.12.5"
  author: donghongping
---

# Mpx 跨端输出 RN 开发与适配指南

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。Mpx2RN 在编译时和运行时对模板、脚本、样式与 JSON 配置四大维度的开发能力进行了全面抹平，但与小程序、Web 平台仍存在一定能力差异。

### 适用场景

本 SKILL 是 Mpx2RN 开发适配的统一指南，覆盖模板、脚本、样式、JSON 配置四大维度。涉及 Mpx2RN 的任务均应在动笔前阅读本 SKILL 的 [Mpx2RN 跨端开发约束](#mpx2rn-跨端开发约束)，包括但不限于：

- **技术方案设计**：评估需求在 RN 平台的可行性、跨端兼容方案选型、是否需要文件级条件编译或混合开发等;
- **旧项目跨端适配改造**：对已基于小程序规范编写、未适配 RN 的存量组件进行兼容性补齐（参见下文[任务一](#任务一对小程序-mpx-组件进行-rn-跨端适配改造)）;
- **页面 / 组件开发迭代**：从零编写或迭代符合 RN 跨端兼容规范的 `.mpx` 页面与组件（参见下文[任务二](#任务二创建符合-rn-跨端兼容规范的-mpx-组件)）;
- **编译和运行时报错排查**：定位 RN 平台特有的编译错误（如样式空选择器、保留关键字、缩进敏感预处理器报错等）与运行时差异;
- **Code Review**：以本 SKILL 的 [Mpx2RN 跨端开发约束](#mpx2rn-跨端开发约束)为标准对照检查跨端兼容性。

### 不适用场景

以下场景与 Mpx2RN 无关，**不应调用**本 SKILL：

- 仅面向小程序平台（微信、支付宝、百度等）的 Mpx 开发问题;
- React Native 原生开发问题（不经 Mpx 编译的纯 RN 项目）;
- Mpx 跨端输出 Web（Mpx2Web）相关问题。

## 知识库索引

| 知识库 | 说明 |
| --- | --- |
| [项目结构与单文件组件](./references/project-structure-and-single-file-component.md) | Mpx 项目的典型目录、页面与组件注册关系，以及 `.mpx` 单文件组件的基本结构与语法 |
| [条件编译](./references/conditional-compile.md) | 模板、脚本、样式、JSON 等不同部分的条件编译语法，遇到无法跨端等效实现需分平台处理时读取 |
| [跨端输出 RN 模板能力参考](./references/rn-template-reference.md) | 模板部分跨端能力详情：数据绑定、模板指令、事件、Slot、WXML 模板、i18n、无障碍访问、基础组件清单及其属性/事件支持情况 |
| [跨端输出 RN 脚本能力参考](./references/rn-script-reference.md) | 脚本部分跨端能力详情：构造选项、生命周期、实例方法/属性、组合式 API、运行时导出、状态管理 |
| [跨端输出 RN 样式能力参考](./references/rn-style-reference.md) | 样式部分跨端能力详情：选择器、单位、颜色、文本继承、CSS 变量、媒体查询、动画、背景图与逐项样式属性支持情况；明确查询某项样式能力是否支持时直接读取 |
| [跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md) | 常用选择器与样式属性的跨端兼容方案；样式适配或开发时优先读取并直接应用命中的场景，未命中时再查样式能力参考 |
| [Mpx2RN 原子 CSS 能力参考](./references/rn-atomic-css.md) | 基于 UnoCSS 的 RN 原子类接入、工具类、variants、directives 与 variant groups 支持范围、颜色透明度约束及编译排查；项目启用原子类或任务涉及 utility class 时读取 |
| [跨端输出 RN 环境 API 参考](./references/rn-api-reference.md) | `@mpxjs/api-proxy` 提供的环境 API 跨端支持情况，涉及网络、存储、界面、设备、媒体、位置等 |
| [跨端输出 RN JSON 配置参考](./references/rn-json-reference.md) | 应用、页面、组件三层 JSON 配置在 RN 平台的支持范围与差异 |
| [Mpx 与 RN 混合开发](./references/rn-hybrid-dev.md) | 在 `.mpx` 内直接使用 React Native 组件、Hooks 的方式与跨端隔离方案 |

### 知识库使用建议

参考文档体量较大，**不要一次性预读全部参考**，按需取用即可：

1. **固定入口**：完整读取本 `SKILL.md`；不要在动笔前预读 references 目录，完成实现后重新按本 SKILL 的跨端开发约束逐项核实。
2. **触发式读取**：只在任务流程或跨端开发约束中**明确指向**某份参考时读取，且仅读取与当前问题相关的小节（参考文档均含目录与章节锚点，使用 grep / 锚点跳读，不要整文件 Read）。
3. **典型任务的最小阅读集**（仅当本 SKILL 已无法判断时再补充）：
   - 已有组件 RN 跨端适配改造：识别问题维度后再读对应能力参考的相关小节，通常 1–2 份足够（如样式改造主要查 `rn-style-practice.md`）。
   - 新建 RN 跨端兼容组件：先按本 SKILL 的跨端开发约束起手，遇到能力存疑（某属性是否支持、某 API 是否存在）时再点查对应参考。
   - 排查特定编译报错：直接定位到报错维度的能力参考相关小节。
   - 使用或排查原子类：读取 `rn-atomic-css.md`；仅需核对底层样式属性时再补读 `rn-style-reference.md`，不要预读全部样式参考。
4. **样式参考的读取顺序**：样式适配或开发时，优先读取 `rn-style-practice.md` 的相关小节，存在命中场景则直接应用；未命中相关内容时，再读取 `rn-style-reference.md` 的相关小节获取更广泛的知识参考。只有当任务明确查询某项样式能力是否支持时，才直接读取 `rn-style-reference.md`。
5. **何时读取 `project-structure-and-single-file-component.md`**：仅当不熟悉 Mpx 项目结构、页面与组件注册关系或 SFC 基本结构时读取；已熟悉相关写法可跳过。

## Mpx2RN 跨端开发约束

无论是适配改造、新建组件还是 Code Review，都应遵循以下约束。开始实现前以本节指导开发，完成实现后再按本节逐项核实。

### 跨平台兼容约束

产物代码须在原平台与 RN 平台均能正常运行。引入 `numberOfLines@ios|android|harmony`、`hairlineWidth` 等仅 RN 生效的写法时，通过条件编译限定在 RN 输出，并同步保留原平台原有写法，避免 RN 适配造成原平台行为退化。

### 模板开发约束

1. **基础组件优先**：仅使用[模板能力参考 · 基础组件](./references/rn-template-reference.md#基础组件)中标注 RN 支持的基础组件、属性与事件；不支持项通过模板条件编译隔离。若用户通过 `rnConfig.customBuiltInComponents` 扩展了能力，以用户说明为准。
2. **页面滚动**：RN 页面默认不可滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发；需要滚动时使用 `scroll-view` 及其等效能力。
3. **事件冒泡与捕获**：仅对基础通用事件 `tap` / `longpress` / `touchstart` / `touchmove` / `touchend` / `touchcancel` 使用冒泡和捕获语义。
4. **模板内方法调用**：模板 Mustache 表达式不调用普通方法，相关逻辑使用 `computed` / `wxs` 实现；i18n 翻译函数除外。
5. **i18n 函数命名**：组合式 API 中 `useI18n()` 解构出的翻译函数以原名 `t` / `tc` / `te` / `tm` 暴露给模板，不要重命名。
6. **事件传参**：自定义参数优先通过内联传参语法（如 `bindtap="handleTap('param')"`）传递，不要使用 `data-` dataset 属性绕行传参。
7. **文字节点**：文字内容优先由 `text` 显式包裹，避免依赖框架为 `view` 中的裸文字补节点；跨平台布局对齐方案见[样式开发最佳实践 · text 跨平台布局对齐](./references/rn-style-practice.md#text-跨平台布局对齐)。
8. **动态样式绑定**：动态 `class` / `style` 使用 `wx:class` / `wx:style` 指令，不要在属性值内使用 `{{}}` 拼接。
9. **selector 映射**：selector 类 API 引用的模板节点须声明空 `wx:ref`，完成编译期映射。

### 脚本开发约束

1. **生命周期与构造选项**：仅使用[逻辑能力参考](./references/rn-script-reference.md)中标注 RN 支持的生命周期、构造选项和实例方法；`onShareTimeline` / `onTabItemTap` / `onAddToFavorites` / `onSaveExitState` 等不支持项不得直接用于 RN 产物。
2. **环境 API**：统一通过 `@mpxjs/api-proxy` 提供的 `mpx.xxx` 调用环境能力，不要直接使用 `wx.xxx` / `my.xxx`；具体支持范围以[环境 API 参考](./references/rn-api-reference.md)为准。若用户通过 `custom` 配置扩展了能力，以用户说明为准。
3. **selector API**：`selectComponent` / `selectAllComponents` / `createSelectorQuery` / `createIntersectionObserver` 等 selector API 仅使用 `#id` / `.class`，且对应模板节点须声明空 `wx:ref`。详见[逻辑能力参考 · 页面 / 组件实例方法与属性](./references/rn-script-reference.md#页面--组件实例方法与属性)。
4. **保留关键字**：挂载到实例上的数据 key（包括 `props` / `data` / `computed` / `methods` / `setup return` / `inject` 等）不得使用 `id` / `dataset` / `data`，避免触发 `reserved keyword of miniprogram` 错误。
5. **`<script setup>` 显式暴露**：模板引用的数据与方法须通过 `defineExpose()` 显式声明，不要暴露模板未使用的大型 store、RN 原生对象等无 UI 数据。

### 样式开发约束

1. **能力判断口径**：样式属性是否支持以[样式能力参考](./references/rn-style-reference.md)为准，不要以 RN 原生样式能力为准；Mpx2RN 已抹平支持的简写属性、CSS 变量、`calc()`、媒体查询、`rpx`、颜色格式和文本继承等能力无需额外替换或条件编译。
2. **选择器单类化**：展开预处理语言中的嵌套选择器，不要使用复合选择器、伪类或伪元素等 RN 不支持的选择器；改为单类等效实现后，同步更新 `<template>` 与 `<script>` 中的引用。逗号分隔的并列单类选择器可以直接使用。
3. **动态样式绑定**：优先使用 `wx:class` / `wx:style` 指令，不要在 `class` / `style` 属性中拼接 `{{}}` 插值表达式。
4. **按需样式能力预声明**：基础组件的 CSS 变量、文本样式与文本属性透传、背景图像、API 动画或 transition 可能在首次渲染后由动态样式或属性引入时，分别通过 `enable-var` / `enable-text-pass-through` / `enable-background` / `enable-animation` 在首次渲染时预声明；`hover-class` 的存在状态和 `enable-animation` 的动画类型在同一组件实例生命周期内保持稳定。仅普通值变化且能力类型始终存在时无需冗余预声明。详见[样式开发最佳实践 · 按需样式能力预声明](./references/rn-style-practice.md#按需样式能力预声明)。
5. **节点复用与 Hook 稳定性**：条件分支或列表渲染可能复用同一基础组件节点，且各分支或列表项使用的按需样式能力不一致时，优先提供独立且稳定的 `key` / `wx:key`；无法提供时，按所有可能能力的并集在每个可能复用的节点上添加 `enable-*` 预声明，避免复用前后改变 Hook 调用。
6. **跨端兼容方案优先**：优先采用[样式开发最佳实践](./references/rn-style-practice.md)中的跨端兼容方案，根据具体方案的平台兼容性选择处理方式：
   - **等效替换**：适配方案在原平台与 RN 平台均生效时，直接在全平台应用；例如将复合选择器改为等效单类选择器、将伪元素改为真实节点、将 `grid` / `float` 改为 Flex 布局。
   - **双轨保留**：适配方案仅在 RN 侧生效无法在原平台生效时，通过条件编译保留原平台原写法，禁止只保留 RN 侧。例如文本溢出在原平台保留原样式、RN 侧使用 `numberOfLines@ios|android|harmony`；1rpx 极细线在原平台保留 `1rpx` 边框、RN 侧使用 `hairlineWidth`。
7. **保留单位注释**：保留原始样式中的 `/*use rpx*/` 与 `/*use px*/` 注释，编译期会据此批量切换样式单位。
8. **原子 CSS**：项目启用 UnoCSS 或模板使用原子类时，仅使用[Mpx2RN 原子 CSS 能力参考](./references/rn-atomic-css.md)中标注 RN 支持的工具类与 variants；动态类须可被静态提取或加入 `safelist`；颜色透明度使用 `bg-red-500/50` 等斜杠 alpha 语法，不要使用独立 `*-opacity-*` 组合。
9. **垂直 margin 折叠**：按模板中的实际节点关系审计垂直 margin，并展开理解 `margin` 简写与长写。仅对确认在原平台发生折叠且同一间距由两侧共同表达的节点，将折叠后的有效间距归到单侧；先排除 Flex / Grid、浮动、`position: absolute/fixed`、clearance、父子关系中的 BFC 与分隔条件、空块阻断条件等不折叠场景，无法确认时保持原样。详见[样式开发最佳实践 · 处理垂直 margin 折叠](./references/rn-style-practice.md#处理垂直-margin-折叠)。

### JSON 配置开发约束

1. **支持范围**：应用、页面与组件配置字段须在[JSON 配置参考](./references/rn-json-reference.md)标注的 RN 支持范围内；`tabBar` 等不支持字段通过条件编译隔离。
2. **动态生成配置**：需要分平台或分环境定义配置时，使用 `<script name="json">` 并通过 `__mpx_mode__` / `__mpx_env__` 动态生成。
3. **页面滚动**：页面 JSON 将 `disableScroll` 设为 `true`，样式声明 `page { height: 100%; }`，并使用开启 `scroll-y` 的 `scroll-view` 承载滚动内容。

### 条件编译开发约束

> - 原平台条件根据用户项目配置确定，一般为 `__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web'`。
> - RN 平台条件根据用户项目配置确定，一般为 `__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'`。

1. **最小化使用**：条件编译只作为没有跨端兼容写法时的最后手段，仅包裹真正不兼容的最小片段，不要大面积连续分叉。
2. **避免空选择器**：样式条件编译优先只包裹不兼容属性；仅当整条规则均不兼容或某个平台会留下空规则时，才将选择器与声明块整体包裹。详见[条件编译 · 避免产物中出现空选择器](./references/conditional-compile.md#避免产物中出现空选择器)。
3. **保持预处理器缩进**：stylus / sass 等缩进敏感预处理器中的条件编译注释与所在块体同级缩进，避免占位注释截断块上下文并触发 `expected "indent", got "outdent"` 等错误。
4. **使用区块对应语法**：样式使用 `/* @mpx-if (...) */`，模板使用 `wx:if="{{...}}"` 或 `@mode` 属性后缀，脚本和 JSON 使用 `if (__mpx_mode__ === ...)`；新增代码不要使用历史兼容语法 `@_mode`。详见[条件编译](./references/conditional-compile.md)。

## 任务一：对小程序 Mpx 组件进行 RN 跨端适配改造

### 1. 模板（template）适配改造

- 读取 [模板能力参考](./references/rn-template-reference.md)，对 `<template>` 中使用的基础组件及其属性与事件逐一核对 RN 支持情况。
- 检查动态 `class` / `style` 是否使用了 `{{}}` 拼接字符串，统一改造为 `wx:class` / `wx:style` 指令绑定。
- 检查 `<script>` 中 selector 类 API 引用的节点是否声明空 `wx:ref`，未声明的须补齐。
- 对于无法等效实现的部分使用 [模板条件编译](./references/conditional-compile.md#模板条件编译)（`@mode` / `mpxTagName@mode`）进行平台隔离，并添加 `todo` 注释记录差异原因。

### 2. 脚本（script）适配改造

- 读取 [逻辑能力参考](./references/rn-script-reference.md) 与 [环境 API 参考](./references/rn-api-reference.md)，对 `<script>` 中的生命周期、构造选项、实例方法与环境 API 调用逐一核对 RN 支持情况。
- 平台直连 API（如 `wx.xxx` / `my.xxx`）统一替换为 `mpx.xxx` 接入 `@mpxjs/api-proxy` 抹平的实现。
- 涉及 selector 的脚本逻辑须改造为 `#id` / `.class` 写法，并在对应模板节点添加空 `wx:ref`。
- 对于 RN 平台不支持的脚本逻辑分支，使用 [脚本条件编译](./references/conditional-compile.md#脚本条件编译) 进行平台隔离，并添加 `todo` 注释记录差异原因。

### 3. 样式（style）适配改造

1. **展开嵌套选择器**：对于 `sass` / `less` / `stylus` 等支持嵌套写法的预处理语言，先将 `<style>` 中的嵌套选择器展开铺平为传统选择器写法，便于后续兼容性判断。
2. **选择器适配改造**：读取 [样式开发最佳实践 · 选择器使用建议](./references/rn-style-practice.md#选择器使用建议)，将 RN 不支持的选择器改造为跨端兼容的单类等效实现，并同步更新 `<template>` 与 `<script>` 中的类名引用。
3. **样式属性适配改造**：优先读取 [样式开发最佳实践](./references/rn-style-practice.md)，将 `<style>`、`<template>`、`<script>` 中命中的样式场景直接改造为跨端兼容的等效实现；未命中相关内容时，再读取 [样式能力参考](./references/rn-style-reference.md) 的相关小节获取更广泛的知识参考。明确需要查询某项样式能力是否支持时，直接读取样式能力参考。
4. **垂直间距适配改造**：按 `<template>` 中的实际相邻关系审计垂直 margin，并展开理解 `margin` 简写以及 `margin-top` / `margin-bottom` 长写。先按 [样式开发最佳实践 · 处理垂直 margin 折叠](./references/rn-style-practice.md#处理垂直-margin-折叠) 的反向约束排除 Flex / Grid、浮动、`position: absolute/fixed`、clearance，以及父子关系中的 BFC 与分隔条件；仅当确认原平台会发生 margin 折叠且同一间距由两侧共同表达时，才归到单侧并保留原平台折叠后的有效间距，避免 RN 将两侧数值叠加。不要只检查属性是否受 RN 支持，因为 `margin` 本身受支持但布局语义不同。
5. **原子类适配改造**：项目已启用 UnoCSS 时，读取 [Mpx2RN 原子 CSS 能力参考](./references/rn-atomic-css.md)，检查模板中的工具类、variants、动态类提取与颜色透明度写法；将 RN 不支持的工具类改为支持的原子类组合或普通跨端样式。
6. **不可兼容部分使用条件编译**：对无法跨端等效实现的选择器、样式属性或原子类，按[条件编译开发约束](#条件编译开发约束)最小包裹不兼容片段；仅当整条规则均不兼容或某个平台会留下空选择器时才包裹整条规则。保留原平台实现，并添加 `todo` 注释记录差异原因。

### 4. JSON 配置适配改造

- 读取 [JSON 配置参考](./references/rn-json-reference.md)，检查 `<script type="application/json">` 或 `<script name="json">` 中所用字段在 RN 平台的支持情况。
- 对于平台差异较大的配置项，将 JSON 区块改写为 `<script name="json">` 形式，借助 `__mpx_mode__` 进行 [配置条件编译](./references/conditional-compile.md#配置条件编译)。

### 5. 检查与确认

- [ ] 重新按 [Mpx2RN 跨端开发约束](#mpx2rn-跨端开发约束)，从模板、脚本、样式、JSON 配置、条件编译五个维度逐项核实，并确认跨平台兼容。
- [ ] 通过 [编译校验脚本](#编译校验脚本) 真实编译校验。
- [ ] 通过本地环境 ESLint 校验（如 `npx eslint path/to/component.mpx`），无 lint 错误与警告。

## 任务二：创建符合 RN 跨端兼容规范的 Mpx 组件

### 1. 设计阶段

- 与用户对齐需求要点：组件视图结构、props / 事件、数据流、目标平台、是否需要 RN 原生能力。
- 若组件性能敏感或需要复用 React Native 原生组件 / Hooks，读取 [Mpx 与 RN 混合开发](./references/rn-hybrid-dev.md)，确定平台隔离策略：
  - **平台差异较大**：使用文件维度条件编译（`hybrid-card.mpx` / `hybrid-card.ios.mpx`），在独立文件中引入 `react-native` 依赖，避免原平台构建解析。
  - **局部差异较小**：使用模板/属性维度条件编译（`@mode` / `mpxTagName@mode`）隔离 RN 专属属性或少量节点。

### 2. 实施阶段

按 SFC 四个区块依次实现，全程遵循 [Mpx2RN 跨端开发约束](#mpx2rn-跨端开发约束)：

- **`<template>`**：读取 [模板能力参考](./references/rn-template-reference.md)，仅选用 RN 支持的基础组件、属性与事件；动态样式类名绑定使用 `wx:class` / `wx:style`；selector 类 API 涉及节点声明空 `wx:ref`。
- **`<script>`**：读取 [逻辑能力参考](./references/rn-script-reference.md) 与 [环境 API 参考](./references/rn-api-reference.md)，仅使用 RN 支持的生命周期、构造选项与 API；统一通过 `mpx.xxx` 调用环境能力。
  - **优先使用组合式 API**：新建组件优先使用 `<script setup>` 风格的组合式 API 编写逻辑，生命周期须在 `<script setup>` 顶层同步注册，详见 [逻辑能力参考 · 组合式 API](./references/rn-script-reference.md#组合式-api)。
  - **状态管理优先使用 `@mpxjs/pinia`**：新项目、新状态域或与组合式 API 协同时，使用 `@mpxjs/pinia`（Pinia 风格）；仅当工程已深度使用 `@mpxjs/store`（Vuex 风格）时继续维护沿用，避免同一业务域两套方案并存。详见 [逻辑能力参考 · 状态管理](./references/rn-script-reference.md#状态管理)。
- **`<style>`**：优先读取 [样式开发最佳实践](./references/rn-style-practice.md)，从一开始就应用其中命中的单类选择器、Flex 布局、`rpx` 单位、`hover-class` 等跨端兼容写法；未命中相关内容时，再读取 [样式能力参考](./references/rn-style-reference.md) 的相关小节。明确需要查询某项样式能力是否支持时，直接读取样式能力参考。项目启用 UnoCSS 时再读取 [Mpx2RN 原子 CSS 能力参考](./references/rn-atomic-css.md)，只使用 RN 支持的工具类与 variants。
- **JSON 配置**：读取 [JSON 配置参考](./references/rn-json-reference.md)，仅使用 RN 支持的字段；当需要分平台注册组件或差异化配置时，使用 `<script name="json">` 形式动态生成。

### 3. 检查与确认

- [ ] 重新按 [Mpx2RN 跨端开发约束](#mpx2rn-跨端开发约束)，从模板、脚本、样式、JSON 配置、条件编译五个维度逐项核实，并确认跨平台兼容。
- [ ] 通过 [编译校验脚本](#编译校验脚本) 真实编译校验。
- [ ] 通过本地环境的 ESLint 校验，无 lint 错误与警告。

## 编译校验脚本

> **脚本位置**：编译校验脚本随本 skill 一同分发，位于 **skill 目录下** 的 `scripts/compile-validate.js`（即 `<skill-root>/scripts/compile-validate.js`），下文所有命令示例均使用 **指向 skill 目录的路径**调用该脚本，不要尝试在宿主项目根目录或 `node_modules` 中查找它。

该脚本基于宿主项目内安装的 `@mpxjs/mpx-cli-service` 进行真实编译校验：会自动从输入 `.mpx` 文件向上探测宿主项目根目录、加载工程编译配置、按指定 `target` 进行编译，并按 `style / template / script / json / dependency / other` 分类聚合错误与警告。默认通过前置 loader 从目标文件中剥离 `usingComponents`，不解析或编译子组件，仅验证目标 `.mpx` 文件本身；因此默认不会校验子组件路径与配置。改造或新建组件后建议作为强制环节运行。

### 命令行参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `<file.mpx>...` | - | 一个或多个待校验的 `.mpx` 绝对/相对路径 |
| `--target=<mode>` | `ios` | 编译目标，多个用逗号分隔（如 `wx,ios,web`）|
| `--type=<page\|component>` | `component` | 入口类型，决定使用 `getPageEntry` 还是 `getComponentEntry` |
| `--project-root=<path>` | 自动探测 | 显式指定宿主项目根目录 |
| `--no-ignore-sub-components` | 关闭 | 保留 `usingComponents`，解析并递归编译所有子组件 |
| `--json` | 关闭 | 输出结构化 JSON 结果 |

退出码：`0` 校验通过（无错误、无警告）；`1` 存在编译错误或警告；`2` 运行期异常（如未找到 `@mpxjs/mpx-cli-service`）。

### 使用示例

> 下方示例中的 `<skill-root>` 表示本 skill 在宿主环境中的实际安装路径（例如 `.agents/skills/mpx2rn`、`.claude/skills/mpx2rn` 或 `~/.claude/skills/mpx2rn` 等，以实际安装位置为准）；调用时使用该绝对路径，不要在宿主项目根目录下查找 `scripts/compile-validate.js`。

```bash
# 单组件、默认 target=ios
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx

# 显式指定为页面
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=ios

# 跨端多目标校验
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=wx,ios,web

# 输出结构化 JSON 便于二次处理
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=ios --json

# 同时递归校验子组件（默认行为是仅校验目标自身）
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=ios --no-ignore-sub-components
```

校验失败时按错误或警告的 `category` 字段回到对应任务步骤定位与修正问题，再次运行直至无错误、无警告。
