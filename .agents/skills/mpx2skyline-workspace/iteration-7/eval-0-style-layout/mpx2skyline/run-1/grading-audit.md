# eval-0 / mpx2skyline / run-1 独立评分审计

结论：**14 / 14，失败 ID：无**。依据 iteration-7/evals.json case 0 的14条原文及 verification 逐项判断；允许等价实现，静态充分可证的规则不额外要求真机。assessment.json 保持定义顺序。评分未读取 mpx Skill、其他配置组或历史产物。

## 审核范围与记录完整性

- 读取 grader.md、grading-standard.md、common-validation.json、evals.json case 0、input/task.md 和 input/style-card.mpx；本组知识依据为 `.agents/skills/mpx2skyline/SKILL.md` 及本组 style/reference/practice、runtime、template、audit-matrix。Skill 与参考当前哈希均匹配本次 source-snapshot.json 的实际运行版本。
- 完整解析 agent.jsonl 的105行：41个完成的 command_execution、6个 file_change、6条 agent_message、2条配置诊断；全部 command/result、修改路径及最终产物纳入核对，而非仅凭最后答复或“passed”文字评分。file_change 事件本身仅保存路径/类型，未保存 diff，故以当前完整文件、源码哈希、测试及执行记录交叉确认结果。
- 输入发现与读取：agent.jsonl:9/11/13。Skill和参考读取：7/15/19/21/26-39/45-46/49-50/55-56；只涉及本组 Skyline 知识。18/47/54/58/60/62 为 package/config/共享真实编译工具源码的只读检查，未读取其他 Skill。
- 文件修改事件：65 添加业务 style-card；76 添加测试与Jest配置；78 更新测试；86 关闭Watchman；97 添加验证聚合脚本；101 添加报告。生成/执行记录位于67/70-73/80-99/103。变更路径均位于本组 outputs 或 run-1，未观察到原 input 或 Skill 修改。
- 真实执行失败仅两次：agent.jsonl:71 的 wx 编译退出1；80 的 Jest 首次启动退出1。其余41条已完成命令中的39条退出0。两条顶层 error 是不识别的 Codex 配置键，不是业务代码或测试错误。stderr.log 另含Skill扫描和界面元数据警告，未见业务修改范围扩张。
- source-snapshot.json 的 before/after 相同，grader重新计算当前 input 与本组Skill哈希均一致。当前 outputs/style-card.mpx SHA-256 为 `2247effa9f6fe4b44402815791d1c564a45f9e7397cbe2d346ae3b80e47cb237`，与 validation.json 一致。outputs 仅 style-card.mpx 和 report.md。

## 通用契约（单列，不加入能力分母）

| 契约 | 结论 | 实际证据 |
| --- | --- | --- |
| mpx-bindings | passed，静态 | style-card:2 动态类仅在 wx:class；所有普通 class/style 为静态值，没有普通 class/style 插值。title 插值及 scroll 布尔属性不是动态 class/style 违约。 |
| renderer-exposure | passed，静态+mock | style-card:2 直接比较 renderer，未造 isSkyline；选项式 createComponent 使用 this.renderer，isSmall 在 data，updateWindowWidth 在 methods。没有 script setup，不适用 setup 的 defineExpose 要求。 |
| component-config | passed，静态 | style-card:80-82 保留 component:true。仅 view/text/scroll-view 内建组件，无额外依赖注册需求；无额外页面/app配置。title:String及默认值保持。 |
| delivery-scope | passed | 完整单组件和简要报告均位于 outputs；验证文件位于 run-1。没有将完整代码重复贴进报告；原 input 和Skill哈希未变化。 |
| evidence | passed，分层披露 | report:33-44、validation.json 清楚区分静态、ESLint、VM mock、真实wx编译failed及开发工具/真机not_run；记录字体例外、覆盖范围和缺失依赖。聚合audit有48条，但不把该数量当作独立自动验证通过证据。 |

## 关键能力的逐节点推导

**媒体查询 s0_03。** style-card:2 仅在 WebView 添加 card-webview；77的唯一媒体规则也仅匹配该类。Skyline 只按 renderer===skyline 且 isSmall 添加 card-small。27-44的attached读取 windowWidth，resize使用size.windowWidth，detached用同一函数引用清理并置空。不存在共享.card媒体规则后置覆盖的问题。

原执行测试47-101行核验319/320/321等初始值、跨断点变化、两个实例独立、清理同一callback、保留其他监听及WebView不订阅。grader另以交付源码脚本VM和PostCSS规则逐条匹配，两种renderer代入319/320/321，Skyline主动忽略媒体条件，输出如下：

| renderer | 319px | 320px | 321px | 卸载残留监听 |
| --- | --- | --- | --- | --- |
| WebView（正常媒体条件） | 12rpx | 12rpx | 24rpx | 0 |
| Skyline（忽略媒体条件） | 12rpx | 12rpx | 24rpx | 0 |

