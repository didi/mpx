# Web JSON 配置差异

本文档聚焦 Mpx 输出 Web（`mode: 'web'`）时，应用、页面与组件 JSON 配置相对微信小程序的差异。与微信一致的注册语法见 [JSON 基准](../base/json-reference.md)，分包声明见 [分包基准](../base/subpackage-reference.md)。

编译插件与运行时配置见 [Web 配置参考](./web-config-reference.md)，环境 API 的接入与限制见 [Web API 参考](./web-api-reference.md)。**字段能够通过编译，不代表 Web 支持对应能力。**

## 目录

- [App 配置](#app-配置)
  - [tabBar 配置](#tabbar-配置)
- [页面配置](#页面配置)
- [组件配置](#组件配置)
- [分包与分包异步化](#分包与分包异步化)
- [不生效的配置与适配](#不生效的配置与适配)

## App 配置

页面、分包、全局组件注册、默认窗口声明、`entryPagePath` 及 `networkTimeout.request` 沿用 [App 配置基准](../base/json-reference.md#app-配置)，以下只列 Web 差异。

| 字段 | Web 差异 |
| --- | --- |
| `preloadRule` | 在 Web 不生效，不会自动预下载分包。 |

### tabBar 配置

字段和页面路径写法沿用 [tabBar 基准](../base/json-reference.md#tabbar-配置)。

- tabBar 固定在页面顶部或底部，业务布局需预留空间，避免遮挡内容。
- `custom: true` 时使用相对应用入口的 `./custom-tab-bar/index` 组件。
- 应用需接入 `mpx.switchTab` 环境 API；自定义 tabBar 也可调用它切换页面，见 [switchTab API](../base/api-reference.md#switchtab)。

## 页面配置

字段归属与覆盖关系见 [页面配置基准](../base/json-reference.md#页面配置)。

当 Web 页面在**全屏 WebView 容器**中打开时，可以启用 Mpx 内建标题栏，在页面内显示导航标题和返回按钮。内建标题栏默认关闭，启用需在 `createApp` 前配置：

```js
import Mpx from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  Mpx.config.webConfig.enableTitleBar = true
}
```

启用后，以下配置对内建标题栏生效，表现与基准一致。

| 页面配置 | 启用内建标题栏时 | 未启用内建标题栏时 |
| --- | --- | --- |
| `navigationBarTitleText` | 设置内建标题栏文字。 | 应用到 `document.title`，容器是否展示该标题由宿主决定。 |
| `navigationBarTextStyle` | 设置内建标题栏文字颜色。 | 不生效。 |
| `navigationBarBackgroundColor` | 设置内建标题栏背景色。 | 不生效。 |
| `navigationStyle` | `default` 显示内建标题栏，`custom` 隐藏它，由业务自定义。 | 不生效。 |

## 组件配置

组件依赖、占位和抽象节点声明沿用 [组件配置基准](../base/json-reference.md#组件配置)，Web 另有以下约束：

- 异步分包组件的自定义占位须在当前 `usingComponents` 中注册，不能只依赖全局注册。
- `generic:` 指定的具体组件须在使用方的局部 `usingComponents` 中注册，不能只依赖全局注册。
- 样式隔离和 `virtualHost` 需单独适配，见 [Web 样式参考](./web-style-reference.md) 与 [Web 模板参考](./web-template-reference.md)。

## 分包与分包异步化

| 能力 | Web 差异 |
| --- | --- |
| 独立分包 | 不支持独立分包，`independent` 配置不提供独立启动或隔离环境。 |
| 分包预下载 | `preloadRule` 不生效，不会按页面、网络类型或分包 `name` 自动预下载。 |
| 异步分包组件错误监听 | `onLazyLoadError` / `offLazyLoadError` 在 Web 不生效，需使用项目的 Web 异步组件错误处理方案。 |

## 不生效的配置与适配

未列出的其他小程序 JSON 字段不能直接视为 Web 支持的能力。常见差异如下：

| 字段 / 能力 | Web 适配方式 |
| --- | --- |
| `plugins`、`plugin://`、`workers` | 不会自动提供对应 Web 能力。 |
| `permission`、`requiredPrivateInfos`、`requiredBackgroundModes`、`navigateToMiniProgramAppIdList` | 不会替代浏览器权限、宿主桥接或后台能力，按实际使用的 Web API 处理。 |
| `pageOrientation`、`disableSwipeBack`、`backgroundColorTop` / `backgroundColorBottom` | 在 Web 不生效，不能据此控制方向、浏览器返回或页面上下背景。 |
| `backgroundColorContent` | 在 Web 不生效，使用页面样式设置容器背景色。 |
| `disableKeyboardAvoiding` | RN 侧能力，在 Web 不生效；使用浏览器交互方案。 |
