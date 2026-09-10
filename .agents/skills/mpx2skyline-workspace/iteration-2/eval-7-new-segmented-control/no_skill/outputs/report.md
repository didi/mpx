# 交付说明

新增完整 `segmented-control.mpx`，采用 Mpx script setup、普通语义 class 和微信原生 view/text/scroll-view；组件 JSON 仅声明 `component: true`，渲染器由宿主页面选择。

- props 包含 controlKey、options（默认空数组）、value（默认空字符串）、disabled（默认 false）、label（默认“分类”）。
- ref 维护本地选择，watch 同步父 value，computed 派生候选状态与当前选中名称。未匹配候选时显示“未选择”。父值同步不会发送 change。
- 整体禁用或候选禁用均阻止选择；点击可选候选更新本地值并发送 change，detail 为 `{ controlKey, value }`。
- 候选横向滚动，每项宽 160px、最小宽 100px，禁止 flex 收缩。候选名称使用明确宽度与单行省略声明。

# 实际验证

执行 `node validate.cjs`，退出码 0。使用 Node 内置 vm 执行组件实际脚本，通过模拟 ref/computed/watch/useContext 检查默认值、点击更新、事件字段、单项和整体禁用、父 value 同步回调、候选名称更新、空列表及无效索引；同时解析组件 JSON，检查滚动和省略样式声明。

这次验证使用模拟响应式环境，未验证真实 Mpx 编译、watch 调度与模板绑定。没有安装依赖，没有执行 eslint/Jest，也未在微信开发者工具或真机上运行 WebView/Skyline，因此不能据此声称两端实际滚动与省略效果已验证。

宿主集成后需分别在 WebView 和 Skyline 页面检查窄容器横向滚动、长中文候选单行省略、选中态、整体/单项禁用，以及父 value 更新后的展示与事件行为。
