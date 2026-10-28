# 独立评分审计：eval-3 / mpx

结果7/7；失败ID：无。原7条断言原序原文写入assessment.json。仅读本case、本配置、本轮规则及指定mpx快照base/Skyline参考；未读另一组或历史结果。

已核对完整agent.jsonl的31条完成命令与结果链、全部5个输出、原真实编译和12项业务测试。页面与两个独立组件的JSON、实际WXML/WXSS/JS均核对；原compile-final-page.json为页面递归解析组件，compile-final-components.json为两个独立组件入口，两者真实wx编译0错误0警告。mpx.config.js既有core别名指向本轮runtime-core，产物source map中56项runtime-core源及src/index.js证明该别名实际生效。

首帧特别验证：新增grader-first-frame.cjs直接执行原build-wx/components/segmented-control5f952533/index.js，以Component回调截获原生注册对象。未调用任何setup、生命周期或computed，native data已为{safeOptions:[]}，Array=true、length=0；实际WXML循环直接消费safeOptions。因此不是以手动computed mock替代首帧。证据为grader-first-frame.json/.log；compiled-scripts的真实setup转换保留initData，编译运行时native options合并链同样可见。后续null、空数组、有效数组、再次null由computed Array.isArray归一与实际模板消费mock共同证明。

七项能力：配置及真实自定义导航完整；窗口px高度→column Flex→top不收缩/region flex1 min-height0→scroll-view100%构成有界列表，任务项直接子节点、顶部两组件在列表外；刷新实际事件绑定及resolve/reject/finally均复位；触底连续+2且concat保留原任务；三处实际text省略与父级/内部可收缩宽度链成立（本例app已明确defaultDisplayBlock=true）；两个组件实例状态驱动150ms按压并在end/cancel恢复；options首帧和后续循环消费均安全。

通用与创建契约（独立验收，不改变7条分母）：

| 项 | 结论 | 证据 |
| --- | --- | --- |
| mpx-bindings | pass | 所有动态class/style均wx:class/wx:style，普通class静态；真实编译事件参数代理生成。 |
| renderer-exposure | pass | 无renderer分支需暴露；共用两模式支持的实现。页面和segmented setup均显式defineExpose所有模板消费的状态/方法，rating为选项式。 |
| component-config | pass | 页面usingComponents相对路径解析到两个真实交付组件；两个component:true，app注册页面并保留首页及window/WebView设置；编译JSON路径真实存在。 |
| delivery-scope | pass | outputs恰为3个SFC/app.json/report.md，无额外业务文件；输入/Skill before-after哈希一致，审计source_sha256重新核对一致。 |
| evidence | pass | 原validation.json区分静态、mock、真实编译与not_run运行；48项矩阵有说明，无无解释error，未复用历史分数。 |
| creation.compile | pass | 页面递归与组件入口真实wx编译通过，setup转换、组件JSON、引用解析及模板暴露均核对；完整App源码不齐，完整宿主构建not_run。 |
| component-contracts | pass | 两类API/属性默认值正确，value连续更新同步；立即选中和约定detail，readonly/整体/单项禁用保护；每类双实例隔离。 |
| page-integration | pass | 实际页面模板传board/category键、类型/选项/value，两个change消费detail回写页面与子属性；刷新成功评分归0、失败保留。 |
| page-business | pass | 参数/decodedQuery及非法回退、筛选、完成切换、空态、刷新失败/重试成功、连续分页唯一键按实际模板绑定验证。 |

原验证过程：首次ESLint4条initData警告后补齐并最终0错误0警告。Jest首次Watchman启动权限失败；关闭Watchman后9过3失败，原因是测试挂载器computed不可枚举和未模拟子事件后父props回传；修正测试挂载/回写后12/12，随后页面decodedQuery小改再次12/12。未超过3次失败修复上限。静态扫描初次正则跨text闭合误判，缩小到每个text内部后通过。上述失败记录均保留，未把失败隐藏成首次即通过。

边界：本次新增首帧验证为Node执行实际编译JS并拦截原生注册边界，只模拟wx基础环境/注册函数；不代表glass-easel真实挂载、native props类型转换、触摸派发、滚动惯性或像素几何。12项原业务测试使用真实setup编译+Vue2.7响应式+宿主/定时器替身；这些mock与静态宽度链足以证明指定能力的代码路径，实际WebView/Skyline开发者工具与真机均not_run。完整宿主App构建not_run（输入无首页源码/app.mpx），不把这一边界等同于3个SFC编译失败。

未重跑会覆盖原结果的测试，未改outputs/原日志/metrics/validation/Skill/原测试，仅添加grader-first-frame与本评分文件。原metrics记录total_tokens2687374/input2662551/output24823/tool_calls31/duration_ms693164，timing为693.164秒，无评分者自行估算。

评测观察：首帧断言n3_06有必要独立于computed单测核验，本次真实native注册data已补足证据；未发现其他明确的评测覆盖缺口。
