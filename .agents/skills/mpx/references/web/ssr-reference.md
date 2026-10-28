# Web SSR

用于接入 Mpx2Web SSR、迁移首屏数据加载、排查状态串用与 hydration 问题。

## 目录

- [接入决策与执行顺序](#接入决策与执行顺序)
- [构建与服务接入](#构建与服务接入)
  - [双端构建](#双端构建)
  - [HTML 模板与 Node 服务](#html-模板与-node-服务)
- [路由与客户端挂载](#路由与客户端挂载)
- [请求隔离与状态管理](#请求隔离与状态管理)
  - [onAppInit：同步创建请求级 Pinia](#onappinit同步创建请求级-pinia)
- [首屏预取与客户端加载](#首屏预取与客户端加载)
  - [serverPrefetch：返回真正的异步任务](#serverprefetch返回真正的异步任务)
- [自定义服务端入口逻辑](#自定义服务端入口逻辑)
- [注意事项](#注意事项)
  - [浏览器对象与副作用](#浏览器对象与副作用)
  - [请求能力与错误处理](#请求能力与错误处理)
  - [共享状态与 i18n](#共享状态与-i18n)

## 接入决策与执行顺序

先检查已有构建、Node 服务、`app.mpx`、路由与首屏状态，沿原流程补齐。接入顺序：

1. 同一 `app.mpx` 分别构建 server bundle 与 client manifest，无需两份 Vue 风格 entry。
2. 使用 history 路由，每次以独立 `context.url`（路径 + query）渲染，服务端收不到 hash。
3. 在 `onAppInit` 同步创建请求级 Pinia，用 `serverPrefetch` / `onServerPrefetch` 等待首屏数据；SSR 不支持 `@mpxjs/store` 状态管理，也不等待 `onLoad` 返回的 Promise。
4. 默认入口负责路由就绪与状态输出，renderer 注入 HTML、状态和资源，客户端恢复后 hydration。异步首屏路由配置 `useSSR: true`；通常无需自定义 `onSSRAppCreated`。

## 构建与服务接入

### 双端构建

沿用项目现有 loader、样式与资源链；下表仅列双端差异，基础配置见 [Web 配置](./web-config-reference.md)。

| 配置 | server | client |
| --- | --- | --- |
| `entry` | 同一 `app.mpx` | 同一 `app.mpx` |
| `MpxWebpackPlugin` | `mode: 'web'`，保留实际 `srcMode` | 同左 |
| webpack `target` | `'node'` | `'web'` |
| 输出格式 | `output.libraryTarget: 'commonjs2'` | 浏览器输出 |
| 拆包 | `optimization.splitChunks: false`，关闭独立 `runtimeChunk`，保证 renderer 可加载入口 | 保留客户端拆包 |
| SSR 插件 | `new (require('vue-server-renderer/server-plugin'))()` | `new (require('vue-server-renderer/client-plugin'))()` |
| 产物 | `vue-ssr-server-bundle.json` | `vue-ssr-client-manifest.json` 与 JS/CSS |

- 拆包配置位于 `optimization`。输出目录分开（如 `dist/server`、`dist/client`），bundle / manifest 必须同版。
- `vue-server-renderer` 与 `vue` 版本一致，沿用兼容的 Vue 2 依赖，不直接升级至最新 Vue / Pinia 大版本。
- server 不复用依赖 DOM 的样式注入；核对服务端 loader 与客户端 CSS 产物。配置 `externals` 时保留需编译的 `@mpxjs/*`、`.mpx` / `.vue` 和样式，不一律排除 `node_modules`。
- [Vue 2 SSR 构建指南](https://v2.ssr.vuejs.org/guide/build-config.html)中的旧 webpack API 按工程版本调整。

### HTML 模板与 Node 服务

模板使用 `<!--vue-ssr-outlet-->`，App 已自带默认 `id="app"` 的根节点，不再额外包同名容器。

```html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Mpx SSR</title></head>
<body><!--vue-ssr-outlet--></body></html>
```

以下假设服务位于项目根目录、客户端 `publicPath` 为 `/`。已有服务时合入其页面路由，API / 静态资源先处理，history 深层 URL 进入 SSR：

```js
const express = require('express')
const fs = require('fs')
const path = require('path')
const { createBundleRenderer } = require('vue-server-renderer')

const app = express()
const renderer = createBundleRenderer(require('./dist/server/vue-ssr-server-bundle.json'), {
  runInNewContext: false,
  template: fs.readFileSync(path.join(__dirname, 'src/index.template.html'), 'utf8'),
  clientManifest: require('./dist/client/vue-ssr-client-manifest.json')
})
app.use(express.static(path.join(__dirname, 'dist/client'), { index: false }))
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  renderer.renderToString({ url: req.originalUrl }, (err, html) => {
    if (err) return res.status(err.code === 404 ? 404 : 500).end('Render failed')
    res.type('html').end(html)
  })
})
app.listen(8080)
```

- renderer 可复用，`context` 每请求新建。资源可由 CDN 托管，访问路径须与 manifest 的 `publicPath` 一致。
- 默认入口不主动判断 404；示例仅处理业务显式产生的 404。
- 默认自动注入资源与 `context.state`；`inject: false` 或不用模板时自行补齐。客户端固定读取 `window.__INITIAL_STATE__`，不能单改服务端变量名。

示例中 `createBundleRenderer(bundle, options)` 返回 renderer：bundle 为 server bundle 对象，options 包含 HTML `template: string`、客户端 manifest 及渲染配置。`renderer.renderToString(context, callback): void` 的 context 至少提供 `url: string`，callback 为 `(err, html) => void`，成功时 html 为字符串，失败时先处理 err；省略 callback 的形式返回 `Promise<string>`。不要从回调形式的返回值读取 HTML。

## 路由与客户端挂载

在 `createApp` 前配置 history：

```js
import Mpx from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  Mpx.config.webConfig.routeConfig = { mode: 'history' }
}
```

- 首屏可能命中异步页面 / 分包时，插件 `webConfig.useSSR: true` 使客户端等待 `router.onReady` 后挂载；同步路由不依赖它。它不生成 server bundle，也不负责预取或状态恢复。
- `webConfig.el` 默认 `'#app'`；定制时使用一致的 ID 选择器（如 `'#root'`），对齐两端 App 根节点与挂载目标。
- 子路径部署需分别对齐路由 `base`、代理传入 URL、资源 `publicPath`，三者不是同一配置。

## 请求隔离与状态管理

### onAppInit：同步创建请求级 Pinia

- `onAppInit(): object | void` 仅声明于 App，无参数，每次服务端创建应用及浏览器启动时执行；同步返回值合入 Vue 根选项，不返回时不增加选项。不能异步、不能访问尚未创建的 Vue 实例，也不接收 SSR `context`。
- 已有钩子时合并 `pinia` 并保留其他选项，不重复声明覆盖。小程序也执行该钩子，但不要依赖其消费返回的 Vue 选项。

```js
import { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

createApp({
  onAppInit () {
    return { pinia: createPinia() }
  }
})
```

- **创建与定义分开**：不能在模块顶层 `createPinia()`，非浏览器环境初始化阶段错误会打印 `Pinia must be created in the onAppInit lifecycle!` 并返回空值。顶层可 `defineStore()`，不可 `useStore()` 缓存请求级 store；`state` 用工厂函数返回新对象。
- **显式绑定当前请求**：`setup` 同步阶段可 `useStore()`；选项式钩子、路由守卫、实例外函数传当前 `pinia`（如 `useStore(this.$pinia)`）。在 `await` 前获取并保留局部 store，异步恢复后不依赖全局 active Pinia。
- **迁移范围最小化**：SSR 涉及的旧 Store 状态域迁到 `@mpxjs/pinia`，优先跨端共用 store/action 并保留原调用入口；必须保留旧 Store 时按项目边界隔离，不复制同义逻辑。

## 首屏预取与客户端加载

### serverPrefetch：返回真正的异步任务

`serverPrefetch` 可声明于 App / Page / Component，组合式用 `onServerPrefetch`，均只在服务端执行。钩子及调用的 action 须返回 Promise，等请求完成且状态更新后再 resolve；多任务用 `return Promise.all(...)`。

选项式回调 `serverPrefetch(): Promise<unknown>` 无参数；组合式注册 `onServerPrefetch(callback): void` 的 callback 同样无参数并返回 Promise。SSR 等待该 Promise 完成，不把 resolve 的值当作页面状态或 HTML；应在任务中写入 store / 响应式状态。注册函数没有可等待的返回值，不写 `await onServerPrefetch(...)`。

**`onLoad` 在服务端也执行，但其 Promise 不被等待**（Web 中由 `created` 驱动）。仅把预取加载分支交给服务端钩子，保留客户端 / 小程序加载入口和其他必要同步初始化，避免漏取或重复请求。

```js
import { createPage } from '@mpxjs/core'
import { useDetailStore } from '../stores/detail'

createPage({
  serverPrefetch () {
    return useDetailStore(this.$pinia).fetchData(this.$route.query)
  },
  onLoad (query) {
    // 其他必要的同步初始化放在此判断之前
    if (__mpx_mode__ === 'web' && typeof window === 'undefined') return
    const store = __mpx_mode__ === 'web' ? useDetailStore(this.$pinia) : useDetailStore()
    return store.fetchData(query)
  }
})
```

首屏复用判断统一放在 store；`fetchDetail` 为支持服务端、返回业务数据的项目请求函数：

```js
import { defineStore } from '@mpxjs/pinia'
import { fetchDetail } from '../api/detail'

export const useDetailStore = defineStore('detail', {
  state: () => ({ detail: null, loadedId: null }),
  actions: {
    async fetchData (query) {
      const id = String(query.id || '')
      if (this.loadedId === id) return
      this.detail = await fetchDetail(id)
      this.loadedId = id
    }
  }
})
```

- `loadedId` 随 state 恢复，hydration 的 `onLoad` 复用首屏，后续不同 id 仍请求。实际缓存键覆盖完整请求条件，失败不标记已加载，刷新可主动失效；不用全局 `loaded` 跳过所有路由。
- 组合式在 `setup` 同步阶段获取实例 / store，回调复用局部引用，不在异步回调中再调用 `getCurrentInstance()`。Web 的 `$route` 在其他目标端须隔离。

```js
// Web 页面的 setup 内；getCurrentInstance / onServerPrefetch 从 @mpxjs/core 导入
const instance = getCurrentInstance()
const store = useDetailStore(instance.proxy.$pinia)
onServerPrefetch(() => store.fetchData(instance.proxy.$route.query))
return { store }
```

模板通过 store、计算属性或 `storeToRefs` 消费状态，不写模块变量。预取可修改组件局部数据，但框架只自动传递 **Pinia state**；需 hydration 复用的数据放入 Pinia，或自行实现一致的恢复流程。

## 自定义服务端入口逻辑

通常沿用默认入口；需要额外路由检查或请求上下文处理时才在 App 声明 `onSSRAppCreated({ pinia, router, app, context })`。它仅服务端执行，返回值替代默认入口，必须是最终 resolve 为 `app` 的 Promise。

回调接收一个对象：`app` 为本次请求的 Vue 根实例；`router` 为本次请求的 Vue Router 实例；`pinia` 为 onAppInit 返回的 Pinia，未配置时为空对象，不能直接使用其 state；`context` 是传给 renderer 的请求级对象，含 `url: string`，可写入待序列化的 `state`。`context.rendered = (context) => void` 在渲染完成后接收同一请求上下文，返回值不被消费。`onSSRAppCreated` 应返回 `Promise<Vue>`，不能只返回状态对象。

以下接管路由就绪、最终状态输出，并对未匹配路由返回 404；前提是 `onAppInit` 已返回 Pinia：

```js
onSSRAppCreated ({ pinia, router, app, context }) {
  return new Promise((resolve, reject) => {
    router.push(context.url)
    router.onReady(() => {
      if (!router.getMatchedComponents().length) {
        const error = new Error('Not found')
        error.code = 404
        reject(error)
        return
      }
      context.rendered = () => {
        context.state = pinia.state.value
      }
      resolve(app)
    }, reject)
  })
}
```

- 声明后默认路由匹配与状态写入不再执行。保留 `router.onReady` 失败处理，在 `context.rendered` 读取预取后的最终 state；已有 rendered 逻辑需合并，不能覆盖。
- Node 自定义 context 可在此读取，组件也可用 `this.$ssrContext`。鉴权等请求信息显式传给请求函数，不写共享 HTTP client 默认配置或会注入 HTML 的 Pinia state。

## 注意事项

### 浏览器对象与副作用

- `.web.mpx`、`mode="web"`、`__mpx_mode__ === 'web'` 均包含 SSR；用 `typeof window !== 'undefined'` 等环境判断区分浏览器。
- 仅调用时访问浏览器对象的依赖，保护调用位置；导入时就访问 `window` / `document` 的依赖，须在客户端挂载后动态加载，静态 import 外加判断无效。不要伪造全局 `window`，会使 Mpx 误判启动环境。
- DOM 操作、监听器和定时器放在客户端挂载后，mounted 不用于服务端首屏取数。SSR 不执行常规销毁流程，不能依赖销毁钩子清理服务端长期副作用。

### 请求能力与错误处理

- Web API 可用不代表 Node 可调用：核对请求实现、Node adapter、基地址和本次鉴权；相对 URL、浏览器 Cookie / 本地存储不自动成为服务端上下文。api-proxy 的 Web request 使用 Axios，仍须检查打包后的 adapter。
- 未 Promise 化的 `mpx.request` 返回 `RequestTask`，直接从预取钩子返回不会等待请求；使用 Promise 封装或正确开启 Promise 化。
- 预取失败时由业务决定返回错误状态还是中止渲染，不假设 action 异常自动对应预期 HTTP 状态。

### 共享状态与 i18n

- 服务端通过显式请求上下文与 Pinia 存取状态；`getApp()` / `getCurrentPages()` 会在非浏览器环境打印危险调用错误，不能充当请求级入口。`globalData`、模块对象和单例不会随 Vue 实例创建而自动隔离。
- SSR 支持 i18n，但当前构建复用 `Mpx.i18n`，不按请求重建。不能逐请求修改共享 locale/messages；请求级语言切换须另行处理，不视为框架已提供隔离。
