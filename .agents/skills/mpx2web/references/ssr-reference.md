# Mpx2Web SSR 参考

## SSR 适配差异

| 涉及内容 | SSR 差异 | 具体改法 |
| --- | --- | --- |
| 路由 | 服务端收不到 URL 中的 hash。 | 将路由模式设为 `history`，把请求地址传入渲染上下文的 `url`。 |
| 状态管理 | 模块级状态会跨请求共享，`@mpxjs/store` 不支持内建 SSR 状态同步。 | 需要同步首屏状态时将对应状态域迁移为各端共用的 `@mpxjs/pinia`，在 `onAppInit` 中创建实例，页面使用当前应用实例下的 store。 |
| 首屏数据 | 客户端加载的数据无法直接参与服务端首屏渲染。 | 在 `serverPrefetch` 或 `onServerPrefetch` 中调用数据加载逻辑并返回 Promise，等待数据就绪。 |
| 路由与状态同步 | 服务端需等待路由就绪并传出状态，客户端需恢复首屏状态。 | 通常沿用框架默认流程；只有需要自定义时才实现 `onSSRAppCreated`，接管路由就绪、状态写入和应用返回。 |

## SSR 生命周期

### onAppInit

每次 SSR 请求都会创建一个新的应用实例。`onAppInit` 在创建 Vue 应用前执行，它的返回值会合并到应用选项中。

小程序也会调用 `onAppInit`，`@mpxjs/pinia` 可以由小程序和 Web 共用。已有 `@mpxjs/store` 状态域因 SSR 需要迁移时，默认将该状态域整体迁移到 Pinia，并在共享 `app.mpx` 中初始化一次；小程序继续通过原来的 `onLoad` 等业务入口调用同一个 Pinia action。不要为 Web 和小程序各维护一套同义状态、action 和错误处理。

已有 `onAppInit` 时合并其返回值。只有任务明确要求原平台继续使用旧 Store，或迁移所需调用方不在当前范围内时，才把 Pinia 初始化与状态实现限制到 Web 分支。

```js
import { createPinia } from '@mpxjs/pinia'

// appOptions 是项目现有的 createApp 选项
const originalOnAppInit = appOptions.onAppInit
appOptions.onAppInit = function () {
  const originalOptions = originalOnAppInit ? originalOnAppInit.call(this) : {}
  return Object.assign({}, originalOptions, { pinia: createPinia() })
}
```

### serverPrefetch

`serverPrefetch` 可以写在 App、Page 或 Component 中，只在服务端渲染时执行。异步数据加载需要返回 Promise，让服务端等待数据准备完成后再渲染。

选项式 API：

```js
import { createPage } from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  serverPrefetch () {
    const query = this.$route.query
    const store = useStore(this.$pinia)

    return store.fetchData(query)
  }
})
```

组合式 API：

```js
import {
  createPage,
  getCurrentInstance,
  onServerPrefetch
} from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  setup () {
    const instance = getCurrentInstance()
    const store = useStore()

    onServerPrefetch(() => {
      const query = instance.proxy.$route.query
      return store.fetchData(query)
    })
  }
})
```

### onSSRAppCreated

`onSSRAppCreated` 只能写在 App 中，并且只在服务端渲染时执行。

它可以取得当前的 `pinia`、`router`、`app` 和 `context`。完成路由匹配与状态同步后，需要返回一个最终得到 `app` 的 Promise。

```js
import { createApp } from '@mpxjs/core'

createApp({
  onSSRAppCreated ({ pinia, router, app, context }) {
    return new Promise((resolve, reject) => {
      router.push(context.url)

      router.onReady(() => {
        context.rendered = () => {
          context.state = pinia.state.value
        }

        resolve(app)
      }, reject)
    })
  }
})
```

`context.state` 会被序列化到 HTML 的 `window.__INITIAL_STATE__` 中，客户端运行时会读取并同步该状态。

如果没有配置 `onSSRAppCreated`，Mpx 会执行框架内置的兜底逻辑。

## 注意事项

### 浏览器对象

`.web.mpx` 在 SSR 下也会进入服务端构建。若模块在导入时访问 `window`、`document` 等浏览器对象，Web 平台文件本身不能避免服务端报错；只对这类依赖在客户端挂载后动态加载，DOM 初始化也应等节点挂载后执行。未使用 SSR 或依赖在导入时不访问浏览器对象，无需为此改写导入。

### i18n

Mpx SSR 可以使用 i18n，但当前 i18n 实例会在多个 SSR 请求之间复用。不要把当前请求的语言或其他请求级状态写入该实例。如果现有业务依赖修改该实例，需记录这一框架限制。

### 全局对象和全局方法

服务端渲染时不要访问或修改以下全局对象，它们会在请求之间共享状态：

```text
__mpx
__mpxRouter
__mpxPinia
```

在服务端渲染中调用 `getApp()` 或 `getCurrentPages()` 会产生报错提示。
