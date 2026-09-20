# Mpx2Web SSR 专项参考

本文档只描述 Mpx 输出 Web 时的 SSR / SEO 相关能力。普通 CSR 页面、组件适配和通用 Mpx 写法不要读取本文件。

## 目录

- [适用场景](#适用场景)
- [构建与路由配置](#构建与路由配置)
- [SSR 生命周期](#ssr-生命周期)
- [旧 Store 的 SSR 迁移](#旧-store-的-ssr-迁移)
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

通用配置见 [Web JSON 配置参考](./web-json-reference.md#web-运行配置)。以下按 Mpx CLI Service 项目说明，其他构建方式沿用项目实际的插件配置入口：

- 应用脚本：`mpx.config.webConfig.routeConfig` 使用 `history`，`base` 匹配页面访问路径。
- `mpx.config.js`：顶层 `publicPath` 指向静态资源发布地址，可使用独立 CDN；不要混入运行时路由配置或无效的顶层 `webConfig` / `output`。
- SSR 异步路由：在 `pluginOptions.mpx.plugin.webConfig` 中启用 `useSSR`，等待范围见[异步分包与 hydrate](#异步分包与-hydrate)。

---

## SSR 生命周期

| 生命周期 | 适用 | 用途 |
| --- | --- | --- |
| `onAppInit` | App | Web 服务端和客户端创建应用前调用，同步合并返回的选项，不等待 Promise；采用 Pinia 时返回 `{ pinia }`。 |
| `serverPrefetch` | App / 页面 / 组件 | 服务端数据预取；异步操作需返回 Promise，或使用 async 并等待完成。同步数据无需包装异步。 |
| `onSSRAppCreated` | App | 服务端应用创建后调用；自定义时接管默认的路由就绪与状态写入流程。 |

采用 `@mpxjs/pinia` 的应用可按以下方式创建请求级实例；这不是所有 SSR 项目必须使用 Pinia 的要求：

```js
import { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

createApp({
  onAppInit () {
    return { pinia: createPinia() }
  }
})
```

`@mpxjs/pinia` 的 Web 实现在服务端要求每次在此钩子中创建实例，浏览器可复用 active Pinia；请求级数据不能放入模块顶层单例。

---

## 旧 Store 的 SSR 迁移

旧 `@mpxjs/store` 的 `createStore`、模块级共享状态或页面临时状态需要参与 SSR 首屏注水时，Mpx 内建状态链使用 `@mpxjs/pinia`，`@mpxjs/store` 不在该链路的支持范围内。采用内建链路时迁移到 Pinia，不同时保留 `$ssrContext.state`、DOM 属性或自定义 `window` 字段组成的第二套注水协议。项目已有明确的自定义 SSR 宿主协议时可以沿用，但需核对完整的序列化与恢复链。

迁移时逐项核对：

1. 应用在 `onAppInit` 中调用 `createPinia()` 并返回 `{ pinia }`，使服务端每个请求取得独立实例；该 Web SSR 入口不需要 `mpx.use(pinia)`。
2. 业务状态和 action 由 `@mpxjs/pinia` 的 `defineStore` 管理，不在模块顶层提前调用 `useXxxStore()`。Options API 的 `serverPrefetch` 使用 `useXxxStore(this.$pinia)` 绑定当前请求实例；setup 内在 setup 上下文中调用 `useXxxStore()`，页面预取、模板和客户端交互复用该应用实例下的 store。
3. `serverPrefetch` 返回或等待写入该 store 的异步 action，模板读取同一 store 状态。
4. 未自定义 `onSSRAppCreated` 时，使用框架默认的服务端状态写入和客户端挂载前恢复，不重复实现 `context.state` 与 `window.__INITIAL_STATE__` 搬运。自定义该钩子时，再完整接管路由就绪、状态序列化和应用返回。
5. 所有消费方迁移完成后，删除旧 `@mpxjs/store` 实例和手工恢复入口，避免保留两套状态源。进行中请求去重和过期响应保护只在实际存在重叠加载或资源切换时处理，具体见下一节。

Pinia 不是所有 SSR 页面的强制依赖；仅有组件局部渲染状态且不需要跨服务端与客户端复用时，无需为了形式引入 store。

---

## 数据预取与状态注水

按上述方式配置 Pinia 后，默认流程为：

1. 默认流程先匹配路由，渲染期间等待页面或组件的 `serverPrefetch` 加载首屏数据并写入 store。
2. 渲染完成后通过 `context.rendered` 将 `pinia.state.value` 写入 `context.state`，未配置 Pinia 时写入空对象。
3. SSR 宿主将状态安全序列化到 HTML；仅赋值 `context.state` 不代表完成注水。
4. 客户端存在 `window.__INITIAL_STATE__` 且配置了 Pinia 时，运行时在挂载前恢复状态；复用规则见[注水缓存与请求竞态](#注水缓存与请求竞态)。

组件局部 `data` 可用于服务端渲染，但不自动注水；不采用默认 Pinia 方案时，自行建立所需状态的序列化与客户端恢复链路。

Web 页面在 `created` 中触发 `onLoad`，服务端也会执行，但 SSR 不会自动等待其异步结果。与 `serverPrefetch` 重叠的加载按下一节去重，或按实际平台划分入口；保留小程序原有加载链。数据请求适配见[同构请求层边界](#同构请求层边界)。

自定义 `onSSRAppCreated` 时，自行处理 `router.push(context.url)`、`router.onReady()`、错误回调、状态写入与返回 app。

---

## 注水缓存与请求竞态

沿用项目已有 store、查询缓存或数据层，按实际场景处理，不强制新增固定字段或状态库：

- 缓存复用：确认资源和加载状态匹配；依赖登录态、租户或其他参数时，一并纳入缓存身份。
- 重叠加载：同一资源可复用请求级或实例级的进行中 Promise；`loaded` 只表示已完成，不能用于合并进行中的请求。Promise 和任务不作为注水数据序列化。
- 乱序写入：在实际写入位置核对代际、任务身份或等价标识，拒绝过期结果；存在共享 store 时，不能只保护页面局部状态。
- A → B → A：命中 A 缓存时仍要使未结束的 B 失效，避免其晚到结果覆盖 A。

静态数据或没有请求竞争的页面不需要照搬竞态控制；异常、取消和重试沿用项目既有约定。

---

## 同构请求层边界

SSR 数据 service 应能在 Node 中执行。需要 origin、鉴权或租户信息时，从宿主已声明的上下文或请求客户端取得；Mpx 不自动提供 `requestContext.req`、`requestClient` 等业务字段。静态数据或不依赖请求身份的 service 无需额外上下文。

已采用 Pinia 且需要传递上下文时，可参考以下调用链；`resourceId` 由业务初始化：

```js
createPage({
  serverPrefetch () {
    return this.loadResource(this.resourceId, this.$ssrContext)
  },
  methods: {
    async loadResource (resourceId, requestContext) {
      await useResourceStore(this.$pinia).loadResource(resourceId, requestContext)
    }
  }
})
```

请求实现沿用项目的平台适配：

- 微信保留小程序请求链；原生 `fetch` 不是三端公共 API。Web/Node 使用它时需确认环境支持，并处理 HTTP 错误、超时及业务错误。
- 浏览器可使用相对地址，Node 按部署配置或已校验的请求客户端解析地址；不读取浏览器对象推导地址，也不写死 `localhost`。
- 服务端不自动继承浏览器 Cookie 或入站认证；按业务协议向可信后端传递最小必要鉴权信息，不无差别转发请求头。
- 不直接用 `Host` 或转发头拼接 origin。多租户确需从请求推导时，由部署层确认代理信任边界，并校验协议、主机与端口。

---

## 浏览器对象限制

SSR 没有真实浏览器环境：模块顶层、`setup` 同步阶段和服务端钩子中，不直接访问 `window`、`document`、`navigator`、`location`、浏览器存储、DOM、Canvas 或 Observer。

这些操作放到客户端 `ready` / `mounted` 后；依赖浏览器全局的 H5 SDK 用动态 `import()` 延迟加载。`typeof window !== 'undefined'` 只保护客户端副作用，不包住通用数据加载，也不用于决定 SSR 请求来源，否则会阻断小程序 `onLoad` 等原有逻辑。

---

## 异步分包与 hydrate

`useSSR` 使客户端通过 `router.onReady(() => app.$mount(el))` 等待路由异步组件就绪；不保证页面内部所有异步子组件已加载，也不代替 SSR 构建与渲染宿主。

两端首屏结构与数据应一致，不能靠忽略 hydration 警告掩盖差异。首屏模板、computed 和初始化 data 不独立生成时间、随机数或按视口决定结构：稳定 ID 从路由、业务数据或注水状态派生；当前时间由服务端注水，或挂载后显示。

浏览器专属节点可初始隐藏，在客户端生命周期中开启：

```html
<view @web wx:if="{{clientMounted}}" class="browser-share">浏览器分享</view>
```

```js
createPage({
  data: {
    clientMounted: false
  },
  onReady () {
    if (__mpx_mode__ === 'web') this.clientMounted = true
  }
})
```

---

## 排查清单

- [ ] 构建与路由：配置入口、页面路径、资源地址及异步路由挂载时机正确。
- [ ] 预取：异步加载被等待、重叠请求已去重，小程序加载链保留。
- [ ] 注水：所需状态已序列化和恢复，自定义应用钩子的路由与状态流程完整。
- [ ] 隔离：请求级状态不串用，缓存身份正确，过期结果不写入。
- [ ] 请求与环境：Node 请求适配、鉴权和 origin 可信，浏览器副作用仅在客户端执行。
- [ ] 接管：首屏结构与数据一致，异步子组件及客户端交互经实际验证。
