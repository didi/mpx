# Skyline iteration-7 逐项评分复核

本轮为独立 Agent 语义评分，模型为 gpt-6.1-sol / high。grade.py 校验与汇总 assessment.json，不包含 RN grade.py 那样的静态判定函数。断言与业务输入未在评分期间修改，原始模型产物哈希见 output-snapshot.json。

| Case | mpx | mpx2skyline |
| --- | ---: | ---: |
| 0 style-layout | 13/14 | 14/14 |
| 1 page-scroll-sticky-layer-config | 11/11 | 11/11 |
| 2 template-runtime-inline-animation | 7/8 | 7/8 |
| 3 new-task-board-page | 6/7 | 6/7 |
| 合计 | 37/40 | 38/40 |

## 未通过项及证据

### Case 0 / mpx / s0_12

Skyline 对提示条子节点负 margin-bottom 与后续卡片负 margin-top 的占位链采用显式纵向 Flex 或等效布局，保持 WebView 的重叠效果；普通单侧负 margin 对照保持原语义。

../../input/style-card.mpx:10-13为默认block的overlap-host>tips-wrapper>tips-bar及后续content-card；:38-39的tips-bar content-box外高92+92=184rpx、margin-bottom:-28rpx，wrapper无border/padding/overflow/固定height阻止末子margin折叠，-28折叠到wrapper，并与后卡margin-top:-92rpx合并；全负margin取最小值-92，原WebView卡顶=184-92=92rpx。../outputs/style-card.mpx:58将overlap-host与tips-wrapper都改为column Flex，阻止上述折叠；:59-60给出分支占位184-28=156rpx、后卡顶156-92=64rpx，两renderer均向上多28rpx。因此有重叠且两模式一致，但未保持原有WebView几何，s0_12失败。:15/:61-62普通单侧-8rpx保留只能满足对照子条件，不能弥补主条件。style-card.test.cjs:99-104只核对声明而未对比原始盒模型，不能证明业务保持。差异由静态节点/盒模型足以确认；真机not_run另记，不因缺真机而扣分。

### Case 2 / mpx / s2_05

Skyline 图标与标题置于同一个可收缩的 span 内联容器，容器设置 max-lines=1、overflow=ellipsis，图片采用 inline-block，使同段图文在有限宽度内共同单行截断；WebView 对应分支保留同段图文单行截断。

../outputs/user-list.mpx:5正确用view mpxTagName@wx=span共同承载image/label，具有max-lines=1/overflow=ellipsis；:46-47存在横向Flex、flex:1/width:0/min-width:0及WebView单行省略CSS。独立真实编译grader-compiled/__validate_0.wxml:1确认实际span。但:48图片.logo仅24px宽高与vertical-align；最终grader-compiled/__validate_0.wxss:1亦无display:inline-block，完整模板无对应动态样式，且缺可信默认display等价证据。故既定断言的inline-block子条件证据不足，整条false。这不证明真实图文混排必然故障；本组Skill提示基础span+text/image组合不应机械套用rich-text业务示例样式，口径局限见audit。长label视觉not_run。

### Case 2 / mpx2skyline / s2_05

Skyline 图标与标题置于同一个可收缩的 span 内联容器，容器设置 max-lines=1、overflow=ellipsis，图片采用 inline-block，使同段图文在有限宽度内共同单行截断；WebView 对应分支保留同段图文单行截断。

未满足既定断言的全部条件：outputs/user-list.mpx:5及真实编译grader-compiled/__validate_0.wxml:1确认logo与label同属span，max-lines=1/overflow=ellipsis；47有flex:1,width:0,min-width:0与WebView单行省略。但48的.logo仅width/height/vertical-align，实际编译grader-compiled/__validate_0.wxss:1同样没有display:inline-block或等价动态样式；grader-evidence.json显示logoDisplayDeclaration=null、inlineBlockEvidence=false，宿主默认display与实际长label几何未验证，无可信默认等价证据。按断言明确图片inline-block条件及证据不足计0；不把缺少显式样式等同于已证实真机混排故障。指定Skill对基础span+image+text允许更简组合的适用口径差异另见audit。

### Case 3 / mpx / n3_06

Skyline/glass-easel 新建组合式分类组件的候选列表在初始化、异步返回前、null输入和数组更新阶段均向wx:for提供Array/Object类型的数据。

