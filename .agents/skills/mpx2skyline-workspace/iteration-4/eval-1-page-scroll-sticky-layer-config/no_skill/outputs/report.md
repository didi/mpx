# 订单页面适配

交付文件为 orders.mpx、app.json、service.js。service.js 与输入保持一致；app.json 保留原首页、window 和 WebView rendererOptions，添加 Skyline 与 glass-easel 配置。订单页关闭页面滚动与原生下拉刷新，使用实际自定义“订单”导航，内容高度按窗口和状态栏计算，概览固定 120px。

Skyline 分支通过页面实例 renderer 识别，外层采用 type="nested" 的 scroll-view，nested-scroll-header 放概览，nested-scroll-body 放独立的主订单 scroll-view；主区域关联 nested-scroll-view，type="list" 下使用 sticky-section / sticky-header。WebView 分支采用嵌套 scroll-view、nested-scroll-enabled 与 CSS sticky。组内订单由独立横向 scroll-view 承载，每项 120px。

主订单区域独占 refresherrefresh、scrolltolower 和 scroll 绑定。成功刷新替换第 1 页，失败保留原数据并关闭反馈；分页成功后追加并推进页码，请求中避免重复分页，刷新可使旧分页响应失效。概览展示主区域 detail.scrollTop。说明弹层放在页面根部，以 fixed 与高于悬浮按钮的 z-index 覆盖整页。

验证：Node mock 与 Jest 通过初次 4 × 8、连续两次分页（12 组 / 96 个唯一订单）、刷新失败保留及恢复、主 scrollTop 更新、弹层状态和静态配置检查。脚本 ESLint 首次有格式问题，修正后通过。证据在同级 run-1/。

编译与真机均 not_run。测试提取业务脚本并直接执行 methods，不代表原生事件派发或真实渲染已验证。Skyline 嵌套滚动、吸顶、横向手势、WebView 不同系统上的嵌套滚动与 CSS sticky、全屏层级和低版本回退需要在微信开发者工具及设备验收。
