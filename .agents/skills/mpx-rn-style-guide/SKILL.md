---
name: mpx-rn-style-guide
description: Mpx 跨端输出 RN （Mpx2RN or Mpx2DRN）的样式兼容适配开发指南，当用户询问 Mpx 跨端输出 RN 样式相关问题时强制调用，包括：Mpx2RN 样式适配、Mpx2RN 样式兼容改造、Mpx2RN 样式能力支持、Mpx2RN 样式不生效、Mpx2RN 样式报错、Mpx2RN 样式开发最佳实践、Mpx2RN 中如何实现某样式效果等。
---

# Mpx 跨端输出 RN 样式开发指南

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。尽管 Mpx 在编译时和运行时对样式能力进行了一定程度的跨平台抹平，但在输出 RN 时在样式能力支持上仍与小程序和 Web 平台存在较大差异，本文档详细描述了 Mpx 输出 RN 时的样式能力支持情况，以及跨平台开发时样式兼容的最佳实践。

Mpx 采用类 Vue 的单文件组件（SFC）格式 `.mpx` 进行组件与页面定义，详情查看：[Mpx 单文件组件](./references/single-file-component.md)

## 知识库指引

根据具体场景读取以下参考文件：

- **样式能力参考**：当用户询问 Mpx2RN 样式能力支持详情，遇到样式不生效、样式报错等问题，或进行跨端样式适配开发时，读取 [跨端输出 RN 样式能力支持详情](./references/rn-style-reference.md)
- **开发最佳实践**：当用户询问 Mpx2RN 样式开发的最佳实践，查询如何实现某项样式效果，或查询不支持的样式能力是否存在兼容方案时，读取 [跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md)
- **样式注释规则**：当用户询问样式条件编译的注释写法、为什么空 class 选择器会出现等问题时，读取 [样式行注释规则](./references/rn-style-comment-rules.md)

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
2. **相邻兄弟选择器禁用**：RN 平台不支持 `+` 和 `~` 相邻兄弟选择器，必须将相邻兄弟选择器转换为静态类名等效实现，并通过模板中的位置关系手动添加对应的类名。
   * **Bad Example**: `<style> .item + .item { margin-top: 10rpx; } </style>`
   * **Good Example**: `<style> .item-with-top { margin-top: 10rpx; } </style>` + 模板中手动添加类名
3. **伪类打平为静态类名**：RN 平台不支持 `:first-child`、`:last-child`、`:nth-child`、`:nth-of-type` 等结构伪类，必须将伪类选择器转换为静态类名等效实现，并在模板中根据数据下标或位置关系动态绑定类名。
   * **Bad Example**: `<style> .item:first-child { margin-top: 0; } </style>`
   * **Good Example**: `<style> .item-first { margin-top: 0; } </style>` + 模板中 `wx:class="{{ { 'item-first': index === 0 } }}"`
4. **伪元素用真实节点替代**：RN 平台不支持 `::before` 和 `::after` 伪元素，必须将伪元素装饰改为模板中的实际 `<view>` 节点承载。
   * **Bad Example**: `<style> .title::before { content: ''; width: 10rpx; height: 30rpx; } </style>`
   * **Good Example**: `<template><view class="title-decorator"></view><text class="title">标题</text></template>` + `<style> .title-decorator { width: 10rpx; height: 30rpx; } </style>`
5. 模板样式类名动态绑定尽可能使用 `wx:style` 和 `wx:class` 模版指令，尽量避免在 `style` 和 `class` 属性中使用 `{{}}` 插值表达式进行动态绑定。
   * **Bad Example**: `<view class="item {{isActive ? 'active' : ''}}">`
   * **Good Example**: `<view class="item" wx:class="{{ {active: isActive} }}">`
6. 非必要尽可能减少条件编译的使用，优先使用跨平台兼容的实现方式，**避免出现大面积连续的条件编译**，因为这会严重破坏代码的可读性和后期维护性。
7. **保留原始样式定义中的 `/*use rpx*/` 和 `/*use px*/` 注释**，此类注释用于编译期间批量切换样式单位
8. 当样式中存在 `text-overflow: ellipsis`（或 `text-overflow ellipsis`）且该文本节点需要在 RN 上截断时，必须在对应模板节点补充 `ellipsizeMode@ios|android|harmony="tail"`，并与 `numberOfLines@ios|android|harmony` 搭配使用实现 RN 等效省略。

