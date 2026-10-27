# case3 / mpx2skyline 独立评分审计

创建能力分数6 / 7；失败ID：n3_06（首帧安全证据不足）。其余6条分别依据实际节点、配置、编译产物及绑定调用链通过。没有因为缺少真机而一律扣分，也没有把初始化证据缺口扩散成其他静态能力全部缺失。

## 独立范围与原记录保全

完整读取本组input/task.md、app.json、outputs的三个SFC/app/report、run-1/agent.jsonl共159条记录、全部65条完成命令及结果状态、9条文件变更，以及测试/编译/审计/汇总脚本、真实编译WXML/WXSS/JSON与相关JS、mock-scripts、validation/metrics/timing和各原日志。参考仅指定mpx2skyline Skill及references；未读另一组输出或历史评分。执行者另查询本地已安装编译器与runtime实现，属于工具接口核实，没有读其他组Skill知识内容。

65个命令加9个文件变更与74次工具记录相符。source-snapshot前后相同；当前两份input、指定Skill及6份references哈希都与实际运行快照匹配；validation中4份业务输出哈希也重算一致。评分仅新增grader-native-loop.cjs/json、assessment.json和本audit；原outputs、日志、metrics、validation与定义均未修改。

## 通用契约

| check | 结论 | 实质核对 |
| --- | --- | --- |
| mpx-bindings | passed | 三SFC所有动态类/样式均使用wx:class/wx:style；普通class只含静态语义类。真实编译生成_s_.c/_s_.s且事件/dataset保留。 |
| renderer-exposure | passed | 两个setup文件通过defineExpose暴露模板状态与方法；props通过defineProps进入properties，label/disabled可用；rating是选项式。没有isSkyline；当前交互、Flex、文本省略采取双端共用实现，无必须新增renderer分支的专有交互。 |
| component-config | passed | 页面usingComponents相对路径解析到两个交付组件，真实编译JSON改写为对应/components/.../index路径；两个组件均component:true，页面及app配置完整，首页/window/webview保留。 |
| delivery-scope | passed | 仅要求的5份outputs；输入未改，测试及证据放本run。报告概述而非重复整份源码。 |
| evidence | passed，首帧覆盖有缺口 | 报告和validation区分静态、真实wx编译、mock、开发工具/真机not_run；原18项mock不能证明原生首帧。首帧initData声明的表面核对与真实注册参数存在差距，独立评分已单列n3_06失败。 |

## 创建验收（与7分分开）

| check | 结论 | 证据及边界 |
| --- | --- | --- |
| compile | passed | compile.cjs使用wx/page、ignoreSubComponents=false真实编译页面和两组件，setup宏、usingComponents路径、组件JSON、事件与模板暴露可核对；compile.json与最终compile.log均0错误0警告。覆盖依赖树，不是完整宿主app构建，原首页源码未提供。 |
| component-contracts | mock passed；首帧另有未完成项 | rating为createComponent选项式、segmented为setup。business.test.cjs:155-267检查全部默认props、value连续回写、readonly/整体禁用/单项禁用、change detail、触摸恢复与两个实例状态隔离。options null/数组更新通过；注册到attached间首次循环安全尚未证明，不能把此行mock通过当作全阶段原生验收。 |
| page-integration | mock passed | :270-295依据实际JSON路径和编译模板参数挂载组件，controlKey/ratingKey、分类和评分change回到页面，手动sync父级更新到子组件，成功刷新清零；失败保留评分另由:89-113验证。 |
| page-business | mock passed | :34-152从实际编译事件名、dataset检查参数合法/非法/缺省、筛选、切换完成、空态、resolve/reject刷新/重试、分页保留和唯一key。空态通过注入无匹配分类触发；父子同步和窗口/计时器为mock，非微信宿主自动调度。 |

## 6条通过能力的证据与限制

- n3_00：真实自定义导航、页面四配置、app requiredComponents与Skyline五推荐字段逐项正确；没有全局把原首页改为Skyline。
- n3_01：根窗口高度+border-box列Flex，顶部header不收缩，scroll-view剩余空间flex:1/height:0/min-height:0。header含标题、分类、评分，位于scroll主体外；任务卡是list直接子节点。测试有320×568及280×480有限窗口值，并能将同一列表增长到11项。高度/宽度链可静态推出有界主体；实际窄屏测量not_run，未把mock窗口值称为视觉通过。
- n3_02/n3_03：refresher-enabled字面true、triggered=refreshing；真实绑定onRefresh→模拟异步请求→finally=false，resolve重置任务和评分、reject保留后可继续切换/分页并成功重试。触底绑定onLoadMore每次concat两项，全部追加工作、其他分类追加当前分类，taskKey递增且刷新后不复用。
- n3_04子检查：任务标题text在task-content剩余宽度内width100%，task-content flex:1/width:0/min-width:0且checkbox不收缩；评分label text分配剩余宽度、stars/score均flex-shrink:0；候选text width100%，候选项flex:1/width:0/min-width:0等分。三处均max-lines=1/overflow=ellipsis且保留WebView单行三样式，插值紧贴标签，真实编译没有丢失。长字符串位置、字体实际占宽未在宿主测量，但没有静态宽度链缺失，接受静态充分证据。
- n3_05子检查：rating的pressedValue是选项data，每实例独立；segmented的pressedIndex是setup内ref，每实例独立。两者touchstart/end/cancel→动态class→scale(.96)/opacity(.7)，基础态scale1/opacity1，150ms（编译为.15s）。原测试分别对同类两个实例执行按下、取消、松开及禁用，无共享状态，且源码/真实WXSS数值吻合。readonly/disabled态不参与按压动画。实际手势播放not_run。

