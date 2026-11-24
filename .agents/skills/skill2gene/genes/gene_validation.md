<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_validation -->
<!-- signals_match: 验证, validation, 校验, 对比, 覆盖率, 质量检查, gene质量 -->

<strategy-gene>
Domain keywords: 验证, validation, 校验, 覆盖率, 质量检查, 对比原skill, token计数
Summary: 转换完成后验证 Gene 集合的质量——检查控制信号覆盖率、token 预算合规、结构规范性，确保蒸馏没有丢失关键决策约束
Strategy:
1. 控制信号覆盖率：逐一对照原 Skill workflow 中的每个操作步骤，确认有对应 Gene 的 Strategy 条目覆盖
2. Token 预算检查：每个 Gene 文件 200-300 tokens；超出需要拆分或精简，不足可能遗漏了关键约束
3. 结构规范性：每个 Gene 必须包含完整的 GEP 元数据头（type/schema_version/id/signals_match）和 strategy-gene 标签体
4. 独立性检查：每个 Gene 能独立提供一个维度的行为控制，不依赖其他 Gene 的上下文才能理解
5. 调度规则检查：SKILL.md 中的调度逻辑能覆盖所有典型使用场景，Gene 之间的激活条件不冲突
6. 对比测试（可选）：同一任务分别用原 Skill 和新 Gene 集合执行，对比结果质量和 token 消耗
7. AVOID: 只检查格式不检查语义——关键是 Gene 的策略步骤能否实际控制模型行为，而非格式是否漂亮
</strategy-gene>
