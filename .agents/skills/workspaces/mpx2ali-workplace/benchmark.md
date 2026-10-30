# Mpx2Ali Skill Benchmark 汇总

当前已完成评测集为 [iteration-3](iteration-3/README.md)，使用本地仓库编译器并验证导航自动转换。模型为 `gpt-6.1-sol / high`；mpx 与 mpx2ali 均为 **15/15（100%）**，6次运行全部成功。

查看 [详细报告](iteration-3/benchmark.md) 与 [HTML 查看页](iteration-3/review.html)。本轮每个用例每组仅运行一次；真机交互未验证。

已完成的历史结果见 [iteration-2](iteration-2/benchmark.md)，其依赖为当时安装的发布包，不与本地源码基准混用。旧输出、指标及语义复核证据保留。

工作区级 `npm test` 自动发现现存轮次。框架回归与编译探针不属于模型评测结果。
