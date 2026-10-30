# mpx 与 mpx2rn 对比评测（iteration-18 最新结果）

报告更新时间：2026-10-29T11:43:08.167083+08:00。模型 `gpt-6.1-sol`，思考强度 `high`。

本次采用最新定向重跑的 **mpx case 0**，其余 11 个结果沿用原全量重跑。共选取 6 个用例 × 2 组的 12 份结果；本次没有重新执行模型。

| 指标 | mpx | mpx2rn |
| --- | ---: | ---: |
| 自动评分（校准后） | 61/61 | 59/61 |
| 总通过率 | 100.00% | 96.72% |
| 所选结果总 Token（含缓存输入） | 5,081,742 | 4,400,561 |
| 单任务平均耗时 | 203.4s | 180.7s |
| 工具调用数 | 157 | 113 |

## 各用例

| 用例 | mpx | mpx2rn | 来源 |
| --- | ---: | ---: | --- |
| 0 style-layout-adaptation | 16/16 | 15/16 | mpx：10-28 定向重跑；mpx2rn：10-27 全量重跑 |
| 1 template-api-adaptation | 9/9 | 8/9 | 10-27 全量重跑 |
| 2 dynamic-capability-adaptation | 15/15 | 15/15 | 10-27 全量重跑 |
| 3 new-rating-component | 8/8 | 8/8 | 10-27 全量重跑 |
| 4 new-segmented-control | 5/5 | 5/5 | 10-27 全量重跑 |
| 5 new-task-board-page | 8/8 | 8/8 | 10-27 全量重跑 |

## 本次校准变化

- `s6`：`.summary-title` 改用 `font-weight: bold`。
- `l11`：`.detail-section` 保留 `margin: 20rpx`，`.detail-header` 在 ios 分支使用 `margin-top: 0`，其他端保留 `12rpx`。
- mpx case 0 从 14/16 升为 16/16，总分从 59/61 升为 61/61；其余 120 项判定保持不变。

## 尚未通过的断言

- mpx2rn case 0 / `l11`：样式：父子同向 margin 折叠的 .detail-section（margin-top:20rpx）与首子元素 .detail-header（margin-top:12rpx）归到父元素侧，保持 20rpx 并清除子元素顶部 margin
- mpx2rn case 1 / `j1`：生命周期：隔离 RN 不支持的 onShareTimeline/onTabItemTap，保留 onShareAppMessage

## 范围与证据

- 本报告按每组每用例的最新结果汇总：mpx case 0 使用 2026-10-28 的定向重跑，其他 11 个结果沿用 2026-10-27 的全量重跑。本次仅更新报告并重新评分，未启动模型。
- mpx case 0 从 14/16 提升至 16/16：s6 字重使用 bold，l11 在 ios 分支清除首子节点顶部 margin，父级保留 20rpx。其余 120 项判定不变。
- mpx 为 61/61（100%），mpx2rn 为 59/61（96.72%）；mpx2rn 剩余未通过项为 case 0/l11 与 case 1/j1。
- 本次仅对 mpx case 0 使用了更新后的 Skill，不代表两组全部用例都已按当前 Skill 版本重跑。
- 性能指标与所选输出对应，mpx case 0 使用 977,842 Token、213.594 秒、24 次工具调用；不累计已被替换的旧任务成本。Token 包含缓存输入，不等于计费量。
- run_summary 为各用例通过率的均值，weighted_totals 为按 61 条断言汇总的通过率；不同用例的标准差不是重复运行稳定性。
- 评分器已独立于其他 iteration，75 项回归测试全部通过；此前两个静态误判修复继续生效，原复核证据中的 static_passed 是修复前记录。
- 定向重跑目录已删除，当前 case 0 输出从原本地会话记录还原，恢复来源见 eval-0-style-layout-adaptation/mpx/run-1/session-source.json。旧 case 0 产物和指标保存在 audit/mpx-case0-before-focused-rerun/；未将旧 stdout/stderr 冒作新日志。
- 评分组件原有 4 条全局组件注册警告仍保留；未做真机验证或完整 UnoCSS 样式生成验证。

- 当前 12 份输出 ESLint 均通过；恢复后的最新 mpx case 0 再次通过 wx/iOS 编译，无错误或警告。75 项评分器回归测试全部通过。

查看 [交互报告](review.html)、[评分汇总](grading-summary.json)、[执行状态](execution-results.json) 和 [定向重跑来源](eval-0-style-layout-adaptation/mpx/run-1/session-source.json)。
