# 详情页发布

详情页接收参数 title；传入编码值 `%252F`，Mpx 解码结果应为字面字符串 `%2F`。旧 onLoad(rawQuery) 内连续 decodeURIComponent 两次，导致变成 `/`。显示这个标题并用它更新页面标题。

Web 部署在 /catalog/，静态资源在 https://cdn.example.test/assets/。要求 history 路由可直达 `/catalog/detail?id=42` 并刷新；页面已有生成路由，不允许覆盖成一份手写 routes。当前错误地把 entryPagePath 写成 /catalog/，插件 webConfig.routeConfig={mode:'history',base:'/catalog/'}，运行时什么都没做。

Web 业务希望显示框架内建标题栏，当前只有页面 navigationStyle:'default' 和 setNavigationBarTitle 调用。微信 Skyline 使用已经实现的自定义导航组件（本题只保留它）；RN/支付宝沿用各自现有导航。不要把 Skyline 页面配置套到 Web。

App 有普通分包 packageDetail，包含详情页与图表组件。旧配置将该分包 independent:true 且希望 RN/Web 也能脱离主包启动。产品允许 RN/Web 改为普通异步分包，但保留微信/支付宝实际可用的原配置能力，不能宣称全端独立启动。

RN 宿主明确提供 `loadBundle(name): Promise<void>`（下载并执行）和 `downloadBundle(name): Promise<void>`（只下载不执行）。需连上 Mpx 的分包与 preloadRule 流程；不得用空 Promise 伪装实现。已有 preloadRule 在首页预下载 packageDetail；Web 不强求同一预下载能力，只说明实际效果并正常导航。

输出包含宿主接口 stub 及可替换调用点，部署说明写入 verification.md。此处只处理路由/分包，不添加 SSR。
