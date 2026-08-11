---
name: mpx2rn-simple
description: Mpx 跨端输出 RN（简称 Mpx2RN 或 Mpx2DRN）的精简开发适配指南，覆盖模板、脚本、样式、JSON 配置四大维度。当用户进行 Mpx2RN 相关任务时强制调用，包括但不限于：技术方案设计、页面 / 组件的开发迭代、旧项目跨端适配改造、编译和运行时报错排查、Code Review 等。当用户问题不涉及 Mpx2RN 时不应调用，如 Mpx 小程序开发问题，RN 原生开发问题、Mpx2Web 相关问题等。
metadata:
  version: "2.12.0"
  author: donghongping
---

# Mpx 跨端输出 RN 开发与适配指南（精简版）

## 背景介绍

Mpx 是以微信小程序语法为基础、提供类 Vue 开发体验的跨端框架，可将同一套代码输出到小程序、Web 和 React Native。Mpx2RN 在编译时和运行时抹平了模板、脚本、样式与 JSON 配置的主要差异，但仍有部分能力需要适配。

## 使用方式与知识库索引

完整阅读本文件后，先识别任务涉及的模板、脚本、样式或 JSON 维度，再按下表读取相关参考的对应章节；不要预读全部 `references`。仅在不熟悉 Mpx 项目结构、页面与组件注册关系或 SFC 基本结构时读取“项目结构与单文件组件”。

| 知识库 | 说明 |
| --- | --- |
| [项目结构与单文件组件](./references/project-structure-and-single-file-component.md) | Mpx 项目的典型目录、页面与组件注册关系，以及 `.mpx` 单文件组件的基本结构与语法 |
| [条件编译](./references/conditional-compile.md) | 模板、脚本、样式、JSON 等不同部分的条件编译语法，遇到无法跨端等效实现需分平台处理时读取 |
| [跨端输出 RN 模板能力参考](./references/rn-template-reference.md) | 模板部分跨端能力详情：数据绑定、模板指令、事件、Slot、WXML 模板、i18n、无障碍访问、基础组件清单及其属性/事件支持情况 |
| [跨端输出 RN 脚本能力参考](./references/rn-script-reference.md) | 脚本部分跨端能力详情：构造选项、生命周期、实例方法/属性、组合式 API、运行时导出、状态管理 |
| [跨端输出 RN 样式能力参考](./references/rn-style-reference.md) | 样式部分跨端能力详情：选择器、单位、颜色、文本继承、CSS 变量、媒体查询、动画、背景图与逐项样式属性支持情况 |
| [跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md) | 常用选择器与样式属性的跨端兼容方案，遇到 RN 不支持或表现不一致的样式写法时优先查阅 |
| [Mpx2RN 原子 CSS 能力参考](./references/rn-atomic-css.md) | 基于 UnoCSS 的 RN 原子类接入、工具类、variants、directives 与 variant groups 支持范围、颜色透明度约束及编译排查；项目启用原子类或任务涉及 utility class 时读取 |
| [跨端输出 RN 环境 API 参考](./references/rn-api-reference.md) | `@mpxjs/api-proxy` 提供的环境 API 跨端支持情况，涉及网络、存储、界面、设备、媒体、位置等 |
| [跨端输出 RN JSON 配置参考](./references/rn-json-reference.md) | 应用、页面、组件三层 JSON 配置在 RN 平台的支持范围与差异 |
| [Mpx 与 RN 混合开发](./references/rn-hybrid-dev.md) | 在 `.mpx` 内直接使用 React Native 组件、Hooks 的方式与跨端隔离方案 |
| [适配检查清单](./references/review-checklist.md) | 适配、新建或 Code Review 收尾时逐项检查跨端兼容性 |
| [编译校验脚本](./references/compile-validation.md) | `compile-validate.js` 的完整参数、退出码与使用示例 |

## 通用约束与适配原则

### 跨平台兼容约束

产物代码须在原平台与 RN 平台均能正常运行。优先使用无需条件编译的跨端等效写法；引入「RN 支持但原平台不支持」的写法时，不要替换原平台已有写法，而应：

- 用条件编译将该 RN 写法限定在 RN 平台输出（模板属性后缀 `@ios|android|harmony`、样式与脚本 `@mpx-if` 包裹等）；
- 同步用条件编译保留原平台原有写法，避免改造引入原平台行为退化。

该原则贯穿模板、脚本、样式与 JSON 四个维度，样式约束中的“跨端双轨保留”是其具体落地。

### 模板（template）约束

