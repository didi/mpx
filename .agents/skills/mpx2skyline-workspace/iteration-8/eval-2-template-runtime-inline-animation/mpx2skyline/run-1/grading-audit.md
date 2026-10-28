# Eval 2 / mpx2skyline 独立评分审计

评分：7 / 8；失败 ID：s2_05。逐条原文、原序与实际链路见 assessment.json。静态充分条件按定义计分，未因没有真机而否定其他7项。

范围：读取本case的task/input、evals.json case 2全部8条verification、本组69行agent.jsonl全部命令与结果、4个业务outputs、验证源/日志/审计/指标。重复的Skill与矩阵读取结果还与冻结快照逐字核对。能力参考仅iteration-8/skill-snapshots/mpx2skyline及references；共享编译工具只作为执行验证工具。未读取另一组或历史评分。input/Skill当前哈希与本组before/after快照一致；原outputs/logs/metrics/validation未改。

## 失败原因：标题宽度链未成立

实际编译已确认span，而非只检查源码mpxTagName（grader-compiled/__validate_0.wxml:1）；图片Skyline动态类也映射inline-block。但outputs/user-list.mpx:45的heading未设row，:46标题width:0/flex:1/min-width:0。

冻结style-reference:40规定，Skyline未开defaultDisplayBlock时Flex默认方向为column；task.md:3仅确认宿主页Skyline/glass-easel，不能推定兼容默认值已开启。该合法宿主下，flex:1沿纵轴分配，heading的align-items:center不让标题横向拉伸，width:0仍为横向尺寸。因此无法证明长label与图标占用有效行宽、共同省略，也不能证明与WebView默认row等价。实际编译WXSS同样没有row声明。这是s2_05的静态布局缺陷，非“真机not_run”扣分。

原测试只证明标题属性、两renderer类映射及长label绑定；没有布局引擎，也没有核对父Flex方向。原audit对STYLE_FLEX_TEXT_WRAP/INLINE_MIXED_CONTENT的pass以及报告“静态完整通过”的总结因此过强。当前verification的宽度约束可捕获该问题；建议后续核验明确检查父主轴和已知宿主默认值，避免以span与inline-block存在替代实际宽度链。

## 其他链路与Common契约

- 循环：initData.visibleItems=[]保护首帧；items默认[]；唯一赋值setRows归一undefined/null；filter始终返回Array。grader-runtime.json补查undefined/null/空数组/有效数组及再次清空；过滤仅保留甲/丙。外部user-row通过import和data={{index,item}}得到0:甲、1:丙，真实编译模板及导入路径相符。
- 回顶：同一按钮tap→scrollTop→组件this.createSelectorQuery→#users→node().exec→scrollTo({top:0})；目标users自身enhanced=true、scroll-y=true，other未被调用。
- 两详情入口都到/pages/detail；navigator仅text，卡片外层点击调用navigateTo。
- 圆点真实节点8px/#f50，1s infinite、opacity .3→1、both；按钮响应式pressed通过wx:class完成按下/松开/取消，scale .96、opacity .7与恢复1，均150ms。

Common（不计入8分）：动态类全部wx:class、普通class静态；模板直接用renderer，选项式data/methods可消费，不存在setup暴露遗漏；保留component:true、label/payload与config.default，无自定义依赖遗漏；4个指定交付文件齐全，输入只读。验证层级有分别记录，编译通过与真机not_run未混淆；静态审计结论存在上述漏项，已在本评分纠正。单组件任务无需额外app/page配置；宿主兼容配置未提供的事实不能反过来成为假定默认值已开启的依据。

## 独立复验与验证边界

原ESLint完整mpx检查0 error/0 warning；原Jest第1次Watchman权限失败、第2次mock错误地把WXML对象简写当JS逗号表达式、第3次修正mock后11/11，通过前仅2次修复，没有为通过而改业务文件。

评分者只读重跑原Jest，11/11通过（grader-jest.json）；补充数据路径VM mock见grader-runtime.json。重新使用workspace当前mpx.config.js的runtime-core alias执行真实wx组件编译，ignoreSubComponents=false、cleanup=false保留产物，0 error/0 warning，见grader-compile.json与grader-compiled/。原始compile.log同样成功。编译证明标签、模板及语法成立，不证明CSS原生几何正确。

开发者工具、真实双renderer布局/滚动/跳转/动画观感均not_run；VM测试不执行Mpx响应式调度、原生ScrollViewContext或文本排版。未将这些测试称为真机通过。新增核验只写grader-*和评分文件，原证据哈希复核见grader-preservation.json。

原执行指标：415.597秒；input_tokens=1263262、output_tokens=12538、total_tokens=1275800（包含缓存输入），tool_calls=29；不作为本评分者成本。
