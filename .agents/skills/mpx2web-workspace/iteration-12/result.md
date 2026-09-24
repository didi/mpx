# Skill Benchmark: mpx2web

**Model**: gpt-5.6-sol (xhigh)
**Date**: 2026-09-24T09:40:31Z
**Evals**: 0, 1, 2, 3 (1 runs each per configuration)

## Summary

| Metric | Mpx2Web | No Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 94% ± 11% | 36% ± 43% | +0.58 |
| Time | 550.9s ± 191.3s | 593.8s ± 219.6s | -42.9s |
| Tokens | 2908440 ± 1637855 | 2039472 ± 1709634 | +868969 |

## Notes

- 评分方式与 Mpx2RN iteration-17 对齐：每条断言由 Python 确定性静态检查返回 PASS/FAIL。
- 汇总分对各 Case 的通过率取平均；不使用额外评分模型。
- 本 Benchmark 不执行构建、浏览器、SSR renderer、E2E 或真机验收。
