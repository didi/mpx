# Web 配置差异

本页仅维护 Web 专属配置及相对基准的差异。插件接入、规则匹配、通用模板与样式配置、运行时初始化及全局字段统一见 [配置基准](../base/config-reference.md)。

应用、页面与组件的 JSON 字段、tabBar、分包与抽象节点见 [JSON 配置参考](./web-json-reference.md)；模板与基础组件约束见 [模板能力参考](./web-template-reference.md)；应用与页面的脚本差异见 [脚本能力参考](./web-script-reference.md)；SSR 生命周期与状态同步见 [SSR 参考](./ssr-reference.md)。

## 目录

- [编译配置](#编译配置)
  - [目标与源码](#目标与源码)
  - [编译期 webConfig](#编译期-webconfig)
- [运行时配置](#运行时配置)
  - [初始化方式](#初始化方式)
  - [Mpx.config](#mpxconfig)
  - [Mpx.config.webConfig](#mpxconfigwebconfig)

## 编译配置

### 目标与源码

输出 Web 时设 `mode: 'web'`、`srcMode: 'wx'`，Web 专属编译选项放在插件的 `webConfig` 中。

### 编译期 webConfig

以下字段配置在 **`MpxWebpackPlugin` 的 `webConfig`** 中：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `el` | `string` | `'#app'` | 客户端挂载选择器；使用 `#id` 形式，并与 HTML 容器保持一致。应用根节点的 id 也由此生成，不应仅因 Vue 支持其他选择器就使用 class 选择器。 |
| `useSSR` | `boolean` | `false` | SSR 首屏可能进入异步路由页面（如异步分包页面）时设为 `true`，让客户端等待路由就绪后再挂载；同步页面无需设置。 |
| `disablePageTransition` | `boolean` | `true` | 默认禁用页面切换动画；需要动画时设为 `false`。 |
| `asyncCommonSubpackage` | `boolean` | `true` | 默认将多个异步 chunk 共享的公共模块抽取到 `async-common/index`；设为 `false` 时改为从所有 chunk 中提取公共模块并归入 app 主入口。插件仅在对应的 `async` / `main` cache group 未配置时添加该规则。 |
| `transRpxFn` | `Function` | 未设置，默认按 `750rpx = 100vw` 换算 | 自定义 `rpx` 转换函数，同时用于编译期样式转换和运行时动态样式转换；函数约束见下文。 |
| `customBuiltInComponents` | `Record<string, string>` | 未设置，使用内建组件 | 页面/组件主模板及 import 引入的子模板均生效，app 入口不使用此配置；`Record<string, string>`，替换或扩展基础标签实现。key 为模板中的微信基础标签名（如 `view`、`text`、`scroll-view`），不使用 `mpx-*`；value 为绝对路径或 npm 包模块路径，不使用 `./`、`../`、`~` 前缀，避免将 `src/...` 误写为包路径。自定义实现负责对齐属性、事件和子节点行为。 |

```js
const path = require('path')

// MpxWebpackPlugin 的 webConfig 配置片段
const webConfig = {
  el: '#app',
  disablePageTransition: true,
  asyncCommonSubpackage: true,
  customBuiltInComponents: {
    view: path.resolve(__dirname, 'src/web/custom-view.mpx')
  }
}
```

`useSSR` 控制客户端等待初始路由就绪后挂载，不是服务端构建开关；SSR 生命周期、首屏数据加载和状态同步仍需按 [SSR 参考](./ssr-reference.md) 处理。

`transRpxFn` 按字符串替换回调接收参数，前两个参数为完整匹配文本与数值部分字符串（如 `'10rpx'`、`'10'`），返回转换后的字符串。请使用自包含的普通函数表达式，不能依赖构建配置中的闭包变量或仅构建环境可用的依赖。单位转换、样式隔离与外部样式类见 [样式能力参考](./web-style-reference.md)。

## 运行时配置

### 初始化方式

初始化顺序与合并方式沿用 [配置基准](../base/config-reference.md#初始化方式)。Web 路由初始化示例：

```js
// src/config.js，由 app.mpx 的 script 引入
import Mpx from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  Mpx.config.webConfig.routeConfig = Object.assign({}, Mpx.config.webConfig.routeConfig, {
    mode: 'history',
    base: '/content/'
  })
}
```

### Mpx.config

共用运行时字段见 [运行时配置基准](../base/config-reference.md#运行时配置)。`useStrictDiff`、`setDataHandler` 和 `forceFlushSync` 在 Web 环境下不生效。

### Mpx.config.webConfig

以下字段均配置在 **运行时 `Mpx.config.webConfig`** 中。该对象初始为 `{}`，表中同时注明消费端的默认行为。

#### 路由与部署

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `routeConfig` | `object` | 未设置，沿用 VueRouter 默认行为 | 配置 Web 路由模式或部署基础路径；`mode` 控制 `hash` / `history`，`base` 匹配页面访问路径。 |

`Mpx.config.webConfig.routeConfig` 中的路由选项传给 VueRouter；通常只调整以下字段，页面路由仍由应用 JSON 注册：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `mode` | `string` | — | 支持 `hash` / `history` / `abstract`。浏览器通常使用前两者；SSR 的路由要求见 [SSR 参考](./ssr-reference.md)。 |
| `base` | `string` | — | 应用访问路径前缀，如 `/content/`；不等同于 webpack 静态资源的 `publicPath`，部署时分别配置。 |
| `fallback` | `boolean` | — | 控制浏览器不支持 history 模式时是否回退到 hash 模式。 |
| `linkActiveClass` / `linkExactActiveClass` | `string` | — | 自定义 VueRouter 链接激活及精确激活时的 CSS 类名。 |
| `parseQuery` | `Function` | — | `(query: string) => object`，将查询字符串同步解析为键值对象；无查询参数时返回 `{}`。 |
| `stringifyQuery` | `Function` | — | `(query: object) => string`，将查询对象同步序列化为 URL 查询部分；Vue Router 3 在路径后直接拼接返回值，有参数时须包含前导 `?`，无参数时返回 `''`。 |
| `scrollBehavior` | `Function` | — | `(to, from, savedPosition) => position \| Promise<position>`；to/from 为 Vue Router 路由对象，savedPosition 为 `{ x: number, y: number }` 或空值。返回坐标 `{ x, y }` 或 `{ selector: string, offset?: { x, y } }` 指定滚动位置，也可返回空值不调整。页面自身的滚动配置仍需遵循 [Web JSON](./web-json-reference.md#页面配置)。 |

使用 `history` 时，服务器需将页面路由请求回退到应用 HTML，确保直接访问和刷新有效。`routeConfig.routes` 会覆盖框架生成的路由列表，通常不应自行设置；默认首页由应用 JSON 的 `entryPagePath` / `pages` 决定。

#### 标题栏与安全区

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `enableTitleBar` | `boolean` | 未设置，按 `false` 处理 | 仅严格设为布尔值 `true` 才启用 Web 内建标题栏；按页面 JSON 渲染，页面配置 `navigationStyle: 'custom'` 时仍会隐藏。 |
| `safeAreaInsetTop` | `number` | 未设置，使用 `24` | 启用内建标题栏后，调整非 iOS 设备顶部安全区高度，单位为 `px`。接受非负 number，`0` 有效；负数或非数值回退为 `24`。iOS 使用 CSS 环境安全区值，该字段不参与计算。 |

内建标题栏的文本、颜色和隐藏方式见 [页面配置差异](./web-json-reference.md#页面配置)。`setNavigationBarTitle` / `setNavigationBarColor` 可动态更新当前页面的内建标题栏，但不会改变标题栏的启用或隐藏状态。

运行时 `webConfig.disablePageTransition` 虽保留类型声明，但当前不生效；页面切换动画应使用编译期同名配置。

#### WebView

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `webviewConfig.hostWhitelists` | `string[]` | 未设置或空数组时不限制加载和消息来源 | 字符串数组，加载前对 `src` 中的协议、主机及端口组成的来源字符串进行后缀匹配，接收桥接消息时对完整 `event.origin` 做相同校验。加载校验失败时不加载该 URL 并触发 error 事件；消息校验失败时忽略消息。 |
| `webviewConfig.apiImplementations` | `Record<string, (...args: any[]) => any>` | 未设置，无自定义方法 | `Record<string, (...args: any[]) => any>`，处理内置 `postMessage`、`navigateTo`、`navigateBack`、`redirectTo`、`switchTab`、`reLaunch` 以外的桥接调用，不能覆盖这些内置方法。args 为 H5 传入的参数列表；返回可序列化结果或 resolve 为该结果的 Promise，拒绝的 Promise 作为失败回传，未配置对应函数时返回调用失败。 |

Web 的 `web-view` 使用 iframe，白名单不替代浏览器的 iframe 嵌入限制。组件属性和消息用法见 [模板能力参考](./web-template-reference.md)。
