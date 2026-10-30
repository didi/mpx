# iteration-1 执行结果与评分审计

模型：`gpt-6.1-sol`；推理强度：`high`；两组各8次，共16次；每个case每组1次。

**静态设计得分：mpx 48/48（100%），noskill 44/48（91.67%），差值8.33个百分点。没有完整工程或真机通过结论。**

| Case | mpx | noskill |
| --- | ---: | ---: |
| 0 · target-config | 6/6 | 6/6 |
| 1 · layout-card | 7/7 | 7/7 |
| 2 · scroll-feed | 7/7 | 6/7 |
| 3 · checkout-dialog | 5/5 | 4/5 |
| 4 · account-search | 6/6 | 5/6 |
| 5 · reactive-switcher | 7/7 | 6/7 |
| 6 · routing-subpackage | 5/5 | 5/5 |
| 7 · ssr-shared-state | 5/5 | 5/5 |

## 失败断言

| Case / 组 | 断言 | 逐项证据 |
| --- | --- | --- |
| 2 / noskill | `scroll.query-scope` | [assessment](eval-2-scroll-feed/noskill/run-1/assessment.json) |
| 3 / noskill | `dialog.device-input` | [assessment](eval-3-checkout-dialog/noskill/run-1/assessment.json) |
| 4 / noskill | `network.cancel-token` | [assessment](eval-4-account-search/noskill/run-1/assessment.json) |
| 5 / noskill | `rn.background-priming` | [assessment](eval-5-reactive-switcher/noskill/run-1/assessment.json) |

## 验证与评分限制

- 背景key项仅因缺少预定义的唯一有效key子项扣分，固定位置节点是否实际失效未被证明；若接受其稳定位置身份为等价，noskill为45/48（93.75%），差值缩至6.25个百分点。正式分数保持原断言48/44。
- 当前RN源码showScrollbar不依赖enhanced；两组滚动条均通过，允许无害的额外RN增强配置。Skill对应描述与源码不一致，已披露而未改写本轮Skill。
- 重要未计分问题：mpx case5的4处display:block触发RN getClassMap错误回调；探针未throw且进程exit0，未执行完整业务构建。48/48不能证明产物可运行。
- ESLint最终16/16通过；原Jest记录14组通过、1组含跳过、1组仍失败。case4 noskill为27/28；case7 mpx原6pass1skip，事后只补跑HTTP一项并通过。
- 全部16次独立六目标编译尝试都因缺少业务CLI/工程被阻塞；完整SSR HTML、hydration、浏览器及所有真机行为均未验证。
- 耗时和Token来自真实CLI用量；平均值跨不同case，不是同一case重复采样。Token含累计输入（含缓存输入）和输出，不是单次上下文长度；执行时间不包含后续评分和独立验证。
- 使用独立CLI上下文与提示词隔离，并非文件系统强制隔离。产物保持原始状态，没有在评分后修复来提高分数。

## 实际资源使用

| 组 | 平均执行耗时（秒） | 平均累计Token |
| --- | ---: | ---: |
| mpx | 674.8 | 1,902,321 |
| noskill | 769.0 | 2,182,850 |

每次任务耗时独立记录，不能将并发任务耗时之和当作端到端墙钟时间。缓存输入已计入输入Token，不重复相加。

## 产物与证据

- [可浏览对照页](review.html)、[benchmark.json](benchmark.json)、[benchmark.md](benchmark.md)。
- 独立评审：[Case 0–1](review-0-1.md)、[Case 2–3](review-2-3.md)、[Case 4–5](review-4-5.md)、[Case 6–7](review-6-7.md)。
- [检查汇总](validation/checks-summary.md)、[编译环境阻塞记录](validation/compile-results.json)、[执行和快照一致性审计](validation/execution-audit.json)。
- [RN样式探针](validation/case5-rn-style-probe.json)、[事后本地HTTP补跑](validation/case7-mpx-http-jest.json)。
- 每组 `outputs/` 保留原始代码，`run-1/` 保留dispatch、agent日志、metrics、source-snapshot、assessment、grading与timing。
