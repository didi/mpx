> **仅静态设计评分，不是完整构建/真机通过率。** mpx 48/48，noskill 44/48；mpx case5另有RN样式错误诊断，noskill case4仍有1项Jest失败。详见[结果审计](score-audit.md)与[检查汇总](validation/checks-summary.md)。

# Skill Benchmark: mpx

**Model**: gpt-6.1-sol
**Date**: 2026-10-29T11:55:55Z
**Evals**: 0, 1, 2, 3, 4, 5, 6, 7 (1 runs each per configuration)

## 按独立断言计分

| 配置 | 通过 / 总数 | 加权通过率 |
| --- | ---: | ---: |
| mpx | 48 / 48 | 100.00% |
| noskill | 44 / 48 | 91.67% |

## Summary

| Metric | Mpx | Noskill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 100% ± 0% | 92% ± 9% | +0.08 |
| Time | 674.8s ± 271.0s | 769.0s ± 279.5s | -94.1s |
| Tokens | 1902321 ± 670597 | 2182850 ± 798278 | -280528 |

## Notes

- 每组 8 个 case、48 条独立断言；加权通过率为通过断言数 / 48。每个 case 每组仅运行一次。
- 各 case 断言数不同；主指标使用加权通过率，Summary 中 Pass Rate 为逐 case 平均值，不混用。
- 语义断言依据 assessment.json 的显式证据评分；不以关键词匹配代替行为验证。
- 耗时与 Token 来自真实运行。input_tokens 已包含 cached_input_tokens，缓存不重复相加。
- 静态与编译验证不代表多端宿主行为通过。差值方向为 mpx - noskill。

## 评分边界与观察

- 本报告是48条预定义断言的静态设计符合率，不是完整构建或多端运行通过率。
- 每组8个case各执行一次，16/16成功交付，均使用gpt-6.1-sol / high；8次mpx执行使用同一Skill快照。没有重复实验，不能据此估计同一任务的重复运行波动。
- 两组共同通过44条；mpx额外通过scroll.query-scope、dialog.device-input、network.cancel-token、rn.background-priming四条。
- 背景key项仅因缺少预定义的唯一有效key子项扣分，固定位置节点是否实际失效未被证明；若接受其稳定位置身份为等价，noskill为45/48（93.75%），差值缩至6.25个百分点。正式分数保持原断言48/44。
- 当前RN源码showScrollbar不依赖enhanced；两组滚动条均通过，允许无害的额外RN增强配置。Skill对应描述与源码不一致，已披露而未改写本轮Skill。
- 重要未计分问题：mpx case5的4处display:block触发RN getClassMap错误回调；探针未throw且进程exit0，未执行完整业务构建。48/48不能证明产物可运行。
- ESLint最终16/16通过；原Jest记录14组通过、1组含跳过、1组仍失败。case4 noskill为27/28；case7 mpx原6pass1skip，事后只补跑HTTP一项并通过。
- 全部16次独立六目标编译尝试都因缺少业务CLI/工程被阻塞；完整SSR HTML、hydration、浏览器及所有真机行为均未验证。
- 耗时和Token来自真实CLI用量；平均值跨不同case，不是同一case重复采样。Token含累计输入（含缓存输入）和输出，不是单次上下文长度；执行时间不包含后续评分和独立验证。
- 使用独立CLI上下文与提示词隔离，并非文件系统强制隔离。产物保持原始状态，没有在评分后修复来提高分数。
