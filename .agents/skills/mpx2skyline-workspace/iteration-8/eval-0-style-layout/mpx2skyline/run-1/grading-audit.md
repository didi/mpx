# Eval 0 / mpx2skyline 独立评分审计

评分：14 / 14，失败 ID：无。按 iteration-8/evals.json case 0 原顺序、原文与 verification 逐条评定；证据见 assessment.json。通过指静态可证明的能力条件及相应 mock，不代表设备视觉验收。

阅读范围：skill-creator/agents/grader.md、iteration-8/grading-standard.md、common-validation.json、evals.json case 0、input/task.md 与 style-card.mpx、本组完整 agent.jsonl（60行，21次完成的命令、4次文件改动事件、5条回复，连同命令实际输出）、全部业务 outputs 与 run-1 的验证源/报告/日志/指标。能力参考限冻结 mpx2skyline/SKILL.md 及其 references；记录中的共享编译工具调用按执行证据核对。没有读取其他组结果、iteration-7 或其他历史评分。输入与冻结Skill的当前SHA256均匹配本组source-snapshot.json的before/after；本次未改原outputs、logs、metrics、validation。

## Common 契约（不计入14分）

| 检查 | 结果 | 具体证据与边界 |
| --- | --- | --- |
| mpx-bindings | passed | style-card.mpx:2 动态类使用wx:class；完整模板:1-21普通class均为静态，没有动态style。isSmall在data:27声明，由attached/resize更新。 |
| renderer-exposure | passed | 模板:2直接比较renderer，选项式脚本:29/:38使用this.renderer，无isSkyline。不是setup，故不需要defineExpose；符合冻结runtime reference的选项式链路。 |
| component-config | passed | :75-77保留component:true；模板只有内建组件，无遗漏依赖注册。单组件任务无需创建app/page配置。 |
| delivery-scope | passed | outputs只有完整style-card.mpx及report.md；保留title:String/value接口。run.json和source-snapshot.json证明输入/Skill未改，本评分者亦核验当前哈希相同。 |
| evidence | passed | validation.json与report.md分别记录静态、VM mock、真实编译失败、原生/真机not_run；audit.json列48条规则及字体例外。agent.jsonl可追溯实际读取与命令，无复用历史分数证据。 |

## 关键几何与实际链路

- s0_12：原WebView的tips-wrapper既无padding/border/固定高度，也未建立BFC，tips-bar末尾-28rpx与后项-92rpx会折叠，不能直接相加。外高H=92+92=184rpx，原起点184+min(-28,-92)=92rpx、重叠92rpx、末端212rpx。两层父布局统一column Flex后不折叠，wrapper占位156rpx，后项改-64rpx，起点156-64=92rpx、重叠92rpx、末端212rpx。输出的补偿保持改造前WebView基线。普通simple-overlap未加Flex，24rpx第一块后以-8rpx回拉，保留16rpx起点。
- s0_13：320px滚动视口 → 直接fit-content.width:100%=320px、背景铺满 → 两个fit-item.width:50%=160px，flex-shrink:0。width确实作用于直接内容节点。
- s0_03：非Skyline才有card-webview；媒体查询唯一选择器使用该类。两端319/320px为12rpx、321px为24rpx；Skyline即使媒体条件被忽略也不匹配媒体类。运行时窗口读取、跨断点resize、同一回调卸载清理与实例隔离已有mock覆盖。
- s0_06：many为普通block，many-front.width:100%，无padding/border/margin且父高由唯一内层决定，同尺寸；父#333阴影居后、子#000阴影居前。没有只按声明存在就放行。

## 验证与依赖边界

原ESLint为0 error/0 warning（只检查抽取的脚本，未声称WXSS检查）。原Jest 14/14；首次Watchman沙箱失败后关闭Watchman通过，只有一次重试。评分者只读复跑同一测试，--watchman=false、cache:false，结果仍14/14，另存grader-jest.json，未覆盖原jest.json或日志；该测试覆盖的是静态结构与VM mock，不是Mpx真实响应式或原生布局。

真实wx编译已执行，compile.json:5-17的两条dependency诊断都来自宿主未提供的city.woff2，warnings为空。不能声称业务交付已整体编译通过；按任务明确的外部字体契约，将其单列为依赖边界，不把14条静态能力全部判失败。City-Semibold独立字体族已识别，Trip-Medium的宿主注册、name表映射和500/600机型匹配已列待核验，沿用已确认设计，满足s0_08 verification。

开发者工具、真实WebView/Skyline几何及像素效果、字体二进制检查均为not_run。当前没有新增真机证据，也没有把静态盒模型换算称为渲染测量。报告的48条矩阵记录与14项Jest结论可核对；未发现超越这些边界的通过宣称。

能力失败原因：无。评测反馈：当前断言要求追踪节点、原基线与调用链，具有区分力；无需因没有设备而改变静态可证断言的判据。

原执行指标：252.735秒；input_tokens=868075、output_tokens=12962、total_tokens=881037（含缓存输入，不作为本评分者成本）。metrics.tool_calls=25与21次命令+4次文件改动事件相符。
