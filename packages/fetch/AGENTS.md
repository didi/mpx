# @mpxjs/fetch

Mpx 的统一网络请求封装，提供拦截器、取消、并发队列、proxy/validator 等能力，对底层平台 `request` 做适配。

## 入口文件

- [src/index.js](src/index.js)：导出 `install` / `useFetch` 等，挂到 `proxyMpx.xfetch` 与原型 `$xfetch`。
- [src/xfetch.js](src/xfetch.js)：`XFetch` 类（请求主类）。
- [@types/index.d.ts](@types/index.d.ts)：对外类型。

## 核心模块

- [src/xfetch.js](src/xfetch.js)：`XFetch` 实例聚合 interceptors / proxy / validator / queue / cancelToken，提供 `fetch` / `get` / `post` / `addProxy` / `addValidator` 等 API。
- [src/request.js](src/request.js)：底层请求调用，桥接平台 `request` API。
- [src/interceptorManager.js](src/interceptorManager.js)：请求/响应拦截器链。
- [src/queue.js](src/queue.js)：并发队列（在 QQ 小程序等强限流场景下默认开启，`limit/delay` 可配）。
- [src/proxy.js](src/proxy.js)：URL 代理（按规则改写 url / params）。
- [src/validator.js](src/validator.js)：参数校验。
- [src/cancelToken.js](src/cancelToken.js)：取消令牌。
- [src/util.js](src/util.js)：通用工具（参数序列化、深合并等）。

## 典型调用链

1. **安装**：用户 `mpx.use(fetch, options)` → [index.js](src/index.js) `install` → 实例化 `XFetch` → 注册到 `mpx.xfetch` 与 `this.$xfetch`。在 QQ 小程序下默认包一层 `useQueue`。
2. **发请求**：`this.$xfetch.fetch(config)` → 请求拦截器链 → `validator` 校验 → `proxy` 改写 → `queue`（如启用） → [request.js](src/request.js) 调底层 `wx.request` / `fetch` → 响应拦截器链 → 返回。
3. **取消**：调用方持有 `cancelToken.source()`，通过 `cancel()` 触发 → 透传到底层 request 的 abort。

## 注意

- 拦截器、proxy、validator 都是数组式可插拔；新增能力优先以拦截器实现，避免侵入主流程。
- 平台分发依赖文件后缀（如 `request.web.js`），由 webpack-plugin resolver 选择。
