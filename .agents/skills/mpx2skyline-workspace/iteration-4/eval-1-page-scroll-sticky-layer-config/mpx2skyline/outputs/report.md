# 订单页适配

交付范围为 orders.mpx、app.json、service.js；页面仅使用内建组件。原首页路径、window 与 rendererOptions.webview 保留；service 接口和数据内容不变。首页源码不在输入范围内。

- 自定义导航显示“订单”，窗口高度减去状态栏与44px导航得到外层、主区域有界高度；概览120px在外层中可滚走。订单横向卡片宽120px、高160px，初始四组总高度800px，可在常见手机窗口内产生纵向滚动。
- 外层 nested，主区 custom 关联 nested-scroll-view。Skyline 使用 sticky-section 首子 sticky-header；WebView 保留组内 CSS sticky。横向区显式 list、enable-flex、row 与不收缩订单卡片。
- 主区域独占刷新、触底与位置更新事件；横向 catchscroll 隔断冒泡，外层无业务监听。刷新成功替换第一页，失败保留列表并结束反馈；分页成功后推进页号，加载锁避免重复请求。
- 说明按钮和全屏弹层为同级 fixed，弹层 z-index 3 高于按钮 2。点击关闭，并拦截弹层触摸移动。

验证证据在同级 run-1/：两项 Jest mock 测试通过，覆盖初始4×8、两次分页至12组、唯一ID、失败保留、刷新成功、继续分页、主位置137、横向事件隔离与开关弹层。Mpx 微信模板解析/序列化通过；脚本 ESLint 通过。完整矩阵记录于 audit.json，静态审计无未处理 error；sticky 与层级规则已按分支和结构复核，真实视觉仍待验收。

未执行完整 webpack 应用构建、微信 glass-easel 工具编译或真机验证。嵌套滚动联动、实际刷新手势、两引擎吸顶与层级视觉均为 not_run，mock 与模板编译不能证明这些行为。可将页面 renderer 切至 webview 验证保留分支，再切回 skyline 验证目标。
