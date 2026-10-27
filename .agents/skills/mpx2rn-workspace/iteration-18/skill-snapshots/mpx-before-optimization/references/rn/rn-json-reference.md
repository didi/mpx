# RN JSON 配置差异

基准注册语法见 [JSON 基础](../base/json-reference.md)，本页记录 RN 字段支持和分包宿主要求。

## 目录

- [App 配置](#app-配置)
- [页面配置](#页面配置)
- [组件配置](#组件配置)
- [分包与分包异步化](#分包与分包异步化)
  - [RN 分包开关与公共模块](#rn-分包开关与公共模块)
  - [分包预下载](#分包预下载)
  - [注册 `loadChunkAsync` 和 `downloadChunkAsync`](#注册-loadchunkasync-和-downloadchunkasync)
  - [分包失败处理](#分包失败处理)

## App 配置

[App 配置基准](../base/json-reference.md#app-配置)中的 `pages`、`packages` / `subPackages` / `subpackages`、`usingComponents`、`networkTimeout`、`window`、`entryPagePath` 沿用基准。RN 的应用字段支持范围由这些字段及下表组成，其他字段不能视为支持。

| 字段 | RN 差异 |
| --- | --- |
| `preloadRule` | 需接入运行时 `Mpx.config.rnConfig.downloadChunkAsync` 才能实际预下载，见 [分包预下载](#分包预下载)。 |
| `tabBar` | 不支持。 |

## 页面配置

[页面配置基准](../base/json-reference.md#页面配置)中的 `navigationStyle`、`navigationBarTitleText`、`navigationBarTextStyle`、`navigationBarBackgroundColor`、`backgroundColorContent`、`usingComponents`、`componentPlaceholder` 沿用基准。其余已确认支持的字段、专属字段和不支持项如下，未列出的字段不能视为支持。

| 字段 | RN 差异 |
| --- | --- |
| `disableScroll` | RN 页面不提供默认滚动；设为 `true`，通过 `scroll-view` 承载滚动内容。 |
| `enablePullDownRefresh` / `onReachBottomDistance` | 不生效，使用 `scroll-view` 对应能力。 |
| `disableKeyboardAvoiding` | RN 专属，为 `true` 时关闭框架键盘避让包裹，遮挡由业务处理。 |

RN 页面滚动适配时同时设置 `page { height: 100%; }`，并为滚动容器开启 `scroll-y`。

## 组件配置

RN 的 `component`、`usingComponents`、`componentPlaceholder`、`componentGenerics` 沿用 [组件配置基准](../base/json-reference.md#组件配置)。

## 分包与分包异步化

共用的 `packages` / `?root` / `?resolve`、占位组件与 `require.async` 写法见 [分包基准参考](../base/subpackage-reference.md)。

| 能力 | RN 差异 |
| --- | --- |
| 普通分包与分包异步化 | 支持构建，须开启编译期 `rnConfig.supportSubpackage`，并由应用容器实现 bundle 下载与执行，接入运行时 `Mpx.config.rnConfig.loadChunkAsync`。 |
| 独立分包 | 不支持独立分包，`independent` 配置不提供独立启动能力。 |
| 分包预下载 | `preloadRule` 需接入运行时 `Mpx.config.rnConfig.downloadChunkAsync` 才能实际预下载，不执行下载后的模块。 |
| 异步分包页面加载与失败处理 | 通过编译期 `rnConfig.asyncChunk.loading` / `fallback` 配置加载中和失败组件，通过运行时 `Mpx.config.rnConfig.onLazyLoadPageError` 监听失败，见[分包失败处理](#分包失败处理)。 |
| 异步分包组件错误监听 | 支持 `onLazyLoadError` / `offLazyLoadError`；重试可通过 `wx:if` 卸载并重新挂载组件，见[分包失败处理](#分包失败处理)。 |

### RN 分包开关与公共模块

JSON 分包声明须配合编译期 `rnConfig.supportSubpackage`。公共模块拆分与页面 loading/fallback 配置统一见 [RN 编译配置](./rn-config-reference.md#编译期-rnconfig)；异步组件占位仍使用 JSON 的 `componentPlaceholder`。

### 分包预下载

`preloadRule` 的声明沿用基准，RN 需通过 `downloadChunkAsync` 接入实际下载，不执行下载后的模块。

### 注册 `loadChunkAsync` 和 `downloadChunkAsync`

异步分包由宿主通过 `loadChunkAsync` 下载并执行；预下载通过 `downloadChunkAsync` 处理。参数、返回值与超时约定见 [RN 运行时加载配置](./rn-config-reference.md#异步分包加载与预下载)。

### 分包失败处理

#### 异步页面

通过编译插件的 `rnConfig.asyncChunk.loading` / `fallback` 配置加载中和加载失败时的组件；未配置时使用框架内置组件。以下示例替换失败界面，加载中仍使用内置 loading：

```js
const path = require('path')

// MpxWebpackPlugin 的 rnConfig 配置片段
const rnConfig = {
  asyncChunk: {
    fallback: path.resolve(__dirname, 'src/components/page-fallback.mpx')
  }
}
```

自定义 Mpx fallback 组件通过 `this.triggerEvent('reload')` 通知框架重新加载页面。React fallback 组件则调用传入的 `onReload` 回调。

```html
<!-- src/components/page-fallback.mpx -->
<template>
  <view>
    <text>页面加载失败</text>
    <button bindtap="retry">重试</button>
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  methods: {
    retry () {
      this.triggerEvent('reload')
    }
  }
})
</script>

<script type="application/json">
{
  "component": true
}
</script>
```

需要记录加载失败时，在 RN 运行时配置初始化模块中注册 `onLazyLoadPageError`，并在 `createApp` 前引入该模块。回调接收分包名 `subpackage` 和错误类型 `errType`（如 `fail` / `timeout`）；该回调用于通知，重试仍由 fallback 组件触发。

```js
import Mpx from '@mpxjs/core'

Mpx.config.rnConfig.onLazyLoadPageError = ({ subpackage, errType }) => {
  console.error('异步页面加载失败', subpackage, errType)
}
```

#### 异步组件

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
