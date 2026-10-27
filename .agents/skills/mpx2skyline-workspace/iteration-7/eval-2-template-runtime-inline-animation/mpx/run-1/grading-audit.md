# Case 2 / mpx 独立评分审计

能力评分7/8（适配项），失败ID：s2_05。assessment.json保持evals.json case2八条断言的原文与顺序；其余七项按实际节点、脚本和真实编译证据通过。本次仅查看case2的mpx组产物、执行及验证记录、case2输入与指定mpx Skill的Skyline/base参考，未查看其他组及历史输出。

## 通用契约（独立于能力分数）

| 契约 | 结论与依据 |
| --- | --- |
| mpx-bindings | pass：完整模板user-list.mpx:1-16与row.wxml均核对；普通class静态，唯一动态按钮状态用wx:class。编译后经_s_.c生成动态class；无普通class/style动态绑定误用。 |
| renderer-exposure | pass：两个renderer共用节点/样式/脚本，不使用额外isSkyline或未暴露renderer。选项式定义中pressed在data，visibleItems在initData/computed，处理器在methods，label为property；无setup暴露遗漏。 |
| component-config | pass：component:true保留(:54-56)，仅原生组件与import模板，不需usingComponents。未添加app/页面配置，宿主Skyline/glass-easel由任务确认。 |
| delivery-scope | pass：outputs仅user-list.mpx、row.wxml、logo.svg、report.md；保留label/payload与config.default='keep'，SVG字节不变。input/Skill before与after哈希一致，评分者复算输入及产物与原validation一致。 |
| evidence | pass_with_limitation：真实命令支撑ESLint、14项Jest和wx编译通过，真机/开发者工具/真实滚动与路由标not_run。原static-audit将图文整体标passed，未核验断言inline-block子条件，独立评分已纠正而未覆盖原validation。 |

## 执行记录与验证可信度

agent.jsonl共64事件、27条完成命令；逐条核对实际路径、修改范围、退出码及结果，完整命令、输出长度及结果哈希留存grader-verification.json。日志7-34读取指定Skill、case2输入、Skyline/base参考及编译工具；36写三个业务文件；39 ESLint退出0；40真实wx编译退出0，47展示0 errors/0 warnings。43创建测试，45/49为首次Watchman权限错误；51关闭Watchman后运行，53为13通过/1失败；55仅转义测试正则{{1}}花括号，第三次成功，58显示14项通过。60生成静态审计/原validation，62输出交付及验证汇总。两次修复限于测试/运行配置，未修改业务文件。

既有Jest读取真实脚本，用VM截获createComponent、手动求computed、模拟查询context/navigateTo，行数据只做字段替换。两个renderer名称运行的是同一共用逻辑，不能当作真正双renderer模板引擎。覆盖首帧/null/数组更新、过滤后0:甲/1:乙、两次回顶#users且other不动、同一按钮按下/松开/取消/tap，以及导航接口。评分者独立重跑原测试14/14通过，未覆盖原日志/结果：

```sh
node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config '{"rootDir":"./iteration-7/eval-2-template-runtime-inline-animation/mpx/run-1","testMatch":["**/user-list.test.cjs"],"testEnvironment":"node","transform":{},"watchman":false}' --runInBand --no-cache
```

cwd为mpx2skyline-workspace。另将实际computed代入undefined、null、[]、含隐藏行的有效数组，返回[]、[]、[]、[甲,乙]；initData.visibleItems=[]保护首帧。setRows的Array|null契约之外任意非法类型不额外要求兜底。

原真实编译只保存JSON成功结果，未保留生成标签。评分者通过同一mpx/scripts/compile-validate.js导出API，以target=wx、cleanup=false独立编译原业务文件，仅复制WXML/WXSS至grader-compiled，再清理自身临时构建目录。grader-compile-result.json显示0 errors/0 warnings。实际编译证据：

- grader-compiled/__validate_0.wxml:1 标题真正生成span，包含同一image/text与max-lines/overflow；按钮class经_s_.c生成；users合法id/enhanced以及外部模板参数均保留。
- grader-compiled/template/row231111b0.wxml:1 存在具名user-row，以当前index/item.name渲染，导入路径真实生成且可解析。
- grader-compiled/__validate_0.wxss:1 保留圆点1s infinite/both、opacity .3→1，以及按钮.15s transform/opacity过渡；logo仅24px尺寸及vertical-align，未生成display。

这些是真实Mpx/webpack编译证据，不是微信原生渲染证据。未发现绑定或编译阻断其余七条能力。

## s2_05失败与口径局限

产物已满足实际span、共同承载、max-lines/overflow、Flex可收缩有限宽度、WebView单行省略CSS等条件。但user-list.mpx:48与最终WXSS无图片display:inline-block，完整模板也无对应renderer动态样式；未提供可信的默认display等价证据或长label真实渲染结果。因此依照不变的既定断言，仅对inline-block子条件证据不足判false；不因缺真机本身扣分。

这不是已观察到的视觉故障，不能据此断言实际Skyline图文混排必然失败。指定mpx/references/skyline/skyline-style-practice.md“内联混排”区分rich-text业务示例与基础span+text/image/navigator组合：图片inline-block、rich-text virtual-host inline-flex是示例结构的适配点，并提示基础组合不要直接套用这组样式。当前是基础span+image+text；既定断言比该Skill对基础组合的泛化建议更具体，本次保持评分方式并保留这一口径局限。

既有Jest标题测试仅检查源码mpxTagName、共同节点、省略CSS，未检查实际生成标签或图片display，故14项通过不足以覆盖s2_05全部条件。原static-audit的图文及省略passed也仅覆盖部分子条件，未直接继承为分数。

## 未运行范围与指标

开发者工具WebView/Skyline：not_run；真机：not_run。长label真实截断、动画插值、真实触摸过渡、实际列表滚动/重复回顶和详情页路由均not_run。其余七项静态/编译可证而通过，不称为设备验收通过。调用侧、app/page与详情页未提供，按单组件边界不要求补建。

原metrics/timing记录339.079秒、1462942 total tokens（1448817 input、14125 output）；agent.jsonl:64的cached_input_tokens为1368832。照录指标，不把缓存输入等同新增计费，费用unavailable。无user_notes.md。本次只新增assessment、audit及grader-*证据，业务产物、既定断言、原日志/metrics/validation保持原样。

## 评测建议

后续可明确图片inline-block允许“显式声明或可信宿主默认等价证据”，并用基础span组合在窄宽度长label下的真实渲染支撑默认等价判断，避免把特定rich-text示例样式误当作所有图文混排的必需条件。本次未修改断言或评分方式。
