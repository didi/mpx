# Skill Benchmark: mpx2web

**Model**: gpt-5.6-sol (xhigh)
**Date**: 2026-09-24T08:56:07Z
**Evals**: 0, 1, 2, 3 (1 runs each per configuration)

## Summary

| Metric | Mpx2Web | No Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 97% ± 6% | 64% ± 36% | +0.33 |
| Time | 573.2s ± 194.6s | 534.1s ± 145.0s | +39.1s |
| Tokens | 2813021 ± 1936088 | 2938508 ± 2321006 | -125487 |

## Notes

- 评分方式与 Mpx2RN iteration-17 对齐：每条断言由 Python 确定性静态检查返回 PASS/FAIL。
- 汇总分对各 Case 的通过率取平均；不使用额外评分模型。
- 本 Benchmark 不执行构建、浏览器、SSR renderer、E2E 或真机验收。
