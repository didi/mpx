# 文章应用 SSR 需求

现有微信文章页展示 loading、errorText、article，并支持展开补充说明。请将同一份 Mpx 源码扩展为 Web SSR 应用。

## 状态与交互

- 将文章状态域整体迁移到 @mpxjs/pinia，两端共用同一个 store、状态字段和 loadArticle action，不保留第二套旧 Store。
- 请求文章 a 或 b 时，从当前路由 query.id 读取文章 id，等待数据后再渲染服务端首屏。不同 SSR 请求之间不能共享文章状态。
- 服务端状态应在浏览器接管时恢复；服务端可达的初始化和预取代码不能访问浏览器专用对象。
- 微信 onLoad(query) 继续调用共享 action，保留加载、错误、正文与展开交互。

## 宿主环境

Web 使用 history 路由，部署前缀为 /help-demo/。宿主提供客户端和服务端构建入口、SSR renderer 及包含 <!--vue-ssr-outlet--> 的页面模板，无需另建一套 Vue SSR 工程。

访问 /help-demo/pages/article/index?id=a 或 id=b 时，renderer 收到的 context.url 分别为 /pages/article/index?id=a、/pages/article/index?id=b；客户端从实际访问地址读取同一参数。
