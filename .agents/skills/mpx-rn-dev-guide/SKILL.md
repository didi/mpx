---
name: mpx-rn-dev-guide
description: Mpx 跨端输出 RN（简称 Mpx2RN 或 Mpx2DRN）的开发适配指南，覆盖模板、脚本、样式、JSON 配置四大维度。当用户要求对已有 Mpx 组件进行 RN 跨端适配改造、创建符合 RN 跨端兼容规范的 Mpx 组件、排查 Mpx2RN 编译报错或查询某项能力（模板指令、基础组件、样式属性、生命周期、环境 API、JSON 字段等）在 RN 平台的支持情况时强制调用。当用户问题不涉及 Mpx 跨端输出 RN 时不应调用，如小程序原生开发问题，纯 RN 原生开发问题、Web 端样式问题等。
metadata:
  version: "1.0.1"
  author: donghongping
---

# Mpx 跨端输出 RN 开发与适配指南

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。Mpx 在编译时和运行时对包括模板、脚本、样式与 JSON 配置在内的开发能力进行了全面的跨端抹平，但在输出 RN 时与小程序、Web 平台仍存在一定能力差异。

本 SKILL 面向以下两类任务：

1. **任务一**：对已有的 Mpx 组件进行 RN 跨端适配改造（已基于小程序规范编写、需补齐 RN 兼容性）。
2. **任务二**：从零创建一个符合 RN 跨端兼容规范的 Mpx 组件。

## 知识库索引

| 知识库 | 说明 |
| --- | --- |
| [Mpx 单文件组件](./references/single-file-component.md) | Mpx 单文件组件的基本结构与语法，开发任意 `.mpx` 文件前读取 |
| [条件编译](./references/conditional-compile.md) | 模板、脚本、样式、JSON 等不同部分的条件编译语法，遇到无法跨端等效实现需分平台处理时读取 |
| [跨端输出 RN 模板能力参考](./references/rn-template-reference.md) | 模板部分跨端能力详情：数据绑定、模板指令、事件、Slot、WXML 模板、i18n、无障碍访问、基础组件清单及其属性/事件支持情况 |
| [跨端输出 RN 脚本能力参考](./references/rn-script-reference.md) | 脚本部分跨端能力详情：构造选项、生命周期、实例方法/属性、组合式 API、运行时导出、状态管理 |
| [跨端输出 RN 样式能力参考](./references/rn-style-reference.md) | 样式部分跨端能力详情：选择器、单位、颜色、文本继承、CSS 变量、媒体查询、动画、背景图与逐项样式属性支持情况 |
| [跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md) | 常用选择器与样式属性的跨端兼容方案，遇到 RN 不支持或表现不一致的样式写法时优先查阅 |
| [跨端输出 RN 环境 API 参考](./references/rn-api-reference.md) | `@mpxjs/api-proxy` 提供的环境 API 跨端支持情况，涉及网络、存储、界面、设备、媒体、位置等 |
| [跨端输出 RN JSON 配置参考](./references/rn-json-reference.md) | 应用、页面、组件三层 JSON 配置在 RN 平台的支持范围与差异 |
| [Mpx 与 RN 混合开发](./references/rn-hybrid-dev.md) | 在 `.mpx` 内直接使用 React Native 组件、Hooks 的方式与跨端隔离方案 |

### 知识库使用建议

参考文档体量较大，**不要一次性预读全部参考**，按需取用即可：

1. **入口只读本 SKILL.md**：完整读完本文档（含下方通用约束与任务流程）足以覆盖 80% 常见场景的判断；不要在动笔前预读 references 目录。
2. **触发式读取**：只在任务流程或通用约束中**明确指向**某份参考时读取，且仅读取与当前问题相关的小节（参考文档均含目录与章节锚点，使用 grep / 锚点跳读，不要整文件 Read）。
3. **典型任务的最小阅读集**（仅当本 SKILL.md 已无法判断时再补充）：
   - 已有组件 RN 跨端适配改造：识别问题维度后再读对应能力参考的相关小节，通常 1–2 份足够（如样式改造主要查 `rn-style-practice.md`）。
   - 新建 RN 跨端兼容组件：先按本 SKILL.md 的通用约束起手，遇到能力存疑（某属性是否支持、某 API 是否存在）时再点查对应参考。
   - 排查特定编译报错：直接定位到报错维度的能力参考相关小节。
