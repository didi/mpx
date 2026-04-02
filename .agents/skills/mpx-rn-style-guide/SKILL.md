---
name: mpx-rn-style-guide
description: Mpx 跨端输出 RN （简称为 Mpx2RN or Mpx2DRN）的样式适配开发指南，当用户问题或上下文中同时包含 Mpx、RN、样式三个关键要素时强制调用，如：Mpx2RN 样式适配、Mpx2RN 样式报错等。当用户问题不涉及 Mpx 跨端输出 RN 或与样式无关时不应调用，如：Mpx 输出小程序相关问题、RN 相关问题等。
---

# Mpx 跨端输出 RN 样式开发指南

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。尽管 Mpx 在编译时和运行时对样式能力进行了一定程度的跨平台抹平，但在输出 RN 时在样式能力支持上仍与小程序和 Web 平台存在较大差异，本文档详细描述了 Mpx 输出 RN 时的样式能力支持情况，以及跨平台开发时样式兼容的最佳实践。

Mpx 采用类 Vue 的单文件组件（SFC）格式 `.mpx` 进行组件与页面定义，详情查看：[Mpx 单文件组件](./references/single-file-component.md)

## 知识库索引

| 知识库 | 说明 |
| --- | --- |
| [Mpx 单文件组件](./references/single-file-component.md) | 描述了 Mpx 单文件组件的基本结构与语法，并提供简单示例，开发 Mpx 单文件组件时读取 |
| [条件编译](./references/conditional-compile.md) | 描述了 Mpx 中包括模板、脚本、样式和配置等不同部分的条件编译语法，当跨端适配开发遇到兼容性问题需要分端处理时读取 |
| [跨端输出 RN 样式能力参考](./references/rn-style-reference.md) | 描述了 Mpx 输出 RN 时详细的样式能力支持情况，当查询某项样式能力是否支持，遇到样式不生效、样式报错等问题时读取 |
| [跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md) | 描述了 Mpx 输出 RN 时常用选择器和样式属性的跨端兼容方案和样式开发最佳实践，当进行已有组件跨端样式适配改造或新组件跨端样式开发时读取 |

## 跨端输出 RN 样式适配改造

当用户要求对已有 Mpx 组件进行跨端输出 RN 样式适配改造时，遵循以下流程与约束。

### 输入

基于小程序技术规范编写的 `{name}.mpx` 组件。

### 输出

以用户指示为准，若无特殊指示则默认在原文件 `{name}.mpx` 中进行修改。在输出修改后的代码时，应输出完整的组件代码，避免使用省略号，确保用户可以直接复制或应用修改。

### 约束指引

进行样式适配改造时需严格遵循以下约束指引：

1. **选择器单类化（示例）**：禁止使用复合选择器（如 `.list .item`），必须转换为单类名等效实现（如 `.list-item`），并确保同步修改 `<template>` 结构和 `<script>`（如 `createSelectorQuery`）中的对应引用。
  * **Bad Example**: `<style> .list .item { color: red; } </style>`
  * **Good Example**: `<style> .list-item { color: red; } </style>`
2. 模板样式类名动态绑定尽可能使用 `wx:style` 和 `wx:class` 模版指令，尽量避免在 `style` 和 `class` 属性中使用 `{{}}` 插值表达式进行动态绑定。
  * **Bad Example**: `<view class="item {{isActive ? 'active' : ''}}">`
  * **Good Example**: `<view class="item" wx:class="{{ {active: isActive} }}">`
