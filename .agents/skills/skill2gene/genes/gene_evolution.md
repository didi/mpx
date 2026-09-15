<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_evolution -->
<!-- signals_match: 演化, evolution, 迭代, capsule, event, 积累, 经验更新, GEP loop -->

<strategy-gene>
Domain keywords: 演化, evolution, GEP loop, capsule, event, 迭代, 经验积累, solidify
Summary: Gene 不仅是一次性控制单元，也是经验演化的载体——通过 GEP 六步循环（Scan→Signal→Intent→Mutate→Validate→Solidify）实现持续改进
Strategy:
1. Gene 转换完成后，在输出目录中保留 GEP 三层结构的接口：genes/（原子控制）、capsules/（成功执行路径，待积累）、events/（演化日志，待记录）
2. 首次转换只产出 Gene 层；Capsule 和 Event 在后续实际使用中通过 GEP 循环自然积累
3. GEP 演化循环的触发信号：执行失败 / 测试不通过 / 用户反馈纠正——这些信号驱动 Gene 的定向修正
4. 演化时修改 Gene 的 Strategy 或 AVOID 项，保持 Gene 的结构不变——经验积累是选择性的，不是追加式的
5. 成功的执行路径记录为 Capsule（任务签名 + 使用的 Gene 集合 + 执行轨迹 + 验证结果），供后续同类任务参考
6. AVOID: 将所有失败/修正历史直接追加到 Gene 文本中——这会稀释控制信号，失败经验应先蒸馏为 AVOID 警告再合并
7. AVOID: 在一个 Gene 中组合过多经验——单一精准 Gene 的效果优于多 Gene 组合（研究显示组合 Gene 性能下降 -6.1pp）
</strategy-gene>

<references>
- [GEP 协议参考](../references/gep-protocol.md)
</references>
