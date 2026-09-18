# SSR 宿主约定（仅供静态评审）

- 基础依赖沿用 mpx2web-workspace/package-lock.json，与当前 Vue/renderer 版本匹配。适配所需的额外依赖可随产物补充声明或安装说明；宿主不自动补齐，静态评审不因尚未安装而判源码失败，也不实际安装依赖。
- 构建读取交付的 `mpx.config.js`，应用入口为交付的 `src/app.mpx`；路由页与文章页属于同一应用。
- 宿主具备 client/server 打包目标、VueSSR 的 bundle/manifest 插件及 `<!--vue-ssr-outlet-->` 模板；不会替候选补应用配置、状态注入或业务实现。当前评测不启动构建、HTTP 服务、renderer 或浏览器。
- 对外访问 `/help-demo/pages/article/index?id=a` 或 `/help-demo/pages/article/index?id=b`；宿主去掉部署挂载前缀后，交给 renderer 的 `context.url` 分别为 `/pages/article/index?id=a`、`/pages/article/index?id=b`。客户端仍需按实际访问地址取得相同文章参数。
