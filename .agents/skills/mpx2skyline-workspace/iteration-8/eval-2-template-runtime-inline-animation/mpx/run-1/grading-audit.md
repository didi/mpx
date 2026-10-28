# 独立评分审计：eval-2 / mpx

结果7/8；失败ID：s2_05。依据iteration-8/evals.json的8条原断言原序原文评分，完整证据见assessment.json。未因真机not_run自动扣除静态可证能力。

s2_05失败原因：实际wx编译WXML确认span、共同image/text、属性省略和Skyline image inline-block均正确；但.heading未显式flex-direction，.title为flex:1;width:0。指定快照skyline-style-reference.md:37-40说明未defaultDisplayBlock时Skyline默认flex-direction:column，此时flex沿纵轴，标题横向仍0宽，align-items:center也不会拉伸。任务只确认宿主Skyline/glass-easel，未给defaultDisplayBlock开启前提；报告还明确该推荐配置未核验。故缺少可用横向宽度的确定路径，共同截断不能静态成立。只有确认宿主defaultDisplayBlock=true后才能排除此路径。扣分针对实际布局条件缺失，非缺真机截图或单纯缺显式row关键词。

执行链：完整核对本组agent.jsonl的17条完成命令及退出结果；仅Jest首次启动命令exit1，原因Watchman fchmod权限，未执行测试；添加watchman=false后14/14，未改业务实现。ESLint命令exit0。原compile.log/compile-result.json为真实wx编译0错误0警告，环境既有core→iteration-8/runtime-core别名，非完整生产运行时验证。

新增评分者验证：grader-check.cjs只读正式产物，VM补undefined/null/空/有效数组及事件绑定到方法、回顶目标、两种renderer动态类；grader-mock.json记录通过。从同一脚本以target=wx、type=component、cleanup=false调用本轮指定编译器，沿原配置和runtime-core别名，结果保留在grader-compile-result.json（通过）、grader-compile-artifacts/；已检查__validate_0.wxml:1输出确为span，导入的具名行模板和SVG存在，__validate_0.wxss:1保留inline-block、1s动画、.15s过渡。评分者首次脚本工程路径少算一层，MODULE_NOT_FOUND，仅评分脚本错误，修正后编译通过；两次日志均保留为grader-check.log/grader-check-attempt-2.log。

核心链路：initData与data为空数组，computed所有消费分支返回数组，过滤后甲/乙为0/1；#users合法id与this.createSelectorQuery作用域匹配，实际目标自己enhanced=true，按钮通过node().exec后的ScrollViewContext.scrollTo({top:0})回顶，不操作other；具名import/template显式传item/index；两个详情入口分别为navigator/text和view点击navigateTo；真实pulse节点1秒.3→1无限循环、both填充；同一按钮响应式pressed类完成150ms .96/.7和松开/取消1/1。以上7项有静态/编译/mock充分证据。

通用契约（独立验收，不改变8条分母）：

| 项 | 结论 | 核对 |
| --- | --- | --- |
| mpx-bindings | pass | 标题、logo、按钮动态类均wx:class；普通class静态，无动态style。 |
| renderer-exposure | pass | 选项式组件直接使用实例renderer，无isSkyline；label/payload来自properties，pressed在data中，按钮方法在methods内；setup约束不适用。 |
| component-config | pass_with_scope_limit | component:true保留，无外部自定义组件需注册；不额外造app/page。宿主具体rendererOptions未知；该未知导致s2_05不能证明布局。 |
| delivery-scope | pass | outputs恰为user-list.mpx、row.wxml、logo.svg、report.md；原SVG原样，输入/Skill before-after快照一致，run.json.sources_unchanged=true；审计产物哈希复核匹配。 |
| evidence | pass | 48条完整矩阵、真实wx编译、ESLint、mock均有实际记录；原报告明确开发者工具/真机/实际滚动/长label像素验证not_run，未冒称真实渲染。 |

验证边界：实际Mpx webpack编译通过不证明微信宿主运行；runtime-core alias沿本轮环境，不扩大为生产运行时背书。长label/真实触摸、滚动、跳转及动画实际渲染仍not_run；本次对其静态可证链评分，保留s2_05具体宽度缺失。未改原outputs、原日志、metrics、validation、Skill或测试，只增加grader-*及评分文件；未覆盖原测试结果。未读另一组或历史输出。知识参考仅指定mpx快照base/Skyline；编译调用该快照配套脚本。

指标读取：metrics.json记录total_tokens922655/input912156/output10499/tool_calls17/duration_ms509557；timing.json为509.557秒。未自行估算token或把not_run视为零成本通过。

评测观察：s2_05的宽度核验应始终结合宿主defaultDisplayBlock和实际Flex方向；仅span/省略/inline-block存在会掩盖width:0在column下的无效布局。现有verification已要求宽度约束，无需额外扩展断言。
