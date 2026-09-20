# Skill Benchmark: mpx2web eval comparison

**Model**: gpt-5.6-sol (xhigh)
**Date**: 2026-09-20T03:14:25Z
**Evals**: 0, 1, 2, 3, 4 (1 run each per configuration)

## Summary

| Metric | Mpx2Web | No Skill | Delta |
| --- | ---: | ---: | ---: |
| Pass Rate | 92% ± 13% | 68% ± 24% | +0.24 |
| Time | 655.6 ± 263.6 | 401.5 ± 90.4 | +254.0s |
| Tokens | 3599616 ± 2158219 | 563044 ± 482824 | +3036572 |

## 平均执行耗时

| 配置 | 样本数 | 平均执行耗时 | 最短 | 最长 |
| --- | ---: | ---: | ---: | ---: |
| mpx2web | 5 | 655.6s（10m 55.6s） | 396.4s | 1074.0s |
| no_skill | 5 | 401.5s（6m 41.5s） | 292.5s | 522.0s |

Has Skill 比 No Skill 平均多用 254.0s（63.3%）。

## 平均 Token 消耗

| 配置 | 样本数 | 平均 Total | 最少 | 最多 | 5 次合计 |
| --- | ---: | ---: | ---: | ---: | ---: |
| mpx2web | 5 | 3,599,616 | 2,239,821 | 7,377,670 | 17,998,081 |
| no_skill | 5 | 563,044 | 276,072 | 1,417,466 | 2,815,219 |

Has Skill 比 No Skill 平均多消耗 3,036,572 Token（539.3%）。`Total` 为各子 agent session 的累计 Token，不代表单次 Context 大小。

## Notes

- All 10 child agents ran in isolated workspaces with the configured Codex model.
- Case 等权主分：5 个 Case 各占 20%；Summary 的 ± 表示 Case 之间的离散程度。
- 当前为开发级源码结果：1/3 次完整采样，同模型盲审独立会话。
- 本 Benchmark 只做静态源码评审，不执行构建、E2E、浏览器、SSR renderer 或真机验收。
- 断言微平均仅作诊断：Web 30 项 90.00%/63.33%；SSR 5 项 80.00%/80.00%；生成 5 项 100.00%/80.00%（Has Skill/No Skill）。
- 范围有效性（不计分）：mpx2web 有效 2、待确认 0、无效 0、无需检查 3；no_skill 有效 2、待确认 0、无效 0、无需检查 3。
- 交付与质量检查（不计分）：mpx2web 满足 2、未满足 5、待确认 0、不适用 0；no_skill 满足 2、未满足 5、待确认 0、不适用 0。
- 待运行验证（不计分）共 19 项，逐项内容见 review.html 和 benchmark.json。
