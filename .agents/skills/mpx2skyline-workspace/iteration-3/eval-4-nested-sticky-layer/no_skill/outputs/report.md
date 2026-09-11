# category-panel 适配报告

交付 `category-panel.mpx`，保留 sections 输入结构、400px 外层纵向滚动、120px 项目宽度和打开/关闭弹层交互。

- 在 attached 中读取组件实例 `renderer`，Skyline 分支使用 sticky-section / sticky-header，每个标题的吸顶范围由所属分组限制；WebView 分支保留分组内 CSS sticky。
- Skyline 横向 scroll-view 使用横向 flex 布局，项目禁止收缩；WebView 保留 nowrap / inline-block，横向区域高度均为 80px。
- 移除滚动容器的 transform 和 z-index，弹层移为滚动区域外的根级兄弟节点，通过 fixed 四边定位和高于悬浮按钮的 z-index 覆盖按钮。catchtap 关闭、catchtouchmove 阻止触摸冒泡。
- 组件 JSON 保留 component:true；宿主页已有 Skyline / glass-easel 配置，不修改页面或应用配置。

验证：Mpx 微信模板解析无错误、无警告；JSON 解析通过；脚本 ESLint 通过；Jest 3 项测试通过，覆盖 renderer 分支选择和打开/关闭状态变化。

## 未验证项

微信开发者工具 / iOS / Android 真机：not_run。静态解析和脚本测试不能证明实际渲染与原生手势行为。待在两种 renderer 下以多组、每组多于一屏的条目验证：纵向滚动时标题吸顶和分组交接、横向滚动且条目保持 120px、斜向手势竞争、弹层覆盖按钮且背景不响应触摸、点击关闭后恢复操作。组件实例 renderer 在目标基础库的可用性也需真机核对。

其他目标平台未编译验证；本交付验证范围仅为微信两种 renderer。
