---
name: mpx2rn-simple
description: Mpx 跨端输出 RN（简称 Mpx2RN 或 Mpx2DRN）的开发适配指南，覆盖模板、脚本、样式、JSON 配置四大维度。当用户进行 Mpx2RN 相关任务时强制调用，包括但不限于：技术方案设计、页面 / 组件的开发迭代、旧项目跨端适配改造、编译和运行时报错排查、Code Review 等。当用户问题不涉及 Mpx2RN 时不应调用，如 Mpx 小程序开发问题，RN 原生开发问题、Mpx2Web 相关问题等。
metadata:
  version: "2.12.3"
  author: donghongping
---

# Mpx 跨端输出 RN 开发与适配指南（精简版）

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。Mpx2RN 在编译时和运行时对模板、脚本、样式与 JSON 配置四大维度的开发能力进行了全面抹平，但与小程序、Web 平台仍存在一定能力差异。

## 使用方式与知识库索引

完整阅读本文件后，先识别任务涉及的模板、脚本、样式或 JSON 维度，再按下表的读取条件选择相关参考，并只读取与任务相关的章节；不要预读全部 `references`。

| 知识库 | 说明 |
| --- | --- |
| [开发约束与检查清单](./references/rn-development-checklist.md) | 所有 Mpx2RN 适配改造、新建组件、报错排查与 Code Review 任务开始前必须完整读取，并在完成后按同一份清单复查；覆盖模板、脚本、样式、JSON 与条件编译的共用约束 |
| [项目结构与单文件组件](./references/project-structure-and-single-file-component.md) | 不熟悉项目目录、页面与组件注册关系、入口配置或 `.mpx` 单文件组件结构时读取；已明确文件位置与 SFC 结构时无需读取 |
| [条件编译](./references/conditional-compile.md) | 需要按平台隔离文件、区块、模板节点或属性，或修改、排查现有条件编译时读取；覆盖文件、模板、脚本、样式和 JSON 配置的条件编译语法 |
| [跨端输出 RN 模板能力参考](./references/rn-template-reference.md) | 任务涉及 `<template>` 修改、模板编译或运行问题、基础组件选型及其属性或事件时读取相关章节；覆盖数据绑定、指令、事件、Slot、动态组件、WXML 模板、i18n、无障碍与基础组件 |
| [跨端输出 RN 脚本能力参考](./references/rn-script-reference.md) | 任务涉及 `<script>` 修改、脚本编译或运行问题、生命周期、实例能力、响应式、组合式 API、运行时配置、网络请求或状态管理时读取相关章节 |
| [跨端输出 RN 样式能力参考](./references/rn-style-reference.md) | 任务涉及 `<style>` 修改、样式编译或渲染问题，或需要判断某项选择器、单位、样式特性及属性是否受支持时读取相关章节 |
| [跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md) | 需要改造 RN 不支持或跨端表现不一致的选择器、单位、布局、文本、定位、溢出等样式写法时优先读取对应方案；仅查询支持范围时读取样式能力参考即可 |
| [Mpx2RN 原子 CSS 能力参考](./references/rn-atomic-css.md) | 项目启用 UnoCSS、模板使用原子类，或任务涉及工具类、variants、directives、variant groups、颜色透明度及原子类编译问题时读取 |
| [跨端输出 RN 环境 API 参考](./references/rn-api-reference.md) | 任务调用、替换或排查宿主环境 API，或需要确认 `@mpxjs/api-proxy` 某项 API 的 RN 支持情况、参数、返回值与平台差异时读取对应 API 章节 |
| [跨端输出 RN JSON 配置参考](./references/rn-json-reference.md) | 任务涉及应用、页面或组件 JSON 配置，以及分包、异步分包、抽象节点或相关配置编译问题时读取对应章节 |
| [Mpx 与 RN 混合开发](./references/rn-hybrid-dev.md) | 需要在 `.mpx` 中注册或使用 React Native 组件、调用 React Hooks、处理 Hooks 返回值更新，或隔离 `react-native` 依赖时读取 |
| [编译校验](./references/compile-validation.md) | 修改或新建 `.mpx` 文件后、交付前必须读取并执行；包含真实编译要求、`compile-validate.js` 的调用方式、参数、退出码、使用示例与失败处理流程 |

## 工作流程

### 1. 明确任务与输出

- **已有组件适配**：默认直接修改原文件；先确认原平台行为、目标平台和涉及区块。若需要输出代码，给出可直接使用的完整组件，不只给局部片段。
- **新建组件**：明确视图结构、props、事件、数据流、目标平台及是否需要 RN 原生能力，最终交付结构完整的 `.mpx` 单文件组件。
- **报错排查 / Code Review**：先按报错位置或变更内容定位模板、脚本、样式或 JSON 维度，再读取对应参考；检查修改在原平台与 RN 的影响。

### 2. 读取开发约束与检查清单

适配改造、新建组件、报错排查与 Code Review 均完整读取[开发约束与检查清单](./references/rn-development-checklist.md)，并作为后续实现与审查的约束；完成后在收尾检查中按同一份清单逐项确认。

### 3. 按区块逐项实施

1. **模板**：读取 [模板能力参考](./references/rn-template-reference.md) 的相关组件章节，核对基础组件、属性、事件与滚动能力；检查 Mustache 调用、事件传参、文字节点、动态 `wx:class` / `wx:style`，并给 selector API 对应节点补空 `wx:ref`。
2. **脚本**：读取 [脚本能力参考](./references/rn-script-reference.md) 和任务涉及的 [环境 API 参考](./references/rn-api-reference.md)，核对生命周期、构造选项、实例能力、保留关键字与 selector；将直接宿主 API 调用改为受支持的 `mpx.xxx`。
3. **样式**：先展开预处理器嵌套确认最终选择器，再读取 [样式能力参考](./references/rn-style-reference.md) 和 [样式开发最佳实践](./references/rn-style-practice.md) 的相关章节，逐项核对选择器、样式属性、垂直 margin 与平台差异；启用 UnoCSS 时额外读取 [原子 CSS 能力参考](./references/rn-atomic-css.md)。
4. **JSON**：读取 [JSON 配置参考](./references/rn-json-reference.md)，核对应用、页面、组件配置；需要按平台生成时使用 `<script name="json">`。

优先选择跨端等价实现。确实无法等效时，按区块使用正确的条件编译语法最小隔离，并添加 `todo` 说明原因；修改选择器时同步更新模板、脚本和样式中的全部引用。

### 4. 新建组件的额外决策

- 优先使用 `<script setup>` 组合式 API，在顶层同步注册生命周期，并通过 `defineExpose()` 仅暴露模板使用的数据与方法；详见 [组合式 API](./references/rn-script-reference.md#组合式-api)。
- 新项目或新状态域优先使用 `@mpxjs/pinia`；工程已深度使用 `@mpxjs/store` 时沿用现有方案，避免同一业务域混用；详见 [状态管理](./references/rn-script-reference.md#状态管理)。
- 复用 RN 原生组件或 Hooks 时读取 [混合开发参考](./references/rn-hybrid-dev.md)：平台差异较大时使用文件维度条件编译并隔离 `react-native` 依赖，局部差异使用模板或属性维度条件编译。

### 5. 收尾检查

- [ ] 按[开发约束与检查清单](./references/rn-development-checklist.md)逐项核对通过。
- [ ] 按[编译校验](./references/compile-validation.md)完成真实编译校验。
- [ ] 通过本地环境的 ESLint 校验，无 lint 错误与警告。
