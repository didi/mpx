# Skill Benchmark: mpx2rn vs mpx2rn-simple vs no_skill

**Model**: current-session-inherited  
**Date**: 2026-08-12  
**Scope**: 重跑 eval-6/7/8；eval-0～5 沿用 iteration-10 原结果

## Summary

| 指标 | mpx2rn | mpx2rn-simple | no_skill |
| --- | ---: | ---: | ---: |
| 断言加权通过率 | 105/110（95.45%） | 104/110（94.55%） | 67/110（60.91%） |
| Eval 等权通过率均值 | 94.92% | 93.64% | 59.68% |

## Rerun results

| Eval | mpx2rn | mpx2rn-simple | no_skill |
| --- | ---: | ---: | ---: |
| 6 | 16/16 | 16/16 | 12/16 |
| 7 | 15/15 | 15/15 | 9/15 |
| 8 | 14/15 | 15/15 | 7/15 |

eval-8 的空 `style` 判断会先去除注释与空白；筛选项和任务卡片的点击态必须使用 `hover-class`，RN 不支持 `hover:` 原子类。本次没有执行器 token、工具调用或精确耗时数据，因此不展示资源指标。
