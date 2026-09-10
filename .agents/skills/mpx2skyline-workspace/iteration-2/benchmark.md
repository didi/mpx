# 独立 mpx2skyline 统一基线

2026-09-10 使用当前独立 Skill 完成全部 9 个 case，每项一次，统一模型为 gpt-6-astra / medium。Skill 组 **90/90**。所有结果来自本次执行，不再混合旧版 Skill 的结果。no_skill 组 66/90 仅作为历史参考，本轮未重跑。

| Case | 本轮得分 | 执行耗时 | Total Token |
| --- | ---: | ---: | ---: |
| 0 | 10/10 | 319.2s | 504,481 |
| 1 | 10/10 | 259.0s | 396,382 |
| 2 | 10/10 | 312.7s | 574,639 |
| 3 | 10/10 | 513.7s | 348,976 |
| 4 | 10/10 | 629.1s | 573,826 |
| 5 | 10/10 | 547.5s | 431,028 |
| 6 | 10/10 | 268.4s | 479,907 |
| 7 | 10/10 | 619.5s | 473,389 |
| 8 | 10/10 | 630.9s | 400,777 |

归档后的 9 个 Jest suite、36 项测试全部通过；新增统一检查脚本的 ESLint 通过。[归档校验](baseline-validation.json) · [前六项独立判分复核](grader-audit-0-5.json)

## 验证口径

每项按原 10 条断言进行二元评分，未修改测试输入或断言。执行器自行完成核心测试和 Skyline 矩阵复核；评分侧统一执行 SFC、JS、JSON 解析，script setup 额外通过真实仓库编译器并检查未解析宏。此检查不等同完整模板/样式构建或宿主应用打包。

Jest 和行为脚本使用轻量响应式/宿主桩，未做完整应用构建、真实响应式集成或 WebView/Skyline 真机验证。字体资源、嵌套手势与吸顶、布局及视觉效果的未验证边界见各产物报告。每项一次仅描述本次结果，不能代表稳定性保证。

Skill 在执行前后逐文件哈希一致；版本与输入哈希、Git HEAD 及未提交状态记录于 source-snapshot.json。Token/耗时来自原生子会话实际统计，输入包含缓存 Token，不重复相加。

## 合并 Skill 后的比较

保留本基线后，以 baseline-protocol.json 与 prompt_templates.json 的相同任务和附加指令运行合并 Skill，只改变 Skill 路径。逐条比较失败转移、编译错误及严重行为问题，再比较成本；不使用历史 no_skill 差值声称合并增益。

## 逐项证据

- Case 0：[逐条评分](eval-0-style-adaptation/mpx2skyline/run-1/grading.json) · [产物报告](eval-0-style-adaptation/mpx2skyline/outputs/report.md) · [统一检查](eval-0-style-adaptation/mpx2skyline/run-1/evaluator-syntax.json)
- Case 1：[逐条评分](eval-1-page-scroll-adaptation/mpx2skyline/run-1/grading.json) · [产物报告](eval-1-page-scroll-adaptation/mpx2skyline/outputs/report.md) · [统一检查](eval-1-page-scroll-adaptation/mpx2skyline/run-1/evaluator-syntax.json)
- Case 2：[逐条评分](eval-2-runtime-template-adaptation/mpx2skyline/run-1/grading.json) · [产物报告](eval-2-runtime-template-adaptation/mpx2skyline/outputs/report.md) · [统一检查](eval-2-runtime-template-adaptation/mpx2skyline/run-1/evaluator-syntax.json)
- Case 3：[逐条评分](eval-3-mixed-text-animation/mpx2skyline/run-1/grading.json) · [产物报告](eval-3-mixed-text-animation/mpx2skyline/outputs/report.md) · [统一检查](eval-3-mixed-text-animation/mpx2skyline/run-1/evaluator-syntax.json)
- Case 4：[逐条评分](eval-4-nested-sticky-layer/mpx2skyline/run-1/grading.json) · [产物报告](eval-4-nested-sticky-layer/mpx2skyline/outputs/report.md) · [统一检查](eval-4-nested-sticky-layer/mpx2skyline/run-1/evaluator-syntax.json)
- Case 5：[逐条评分](eval-5-style-boundary-layout/mpx2skyline/run-1/grading.json) · [产物报告](eval-5-style-boundary-layout/mpx2skyline/outputs/report.md) · [统一检查](eval-5-style-boundary-layout/mpx2skyline/run-1/evaluator-syntax.json)
- Case 6：[逐条评分](eval-6-new-rating-component/mpx2skyline/run-1/grading.json) · [产物报告](eval-6-new-rating-component/mpx2skyline/outputs/report.md) · [统一检查](eval-6-new-rating-component/mpx2skyline/run-1/evaluator-syntax.json)
- Case 7：[逐条评分](eval-7-new-segmented-control/mpx2skyline/run-1/grading.json) · [产物报告](eval-7-new-segmented-control/mpx2skyline/outputs/report.md) · [统一检查](eval-7-new-segmented-control/mpx2skyline/run-1/evaluator-syntax.json)
- Case 8：[逐条评分](eval-8-new-task-board-page/mpx2skyline/run-1/grading.json) · [产物报告](eval-8-new-task-board-page/mpx2skyline/outputs/report.md) · [统一检查](eval-8-new-task-board-page/mpx2skyline/run-1/evaluator-syntax.json)

[结构化结果](benchmark.json) · [评审页](review.html) · [执行协议](baseline-protocol.json)