此为静态规则+mock复核，未声称微信窗口或原生WXSS引擎实测。

**负 margin 占位链 s0_12。** 沿11-14的真实树追踪：overlap-host > tips-wrapper > tips-bar，content-card 是 wrapper 的后续兄弟。64使host与wrapper都成为column Flex。宿主content-box下bar可见盒高92+92=184rpx；-28底margin使wrapper的auto内容高156；wrapper自身+28底margin补回原WebView折叠差；再与card的-92顶margin相加，card顶部156+28-92=92、底部212。原输入WebView末子bar负margin与后续card负margin可跨wrapper折叠为min(-28,-92)=-92，原顶部184-92也为92。输出两renderer统一Flex不折叠，保留原相对重叠与host占位。该补偿是可接受的等效实现，不能只因比Skill示例多了正margin就扣分。

15/69-70的simple-overlap没有被改为Flex，前项高24rpx、后一项margin-top:-8rpx，仍是顶位置16rpx的普通8rpx回拉。测试126-139对上述代数提供支持，但原生几何结果为not_run。

**横向容器 s0_13。** 16-18确定fit-content是scroll-view直接子节点。71的viewport320px、row Flex、38px高；72的width:100%直接作用于fit-content本身，而非只有内部项min-width或flex。没有左右padding/border/margin，所以背景宽320px；两个fit-item按73的flex:1 0 0、min-width:0平分为各160px。两renderer共享同一路径，type=custom、scroll-x=true、enable-flex=true保留。原生320px真实滚动视口几何为not_run，静态布局已足以判分。

**其余几何和视觉。** 标题实际text为display:block，card正常块宽受宿主可用宽度约束，max-lines/overflow属性和WebView单行CSS路径均保留。labels父row Flex和两个50%直接子项无额外盒边，等分成立。活动真实节点带badge-sale并匹配#d00。outer的20px来自父padding，child自身10px使内容起点30px；child显式content-box宽100px，外宽120px；first/second间距仅16+0。many与many-front都是无盒边的auto块，唯一子盒决定父高度、横向同时铺满，两阴影同尺寸且#000前、#333后。filters真实嵌套保证blur(2px)先作用、brightness(.8)后合成；独立blur和单个rgba阴影未误拆。

## 验证可信度、失败和边界

- **ESLint：passed。** agent.jsonl:70保存真实命令退出0，eslint.log对应原样交付组件，无违规输出。
- **Jest/mock：passed，14/14。** 原始jest-results.json成功、14通过0失败，agent.jsonl:88的真实命令退出0。grader再次原样执行既有Jest配置（无--outputFile，未覆盖原始结果），退出0、14/14通过。测试源码确实读取交付文件并执行其脚本、动态类表达式、样式AST及几何代数；不含真实Mpx响应式运行时或微信排版引擎。首次失败为Watchman目录权限，之后仅关闭本组Jest配置的watchman完成一次修复，未发生超过3次修复。
- **矩阵：48条人工复核+候选扫描。** agent.jsonl:21有矩阵读取，90-94生成并真实执行audit-scan.sh。audit.json由collect-validation.cjs硬编码人工结论聚合，这不等于48条独立自动测试；本评分对实际节点及样式重新复核。保留字体与媒体查询均有具体例外或隔离依据。
- **真实wx编译：failed。** agent.jsonl:71退出1；compile-result.json含2条dependency错误，均源于同一 `Can't resolve './city.woff2'`，0 warnings；未观察到模板绑定或其他编译诊断。命令对原样输出执行，未以删字体副本替代成功验证。task.md明确字体二进制由宿主提供，输入也缺该文件，路径及@font-face沿用输入。因此其失败记作真实编译依赖边界，不把宿主缺失二进制视作输出新增的能力错误或对14项静态断言全扣；仍不能宣称交付已完整编译成功。
- **字体 s0_08：静态处理与报告契约passed；实际加载/映射/视觉not_run。** report:24-27识别City独立family及Trip宿主来源，要求宿主提供真实city.woff2、核对family/PostScript/字重表，保留设计500/600并记录iOS/Android风险。没有二进制时不要求伪造字体或擅自换bold。
- **开发者工具、真机、真实布局、字体视觉：not_run。** report:39-44与validation.json状态一致。本次grader也未启动微信或真机。阴影/滤镜/字体像素、原生省略、原生滚动手感、真实resize监听和挂卸载仍需宿主验收；静态分数不等价于这些设备验证通过。
- **指标：available。** run.json记录gpt-6.1-sol/high、执行成功返回0、385050ms；timing.json为385.05s。metrics.json total_tokens=1248159（input1232326/output15833），agent.jsonl:105同值并含cached_input_tokens=1154176。仅记录本次原始指标，不作为能力得分依据。

评测定义对媒体隔离、负margin链、直接内容宽度的verification足够具体；未发现需要新增断言才能揭示的本组实质错误。现有执行测试的代数不能单独证明引擎像素结果，本审计已按v7要求把静态得分和原生not_run分开。
