# 订单页面 Skyline 适配

已交付 orders.mpx、app.json、service.js 完整业务文件。范围仅订单页面与全局接入配置，无自定义子组件；首页源码不在输入范围，未改造。service.js 与输入逐字节一致。

页面使用自定义“订单”导航，按窗口、状态栏及胶囊尺寸计算导航和滚动区高度。列表采用 type="list" 的 scroll-view，订单项为直接子节点；初次加载保留，下拉刷新、分页和滚动位置更新统一绑定滚动组件事件，微信 WebView 使用同一业务链路。刷新与分页失败保留已有数据，finally 复位加载/刷新状态；加载中忽略重复请求。

页面声明 renderer=skyline、componentFramework=glass-easel、navigationStyle=custom、disableScroll=true，关闭原页面下拉刷新。app.json 保留原首页顺序、window 与 rendererOptions.webview，增加 lazyCodeLoading 和 skyline 五项对齐配置。

验证：Jest 4/4 通过，覆盖初始化、刷新成功与失败、分页成功与失败、重复触底、滚动位置、配置与服务文件保留。提取实际页面脚本执行 Standard ESLint 通过。完整 Skill 审计矩阵 47 项已逐项源码复核，error 残留 0；默认 refresher 不需 slot，固定两字导航标题无多行换行需求，相关 warn 候选按例外记录。

证据位于 ../run-1/：orders.test.js、jest.log、eslint.log、audit.py、audit-scan.log、audit.md、execution.md。

未验证项：微信开发者工具编译、iOS/Android Skyline 真机、微信 WebView 真机均为 not_run。窗口尺寸变化（旋转/分屏）未增加动态重算；当前仅在 onLoad 计算尺寸。业务目标为微信，未验证其他平台。集成时将页面/服务放入原订单页面相对路径并合并 app.json，按实际 Skyline 开量策略校验基础库条件。
