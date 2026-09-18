# Skyline v4 统一基线

| Case | Skill | no_skill |
| --- | --- | --- |
| 0：样式与布局 | 12/12 | 9/12 |
| 1：页面滚动、吸顶与层级配置 | 10/11 | 6/11 |
| 2：模板运行时、图文混排与动画 | 8/8 | 5/8 |
| 3：从零创建任务看板页面 | 6/6 | 0/6 |

迁移：Skill 30/31，no_skill 20/31。
创建：Skill 6/6，no_skill 0/6。
总分：Skill 36/37，no_skill 20/37。

## 失败项

- no_skill / s0_00：outputs/style-card.mpx:3 实际 text 无 max-lines/overflow 属性；:29 将 max-lines:1 写成 CSS，不能替代 Skyline 节点属性。WebView CSS 存在但 Skyline 路径不成立。
- no_skill / s0_03：outputs/style-card.mpx:20-22 对所有 renderer 只计算屏宽快照，:27-29 仅 card/card-compact；已删除媒体查询，无 renderer 隔离和媒体查询后的 Skyline 默认覆盖。当前屏宽值虽正确，未满足本断言全部条件。
- no_skill / s0_08：outputs/style-card.mpx:43-45 识别 City 独立family，却将原600/500均改normal；outputs/report.md:12 以避免合成字重解释调整，但未提供字体二进制或视觉等价证据，也未记录500/600在部分机型不生效的验证要求。虽有宿主/PostScript待核验，全部条件未满足。
- mpx2skyline / s1_07：outputs/orders.mpx:4 外层nested；:6 主区custom并设置associative-container=nested-scroll-view；但:10横向list缺associative-container。按引用references/skyline-component-reference.md:46“内层scroll-view必须设置”及沿三层关系核验，未完整建立内层关联。
- no_skill / s1_05：outputs/app.json:1-20 完整配置无lazyCodeLoading字段，缺requiredComponents。
- no_skill / s1_06：outputs/app.json:11-16 仅defaultDisplayBlock=true；缺defaultContentBox、tagNameStyleIsolation、enableScrollViewAutoSize、keyframeStyleIsolation。disableABTest/sdkVersionBegin/End不替代这些配置。
- no_skill / s1_07：outputs/orders.mpx:4 外层nested，但:9 主容器type=list非要求custom；:12 横向scroll-view未显式type且无关联属性。主区associative-container已设置仍不足以满足全部结构条件。
- no_skill / s1_08：outputs/orders.mpx:12 横向虽scroll-x/enable-flex=true，但缺type=list/custom；:114 strip无横向Flex，:115布局只在额外tiles wrapper，:13条目非容器直接子节点。:116 120px与不收缩正确仍不满足全部条件。
- no_skill / s1_09：outputs/orders.mpx:9 主区type=list，:10-11 将sticky-section/header放入list，违反必须custom的结构；背景在header内子view(:112)；WebView :23-25/:113已有CSS sticky，不弥补Skyline错误。
- no_skill / s2_00：outputs/user-list.mpx:11 wx:for消费visibleItems；:28-38只有items初值，visibleItems仅computed，没有initData或模板兜底保护computed前undefined。run-1/grader-chain.json:20 initialTemplateVisibleItemsIsArray=false；后续更新正常不代替首帧。引用skyline-runtime-practice.md:142-185明确该风险。
- no_skill / s2_05：outputs/user-list.mpx:5 Skyline span缺max-lines/overflow节点属性；:88错误使用CSS max-lines:1。:87/90虽有收缩及inline-block，WebView:6同段图文路径存在，仍不能满足Skyline共同截断要求。
- no_skill / s2_06：outputs/user-list.mpx:7实体pulse由动态opacity驱动；:68-75用16ms setInterval采样1秒周期；:91没有CSS animation、keyframes及fill-mode。不满足冻结断言明确的CSS animation方案，且模运算不直接达到1端点。
- no_skill / n3_00：outputs/app.json:1-13 缺少 lazyCodeLoading、tagNameStyleIsolation、enableScrollViewAutoSize、keyframeStyleIsolation；页面配置虽在 outputs/pages/task-board.mpx:113-122 声明，但页面 setup 编译失败，导航无法实际呈现。 独立编译证据：run-1/grader-compile.log:1-10；packages/webpack-plugin/lib/script-setup-compiler/index.js:613-615 强制检查 defineExpose。
- no_skill / n3_01：outputs/pages/task-board.mpx:9-16、92-105 具有有界 flex/list 直接子项结构；但同文件:20-89 缺 defineExpose，真实 Mpx setup 编译失败，不能形成可执行列表。 独立编译证据：run-1/grader-compile.log:1-10；packages/webpack-plugin/lib/script-setup-compiler/index.js:613-615 强制检查 defineExpose。
- no_skill / n3_02：outputs/pages/task-board.mpx:9、70-79 有启用刷新、事件和 finally 复位；但 setup 未 defineExpose，Mpx 编译失败，事件/状态不能接入实际容器。 独立编译证据：run-1/grader-compile.log:1-10；packages/webpack-plugin/lib/script-setup-compiler/index.js:613-615 强制检查 defineExpose。
- no_skill / n3_03：outputs/pages/task-board.mpx:9、81-87 有触底绑定及每次追加两项算法；但 setup 未 defineExpose，Mpx 编译失败，实际列表不能接入分页。 独立编译证据：run-1/grader-compile.log:1-10；packages/webpack-plugin/lib/script-setup-compiler/index.js:613-615 强制检查 defineExpose。
- no_skill / n3_04：outputs/pages/task-board.mpx:12 标题 text 缺少 overflow="ellipsis"；105-106 的 CSS 省略不能替代指定 Skyline 属性；此外 setup 编译失败。 独立编译证据：run-1/grader-compile.log:1-10；packages/webpack-plugin/lib/script-setup-compiler/index.js:613-615 强制检查 defineExpose。
- no_skill / n3_05：outputs/pages/task-board.mpx:6、50-55、98-100 有触摸恢复与目标 transition 声明；但 setup 未 defineExpose，Mpx 编译失败，响应式状态和绑定不构成可执行链路。 独立编译证据：run-1/grader-compile.log:1-10；packages/webpack-plugin/lib/script-setup-compiler/index.js:613-615 强制检查 defineExpose。

## 证据与边界

- 单轮生成、每case每配置一次；未测重复运行方差，不能据此作统计不劣化结论。
- run_summary为4个case通过率的均值及case间标准差；主指标使用assertion_summary的37条断言加权总分。
- 证据层级以各run-1/validation.json为准；SFC或Mpx模板局部编译不等于完整应用构建或微信真机验证。真机渲染与嵌套手势未执行。
- 模型与推理参数继承同一父会话，工具未提供精确模型版本/Token/耗时；后续对比需保持配置并记录可获取的版本。
- 执行者独立fork且按指令隔离评分/其他Skill；不是操作系统级访问隔离。
- 原始工具对话记录不可用，execution.md为执行者编写的执行记录；保留测试脚本及原始命令日志。
- s1_07的横向关联适用边界待官方/真机核验；本轮按冻结断言评分，不能将此失败直接等同于已证明的运行错误。
- s0_03的媒体查询实现要求比题面更具体，按冻结断言评分并保留评测反馈。
- merged_skill尚未指定，当前只有独立Skill与no_skill基线。
