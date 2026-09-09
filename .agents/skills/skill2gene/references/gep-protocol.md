# Gene Evolution Protocol (GEP) 协议参考

> 来源：*From Procedural Skills to Strategy Genes* (arXiv:2604.15097)
> 本文件是详细参考，仅当 Gene 中的策略指令不足以解决问题时查阅。

## 1. 核心概念

### Procedural Skill vs Strategy Gene

| 维度 | Procedural Skill | Strategy Gene |
|------|-----------------|---------------|
| 设计目标 | 人类可读、完整记录 | 模型可控、信号密集 |
| 典型 token | ~2500 | ~200-300 |
| 组织逻辑 | 文档逻辑（章节、示例、API 参考） | 控制逻辑（触发、策略、约束） |
| 优化方向 | 可读性、可教学性 | 行为控制有效性 |
| 实验效果 | Avg. 49.9%（-1.1pp vs 无指导） | Avg. 54.0%（+3.0pp vs 无指导） |

**关键发现：** Gene 不是 Skill 的压缩版。将 Skill 按等 token 截断后效果有提升但仍不如 Gene；将文档内容追加回 Gene 反而降低效果。差异来自表征方式而非信息量。

## 2. GEP 对象层级

```
O = G ∪ C ∪ E
```

### Gene（原子控制单元）

最小可复用经验表征，直接注入推理上下文作为行为控制信号。

```
g = (m, u, π, α, c, v, η)
```

| 符号 | 字段 | 含义 |
|------|------|------|
| m | signals_match | 任务匹配的触发关键词 |
| u | summary | 一句话行为意图 |
| π | strategy | 有序策略步骤列表 |
| α | AVOID | 失败感知的反面约束 |
| c | constraints | 可选执行约束 |
| v | validation | 可选验证钩子 |
| η | metadata | type, schema_version, id, asset_id |

**Gene 文件模板：**

```markdown
<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_xxx -->
<!-- signals_match: keyword1, keyword2, keyword3 -->

<strategy-gene>
Domain keywords: keyword1, keyword2, keyword3
Summary: 一句话说明行为意图
Strategy:
1. 策略步骤一
2. 策略步骤二
3. 策略步骤三
4. AVOID: 具体错误行为一
5. AVOID: 具体错误行为二
</strategy-gene>

<references>
- [参考文档](path/to/reference.md)
</references>
```

### Capsule（已验证执行路径）

记录一次成功的任务执行路径，是 Gene 在具体场景中的实例化验证。

```
κ = (q, G_κ, T_κ, o_κ, V_κ, ℓ_κ)
```

| 字段 | 含义 |
|------|------|
| q | 任务签名 / 问题上下文 |
| G_κ | 本次使用的 Gene 集合 |
| T_κ | 执行轨迹 / 操作路径 |
| o_κ | 观察到的结果 |
| V_κ | 验证记录 / 审计轨迹 |
| ℓ_κ | 谱系指针（关联的 Event 或父 Capsule） |

### Event（不可变演化日志）

记录 Gene 的每一次变更，保持可审计和可追溯。

```
e = (t, ρ, a_src, a_dst, σ, ι, Δ, ν, τ)
```

| 字段 | 含义 |
|------|------|
| t | 事件类型（repair / innovation / validation_pass / validation_fail / solidify） |
| ρ | 运行/episode 标识 |
| a_src, a_dst | 源资产、目标资产 |
| σ | 触发信号 |
| ι | 变更意图 |
| Δ | 变更 diff |
| ν | 验证结果 |
| τ | 时间戳 |

## 3. GEP 演化循环

```
(G, C, E) → SCAN → SIGNAL → INTENT → MUTATE → VALIDATE → SOLIDIFY → (G', C', E')
```

| 阶段 | 操作 |
|------|------|
| **Scan** | 监控运行时轨迹、日志、执行失败或停滞信号 |
| **Signal** | 将原始痕迹转为标准化的协议信号（触发修复或优化） |
| **Intent** | 确定演化目标：repair / optimization / extension |
| **Mutate** | 生成候选资产——修改 Gene 的策略步骤、AVOID 项或关联元数据 |
| **Validate** | 在沙箱中执行候选资产，检查是否通过验证标准 |
| **Solidify** | 将验证通过的变更写回 Gene 仓库，更新 Capsule 和 Event 记录 |

## 4. 关键实验结论

### Gene 构建的渐进分析

| 条件 | Avg. | Δ |
|------|------|---|
| 无指导 | 51.0% | 0.0 |
| Gene (keywords only) | 53.5% | +2.5 |
| Gene (keywords + summary) | 51.0% | +0.0 |
| Gene (keywords + summary + strategy) | 54.0% | +3.0 |

**结论：** Gene 效果不是来自更短的 token，而是来自策略层的显式控制接口。keywords-only 已有效果，但完整 Gene 最强。

### 结构 vs 内容的鲁棒性

- 语义腐败（错误算法/错误领域）严重降低效果（→48.8% / 49.4%）
- 结构扰动（逆序/过约束）影响很小（→52.8% / 55.9%）
- **结论：** Gene 对结构鲁棒，对内容敏感——重要的是编码正确的经验，而非固定的格式

### 失败经验编码

| 条件 | Avg. | Δ |
|------|------|---|
| Strategy only | 52.3% | +2.5 |
| Failure warnings only | 54.4% | +4.6 |
| Failure first | 50.5% | +0.7 |
| Strategy first | 51.8% | +2.0 |

**结论：** 独立的 failure warnings 效果最好；混合编排反而削弱。经验积累应选择性压缩，不应堆积增长。

### Gene 组合

| 条件 | Avg. | Δ |
|------|------|---|
| Single Gene | 54.0% | +3.0 |
| Two conflicting | 53.2% | +2.2 |
| Three complementary | 50.4% | -0.6 |
| Two complementary | 44.9% | -6.1 |

**结论：** 单一精准 Gene 效果最优。组合多个 Gene 通常削弱控制——即使名义上互补的 Gene 也可能竞争注意力、模糊控制焦点。

## 5. 协议不变式

Gene 要成为有意义的协议对象，必须满足：

1. **稳定边界：** 显式字段、规范序列化，可作为对象识别
2. **控制导向结构：** 编码紧凑的控制相关内容（keywords, summary, strategy, AVOID），而非文档解释
3. **可操作性：** 支持匹配、替换、修订、组合
4. **可验证性：** 暴露可执行的验证接口
5. **可溯源：** Capsule 和 Event 保留充分的来源信息，支持重建演化历史
