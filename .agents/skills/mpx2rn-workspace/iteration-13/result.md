# iteration-13 评测结果

iteration-13 已清空旧输出并重新执行 9 个用例的 mpx2rn、mpx2rn-simple 与 no_skill 三组隔离评测，共生成 27 份新产物。

| 配置 | 通过断言 | 加权通过率 | 逐 eval 平均通过率 |
| --- | ---: | ---: | ---: |
| mpx2rn | 110/110 | 100.0% | 100.0% |
| mpx2rn-simple | 105/110 | 95.5% | 95.2% |
| no_skill | 64/110 | 58.2% | 56.0% |

| Eval | mpx2rn | mpx2rn-simple | no_skill |
| --- | ---: | ---: | ---: |
| 0 style-adaptation | 15/15 | 14/15 | 13/15 |
| 1 template-adaptation | 10/10 | 10/10 | 5/10 |
| 2 script-json-adaptation | 9/9 | 9/9 | 3/9 |
| 3 gradient-animation-interaction | 11/11 | 9/11 | 6/11 |
| 4 text-layout-selector | 11/11 | 9/11 | 1/11 |
| 5 conditional-compile-advanced | 10/10 | 10/10 | 8/10 |
| 6 new-rating-component | 15/15 | 15/15 | 11/15 |
| 7 new-segmented-control | 14/14 | 14/14 | 8/14 |
| 8 new-task-board-page | 15/15 | 15/15 | 9/15 |

两种 Skill 同时通过而 no_skill 失败 42 条；三组已无共同失败断言。资源指标未采集，因此不比较耗时、token 与工具调用。评分器与调度脚本 55 条单元测试全部通过。
