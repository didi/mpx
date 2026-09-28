# Mpx 输出 Web SSR 宿主输入

- 同一份 Mpx 源码同时生成 Web 客户端与服务端产物；使用当前工作区锁定的依赖以及交付的 `mpx.config.js`、`src/app.mpx` 和页面文件构建同一应用。
- 宿主提供客户端与服务端构建入口、SSR renderer 和 `<!--vue-ssr-outlet-->` 页面模板。
- 外部访问 `/help-demo/pages/article/index?id=a` 或 `/help-demo/pages/article/index?id=b` 时，renderer 收到的 `context.url` 分别为 `/pages/article/index?id=a`、`/pages/article/index?id=b`；客户端从实际访问地址取得同一参数。
- 当前评测只检查交付源码，不启动构建、HTTP 服务、renderer 或浏览器。