4. **何时读取 `single-file-component.md`**：仅当不熟悉 Mpx SFC 基本结构时读取；已熟悉 SFC 写法可跳过。

## 通用约束与适配原则

无论是适配改造还是新建组件，跨端兼容均需严格遵循以下通用约束：

### 跨平台兼容约束

产物代码须在原平台与 RN 平台均能正常运行。引入「RN 支持但原平台不支持」的写法（如 `numberOfLines@ios|android|harmony` / `hairlineWidth` 等 RN 等效实现）时，**不要替换原平台已有写法**，而应：

- 用条件编译将该 RN 写法限定在 RN 平台输出（模板属性后缀 `@ios|android|harmony`、样式与脚本 `@mpx-if` 包裹等）；
- 同步用条件编译保留原平台原有写法，避免改造引入原平台行为退化。

该原则贯穿模板 / 脚本 / 样式 / JSON 四个维度，下方各约束与样式约束 #3 的「双轨」条目即此原则的具体落地。

### 模板（template）约束

1. **基础组件优先**：使用 [模板能力参考 · 基础组件](./references/rn-template-reference.md#基础组件) 中标注 RN 支持的基础组件与其支持属性/事件，不要使用 RN 不支持的属性或事件；如用户通过 `rnConfig.customBuiltInComponents` 编译配置扩充拓展了基础组件能力，以用户说明为准。
2. **页面滚动**：RN 平台页面默认不可滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发；需要滚动时使用 `scroll-view` 包裹并使用其等效能力。
3. **事件冒泡/捕获**：仅基础通用事件（`tap` / `longpress` / `touchstart` / `touchmove` / `touchend` / `touchcancel`）支持冒泡和捕获；其余事件不支持。事件委托不要依赖 `e.target.dataset`，使用 `e.currentTarget` 替代。
4. **模板内方法调用**：模板 Mustache 表达式不支持普通方法调用，需通过 `computed` / `wxs` 实现（i18n 翻译函数除外）。
5. **i18n**：组合式 API 中 `useI18n()` 解构出的翻译函数必须以原名 `t` / `tc` / `te` / `tm` 暴露至模板的 `return`，禁止重命名。

### 脚本（script）约束

1. **生命周期 / 构造选项**：仅使用 [逻辑能力参考](./references/rn-script-reference.md) 中标注 RN 支持的生命周期与构造选项；避免使用 `onShareTimeline` / `onTabItemTap` / `onAddToFavorites` / `onSaveExitState` 等 RN 不支持项。
2. **环境 API**：通过 `@mpxjs/api-proxy` 提供的统一 `mpx.xxx` API 调用环境能力，避免直接使用 `wx.xxx` / `my.xxx`；具体支持范围见 [环境 API 参考](./references/rn-api-reference.md)；如用户通过 `custom` 配置扩充拓展了环境 API 能力，以用户说明为准。
3. **selector 映射**：脚本中的 `selectComponent` / `selectAllComponents` / `createSelectorQuery` / `createIntersectionObserver` 等 selector API 仅支持 `#id` / `.class`，且对应模板节点须声明空 `wx:ref` 以建立编译期 selector 映射。详见 [逻辑能力参考 · 实例方法与属性](./references/rn-script-reference.md#页面--组件实例方法与属性)。


### 样式（style）约束

1. **选择器单类化**：禁止使用复合/伪类/伪元素等 RN 不支持的选择器，必须改造为单类等效实现，并同步修改 `<template>` 与 `<script>`（如 `createSelectorQuery`）中对应的引用。常见兼容方案见 [样式开发最佳实践 · 选择器使用建议](./references/rn-style-practice.md#选择器使用建议)。
   - **Bad Example**: `.list .item { color: red; }`
   - **Good Example**: `.list-item { color: red; }`
2. **优先使用模板指令进行动态样式绑定**：使用 `wx:class` / `wx:style` 指令，避免在 `class` / `style` 属性内拼接 `{{}}` 插值表达式。
   - **Bad Example**: `<view class="item {{isActive ? 'active' : ''}}">`
   - **Good Example**: `<view class="item" wx:class="{{ {active: isActive} }}">`
3. **优先使用跨端兼容方案**：常见样式属性的跨端兼容方案见 [样式开发最佳实践](./references/rn-style-practice.md)。下表区分两类处理方式：
   - **等效替换**（替换后写法在原平台与 RN 平台均生效，可直接全平台使用）
     - 复合选择器 → 等效单类选择器
     - 子元素伪类（`:first-child` 等）→ `wx:class` + `index` 判断
     - 伪元素（`::before` / `::after`）→ 真实节点替代
     - 点击态伪类（`:active`）→ `hover-class` / `hover-stay-time`
     - `rem` / `em` → `rpx`
     - 数值型 `font-weight` → `normal` / `bold`
     - 隐藏元素：避免 `display: none`，使用尺寸归零 + `overflow: hidden`
     - `grid` / `float` → Flex 布局
   - **双轨保留**（原平台原写法用条件编译保留，RN 侧新增等效实现，**禁止只保留 RN 一侧**）
     - 文本溢出：原平台保留 `white-space` / `text-overflow` / `overflow: hidden` 样式（用样式条件编译包裹整条规则），RN 侧通过模板属性 `numberOfLines@ios|android|harmony` 等效实现
     - 1rpx 极细线：原平台保留 `1rpx` 边框写法（用样式条件编译），RN 侧用 `hairlineWidth` 等效
     
4. **保留单位注释**：保留原始样式中的 `/*use rpx*/` 与 `/*use px*/` 注释，编译期会据此批量切换样式单位。

### JSON 配置约束

1. **支持范围**：应用、页面、组件三级 JSON 配置在 RN 平台的字段支持详情见 [JSON 配置参考](./references/rn-json-reference.md)；不支持字段（如 `tabBar`）须通过条件编译隔离。
2. **动态生成配置**：当需要分平台或分环境定义 JSON 配置时，使用 `<script name="json">` 形式访问 `__mpx_mode__` / `__mpx_env__` 变量动态生成。

### 条件编译约束

当某项能力无法在 RN 平台等效实现时，使用条件编译进行分平台处理：

- 原平台条件：`__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web'`
- RN 平台条件：`__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'`

需遵循以下约束：

1. **最小化使用**：条件编译是处理跨端不兼容的**最后手段**，不是首选方案。使用条件编译之前，应先确认是否存在无需条件编译的跨端兼容写法（参见[样式开发最佳实践](./references/rn-style-practice.md)与各能力参考）。需要用条件编译时，仅最小包裹真正不兼容的片段，不要整段代码都用条件编译分叉。
2. **避免空选择器**：样式条件编译产物中不得留下空选择器（无样式内容的选择器），整条规则（含选择器与花括号内容）须一并被条件编译包裹。详见 [条件编译 · 避免产物中出现空选择器](./references/conditional-compile.md#避免产物中出现空选择器)。

完整语法（样式 `@mpx-if` / 模板 `@mode` & `@_mode` & `mpxTagName@mode` / 脚本 `__mpx_mode__` / JSON 配置）参考 [条件编译](./references/conditional-compile.md)。

## 任务一：对已有 Mpx 组件进行 RN 跨端适配改造

### 输入

基于小程序技术规范编写的 `{name}.mpx` 组件（已在小程序、Web 平台运行，但未适配 RN）。

### 输出

以用户指示为准；若无特殊指示则默认在原文件 `{name}.mpx` 中进行修改。输出修改后代码时应输出完整组件代码，避免使用省略号，确保用户可以直接复制或应用修改。

### 任务流程

#### 1. 模板（template）适配改造

- 读取 [模板能力参考](./references/rn-template-reference.md)，对 `<template>` 中使用的基础组件及其属性与事件逐一核对 RN 支持情况。
- 检查动态 `class` / `style` 是否使用了 `{{}}` 拼接字符串，统一改造为 `wx:class` / `wx:style` 指令绑定。
- 检查 `<script>` 中 selector 类 API 引用的节点是否声明空 `wx:ref`，未声明的须补齐。
- 对于无法等效实现的部分使用 [模板条件编译](./references/conditional-compile.md#模板条件编译)（`@mode` / `@_mode` / `mpxTagName@mode`）进行平台隔离，并添加 `todo` 注释记录差异原因。

#### 2. 脚本（script）适配改造

- 读取 [逻辑能力参考](./references/rn-script-reference.md) 与 [环境 API 参考](./references/rn-api-reference.md)，对 `<script>` 中的生命周期、构造选项、实例方法与环境 API 调用逐一核对 RN 支持情况。
- 平台直连 API（如 `wx.xxx` / `my.xxx`）统一替换为 `mpx.xxx` 接入 `@mpxjs/api-proxy` 抹平的实现。
- 涉及 selector 的脚本逻辑须改造为 `#id` / `.class` 写法，并在对应模板节点添加空 `wx:ref`。
- 对于 RN 平台不支持的脚本逻辑分支，使用 [脚本条件编译](./references/conditional-compile.md#脚本条件编译) 进行平台隔离，并添加 `todo` 注释记录差异原因。

#### 3. 样式（style）适配改造

1. **展开嵌套选择器**：对于 `sass` / `less` / `stylus` 等支持嵌套写法的预处理语言，先将 `<style>` 中的嵌套选择器展开铺平为传统选择器写法，便于后续兼容性判断。
   - **Bad Example (嵌套未展开)**:
     ```less
     .list {
       .item {
         color: red;
         &.active { color: blue; }
       }
     }
     ```
   - **Good Example (嵌套已展开)**:
     ```less
     .list .item { color: red; }
     .list .item.active { color: blue; }
     ```
2. **选择器适配改造**：读取 [样式开发最佳实践 · 选择器使用建议](./references/rn-style-practice.md#选择器使用建议)，将 RN 不支持的选择器改造为跨端兼容的单类等效实现，并同步更新 `<template>` 与 `<script>` 中的类名引用。
3. **样式属性适配改造**：读取 [样式能力参考](./references/rn-style-reference.md) 检查 `<style>`、`<template>`、`<script>` 中所有出现的样式属性的 RN 支持情况；读取 [样式开发最佳实践](./references/rn-style-practice.md) 改造为跨端兼容的等效实现。
4. **不可兼容部分使用条件编译**：对无法跨端等效实现的选择器或样式属性，使用 [样式条件编译](./references/conditional-compile.md#样式条件编译) 对**整条规则**进行最小包裹，保留在原平台输出产物中，添加 `todo` 注释记录差异原因。
   - **Good Example (整条规则一并条件编译，避免空选择器)**:
     ```css
     /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
     /* todo: RN 不支持 ::-webkit-scrollbar 伪元素 */
     .scroll-view::-webkit-scrollbar { display: none; }
     /* @mpx-endif */
     ```

#### 4. JSON 配置适配改造

- 读取 [JSON 配置参考](./references/rn-json-reference.md)，检查 `<script type="application/json">` 或 `<script name="json">` 中所用字段在 RN 平台的支持情况。
- 对于平台差异较大的配置项，将 JSON 区块改写为 `<script name="json">` 形式，借助 `__mpx_mode__` 进行 [配置条件编译](./references/conditional-compile.md#配置条件编译)。

#### 5. 编译校验

完成上述改造后，使用本 skill 自带的编译校验脚本对修改后的 `.mpx` 文件进行真实编译校验（位于 skill 目录下的 `scripts/compile-validate.js`，**不在宿主项目根目录下**），参见下文 [编译校验脚本](#编译校验脚本)。若校验失败，按错误分类回到对应步骤进行修正。

#### 6. 检查与确认

按 SFC 各区块逐项核对，并确认条件编译与编译校验已收尾：

**跨平台兼容**
- [ ] 引入的「RN 支持但原平台不支持」的写法均已通过条件编译限定在 RN 输出；原平台原有写法已用条件编译保留，未因 RN 适配而被替换或删除。

**模板（template）**
- [ ] `<template>` 中使用的基础组件、属性、事件均在 [模板能力参考](./references/rn-template-reference.md) 标注为 RN 支持，或已通过模板条件编译进行平台隔离；如用户通过 `rnConfig.customBuiltInComponents` 编译配置扩充拓展了基础组件能力，以用户说明为准。
- [ ] 动态 `class` / `style` 已改造为 `wx:class` / `wx:style` 指令，未在属性值内使用 `{{}}` 拼接。
- [ ] selector 类 API 引用的模板节点均已声明空 `wx:ref` 完成编译期映射。

**脚本（script）**
- [ ] `<script>` 中使用的生命周期、构造选项、实例方法与环境 API 均在 [逻辑能力参考](./references/rn-script-reference.md) 与 [环境 API 参考](./references/rn-api-reference.md) 标注为 RN 支持，或已通过脚本条件编译进行平台隔离；如用户通过 `custom` 配置扩充拓展了环境 API 能力，以用户说明为准。
- [ ] 平台直连 API（`wx.xxx` / `my.xxx`）已统一替换为 `mpx.xxx`；selector 类 API 仅使用 `#id` / `.class` 写法。

**样式（style）**
- [ ] `<style>` 中不存在嵌套选择器写法。
- [ ] `<style>`、`<template>`、`<script>` 中使用的选择器和样式属性均在 [样式能力参考](./references/rn-style-reference.md) 标注为 RN 支持，或已通过样式条件编译进行平台隔离。
- [ ] `/*use rpx*/` / `/*use px*/` 单位注释已保留。

**JSON 配置**
- [ ] `<script type="application/json">` / `<script name="json">` 中使用的字段均在 [JSON 配置参考](./references/rn-json-reference.md) 标注为 RN 支持，或已通过配置条件编译进行平台隔离。

**条件编译**
- [ ] 不存在大面积连续条件编译，仅最小包裹不兼容片段。
- [ ] 样式条件编译处理后产物中不存在空选择器。

**本地校验**
- [ ] 通过 [编译校验脚本](#编译校验脚本) 真实编译校验。
- [ ] 通过本地环境 ESLint 校验（如 `npx eslint path/to/component.mpx`），无 lint 错误与警告。

## 任务二：创建符合 RN 跨端兼容规范的 Mpx 组件

### 输入

用户描述的组件需求，包括视图结构、交互、数据来源、目标平台范围、是否需要复用 React Native 原生组件 / Hooks 等。

### 输出

完整的 `{name}.mpx` 组件文件，结构包含 `<template>`、`<script>`、`<style>` 与 JSON 配置区块。代码须直接满足 [通用约束与适配原则](#通用约束与适配原则)，避免新建后再走一轮适配改造。

### 任务流程

#### 1. 设计阶段

- 与用户对齐需求要点：组件视图结构、props / 事件、数据流、目标平台、是否需要 RN 原生能力。
- 若组件性能敏感或需要复用 React Native 原生组件 / Hooks，读取 [Mpx 与 RN 混合开发](./references/rn-hybrid-dev.md)，确定平台隔离策略：
  - **平台差异较大**：使用文件维度条件编译（`hybrid-card.mpx` / `hybrid-card.ios.mpx`），在独立文件中引入 `react-native` 依赖，避免原平台构建解析。
  - **局部差异较小**：使用模板/属性维度条件编译（`@mode` / `@_mode` / `mpxTagName@mode`）隔离 RN 专属属性或少量节点。

#### 2. 实施阶段

按 SFC 四个区块依次实现，全程遵循 [通用约束与适配原则](#通用约束与适配原则)：

- **`<template>`**：读取 [模板能力参考](./references/rn-template-reference.md)，仅选用 RN 支持的基础组件、属性与事件；动态样式类名绑定使用 `wx:class` / `wx:style`；selector 类 API 涉及节点声明空 `wx:ref`。
- **`<script>`**：读取 [逻辑能力参考](./references/rn-script-reference.md) 与 [环境 API 参考](./references/rn-api-reference.md)，仅使用 RN 支持的生命周期、构造选项与 API；统一通过 `mpx.xxx` 调用环境能力。
  - **优先使用组合式 API**：新建组件优先使用 `<script setup>` 风格的组合式 API 编写逻辑，生命周期须在 `<script setup>` 顶层同步注册，详见 [逻辑能力参考 · 组合式 API](./references/rn-script-reference.md#组合式-api)。
  - **状态管理优先使用 `@mpxjs/pinia`**：新项目、新状态域或与组合式 API 协同时，使用 `@mpxjs/pinia`（Pinia 风格）；仅当工程已深度使用 `@mpxjs/store`（Vuex 风格）时继续维护沿用，避免同一业务域两套方案并存。详见 [逻辑能力参考 · 状态管理](./references/rn-script-reference.md#状态管理)。
- **`<style>`**：读取 [样式能力参考](./references/rn-style-reference.md) 与 [样式开发最佳实践](./references/rn-style-practice.md)，从一开始就使用单类选择器、Flex 布局、`rpx` 单位、`hover-class` 等跨端兼容写法。
- **JSON 配置**：读取 [JSON 配置参考](./references/rn-json-reference.md)，仅使用 RN 支持的字段；当需要分平台注册组件或差异化配置时，使用 `<script name="json">` 形式动态生成。

#### 3. 编译校验

使用本 skill 自带的编译校验脚本（位于 skill 目录下的 `scripts/compile-validate.js`，**不在宿主项目根目录下**）校验新建组件，参见下文 [编译校验脚本](#编译校验脚本)。建议同时校验所有目标平台（如 `--target=wx,ios,web`），确保跨端兼容。

#### 4. 检查与确认

复用 [任务一 · 检查与确认](#6-检查与确认) 的清单，确认新建组件不引入任何 RN 不兼容写法。

## 编译校验脚本

> **脚本位置**：编译校验脚本随本 skill 一同分发，位于 **skill 目录下** 的 `scripts/compile-validate.js`（即 `<skill-root>/scripts/compile-validate.js`），下文所有命令示例均使用 **指向 skill 目录的路径**调用该脚本，不要尝试在宿主项目根目录或 `node_modules` 中查找它。

该脚本基于宿主项目内安装的 `@mpxjs/mpx-cli-service` 进行真实编译校验：会自动从输入 `.mpx` 文件向上探测宿主项目根目录、加载工程编译配置、按指定 `target` 进行编译，并按 `style / template / script / json / dependency / other` 分类聚合错误与警告。改造或新建组件后建议作为强制环节运行。

### 命令行参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `<file.mpx>...` | - | 一个或多个待校验的 `.mpx` 绝对/相对路径 |
| `--target=<mode>` | `ios` | 编译目标，多个用逗号分隔（如 `wx,ios,web`）|
| `--type=<page\|component>` | `component` | 入口类型，决定使用 `getPageEntry` 还是 `getComponentEntry`，并影响 `partialCompileRules` 形态 |
| `--project-root=<path>` | 自动探测 | 显式指定宿主项目根目录 |
| `--no-ignore-sub-components` | 关闭 | 关闭默认子组件占位策略，递归编译所有子组件 |
| `--json` | 关闭 | 输出结构化 JSON 结果 |

退出码：`0` 校验通过；`1` 存在编译错误；`2` 运行期异常（如未找到 `@mpxjs/mpx-cli-service`）。

### 使用示例

> 下方示例中的 `<skill-root>` 表示本 skill 在宿主环境中的实际安装路径（例如 `.agents/skills/mpx-rn-dev-guide`、`.claude/skills/mpx-rn-dev-guide` 或 `~/.claude/skills/mpx-rn-dev-guide` 等，以实际安装位置为准）；调用时使用该绝对路径，不要在宿主项目根目录下查找 `scripts/compile-validate.js`。

```bash
# 单组件、默认 target=ios
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx

# 显式指定为页面（影响 entry 与 partialCompileRules 形态）
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=ios

# 跨端多目标校验
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=wx,ios,web

# 输出结构化 JSON 便于二次处理
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=ios --json

# 同时递归校验子组件（默认行为是仅校验目标自身）
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=ios --no-ignore-sub-components
```

校验失败时按错误的 `category` 字段回到对应任务步骤定位与修正问题，再次运行直至通过。
