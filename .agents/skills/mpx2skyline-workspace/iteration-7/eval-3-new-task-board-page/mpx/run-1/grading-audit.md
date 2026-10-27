# Case 3 / mpx 独立评分审计

创建专项6/7，失败ID：n3_06。其余六条分别依据真实配置、模板结构、交互绑定和编译产物通过。assessment.json保留evals.json七条原文及顺序。只读取本case的mpx组、输入、既定评分契约及指定mpx Skill的Skyline/base相关内容，未读取其他组或历史输出。

## 通用契约与创建验收（不合并进七条分母）

| 检查 | 结论与依据 |
| --- | --- |
| 动态绑定/暴露 | pass：三个完整template普通class/style静态，状态全部用wx:class；setup模板局部变量与处理器经defineExpose返回。无多余isSkyline或未暴露renderer变量，共用实现不需renderer分支。 |
| 组件与页面配置 | pass：页面相对usingComponents解析到两个交付文件；真实编译JSON解析到rating-selector33aa825f与segmented-controlceed839c，二者component:true。页四项配置和app五项配置齐全；保留首页/window/webview。 |
| 交付范围 | pass：只有约定三个SFC、app.json、report.md；input只读，before/after哈希一致，评分者复算输入和产物与原validation一致。 |
| 编译门槛 | pass：真实wx页面递归两组件以及两个独立入口均0错误/警告；宏、模板暴露、引用路径编译成功，最终ESLint0错误/警告。未提供首页源码，完整宿主构建not_run。 |
| 组件公开契约 | pass_with_mock_boundary：rating为选项式，segmented为setup；props类型/默认值齐全，value父级同步、readonly/整体/单项禁用、change detail及两实例隔离有真实绑定mock通过。响应式由Vue2.7替代Mpx宿主，未把此项叫作原生组件验收。 |
| 页面集成/业务闭环 | pass_with_mock_boundary：真实注册和使用两组件，controlKey/ratingKey、options/value/max/布尔传入正确，change.detail由页面处理并回写；分类参数合法/非法、筛选、完成切换、刷新成功重置评分/失败保留、重试与分页唯一key均通过实际绑定mock。空态测试用公开category构造不匹配fixture，非正常合法分类自然产生空列表。 |
| 证据可信度 | partial：真实命令/退出码、编译目录及mock可追踪，真机/开发者工具明确not_run。原报告和审计仅凭initData源码及setup后computed宣称首帧安全，独立核对发现证据缺口，n3_06扣分，未改原validation。 |

## 完整执行记录

agent.jsonl共有96事件、38条完成命令、5条file_change事件，与metrics的43次工具调用对应。命令路径、退出码与结果逐条核对，完整命令及输出哈希、文件变化记录见grader-verification.json。7-40读取指定Skill/参考、任务/宿主配置与编译工具；44创建四个业务文件，47首次lint，50首次wx编译通过。52显示三条initData警告，54补齐页面category/rating/refreshing；56探索解析器时误读scriptSetup字段失败，59改为script.content，未据探索失败伪称编译失败。

63写编译与mock脚本；67 Jest因Watchman权限失败，68严格lint通过。71执行compile.cjs保留真实编译目录，73显示两场景均成功。75关闭Watchman后运行mock，77记录6/10通过与四项夹具失败；79仅修复测试属性重复暴露和父级属性回传，81/83显示10/10通过。90添加报告/verify脚本，92/94静态矩阵与交付复核通过。修复未超过仓库限制，没有因测试失败删除业务功能。

静态矩阵48项的状态是人工结论加部分可执行断言，不是48个真机测试。独立评分不继承其passed标签，而逐项审查实际节点、样式和脚本。

## 独立复核与真实编译

既有task-board.test.cjs的beforeAll会写原template-bindings.json。为遵守不改原证据，评分者复制为grader-task-board.test.cjs，只将这个输出名重定向为grader-template-bindings.json；其余测试逻辑不变。独立重跑10/10，结果grader-jest-results.json：

```sh
node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config '{"rootDir":"./iteration-7/eval-3-new-task-board-page/mpx/run-1","testMatch":["**/grader-task-board.test.cjs"],"testEnvironment":"node","transform":{},"watchman":false}' --runInBand --no-cache --json --outputFile iteration-7/eval-3-new-task-board-page/mpx/run-1/grader-jest-results.json
```

