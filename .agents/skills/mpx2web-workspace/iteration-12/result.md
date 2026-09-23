# Skill Benchmark: mpx2web

**Model**: gpt-5.6-sol (xhigh)
**Date**: 2026-09-23T12:04:14Z
**Evals**: 0, 1, 2, 3 (1 runs each per configuration)

## Summary

| Metric | Mpx2Web | No Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 89% ± 12% | 63% ± 45% | +0.27 |
| Time | 898.2s ± 242.1s | 763.9s ± 218.7s | +134.3s |
| Tokens | 2832470 ± 1501665 | 1933193 ± 2054522 | +899277 |

## Notes

- 评分方式与 Mpx2RN iteration-17 对齐：每条断言由 Python 确定性静态检查返回 PASS/FAIL。
- 汇总分对各 Case 的通过率取平均；不使用额外评分模型。
- 本 Benchmark 不执行构建、浏览器、SSR renderer、E2E 或真机验收。
