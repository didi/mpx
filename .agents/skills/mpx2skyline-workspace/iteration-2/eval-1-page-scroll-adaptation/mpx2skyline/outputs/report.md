# 订单页双渲染适配

已交付 orders.mpx、app.json 与原样保留的 service.js，保留 ./service 导入。task.md 一并保留。

- 使用显式 type="list" 的纵向 scroll-view，订单项保持直接子节点；页面滚动关闭，下拉刷新、触底加载、滚动监听统一迁移到容器事件，滚动位置从 e.detail.scrollTop 读取。
- 初次加载和分页追加沿用服务；刷新成功替换订单并重置页码，刷新失败保持现有订单和页码，finally 在两种结果下均关闭 refresher-triggered。
- 增加“订单”自定义导航，按窗口、状态栏和胶囊尺寸计算导航及滚动区域高度，并在 onResize 更新。保留原订单行高、分隔线、左右与上下留白。
- 页面声明 Skyline、glass-easel、自定义导航、disableScroll，关闭页面原生下拉刷新。WebView 回退或页面 renderer 改为 webview 后使用同一模板与事件逻辑。
- app 保留 pages、window、rendererOptions.webview，补充 lazyCodeLoading 和 Skyline 的五项默认行为对齐配置。

验证：Jest 1 套 / 3 项通过（初次加载、追加、滚动、尺寸更新、刷新成功及失败）；对提取的页面脚本和 service.js 执行 ESLint no-unused-vars / no-undef 检查通过。JSON 解析、既有 app 字段保留及 service 字节一致性检查通过。已执行完整 47 条 Skyline 适配矩阵的候选扫描与人工复核，无未解释的 error / warn；默认刷新组件不需要自定义 slot，固定两字导航标题无换行需求。

覆盖 orders 页面、内联页面 JSON、app 配置和 service；无自定义组件子树。app 中保留的 home 页面不在本任务范围。审计与验证脚本、日志、execution.json 位于 ../run-1。

未验证：未运行完整 Mpx 构建或微信开发者工具、未做 WebView/Skyline 真机视觉与手势验收。实际下拉/触底、不同设备胶囊与状态栏、窗口变化仍需设备检查；当前使用 getWindowInfo，旧基础库 WebView 支持须遵循项目基础库最低版本。刷新失败保持原 Promise 错误传播语义，不新增业务错误提示或请求服务。
