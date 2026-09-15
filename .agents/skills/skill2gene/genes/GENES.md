# Skill2Gene Strategy Gene Registry

> 本文件是 Skill→Gene 转换工具的 Gene 表达形式——基于 Gene Evolution Protocol (GEP)，将 "如何把 Skill 转换为 Gene" 这一方法论本身蒸馏为 6 个原子 Strategy Gene。
>
> 论文来源：*From Procedural Skills to Strategy Genes: Towards Experience-Driven Test-Time Evolution* (arXiv:2604.15097)

## Gene 注册表

| gene_id | 触发关键词 | 控制摘要 | 文件 |
|---------|-----------|---------|------|
| `gene_distill` | 蒸馏, 提取, 转换, 拆分 | 从文档型 Skill 中定位稀疏控制信号，按功能域拆为原子 Gene | [gene_distill.md](gene_distill.md) |
| `gene_gep_format` | GEP, strategy-gene, 格式, 字段, schema | 严格遵循 GEP 协议的 Gene 对象格式 | [gene_gep_format.md](gene_gep_format.md) |
| `gene_signal_density` | 信号密度, token, 精简, 去文档化 | 最大化每 token 的行为控制信号，剔除文档噪声 | [gene_signal_density.md](gene_signal_density.md) |
| `gene_failure_encoding` | 失败, AVOID, 警告, 踩坑, pitfall | 失败经验蒸馏为独立紧凑警告，不与策略混排 | [gene_failure_encoding.md](gene_failure_encoding.md) |
| `gene_evolution` | 演化, 迭代, capsule, event, 积累 | 为 Gene 预留演化接口，支持经验的增量积累 | [gene_evolution.md](gene_evolution.md) |
| `gene_validation` | 验证, 校验, 对比, 覆盖率 | 验证蒸馏后的 Gene 集合是否覆盖原 Skill 的有效控制信号 | [gene_validation.md](gene_validation.md) |

## 调度逻辑

### 完整转换流程

**始终激活：** `gene_distill` + `gene_gep_format`

**分析阶段：** `gene_signal_density`（定位有效信号、剔除噪声）

**蒸馏阶段：** `gene_failure_encoding`（处理失败经验编码）

**收尾阶段：** `gene_validation`（验证覆盖率和质量）

**可选：** `gene_evolution`（为后续演化预留接口）

## GEP 层级说明

```
Gene（原子控制单元）→ 直接注入推理时上下文，控制行为
  ↓ 组合
Capsule（已验证执行路径）→ 记录成功的 gene 组合 + 转换轨迹
  ↓ 记录
Event（不可变演化日志）→ 记录 gene 的修正/优化/验证历史
```

## 扩展参考

- [SKILL.md（入口）](../SKILL.md)
- [GEP 协议参考](../references/gep-protocol.md)
