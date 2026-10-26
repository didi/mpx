# 跨端输出 Web JSON 配置参考

本文档聚焦 Mpx 输出 Web（`mode: 'web'`）时，应用、页面与组件 JSON 配置相对微信小程序的差异。与微信一致的能力仅作列举，沿用原有写法。

编译插件与运行时配置见 [Web 配置参考](./web-config-reference.md)，环境 API 的接入与限制见 [Web API 参考](./web-api-reference.md)。**字段能够通过编译，不代表 Web 支持对应能力。**

## 目录

- [沿用微信写法的能力](#沿用微信写法的能力)
- [应用配置差异](#应用配置差异)
- [页面配置差异](#页面配置差异)
- [组件配置差异](#组件配置差异)
- [tabBar 配置差异](#tabbar-配置差异)
- [分包与分包异步化](#分包与分包异步化)
- [不生效的配置与适配](#不生效的配置与适配)

---

## 沿用微信写法的能力

以下能力可沿用微信配置；Web 的具体差异见后续章节。

| 范围 | 字段 / 能力 |
| --- | --- |
| 应用 | `pages` 页面列表、`window` 全局窗口配置、`usingComponents` 全局组件注册。 |
| 页面 | `usingComponents`、`disableScroll`、`enablePullDownRefresh`、`onReachBottomDistance`、`backgroundTextStyle`。 |
| 组件 | `usingComponents`、`componentPlaceholder`；可保留 `component: true`。 |
| 抽象节点 | `componentGenerics` 的 `true` / `{ default: 路径 }` 声明，以及使用方的静态 `generic:` 绑定。 |
| tabBar | `list`、`pagePath`、`text`、`iconPath`、`selectedIconPath`、`color`、`selectedColor`、`backgroundColor`、`borderStyle`、`position`、`custom`。 |
| 分包 | 支持 `subPackages` / `subpackages` 的 `root` 与 `pages` 声明，也支持 Mpx 扩展的 `packages` 分包入口写法，推荐使用 `packages` + `?root`。 |

---

## 应用配置差异

| 字段 | Web 使用注意 |
| --- | --- |
| `pages` | 除路径字符串外，支持 Mpx 扩展的 `{ src, path? }` 写法，以 `path` 指定路由别名。路径越出当前目录或冲突时可能被重命名，可用 `?resolve` 获取实际路径。 |
| `entryPagePath` | 决定访问根路由 `/` 时进入的页面；直接访问其他有效页面路由时仍进入该页面。值须匹配最终注册路径，不带开头的 `/` 与扩展名；未配置或未匹配时回退到主应用 `pages` 首项。 |
| `style` | 默认 `v1`；`v2` 仅影响部分内建组件，如 `button`、`checkbox`、`radio`、`switch`、`icon`，不代表完整支持微信新版样式。 |
| `networkTimeout` | 当前 Web 不支持标准对象写法，如 `{ request: 60000 }`；Web 请求应显式传数值型 `timeout`。 |
| `preloadRule` | 在 Web 不生效，不会自动预下载分包。 |

主应用 `pages` 建议至少保留一个首页，不要依赖只有 `packages` 时自动从分包选择首页。`entryPagePath` 不负责部署前缀或路由模式，相关设置见 [路由与部署路径](./web-config-reference.md#路由与部署路径)。

---

## 页面配置差异

以下窗口字段也可配置在应用 `window` 中，页面同名字段覆盖全局值。

| 字段 | Web 使用注意 |
| --- | --- |
| `navigationBarTitleText` | 页面激活时，非空值更新浏览器页面标题，同时作为内建标题栏文本。 |
| `navigationBarTextStyle` | 只影响内建标题栏，不改变浏览器或宿主状态栏文字色。默认 `black`；`white` 为白色，其他值按黑色处理。 |
| `navigationBarBackgroundColor` | 内建标题栏背景色，默认 `#ffffff`。 |
| `navigationStyle` | **内建标题栏默认关闭**，仅设置 `default` 不会显示；需在 `createApp` 前设置 `Mpx.config.webConfig.enableTitleBar = true`。`custom` 仍会隐藏内建标题栏。 |
| `backgroundColor` | 仅用于下拉刷新加载区域背景，默认 `transparent`；页面内容背景请用样式设置。 |
| `disableScroll` | 为 `true` 时不恢复页面滚动位置，也不触发页面滚动与触底事件。Web 无需统一设置为 `true`。 |

Web 的 `setNavigationBarTitle` 只修改浏览器页面标题，`setNavigationBarColor` 只设置浏览器主题色，二者不会更新内建标题栏。需要动态改变可见标题栏时，使用业务自定义标题栏。

页面滚动、下拉刷新与触底配置不会作用到内部 `scroll-view`。采用 `disableScroll: true` 配合 `scroll-view` 时，应使用该组件的滚动与刷新能力，见 [Web 模板参考](./web-template-reference.md)。

---

## 组件配置差异

- 异步分包组件的自定义占位须在当前 `usingComponents` 中注册，不能只依赖全局注册。
- `generic:` 指定的具体组件须在使用方的局部 `usingComponents` 中注册，不能只依赖全局注册。
- 样式隔离和 `virtualHost` 需单独适配，见 [Web 样式参考](./web-style-reference.md) 与 [Web 模板参考](./web-template-reference.md)。

---

## tabBar 配置差异

- 使用路由别名或分包页面时，`list[].pagePath` 填最终注册路径，不带开头的 `/` 与扩展名。
- tabBar 固定在页面顶部或底部，业务布局需预留空间，避免遮挡内容。
- 建议显式配置 `color`、`selectedColor` 与 `backgroundColor`。
- `custom: true` 时使用相对应用入口的 `./custom-tab-bar/index` 组件，仍须保留 `list`。
- 应用需接入 `mpx.switchTab` 环境 API；自定义 tabBar 也可调用它切换页面，见 [TabBar API](./web-api-reference.md#tabbar)。

---

## 分包与分包异步化

| 能力 | Web 差异 |
| --- | --- |
| 独立分包 | `independent: true` 不提供独立启动或隔离环境。 |
| 分包预下载 | `preloadRule` 不生效，不会按页面、网络类型或分包 `name` 自动预下载。 |
| 异步分包组件错误监听 | `onLazyLoadError` / `offLazyLoadError` 在 Web 不生效，需使用项目的 Web 异步组件错误处理方案。 |
| 跨分包 JS 模块 | `require.async` 仅支持 Promise 写法，不支持小程序回调式调用；通过 `.then()` 获取模块、`.catch()` 处理失败。 |

---

## 不生效的配置与适配

未列出的其他小程序 JSON 字段不能直接视为 Web 支持的能力。常见差异如下：

| 字段 / 能力 | Web 适配方式 |
| --- | --- |
| `plugins`、`plugin://`、`workers` | 不会自动提供对应 Web 能力，见 [应用 JSON 的小程序专属声明](./web-config-reference.md#应用-json-的小程序专属声明)。 |
| `permission`、`requiredPrivateInfos`、`requiredBackgroundModes`、`navigateToMiniProgramAppIdList` | 不会替代浏览器权限、宿主桥接或后台能力，按实际使用的 Web API 处理。 |
| `pageOrientation`、`disableSwipeBack`、`backgroundColorTop` / `backgroundColorBottom` | 在 Web 不生效，不能据此控制方向、浏览器返回或页面上下背景。 |
| `backgroundColorContent`、`disableKeyboardAvoiding` | RN 侧能力，在 Web 不生效；使用页面样式或浏览器交互方案。 |
