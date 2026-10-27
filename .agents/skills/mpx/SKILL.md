---
name: mpx
description: Mpx 应用开发与跨端适配指南，以 Mpx 核心能力为基准，描述微信基础语义及支付宝（Mpx2Ali）、RN（Mpx2RN/Mpx2DRN）、Web（Mpx2Web/H5/SSR）、Skyline 双渲染模式差异。用于 .mpx 页面与组件开发、迁移、方案设计、编译运行排错和代码评审，可同时处理多个目标端；不用于不经 Mpx 编译的纯 React Native、Vue 或普通网页项目。
---

# Mpx 开发与跨端适配

`references/base/` 描述 Mpx 提供的核心能力及其基准用法，包括以微信小程序语义为基础的编程模型与 Mpx 增强能力。它不是所有跨端支持能力的严格交集，收录某项能力也不代表所有目标端均支持。`references/ali/`、`references/rn/`、`references/web/` 和 `references/skyline/` 在此基准上补充支持情况、限制、行为差异与专属扩展。Skyline 属于微信目标下的渲染模式，与 WebView 共用 `wx` 输出；支付宝使用 `ali` 输出，其他未收录目标端需按工程核实。

## 任务识别与读取顺序

1. 从用户需求、工程构建命令和配置识别**输出目标**与**源码方言**。`mode` 是输出目标；`srcMode` 是源码方言，二者不能混用。RN 目标是 `ios` / `android` / `harmony`；Web 是 `web`；`wx` 是微信；`ali` 是支付宝。DRN 按 RN 处理，宿主扩展再按工程核实。微信任务再结合页面/全局 `renderer` 与用户需求识别 WebView / Skyline；两者不是不同的编译目标，微信 WebView 也不等于 `web`。目标已明确时不重复询问；未明确时先检查工程。
2. 识别**任务类型与范围**：能力查询、方案讨论、代码修改、排障或评审，并确定涉及模板、脚本、样式、JSON、编译/运行时配置或环境 API 中的哪些维度。能力查询与方案讨论按需读取资料；代码修改后执行相关验证；排障与评审检查指定范围，是否修复按用户要求决定。
3. 按实际目标先读 [支付宝入口](references/ali/index.md)、[RN 入口](references/rn/index.md)、[Web 入口](references/web/index.md)或 [Skyline 入口](references/skyline/index.md)，确定该端的适用范围、约束和读取路径。多端任务读取所有**实际目标端与渲染模式**入口；仅了解 Mpx 核心能力或进行微信 WebView 基础开发时直接按需读取 base。
4. 根据下表及端入口索引，配对读取相关基础主题与端差异小节，基础知识只读一次，不预读全部 references。新建或迁移完整页面/组件时核对四个 SFC 区块；局部修复核对受影响维度。Skyline 适配完成前、排障或评审还需按入口在指定范围内执行完整检查矩阵，能力查询与方案讨论无需执行。

## 核心能力基准索引

