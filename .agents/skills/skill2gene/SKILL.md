---
name: skill2gene
description: 将传统文档导向的 Procedural Skill 转换为紧凑的 Strategy Gene 格式。基于论文 "From Procedural Skills to Strategy Genes" 的 Gene Evolution Protocol (GEP)，将 ~2500 token 的文档型 Skill 蒸馏为 ~200-300 token 的控制型 Gene 集合。当用户要求将 skill 转为 gene、优化 skill 的 token 效率、将经验知识蒸馏为紧凑控制指令、或提到 gene/GEP/strategy-gene 时调用。
metadata:
  version: "1.0.0"
  author: auto
  approach: gene-evolution-protocol
  paper: "From Procedural Skills to Strategy Genes (arXiv:2604.15097)"
---

# Skill2Gene: Procedural Skill → Strategy Gene 转换器

本 Skill 自身采用 Gene 理念编写——紧凑、控制导向、面向行为而非文档。

## 核心理念

传统 Skill 是文档导向的经验表达（~2500 tokens），优化目标是人类可读性和完整性。Strategy Gene 是控制导向的经验表达（~200-300 tokens），优化目标是推理时行为控制的信号密度和有效性。

**Gene 不是 Skill 的压缩版，而是一种不同的经验抽象。**

## Gene 注册表

| gene_id | 触发信号 | 文件 |
|---------|---------|------|
| `gene_distill` | 蒸馏, 提取, 转换skill, 拆分gene | [genes/gene_distill.md](genes/gene_distill.md) |
| `gene_gep_format` | GEP格式, strategy-gene标签, 字段 | [genes/gene_gep_format.md](genes/gene_gep_format.md) |
| `gene_signal_density` | 信号密度, token预算, 精简, 去噪 | [genes/gene_signal_density.md](genes/gene_signal_density.md) |
| `gene_failure_encoding` | 失败经验, AVOID, 警告, 踩坑 | [genes/gene_failure_encoding.md](genes/gene_failure_encoding.md) |
| `gene_evolution` | 演化, 迭代, 积累, capsule, event | [genes/gene_evolution.md](genes/gene_evolution.md) |
| `gene_validation` | 验证, 校验, 质量检查, 对比 | [genes/gene_validation.md](genes/gene_validation.md) |

## 转换流程

### 输入：一个传统 Procedural Skill

读取目标 Skill 的全部文件：SKILL.md + references/ + scripts/

### Step 1: 分析与拆分

**始终加载：** `gene_distill` + `gene_gep_format`

1. 识别 Skill 中的控制信号——哪些内容实际影响模型行为（通常集中在 workflow 部分）
2. 按功能域将控制信号拆分为原子 Gene 单元
3. 丢弃纯文档性内容（overview、背景解释、API 文档搬运）

### Step 2: 蒸馏为 Gene

**按需加载：** `gene_signal_density` + `gene_failure_encoding`

对每个原子功能域：
1. 提取 keywords（触发信号）
2. 写 1 句 summary（行为意图）
3. 写 3-7 条 strategy（有序决策步骤）
4. 提取 AVOID 项（从 pitfalls/error_handling 中蒸馏为紧凑警告）

### Step 3: 组装与验证

**加载：** `gene_validation`

1. 编写 GENES.md 注册表
2. 编写 SKILL.md 入口（含调度规则）
3. 对比验证：gene 是否覆盖了原 skill 的有效控制信号

### Step 4: 演化准备（可选）

**加载：** `gene_evolution`

为后续迭代演化预留 Capsule 和 Event 接口

## 详细参考

| 参考文档 | 用途 |
|---------|------|
| [GEP 协议参考](references/gep-protocol.md) | Gene Evolution Protocol 完整定义、对象模型、演化循环 |