setup后更新路径通过，但首帧安全证据不足：../outputs/components/segmented-control.mpx:5 wx:for直接safeOptions无模板||[]；:15 defineOptions.initData.safeOptions=[]、:18 options默认[]、:25 Array.isArray守护。真实compiled-wx/standalone-components/__validate_1.js:7120-7136确有initData及setup computed，然而:4279将initData列为builtInKeys，:5561-5570的filterOptions先跳过该键，仅遇data时合并initData；该setup组件没有data。grader-native-registration.cjs执行实际webpack入口及bundle后捕获原生Component注册，grader-native-registration.json显示segmented.hasData=false、无created hook，仅attached。编译:5607-5624把initProxy放在attached，:675-705显示其后同步initSetup→initRender；无法仅凭Node证明微信首轮模板消费必晚于此链，故没有可信首帧Array保护证明，按该断言全条件证据不足判false。null/[]/数组更新由实际宏编译后的Vue mock通过（grader测试:203-218），不能替代首帧。未在真机复现for-list错误，亦不声称必然崩溃。

### Case 3 / mpx2skyline / n3_06

Skyline/glass-easel 新建组合式分类组件的候选列表在初始化、异步返回前、null输入和数组更新阶段均向wx:for提供Array/Object类型的数据。

首帧安全证据不足。segmented-control.mpx:20默认options=[]、25声明initData.safeOptions=[]、28计算归一null/非数组，58暴露；但模板5及实际compiled/components/segmented-control6530f36f/index.wxml:1直接wx:for={{safeOptions}}，无guard/fallback。独立grader-native-loop.cjs/json加载本组真实compiled/bundle.js与组件index.js捕获Component注册参数，注册时无data，safeOptions为undefined；编译runtime index.js:4293-4302,5582-5593可追踪initData过滤。手动执行真实attached后会setData({safeOptions:[]})，原生properties observer模拟null/[]/有效数组再null均向data.safeOptions提供数组；但宿主首次模板消费与attached/setData先后未验证，不能仅用原harness手动setup/computed结果证明首帧。因此按verification首帧证据不足false；未复现真机报错，不宣称必然崩溃。

## 审计边界

- case0 s0_12：mpx 双层Flex后卡片顶为64rpx，原WebView block折叠基线为92rpx，多回拉28rpx；mpx2skyline增加28rpx补偿。此项是可由原始及产物盒模型推导的业务差异。
- case2 两组 s2_05 均未满足固定断言的图片inline-block条件，也未提供默认等价证据；两组实际编译span及事件链通过。Skill对基础span/image组合并不要求机械套用复杂混排样式，因此该扣分不能直接解读为已证实的视觉故障。
- case3 两组 n3_06：源码initData.safeOptions虽编译保留，但真实bundle的原生Component注册初始data缺失，WXML循环也无fallback；setup后的mock通过不能证明首帧。VM没有复现真实宿主时序或真机错误，按既定首帧安全要求证据不足判失败。
- case0两组真实wx编译均因fixture约定由宿主提供的city.woff2缺失而失败，静态能力评分与宿主依赖缺失分别列示；case1/2/3的真实wx局部编译通过。均无开发者工具/真机实测，不等同于完整宿主发布验收。
- 每case每组仅1次；报告Pass Rate为case通过率均值，40分总分为按断言汇总，两者分母不同。
- Token采用与RN相同的Codex原始usage口径，包含缓存输入；评分Agent的消耗不计入。不能将总Token直接当作实际付费成本。

## 每次评分记录

- [Case 0 / mpx](eval-0-style-layout/mpx/run-1/grading-audit.md)
- [Case 0 / mpx2skyline](eval-0-style-layout/mpx2skyline/run-1/grading-audit.md)
- [Case 1 / mpx](eval-1-page-scroll-sticky-layer-config/mpx/run-1/grading-audit.md)
- [Case 1 / mpx2skyline](eval-1-page-scroll-sticky-layer-config/mpx2skyline/run-1/grading-audit.md)
- [Case 2 / mpx](eval-2-template-runtime-inline-animation/mpx/run-1/grading-audit.md)
- [Case 2 / mpx2skyline](eval-2-template-runtime-inline-animation/mpx2skyline/run-1/grading-audit.md)
- [Case 3 / mpx](eval-3-new-task-board-page/mpx/run-1/grading-audit.md)
- [Case 3 / mpx2skyline](eval-3-new-task-board-page/mpx2skyline/run-1/grading-audit.md)
