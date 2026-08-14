# Mpx2Web SSR 专项参考

本文档只描述 Mpx 输出 Web 时的 SSR / SEO 相关能力。普通 CSR 页面、组件适配和通用 Mpx 写法不要读取本文件。

## 目录

- [适用场景](#适用场景)
- [构建与路由配置](#构建与路由配置)
- [SSR 生命周期](#ssr-生命周期)
- [数据预取与状态注水](#数据预取与状态注水)
- [注水缓存与请求竞态](#注水缓存与请求竞态)
- [同构请求层边界](#同构请求层边界)
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

SSR 由 Web 输出链路消费 `webConfig` 与路由配置。`webConfig.useSSR` 为真时，客户端等待路由 `onReady` 后再挂载，避免异步组件 hydrate 时机不一致。

配置键、默认值和通用部署含义统一见 [Web JSON 配置参考](./web-json-reference.md#web-运行配置)。SSR 在此基础上额外要求：路由使用 `history`；`routeConfig.base` 与服务端访问路径一致；静态资源 `publicPath` 与 SSR HTML 发布路径一致；存在异步页面、分包或组件时启用 `webConfig.useSSR`。

---

## SSR 生命周期

Web 侧与 SSR 相关的生命周期集中在以下几个：

| 生命周期 | 适用 | 用途 |
| --- | --- | --- |
| `onAppInit` | App | 应用创建前扩展选项，常用于为每次请求创建并返回新的 Pinia 实例。 |
| `serverPrefetch` | App / 页面 / 组件 | 服务端数据预取，返回 Promise 时 SSR 会等待完成。 |
| `onSSRAppCreated` | App | 服务端应用创建后回调，可接管 router push、ready、状态写入等逻辑。 |

服务端会先执行 `App.onAppInit()` 扩展应用选项；存在 `App.onSSRAppCreated` 时由业务接管，否则默认匹配当前路由并在渲染完成后写入 Pinia state。

---

## 数据预取与状态注水

推荐流程：

1. 在 `onAppInit` 中创建每次请求独立的 Pinia 实例并返回，避免服务端请求间状态污染。
2. 在页面或组件 `serverPrefetch` 中拉取首屏数据并写入 store 或组件状态。
3. 使用默认 `onSSRAppCreated` 流程时，运行时会在 `context.rendered` 中把 `pinia.state.value` 写入 `context.state`。
4. 客户端启动时若存在 `window.__INITIAL_STATE__`，运行时会同步回 Pinia state。
5. 客户端复用注水状态前，按[注水缓存与请求竞态](#注水缓存与请求竞态)校验数据身份。

注意：

- `serverPrefetch` 应返回 Promise 或 async 函数，确保服务端等待数据完成。
- 不要把请求级数据写到模块顶层单例对象中。
- 数据请求来源、运行环境与平台保留规则统一见[同构请求层边界](#同构请求层边界)。
- 若自定义 `onSSRAppCreated`，需要自行处理 `router.push(context.url)`、`router.onReady()`、错误回调、状态写入与返回 app。

---

## 注水缓存与请求竞态

SSR 注水数据只能作为“当前业务主键已经完成加载”的缓存，不能只根据数据对象是否非空来复用。需要切换商品、文章等业务实体时，store 应维护语义等价的三类状态：

- 当前数据对应的业务主键。
- 该主键是否已经完成加载。
- 单调递增的请求代际或等价请求身份。

仅当“已完成加载”且业务主键相同时复用注水数据。发起新请求时，在 `await` 前立即更新当前主键、把加载状态设为未完成并推进请求代际；异步结果返回后同时校验主键与请求代际，只允许当前请求写入数据。这样快速发生 A → B → A 切换时，第三次 A 不会误复用第一次 A 而跳过代际推进，B 的晚到结果也不能覆盖当前 A。

下面是状态转换示意，字段名可以按业务调整，但不要省略对应语义：

```js
state: () => ({
  resourceId: '',
  resource: null,
  loaded: false,
  requestVersion: 0
}),
actions: {
  async loadResource (resourceId, requestContext) {
    if (this.loaded && this.resourceId === resourceId) return

    const requestVersion = ++this.requestVersion
    this.resourceId = resourceId
    this.loaded = false
    const resource = await fetchResource(resourceId, requestContext)

    if (requestVersion !== this.requestVersion || this.resourceId !== resourceId) return
    this.resource = resource
    this.loaded = true
  }
}
```

页面自身还可以用页面请求代际阻止旧请求更新选中规格等局部 UI，但不能用页面校验替代 store 的写入保护；否则旧请求仍可能先污染共享状态。

---

## 同构请求层边界

由 `serverPrefetch` 调用的共享数据 service 应返回 Promise，并显式接收当前 SSR 请求上下文或项目注入的同构请求客户端。服务端 origin、鉴权和请求级信息从该上下文或客户端取得；浏览器侧没有 SSR context 时可以使用相对地址。不要在共享数据 service 内读取 `window`、`document`、`navigator` 或 `location` 来判断请求地址，也不要写死 `localhost` 等部署地址。

`typeof window !== 'undefined'` 适合保护 DOM、Observer、存储或 H5 SDK 等纯客户端副作用，不应用来包住页面的通用数据加载，也不应用来决定 SSR 数据 service 的请求来源。页面需要兼容小程序时，`onLoad` 中的商品加载、规格初始化等通用业务链路不能被 `window` 是否存在所限制。

数据调用链应保持请求上下文连续传递：

```js
serverPrefetch () {
  return this.loadResource(this.resourceId, this.$ssrContext)
}

async loadResource (resourceId, requestContext) {
  await useResourceStore(this.$pinia).loadResource(resourceId, requestContext)
}
```

具体请求实现由业务项目的同构请求层决定。

---

## 浏览器对象限制

SSR 服务端阶段没有真实浏览器环境。以下对象或能力不能在模块顶层、`setup` 同步阶段、`serverPrefetch` 或 `onSSRAppCreated` 服务端流程里直接访问：

- `window`、`document`、`navigator`、`location`
- `localStorage`、`sessionStorage`
- DOM 节点、Canvas 上下文、IntersectionObserver
- 依赖浏览器全局对象的第三方 H5 SDK

处理方式：

- 放到客户端生命周期中执行，如 `ready` / `mounted` 后。
- 浏览器环境判断只保护上述客户端能力；数据加载边界见[同构请求层边界](#同构请求层边界)。
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
- [ ] 注水缓存同时记录业务主键与对应加载状态；新请求在 `await` 前使旧缓存失效并推进请求身份，返回后拒绝旧主键或旧代际结果。
- [ ] 同构数据 service 可被 Node 执行并通过 SSR 请求上下文或注入请求层取得服务端信息，没有沿用小程序宿主 API、读取浏览器全局或写死部署地址。
- [ ] `window` 环境判断只包围浏览器专属副作用，没有阻断小程序 `onLoad` 等通用业务加载。
- [ ] 自定义 `onSSRAppCreated` 时保留 router ready、错误处理与状态写入逻辑。
- [ ] 服务端阶段没有访问浏览器对象或 DOM。
- [ ] 使用异步分包 / 异步组件时已配置 `webConfig.useSSR: true`。
- [ ] 客户端 hydrate 前后的首屏结构和状态一致。
