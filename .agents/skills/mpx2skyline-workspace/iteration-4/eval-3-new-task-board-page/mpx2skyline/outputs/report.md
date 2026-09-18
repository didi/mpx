# 任务看板交付

新增 `pages/task-board.mpx`，更新 `app.json` 注册页面；保留 `pages/home` 为首页，保留原 `window` 和 `rendererOptions.webview`。仅新页面声明 Skyline/glass-easel，不改变首页 renderer。

页面使用 Mpx 组合式 API、script setup 和显式 defineExpose；所有样式为本地语义 class，无原子 CSS 依赖。导航使用状态栏/胶囊尺寸预留顶部空间，返回失败时进入宿主首页。进入地址 `/pages/task-board?category=生活`，非法分类回到全部。

顶部导航、标题数量、分类保持可见，剩余高度由纵向 `scroll-view type="list"` 使用；行直接挂在列表下。窗口高度变更更新布局。标题在 WebView 使用单行 CSS 省略，在 Skyline 同时使用 `max-lines`/`overflow`。

下拉刷新模拟 400ms 异步请求，`/pages/task-board?refreshFail=1` 可注入下一次刷新失败，失败后保留现有列表、显示错误并结束刷新反馈，再次刷新可恢复初始列表。刷新期间忽略重复刷新及触底追加。分页每次新增两条当前分类任务，“全部”新增工作任务；递增键不因刷新回退。分类按下反馈为 0.96 缩放、0.7 透明度、150ms 过渡，touchend/touchcancel 都恢复。

## 验证

- Jest 7/7 通过：参数初始化、筛选计数、完成状态、空数组、刷新成功/失败及重试、重复请求保护、连续分页、刷新后唯一键、触摸释放/取消绑定、尺寸变更、宿主配置和列表结构。
- ESLint 对提取的 setup 脚本执行 `eslint:recommended`，通过。该检查不等于项目完整 Mpx lint。
- 完整 Skyline 审计矩阵 47 项已逐项复核，当前 scope 无未解释 error/warn。覆盖页面全部原生组件和宿主 app.json；宿主首页未提供实现，不在适配覆盖范围。
- 首次 Jest 因 Watchman socket 权限启动失败；关闭 Watchman 后测试通过，保留两次原始日志。
- Mpx 完整编译、微信开发者工具、Skyline/WebView 真机视觉及手势验证均 **not_run**。Mock 仅运行提取的 setup 逻辑，不能证明响应式渲染、真实事件分发、布局或原生刷新动画。

真实设备待验证：Skyline 开量/基础库条件、开发者工具 Skyline 开关、WebView fallback 或将页面 renderer 改为 webview 的测试副本；320px 窄屏长标题省略、顶部胶囊避让、滚动与刷新动画、触底事件及触摸取消。交付未新增 project.config.json，也未修改宿主首页代码。

测试及原始证据位于同级 `../run-1/`。
