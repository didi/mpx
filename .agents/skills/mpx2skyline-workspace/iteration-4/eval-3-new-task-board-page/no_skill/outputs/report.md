# 任务看板交付

- `pages/task-board.mpx`：组合式 API + script setup，分类初始化/计数/切换、完成切换、空态、刷新、追加分页、按压及取消反馈。
- `app.json`：保留首页第一项、原 window 与 WebView 设置，追加任务页和 Skyline 默认样式选项。首页继续使用原渲染设置；任务页使用 Skyline/glass-easel、自定义导航和内部滚动。
- 导航地址：`/pages/task-board?category=工作`。非法分类回到全部。
- 失败注入：`/pages/task-board?refreshFail=1`，下一次下拉刷新模拟失败，此后恢复成功。请求延迟 400ms，finally 收尾刷新状态，失败保留原数组并提示。
- 列表区使用纵向 flex 的剩余高度（height:0/min-height:0）；标题和分类位于 scroll-view 外。长标题以 text max-lines 与 CSS 单行省略声明适配两种渲染器。
- 分类按压使用 transform/opacity 150ms transition；touchend/touchcancel 均清空按压态。

## 实际验证

执行 `node ../run-1/verify.cjs`，8 组检查通过，原始记录 `../run-1/test.log`。覆盖参数、筛选、完成切换、空列表、刷新成功/失败/重试、连续分类分页、唯一 key、触摸取消，以及宿主配置保留与样式声明。

测试直接提取交付页面中的脚本并注入 ref/computed/onLoad/wx mock，异步请求使用真实定时器。该验证证明业务函数结果与模板配置声明，不代表 Mpx 编译或微信渲染结果。

未执行 Mpx 编译、仓库 eslint/jest、微信开发者工具与真机验收。输入未包含宿主项目构建入口或首页源文件；未读取额外参考或项目实现。Skyline/WebView 的实际 flex 高度、长标题省略、刷新复位及 CSS transition 动画仍需双渲染器实测。WebView 验收可在测试宿主中将页面 renderer 切为 webview，或使用微信的 Skyline 不可用回退环境；交付页默认启用 Skyline。
