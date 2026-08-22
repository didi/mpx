# Skill Benchmark: mpx2rn eval comparison

**Model**: gpt-5.6-sol (high)  
**Date**: 2026-08-22  
**Evals**: 0–8（每种配置每个 eval 运行 1 次）

## Summary

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

资源指标未采集，因此本轮不比较耗时、token 与工具调用数量。逐断言结果见各组 `run-1/grading.json`，分析见 `analyst_notes.json`。
