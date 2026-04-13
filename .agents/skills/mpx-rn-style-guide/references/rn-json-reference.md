# 跨端输出 RN JSON 配置参考

本文档说明在 Mpx 输出 React Native（如 `mode` 为 `ios`、`android`、`harmony` 等 RN 目标）时，**小程序形态 JSON 配置**（`app.mpx` / 页面与组件 `.mpx` 中的 json 块）的支持范围与使用注意。写法上仍与微信小程序 `app.json`、页面/组件配置对齐；RN 端对部分字段仅有编译期处理或运行时等价能力，下文按层级说明。

## 目录

- [应用级配置](#应用级配置)
- [页面级配置](#页面级配置)
- [组件级配置](#组件级配置)
- [分包与分包异步化](#分包与分包异步化)

---

## 应用级配置

应用 json 用于注册页面、默认窗口样式、分包、预下载规则等。示例如下（字段可按需取舍）：

```json5
{
  "pages": [
    "pages/index",
    { "src": "pages/other", "path": "custom/route-name" }
  ],
  "window": {
    "navigationBarTitleText": "默认标题",
    "navigationBarTextStyle": "white",
    "navigationBarBackgroundColor": "#000000",
    "navigationStyle": "default"
  },
  // 推荐：用 packages 引用子包入口，并在路径上带 ?root 声明分包名
  "packages": [
    "./packageA/app.mpx?root=packageA"
  ],
  // subPackages 兼容微信等原生 app.json 写法，推荐优先使用 packages + ?root 进行分包定义
  "usingComponents": {},
  "networkTimeout": { "request": 60000 },
  "preloadRule": {
    "pages/index": { "network": "all", "packages": ["packageA"] }
  },
  "entryPagePath": "pages/index"
}
```

下表为跨端输出 RN 时支持的应用级配置项全集，未提到的配置项均不支持，跨端适配时需进行条件编译处理。

| 字段 | RN 侧支持说明 |
| --- | --- |
| `pages` | **必填**：注册页面，值可为页面路径字符串，或 `{ src, path? }` 对象（`path` 为路由别名）。 |
| `packages` | **推荐**：声明分包时优先使用，值为分包入口路径（如分包子应用的 `app.mpx` 或 `app.json`），在路径上通过 **`?root`** 指定分包名，分包名 `root` 不得以 `.` 开头，详情查看[使用 `packages` 定义分包](#使用-packages-定义分包)。 |
| `subPackages` / `subpackages` | **兼容**：与微信等原生 `app.json` 的 `subPackages` 写法对齐；Mpx 中推荐使用 **`packages` + `?root`** 定义分包 |
| `window` | 作为**全局默认窗口配置**，与各页面 json 合并后参与导航栏与页面展示，详情查看[页面级配置](#页面级配置)。 |
| `usingComponents` | 全局组件注册，仅支持同步组件。 |
| `networkTimeout` | 定义请求相关能力的默认超时时长。 |
| `preloadRule` | 定义在指定页面进入后的预下载分包规则，需在运行时注册 `Mpx.config.rnConfig.downloadChunkAsync`，否则不会触发实际下载。 |
| `entryPagePath` | 应用初始页面路径，未定义时使用 `pages` 数组的首个元素作为初始页面路径 |
| `tabBar` | 输出 RN 暂不支持，后续会支持 |

---

## 页面级配置

以下为页面 `.mpx` 中 **json 配置块** 示例（字段与小程序页面 `.json` 一致，可按需删减）：

```json5
{
  "navigationBarTitleText": "首页",
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff",
  "navigationStyle": "default",
  "backgroundColorContent": "#f5f5f5",
  "disableScroll": true,
  "usingComponents": {
    "list-item": "../components/list-item"
  }
}
```

跨端输出时 **`disableScroll` 宜为 `true`**，在 `<template>` 里用 **`scroll-y` 的 `scroll-view`** 包裹需要滚动的内容，与 RN 侧行为对齐。下拉刷新、触底等请结合 `scroll-view` 事件与业务逻辑实现。

下表为跨端输出 RN 时支持的**页面级**配置项全集，未提到的配置项均不支持，跨端适配时需进行条件编译处理。

| 字段 / 类别 | RN 侧说明 |
| --- | --- |
| `navigationStyle` | 为 `custom` 时不展示默认导航栏，页面渲染区域扩展到全屏；否则展示框架提供的导航栏。 |
| `navigationBarTitleText` | 导航栏标题，可使用 `mpx.setNavigationBarTitle` 在运行时进行更新。 |
| `navigationBarTextStyle` | 支持 `white` / `black`（及常见对应色值）映射为状态栏与标题前景色；其它值按实现回退为安全默认值。 |
| `navigationBarBackgroundColor` | 导航栏背景色，默认值为 `#000`，可使用 `mpx.setNavigationBarColor` 在运行时进行更新。 |
| `backgroundColorContent` | 页面容器背景色，默认值为 `#fff`。 |
| `usingComponents` | 局部组件注册，可配合 `?root` 及 `componentPlaceholder` 声明异步分包组件，详情查看[异步分包组件](#异步分包组件)  |
| `componentPlaceholder` | **开启异步分包且组件为异步时**：必须配置占位组件，且占位须在 `usingComponents` 中可解析；占位组件本身不应再标记为异步，否则构建会告警或报错。 |
| `disableScroll` | 跨端输出时应设置为 **`true`**，关闭页面默认滚动行为，**统一使用 `scroll-view` 包裹页面滚动内容**，作为跨端兼容方案。 |
| `enablePullDownRefresh` | 输出 RN 时无效，应在模板中结合 `scroll-view` 相关能力进行跨端兼容实现。 |
| `onReachBottomDistance` | 输出 RN 时无效，应在模板中结合 `scroll-view` 相关能力进行跨端兼容实现。 |
| `disableKeyboardAvoiding` | 仅输出 RN 时有效，为 `true` 时关闭框架自带的键盘避让包裹，开发者自行处理键盘遮挡。 |

---

## 组件级配置

以下为自定义组件 `.mpx` 中 **json 配置块** 示例：

```json5
{
  "usingComponents": {
    "inner": "./inner"
  },
  "componentGenerics": {
    "item": {
      "default": "./default-item"
    }
  }
}
```

下表为跨端输出 RN 时支持的**组件级**配置项全集，未提到的配置项均不支持，跨端适配时需进行条件编译处理。

| 字段 | RN 侧说明 |
| --- | --- |
| `usingComponents` | 局部组件注册，可配合 `?root` 及 `componentPlaceholder` 声明异步分包组件，详情查看[异步分包组件](#异步分包组件) |
| `componentPlaceholder` | **开启异步分包且组件为异步时**：必须配置占位组件，且占位须在 `usingComponents` 中可解析；占位组件本身不应再标记为异步，否则构建会告警或报错。 |
| `componentGenerics` | 抽象节点配置，带 `default` 的项会参与组件依赖收集，详情查看[抽象节点](#抽象节点)。|

---

## 分包与分包异步化

### 使用 `packages` 定义分包

### 异步分包组件

### 异步分包 JS 模块

## 抽象节点

