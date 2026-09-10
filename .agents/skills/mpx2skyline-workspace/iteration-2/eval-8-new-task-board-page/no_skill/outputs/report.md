# 交付说明

新增 `pages/task-board.mpx`，使用 script setup、ref/computed，实现全部/待办/完成筛选、点击切换完成状态、空列表提示、刷新恢复初始数据、触底追加唯一 id 的待办任务。刷新保留当前筛选条件。

页面使用自定义导航，根据状态栏及胶囊尺寸预留空间；筛选固定，scroll-view 占用剩余高度。标题使用 text 和 truncate，任务分隔线使用实体 view。已有 utilities.css 原样保留并由页面引入。

app.json 保留原首页、window 与 rendererOptions.webview，追加任务看板路由、Skyline rendererOptions 和 requiredComponents 懒加载。Skyline 与 glass-easel 仅在新页面声明。版本范围外由平台回退 WebView。旧首页源文件不在输入中，因此仅保留其注册项，没有伪造首页。

## 实际验证

通过 Node VM 提取脚本并注入 ref/computed/nextTick 和微信 API 的最小替身，执行断言：初始任务、全部/待办/完成筛选、切换完成状态、过滤后空列表、连续追加 id 唯一、刷新重置数据和刷新态、刷新后追加 id 均通过。

通过 JSON 解析及断言检查 app 原配置保留、新路由、页面 JSON、自定义导航、Skyline 配置及空 usingComponents；utilities.css 与输入逐字一致。

此验证是脚本逻辑验证，不等同于 Mpx 编译或真实响应式运行。输入没有 package.json、构建配置、原首页及微信项目配置，未运行 ESLint、Jest、完整编译、开发者工具或真机。需在宿主项目分别以 WebView 和 Skyline 验证：导航安全区、主体滚动、短列表下拉刷新、触底追加、超长标题省略以及空状态。开发者工具可临时切换页面 renderer 为 webview 验证 WebView；交付默认 skyline。