## n3_06：真实注册、attached链与首帧边界

源码segmented-control.mpx:25的defineOptions({initData:{safeOptions:[]}})及真实编译JS:7138-7140均存在；setup的Array.isArray归一和defineExpose也正确。原harness.cjs:117手动执行options.setup，随后以Vue ref/computed代理给publicState；business.test.cjs:24-30及208-218只断言options.initData字面值和setup完成后computed，因此无法单独证明原生首帧。

独立grader-native-loop.cjs直接加载本组原始compiled/bundle.js和实际segmented编译JS，用Component函数捕获真实runtime处理完的注册参数，不替换Mpx core。grader-native-loop.json记录：原生参数仅有attached/ready/detached/methods/pageLifetimes/properties，没有data；默认properties.options=[]，实际WXML却直接wx:for={{safeOptions}}且无guard/fallback。此时safeOptionsBeforeLifecycleType为undefined。

可追踪编译runtime index.js:4293-4302的builtInKeysMap含initData，:5582-5593先过滤内建键，仅data分支会把options.initData合并进去；该setup组件未提供data，故宏保留initData不等于原生注册data获得safeOptions。该诊断针对本组实际运行/编译版本，不拿其他版本实现替代。

同时已排除“永远不能初始化”的错误推断：index.js:5611-5635的attached调用initProxy→MpxProxy.created，:676-704按顺序initSetup/initData/initComputed并initRender；:859-886的setup结果代理与local key收集让safeOptions进入渲染。VM手动调用真实attached后，首个setData确实为{safeOptions:[]}，之后模拟真实properties.options.observer的null→[]→两个有效项→null也均把native data.safeOptions维持数组。完整记录见grader-native-loop.json。

因此，失败范围仅为“注册至attached/setData之间，宿主首次模板消费必定已获得数组”的证据不足：初始原生data或模板保护没有建立静态保证，现有测试也未验证宿主时序。未连接glass-easel/真机，未复现首帧for-list报错，不宣称实际必然崩溃。若有可信宿主生命周期顺序证据或实际首帧数据观测，可重新核对；本轮按固定verification不能把手动computed或手动attached后的数组倒推成所有首帧已安全。

评分器新增的VM初始化探查第一次手工尝试缺少原生createIntersectionObserver stub而报bind错误，补齐mock后实际attached及所有属性更新通过；此为评分器宿主stub补全，不是业务代码修复或真实宿主异常。已落盘脚本首次运行通过。

## 原验证可信度与异常

最终真实编译2次，最初3881ms、补页面initData后3184ms；最终JSON/日志/产物对应当前源文件。ESLint首次4项valid-initdata警告后补页面initData，重新检查零警告且编译通过；并未因此假定native初始化已通过。Jest首次Watchman fchmod权限失败，第二次因setup编译loader缺resource上下文而失败，补真实loader上下文后18/18通过。两次Jest运行器/harness修正未超过3次限制；静态audit另有一次max-lines正则错误，修正后通过。早期三个路径/glob搜索失败均有记录，随后改查实际路径；未妨碍最后检查。stderr.log中的Codex配置/技能扫描警告没有阻止指定Skill显式读取。

audit.cjs执行完整48项聚合扫描并保存命令/候选；配置、直接子项、组件JSON和省略节点有实际assert，但48项reviewed_clear的文字说明不是原生时序测试。WX_FOR_DATA_TYPE项把initData字面存在当作保护，其盲点已由真实注册捕获指出。最终报告“候选初始化安全”需限定为setup后mock结果，不能代替n3_06首帧验收。

开发者工具、真实双renderer呈现、首次WXML消费与attached先后、原生刷新/触底、实际省略、150ms手势动画、胶囊/安全区及完整宿主app构建均not_run。除首帧这一明确证据要求外，其余已静态/编译/mock证据充分的能力不因缺少真机一律扣分。

原执行metrics：710630ms（710.63秒），input_tokens=2611426、output_tokens=31257、total_tokens=2642683；usage含cached_input_tokens=2518272，输入计数包含缓存，不代表全量未缓存成本。
