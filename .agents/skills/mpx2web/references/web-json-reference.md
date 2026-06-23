# 跨端输出 Web JSON 配置参考

本文档说明 Mpx 输出 Web（`mode: 'web'`）时，`app.mpx` / 页面与组件 `.mpx` 中 JSON 配置的支持范围与使用注意。写法仍与微信小程序 `app.json`、页面/组件配置对齐；Web 侧会转成 Vue Router、Vue 组件注册与 Web 运行时页面配置。

为避免文档滞后，未提到的字段默认不作为 Web 支持能力使用；有疑问时优先扫描 `packages/webpack-plugin/lib/web/processJSON.js`、`packages/webpack-plugin/lib/json-compiler/helper.js`、`packages/webpack-plugin/lib/platform/json/` 与 Web 运行时消费点。

## 目录

- [应用配置](#应用配置)
- [页面配置](#页面配置)
- [组件配置](#组件配置)
- [分包与异步组件](#分包与异步组件)
- [Web 相关配置](#web-相关配置)
- [抽象节点](#抽象节点)

---

## 应用配置

应用 JSON 用于注册页面、全局页面配置、tabBar、全局组件与分包等，写在 `app.mpx` 的 JSON 块中。

示例如下（字段可按需取舍）：

```JSON5
{
  pages: ["pages/index", { src: "pages/detail", path: "detail" }],
  window: {
    navigationBarTitleText: "默认标题",
    enablePullDownRefresh: true,
    onReachBottomDistance: 50
  },
  tabBar: {
    color: "#666666",
    selectedColor: "#1677ff",
    backgroundColor: "#ffffff",
    borderStyle: "black",
    position: "bottom",
    list: [{ pagePath: "pages/index", text: "首页" }]
  },
  packages: ["./packageA/app.mpx?root=packageA"],
  usingComponents: {},
  networkTimeout: 60000,
  entryPagePath: "pages/index"
}
```

下表为 Web 侧确认支持的应用级配置项，未提到的配置项默认不支持或不建议依赖。

| 字段 | Web 侧支持说明 |
| --- | --- |
| `pages` | 注册 Web 路由页面，值可为页面路径字符串，或 `{ src, path? }` 对象；`path` 作为路由别名。 |
| `entryPagePath` | 指定初始页面路径；未定义时使用 `pages` 数组首个页面。 |
| `window` | 作为全局默认页面配置，与页面 JSON 合并后生效，页面配置优先。 |
| `tabBar` | 支持，Web 侧渲染内建 tabBar；`custom: true` 时加载 `./custom-tab-bar/index`。 |
| `usingComponents` | 全局组件注册。 |
| `packages` | 声明额外页面包；路径上通过 `?root` 指定分包名时按异步页面包处理。 |
| `subPackages` / `subpackages` | 兼容小程序分包写法；日常更推荐 `packages + ?root`。 |
| `networkTimeout` | 作为 `mpx.request` 默认超时时间。 |
| `style` | 注入 Web 运行时样式版本，未配置时为 `v1`。 |
| `preloadRule` | 源码中未看到 Web 运行时消费，不建议依赖。 |

---

## 页面配置

页面 JSON 写在各页面 `.mpx` 文件中，会与应用级 `window` 合并后作为当前页面配置。

示例如下：

```JSON5
{
  navigationBarTitleText: "详情",
  enablePullDownRefresh: true,
  disableScroll: false,
  usingComponents: {
    "detail-card": "../../components/detail-card"
  }
}
```

下表为 Web 侧确认支持的页面级配置项，未提到的配置项默认不支持或不建议依赖。

| 字段 | Web 侧支持说明 |
| --- | --- |
| `navigationBarTitleText` | 页面激活时设置 `document.title`。 |
| `enablePullDownRefresh` | 启用页面下拉刷新，可配合 `onPullDownRefresh` 与相关 API 使用。 |
| `disableScroll` | 禁用页面默认滚动。 |
| `onReachBottomDistance` | 配置 `onReachBottom` 触发距离，默认 `50`。 |
| `backgroundColor` | 用于 Web 下拉刷新加载区域背景色。 |
| `backgroundTextStyle` | 用于 Web 下拉刷新加载样式。 |
| `usingComponents` | 局部组件注册，可配合 `?root` 及 `componentPlaceholder` 声明异步组件。 |
| `componentPlaceholder` | 异步组件占位配置；占位组件需可解析，且不应再标记为异步。 |
| `componentGenerics` | 抽象节点配置，带 `default` 的项会参与组件依赖收集。 |

---

## 组件配置

组件 JSON 写在各组件 `.mpx` 文件中。

示例如下：

```JSON5
{
  usingComponents: {
    inner: "./inner"
  },
  componentGenerics: {
    item: {
      default: "./default-item"
    }
  }
}
```

下表为 Web 侧确认支持的组件级配置项，未提到的配置项默认不支持或不建议依赖。

| 字段 | Web 侧支持说明 |
| --- | --- |
| `usingComponents` | 局部组件注册，可配合 `?root` 及 `componentPlaceholder` 声明异步组件。 |
| `componentPlaceholder` | 异步组件占位配置；占位组件需可解析，且不应再标记为异步。 |
| `componentGenerics` | 抽象节点配置，带 `default` 的项会参与组件依赖收集，详情见[抽象节点](#抽象节点)。 |

---

## 分包与异步组件

Web 支持分包与异步组件的构建能力，运行时由 webpack 动态 `import()` 与浏览器 chunk 加载机制处理。

### 使用 `packages` 定义分包

在应用 JSON 的 `packages` 数组中声明分包入口，并通过 `?root=分包名` 指定分包名；分包名 `root` 不得以 `.` 开头。

```JSON5
{
  pages: ["pages/index"],
  packages: ["./packageA/app.mpx?root=packageA"]
}
```

`subPackages` / `subpackages` 写法仍支持，用于兼容微信原生配置；日常更推荐 `packages + ?root`。

### 异步组件

在 `usingComponents` 路径上声明 `?root=分包名` 可标记异步组件，并在 `componentPlaceholder` 中配置同步占位组件。

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

占位组件需在当前页面或组件的 `usingComponents` 中可解析，且占位组件本身不要再标记为异步。

### preloadRule

源码中未看到 Web 运行时消费 `preloadRule`，Web 预加载不要依赖该字段，优先按路由、异步组件或业务加载逻辑处理。

---

## Web 相关配置

以下配置不属于小程序 JSON 字段，但会影响 Web 路由、挂载和 SSR，遇到 Web 输出配置问题时一并核对。

| 配置 | Web 侧说明 |
| --- | --- |
| `mpx.config.webConfig.routeConfig` | 推荐的 Web 路由配置入口，内容透传给 VueRouter。 |
| `mpx.config.webRouteConfig` | 旧路由配置入口，仍兼容但不推荐继续使用。 |
| `routeConfig.mode` | 路由模式；SSR 场景需使用 `history`。 |
| `routeConfig.base` | 路由基础路径；非根路径部署时需与实际访问路径匹配。 |
| `webConfig.el` | Web 应用挂载节点，未配置时为 `#app`。 |
| `webConfig.useSSR` | SSR 模式下使用异步分包时设为 `true`。 |
| `webConfig.disablePageTransition` | 是否禁用页面切换动画，默认 `true`。 |
| `output.publicPath` | webpack 静态资源加载路径；非根路径部署时需与资源发布路径匹配。 |

SSR 相关生命周期属于脚本能力：`onAppInit`、`serverPrefetch`、`onSSRAppCreated`。服务端阶段不要依赖 `window`、`document`、`getApp()`、`getCurrentPages()` 完成数据准备。

---

## 抽象节点

Web 支持 `componentGenerics` 与模板中的 `generic:*` 组合。

定义方声明抽象节点：

```JSON5
{
  componentGenerics: {
    item: {
      default: "../default-item"
    }
  }
}
```

使用方传入具体组件：

```JSON5
{
  usingComponents: {
    "custom-item": "../custom-item"
  }
}
```

```html
<list generic:item="custom-item" />
```

使用要点：

- 默认组件写在 `componentGenerics.xxx.default`。
- 传入的具体组件需要在当前页面或组件的 `usingComponents` 中注册。
- 抽象节点名保持小程序写法，Web 编译阶段会转为运行时可识别的组件映射。
