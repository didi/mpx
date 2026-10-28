# 独立评分审计：eval-0 / mpx

结果：14/14；失败 ID：无。按 iteration-8/evals.json 原14条原序原文评分，逐条证据见 assessment.json；静态可充分证明的项未因缺真机扣分。

读取边界：只审本 case 的 input、mpx/outputs 和 mpx/run-1，评分定义 grading-standard.md/common-validation.json/evals.json，以及指定 skill-snapshots/mpx/SKILL.md 和其 base/Skyline 参考。未读取另一配置产物、iteration-7 或历史结果。已逐项核对 agent.jsonl 的全部完成命令、退出码和结果链（30条命令）；执行成功 run.returncode=0。无复用历史评分。

关键布局复核：原 WebView 中提示条外高184rpx；其 -28rpx 经无底padding/border的auto高wrapper向外折叠，与后续卡片 -92rpx 合并取 -92，卡片起点92、底212、重叠92。改后两层column Flex使wrapper占位156，再将卡片mt补偿为-64，得到原来的92/212/92；普通单侧负margin父结构保持不变，仍24-8=16。此处已核对原baseline，不只看改后双模式一致。横向直接子fit-content明确width100%映射320px，两个零basis等分项各160px；非min-width反向撑开。

媒体边界：既有Jest 8/8成功并核对测试源码；另外以只读VM执行正式脚本，覆盖两种renderer各初始319/320/321px，均得12/12/24rpx，每种初始情况再触发321→319→320、验证状态和相同回调卸载。媒体条件即使被忽略，Skyline也不具card-webview，不依赖源码顺序覆盖。VM无微信布局引擎，不代替渲染。

通用契约（单独验收，不增加/减少14条分母）：

| 契约 | 结论 | 依据 |
| --- | --- | --- |
| mpx-bindings | pass | 完整模板仅wx:class承载动态类；class静态，无动态style。 |
| renderer-exposure | pass | 选项式createComponent，模板直接用实例renderer；isSmall在data中，attached/resize更新，无多余isSkyline；setup暴露要求不适用。 |
| component-config | pass | 输出JSON仅component:true，title属性接口保留；无依赖组件，不额外构造app/page。宿主两项默认配置为任务已给前提。 |
| delivery-scope | pass | outputs仅完整style-card.mpx及report.md；输入before/after哈希一致，run.json.sources_unchanged=true。诊断副本仅位于run-1。 |
| evidence | pass_with_limitations | validation.json/audit.json、实际ESLint/Jest/编译结果及agent.jsonl互证；静态/mock/真实编译/渲染/真机层级明确，无历史分数。字体/真机/实际渲染均not_run。 |

验证边界与执行证据：ESLint首次入口定位ERR_PACKAGE_PATH_NOT_EXPORTED，改为包根定位后exit0；Jest首次Watchman权限在执行测试前失败，watchman:false后8/8（仅一次修复）。agent.jsonl:48/54和compile-result.json记录正式wx编译失败的两条同源dependency错误，均为输入未附带./city.woff2，非模板绑定或脚本错误。agent.jsonl:59/63及compile-diagnostic-result.json记录仅删除@font-face声明的诊断副本真实wx编译成功0错误0警告；已对比副本只删该声明。不得称正式文件编译通过。宿主提供字体是任务契约，故不据此否定所有静态能力；报告明确City独立族、Trip宿主映射和500/600的机型风险，满足s0_08。WebView/Skyline真实渲染和真机not_run；阴影、滤镜、实际字体采样与滚动手势仍待宿主集成验证。

原产物sha256：c35edc2916a81590ebb0572dadb0b937e1f572f3f485806f2903afa5313b93f3，与validation一致。本评分未改outputs、日志、metrics、原validation、测试或Skill；未重跑会覆盖原结果的测试，仅新增assessment和本审计。

指标读取：metrics.json为total_tokens=1161033、input_tokens=1147039、output_tokens=13994、tool_calls=30、duration_ms=328640；timing.json为328.64秒。仅引用运行器记录，无评分者自行估算token。

评测建议：当前14条覆盖本次核心目标，verification明确静态与渲染边界；无明显需新增的判别缺口。执行者的盒模型Jest是静态算式断言，不能单独证明引擎渲染，本次以实际节点与CSS链复核后评分。
