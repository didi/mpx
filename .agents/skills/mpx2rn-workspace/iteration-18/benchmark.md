# mpx 与 mpx2rn 对比评测（iteration-18 重跑）

模型重跑报告生成时间：2026-10-27 23:27:35 CST。模型 `gpt-6.1-sol`，思考强度 `high`；6 个用例 × 2 组 × 1 次，12/12 正常退出。

| 指标 | mpx | mpx2rn |
| --- | ---: | ---: |
| 自动评分（修复后） | 59/61 | 59/61 |
| 总通过率 | 96.72% | 96.72% |
| 总 Token（含缓存输入） | 5,086,785 | 4,400,561 |
| 单任务平均耗时 | 202.8s | 180.7s |
| 工具调用数 | 173 | 113 |
| 复核后通过数 | 59/61 | 59/61 |

## 各用例

| 用例 | mpx | mpx2rn |
| --- | ---: | ---: |
| 0 style-layout-adaptation | 14/16 | 15/16 |
| 1 template-api-adaptation | 9/9 | 8/9 |
| 2 dynamic-capability-adaptation | 15/15 | 15/15 |
| 3 new-rating-component | 8/8 | 8/8 |
| 4 new-segmented-control | 5/5 | 5/5 |
| 5 new-task-board-page | 8/8 | 8/8 |

## 自动评分未通过项

- mpx case 0 / s6：字体：RN 使用 bold/normal 字重和单一字体名
- mpx case 0 / l11：样式：父子同向 margin 折叠的 .detail-section（margin-top:20rpx）与首子元素 .detail-header（margin-top:12rpx）归到父元素侧，保持 20rpx 并清除子元素顶部 margin
- mpx2rn case 0 / l11：样式：父子同向 margin 折叠的 .detail-section（margin-top:20rpx）与首子元素 .detail-header（margin-top:12rpx）归到父元素侧，保持 20rpx 并清除子元素顶部 margin
- mpx2rn case 1 / j1：生命周期：隔离 RN 不支持的 onShareTimeline/onTabItemTap，保留 onShareAppMessage


## 评分器修复与验证

评分更新时间：2026-10-28T12:00:49.780554+08:00。

- 本轮先清空旧输出、执行日志、评分与报告，再重新执行全部 12 个独立模型任务；未复用旧输出或旧指标。
- 每用例每组仅运行 1 次；run_summary 的通过率是 6 个用例通过率的均值，weighted_totals 是按 61 条断言汇总的通过率。标准差来自不同用例，不是重复运行稳定性。
- Token 来自 Codex JSONL usage，包含缓存输入，不等于计费 Token；耗时为单个模型进程墙钟时间。
- 12 份输出的 ESLint 均为 0 错误、0 警告。
- 全部 12 份输出 wx/iOS 编译无错误；两组评分组件在各目标各有 1 条缺少 usingComponents 的模板警告（共 4 条），严格校验标记为未完全通过。独立环境未注册题目约定的全局组件。
- RN 模板/样式 Jest：2 套件、98 项通过；评分器回归测试 69 项通过，旧输出审计快照测试 1 项跳过。
- 未进行真机验证，当前编译环境未覆盖完整 UnoCSS 样式生成；不将模板编译通过等同于实际页面视觉正确。
- 根据复核修复共享评分器并对同一批输出重评分，自动得分现在为 mpx 59/61、mpx2rn 59/61（均 96.72%），与复核一致；未重跑模型，未修改输出、模型日志或耗时/Token 指标。
- 修复前自动评分为 mpx 59/61、mpx2rn 57/61。仅 mpx2rn case 2/g8 与 case 5/a2 从未通过变为通过，另外 120 个断言判定保持不变。
- 动态 class 仅在条件为 true 或与本节点 wx:if 条件一致时并入 CSS 层叠；不将任意条件分支中的可见样式视为必然生效。默认参数支持 decoded = raw 或 decoded = {}，仍检查解码参数优先级与同步注册。
- 原始复核证据保留在 audit/opacity-rerun-review.json 与 audit/query-rerun-review.json，其中 static_passed 字段记录修复前判定。

查看 [交互报告](review.html)、[评分汇总](grading-summary.json) 和 [执行状态](execution-results.json)。
