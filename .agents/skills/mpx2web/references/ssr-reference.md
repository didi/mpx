# Mpx2Web SSR 参考

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
- [验收与排查](#验收与排查)

## 接入决策与执行顺序

先检查项目已有的 SSR 构建、Node 服务、`app.mpx` 初始化、路由配置与首屏状态域。已有脚手架配置时在原流程上补齐，避免重复创建 renderer、应用或状态实例。

| 涉及内容 | 必须明确的行为 | 实施方式 |
| --- | --- | --- |
| 双端入口 | server/client 都以同一个 `app.mpx` 为入口。 | 由 Mpx 生成服务端工厂和客户端启动逻辑，无需另写 Vue 风格的两份 entry。 |
| SSR 构建 | `mode: 'web'` 仍然用于两端构建，`useSSR` 不是服务端构建开关。 | 生成 server bundle 和 client manifest，由 Node renderer 消费。 |
| 路由 | 服务端收不到 URL hash。 | 使用 `history`，每次渲染传入包含路径与 query 的 `context.url`。 |
| 全局首屏状态 | SSR 支持 `@mpxjs/pinia`，不支持 `@mpxjs/store` 的 SSR 状态管理。 | 在 `onAppInit` 中为每次服务端请求创建并返回 Pinia。 |
| 异步数据 | `onLoad` 的 Promise 不会被 SSR 等待。 | 用 `serverPrefetch` / `onServerPrefetch` 返回预取 Promise，保留客户端加载入口。 |
| 路由就绪与状态输出 | 框架默认已处理。 | 通常不写 `onSSRAppCreated`；自定义时须承接完整职责。 |

默认流程：

1. Node 为本次请求新建 `context`，调用 `renderer.renderToString(context)`。
2. server bundle 的工厂创建本次请求的 router，执行 App 的 `onAppInit()`，合并其返回选项，再创建 Vue 根实例。
3. 框架设置 `router.push(context.url)`，等待路由就绪，注册 `context.rendered` 并返回应用实例。
4. renderer 渲染应用，等待 `serverPrefetch` 返回的 Promise；渲染完成后将 `pinia.state.value` 写入 `context.state`。
5. renderer 配合 HTML 模板注入首屏 HTML、初始状态和客户端资源。
6. 浏览器创建应用与 Pinia，先用 `window.__INITIAL_STATE__` 恢复 Pinia，再挂载并执行 hydration；配置 `useSSR: true` 时会先等待路由就绪。

## 构建与服务接入

### 双端构建

基于项目现有 Mpx2Web loader、样式与资源处理链配置，下面是需要核对的差异，不是可独立运行的完整 webpack 配置。普通 Web 配置入口见 [Web 配置参考](./web-config-reference.md)。

| 配置 | server | client |
| --- | --- | --- |
| `entry` | 项目的 `app.mpx` | 同一个 `app.mpx` |
| `MpxWebpackPlugin` | `mode: 'web'`，保留项目实际 `srcMode` | 同左 |
| webpack `target` | `'node'` | `'web'` |
| 输出格式 | `output.libraryTarget: 'commonjs2'` | 沿用浏览器输出 |
| 拆包 | `optimization.splitChunks: false`，关闭独立 `runtimeChunk`，保证服务端入口可由 renderer 加载 | 沿用客户端资源拆包 |
| SSR 插件 | `new (require('vue-server-renderer/server-plugin'))()` | `new (require('vue-server-renderer/client-plugin'))()` |
| 产物 | `vue-ssr-server-bundle.json` | `vue-ssr-client-manifest.json` 及 JS/CSS 等资源 |

- 两端输出目录分开，例如 `dist/server`、`dist/client`，避免相互覆盖；bundle 与 manifest 必须来自同一版应用。
- `vue-server-renderer` 与 `vue` 使用相同版本；沿用项目兼容的 Vue 2 构建依赖，不直接安装最新 Vue/Pinia 大版本。
- server 不能直接复用依赖 DOM 的样式注入流程。检查项目的服务端样式 loader 与客户端 CSS 产物配置。
- 配置 `externals` 时，保留需要 Mpx resolver、loader 或编译常量处理的模块在 webpack 内，包括相关 `@mpxjs/*` 源码、`.mpx`/`.vue` 和样式资源；不要无差别排除整个 `node_modules`。
- 通用构建细节可查 [Vue 2 SSR 构建指南](https://v2.ssr.vuejs.org/guide/build-config.html)，其中旧 webpack API 应按项目版本调整。

### HTML 模板与 Node 服务

SSR 模板使用占位注释，Mpx 编译出的 App 自带挂载根节点，默认是 `id="app"`。不要再用 `<div id="app">` 包住占位符，造成同名根节点嵌套。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head><meta charset="UTF-8"><title>Mpx SSR</title></head>
  <body><!--vue-ssr-outlet--></body>
</html>
```

下面假设 `server.js` 位于项目根目录，客户端 `output.publicPath` 为 `/`，模板存于 `src/index.template.html`。已有服务时将渲染处理合并到其页面路由中：

```js
const express = require('express')
const fs = require('fs')
const path = require('path')
const { createBundleRenderer } = require('vue-server-renderer')

const app = express()
const renderer = createBundleRenderer(
  require('./dist/server/vue-ssr-server-bundle.json'),
  {
    runInNewContext: false,
    template: fs.readFileSync(path.join(__dirname, 'src/index.template.html'), 'utf8'),
    clientManifest: require('./dist/client/vue-ssr-client-manifest.json')
  }
)

// API 路由、静态资源先处理；实际部署也可由 CDN 托管客户端资源。
app.use(express.static(path.join(__dirname, 'dist/client'), { index: false }))
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  const context = { url: req.originalUrl }
  renderer.renderToString(context, (err, html) => {
    if (err) {
      res.status(err.code === 404 ? 404 : 500).end('Render failed')
      return
    }
    res.type('html').end(html)
  })
})
app.listen(8080)
```

renderer 可复用，`context` 必须每次新建。静态资源的访问路径要与 manifest 的 `publicPath` 一致；history 深层页面 URL 必须进入 SSR 处理。默认入口不主动判定 404，上例仅处理业务显式产生的 404 错误。

默认由 renderer 自动注入资源与 `context.state`，无需手写状态脚本。若项目选择 `inject: false` 或不使用模板，则要自行补齐状态及资源注入；Mpx 客户端固定读取 `window.__INITIAL_STATE__`，不能只改服务端状态变量名。

## 路由与客户端挂载

在调用 `createApp` 前，将 Web 路由模式设置为 `history`：

```js
import Mpx from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  Mpx.config.webConfig.routeConfig = { mode: 'history' }
}
```

SSR 首屏可能命中异步页面或异步分包时，在构建插件的 `webConfig` 中设置 `useSSR: true`，让客户端等待 `router.onReady` 再挂载。同步路由无需依赖此选项；它不负责生成 server bundle、开启预取或恢复状态。

`webConfig.el` 默认是 `'#app'`；如需定制，使用一致的 ID 选择器（例如 `'#root'`），让两端编译出的 App 根节点与客户端挂载目标一致。子路径部署还需对齐路由 `base`、反向代理传入的 URL 和静态资源 `publicPath`，它们不是同一个配置项。

## 请求隔离与状态管理

### onAppInit：同步创建请求级 Pinia

`onAppInit` 仅在 App 中声明，在 Web 服务端每次创建应用时执行，浏览器启动也会执行。返回值同步合并到 Vue 根实例选项，不能写成异步函数，也不能在这里访问尚未创建的 Vue 实例；此钩子没有 SSR `context` 参数。

```js
// app.mpx 的 script
import { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

createApp({
  onAppInit () {
    return { pinia: createPinia() }
  }
})
```

已有 `onAppInit` 时，在其返回对象中合并 `pinia` 并保留原有选项，不要再声明一个同名钩子覆盖它。小程序也执行 `onAppInit`；共享 `app.mpx` 中可以共用这个初始化位置，但不要依赖小程序消费其返回的 Vue 选项。

- 不要在模块顶层执行 `createPinia()`。`@mpxjs/pinia` 的 Web 实现在非浏览器环境检查初始化阶段，阶段错误时会打印 `Pinia must be created in the onAppInit lifecycle!` 并返回空值。
- 模块顶层可以 `defineStore()` 导出 store 定义，不能在模块顶层 `useStore()` 缓存请求级 store；`state` 使用工厂函数返回新对象。
- `setup` 同步阶段可 `useStore()`；选项式钩子、路由守卫或实例外业务函数应显式传入当前请求的 `pinia`，例如 `useStore(this.$pinia)` 或 `useStore(pinia)`。在 `await` 前取得 store 并保留局部引用，避免异步恢复后依赖全局 active Pinia。
- SSR 所需的旧 Store 状态域应迁移到 `@mpxjs/pinia`，优先让小程序与 Web 共用 store/action；保留原平台的调用入口，不为两端复制同义状态逻辑。仅迁移任务涉及的状态域；若原平台必须保留旧 Store，则按项目边界隔离。

## 首屏预取与客户端加载

### serverPrefetch：返回真正的异步任务

`serverPrefetch` 可声明在 App/Page/Component，`onServerPrefetch` 用于组合式 API；二者仅在服务端渲染时执行。预取函数及其调用的 action 必须返回 Promise，直到请求完成且状态更新后才 resolve。多个预取任务可在一个钩子中 `return Promise.all(...)`。

选项式页面示例，假设 `useDetailStore` 已实现下面约定的 `fetchData(query)`：

```js
import { createPage } from '@mpxjs/core'
import { useDetailStore } from '../stores/detail'

createPage({
  serverPrefetch () {
    return useDetailStore(this.$pinia).fetchData(this.$route.query)
  },
  onLoad (query) {
    // Web 的服务端首屏请求交给 serverPrefetch。
    if (__mpx_mode__ === 'web' && typeof window === 'undefined') return
    const store = __mpx_mode__ === 'web'
      ? useDetailStore(this.$pinia)
      : useDetailStore()
    return store.fetchData(query)
  }
})
```

这里的关键是：**Mpx Web 页面的 `onLoad` 由 `created` 驱动，服务端也会执行，但 renderer 不会等待它的异步返回值。** 只在 `onLoad` 加请求无法保证 SSR 首屏数据；同时在两个入口无条件请求又会重复加载。仅将需要预取的加载分支移交给服务端钩子，不要把 `onLoad` 中其他必要的同步初始化一起删掉。

store 中统一实现首屏复用判断；以下示例针对按 `id` 查询的详情页，`fetchDetail` 为项目已有的请求函数，须返回解析后的业务数据并支持服务端运行：

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

`loadedId` 随 Pinia state 一起传到客户端，hydrate 时的 `onLoad` 可复用首屏结果；客户端后续进入不同 `id` 时仍会请求。实际业务应按完整请求条件设计缓存键和失效规则，失败时不要标记已加载，需要刷新时允许主动失效。不能用一个全局 `loaded` 标记跳过所有后续路由的数据请求。

组合式 API 可用下面的服务端钩子替换选项式预取，并按同样原则保留客户端/小程序加载入口。此片段用于 Web 页面脚本，其他平台访问 `$route` 前需通过条件编译隔离：

```js
import { createPage, getCurrentInstance, onServerPrefetch } from '@mpxjs/core'
import { useDetailStore } from '../stores/detail'

createPage({
  setup () {
    const instance = getCurrentInstance()
    const store = useDetailStore(instance.proxy.$pinia)
    onServerPrefetch(() => store.fetchData(instance.proxy.$route.query))
    return { store }
  }
})
```

在 `setup` 同步阶段取得实例/store，回调中复用；不要等异步回调执行时再调用 `getCurrentInstance()`。页面模板通过 store、计算属性或 `storeToRefs` 消费状态，避免把服务端数据写入模块变量。

预取也可更新组件自身数据，但框架自动传给客户端的只有 **Pinia state**。组件局部数据不会因此自动恢复；需要 hydration 复用的数据应进入 Pinia，或由业务明确实现另一套一致的恢复流程。

## 自定义服务端入口逻辑

`onSSRAppCreated` 仅在 App 声明，只在服务端执行，参数是 `{ pinia, router, app, context }`。它的返回值会直接替代框架默认入口结果，必须返回最终 resolve 为 `app` 的 Promise。只有需要额外路由检查、请求上下文处理等逻辑时才配置。

下面在默认流程基础上增加“无匹配路由返回 404”；前提是 `onAppInit` 已创建并返回 Pinia。将此方法加入现有 `createApp` 选项：

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

实现该钩子后，框架不会再帮你执行默认路由匹配和状态写入。必须保留 `router.onReady` 的失败处理，并在渲染结束的 `context.rendered` 中读取最终 state；在预取前提前输出状态不能保证包含页面数据。项目已有 `context.rendered` 逻辑时合并执行，避免覆盖。

Node 传给 `renderToString` 的自定义 context 字段可在此钩子读取，组件也可通过 Vue 的 `this.$ssrContext` 访问服务端上下文。需要鉴权头等请求信息时显式传给请求函数，不把它们写入共享的 HTTP client 默认配置或会注入 HTML 的 Pinia state。

## 注意事项

### 浏览器对象与副作用

`.web.mpx`、`mode="web"` 和 `__mpx_mode__ === 'web'` 同时包含浏览器与 SSR 服务端，不能用来区分两者。服务端与浏览器分支可用 `typeof window !== 'undefined'` 等环境判断。

- 依赖只在调用时访问浏览器对象：保护调用位置，DOM 操作放到客户端挂载后。
- 依赖在导入时访问 `window` / `document`：顶层静态 import 外面增加判断无效，应在客户端挂载后动态加载该依赖。
- 不要通过伪造全局 `window` 绕过问题；Mpx 用它判断运行环境，会因此走错启动分支。
- `mounted`/挂载后的钩子不参与服务端首屏数据准备。浏览器监听器和定时器在客户端挂载后创建；SSR 不执行常规销毁流程，不要依赖销毁钩子清理服务端创建的长期副作用。

### 请求能力与错误处理

Web API 可用不等于在 Node 中可直接调用。检查实际请求实现、Node adapter、服务端接口基地址和本次请求所需的鉴权信息；浏览器相对 URL、Cookie 与本地存储不会自动变成服务器的请求上下文。`@mpxjs/api-proxy` 的 Web request 使用 Axios，也需要核对实际打包后的 adapter。

未启用 Promise 化的 `mpx.request` 返回 `RequestTask`，直接从 `serverPrefetch` 返回它不会等待网络完成。使用项目已有的 Promise 请求封装或正确配置 Promise 化。预取失败后返回错误状态还是中止渲染由业务明确处理，不要假定任何 action 异常都会自动映射成预期 HTTP 状态。

### 共享状态与 i18n

服务端业务不要依赖 `global.__mpx`、`global.__mpxRouter`、`global.__mpxPinia` 存取请求状态；`getApp()` / `getCurrentPages()` 在非浏览器环境会打印危险调用错误，不能用作请求级状态入口。App 的 `globalData`、模块级对象和单例也不会因为每次创建 Vue 实例就自动隔离。

SSR 可以使用 i18n，但当前构建通过 `Mpx.i18n` 复用实例，不会每次请求重新创建。不要直接为每个请求修改共享实例的 locale/messages；依赖请求级语言切换的项目必须明确这一限制，不能宣称框架已提供语言状态隔离。

## 验收与排查

接入后至少核对以下行为；仅看到浏览器最终页面不算验证 SSR：

| 检查 | 通过标准 / 排查方向 |
| --- | --- |
| 双端产物与资源 | bundle、manifest 来自同次构建；HTML 引用的 JS/CSS 可访问。服务端加载失败先查输出格式、拆包和 externals。 |
| 深层 URL 首次访问 | 直接请求含 query 的页面 URL，响应 HTML 已有业务内容；禁用 JS 仍能看到首屏。检查 history、代理路径与 `context.url`。 |
| 状态恢复 | HTML 注入 `window.__INITIAL_STATE__`，客户端首屏使用相同数据，没有因 `onLoad` 再次请求而覆盖预取结果。 |
| 异步页面 hydration | 首次直达异步分包页面，无 hydration mismatch；检查 `useSSR`、挂载根节点与两端渲染结构。 |
| 并发请求隔离 | 用不同 query/用户上下文交错请求，返回各自数据；检查 Pinia 创建位置、模块级 store、请求默认头与 i18n 共享状态。 |
| 客户端后续导航 | 进入另一条数据路由时正常请求；`serverPrefetch` 不会在客户端导航中执行，不能删除客户端加载入口。 |
| 浏览器专属功能 | SSR 不访问 DOM/storage，客户端挂载后仍可正常交互；排查导入时副作用及服务端 `onLoad`。 |
