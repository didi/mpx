# Mpx2Web SSR 专项参考

本文档只描述 Mpx 输出 Web 时的 SSR / SEO 相关能力。普通 CSR 页面、组件适配和通用 Mpx 写法不要读取本文件。

## 目录

- [适用场景](#适用场景)
- [构建与路由配置](#构建与路由配置)
- [SSR 生命周期](#ssr-生命周期)
- [数据预取与状态注水](#数据预取与状态注水)
- [浏览器对象限制](#浏览器对象限制)
- [异步分包与 hydrate](#异步分包与-hydrate)
- [排查清单](#排查清单)

---

## 适用场景

以下情况再考虑 SSR：

- 页面需要搜索引擎抓取首屏内容或分享卡片内容。
- 首屏渲染性能需要服务端提前输出 HTML。
- Web 路由首访需要服务端根据 URL 匹配页面并预取数据。
- 使用异步页面、异步组件或分包，并需要 SSR hydrate 正确衔接。

纯客户端交互页、登录后页面、强依赖浏览器能力的页面通常不适合优先 SSR。

---

## 构建与路由配置

SSR 由 Web 输出链路消费 `webConfig` 与路由配置。源码中 `packages/webpack-plugin/lib/web/processMainScript.js` 会把 `webConfig.el` 与 `webConfig.useSSR` 传入运行时；`packages/webpack-plugin/lib/runtime/optionProcessor.js` 在 `useSSR` 为真时等待路由 `onReady` 后再挂载，避免异步组件 hydrate 时机不一致。

常见配置点：

| 配置 | 说明 |
| --- | --- |
| `mpx.config.webConfig.routeConfig` | 推荐的 Web 路由配置入口，内容透传给 Web 路由实例。 |
| `mpx.config.webRouteConfig` | 旧入口，仍兼容但不推荐新增使用。 |
| `routeConfig.mode` | SSR 应使用 `history`，便于服务端按 URL 匹配路由。 |
| `routeConfig.base` | 非根路径部署时配置基础路径，需与服务端访问路径一致。 |
| `webConfig.el` | 客户端挂载节点，默认 `#app`。 |
| `webConfig.useSSR` | SSR 且使用异步分包 / 异步组件时设为 `true`，客户端会等路由 ready 后挂载。 |
| `output.publicPath` | 静态资源加载路径，需与 SSR HTML 中资源发布路径一致。 |

---

## SSR 生命周期

Web 侧与 SSR 相关的生命周期集中在以下几个：

| 生命周期 | 适用 | 用途 |
| --- | --- | --- |
| `onAppInit` | App | 应用创建前扩展选项，常用于为每次请求创建并返回新的 Pinia 实例。 |
| `serverPrefetch` | App / 页面 / 组件 | 服务端数据预取，返回 Promise 时 SSR 会等待完成。 |
| `onSSRAppCreated` | App | 服务端应用创建后回调，可接管 router push、ready、状态写入等逻辑。 |

源码口径：

- `packages/core/src/platform/patch/lifecycle/index.web.js` 将 `serverPrefetch`、`onSSRAppCreated`、`onAppInit` 纳入 Web 生命周期。
- `packages/core/src/platform/patch/getDefaultOptions.web.js` 会把组件的 `serverPrefetch` 转发到 Mpx 生命周期代理。
- `packages/webpack-plugin/lib/runtime/optionProcessor.js` 会先执行 `App.onAppInit()` 扩展应用选项；服务端若存在 `App.onSSRAppCreated` 则交给用户处理，否则默认执行 `router.push(context.url)`、`router.onReady()`，并在 `context.rendered` 中写入 Pinia state。

---

## 数据预取与状态注水

推荐流程：

1. 在 `onAppInit` 中创建每次请求独立的 Pinia 实例并返回，避免服务端请求间状态污染。
2. 在页面或组件 `serverPrefetch` 中拉取首屏数据并写入 store 或组件状态。
3. 使用默认 `onSSRAppCreated` 流程时，运行时会在 `context.rendered` 中把 `pinia.state.value` 写入 `context.state`。
4. 客户端启动时若存在 `window.__INITIAL_STATE__`，运行时会同步回 Pinia state。

注意：

- `serverPrefetch` 应返回 Promise 或 async 函数，确保服务端等待数据完成。
- 不要把请求级数据写到模块顶层单例对象中。
- 若自定义 `onSSRAppCreated`，需要自行处理 `router.push(context.url)`、`router.onReady()`、错误回调、状态写入与返回 app。

---

## 浏览器对象限制

SSR 服务端阶段没有真实浏览器环境。以下对象或能力不能在模块顶层、`setup` 同步阶段、`serverPrefetch` 或 `onSSRAppCreated` 服务端流程里直接访问：

- `window`、`document`、`navigator`、`location`
- `localStorage`、`sessionStorage`
- DOM 节点、Canvas 上下文、IntersectionObserver
- 依赖浏览器全局对象的第三方 H5 SDK

处理方式：

- 放到客户端生命周期中执行，如 `ready` / `mounted` 后。
- Web 编译目标不能判断当前是否在服务端；仍需用 `typeof window !== 'undefined'` 保护运行环境。
- 第三方 H5 SDK 用动态 `import()` 延迟到客户端分支加载。

---

## 异步分包与 hydrate

SSR 页面如果使用异步页面、异步组件或 Web 分包，客户端 hydrate 前必须等路由异步组件解析完成。将 `webConfig.useSSR` 设为 `true` 后，Web 运行时会在客户端使用 `router.onReady(() => app.$mount(el))`，避免过早挂载导致 hydrate 内容不一致。

排查 hydrate mismatch 时重点检查：

- 服务端与客户端首屏数据是否一致。
- 是否在渲染过程中使用了时间、随机数、浏览器尺寸等非确定性值。
- 是否有只在客户端可见的 Web-only 节点没有用条件或 mounted 状态隔离。
- `publicPath`、`routeConfig.base` 与服务端 HTML 资源路径是否一致。

---

## 排查清单

- [ ] SSR 页面使用 `history` 路由模式，服务端可按 URL 匹配到同一页面。
- [ ] `routeConfig.base` 与部署路径一致，静态资源 `publicPath` 正确。
- [ ] `onAppInit` 中没有复用跨请求的状态实例。
- [ ] `serverPrefetch` 返回 Promise，数据写入可被服务端序列化。
- [ ] 自定义 `onSSRAppCreated` 时保留 router ready、错误处理与状态写入逻辑。
- [ ] 服务端阶段没有访问浏览器对象或 DOM。
- [ ] 使用异步分包 / 异步组件时已配置 `webConfig.useSSR: true`。
- [ ] 客户端 hydrate 前后的首屏结构和状态一致。
