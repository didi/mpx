<!-- GEP Gene Object -->
<!-- type: Gene -->
<!-- schema_version: 1.0.0 -->
<!-- id: gene_failure_encoding -->
<!-- signals_match: 失败经验, AVOID, failure, 警告, 踩坑, pitfall, error pattern -->

<strategy-gene>
Domain keywords: 失败经验, AVOID, failure history, warning, pitfall, 反模式, 踩坑记录
Summary: 失败经验蒸馏为独立的紧凑 AVOID 警告——研究表明独立的 failure warnings 是最有效的失败编码形式（+4.6pp），混合编排反而削弱策略和失败信息的各自效果
Strategy:
1. 从原 Skill 的 pitfalls / error_handling / 常见问题 中提取失败模式，每个失败模式压缩为一条 AVOID 指令
2. AVOID 指令格式："AVOID: [具体错误行为]"——不需要解释为什么错，只需要明确什么不能做
3. 将 AVOID 项嵌入对应 Gene 的 Strategy 列表末尾（按编号排列），而非单独附加为独立段落
4. 如果失败经验与多个 Gene 相关，放在最相关的那一个 Gene 中——不要跨 Gene 重复
5. 经验积累时优先更新已有 AVOID 项使其更精确，而非追加新条目——选择性压缩优于堆积式增长
6. AVOID: 将失败案例的完整上下文（堆栈、日志、讨论过程）放入 Gene——Gene 只要行为指令，完整案例放 Capsule
7. AVOID: 在 Strategy 步骤和 AVOID 之间混排——先写正向策略步骤，最后列 AVOID 项
</strategy-gene>
