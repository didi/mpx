# SSR
近些年来，SSR/SSG 由于其良好的首屏展现速度和SEO友好性逐渐成为主流的技术规范，各类SSR框架层出不穷，未来进一步提升性能表现，在 SSR 的基础上还演进出 [`islands architecture`](https://docs.astro.build/en/concepts/islands/) 和 [`0 hydration`](https://qwik.builder.io/docs/concepts/resumable/) 等更加精细复杂的理念和架构。

随着近两年团队业务对于前端性能的重视，SSR/SSG 技术也在团队业务中逐步推广落地，并在首屏性能方面取得了显著的收效，但由于过去 Mpx 对 SSR 的支持不完善，使用 Mpx 开发的跨端页面一直无法享受到 SSR 带来的性能提升，在 2.9 版本中，我们对 Mpx 输出 web 流程进行了大量适配改造，解决了 SSR 中常见的内存泄漏、跨请求状态污染和数据预请求等问题，完整支持了基于 Vue 和 Pinia 的 SSR 技术方案。

### 配置使用 SSR
#### 业务使用配置
在 Vue SSR 项目中，我们一般需要提供两个入口文件 entry-client.js, entry-server.js，与服务端集成文件 server.js，以及一个页面模版 index.template.html。
目前 Mpx 支持 SSR，主要是基于 Vue，所以项目的页面模版与服务端集成等构建配置可遵循(Vue SSR的配置规范)[http://www.fenovice.com/doc/vue-ssr/guide/#%E5%AE%89%E8%A3%85]。
在 Vue SSR 项目 entry-client.js 文件中我们会去实现客户端应用挂载，状态同步等逻辑，这部分在 Mpx SSR 中已经集成在框架内部，无需用户再手动处理。
在 Vue SSR 项目 entry-server.js 文件中我们创建和返回应用程序实例之外，还期望设置一些特殊的逻辑，在 2.9 的版本中，我们提供了一个新的钩子 **onSSRAppCreated**，在这个钩子中可以去创建和返回应用程序实例，以及完成服务器端路由匹配，pinia 的状态挂载等。
```js
// app.mpx
createApp({
    ...,
    onSSRAppCreated ({ router, app, context }) {
      return new Promise((resolve, reject) => {
        router.push(context.url)
        router.onReady(() => {
          // 是否匹配到我们要用的组件
          const matchedComponents = router.getMatchedComponents()
          if (!matchedComponents.length) {
            return reject({ code: 404 })
          }
          resolve(app)
        }, reject)
      })
    }
})
```
若用户没有配置 onSSRAppCreated，且识别出当前运行环境非浏览器环境，框架内部会默认创建应用实例并返回

- 路由配置

SSR渲染，需要将我们的路由模式设置成 **history** 模式，具体配置如下
```js
 mpx.config.webRouteConfig = {
    mode: 'history'
  }
```

#### webpack构建配置
对于 Vue SSR 项目，一般我们会使用两个入口文件分别去构建客户端产物以及服务端产物，对于 Mpx SSR 项目，用户直接使用 app.mpx 作为构建入口即可，不需要区分构建模式，但如果你希望不同构建模式下构建产物输出到不同路径等，仍然需要自己修改 webpack 的构建配置，具体的修改直接参考Vue SSR项目的配置即可。
目前 Mpx 提供的插件以及 loader 对于 SSR 渲染不需要添加额外的配置项。
```js
// build/getWebpackConfig.js
module.exports = function getWebpackConfs (options) {
  const { subDir, mode } = options
  const entry = { app: resolveSrc('app.mpx', subDir) }
  // 定义一个环境变量，决定构建模式是客户端还是服务端
  const TARGET_NODE = process.env.WEBPACK_TARGET === 'node'
  let output = {}
  if (mode === 'web') {
    output = {
      path: resolveDist(`${TARGET_NODE ? 'server' : 'client'}/`),
      publicPath: '/',
      libraryTarget: TARGET_NODE ? 'commonjs2' : ''
    }
  }
  // 其他配置

  return {
    entry,
    output,
    // ...
  }
}
```

### 数据预请求与状态管理
#### 服务端数据预请求
Mpx 提供了两个全新的生命周期钩子 **serverPrefetch** **onServerPrefetch**，这两个钩子只会在服务端渲染期间被调用，具体使用方式如下：

组合式 API 中使用
```js
import { onServerPrefetch, getCurrentInstance, createPage } from '@mpxjs/core'

createPage({
  setup () {
    const proxy = getCurrentInstance().proxy
    onServerPrefetch(() => {
      // ...
      proxy.loadData()
    })
  },
  methods: {
    loadData () {
      // 异步获取数据
    }
  }
})
```

选项式 API 中使用
```js
import { createPage } from '@mpxjs/core'

createPage({
  //...
  serverPrefetch () {
   // ...
   this.loadData()
  },
  methods: {
    loadData () {
      // 异步获取数据
    }
  }
})
```
#### 状态管理
Mpx SSR项目中我们推荐使用 @mpxjs/pinia 作为状态管理工具。**为避免出现内存泄漏问题，在 2.9 中 Mpx 提供了新钩子 onAppInit，pinia 的初始化请放在此方法中执行**

```js
createApp({
  // ...
  onAppInit () {
    const pinia = createPinia()
    mpx.use(pinia)
    return {
      pinia
    }
  }
})
```
当我们服务端执行完预请求后，需要用户手动把 store 数据挂载到当前应用的上下文中，挂载后 Vue 会帮我们将 context.state 作为 window.__INITIAL_STATE__ 状态，自动嵌入到最终的 HTML 中，而在客户端，在挂载到应用程序之前，Mpx 会在内部获取到状态并同步到客户端 store 中。

```js
// app.mpx
createApp({
    ...,
    onSSRAppCreated ({ pinia, router, app, context }) {
      return new Promise((resolve, reject) => {
        //..
        router.onReady(() => {
         //..
          // store 数据挂载到当前应用的上下文
          context.rendered = () => {
            context.state = JSON.stringify(pinia.state.value)
          }
          resolve(app)
        }, reject)
      })
    }
})
```

组合式 API onServerPrefetch 中访问 pinia

```js
import { onServerPrefetch, getCurrentInstance, createPage } from '@mpxjs/core'
import userStore from '../store/user'
createPage({
  setup() {
    const proxy = getCurrentInstance().proxy
    const store = userStore()
    onServerPrefetch(() => {
      const query = proxy.$route.query
      store.updateQuery(query)
    })
  }
})
```

选项式 API serverPrefetch 中访问 pinia
```js
import { createPage } from '@mpxjs/core'
import userStore from '../store/user'

createPage({
  //...
  serverPrefetch () {
    const query = this.$route.query
    const store = userStore(this.$pinia)
    store.updateQuery(query)
  }
})
```

### 其他注意事项
1. SSR 项目与 CSR 项目模版不一致，遵循 Vue 的模版规范即可
2. 目前 Mpx SSR 渲染不支持 i18n 的使用，如果希望使用 i18n 相关功能，请使用 CSR 模式
3. 对于 global 全局对象或方法的访问，如__mpx, __mpxRouter, __mpxPinia, getApp(), getCurrentPages() 可能会存在状态污染，所以在服务端渲染阶段请尽量避免使用
