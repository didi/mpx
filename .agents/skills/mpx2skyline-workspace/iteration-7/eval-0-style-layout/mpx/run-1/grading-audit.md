# Case 0 / mpx 独立评分审计

能力评分：13/14（适配项），失败 ID：s0_12。只检查 iteration-7/eval-0-style-layout/mpx 本组；未读取其他组及历史输出。逐条结论见 assessment.json，均依据 verification 的实际节点、样式路径、脚本和调用链；静态可证能力与真实渲染分开。

## 通用契约（不计入 14 分）

| 契约 | 判定与依据 |
| --- | --- |
| mpx-bindings | pass：完整 template（outputs/style-card.mpx:1-21）仅静态普通 class；唯一动态 class 使用 wx:class；无动态普通 style/class。title 插值保持单行。 |
| renderer-exposure | pass：:2直接比较renderer，未派生isSkyline。选项式createComponent，renderer为实例内置成员；isSmall在data(:28)，resize处理器在methods(:36)，不存在setup暴露遗漏。依据本组mpx的skyline-runtime-practice“判断当前渲染模式”。 |
| component-config | pass：:72-74保留component:true；只用原生view/text/scroll-view，无需usingComponents。保持title:String/value与原接口；单组件任务无需app/页面配置。 |
| delivery-scope | pass：outputs仅style-card.mpx和report.md；未改input。source-snapshot.json before==after，评分者重新计算input和产物哈希一致；本次仅新增assessment.json、grading-audit.md、grader-verification.json。 |
| evidence | pass_with_environment_limit：报告与validation区分静态、mock、编译failed、开发者工具/真机not_run。实际命令与结果可追踪，不以最终声明或矩阵status直接给分。 |

## 执行记录与验证可信度

完整扫描agent.jsonl 50条事件并提取20条完成命令及结果（含退出码、输出长度/哈希，见grader-verification.json），不是只读末尾总结。日志7-28记录指定mpx Skill、Skyline/base参考和任务输入读取；30/33为最终组件写入与ESLint退出0；34为真实编译退出1；37/39为第一次Jest受Watchman状态目录权限阻断；41关闭Watchman并补VM中的String后退出0；44含完整16项通过输出；46生成48规则审计矩阵与validation，48核对最终哈希和交付范围。没有读取专项mpx2skyline Skill或另一组产物的命令。配置警告不等于业务检查失败。

ESLint真实执行证据为agent.jsonl:30、33与eslint.log，未报错。Jest既有测试确实读取实际脚本/模板/CSS，VM仅mock createComponent和窗口API；覆盖10个窗口/生命周期检查与6个结构检查。评分者以同一测试文件独立重跑，16/16通过，未改原测试或覆盖原日志。重跑命令：

```sh
node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config '{"rootDir":"./iteration-7/eval-0-style-layout/mpx/run-1","testMatch":["**/style-card.test.cjs"],"testEnvironment":"node","transform":{},"watchman":false}' --runInBand --no-cache
```

cwd为本suite父工作区mpx2skyline-workspace。重跑结果1 suite、16 tests passed；这证明脚本逻辑及静态约束，不证明原生响应式/排版。没有新增业务单测，也没有修改业务输出。

评分者另外执行Node VM中的实际wx:class表达式，并用PostCSS按实际类匹配padding；Skyline忽略媒体条件的模型下仍正确：

| renderer | 319px | 320px | 321px | 媒体专用类 |
| --- | --- | --- | --- | --- |
| WebView | 12rpx | 12rpx | 24rpx | card-webview |
| Skyline | 12rpx | 12rpx | 24rpx | 始终没有card-webview |

初始化窗口状态来自实际getWindowInfo调用，resize/offWindowResize的同一实例方法由既有mock多实例测试验证；不是依赖后置CSS遮盖共享媒体规则。

s0_12静态链为overlap-host > tips-wrapper > tips-bar，以及overlap-host > content-card。输入默认block布局中，tips-bar外高184rpx，底部-28rpx可折叠到没有border/padding/overflow/固定height的tips-wrapper；再与后卡片顶部-92rpx折叠，全负取-92，原始卡片顶部是92rpx。产物把两级父容器都改为column Flex，负margin不再折叠，提示分支占位156rpx、卡片顶部64rpx，向上多28rpx，改变原有重叠位置，故失败。普通负8rpx对照保持正确，不足以满足整条断言。s0_13直接子节点fit-content的width:100%以320px视口为包含块，两个零basis子项各160px；没有只改内部flex来反向撑宽，因此通过。均依据静态结构/盒模型判定，不宣称设备测量。

## 失败、保留风险与评测边界

真实wx编译：failed。compile-wx.json记录2条同源dependency错误，都为无法解析./city.woff2；日志确实执行编译，未伪造成功，也未移除字体规则或填假文件。任务明示字体由宿主提供且输入未交付二进制，因此本次按s0_08允许的缺字体分支核对字体来源、PostScript/注册待核验点与500/600机型风险，不将环境依赖缺失扩散为全部静态布局断言失败。当前产物在该孤立目录无法完成打包，仍需宿主真实字体集成后重编译；没有证据证明缺资源以外的真实编译成功。

WebView/Skyline开发者工具、真机：not_run。原生文本截断、真实字体/字重、阴影绘制、滤镜组合、负margin几何与320px滚动背景均未做实机渲染；已有report.md:31-36和validation.json:53-65如实标记。静态通过不是视觉验收通过。

s0_12失败来自静态可确认的业务几何差异，与真机缺失无关。共用Flex只是可采用的实现手段，不能豁免“保留原有”业务要求；相同新布局不等于保持原始WebView布局。报告:11的156/64rpx推导本身正确，但未对照输入block下184/92rpx，因此“保留原有”主张证据不足且被盒模型反证。参考的统一Flex建议必须与原始margin折叠结果一起处理，例如采用等效占位补偿；评分者不修改业务实现。

执行器metrics.json/timing.json记录257.078秒、1173155 total tokens（1162171 input、10984 output；缓存输入997376见agent.jsonl:50）；仅照录，不把缓存token当新增成本，不推断不可得的计费费用。输入与已读取的本组Skill文件哈希均与source-snapshot的before/after一致。无user_notes.md。

## 评测改进建议

s0_12现有“保留原有”语义足以拒绝本次28rpx偏差。为减少评分者把“适配后两模式一致”误当成“保留原有”的风险，可在verification补入原始block卡片顶部92rpx的可复算基线，并要求同时计算改造前后；不是仅检查两个父容器是否出现Flex。既有Jest负margin检查只镜像输出声明，遗漏这项业务回归。其余断言覆盖节点/调用链与边界，未发现仅文件存在即可蒙混的评分项。
