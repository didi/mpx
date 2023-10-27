# SSR
近些年来，SSR/SSG 由于其良好的首屏展现速度和SEO友好性逐渐成为主流的技术规范，各类SSR框架层出不穷，未来进一步提升性能表现，在 SSR 的基础上还演进出 [`islands architecture`](https://docs.astro.build/en/concepts/islands/) 和 [`0 hydration`](https://qwik.builder.io/docs/concepts/resumable/) 等更加精细复杂的理念和架构。

随着近两年团队业务对于前端性能的重视，SSR/SSG 技术也在团队业务中逐步推广落地，并在首屏性能方面取得了显著的收效，但由于过去 Mpx 对 SSR 的支持不完善，使用 Mpx 开发的跨端页面一直无法享受到 SSR 带来的性能提升，在 2.9 版本中，我们对 Mpx 输出 web 流程进行了大量适配改造，解决了 SSR 中常见的内存泄漏、跨请求状态污染和数据预请求等问题，完整支持了基于 Vue 和 Pinia 的 SSR 技术方案。

### 配置使用 SSR
#### 业务使用配置
在 Vue SSR 项目中，我们一般需要提供两个入口文件 entry-client.js, entry-server.js，与服务端集成文件 server.js，以及一个页面模版 index.template.html。
目前 Mpx 支持 SSR，主要是基于 Vue，所以项目的页面模版与服务端集成等构建配置可遵循(Vue SSR的配置规范)[http://www.fenovice.com/doc/vue-ssr/guide/#%E5%AE%89%E8%A3%85]。
一般我们会在 Vue SSR 项目 entry-client.js 文件中去实现客户端应用挂载，状态同步等逻辑，这部分在 Mpx SSR 中已经集成在框架内部，无需用户再手动实现
如果你期望在服务端初始化阶段，设置一些逻辑，如服务器端路由逻辑，在 2.9 的版本中，我们提供了一个新的钩子 **onSSRAppCreated**，在这个钩子中可以去实现路由的匹配以及 pinia 的状态同步等
```js
// app.mpx
createApp({
    ...,
    onSSRAppCreated ({ pinia, router, app, context }) {
      return new Promise((resolve, reject) => {
        router.push(context.url)
        router.onReady(() => {
          // 是否匹配到我们要用的组件
          const matchedComponents = router.getMatchedComponents()
          if (!matchedComponents.length) {
            return reject({ code: 404 })
          }
          context.rendered = () => {
            context.state = JSON.stringify(pinia.state.value)
          }
          resolve(app)
        }, reject)
      })
    }
})
```
- 路由配置

SSR渲染，需要将我们的路由模式设置成 **history** 模式，具体配置如下
```js
 mpx.config.webRouteConfig = {
    mode: 'history'
  }
```

#### webpack构建配置
对于 Vue SSR 项目，一般我们会使用两个入口文件分别去构建客户端产物以及服务端产物，对于 Mpx 项目，用户直接使用 app.mpx 作为构建入口即可，不需要区分构建模式，但如果你希望不同构建模式下构建产物输出到不同路径等，仍然需要自己修改 webpack 的构建配置，具体的修改直接参考Vue SSR项目的配置即可。
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
    ...
  }
}
```

### 数据预请求与状态管理

### 其他注意事项
1. SSR 项目与 CSR 项目模版不一致，遵循 Vue 的模版规范即可
2. 2.9 中 Mpx 提供了新钩子 onAppInit，为避免出现内存泄漏问题，pinia 的初始化请放在此方法中执行
3. 目前 Mpx SSR 渲染不支持 i18n 的使用，为避免出现内存泄漏出问题，如果希望使用 i18n 相关功能，请使用 CSR 模式
