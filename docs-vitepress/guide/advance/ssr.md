# SSR

近些年来，SSR/SSG 由于其良好的首屏展现速度和SEO友好性逐渐成为主流的技术规范，但过去 Mpx 对 SSR 的支持不完善，使用 Mpx 开发的跨端页面一直无法享受到 SSR 带来的性能提升，在 2.9 版本中，我们对 Mpx 输出 web 流程进行了大量适配改造，解决了 SSR 中常见的内存泄漏、跨请求状态污染和数据预请求等问题，完整支持了基于 Vue 和 Pinia 的 SSR 技术方案。

## 配置使用 SSR

在 Vue SSR 项目中，我们一般需要提供 server entry 和 client entry 两个文件作为 webpack 的构建入口，然后通过 webpack 构建出 server bundle 和 client bundle。在用户访问页面时，在服务端使用 server bundle 渲染出 HTML 字符串，作为静态页面发送到客户端，然后在客户端使用 client bundle 通过水合（hydration）对静态页面进行激活，实现可交互效果，下图展示了 Vue SSR 的大致流程。

![Vue SSR流程](https://img-hxy021.didistatic.com/static/webappstatic/do1_kWBH7L8mTgpHeKsBKp85)

Mpx SSR 核心基于 Vue SSR 实现，大致流程思路与 Vue 一致，不过为了保持与小程序代码的兼容性，在配置使用上有一些改动差异，下面我们详细展开介绍：

### 构建server/client bundle

SSR项目中，我们需要分别构建出 server bundle 和 client bundle，对于不同环境的产物构建，我们需要进行不同的配置。
在 Vue 中，我们需要提供 `entry-server.js` 和 `entry-client.js` 两个文件分别作为 server 和 client 的构建入口，与 Vue 不同，在 Mpx 中我们通过编译处理与运行时增强生命周期实现了使用 `app.mpx` 作为统一构建入口，无需区分 server 和 client。

#### 服务端构建配置

服务端配置中除了将 entry 制定为 `app.mpx` 及其它基础配置外，最重要的是安装 `vue-server-renderer` 包中提供的  `server-plugin` 插件，该插件能够构建产出 `vue-ssr-server-bundle.json` 文件供 `renderer` 后续消费。

```js
// webpack.server.config.js
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')

module.exports = merge(baseConfig, {
  // 将 entry 指向项目的 app.mpx 文件
  entry: './app.mpx',
  // ...
  plugins: [
   // 产出 `vue-ssr-server-bundle.json`
    new VueSSRServerPlugin()
  ]
})
```

更加详细的配置说明可参考 [Vue SSR的服务端配置](https://v2.ssr.vuejs.org/guide/build-config.html#server-config)

#### 客户端构建配置

类似服务端构建配置，在客户端构建中我们需要使用 `vue-server-renderer` 包中 `client-plugin` 插件来帮助我们生成客户端环境的资源清单 `vue-ssr-client-manifest.json`，并供 `renderer` 后续消费。

```js
// webpack.client.config.js
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

module.exports = merge(baseConfig, {
  // 将 entry 指向项目的 app.mpx 文件
  entry: './app.mpx',
  // ...
  plugins: [
    // 产出 `vue-ssr-client-manifest.json`。
    new VueSSRClientPlugin()
  ]
})
```

更加详细的配置说明可参考 [Vue SSR的客户端配置](https://v2.ssr.vuejs.org/guide/build-config.html#client-config)

### 准备页面模版

SSR 渲染中，我们创建 `renderer` 需要一个页面模板，简单的示例如下：

```html
<!DOCTYPE html>
<html lang="en">
  <head><title>Hello</title></head>
  <body>
    <!--vue-ssr-outlet-->
  </body>
</html>
```

与 CSR 渲染模版不同，SSR 渲染模版中需要提供一个特殊的 `<!--vue-ssr-outlet-->`注释，标记 SSR 渲染产物的插入位置，如使用 `@mpxjs/cli` 脚手架创建 SSR 项目，该模版已经内置于脚手架中。

### 集成启动 SSR 服务

当我们准备好页面模版和双端构建产物后，我们就可以创建 `renderer` 并与 Node 服务进行集成，启动 SSR 服务，下面以 `express` 为例：

```js
//server.js
const app = require('express')()
const { createBundleRenderer } = require('vue-server-renderer')
// 通过 vue-server-renderer/server-plugin 生成的文件
const serverBundle = require('../dist/server/vue-ssr-server-bundle.json')
// 通过 vue-server-renderer/client-plugin 生成的文件
const clientManifest = require('../dist/client/vue-ssr-client-manifest.json')
 // 页面模版文件
const template = require('fs').readFileSync('../src/index.template.html', 'utf-8')
// 创建 renderer 渲染器
const renderer = createBundleRenderer(serverBundle, {
    runInNewContext: false,
    template,
    clientManifest,
});
// 注册启动 SSR 服务
app.get('*', (req, res) => {
  const context = { url: req.url }
  renderer.renderToString(context, (err, html) => {
  	if (err) {
  	  res.status(500).end('Internal Server Error')
      return
    }
  	res.end(html);
  })
})
app.listen(8080)
```

## SSR 生命周期

在 Mpx 2.9 的版本中，我们提供了三个全新用于 SSR 的生命周期，分别是`onAppInit`、`serverPrefetch` 和 `onSSRAppCreated`，以统一服务端与客户端的构建入口，下面展开介绍：

### onAppInit

> 该生命周期仅可在 App 中使用

在 SSR 中用户每发出一个请求，我们都会为其生成一个新的应用实例，`onAppInit` 生命周期会在应用创建 `new Vue(...)` 前被调用，其执行的返回结果会被合并到创建应用的 `options` 中

很常见的使用场景在于返回新的全局状态管理实例，Mpx 中提供了 `@mpxjs/pinia` 作为全局状态管理工具，我们可以在 `onAppInit` 中返回全新的 `pinia` 示例避免产生跨请求状态污染，示例如下：

```js
// app.mpx
import mpx, { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

createApp({
  // ...
  onAppInit () {
    const pinia = createPinia()
    return {
      pinia
    }
  }
})
```

> SSR 中仅支持使用 `@mpxjs/pinia` 作为状态管理工具，`@mpxjs/store` 暂不支持

### serverPrefetch

> 该生命周期可在 App/Page/Component 中使用，只在服务端渲染时执行

当我们需要在 SSR 使用数据预拉取时，可以使用这个生命周期进行，使用方法与 Vue 一致, 示例如下：

选项式 API：

```js
import { createPage } from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  //...
  serverPrefetch () {
    const query = this.$route.query
    const store = useStore(this.$pinia)
    // return the promise from the action, fetch data and update state
    return store.fetchData(query)
  }
})
```

组合式 API：

```js
import { onServerPrefetch, getCurrentInstance, createPage } from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  setup () {
    const store = userStore()
    onServerPrefetch(() => {
      const query = getCurrentInstance().proxy.$route.query
      // return the promise from the action, fetch data and update state
      return store.fetchData(query)
    })
  }
})
```

关于数据预拉取更详细的说明可以查看[这里](https://v2.ssr.vuejs.org/guide/data.html)。

### onSSRAppCreated

> 该生命周期仅可在 App 中使用，只在服务端渲染时执行

在 Vue SSR 项目中，我们会在 `entry-server.js` 中导出一个工厂函数，在该函数中实现创建应用实例、路由匹配和状态同步等逻辑，并返回应用实例 `app`。

在 Mpx SSR 中，我们将这部分逻辑整合在 `onSSRAppCreated` 中执行，该生命周期执行时用户可以从参数中获取应用实例 `app`、路由实例 `router`、数据管理实例 `pinia` 和 SSR 上下文 `context`，在完成必要的操作后，该生命周期需要返回一个 `resolve(app)` 的 promise。

通常我们会在 `onSSRAppCreated` 中进行路由路径设置和数据预拉取后的状态同步工作，示例如下：

```js
// app.mpx
createApp({
    // ...,
    onSSRAppCreated ({ pinia, router, app, context }) {
      return new Promise((resolve, reject) => {
        // 设置服务端路由路径
        router.push(context.url)
        router.onReady(() => {
          // 应用完成渲染时执行
          context.rendered = () => {
            // 将服务端渲染后得到的 pinia.state 同步到 context.state 中，
            // context.state 会被自动序列化并通过 `window.__INITIAL_STATE__`
            // 注入到 HTML 中，并在客户端运行时再读取同步
            context.state = pinia.state.value
          }
          // 返回应用程序实例
          resolve(app)
        }, reject)
      })
    }
})
```

上述示例代码等价于 Vue 中的 `entry-server.js`

```js
// entry-server.js
import { createApp } from './app'

export default context => {
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()
    router.push(context.url)
    router.onReady(() => {
      // This `rendered` hook is called when the app has finished rendering
      context.rendered = () => {
        // After the app is rendered, our store is now
        // filled with the state from our components.
        // When we attach the state to the context, and the `template` option
        // is used for the renderer, the state will automatically be
        // serialized and injected into the HTML as `window.__INITIAL_STATE__`.
        context.state = store.state
      }
      resolve(app)
    }, reject)
  })
}
```

如用户没有配置 onSSRAppCreated，框架内部会执行兜底逻辑，以保障 SSR 的正常运行。

## 其他注意事项

1. Mpx SSR 渲染支持 i18n 的功能，但为了防止内存泄漏，当前 i18n 实例不会随着每次请求而重新创建，这是由于 Vue2.x 版本插件机制的设计缺陷所造成的，因此在使用 i18n 进行 SSR 时可能会产生跨请求状态污染的问题，这个问题会在未来 Mpx 输出 web 切换为 Vue3 后完全解决。
   
2. 在服务端渲染阶段，对于 global 全局对象访问修改，如__mpx, __mpxRouter, __mpxPinia 都可能导致全局状态污染，所以在服务端渲染阶段请尽量避免进行相关操作；对于存在全局访问修改的方法，如 getApp(), getCurrentPages() 等在服务端渲染中被调用时，会产生相关报错提示。
   
3. 由于服务器无法收到 URL 中的 hash 信息，使用 SSR 时需要通过修改 `mpx.config.webRouteConfig` 将路由模式设置成 `history` 模式。
