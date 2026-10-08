# Skill Benchmark: mpx2rn eval comparison

**Model**: gpt-5.6-sol (high)
**Date**: 2026-08-22T21:52:41Z
**Evals**: 0, 1, 2, 3, 4, 5, 6, 7, 8 (1 run each per configuration)

## Summary

| Metric | Mpx2Rn | Mpx2Rn Simple | No Skill | Delta |
| --- | ---: | ---: | ---: | ---: |
| Pass Rate | 98% ± 4% | 96% ± 7% | 52% ± 25% | +0.02 |
| Time | 244.5s ± 46.1s | 227.5s ± 63.4s | 190.1s ± 50.0s | +17.0s |
| Tokens | 892183 ± 226284 | 940551 ± 427996 | 228529 ± 158025 | -48369 |

## 平均执行耗时

| 配置 | 样本数 | 平均执行耗时 | 最短 | 最长 |
| --- | ---: | ---: | ---: | ---: |
| mpx2rn | 9 | 244.5s（4m 4.5s） | 166.2s | 322.5s |
| mpx2rn-simple | 9 | 227.5s（3m 47.5s） | 151.0s | 365.2s |
| no_skill | 9 | 190.1s（3m 10.1s） | 127.5s | 283.9s |

完整版比精简版平均多用 17.0s（7.5%）；相比 no_skill，完整版和精简版分别平均多用 54.4s（28.6%）和 37.4s（19.7%）。

## 平均 Token 消耗

| 配置 | 样本数 | 平均 Total | 最少 | 最多 | 9 次合计 |
| --- | ---: | ---: | ---: | ---: | ---: |
| mpx2rn | 9 | 892,183 | 521,410 | 1,283,517 | 8,029,643 |
| mpx2rn-simple | 9 | 940,551 | 609,520 | 1,910,093 | 8,464,962 |
| no_skill | 9 | 228,529 | 134,186 | 629,639 | 2,056,758 |

完整版比精简版平均少消耗 48,369 Token（5.1%）；相比 no_skill，完整版和精简版分别平均多消耗 663,654 Token（290.4%）和 712,023 Token（311.6%）。`Total` 为各子 agent session 的累计 Token，包含非缓存输入、缓存读取和输出 Token，不代表单次 Context 大小。

## Notes

- All 27 child agents ran with `cwd` and `codex -C` fixed to `/Users/didi/work/mpx/.agents/skills/mpx2rn-workspace`.
- `mpx2rn` and `mpx2rn_simple` each invoked compile validation in 9/9 runs; `no_skill` invoked it in 0/9 runs.
- Final compile validation passed in 16/18 Skill runs; both eval-6 Skill runs ended with compile exit code 1. Static assertion scores are reported independently.
