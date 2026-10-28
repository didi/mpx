# Eval 3 / mpx2skyline 独立评分审计

评分7/7，失败ID无。逐条原序原文、具体节点及调用链见assessment.json。判定区分静态、业务mock、真实wx编译、native注册捕获和设备渲染；未运行设备不作为静态可证项的扣分依据。

读取本组本轮3个SFC、app/report、任务、7条verification、common/creation契约及84行agent.jsonl的35条完成命令与结果、测试源与修订、审计/编译/指标。大段heredoc与最终文件逐字核对并读取全部修订差异，重复Skill/矩阵内容与冻结mpx2skyline快照核对；未读取另一组及历史结果。预检仅复用了native捕获方法，没有将预检结果当本组通过证据。输入和冻结Skill当前哈希匹配本组before/after快照。

## 首帧独立证据

当前workspace配置alias到runtime-core。评分者重新以page入口、ignoreSubComponents=false、cleanup=false真实编译本组实际产物，0 error/0 warning，并执行输出bundle及全部3个entry，拦截原生Component注册。segmented组件注册data={safeOptions:[]}，且initData未原样透传；该捕获发生于setup/attached调用之前。编译WXML真实wx:for={{safeOptions}}，故初始循环值已有Array，而不是手动调用computed制造的首帧证明。页面native data.visibleTasks=[]、rating组件native data.stars=[]也均存在。

证据为grader-native.json、grader-compiled/实际编译产物和可复查的grader-register.cjs。后续options=null/空数组/有效数组由Array.isArray防护及props更新mock验证。未执行微信原生属性校验或真实render。

## 静态宽度及高度链

本组交付app明确defaultDisplayBlock=true，冻结style-reference:40确认对应Flex默认为row，因此task-card、rating-selector、segmented-options未显式row仍有确定配置依据。

任务标题在task-content剩余宽中width:100%；评分标题为width:0/min-width:0/flex:1，星组/分数不收缩；候选项在整宽父Flex中等分且text宽100%。实际text均有max-lines=1/overflow=ellipsis及WebView nowrap/hidden/text-overflow，插值紧贴标签。长文本内容不能反向扩张父宽，评分旁的星组/分数保留。

页面height来自窗口px并跟随resize；board为column，导航/header不收缩，列表flex:1;height:0;min-height:0，分配顶部之外的有限剩余高度。任务循环项直接放在type=list/scroll-y=true容器中；分类/评分在其外。连续分页的多任务仍受该高度链限制。以上是静态结构结论，不是原生几何测量。

## Common / Creation契约（不计入7分）

Common：动态类/样式均用wx:class/wx:style；普通class静态。setup模板所需状态与方法通过defineExpose返回，属性由defineProps生成properties；无renderer分支需要额外暴露。组件component:true、页面注册相对路径均解析到交付文件。5个指定产物齐全，首页/window/WebView配置保留。验证状态有分层记录，输入只读。

Creation compile：真实递归编译生成页面和两个组件的独立WXML/WXSS/JSON/JS；native捕获确认实际注册3个定义。属于局部页面及依赖编译，不是包含未提供home源码的完整宿主构建。

Creation组件契约：rating保持选项式API、segmented保持setup；默认props类型/value、父value连续同步、readonly/整体与单项禁用、change detail、两实例按压隔离由原21项测试和评分者隔离重放核对。两组件start/end/cancel到局部状态、动态类、150ms transform/opacity的链路完整。

Creation页面集成/业务：usingComponents及真实标签连接props、change detail与页面回写；合法/非法/缺省category、筛选、完成切换、空结果、刷新成功重置评分、失败保留列表/评分且finally结束反馈、失败后可切换/分页/重试、三分类连续两次各追加2条并保持唯一key，均从模板实际绑定驱动验证。

## 验证记录与边界

原ESLint最终0 error/0 warning；原测试最初Watchman权限失败，后两次同一联动适配器的sync属性解构问题，第3次后续尝试修正后21/21通过。只改测试适配器，未放宽业务契约；在仓库最多3次修复限制内。静态脚本曾误匹配wx:class与flex-direction，修正匹配边界后48条审计通过。编译脚本相对路径错误已在日志中保留并修正，最终编译成功。

评分者复制测试到grader-replay，先把业务与编译证据路径指回原只读文件；首次副本生成transformed文件被.agents写保护阻止，改副本生成路径到/tmp后重放21/21通过，见grader-jest.json（失败另存grader-replay/grader-jest-attempt-1.json）。原transformed.js、outputs、日志、metrics、validation未改，原35个文件哈希复核见grader-preservation.json。

开发者工具、Skyline/WebView设备布局、真实滚动/刷新指示器与触摸视觉均not_run。Vue响应式mock不能替代Mpx真实实例生命周期；native注册捕获补齐首帧数据证据，也没有把它称为设备挂载。未发现需要新增断言才可捕获的明显能力缺口；当前n3_06要求native初始值，避免仅computed mock假通过。

原执行811.535秒；input_tokens=2034083、output_tokens=24312、total_tokens=2058395（含缓存输入），35个工具调用；不代表评分者成本。
