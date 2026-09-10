# 交付说明

已创建 `pages/task-board.mpx`，保留 `utilities.css`，更新 `app.json`。原首页 `pages/home` 仍为第一路由，原 window 与 rendererOptions.webview 保留；仅任务看板页面声明 Skyline 渲染，补齐 glass-easel、自定义导航、禁用页面滚动及全局 Skyline 推荐配置。

页面使用 script setup、ref/computed 和显式 defineExpose。包含全部/待办/完成筛选、稳定 id、点击切换状态、暂无任务、下拉恢复初始数据及刷新态结束、触底追加待办。新增 id 单调递增，刷新后不会复用已经追加过的 id。筛选条件在刷新时保留。

自定义导航避开状态栏，内容用纵向 Flex 占据剩余高度，唯一 scroll-view 使用 list 且任务为直接子节点。两种渲染共用滚动事件链路。标题同时保留 truncate 样式与 max-lines/overflow 属性，使用 min-width:0 避免长标题挤压状态。原子类从保留的 utilities.css 显式引入，补充必要的普通类，无额外插件或依赖。

验证：ESLint 通过；2 项 Jest 核心业务测试通过，覆盖筛选、完成切换、空列表、刷新重置与结束态、追加 id 唯一性；JSON 与模板静态类来源检查通过。按 Skyline Skill 完整 47 项矩阵执行聚合扫描并人工复核，未发现未处理 error/warn。审计与测试脚本保存在 run-1。

限制：Jest 使用 ref/computed/nextTick 的轻量测试替身，只验证业务函数，不证明 Mpx 响应式或原生刷新时序。未安装依赖，未进行完整应用编译或微信开发者工具/真机验证；输入未提供首页源文件或构建工程，保留其路由引用。上线前需在 Skyline 与 WebView（将新页面 renderer 临时设为 webview 的测试构建）分别检查长标题、短列表触底、刷新指示器、自定义导航与滚动高度。
