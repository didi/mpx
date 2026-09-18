# Mpx2Web JSON 配置参考

本文档只记录 Web 输出相关 JSON / `webConfig` 差异。通用 `app.json`、页面 JSON、组件 JSON 字段语义与配置写法，以输入项目已有配置、仓库内 Mpx 文档和对应编译实现为准，不从其它输出端 Skill 继承结论。

## 目录

- [Web 页面配置](#web-页面配置)
- [动态 JSON 配置](#动态-json-配置)
- [Web tabBar](#web-tabbar)
- [Web 分包与异步组件](#web-分包与异步组件)
- [小程序专属声明](#小程序专属声明)
- [Web 运行配置](#web-运行配置)

---

## Web 页面配置

以下页面配置会影响 Web 运行时：

| 字段 | Web 侧行为 |
| --- | --- |
| `navigationBarTitleText` | 页面激活时设置 `document.title`。 |
| `enablePullDownRefresh` | 启用 Web 页面下拉刷新。 |
| `disableScroll` | 禁用页面默认浏览器滚动。 |
| `onReachBottomDistance` | 配置 Web 页面触底触发距离，默认 `50`。 |
| `backgroundColor` | 用于 Web 下拉刷新加载区域背景色。 |
| `backgroundTextStyle` | 用于 Web 下拉刷新加载样式。 |

---

## 动态 JSON 配置

按平台注册 Web 组件时，沿用 Mpx 动态 JSON 机制；`<script name="json">` 与 `module.exports` 的公共写法见[条件编译文档](../../../../docs-vitepress/guide/cross-platform/conditional.md)，此处不重复维护。

---

## Web tabBar

Web 支持运行时渲染内建 tabBar；`custom: true` 时加载 `./custom-tab-bar/index`。

```JSON5
{
  tabBar: {
    color: "#666666",
    selectedColor: "#1677ff",
    backgroundColor: "#ffffff",
    borderStyle: "black",
    position: "bottom",
    list: [{ pagePath: "pages/index", text: "首页" }]
  }
}
```

---

## Web 分包与异步组件

`packages`、`?root`、`usingComponents` 与 `componentPlaceholder` 先沿用输入项目已经工作的 Mpx 配置；需要核实时查询仓库内对应配置键的文档或实现，不复制其它输出端的专项规则。

Web 输出通过 webpack 动态 `import()` 与浏览器 chunk 加载机制处理分包和异步组件，无需注册 RN 侧的 `loadChunkAsync` / `downloadChunkAsync`。SSR 场景还需在构建配置的 `pluginOptions.mpx.plugin.webConfig` 中启用 `useSSR`，详见 [SSR 专项参考](./ssr-reference.md)。

---

## 小程序专属声明

以下字段不能因为 JSON 能被读取就视为 Web 语义已对齐。只在输入实际使用时处理，并保留小程序原配置：

| 输入能力 | Web 边界 |
| --- | --- |
| `plugins` 与 `plugin://` 组件 | 当前插件导出处理只面向微信；Web 需要项目提供等效组件或明确待接入，不能静默当作普通组件。 |
| `workers` | Web JSON 流程不会按小程序 worker 目录声明复制和注册；实际依赖时需单独设计 Web Worker 入口。 |
| 分包 `independent: true` | Web 可异步加载分包页面，但不提供微信独立分包的独立启动与运行环境语义；不要把“chunk 可加载”当作等价支持。 |
| `preloadRule` | 不会自动转换为浏览器资源预取策略；这通常是性能语义缺失，按需求决定是否补 Web 预加载。 |
| `permission`、`requiredPrivateInfos` | 属于小程序宿主的权限与隐私声明，不会生成 Web 权限申请或合规配置；Web 侧按实际 API 和部署要求处理。 |

未使用这些字段时不要为其新增配置或占位实现。

---

## Web 运行配置

以下配置不属于页面 JSON 字段，但会影响 Web 路由、挂载与资源路径。先区分两个不同入口：

- **应用运行时配置**写在 `src/app.mpx` 等应用脚本中，通过从 `@mpxjs/core` 导入的 `mpx.config.webConfig` 设置。
- **构建期配置**写在项目实际使用的构建配置文件中。Mpx CLI Service 使用 `mpx.config.js`；Mpx webpack 插件选项位于 `pluginOptions.mpx.plugin`，Vue CLI 的资源路径是顶层 `publicPath`。

以下构建层级按 Mpx CLI Service 说明；使用其它构建方式时，以项目实际加载的配置入口为准。

| 配置入口 | Web 侧说明 |
| --- | --- |
| 运行时 `mpx.config.webConfig.routeConfig` | 推荐的 Web 路由配置入口，内容透传给 Web 路由实例；`mode` 控制路由模式，`base` 匹配实际访问路径。 |
| 运行时 `mpx.config.webRouteConfig` | 旧路由配置入口，仍兼容但不推荐新增使用。 |
| 构建期 `pluginOptions.mpx.plugin.webConfig.el` | Web 应用挂载节点，未配置时为 `#app`。 |
| 构建期 `pluginOptions.mpx.plugin.webConfig.useSSR` | SSR 模式下使用异步分包 / 异步组件时设为 `true`，详见 [SSR 专项参考](./ssr-reference.md)。 |
| 构建期 `pluginOptions.mpx.plugin.webConfig.disablePageTransition` | 是否禁用 Web 页面切换动画，默认 `true`。 |
| 构建期顶层 `publicPath` | Webpack 静态资源加载路径；非根路径部署时需与资源发布路径匹配。 |

例如 history 路由部署到 `/content/` 时，应用入口设置运行时路由：

```js
import mpx, { createApp } from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  mpx.config.webConfig = Object.assign({}, mpx.config.webConfig, {
    routeConfig: {
      mode: 'history',
      base: '/content/'
    }
  })
}

createApp({})
```

同一项目的 `mpx.config.js` 只写构建期选项：

```js
module.exports = {
  publicPath: '/content/'
}
```

示例中的路由 `base` 与资源 `publicPath` 同为 `/content/`；使用独立 CDN 时可以不同。普通 history 路由或子路径部署不需要因此开启 `useSSR`。Mpx CLI Service 的配置层级以上表为准，顶层 `webConfig` 或 `output.publicPath` 不能替代对应入口。