3. 对于存在跨端兼容方案的选择器和样式属性，读取[跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md)，优先改造为跨端兼容方案，以便于后期维护。
  * **选择器的跨端兼容方案**:
    - 复合选择器（后代/交集等）→ 等效单类选择器：[参考](./references/rn-style-practice.md#11-复合选择器替换为等效单类选择器)
    - 子元素伪类（:first-child / :last-child / :nth-child）→ 使用 `wx:class` + `index` 判断：[参考](./references/rn-style-practice.md#12-子元素伪类替代方案-first-child--last-child--nth-child)
    - 伪元素选择器（::before / ::after）→ 使用真实节点替代：[参考](./references/rn-style-practice.md#13-伪元素选择器替代方案-before--after)
    - 点击态伪类（:active）→ 使用 `hover-class`/`hover-stay-time`：[参考](./references/rn-style-practice.md#14-点击态处理-active)
  * **样式属性的跨端兼容方案**:
    - 极细边框：原平台 `1rpx`，RN 使用 `hairlineWidth` 并通过条件编译切换：[参考](./references/rn-style-practice.md#23-1像素边框极细线)
    - 单位兼容：`rem/em` → 使用 `rpx`：[参考](./references/rn-style-practice.md#24-避免使用不兼容的单位-remem)
    - 字体粗细：避免数值型 `font-weight`，使用 `normal`/`bold`：[参考](./references/rn-style-practice.md#25-谨慎使用-font-weight-数值)
    - 文本溢出：`white-space`/`text-overflow` → 原平台保留样式，RN 使用 `numberOfLines` 模板属性条件编译：[参考](./references/rn-style-practice.md#4-文本溢出处理)
    - 隐藏元素：避免 `display: none`，使用尺寸归零与 `overflow: hidden` 等组合样式：[参考](./references/rn-style-practice.md#5-隐藏元素)
    - 布局属性：避免 `grid`/`float`，统一使用 Flex 布局：[参考](./references/rn-style-practice.md#32-避免使用-grid-布局) [参考](./references/rn-style-practice.md#33-避免使用-float-布局)
    - style 属性简写：避免 style 内联样式中有 RN 原生不支持的简写属性：[参考](./references/rn-style-practice.md#9-动态样式绑定中的简写属性限制)
4. 非必要时减少条件编译的使用，**避免出现大面积连续的条件编译**，因为这会严重破坏代码的可读性和后期维护性。
5. **保留原始样式定义中的 `/*use rpx*/` 和 `/*use px*/` 注释**，此类注释用于编译期间批量切换样式单位。

### 任务流程

1. **选择器适配改造**：
  - 1.1 分析组件的 `<style>` 部分，对于 `sass`、`less`、`stylus` 等支持嵌套选择器写法的预处理语言，先将原代码中所有的嵌套选择器写法展开铺平为传统的选择器写法，便于后续进行选择器的兼容性判断及适配改造。
    * **Bad Example (嵌套选择器未展开)**:
      ```less
      .list {
        .item {
          color: red;
          &.active {
            color: blue;
          }
        }
      }
      ```
    * **Good Example (嵌套选择器已展开铺平)**:
      ```less
      .list .item { color: red; }
      .list .item.active { color: blue; }
      ```
  - 1.2 读取 [Mpx 跨端输出 RN 样式开发最佳实践#选择器使用建议](./references/rn-style-practice.md#1-选择器使用建议)，分析组件的 `<style>` 部分，将 RN 平台不支持的选择器改造为跨端兼容的等效实现，并同步更新 `<template>` 和 `<script>` 中对应的类名引用。
  - 1.3 对于无法进行跨端兼容等效实现的选择器，使用原平台条件编译对该选择器样式片段进行局部包裹，保留在原平台输出产物中，并添加 `todo` 注释记录不兼容 RN 平台的详情。
    * **Good Example (局部条件编译)**:
      ```css
      /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
      /* todo: RN 不支持 ::-webkit-scrollbar 伪元素，仅在原平台保留 */
      .scroll-view::-webkit-scrollbar { display: none; }
      /* @mpx-endif */
      ```
  
  
2. **样式属性适配改造**：
  - 2.1 读取 [跨端输出 RN 样式能力支持详情](./references/rn-style-reference.md)，对 `<style>`、`<template>` 和 `<script>` 中定义的样式属性进行分析，检查是否存在 RN 平台不支持的样式属性。
  - 2.2 对于 RN 平台不支持的样式属性，读取 [Mpx 跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md)，将其改造为跨端兼容的等效实现。
  - 2.3 对于无法进行跨端兼容等效实现的样式属性，使用原平台条件编译对该样式属性进行局部包裹，保留在原平台输出产物中，并添加 `todo` 注释记录不兼容 RN 平台的详情。
    * **Good Example (局部条件编译)**:
      ```css
      .animation-box {
        /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
        /* todo: RN 不支持 keyframes 动画，仅在原平台保留 */
        animation: slideIn 0.5s ease-in-out;
        /* @mpx-endif */
      }
      ```

3. **检查与确认**：
  - 3.1 检查确保 `<style>` 中不存在任何嵌套选择器写法。
  - 3.2 检查确保 `<style>`、`<template>` 和 `<script>` 中所有存在跨端兼容方案的选择器和样式属性都已被改造为跨端兼容的等效实现。
  - 3.3 检查确保 `<style>`、`<template>` 和 `<script>` 中所有 RN 平台不支持的选择器和样式属性都已被原平台条件编译所包裹。
  - 3.4 检查确保 `<style>`、`<template>` 和 `<script>` 中不存在大面积的条件编译，所有添加的条件编译仅最小包裹不兼容的样式片段。
  - 3.5 检查确保样式 <style> 中条件编译处理后产物中不存在空选择器：参考[条件编译注释规则](./references/rn-style-practice.md)
