# 独立验证汇总

原始交付物未修复，检查结果未反馈给case。ESLint与单文件编译的结果分别报告，不等同业务行为通过。

| Case | 组 | ESLint错误/警告 | 单入口无错误无警告目标 |
| --- | --- | ---: | --- |
| 0 | mpx | 0/0 | wx, web |
| 0 | noskill | 0/0 | 无 |
| 1 | mpx | 0/0 | wx, ali, ios, android, harmony, web |
| 1 | noskill | 0/0 | wx, ali, web |
| 2 | mpx | 0/0 | wx, web |
| 2 | noskill | 0/0 | wx, web |
| 3 | mpx | 0/4 | wx, ios, android, harmony, web |
| 3 | noskill | 0/0 | wx, ali, ios, android, harmony, web |
| 4 | mpx | 0/9 | wx |
| 4 | noskill | 0/0 | wx, ali |
| 5 | mpx | 0/7 | wx, ali, web |
| 5 | noskill | 61/0 | 提前中止，未返回逐目标结果 |
| 6 | mpx | 0/0 | web |
| 6 | noskill | 0/0 | 无 |
| 7 | mpx | 1/0 | wx, ali, ios, android, harmony |
| 7 | noskill | 1/0 | wx, ali, ios, android, harmony |

补充探针：case0 两组 home 的 wx JSON 编译；case3 noskill panel 六目标编译（壳组件默认未递归）；case5 defineEmits 最小文件编译保留未绑定调用，该生成语句隔离VM报 ReferenceError。探针原文件已清理，判定依据汇总在 [逐条评分报告](../assessment-report.md)；这些均不等同完整宿主运行。

隔离Jest：9/9通过；既有工作区依赖Jest：1项通过、4项因名称筛选跳过（其他工作区）。评测隔离测试脚本ESLint通过。

逐组原始 lint、编译诊断及代码产物已清理；保留本表、结构化汇总与逐条评分报告中的结论。所有真机行为、SSR完整HTML/hydration及完整业务工程均未验证。

编译器版本为锁定的发布包2.11.1；部分条件目标方言诊断与题设新版语义存在版本差异。未将此类诊断机械转为静态断言失败。
