# 交付说明

新建 `segmented-control.mpx`，仅组件职责，无页面配置、无额外运行依赖、无 UnoCSS。

- 使用 Mpx script setup、ref 本地选择、watch 父 value、computed 派生候选状态及选中名称。仅向模板暴露实际使用的计算状态和处理函数。
- props 按需求声明，默认值使用 Mpx properties 的 `value` 字段。有效新选择触发 `change`，detail 为 `{ controlKey, value }`；重复点击当前值不触发变化事件，禁用项与整体禁用均拦截选择。
- 横向 `scroll-view` 使用 `type="list"`、`enable-flex` 与横向 flex；候选直接作为列表子节点，宽 120px、min-width 100px、不收缩。
- 长标签宽 96px，WebView 的 CSS 单行省略与 Skyline 的 `max-lines` / `overflow` 共存；显示分类标签和当前选择名称，未匹配时显示“未选择”。
- 无 Skyline-only API，无需 renderer 分支。选项 value 应唯一且为字符串；父级更新 value 同步本地状态，不反向触发 change。

验证：3 项 Jest 行为测试通过，提取脚本的 ESLint（no-unused-vars、no-undef）通过；完整 Skyline 矩阵逐项复核和候选扫描完成，当前组件 scope 无未解释 error/warn。审计、验证脚本及 execution.json 位于 `../run-1/`。

验证限制：行为测试使用轻量响应式替身验证业务状态逻辑，未运行 Mpx 完整编译、真实调度器、微信开发者工具或真机。需在已有 WebView/Skyline 宿主页复验横向手势、长中文省略和禁用反馈；宿主页及 app 接入配置不在本次组件交付范围。未安装依赖。
