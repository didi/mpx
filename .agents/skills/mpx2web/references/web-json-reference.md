# Mpx2Web JSON 配置参考

本文档只记录 Web 输出相关 JSON / `webConfig` 差异。通用 `app.json`、页面 JSON、组件 JSON 字段语义与配置写法统一参考 [Mpx2RN JSON 配置参考](../../mpx2rn/references/rn-json-reference.md) 中的公共部分，未来替换为 mpx base skill。

## 目录

- [Web 页面配置](#web-页面配置)
- [Web tabBar](#web-tabbar)
- [Web 分包与异步组件](#web-分包与异步组件)
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

`packages`、`?root`、`usingComponents` 与 `componentPlaceholder` 的通用配置写法分别参考 [使用 `packages` 定义分包](../../mpx2rn/references/rn-json-reference.md#使用-packages-定义分包) 和 [异步分包组件](../../mpx2rn/references/rn-json-reference.md#异步分包组件)。

Web 输出通过 webpack 动态 `import()` 与浏览器 chunk 加载机制处理分包和异步组件，无需注册 RN 侧的 `loadChunkAsync` / `downloadChunkAsync`。SSR 场景还需启用 `webConfig.useSSR`，详见 [SSR 专项参考](./ssr-reference.md)。

---

## Web 运行配置

以下配置不属于页面 JSON 字段，但会影响 Web 路由、挂载与资源路径。

| 配置 | Web 侧说明 |
| --- | --- |
| `mpx.config.webConfig.routeConfig` | 推荐的 Web 路由配置入口，内容透传给 Web 路由实例。 |
| `mpx.config.webRouteConfig` | 旧路由配置入口，仍兼容但不推荐新增使用。 |
| `routeConfig.mode` | Web 路由模式；SSR 场景见 [SSR 专项参考](./ssr-reference.md)。 |
| `routeConfig.base` | Web 路由基础路径；非根路径部署时需与实际访问路径匹配。 |
| `webConfig.el` | Web 应用挂载节点，未配置时为 `#app`。 |
| `webConfig.useSSR` | SSR 模式下使用异步分包 / 异步组件时设为 `true`，详见 [SSR 专项参考](./ssr-reference.md)。 |
| `webConfig.disablePageTransition` | 是否禁用 Web 页面切换动画，默认 `true`。 |
| `output.publicPath` | webpack 静态资源加载路径；非根路径部署时需与资源发布路径匹配。 |

运行时路由与构建资源路径可以分处不同文件：应用入口通过 `mpx.config.webConfig.routeConfig` 设置路由 `mode` / `base`，构建配置通过 `output.publicPath` 或项目等价入口设置静态资源路径。非根路径部署时两者必须对齐，但不要为了把它们写在同一个对象中而改回旧的 `mpx.config.webRouteConfig`。
