---
name: mpx2rn-gene
description: Mpx 跨端输出 RN 开发适配的 Gene 表达形式——基于 Gene Evolution Protocol (GEP) 将文档导向的 Skill 蒸馏为紧凑的 Strategy Gene 集合。当用户要求对已有 Mpx 组件进行 RN 跨端适配改造、创建符合 RN 跨端兼容规范的 Mpx 组件时调用。与 mpx2rn skill 的区别：mpx2rn 提供完整文档参考，本 skill 提供紧凑的行为控制指令，适合执行阶段直接注入上下文。
metadata:
  version: "1.0.0"
  author: donghongping
  based_on: mpx2rn
  approach: gene-evolution-protocol
---

# Mpx2RN Strategy Gene Skill

本 Skill 基于 Gene Evolution Protocol (GEP) 蒸馏为 8 个原子 Strategy Gene，每个 ~200-300 tokens，直接控制行为而非解释文档。

## Gene 注册表

| gene_id | 触发信号 | 文件 |
|---------|---------|------|
| `gene_cross_platform` | 跨平台兼容, dual-track, 原平台 | [genes/gene_cross_platform.md](genes/gene_cross_platform.md) |
| `gene_template` | template, wx:class, wx:style, wx:ref, 基础组件 | [genes/gene_template.md](genes/gene_template.md) |
| `gene_style_selector` | selector, 选择器, 单类, compound, pseudo | [genes/gene_style_selector.md](genes/gene_style_selector.md) |
| `gene_style_property` | style, flex, rpx, font-weight, display-none | [genes/gene_style_property.md](genes/gene_style_property.md) |
| `gene_script` | script, lifecycle, mpx.xxx, api-proxy, selector-api | [genes/gene_script.md](genes/gene_script.md) |
| `gene_conditional_compile` | 条件编译, @mpx-if, @mode, __mpx_mode__ | [genes/gene_conditional_compile.md](genes/gene_conditional_compile.md) |
| `gene_text_overflow` | text-overflow, numberOfLines, hairlineWidth | [genes/gene_text_overflow.md](genes/gene_text_overflow.md) |
| `gene_json_config` | json, usingComponents, disableScroll, tabBar | [genes/gene_json_config.md](genes/gene_json_config.md) |

## 调度规则

### 任务一：对已有 Mpx 组件进行 RN 跨端适配改造

**始终加载：** `gene_cross_platform` + `gene_conditional_compile`

**按 SFC 区块顺序加载：**
1. `<template>` → 读取 `gene_template`
2. `<script>` → 读取 `gene_script`
3. `<style>` → 依次读取 `gene_style_selector` → `gene_style_property` → `gene_text_overflow`
4. `<script name="json">` / JSON 配置 → 读取 `gene_json_config`

**收尾：** 编译校验 → 按错误分类回到对应 gene 修正

### 任务二：从零创建符合 RN 跨端兼容的 Mpx 组件

**始终加载：** `gene_cross_platform` + `gene_conditional_compile`

**全部 gene 并行加载：** 编写时直接遵循所有 gene 约束

**收尾：** 编译校验 → ESLint 校验

## 详细参考

当 gene 中的策略指令不足以解决具体问题时，查阅详细参考文档：

| 参考文档 | 用途 |
|---------|------|
| [模板能力参考](references/rn-template-reference.md) | 基础组件属性/事件支持明细 |
| [脚本能力参考](references/rn-script-reference.md) | 生命周期/实例方法/组合式 API 支持明细 |
| [样式能力参考](references/rn-style-reference.md) | 样式属性逐项支持情况 |
| [样式开发最佳实践](references/rn-style-practice.md) | 常见样式兼容方案 |
| [环境 API 参考](references/rn-api-reference.md) | mpx.xxx API 支持情况 |
| [JSON 配置参考](references/rn-json-reference.md) | 页面/组件 JSON 配置支持 |
| [条件编译](references/conditional-compile.md) | 各区块条件编译语法 |
| [单文件组件](references/single-file-component.md) | Mpx SFC 基本结构 |
