# iteration-12 评测结果

iteration-12 对 9 个用例分别执行了 mpx2rn、mpx2rn-simple 与 no_skill，共 27 个当前有效运行结果；eval-5 已使用三个独立子 agent 重跑。

| 配置 | 通过断言 | 加权通过率 | 逐 eval 平均通过率 |
| --- | ---: | ---: | ---: |
| mpx2rn | 106/110 | 96.4% | 96.2% |
| mpx2rn-simple | 105/110 | 95.5% | 95.1% |
| no_skill | 64/110 | 58.2% | 56.8% |

| Eval | mpx2rn | mpx2rn-simple | no_skill |
| --- | ---: | ---: | ---: |
| 0 style-adaptation | 14/15 | 14/15 | 13/15 |
| 1 template-adaptation | 10/10 | 9/10 | 3/10 |
| 2 script-json-adaptation | 9/9 | 9/9 | 5/9 |
| 3 gradient-animation-interaction | 11/11 | 11/11 | 7/11 |
| 4 text-layout-selector | 8/11 | 8/11 | 3/11 |
| 5 conditional-compile-advanced | 10/10 | 10/10 | 7/10 |
| 6 new-rating-component | 15/15 | 15/15 | 11/15 |
| 7 new-segmented-control | 14/14 | 14/14 | 9/14 |
| 8 new-task-board-page | 15/15 | 15/15 | 6/15 |

资源指标未采集，因此本轮不比较耗时、token 与工具调用数量。评分器仅解析 wx 原平台与 iOS 目标平台条件分支；eval-5 的语义复核与编译校验结论见 analyst_notes.json，逐断言结果见各 run-1/grading.json。
