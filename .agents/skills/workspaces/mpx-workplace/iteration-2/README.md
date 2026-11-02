# iteration-2 评测报告归档

8 个 case、mpx/noskill 两组，共 16 次独立执行，信息源审计全部通过。执行模型为 `gpt-6.1-sol / high / priority`。

静态断言结果：mpx 48通过；noskill 33通过、14失败、1待核实。待核实来自当时 Skill 快照中的动画类型说明冲突，按历史记录保留；这不是完整构建或真机通过率。

- [评分与执行统计](benchmark.partial.md) / [JSON](benchmark.partial.json)
- [逐条评分与观察](assessment-report.md) / [JSON](assessment-report.json)
- [信息源审计汇总](source-audit.json)
- [独立验证汇总](validation/checks-summary.md) / [JSON](validation/checks-summary.json)
- [分析备注](analysis-notes.json)

执行时 mpx 组仅能读取当前 case 输入、mpx Skill 快照与自己的输出；noskill 组仅能读取输入与自己的输出。工具接口采用路径白名单，禁用其他资料入口，并检查实际访问记录；这不是操作系统级文件系统隔离。编译、lint 和评分在交付后独立执行，没有回传给 case。

原始输入、代码产物、Skill 快照、日志、验证探针、执行脚本、查看器及临时副本已按要求清理。报告中的历史路径/行号仅用于说明当时证据，现已不可直接访问，也不能从本归档重新执行评测。iteration-1 已移除。
