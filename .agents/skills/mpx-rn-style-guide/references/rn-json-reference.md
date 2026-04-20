# 跨端输出 RN JSON 配置参考

本文档说明在 Mpx 输出 React Native（如 `mode` 为 `ios`、`android`、`harmony` 等 RN 目标）时，**小程序形态 JSON 配置**（`app.mpx` / 页面与组件 `.mpx` 中的 JSON 块）的支持范围与使用注意。写法上仍与微信小程序 `app.json`、页面/组件配置对齐；RN 端对部分字段仅有编译期处理或运行时等价能力，下文按层级说明。

## 索引

- [应用配置](#应用配置)
- [页面配置](#页面配置)
- [组件配置](#组件配置)
- [分包与分包异步化](#分包与分包异步化)
  - [使用 `packages` 定义分包](#使用-packages-定义分包)
  - [异步分包组件](#异步分包组件)
  - [异步分包 JS 模块](#异步分包-js-模块)
  - [分包预下载](#分包预下载)
  - [注册 `loadChunkAsync` 和 `downloadChunkAsync`](#注册-loadchunkasync-和-downloadchunkasync)
  - [分包失败处理](#分包失败处理)
- [抽象节点](#抽象节点)
  - [声明 `componentGenerics`（定义方 JSON）](#定义方声明-componentgenerics)
  - [定义方模板](#定义方模板)
  - [使用方 `generic:` 绑定](#使用方-generic-绑定)
  - [默认组件（可选）](#默认组件可选)

---

## 应用配置

应用 JSON 配置用于注册页面、默认窗口样式、分包、预下载规则等。示例如下（字段可按需取舍）：

```JSON5
{
  pages: ["pages/index", { src: "pages/other", path: "custom/route-name" }],
  window: {
    navigationBarTitleText: "默认标题",
    navigationBarTextStyle: "white",
    navigationBarBackgroundColor: "#000000",
    navigationStyle: "default"
  },
  // 推荐：用 packages 引用子包入口，并在路径上带 ?root 声明分包名
  packages: ["./packageA/app.mpx?root=packageA"],
  // subPackages 兼容微信等原生 app.json 写法，推荐优先使用 packages + ?root 进行分包定义
  usingComponents: {},
  networkTimeout: { request: 60000 },
  preloadRule: {
    "pages/index": { network: "all", packages: ["packageA"] }
  },
  entryPagePath: "pages/index"
}
```

下表为跨端输出 RN 时支持的应用级配置项全集，未提到的配置项均不支持，跨端适配时需进行条件编译处理。

| 字段 | RN 侧支持说明 |
| --- | --- |
| `pages` | **必填**：注册页面，值可为页面路径字符串，或 `{ src, path? }` 对象（`path` 为路由别名）。 |
| `packages` | **推荐**：声明分包时优先使用，值为分包入口路径（分包目录或 npm 包内的 `app.mpx` 或 `app.json`），在路径上通过 **`?root`** 指定分包名，分包名 `root` 不得以 `.` 开头，详情查看[使用 `packages` 定义分包](#使用-packages-定义分包)。 |
| `subPackages` / `subpackages` | **兼容**：与微信等原生 `app.json` 的 `subPackages` 写法对齐；Mpx 中推荐使用 **`packages` + `?root`** 定义分包 |
| `window` | 作为**全局默认窗口配置**，与各页面 JSON 合并后参与导航栏与页面展示，详情查看[页面配置](#页面配置)。 |
| `usingComponents` | 全局组件注册。 |
| `networkTimeout` | 定义请求相关能力的默认超时时长。 |
| `preloadRule` | 定义在指定页面进入后的预下载分包规则，需在运行时注册 `Mpx.config.rnConfig.downloadChunkAsync`，否则不会触发实际下载。 |
| `entryPagePath` | 应用初始页面路径，未定义时使用 `pages` 数组的首个元素作为初始页面路径 |
| `tabBar` | 输出 RN 暂不支持，后续会支持 |

---

## 页面配置

以下为页面的 JSON 配置示例：

```JSON5
{
  navigationBarTitleText: "首页",
  navigationBarTextStyle: "black",
  navigationBarBackgroundColor: "#ffffff",
  navigationStyle: "default",
  backgroundColorContent: "#f5f5f5",
  disableScroll: true,
  usingComponents: {
    "list-item": "../components/list-item"
  }
}
```

下表为跨端输出 RN 时支持的**页面级**配置项全集，未提到的配置项均不支持，跨端适配时需进行条件编译处理。

| 字段 / 类别 | RN 侧说明 |
| --- | --- |
| `navigationStyle` | 为 `custom` 时不展示默认导航栏，页面渲染区域扩展到全屏；否则展示框架提供的导航栏。 |
| `navigationBarTitleText` | 导航栏标题，可使用 `mpx.setNavigationBarTitle` 在运行时进行更新。 |
| `navigationBarTextStyle` | 支持 `white` / `black`（及常见对应色值）映射为状态栏与标题前景色；其它值按实现回退为安全默认值。 |
| `navigationBarBackgroundColor` | 导航栏背景色，默认值为 `#000`，可使用 `mpx.setNavigationBarColor` 在运行时进行更新。 |
| `backgroundColorContent` | 页面容器背景色，默认值为 `#fff`。 |
| `usingComponents` | 局部组件注册，可配合 `?root` 及 `componentPlaceholder` 声明异步分包组件，详情查看[异步分包组件](#异步分包组件) |
| `componentPlaceholder` | **开启异步分包且组件为异步时**：必须配置占位组件，且占位须在 `usingComponents` 中可解析；占位组件本身不应再标记为异步，否则构建会告警或报错。 |
| `disableScroll` | 跨端输出时应设置为 **`true`**，关闭页面默认滚动行为，**统一使用 `scroll-view` 包裹页面滚动内容**，作为跨端兼容方案。 |
| `enablePullDownRefresh` | 输出 RN 时无效，应在模板中结合 `scroll-view` 相关能力进行跨端兼容实现。 |
| `onReachBottomDistance` | 输出 RN 时无效，应在模板中结合 `scroll-view` 相关能力进行跨端兼容实现。 |
| `disableKeyboardAvoiding` | 仅输出 RN 时有效，为 `true` 时关闭框架自带的键盘避让包裹，开发者自行处理键盘遮挡。 |

**注意**：跨端输出时 **`disableScroll` 宜为 `true`**，在 `<template>` 里用 **`scroll-y` 的 `scroll-view`** 包裹需要滚动的内容，与 RN 侧行为对齐。下拉刷新、触底等请结合 `scroll-view` 事件与业务逻辑实现。

---

## 组件配置

以下为自定义组件的 JSON 配置示例：

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

下表为跨端输出 RN 时支持的**组件级**配置项全集，未提到的配置项均不支持，跨端适配时需进行条件编译处理。

| 字段 | RN 侧说明 |
| --- | --- |
| `usingComponents` | 局部组件注册，可配合 `?root` 及 `componentPlaceholder` 声明异步分包组件，详情查看[异步分包组件](#异步分包组件) |
| `componentPlaceholder` | **开启异步分包且组件为异步时**：必须配置占位组件，且占位须在 `usingComponents` 中可解析；占位组件本身不应再标记为异步，否则构建会告警或报错。 |
| `componentGenerics` | 抽象节点配置，带 `default` 的项会参与组件依赖收集，详情查看[抽象节点](#抽象节点)。 |

---

## 分包与分包异步化

Mpx 跨端输出 RN 完整支持分包与分包异步化的构建能力，但需要在应用容器中自行实现分包 bundle 的下载与执行能力，并且在运行时注册到 `Mpx.config.rnConfig.loadChunkAsync` 和 `Mpx.config.rnConfig.downloadChunkAsync` 当中。

### 使用 `packages` 定义分包

在应用 JSON 的 **`packages`** 数组中声明依赖的分包入口（分包目录或 npm 包内的 `app.mpx` / `app.json`），支持嵌套。编译时**只解析分别入口的 JSON 部分**，且主要消费其中的 **`pages`**、**`packages`** 域。这种写法在跨团队开发跨端应用时非常方便，分包的维护方能够自行维护分包内的页面列表，无需修改主应用配置。

- **合并主包**：`packages` 路径上**不带** `root` query 时，分包入口内声明的 `pages` 会按原始路径合并到主包页面列表，与主包 `pages` 一起注册，这种方式当前已不再常用。
- **注册分包**：在 `packages` 路径上增加 **`?root=分包名`**时，该入口下的 `pages` 会注册到对应分包中，分包名 `root` 不得以 `.` 开头。
- **分包页面路径**：启用分包后，页面路径带有分包前缀，在分包配置发生变化时页面路径也会随之改变，建议使用资源 **`?resolve`** 动态获取正确的页面路径，避免写死。

**分包使用示例**

主应用的 app.mpx 中注册分包入口

```JSON5
// src/app.mpx 的 JSON 块（节选）
{
  pages: ["./pages/index"],
  packages: ["./packageA/app.mpx?root=packageA"]
}
```

分包入口的 app.mpx 中注册分包页面

```JSON5
// src/packageA/app.mpx 的 JSON 块（节选）
{
  pages: ["./pages/foo", "./pages/bar"]
}
```

使用 `?resolve` 获取分包页面路径

```js
// 主包页面 src/pages/index.mpx 的 script（节选）
import mpx from "@mpxjs/core"
import fooPageUrl from "../../packageA/pages/foo.mpx?resolve"

mpx.navigateTo({
  url: fooPageUrl
})
```

**`subPackages` / `subpackages`** 写法仍支持，用于兼容微信原生写法；日常更推荐 **`packages` + `?root`**。

### 异步分包组件

跨分包使用其他分包内的自定义组件时，需在 **`usingComponents`** 的路径上声明 **`?root=对方分包名`**，并在 **`componentPlaceholder`** 中指定**已在本包 `usingComponents` 注册**的同步占位组件或基础组件（如 view / text 等）；占位组件本身不能再标记为异步。构建侧需开启 **`mpx.config.rnConfig.supportSubpackage`**，并可配置 `asyncChunk.loading` / `fallback` 等。

概念与写法与官方 [分包异步化 - 跨分包自定义组件](https://mpxjs.cn/guide/advance/async-subpackage.html) 一致；**微信、支付宝、Web、RN** 等环境下框架对该能力有支持（非支持端会自动降级）。

**示例：**

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

### 异步分包 JS 模块

在脚本中跨分包异步引用 JS 时，路径须带 **`?root=模块所在分包名`**，且使用 **`require.async('...').then(...)`** 的 Promise 风格（不能使用回调形式）。未带 `root` 时会触发构建告警。

**示例：**

```js
// 当前脚本位于分包 A，异步引用分包 B 内的模块
require
  .async("../commonPackage/utils?root=packageB")
  .then((mod) => {
    mod.init()
  })
  .catch((err) => {
    console.error("分包 JS 加载失败", err)
  })
```

### 分包预下载

通过应用配置中的 `preloadRule` 配置分包预下载规则，需在运行时注册实现 `downloadChunkAsync` 下载分包 bundle 能力。

**示例（app JSON 节选）：**

```JSON5
{
  pages: ["pages/index"],
  packages: ["./packageImportant/app.mpx?root=important"],
  preloadRule: {
    "pages/index": {
      network: "all",
      packages: ["important"]
    }
  }
}
```

### 注册 `loadChunkAsync` 和 `downloadChunkAsync`

RN 官方不直接支持分包加载能力，需要在应用容器中自行实现，如需使用分包及分包异步化的核心功能需注册实现 `loadChunkAsync` 下载并执行分包 bundle 能力，如需使用分包预下载能力需注册实现 `downloadChunkAsync` 下载分包 bundle 能力。

**示例（app script 节选）：**

```js
import mpx from "@mpxjs/core"

// 异步分包页面 / require.async / 动态 chunk 加载时调用；config.package 为分包名
mpx.config.rnConfig.loadChunkAsync = function (config) {
  return yourNativeLoadChunk({ packageName: config.package }).then(() => {
    /* 分包 bundle 已下载并执行完成 */
  })
}

// 与 preloadRule 配合；入参为分包名数组
mpx.config.rnConfig.downloadChunkAsync = function (packages) {
  if (packages && packages.length) {
    yourNativePrefetchPackages(packages)
  }
}
```

### 分包失败处理

对于分包页面，用户可通过 `@mpxjs/webpack-plugin` 的编译配置 `rnConfig.asyncChunk.loading / fallback` 自定义的分包加载中和加载失败时的渲染组件，如无定义则渲染框架内置默认组件，其中自定义 `fallback` 组件可以通过向外发送 `reload` 事件触发分包页面的重新加载

**构建配置示例（`mpx.config.js` 节选）：**

```js
const path = require("path")

module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        rnConfig: {
          asyncChunk: {
            timeout: 10000,
            loading: path.resolve(__dirname, "src/components/page-loading.mpx"),
            fallback: path.resolve(
              __dirname,
              "src/components/page-fallback.mpx"
            )
          }
        }
      }
    }
  }
})
```

**自定义 fallback 组件示例：**

```html
<template>
  <view class="wrap">
    <text>页面加载失败</text>
    <view class="btn" bindtap="handleRetry">重试</view>
  </view>
</template>

<script>
  import { createComponent } from "@mpxjs/core"

  createComponent({
    methods: {
      handleRetry() {
        this.triggerEvent("reload")
      }
    }
  })
</script>
```

对于**分包页面**加载失败，还可注册 **`mpx.config.rnConfig.onLazyLoadPageError`** 监听，该配置仅在 RN 环境下生效。

```js
mpx.config.rnConfig.onLazyLoadPageError = (error) => {
  console.error("异步页面加载失败", error.subpackage, error.errType) // errType: 'timeout' | 'fail' 等
}
```

对于**异步分包组件**，可使用 **`mpx.onLazyLoadError`** 监听失败，回调入参中含 **`subpackage`** 分包名数组。若需重试，可在判断命中目标分包后，通过数据开关配合模板 **`wx:if`** 先卸载再挂载组件，以重新触发分包拉取与组件渲染。

**示例：**

```html
<template>
  <view class="heavy-slot">
    <block wx:if="{{!loadFailed}}">
      <async-heavy />
    </block>
    <view wx:else class="load-fail">
      <text>组件加载失败</text>
      <view class="btn" bindtap="retryHeavy">重试</view>
    </view>
  </view>
</template>

<script>
  import mpx, { createComponent } from "@mpxjs/core"

  const TARGET_SUBPACKAGE = "packageB"

  createComponent({
    data: {
      loadFailed: false
    },
    attached() {
      this._onLazyLoadError = (err) => {
        const names = Array.isArray(err.subpackage) ? err.subpackage : []
        if (names.indexOf(TARGET_SUBPACKAGE) === -1) return
        console.error("异步分包组件加载失败", err.errMsg, names)
        this.loadFailed = true
      }
      mpx.onLazyLoadError(this._onLazyLoadError)
    },
    detached() {
      if (this._onLazyLoadError) {
        mpx.offLazyLoadError(this._onLazyLoadError)
      }
    },
    methods: {
      retryHeavy() {
        this.loadFailed = false
      }
    }
  })
</script>

<script type="application/json">
  {
    "usingComponents": {
      "async-heavy": "../../packageB/components/heavy?root=packageB"
    },
    "componentPlaceholder": {
      "async-heavy": "view"
    }
  }
</script>
```

对于**异步分包 JS**，在 **`require.async`** 返回的 Promise 上使用 **`.catch`** 监听失败，在回调中再次调用 **`require.async`** 即可重试。

**示例：**

```js
function loadUtil() {
  return require.async("../subpackage/util?root=packageB").catch((err) => {
    console.warn("首次失败，重试", err)
    return require.async("../subpackage/util?root=packageB")
  })
}

loadUtil().then((mod) => {
  mod.doSomething()
})
```

## 抽象节点

输出 RN 支持与微信小程序一致的抽象节点能力，由组件定义方在 JSON 配置和模板中声明**占位标签**，由组件使用方从外部控制占位标签的具体实现。

### 定义方声明 `componentGenerics`

| 写法 | 说明 |
| --- | --- |
| `[name]: true` | 无默认实现，使用方必须写 `generic:[name]`。 |
| `[name]: { "default": [path] }` | 使用方未指定时走默认组件；`default` 路径需存在。 |

`名` 与模板里抽象标签名一致（注意短横线/驼峰与工程约定一致）。

```JSON5
{
  "componentGenerics": {
    "selectable": true
  }
}
```

### 定义方模板

占位标签无需在本组件 `usingComponents` 里进行注册，标签名等于 `componentGenerics` 的键。

```html
<template>
  <view wx:for="{{labels}}">
    <label>
      <selectable disabled="{{false}}" />
      {{ item }}
    </label>
  </view>
</template>
```

### 使用方 `generic:` 绑定

引用带抽象节点的组件时写 **`generic:抽象名="组件名"`**；**`=` 右侧只能是静态字符串**，不能 `{{}}` 动态绑定组件类型。

`generic:` 里出现的**组件名**必须在使用方 JSON 的 **`usingComponents`** 中注册。

```html
<template>
  <selectable-group generic:selectable="custom-radio" />
</template>
```

```JSON5
{
  "usingComponents": {
    "selectable-group": "./selectable-group",
    "custom-radio": "./custom-radio"
  }
}
```

换实现时改为 `generic:selectable="custom-checkbox"` 等，对应组件同样要进 `usingComponents`。

### 默认组件（可选）

无默认时（`true`）使用方**必须**传 `generic:`；有 `default` 时可省略 `generic:`，未省略则仍按传入为准。

```JSON5
{
  "componentGenerics": {
    "selectable": {
      "default": "./default-selectable"
    }
  }
}
```