cwd为mpx2skyline-workspace。测试使用真实Mpx SFC解析及setup编译器，之后Vue2.7响应式替代Mpx，注册/生命周期/事件/父级回传为mock，定时器为Jest假定时器；不是微信原生renderer。

真实compile.cjs调用指定mpx脚本，target=wx，ignoreSubComponents=false，保存了页面递归组件和独立组件两组产物，compile-results.json均0 errors/0 warnings。WXML保留refresher/scrolltolower、直接任务行、三类text省略属性与两组件触摸事件；WXSS保留有界列表/Flex宽度路径和.15s过渡。源映射包含当前源码与initData宏，排除仅有编译成功声明但无实际标签证据的情况。

## 六条通过项的边界

n3_00页与app配置完整且真实导航存在。n3_01的100vh父/固定header/flex1-height0-min-height0列表形成静态可证的高度链，任务为直接子节点；更多数据不会反向撑大页面。n3_02从实际refresherrefresh绑定进入300ms异步请求，成功与reject经finally结束刷新，失败保留并可重试。n3_03触底绑定每次concat两条到相同列表，旧项/分类/key有连续调用检查。

n3_04逐目标静态通过：task-title flex1/width0/min-width0，邻接完成标记/类别不收缩；rating-label同样可收缩，星级/分数flex-shrink0；segmented候选等分宽度且内部text width100%。三处实际text有max-lines=1/overflow=ellipsis与WebView nowrap/hidden/ellipsis，插值无额外空白。n3_05逐组件通过：rating的每实例data.pressedStar与segmented的每次setup ref pressedIndex分别控制实际触摸节点，start/end/cancel、scale.96/opacity.7和恢复1、150ms、两个实例隔离均可追踪。

以上均非原生几何/动画/滚动验收；没有证据显示首帧问题必然阻断这些独立专项，故不将n3_06证据缺口扩散为全部失败。

## n3_06首帧证据不足

源码segmented-control:15提供defineOptions({initData:{safeOptions:[]}})，:25 computed对非数组归一化，:40暴露绑定；null/[]/有效数组更新在setup后mock通过。但模板:5直接wx:for=safeOptions，没有模板级回退，首帧不能用手动求computed替代。

真实compiled-wx/standalone-components/__validate_1.js:7120-7136包含initData.safeOptions和setup computed。然而:4279把initData列入builtInKeys；filterOptions(:5561-5570)先跳过builtInKeys，仅遇data键时把initData合并为原生data。该setup组件无data字段，因此只有源码/编译对象的initData不能证明原生注册拥有safeOptions初值。

评分者使用grader-native-registration.cjs在隔离Node VM中执行完整真实webpack入口及bundle，仅stub Component/Page原生注册，未替换编译器或源码。grader-native-registration.json捕获：segmented注册hasData=false、无created hook、有attached；rating因同时有data，注册确有stars=[]/currentValue/pressedStar；page同样没有注册data。这是实际代码注册证据，不是微信模板运行证据。

同步初始化路径也已排查：编译:5607-5624把initProxy放在attached，:675-705随后同步initSetup/initData/initComputed及initRender，safeOptions在setup后能成立。Node无法证明微信宿主首次模板消费必晚于attached内这条同步链，当前无真实首轮消费记录；因此按既定断言对首帧Array保证证据不足判false。没有在真机复现for-list错误，不声称缺注册data必然导致崩溃。原报告的初始化mock没有验证这一时序，不能据其10项通过给首帧分。

## 设备、指标与评测建议

微信开发者工具WebView/Skyline：not_run；真机：not_run。真实首轮循环消费、窄屏滚动、长文本省略、胶囊/安全区、150ms触摸取消及实际刷新事件反馈未测。完整宿主构建not_run，因为首页源码未提供。单独静态/编译/mock的通过不称为真机通过。

metrics/timing为628.235秒、2534589 total tokens（2507400 input、27189 output，cached_input_tokens=2410880），仅照录，不把缓存输入等同新增计费；费用unavailable。无user_notes.md。业务输出、原日志/metrics/validation未改，本次新增assessment、audit与grader-*证据。

建议首帧验收增加原生注册初始data核对，并配套真实glass-easel首次消费时序证据；不要只对编译对象initData做字符串检查或把setup后手动computed当首帧。当前七条断言与执行器未修改。