### 任务流程

1. **选择器适配改造**：
   - 分析组件的 `<style>` 部分，对于 `sass`、`less`、`stylus` 等支持嵌套选择器写法的预处理语言，先将原代码中所有的嵌套选择器写法展开铺平为传统的选择器写法，便于后续进行选择器的兼容性判断及适配改造。
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
   - 分析组件的 `<style>` 部分，参考 [Mpx 跨端输出 RN 样式开发最佳实践#选择器使用建议](./references/rn-style-practice.md#1-选择器使用建议)，将 RN 平台不支持的选择器替换为单类选择器等效实现，并同步更新 `<template>` 和 `<script>` 中对应的类名引用。
     * **Good Example (单类选择器等效实现)**:
       ```html
       <!-- 推荐：直接使用等效的单类名并使用 wx:class 进行动态绑定 -->
       <view class="list-item" wx:class="{{ { 'list-item-active': isActive } }}">
         <text class="title">标题</text>
       </view>
       ```
       ```css
       /* 推荐使用单类选择器，避免使用后代选择器和交集选择器 */
       .list-item { padding: 20rpx; }
       .list-item-active { color: red; }
       ```
   - 对于无法替换为单类选择器等效实现的选择器，使用原平台条件编译对该选择器样式片段进行局部包裹，保留在原平台输出产物中，并添加 `todo` 注释记录不兼容 RN 平台的详情。
     * **Good Example (局部条件编译)**:
       ```css
       /* @mpx-if (__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web') */
       /* todo: RN 不支持同级相邻选择器，仅在原平台保留 */
       .item + .item { margin-top: 10rpx; }
       /* @mpx-endif */
       ```
  
  
2. **样式属性适配改造**：
  - 参考 [跨端输出 RN 样式能力支持详情](./references/rn-style-reference.md)，对 `<style>`、`<template>` 和 `<script>` 中定义的样式属性进行分析，对于 RN 平台不支持的样式属性，结合 [Mpx 跨端输出 RN 样式开发最佳实践](./references/rn-style-practice.md) 将其替换为跨端兼容的等效实现。
    * **Good Example (display: none 跨端等效实现)**:
        ```css
        .mask {
          /* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
          flex: 0;
          height: 0;
          width: 0;
          padding: 0;
          margin: 0;
          overflow: hidden;
          /* @mpx-else */
          display: none;
          /* @mpx-endif */
        }
        ```
  - 对于无法进行跨端兼容等效实现的样式属性，使用原平台条件编译对该样式属性进行局部包裹，保留在原平台输出产物中，并添加 `todo` 注释记录不兼容 RN 平台的详情。
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
  - 检查确保 `<style>` 中不存在任何嵌套选择器写法。
  - 检查确保 `<style>` 中所有 RN 平台不支持的选择器都已被替换为单类选择器等效实现，或被原平台条件编译所包裹，输出到 RN 的部分不包含复合选择器。
  - **检查相邻兄弟选择器**：`+` 和 `~` 选择器必须转换为静态类名，并在模板中手动添加。
  - **检查结构伪类**：`first-child`、`last-child`、`nth-child`、`nth-of-type` 等伪类必须转换为静态类名。
  - **检查伪元素**：`::before` 和 `::after` 必须改为模板中的实际节点承载。
  - 检查确保 `<style>`、`<template>` 和 `<script>` 中所有 RN 平台不支持的样式属性都已被替换为跨端兼容的等效实现，或被原平台条件编译所包裹，输出到 RN 的部分不包含不支持的样式属性。
  - **检查确保 `<style>`、`<template>` 和 `<script>` 中所有 RN 平台不支持的样式属性都已被替换为跨端兼容的等效实现，或被原平台条件编译所包裹，输出到 RN 的部分不包含不支持的样式属性。
- 检查确保 `<style>`、`<template>` 和 `<script>` 中不存在大面积的条件编译，所有添加的条件编译仅最小包裹不兼容的样式片段。
- 样式行注释规则：参考 [样式行注释规则](./references/rn-style-comment-rules.md)
