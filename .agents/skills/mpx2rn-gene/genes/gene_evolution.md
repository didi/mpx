<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_evolution -->
<!-- signals_match: 演化, evolution, 迭代, capsule, event, 经验积累, GEP loop, solidify -->

<strategy-gene>
Domain keywords: 演化, evolution, GEP loop, capsule, event, 迭代, 经验积累, solidify, repair
Summary: 通过 GEP 六步循环（Scan→Signal→Intent→Mutate→Validate→Solidify）驱动 Gene 的持续演化——执行失败/用户纠正触发定向修正，成功路径记录为 Capsule
Strategy:
1. 演化触发信号：编译校验失败 / ESLint 报错 / 用户反馈纠正 / 适配方案不生效——任一信号触发 Scan 阶段
2. Scan→Signal：定位失败根因，映射到具体 gene_id（如样式不兼容→gene_style_property，选择器报错→gene_style_selector）
3. Intent→Mutate：确定演化类型（repair/optimization/extension），修改目标 Gene 的 Strategy 或 AVOID 项，保持 Gene 结构不变
4. Validate：修改后重新执行编译校验（scripts/compile-validate.js），确认修正有效且不引入新问题
5. Solidify：验证通过后将变更写回 Gene 文件，同时在 events/ 记录 Event（含 diff、触发信号、验证结果）
6. 成功的完整适配路径记录为 Capsule（任务签名 + 使用的 Gene 集合 + 关键决策点 + 验证结果），存入 capsules/
7. AVOID: 将失败历史直接追加到 Gene 文本中——先蒸馏为 AVOID 警告再合并，保持信号密度
8. AVOID: 在单个 Gene 中组合过多经验——单一精准 Gene 效果优于多 Gene 堆积（组合 Gene 性能下降 -6.1pp）
</strategy-gene>

<references>
- [GEP 协议参考](../../.claude/skills/skill2gene/references/gep-protocol.md)
- [Capsule 模板](../capsules/CAPSULES.md)
- [Event 模板](../events/EVENTS.md)
</references>
