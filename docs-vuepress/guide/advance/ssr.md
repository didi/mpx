# SSR
近些年来，SSR/SSG 由于其良好的首屏展现速度和SEO友好性逐渐成为主流的技术规范，但过去 Mpx 对 SSR 的支持不完善，使用 Mpx 开发的跨端页面一直无法享受到 SSR 带来的性能提升，在 2.9 版本中，我们对 Mpx 输出 web 流程进行了大量适配改造，解决了 SSR 中常见的内存泄漏、跨请求状态污染和数据预请求等问题，完整支持了基于 Vue 和 Pinia 的 SSR 技术方案。

### 配置使用 SSR
![Vue ssr流程](http://img-hxy021.didistatic.com/static/webappstatic/do1_kWBH7L8mTgpHeKsBKp85)
<center>Vue SSR 流程图</center>


在 Vue SSR 项目中，我们一般需要提供 server entry 和 client entry 两个文件作为 webpack 的构建入口，然后通过 webpack 构建出 server-bundle 和 client bundle。在用户访问页面时，在服务端将组件渲染成 HTML 字符串，然后向客户端发送静态标签，最后在客户端“激活”这些静态标签，来实现一个可交互的页面。而对于 bundle 的构建，vue 有提供 vue-server-renderer 包，通过包里面的 `server-plugin` 和 `client-plugin` 插件可以去构建不同端的资源。

目前 Mpx 输出 web 支持 SSR，主要是基于 Vue 来实现的，下面我们一起看下 Mpx SSR 项目的配置

#### 构建配置

**构建入口**

在 Vue 项目中，我们需要提供 server entry 和 client entry 两个文件作为 webpack 的构建入口，与 Vue 不同，使用 Mpx SSR 项目构建入口不需要区分构建环境，只需要将 `app.mpx` 作为构建入口即可。

**bundle构建**

SSR项目中，我们需要分别构建出 server bundle 和 client bundle，对于不同环境的产物构建，我们需要进行不同的配置。

- 服务端配置

服务端配置除了 entry，target， output 等基础配置外，我们还需要借助 Vue 提供的 `vue-server-renderer` 包中的  `server-plugin` 插件来帮助我们生成服务端环境的构建清单和模块信息 vue-ssr-server-bundle.json。
```js
// webpack.server.config.js
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.config.js')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const { resolveSrc } = require('./utils')

module.exports = merge(baseConfig, {
  // 将 entry 指向应用程序的 app.mpx 文件
  entry: resolveSrc('app.mpx'),

  // 这允许 webpack 以 Node 适用方式(Node-appropriate fashion)处理动态导入(dynamic import)，
  // 并且还会在编译 Vue 组件时，
  // 告知 `vue-loader` 输送面向服务器代码(server-oriented code)。
  target: 'node',

  devtool: 'source-map',

  // 告知 server bundle 使用 Node 风格导出模块(Node-style exports)
  output: {
    libraryTarget: 'commonjs2'
  },

  // ...其他配置

  // 这是将服务器的整个输出
  // 构建为单个 JSON 文件的插件。
  // 默认文件名为 `vue-ssr-server-bundle.json`
  plugins: [
    new VueSSRServerPlugin()
  ]
})
```
注意: 除入口文件配置不同外，其他的配置均可参考 [Vue SSR的服务端配置](http://www.fenovice.com/doc/vue-ssr/guide/build-config.html#%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%85%8D%E7%BD%AE-server-config)

- 客户端配置

客户端配置中除了 entry，plugin 等基础配置外，我们还需要借助 Vue 提供的 `vue-server-renderer` 包中 `client-plugin` 插件来帮助我们生成客户端环境的资源清单 vue-ssr-client-manifest.json。

```js
// webpack.client.config.js

const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.config.js')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { resolveSrc } = require('./utils')

module.exports = merge(baseConfig, {
  // 将 entry 指向应用程序的 app.mpx 文件
  entry: resolveSrc('app.mpx'),

  // ...其他配置

  plugins: [
    // ...
    new HtmlWebpackPlugin({
                favicon: resolveSrc('favicon.ico'),
                filename: 'index.template.html',
                template: resolveSrc('index.template.html'),
                inject: true
    }),

    // 此插件在输出目录中，生成 `vue-ssr-client-manifest.json`。
    new VueSSRClientPlugin()
  ]
})
```
注意: 除入口文件配置不同外，其他的配置均可参考 [Vue SSR的客户端配置](http://www.fenovice.com/doc/vue-ssr/guide/build-config.html#%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%85%8D%E7%BD%AE-server-config)

#### 页面模版

在使用 SSR 模式渲染时，我们在创建 renderer 时需要一个页面模板。多数时候，我们会将页面模板放在特有的文件中，例如 index.template.html：
```html
<!DOCTYPE html>
<html lang="en">
  <head><title>Hello</title></head>
  <body>
    <!--vue-ssr-outlet-->
  </body>
</html>
```
与 CSR 渲染不同，SSR 渲染需要提供一个特殊的 `<!--vue-ssr-outlet-->`注释，这里是应用程序 HTML 标记注入的地方。

#### 服务器集成

当我们完成页面模版、构建相关配置后， 经过 webpack 构建就可以获取到我们 server bundle 和 client bundle 产物，接下来我们需要与 Node 服务器进行集成，以 `express` 为例：
```js
//server.js

const express = require('express')
const fs = require('fs')
const app = express()

const { createBundleRenderer } = require('vue-server-renderer')

// 通过 vue-server-renderer/server-plugin 生成的文件
const serverBundle = require('../dist/server/vue-ssr-server-bundle.json')

// 通过 vue-server-renderer/client-plugin 生成的文件
const clientManifest = require('../dist/client/vue-ssr-client-manifest.json')

 // 页面模版文件
const template = fs.readFileSync('../src/index.template.html', 'utf-8')

// 生成 renderer 渲染器
const renderer = createBundleRenderer(serverBundle, {
    runInNewContext: false,
    template,
    clientManifest,
});

// 前端请求返回数据
app.get("*", async (req, res) => {
    try {
        const context = { url: req.url }
        const stream = renderer.renderToStream(context);
        let buffer = [];
        stream.on('data', (chunk) => {
            buffer.push(chunk);
        });
        stream.on('end', () => {
            res.end(Buffer.concat(buffer));
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("服务器内部错误");
    }
});

// 服务启动
const port = 8091;
app.listen(port, () => {
    console.log(`server started at localhost:${port}`);
});
```
注意：与服务器的集成，Mpx SSR 与 Vue SSR 的集成配置并无差别，遵循 Vue SSR 的配置规范即可。

以上即可完成一个 Mpx SSR 项目的基本配置。

### 生命周期
在 2.9 的版本中，我们提供了四个新的生命周期，分别是 `onSSRAppCreated`，`onAppInit`，`SERVERPREFETCH`,`onServerPrefetch`，下面我们依次介绍下

- **onSSRAppCreated**

对于 Vue SSR 项目，我们会在 server entry 中去创建、返回应用程序实例、完成路由匹配等，在 client entry 中去实现创建应用、应用挂载，store 状态同步等逻辑。

而对于 Mpx SSR 来说，项目的构建入口只有一个 `app.mpx`，用户无需关心服务端与客户端应用创建，客户端应用挂载的逻辑，这部分已经集成在框架内部，无需用户再手动处理，但如果你想实现 server entry 中的其它逻辑，Mpx 提供了 `onSSRAppCreated` 这个 APP 生命周期，在这个生命周期中 Mpx 会将新建的应用实例，路由信息，上下文等信息暴露给用户，你可以在这里去实现服务端返回应用程序实例、路由匹配等逻辑。

此外如果你需要用到状态管理工具，当服务端预请求完成后，需要在这里将 store 数据挂载到 `context.state`上，挂载后 Vue 会帮我们将 `context.state` 作为 `window.__INITIAL_STATE__` 状态，自动嵌入到最终的 HTML 中，而在客户端，在挂载(mount)应用程序之前，Mpx 会在内部获取到状态并同步 store 数据。

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
          // store 数据挂载到当前应用的上下文
          context.rendered = () => {
            context.state = JSON.stringify(pinia.state.value)
          }
          // 返回应用程序实例
          resolve(app)
        }, reject)
      })
    }
})
```
若用户没有配置 onSSRAppCreated，且识别出当前运行环境非浏览器环境，框架内部会默认创建应用实例并返回。

- onAppInit

随着用户的每一个请求，我们都会新建一个应用实例，而 `onAppInit` 会在应用创建时被调用。

如果你的 SSR 项目需要状态管理工具，我们推荐使用 `@mpxjs/pinia` 作为状态管理工具。**为避免出现内存泄漏问题，pinia 的初始化请放在此 APP 生命周期中执行**。

```js
// app.mpx