1. **基础组件优先**：使用 [模板能力参考 · 基础组件](./references/rn-template-reference.md#基础组件) 中标注 RN 支持的基础组件与其支持属性/事件，不要使用 RN 不支持的属性或事件；如用户通过 `rnConfig.customBuiltInComponents` 编译配置扩充拓展了基础组件能力，以用户说明为准。
2. **页面滚动**：RN 平台页面默认不可滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发；需要滚动时使用 `scroll-view` 包裹并使用其等效能力。
3. **事件冒泡/捕获**：仅基础通用事件（`tap` / `longpress` / `touchstart` / `touchmove` / `touchend` / `touchcancel`）支持冒泡和捕获；其余事件不支持。
4. **模板内方法调用**：模板 Mustache 表达式不支持普通方法调用，需通过 `computed` / `wxs` 实现（i18n 翻译函数除外）。
5. **i18n**：组合式 API 中 `useI18n()` 解构出的翻译函数必须以原名 `t` / `tc` / `te` / `tm` 暴露至模板的 `return`，禁止重命名。
6. **事件传参**：传递自定义参数给事件处理器时，优先使用事件内联传参语法（如 `bindtap="handleTap('param')"`），而不是通过 `data-` dataset 属性传参。
7. **文字优先使用 `text` 包裹**：虽然框架支持在 `view` 中直接插入文字（编译时自动补 `text`），但会引入额外的 `view` 层级，存在性能开销。应优先使用 `text` 组件显式包裹文字内容；`text` 的跨平台布局对齐方案见 [样式开发最佳实践 · text 跨平台布局对齐](./references/rn-style-practice.md#text-跨平台布局对齐)。

### 脚本（script）约束

1. **生命周期 / 构造选项**：仅使用 [逻辑能力参考](./references/rn-script-reference.md) 中标注 RN 支持的生命周期与构造选项；避免使用 `onShareTimeline` / `onTabItemTap` / `onAddToFavorites` / `onSaveExitState` 等 RN 不支持项。
2. **环境 API**：通过 `@mpxjs/api-proxy` 提供的统一 `mpx.xxx` API 调用环境能力，避免直接使用 `wx.xxx` / `my.xxx`；具体支持范围见 [环境 API 参考](./references/rn-api-reference.md)；如用户通过 `custom` 配置扩充拓展了环境 API 能力，以用户说明为准。
3. **selector 映射**：脚本中的 `selectComponent` / `selectAllComponents` / `createSelectorQuery` / `createIntersectionObserver` 等 selector API 仅支持 `#id` / `.class`，且对应模板节点须声明空 `wx:ref` 以建立编译期 selector 映射。详见 [逻辑能力参考 · 实例方法与属性](./references/rn-script-reference.md#页面--组件实例方法与属性)。
4. **保留关键字**：`id` / `dataset` / `data` 是页面/组件实例的保留关键字，任何挂载到实例上的数据 key（包括 `props` / `data` / `computed` / `methods` / `setup return` / `inject` 等）都不得使用这三个名称作为 key，否则会触发 `reserved keyword of miniprogram` 编译期/运行期报错。命名时使用语义化别名（如 `itemId` / `rowData` / `pageData`）替代。
5. **`<script setup>` 显式暴露**：顶层绑定不会自动暴露给模板，须通过 `defineExpose()` 声明模板实际使用的数据与方法；不要暴露模板未使用的大型 store、RN 原生对象等无 UI 数据。

### 样式（style）约束

1. **样式能力判断口径**：样式属性支持情况以 [样式能力参考](./references/rn-style-reference.md) 为准，不要基于 RN 原生样式支持能力判断。Mpx2RN 已抹平支持的简写属性展开、CSS 变量、`calc()`、媒体查询、`rpx` 单位、颜色格式、文本继承等能力可直接使用，无需条件编译或替换写法。
2. **选择器单类化**：禁止使用复合/伪类/伪元素等 RN 不支持的选择器，必须改造为单类等效实现，并同步修改 `<template>` 与 `<script>`（如 `createSelectorQuery`）中对应的引用。逗号分隔的并列单类选择器可直接使用；UnoCSS 的 `hover:` variant 由编译器转换，不等同于普通 CSS 伪类。常见兼容方案见 [样式开发最佳实践 · 选择器使用建议](./references/rn-style-practice.md#选择器使用建议)。
3. **优先使用模板指令进行动态样式绑定**：使用 `wx:class` / `wx:style`，避免在 `class` / `style` 属性值中拼接 `{{}}`。
4. **优先使用跨端兼容方案**：按照 [样式开发最佳实践](./references/rn-style-practice.md) 改造不兼容写法，并同步模板与脚本：
   - **等效替换**：
     - 复合选择器拆为单类；子元素伪类改为 `wx:class` + 状态判断；
     - `::before` / `::after` 改为真实节点；`:active` 改为组件 `hover-class` / `hover-stay-time`；
     - `rem` / `em` 改为 `rpx`；数值 `font-weight` 优先改为 `normal` / `bold`；
     - `grid` / `float` 改为 Flex；隐藏元素避免依赖 `display: none`，改用尺寸归零与 `overflow: hidden`。
   - **双轨保留**：文本溢出和 1rpx 极细线等无法共用同一写法的场景，原平台保留原样式，RN 侧分别使用 `numberOfLines@ios|android|harmony`、`hairlineWidth` 等效实现，双方均通过条件编译限定平台。
5. **保留单位注释**：保留原始样式中的 `/*use rpx*/` 与 `/*use px*/` 注释，编译期会据此批量切换样式单位。
6. **原子 CSS**：项目启用 UnoCSS 或模板使用原子类时，读取 [Mpx2RN 原子 CSS 能力参考](./references/rn-atomic-css.md)。只使用 RN preset 与 Mpx2RN 样式编译器共同支持的工具类和 variants；不支持项会作为编译错误且不会进入产物。颜色透明度统一使用 `bg-red-500/50` 等斜杠 alpha 语法，不要使用 `bg-red-500 bg-opacity-50` 等独立 opacity 组合。
7. **垂直 margin 折叠**：RN 不会像小程序 / Web 普通块级布局那样折叠垂直 margin。先按 [样式开发最佳实践 · 处理垂直 margin 折叠](./references/rn-style-practice.md#处理垂直-margin-折叠) 判断；只有确认原平台会折叠且同一间距由两侧共同表达时，才将有效间距归到一侧并移除或归零另一侧，其余情况保持原样。

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
3. **保持预处理器缩进**：在 stylus / sass 等缩进敏感预处理器中，条件编译注释须与所在块体同级缩进，否则占位注释可能截断块上下文并触发解析错误。
4. **各区块使用对应的条件编译语法**：样式条件编译使用 `/* @mpx-if (__mpx_mode__ === ... ) */` 注释语法；模板条件编译使用 `wx:if="{{__mpx_mode__ === ...}}"` 指令或 `@mode` 属性后缀；脚本和 JSON 配置条件编译使用 `if (__mpx_mode__ === ...)` 条件语句，**避免误用**。`@_mode` 仅作为与 `@mode` 行为一致的历史兼容语法，新增代码不要使用，详情参考 [条件编译](./references/conditional-compile.md)。

## 工作流程

### 1. 明确任务与输出

- **已有组件适配**：默认直接修改原文件；先确认原平台行为、目标平台和涉及区块。若需要输出代码，给出可直接使用的完整组件，不只给局部片段。
- **新建组件**：明确视图结构、props、事件、数据流、目标平台及是否需要 RN 原生能力，最终交付结构完整的 `.mpx` 单文件组件。
- **报错排查 / Code Review**：先按报错位置或变更内容定位模板、脚本、样式或 JSON 维度，再读取对应参考；检查修改在原平台与 RN 的影响。

### 2. 按区块逐项实施

1. **模板**：读取 [模板能力参考](./references/rn-template-reference.md) 的相关组件章节，核对基础组件、属性、事件与滚动能力；检查 Mustache 调用、事件传参、文字节点、动态 `wx:class` / `wx:style`，并给 selector API 对应节点补空 `wx:ref`。
2. **脚本**：读取 [脚本能力参考](./references/rn-script-reference.md) 和任务涉及的 [环境 API 参考](./references/rn-api-reference.md)，核对生命周期、构造选项、实例能力、保留关键字与 selector；将直接宿主 API 调用改为受支持的 `mpx.xxx`。
3. **样式**：先展开预处理器嵌套确认最终选择器，再读取 [样式能力参考](./references/rn-style-reference.md) 和 [样式开发最佳实践](./references/rn-style-practice.md) 的相关章节，逐项核对选择器、样式属性、垂直 margin 与平台差异；启用 UnoCSS 时额外读取 [原子 CSS 能力参考](./references/rn-atomic-css.md)。
4. **JSON**：读取 [JSON 配置参考](./references/rn-json-reference.md)，核对应用、页面、组件配置；需要按平台生成时使用 `<script name="json">`。

优先选择跨端等价实现。确实无法等效时，按区块使用正确的条件编译语法最小隔离，并添加 `todo` 说明原因；修改选择器时同步更新模板、脚本和样式中的全部引用。

### 3. 新建组件的额外决策

- 优先使用 `<script setup>` 组合式 API，在顶层同步注册生命周期，并通过 `defineExpose()` 仅暴露模板使用的数据与方法；详见 [组合式 API](./references/rn-script-reference.md#组合式-api)。
- 新项目或新状态域优先使用 `@mpxjs/pinia`；工程已深度使用 `@mpxjs/store` 时沿用现有方案，避免同一业务域混用；详见 [状态管理](./references/rn-script-reference.md#状态管理)。
- 复用 RN 原生组件或 Hooks 时读取 [混合开发参考](./references/rn-hybrid-dev.md)：平台差异较大时使用文件维度条件编译并隔离 `react-native` 依赖，局部差异使用模板或属性维度条件编译。

### 4. 收尾检查

适配、新建或 Code Review 收尾时，读取并逐项完成 [适配检查清单](./references/review-checklist.md)，确认没有只修 RN 却破坏原平台的改动。

## 编译校验

修改或新建 `.mpx` 文件后，使用 skill 目录下的 `scripts/compile-validate.js` 进行真实编译；不要在宿主项目根目录或 `node_modules` 中查找该脚本。按任务覆盖全部目标平台，例如：

```bash
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=wx,ios,web
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=wx,ios,web
```

错误或警告都会使校验失败；按 `category` 回到对应维度修正并重新运行，直至无错误、无警告。完整参数与退出码见 [编译校验脚本](./references/compile-validation.md)。最后运行宿主项目针对改动文件的 ESLint 检查。
