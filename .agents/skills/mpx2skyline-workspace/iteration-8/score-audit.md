# iteration-8 评分审计

评分为独立Agent语义核验，grade.py仅校验和汇总。40条断言与原输入保持不变；评分未修改模型产物。

- [Case 0 / mpx](eval-0-style-layout/mpx/run-1/grading-audit.md) · [mpx2skyline](eval-0-style-layout/mpx2skyline/run-1/grading-audit.md)
- [Case 1 / mpx](eval-1-page-scroll-sticky-layer-config/mpx/run-1/grading-audit.md) · [mpx2skyline](eval-1-page-scroll-sticky-layer-config/mpx2skyline/run-1/grading-audit.md)
- [Case 2 / mpx](eval-2-template-runtime-inline-animation/mpx/run-1/grading-audit.md) · [mpx2skyline](eval-2-template-runtime-inline-animation/mpx2skyline/run-1/grading-audit.md)
- [Case 3 / mpx](eval-3-new-task-board-page/mpx/run-1/grading-audit.md) · [mpx2skyline](eval-3-new-task-board-page/mpx2skyline/run-1/grading-audit.md)

## 未通过项

### Case 2 / mpx / s2_05

Skyline 图标与标题置于同一个可收缩的 span 内联容器，容器设置 max-lines=1、overflow=ellipsis，图片采用 inline-block，使同段图文在有限宽度内共同单行截断；WebView 对应分支保留同段图文单行截断。

部分实现正确：outputs/user-list.mpx:5,45-50及grader-compile-artifacts/__validate_0.wxml:1确认实际span包含image与text、max-lines1/ellipsis；图片renderer===skyline时命中inline-block，WebView保留truncate。但.heading只display:flex/align-items:center/width100%，未显式flex-direction；.title设flex:1;width:0。指定快照references/skyline/skyline-style-reference.md:37-40明确defaultDisplayBlock未开启时Skyline的Flex方向默认为column；此时flex:1沿纵轴分配，width:0仍为横向0，align-items:center不会拉伸，因此无法获得标题所需可用宽度。input/task.md只确认Skyline/glass-easel接入，无defaultDisplayBlock=true前提，outputs/report.md明确该项未核验。不能静态证明有限宽度内的共同图文截断，故s2_05失败；若宿主明确defaultDisplayBlock=true才能排除此失败路径。真实长label像素验证not_run本身不是扣分原因。

### Case 2 / mpx2skyline / s2_05

Skyline 图标与标题置于同一个可收缩的 span 内联容器，容器设置 max-lines=1、overflow=ellipsis，图片采用 inline-block，使同段图文在有限宽度内共同单行截断；WebView 对应分支保留同段图文单行截断。

部分条件满足：outputs/user-list.mpx:5使用view mpxTagName@wx="span"同时包含logo与label，max-lines=1/overflow=ellipsis；实际图片仅Skyline持skyline-inline，:50设inline-block。grader-compiled/__validate_0.wxml:1确认真实产物是span，WXSS:1含图片规则。但s2_05整条不能通过：:45 .heading仅display:flex/align-items:center，没有flex-direction:row；:46 .title为flex:1;width:0;min-width:0。冻结references/skyline-style-reference.md:37-41明确未开启defaultDisplayBlock时Skyline默认flex-direction:column；input/task.md:3只确认Skyline/glass-easel，没有该兼容配置。于是允许的默认宿主中flex:1分配纵轴空间、align-items:center不横向拉伸，标题横向width仍0，无法证明图标/长label在可用行宽内共同截断或与WebView一致。编译WXSS也没有补入row。原mock只检查span、class与width属性，不执行父Flex布局；真机未跑不是扣分原因，缺少可证横向宽度链才是。


## 边界

- 本轮修复了共同编译依赖中的initData过滤缺陷。预检真实wx编译并捕获原生Component注册，safeOptions=[]已在attached前存在，initData原字段未透传。该环境修复与Skill更新同时发生，历史分差不能全归因于Skill优化。
- 本轮两组s0_12均通过，均以原WebView折叠基线计算Flex改造后的间距；mpx上一轮的28rpx位置偏差本轮已消除。
- 本轮两组图片inline-block与真实编译span均已正确；case2仍未通过s2_05，原因改为.heading缺少明确横向Flex、width:0标题依赖未确认的宿主defaultDisplayBlock。需要区分本轮新宽度链缺口与上一轮缺失图片样式，未声称真机已观测故障。
- 本轮两组case3实际编译原生Component注册均已包含safeOptions:[]，n3_06通过；该项改善有共同运行时修复的直接贡献。
- 每case每组只有1次。评分是Agent依据实际产物/编译/mock证据的语义判断，grade.py并非RN的自动静态检查器；每条证据见grading.json和grading-audit.md。
- case0仍使用原fixture约定的宿主字体资源；未提供字体二进制引起的编译依赖问题应与静态能力分数分列。开发者工具/真机未执行，静态与mock不能代替宿主视觉、手势或设备验证。
- 原始Token包含缓存输入，未包含评分Agent消耗；累计任务耗时存在并发重叠，不是整轮墙钟时间，也不能以总Token直接推断费用。
