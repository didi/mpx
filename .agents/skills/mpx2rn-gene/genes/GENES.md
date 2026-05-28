# Mpx2RN Strategy Gene Registry

> 本文件是 Mpx 跨端输出 RN 开发指南的 **Gene 表达形式**——基于 Gene Evolution Protocol (GEP) 将文档导向的 Skill 蒸馏为紧凑的、面向行为控制的 Strategy Gene 集合。每个 Gene 约 200-300 tokens，提供高信号密度的控制指令而非文档解释。
>
> 原始文档导向的 Skill 参见 [SKILL.md](../SKILL.md)，详细参考资料在 [references/](../references/)。

## Gene 注册表

| gene_id | 触发关键词 | 控制摘要 | 文件 |
|---------|-----------|---------|------|
| `gene_cross_platform` | 跨平台兼容, dual-track, 原平台 | RN 适配不可破坏原平台——双轨保留 | [gene_cross_platform.md](gene_cross_platform.md) |
| `gene_template` | template, wx:class, wx:style, wx:ref, 基础组件 | 模板仅用 RN 支持的组件/属性/事件 | [gene_template.md](gene_template.md) |
| `gene_style_selector` | selector, 选择器, 单类, compound, pseudo | 选择器全部单类化 | [gene_style_selector.md](gene_style_selector.md) |
| `gene_style_property` | style, flex, rpx, font-weight, display-none | 样式属性使用 RN 兼容方案 | [gene_style_property.md](gene_style_property.md) |
| `gene_script` | script, lifecycle, mpx.xxx, api-proxy, selector-api | 脚本统一 mpx.xxx + RN 支持的生命周期 | [gene_script.md](gene_script.md) |
| `gene_conditional_compile` | 条件编译, @mpx-if, @mode, __mpx_mode__ | 各区块用对应语法，最小包裹 | [gene_conditional_compile.md](gene_conditional_compile.md) |
| `gene_text_overflow` | text-overflow, numberOfLines, hairlineWidth | 文本溢出/极细线双轨模式 | [gene_text_overflow.md](gene_text_overflow.md) |
| `gene_json_config` | json, usingComponents, disableScroll, tabBar | JSON 配置仅用 RN 支持字段 | [gene_json_config.md](gene_json_config.md) |
| `gene_evolution` | 演化, evolution, capsule, event, GEP loop | GEP 六步循环驱动 Gene 持续演化 | [gene_evolution.md](gene_evolution.md) |

## Gene 调度逻辑

### 任务一：对已有 Mpx 组件进行 RN 跨端适配改造

**始终激活：** `gene_cross_platform` + `gene_conditional_compile`

**按 SFC 区块顺序激活：**
1. `<template>` → `gene_template`
2. `<script>` → `gene_script`
3. `<style>` → `gene_style_selector` → `gene_style_property` → `gene_text_overflow`
4. `<json>` → `gene_json_config`

**收尾：** 编译校验（`scripts/compile-validate.js`）→ 按错误分类回到对应 gene 修正

### 任务二：从零创建符合 RN 跨端兼容的 Mpx 组件

**始终激活：** `gene_cross_platform` + `gene_conditional_compile`

**全部 gene 并行激活：** 编写时直接遵循所有 gene 约束，避免写完再改

**收尾：** 编译校验 → ESLint 校验

## GEP 三层结构

```
Gene（原子控制单元）→ 直接注入推理时上下文，控制行为
  ↓ 组合
Capsule（已验证执行路径）→ 记录成功的 gene 组合 + 执行轨迹
  ↓ 记录
Event（不可变演化日志）→ 记录 gene 的修正/优化/验证历史
```

### Gene 层（genes/）
8 个领域 Gene + 1 个演化控制 Gene，直接注入推理上下文控制行为。

### Capsule 层（capsules/）
记录成功的 RN 适配执行路径。每个 Capsule 包含：任务签名、使用的 Gene 集合、关键决策点、验证结果。详见 [capsules/CAPSULES.md](../capsules/CAPSULES.md)。

### Event 层（events/）
不可变的 Gene 演化日志。每个 Event 记录一次 Gene 变更的触发信号、变更 diff 和验证结果。详见 [events/EVENTS.md](../events/EVENTS.md)。

### 演化循环（GEP Loop）
```
失败/纠正 → Scan → Signal → Intent → Mutate → Validate → Solidify
                                                    ↓           ↓
                                              更新 Gene    记录 Event + Capsule
```
演化由 `gene_evolution` 控制，触发信号包括：编译失败、ESLint 报错、用户反馈纠正、适配方案不生效。

## 扩展参考

- [SKILL.md（入口）](../SKILL.md)
- [references/（详细能力参考）](../references/)
- [scripts/（编译校验工具）](../scripts/)