import mpx, { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

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
- SERVERPREFETCH

选项式 API 中提供的新生命周期，在这个生命周期中可以实现服务端数据预取，具体使用方式如下：


```js
import { createPage, SERVERPREFETCH } from '@mpxjs/core'
import { fetchUserRepositories } from '@/api/repositories'
import userStore from '../store/user'

createPage({
  //...
  async [SERVERPREFETCH] () {
    const query = this.$route.query
    const store = userStore(this.$pinia)
    store.updateQuery(query)
    await fetchUserRepositories()
  }
})
```

- onServerPrefetch

组合式 API 中提供的新生命周期，在这个生命周期中可以实现服务端数据预取，具体使用方式如下：

```js
import { onServerPrefetch, getCurrentInstance, createPage } from '@mpxjs/core'
import { fetchUserRepositories } from '@/api/repositories'
import userStore from '../store/user'

createPage({
  setup () {
    const proxy = getCurrentInstance().proxy
    const store = userStore()

    onServerPrefetch(async() => {
      const query = proxy.$route.query
      store.updateQuery(query)
      await fetchUserRepositories()
    })
  }
})
```

### 其他注意事项
1. SSR 项目与 CSR 项目模版不一致。CSR 渲染我们需要在项目模版中提供一个`id="app"`的节点作为 Vue 应用的挂载点，挂载后的节点会替换原先的挂载点，而 SSR 渲染，我们不再需要在项目模版上添加 `id=app` 的 DOM 节点，而是需要在项目模版中添加 `<!--vue-ssr-outlet-->` 注释，Vue 会识别到这个注释进行节点插入，所以项目模版的配置需要注意两者的区别。
2. Mpx SSR 渲染目前支持 i18n 的功能，但 i18n 不会随着每次请求重新创建新实例，因为如果每次新建一个实例，再通过 Vue.use 去使用可能会造成内存泄漏，所以 i18n 保持单例状态，同时这也意味着如果用户有动态设置语言参数的场景，可能会产生状态污染。
3. 在服务端渲染阶段，对于 global 全局对象访问，如__mpx, __mpxRouter, __mpxPinia 可能会存在状态污染，所以在服务端渲染阶段请尽量避免使用。对于 global 全局方法的访问，如 getApp(), getCurrentPages() 在非浏览器环境被调用时，Mpx 会触发 error 报错并阻塞该方法的运行。
4. SSR 渲染由于服务器无法识别 URL 中的 hash 部分，所以需要通过修改 `mpx.config.webRouteConfig` 将我们的路由模式设置成 `history` 模式
