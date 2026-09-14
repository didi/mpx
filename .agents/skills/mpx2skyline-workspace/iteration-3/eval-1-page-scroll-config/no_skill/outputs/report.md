# 订单页 Skyline 适配

已交付完整 `orders.mpx`、`app.json`、保持原内容的 `service.js`。

- `mode="wx" env="skyline"` 条件区块提供 Skyline 模板、样式与页面 JSON；微信构建须设置 Mpx `mode: 'wx', env: 'skyline'`。默认环境保留 WebView 页面结构及页面滚动/下拉/触底事件。
- Skyline 页面使用 `renderer: skyline`、`componentFramework: glass-easel`、自定义导航、禁用页面滚动；导航栏显示“订单”，状态栏和胶囊尺寸由微信 API 获取。
- 页面高度撑满视口，导航固定占位，剩余空间由 `scroll-view` 滚动。绑定 `refresherrefresh`、`scrolltolower`、`scroll`，使用 `e.detail.scrollTop` 展示滚动位置。
- 首次加载请求第 1 页，分页追加成功后更新页码，刷新覆盖列表并重置页码。请求失败展示错误，刷新状态在 `finally` 中恢复；请求锁阻止重叠请求覆盖结果，忙碌期间触发刷新会结束本次刷新态，可在当前请求结束后再次刷新。
- 保留原首页、订单路由、window 标题和 rendererOptions.webview，增加 Skyline 布局默认值及 requiredComponents 懒加载。未把全局 renderer 切换为 Skyline，首页仍使用原渲染配置。

验证结果：Jest 4/4 通过；提取后的业务脚本与 service.js 通过 ESLint recommended 检查。仓库 SFC 解析器确认两种环境正确选择模板和页面 JSON，service 内容逐字一致。验证文件和日志在相邻 `run-1/`。

开发者工具编译预览、Skyline 真机布局/触摸滚动/下拉刷新、导航栏安全区、WebView 真机回归：`not_run`。没有完整工程入口和微信设备环境，自动化验证不代表完整微信构建或真机验收。需在支持 Skyline 与 glass-easel 的基础库版本下验证，尤其是自定义导航与列表剩余高度。
