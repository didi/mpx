# iteration-2 评测报告归档

8 个 case、mpx/noskill 两组，共 16 次独立执行，信息源审计全部通过。执行模型为 `gpt-6.1-sol / high / priority`。

静态断言结果：mpx 48通过；noskill 33通过、14失败、1待核实。待核实来自当时 Skill 快照中的动画类型说明冲突，按历史记录保留；这不是完整构建或真机通过率。

- [评分与执行统计](benchmark.partial.md) / [JSON](benchmark.partial.json)
- [逐条评分与观察](assessment-report.md) / [JSON](assessment-report.json)
- [信息源审计汇总](source-audit.json)
- [独立验证汇总](validation/checks-summary.md) / [JSON](validation/checks-summary.json)
- [分析备注](analysis-notes.json)

本轮采用封闭信息源分组条件：Skill 组读取当前输入、固定 Skill 快照和自身输出，noskill 组只读取当前输入和自身输出。工具白名单及访问记录检查用于审计；编译、Lint 和评分在交付后独立完成，没有回传给 case。跨轮次执行规则统一维护在 [顶层 README](../README.md)。

已核对恢复的 [用例定义](../evals.json)、[case 输入](../README.md#共用输入与用例定义)及[恢复记录](../input-recovery.json)已移到顶层。本目录仅保留本轮报告，可以单独删除。

代码产物、Skill 快照、日志、验证探针、执行脚本、查看器及临时副本已清理。报告中的历史路径/行号用于定位当时证据，不保证当前可访问，不能从本归档直接复现历史结果。