| 任务线索 | 按需读取 |
| --- | --- |
| 工程目录、页面/组件注册、`.mpx` 四个区块 | [项目结构与 SFC](references/base/project-structure-and-single-file-component.md) |
| `data/computed/watch`、数据不更新、对象新增键、数组更新、`ref/reactive` | [数据响应](references/base/script-reference.md#数据响应) |
| `createApp/Page/Component`、props、生命周期、`setup`、宏、`implement`、运行时导出 | [脚本基础](references/base/script-reference.md) |
| Mustache、条件/列表渲染、事件参数、双向绑定、refs、Slot、动态组件、i18n | [模板基础](references/base/template-reference.md) |
| 基础组件、属性默认值、事件数据、表单、滚动、媒体与宿主能力 | [基础组件](references/base/template-reference.md#基础组件)，再查实际目标端的模板差异。 |
| WXSS、类选择器、内联样式、样式引入、全局样式、`px/rpx/vw` | [样式基础](references/base/style-reference.md) |
| 页面列表、`usingComponents`、动态 JSON、抽象节点 | [JSON 基础](references/base/json-reference.md) |
| `packages`、`?root`、`?resolve`、独立分包 `independent`、`componentPlaceholder`、`require.async`、分包预下载 | [分包与异步化](references/base/subpackage-reference.md) |
| `MpxWebpackPlugin`、`mode/srcMode`、匹配规则、编译配置与 `Mpx.config` | [配置基准](references/base/config-reference.md) |
| 条件文件、区块 `mode/src-mode`、`@mode`、样式条件注释、隔离平台依赖 | [条件编译](references/base/conditional-compile.md) |
| 环境 API 查询、`@mpxjs/api-proxy`、Promise/回调、`custom`、任务句柄 | [环境 API 基准](references/base/api-reference.md)：按 API 名称查参数、返回值和调用方式，再核对目标端差异。 |
| `@mpxjs/fetch`、拦截器、取消、预请求 | [网络请求](references/base/network-reference.md) |
| Pinia、`@mpxjs/store`、状态解构与跨组件共享 | [状态管理](references/base/store-reference.md) |
| 原子类、UnoCSS、utility class、directives、variant groups | [原子 CSS 基准](references/base/atomic-css.md)，RN 目标再核对端差异。 |
| 支付宝输入框/键盘、滚动条/弹层、尺寸、安全区、样式隔离、导航栏与页面滚动 | [支付宝入口](references/ali/index.md)，按维度查询差异与实践。 |
| 微信 WebView / Skyline 双模式、glass-easel、renderer、布局/层级/组件兼容 | [Skyline 入口](references/skyline/index.md)，按维度查询差异；Worklet、手势、自定义路由与共享元素按入口回源。 |
| 真实编译、单文件校验与检查边界 | [编译校验](references/base/compile-validation.md) |

大文件先通过目录或 `rg -n '^#{1,4} |关键词' <文件>` 定位，再读取对应小节。某目标端的组件/API 支持表是该端的能力证据，不代表其他端也支持。

## 规则适用与冲突处理

- **环境 API 按任务核实契约与行为**：先查基准调用契约，再核对目标端差异。参考未比较的维度不代表各端行为一致；任务涉及取值含义、计算方式、时序或使用条件时仍需核实，不能仅凭字段、类型与默认值一致推断行为等价。
- **先理解 Mpx 能力基准，再核对目标端实现**。base 保留能力定义和基准用法，不因某端暂不支持或行为不同而删去该能力。例如 `setData`、页面滚动、分包预下载仍属于基准说明，具体支持与适配查目标端参考。端文档未提及不能单独作为支持证据，存疑时核对工程版本和实现。
- **按实际目标选择实现**，优先复用能满足这些目标的方案，仅对无法抹平的最小片段条件编译；实现选型不改变 base 的能力范围。RN 适配后保留原平台功能；Web 单端任务不套用 RN 单类选择器、空 `wx:ref`、强制 `scroll-view` 等限制。
- **核实目标端可用性**：能编译、存在导出或通过 `implement` 登记不代表有对应宿主驱动。环境 API、分包加载、分享、页面钩子均需核实目标端实现。用户的 `custom` / `customBuiltInComponents` 扩展以其提供的调用约定和表现为准。
- **支付宝宿主与设备系统分开判断**：`ali` 表示输出支付宝，运行设备的 iOS / Android 通过系统信息识别；`ios` / `android` 编译目标属于 RN。按工程版本和目标机型核实适用性，具体约束见支付宝入口。
- **Skyline 规则只作用于微信对应渲染模式**：使用 `renderer` 运行时分支区分 WebView / Skyline，不能用条件文件或 `@wx` 区分。优先兼容两种模式的共用实现；Skyline 的布局、页面滚动与检查矩阵不推广到纯 WebView、Web 或 RN 任务。
- **SSR 是 Web 的额外约束**：涉及 SSR 时读取 [SSR 参考](references/web/ssr-reference.md)，其请求级状态与服务端执行规则优先于普通客户端初始化示例。
- **以工程版本和实现为依据**。资料与工程表现不符时先核对版本、配置和目标端行为，不以 React Native 原生能力代替 Mpx2RN 支持情况，也不把 Vue 3 习惯直接套入 Mpx。没有覆盖的能力要明确待核实，不推断为全端支持。

## 开发与验证

存量适配先确认原平台行为与涉及区块，默认在原文件中局部修改；需要隔离平台依赖时再拆分条件文件。

以 Mpx 基准用法为起点，结合目标端差异复用已有工程。新组件可优先 `<script setup>`；模板访问的绑定须 `defineExpose`，生命周期同步注册。新状态域优先 `@mpxjs/pinia`，已有 store 不为切换平台强行迁移。环境能力通过 `@mpxjs/api-proxy` 调用。

代码修改后针对实际目标检查行为与构建：涉及 SFC 编译时按 [编译校验](references/base/compile-validation.md) 显式指定目标；执行项目适用的 ESLint 与现有测试。编译成功不能证明滚动、原生宿主、浏览器权限或 SSR hydration 正常；按本次改动和端入口要求补充运行验证，Skyline 改动需分别验证 WebView / Skyline。缺少依赖或容器时说明未验证的范围。

## 维护本 Skill

Mpx 核心能力及基准用法统一维护在 base，端或渲染模式目录维护相对基准的支持情况、差异及专属扩展。核心能力即使只在部分端可用，仍可收录到 base；仅为某端提供的扩展则归入对应端目录。主入口维护任务路由与跨端判断规则，具体端约束由各端入口及参考维护。

所有参考只描述开发者可观察的能力、参数、返回值、配置要求与限制，不展开框架内部文件、类名或实现流程。端差异指引只列出需要用户处理的差异；框架已抹平且沿用基准用法的字段映射、参数转换和接口回退无需列出，避免误导用户重复适配。

RN/Web API 参考按支持范围、类型与默认值记录差异：保留不支持的 API、参数、返回字段及对象方法；不支持字段归入支持范围差异，有效返回值的类型变化和正常可空类型仍需比较。三者均与基准一致时链接基准；行为、取值含义、计算方式、时序与使用条件暂不纳入这两份 API 参考的差异比较。此为文档收录口径，不限制实际任务的核实范围，也不套用于支付宝 API 实践。

参考正文直接描述当前用法与限制，不记录原文修订、资料整合或历史验证过程。
