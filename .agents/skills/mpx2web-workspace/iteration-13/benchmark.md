# Skill Benchmark: mpx vs mpx2web

**Model**: gpt-6.1-sol (high)
**Date**: 2026-10-27T13:40:57Z
**Evals**: 0, 1, 2, 3 (1 runs each per configuration)

## Summary

| Metric | Mpx | Mpx2Web | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 100% ± 0% | 95% ± 9% | +0.05 |
| Time | 344.5s ± 186.5s | 380.7s ± 188.9s | -36.2s |
| Tokens | 2060390 ± 1625938 | 2064474 ± 1234439 | -4084 |

## Notes

- 4 个 eval，每组各运行 1 次，共 8 次运行；每组 26 条确定性二元断言。
- 通过率为逐 eval 通过率的平均值，与 RN iteration-17 轮次报告一致。
- 编译验证由各组 prompt 与 Skill 决定；静态断言分数不代表编译、浏览器或 SSR 运行通过。
- Token 和耗时来自本轮真实 agent JSONL usage 与执行时间，未复用历史测量。
- 正式复核后按当前仓库Web生命周期修正c3：mpx26/26、mpx2web24/26。自动评分与当前52条结论一致，原始及安装版本评分分别保存在audit/original-scoring和audit/installed-runtime-scoring。
- c3探针从当前仓库pageStatusMixin.web.js执行真实created方法，通过callHook派发参数；当前传[query,query]，mpx正确使用第二参数，旧扣分撤销。mpx2web重复解码URL仍失败。
- 两组均有原断言未覆盖的SSR缺陷：mpx错误首屏接管抛HierarchyRequestError；mpx2web错误首屏后客户端导航到有效文章仍停留错误态。r0-r4满分不能视为完整SSR验收通过，详见score-audit.md。
- 原26项断言文本不变，交付输出及原执行指标不变；此次仅切换c3生命周期基准，c6及其他编译/SSR检查沿用历史评测依赖，未宣称全套已按当前源码重跑。
- 每case/group仅运行一次；逐case等权平均为100%/95.46%；按26条断言计数为100%/92.31%。
- 没有真实微信设备及真实浏览器几何验收，独立运行包含实际编译器、SSR/client bundle、JSDOM及业务方法。两组共同存在vue-demi入口环境因素，均通过交付构建别名处理。
- Token口径仍为CLI输入加输出（含缓存）：mpx输入8,187,509（缓存7,771,008）、输出54,049；mpx2web输入8,198,507（缓存7,882,240）、输出59,387。
