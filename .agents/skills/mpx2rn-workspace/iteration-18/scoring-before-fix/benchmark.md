# Skill Benchmark: mpx vs mpx2rn

> **评分复核已完成：两组均为 59/61（96.72%）。** 原评分存在 10 次误扣分、1 次误判通过；下表保留历史原始统计，不作为实际质量优劣结论。[查看实际输出复核及证据](score-audit.md)。

**Model**: gpt-6.1-sol
**Date**: 2026-10-27T10:39:17Z
**Evals**: 0, 1, 2, 3, 4, 5 (1 runs each per configuration)

## Summary

| Metric | Mpx | Mpx2Rn | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 89% ± 9% | 93% ± 8% | -0.04 |
| Time | 167.3s ± 27.6s | 208.4s ± 66.5s | -41.1s |
| Tokens | 847953 ± 271863 | 823491 ± 153011 | +24462 |

## Notes

- 每用例每组仅运行 1 次，共 12 次。汇总中的标准差来自 6 个不同用例，不是重复运行的稳定性估计。
- 原始静态总分：mpx 53/61（86.89%），mpx2rn 56/61（91.80%）；用例平均通过率分别为 88.87% 和 92.71%，两者口径不同。
- 发现静态评分器误判或写法偏置；保留所有原始分数，不以原始差值直接判定实际质量优劣。具体失败项证据见本报告审核表。
- 两组的 s8 均已用 summary-accent 真实节点保留相同高度和 background-color；检查器只读取 background/background-image，漏掉 background-color。
- 两组的 l12 均以 stat-cell 包装层 padding:16rpx 24rpx 保留间距；检查器只识别 stat-card-wrapper/stat-card-wrap 两种包装层类名。
- 两组的 n13 均在模板内直接用 readonly 三元表达式和正确的 range 切换提示组件；检查器额外要求两个名称出现在 script 中。需求已约定全局注册。
- mpx 的 t3 已使用 mpxTagName@ios="scroll-view" 和 bindscrolltolower@ios；检查器只识别直接的 scroll-view 标签与无后缀事件属性。
- mpx 的 j0 使用 getProxy({ usePromise: true }) 返回的 api 对象调用环境 API；检查器硬编码要求 script 中出现 mpx.。
- mpx2rn 的 a2 使用同步 onLoad((rawQuery = {}, decodedQuery) => ...) 和 (decodedQuery || rawQuery).category；检查器额外要求字面量 decodedQuery.category。
- 两组 l11 均保留 detail-section margin:20rpx 和 detail-header margin-top:12rpx，未按断言要求消除父子同向 margin。
- mpx 的 g8 检查未合并 toast-mask-visible 的 opacity:1 覆盖；g10 只接受 RN 后缀 key，而输出使用普通 key。两项保留失败，仍需目标端语义验证，不据此补分。
- 构建限制：mpx case 2 错把 --project-root 指向仓库根目录，未找到评测工作区安装的 CLI service；未重跑模型或修改输出。两组 case 3 均受独立环境缺少全局提示组件注册影响而有警告。两组 case 5 的 UnoCSS 样式生成验证均未完成。
- Token 为 Codex JSONL 的 input_tokens + output_tokens，包含缓存输入；不等于计费 Token 或费用。耗时为每个子进程完整耗时，三并发下不能把耗时总和作为整轮墙钟时间。
- 本轮只涉及 wx/ios，未验证 Web/Android/Harmony 或真机表现。

## 原始得分与资源总量

| 指标 | mpx | mpx2rn |
| --- | ---: | ---: |
| 通过断言数（分母 61） | 53 | 56 |
| 总 Token（含缓存输入） | 5,087,718 | 4,940,944 |
| 缓存输入 Token | 4,606,592 | 4,480,128 |
| 工具调用数 | 118 | 124 |

## 逐用例原始分数

| 用例 | mpx | mpx2rn |
| --- | ---: | ---: |
| 0 style-layout-adaptation | 13/16 | 13/16 |
| 1 template-api-adaptation | 7/9 | 9/9 |
| 2 dynamic-capability-adaptation | 13/15 | 15/15 |
| 3 new-rating-component | 7/8 | 7/8 |
| 4 new-segmented-control | 5/5 | 5/5 |
| 5 new-task-board-page | 8/8 | 7/8 |

## 失败项与输出证据

以下为原始评分器结果。审核备注不覆盖 passed 值，未调整评分器或模型输出。

| 用例 / 组 | 失败断言 | 原始输出 |
| --- | --- | --- |
| 0 / mpx | s8, l11, l12 | [data-panel.mpx](eval-0-style-layout-adaptation/mpx/outputs/data-panel.mpx) |
| 0 / mpx2rn | s8, l11, l12 | [data-panel.mpx](eval-0-style-layout-adaptation/mpx2rn/outputs/data-panel.mpx) |
| 1 / mpx | t3, j0 | [order-list.mpx](eval-1-template-api-adaptation/mpx/outputs/order-list.mpx) |
| 2 / mpx | g8, g10 | [carousel-card.mpx](eval-2-dynamic-capability-adaptation/mpx/outputs/carousel-card.mpx) |
| 3 / mpx | n13 | [rating-selector.mpx](eval-3-new-rating-component/mpx/outputs/rating-selector.mpx) |
| 3 / mpx2rn | n13 | [rating-selector.mpx](eval-3-new-rating-component/mpx2rn/outputs/rating-selector.mpx) |
| 5 / mpx2rn | a2 | [task-board.mpx](eval-5-new-task-board-page/mpx2rn/outputs/task-board.mpx) |

[查看全部输出和评分](review.html)。各组 run-1/ 中保留 agent.jsonl、stderr.log、run.json、metrics.json、timing.json 和 grading.json。
