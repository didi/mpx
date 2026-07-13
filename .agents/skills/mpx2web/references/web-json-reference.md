# Mpx2Web JSON 配置参考

本文档只记录 Web 输出相关 JSON / `webConfig` 差异。通用 `app.json`、页面 JSON、组件 JSON 字段语义当前先参考 `../mpx2rn` 公共部分，未来替换为 mpx base skill。

## 目录

- [Web 路由页面](#web-路由页面)
- [Web 页面配置](#web-页面配置)
- [Web tabBar](#web-tabbar)
- [Web 分包与异步组件](#web-分包与异步组件)
- [Web 运行配置](#web-运行配置)
- [Web 抽象节点](#web-抽象节点)

---

## Web 路由页面

应用级 `pages` 会注册 Web 路由页面。Web 支持字符串页面路径，也支持 `{ src, path? }` 对象；`path` 可作为 Web 路由别名。

```JSON5
{
  pages: [
    "pages/index",
    { src: "pages/detail", path: "detail" }
  ],
  entryPagePath: "pages/index"
}
```

`entryPagePath` 指定 Web 初始页面；未定义时使用 `pages` 数组首个页面。

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

Web 分包与异步组件由 webpack 动态 `import()` 与浏览器 chunk 加载机制处理。

### 页面分包

在 `packages` 中声明分包入口，并通过 `?root=分包名` 指定分包名。

```JSON5
{
  pages: ["pages/index"],
  packages: ["./packageA/app.mpx?root=packageA"]
}
```

### 异步组件

在 `usingComponents` 路径上声明 `?root=分包名` 可标记 Web 异步组件，并在 `componentPlaceholder` 中配置同步占位组件。

```JSON5
{
  usingComponents: {
    hello: "../../packageB/components/hello?root=packageB",
    "simple-hello": "../components/hello"
  },
  componentPlaceholder: {
    hello: "simple-hello"
  }
}
```

占位组件需可同步解析，且占位组件本身不要再标记为异步。

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

---

## Web 抽象节点

Web 支持 `componentGenerics` 与模板中的 `generic:*` 组合。带 `default` 的项会参与组件依赖收集，传入的具体组件需要在当前页面或组件的 `usingComponents` 中注册。
