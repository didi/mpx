# JSON 配置基础

本页按 App、页面、组件分别维护 Mpx JSON 配置的基准语法。目标端支持范围与行为差异见 [支付宝 JSON](../ali/ali-json-reference.md) / [RN JSON](../rn/rn-json-reference.md) / [Web JSON](../web/web-json-reference.md) / [Skyline JSON](../skyline/skyline-json-reference.md)；基准收录不代表所有端均支持。

## 目录

- [配置区块与注册](#配置区块与注册)
- [App 配置](#app-配置)
  - [tabBar 配置](#tabbar-配置)
- [页面配置](#页面配置)
- [组件配置](#组件配置)
  - [抽象节点](#抽象节点)
- [动态 JSON](#动态-json)

## 配置区块与注册

静态配置写在 `.mpx` 的 `<script type="application/json">` 中。三类文件使用相同区块语法，但配置字段和作用范围不同，工程关系见 [SFC](./project-structure-and-single-file-component.md)。

| 文件类型 | 配置职责 |
| --- | --- |
| App（`app.mpx`） | 注册页面、分包及全局组件，声明默认窗口、tabBar 等应用配置。 |
| 页面 | 声明当前页面的窗口行为及局部组件依赖。 |
| 组件 | 声明子组件依赖、占位组件与抽象节点，不配置页面列表或应用窗口。 |

自定义组件通过 JSON 的 `usingComponents` 字段注册，在 App 中注册为全局组件，在页面或组件中注册为局部组件，其 key 为模板标签名，value 为组件模块路径，仅在脚本中 import `.mpx` 文件不能替代 JSON 注册。支持通过路径 `?root` 配合 `componentPlaceholder` 引用[异步分包组件](./subpackage-reference.md#异步分包组件)。

## App 配置

写在应用入口 `app.mpx` 的 JSON 区块中：

```html
<script type="application/json">
{
  "pages": ["./pages/index", { "src": "./pages/detail", "path": "detail" }],
  "window": {
    "navigationBarTitleText": "默认标题",
    "navigationBarTextStyle": "black",
    "navigationBarBackgroundColor": "#ffffff"
  },
  "usingComponents": { "app-icon": "./components/app-icon" },
  "packages": ["./packageA/app.mpx?root=packageA"]
}
</script>
```

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `pages` | `Array` | — | 注册主包页面，支持路径字符串及 `{ src, path? }`，`path` 为路由别名。实际注册路径可能由构建调整，使用资源 `?resolve` 取得路由路径。 |
| `entryPagePath` | `string` | `pages` 首项 | 指定默认入口页面；使用已注册的页面路径，不带开头的 `/` 与扩展名。 |
| `window` | `Object` | — | 定义应用默认窗口配置；页面 JSON 顶层同名字段覆盖对应默认值。字段见 [页面配置](#页面配置)。 |
| `usingComponents` | `Object` | — | 注册全局组件；仅用于当前页面或组件的依赖可在其局部注册。 |
| `packages` / `subPackages` / `subpackages` | `Array` | — | 声明分包，推荐 `packages` + `?root`；分包入口、路径和异步引用见 [分包基准](./subpackage-reference.md)。 |
| `networkTimeout` | `Object` | — | 对象形式配置网络请求相关 API 的超时时长，例如 `{ "request": 60000 }`，单位为毫秒。Web/RN 的 request 未传 `timeout` 时读取 `networkTimeout.request`，未配置时默认 `60000`。 |
| `preloadRule` | `Object` | — | 按页面路径声明分包预下载规则，通过 `network` 和 `packages` 指定网络条件与目标分包，见 [分包预下载](./subpackage-reference.md#分包预下载与运行时边界)。 |
| `tabBar` | `Object` | — | 声明应用标签栏，见 [tabBar 配置](#tabbar-配置)。 |

### tabBar 配置

配置在 App JSON 的 `tabBar` 中：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `list` | `Array` | — | 标签项列表，每项通过 `pagePath` 关联已注册页面，通过 `text`、`iconPath`、`selectedIconPath` 配置文字和图标。`pagePath` 填最终注册路径，不带开头的 `/` 与扩展名。 |
| `color` / `selectedColor` | `string` | — | 普通与选中状态的文字颜色。 |
| `backgroundColor` / `borderStyle` | `string` | — | 标签栏背景色和边框样式。 |
| `position` | `string` | — | 标签栏位置。 |
| `custom` | `boolean` | — | 启用自定义 tabBar；仍需保留 `list` 声明对应页面。 |

## 页面配置

写在页面 `.mpx` 的 JSON 区块中。窗口字段直接放在顶层，不嵌套 `window`；仅对当前页面生效。

```html
<!-- pages/index.mpx 的 JSON 区块 -->
<script type="application/json">
{
  "navigationBarTitleText": "首页",
  "usingComponents": { "list-item": "../components/list-item" }
}
</script>
```

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `navigationBarTitleText` | `string` | — | 导航栏标题文字。 |
| `navigationBarTextStyle` | `string` | `white` | 导航栏标题及状态栏文字颜色，仅支持 `black` / `white`。 |
| `navigationBarBackgroundColor` | `string` | `#000000` | 导航栏背景色，使用十六进制颜色值。 |
| `navigationStyle` | `string` | `default` | `default` 使用默认导航栏；`custom` 使用自定义导航栏，仅保留右上角胶囊按钮。 |
| `backgroundColor` | `string` | `#ffffff` | 窗口背景色。 |
| `backgroundTextStyle` | `string` | `dark` | 下拉 loading 的样式，仅支持 `dark` / `light`。 |
| `backgroundColorContent` | `string` | `#ffffff` | 页面容器背景色。微信 WebView 渲染使用 `#RRGGBB`，Skyline 还支持带透明度的 `#RRGGBBAA`；与页面 CSS 背景、窗口背景分层。 |
| `disableScroll` | `boolean` | `false` | 设为 `true` 时页面整体不能上下滚动；仅在页面配置中有效，不能在 App 的 `window` 中设置。 |
| `enablePullDownRefresh` | `boolean` | `false` | 是否开启当前页面的下拉刷新，刷新事件由 `onPullDownRefresh` 处理。 |
| `onReachBottomDistance` | `number` | `50` | 页面上拉时距底部达到此距离触发 `onReachBottom`，单位为 `px`。 |
| `usingComponents` | `Object` | — | 以标签名到组件路径的映射注册页面局部组件。 |
| `componentPlaceholder` | `Object` | — | 以异步组件标签名到占位组件名的映射配置占位；异步组件尚未就绪时渲染占位，就绪后替换。写在引用方，具体要求见 [异步分包组件](./subpackage-reference.md#异步分包组件)。 |

`usingComponents` 与 `componentPlaceholder` 为依赖配置，不放进 App 的 `window`。

## 组件配置

写在自定义组件 `.mpx` 的 JSON 区块中：

```html
<script type="application/json">
{
  "component": true,
  "usingComponents": { "inner-item": "./inner-item" },
  "componentGenerics": { "selectable": { "default": "./default-selectable" } }
}
</script>
```

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `component` | `boolean` | — | 自定义组件的 JSON 中应显式声明 `"component": true`。 |
| `usingComponents` | `Object` | — | 注册当前组件模板依赖的子组件。 |
| `componentPlaceholder` | `Object` | — | 为当前组件引用的异步子组件指定占位，写法与页面一致，见 [异步分包组件](./subpackage-reference.md#异步分包组件)。 |
| `componentGenerics` | `Object` | — | 声明抽象节点，支持 `true` 或 `{ "default": "组件路径" }`，见 [抽象节点](#抽象节点)。 |

### 抽象节点

定义方在组件 JSON 中声明占位标签，在模板中直接使用，不再为占位标签注册 usingComponents：

```html
<template><view><selectable /></view></template>
<script type="application/json">
{
  "component": true,
  "componentGenerics": { "selectable": true }
}
</script>
```

使用方静态选择具体组件，并在自身局部 usingComponents 注册：

```html
<template><selectable-group generic:selectable="custom-radio" /></template>
<script type="application/json">
{
  "usingComponents": {
    "selectable-group": "./selectable-group",
    "custom-radio": "./custom-radio"
  }
}
</script>
```

`generic:` 右侧只能是静态组件名字符串，不能用 Mustache 动态绑定。声明为 `true` 时使用方须指定实现；也可声明 `{ "default": "./default-selectable" }` 提供默认组件，路径参与依赖收集。目标端的注册限制见对应 JSON 差异参考。

## 动态 JSON

App、页面和组件均可使用动态 JSON，字段归属与静态配置一致。需要按目标或环境注册组件/配置时使用 `<script name="json">`，通过 CommonJS 导出配置对象。构建常量 `__mpx_mode__` / `__mpx_env__` 可在此使用；执行于构建期，不能读取页面运行时状态。

```html
<script name="json">
module.exports = {
  usingComponents: {
    'info-card': __mpx_mode__ === 'web' ? './InfoCard.vue' : './info-card.mpx'
  }
}
</script>
```

同标签的两种实现需要提供兼容 props、事件和插槽；不兼容部分再隔离模板。详情见 [条件编译](./conditional-compile.md)。
