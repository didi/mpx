# Mpx2Web WebView Bridge 参考

本文档记录 `@mpxjs/webview-bridge` 在 Mpx Web `web-view` 与嵌入 H5 页面之间的 Web-only 通信方式。普通页面通信、通用事件语法和小程序原生 `web-view` 用法不在本文重复说明。

## 目录

- [适用场景](#适用场景)
- [通信链路](#通信链路)
- [H5 页面使用](#h5-页面使用)
- [Web 宿主配置](#web-宿主配置)
- [环境与能力](#环境与能力)
- [SDK 加载](#sdk-加载)
- [安全与排查](#安全与排查)

---

## 适用场景

`@mpxjs/webview-bridge` 是运行在 `web-view` 标签所加载 H5 页面中的浏览器侧库，用于抹平不同小程序 `web-view` JS SDK，并在 Mpx Web / RN WebView 环境中把调用转发给宿主。

Mpx Web 场景由两部分配合：

- 宿主页中的 `<web-view>` 编译为内建 `mpx-web-view`，在 Mpx Web 下实际通过 `iframe` 加载 H5。
- `web-view` 标签加载的 H5 页面引入 `@mpxjs/webview-bridge`，调用导航、消息或业务桥接 API。

不要在 SSR 服务端执行该包。它在模块初始化阶段直接访问 `window`、`navigator`、`location` 和 `document`，应只在浏览器客户端加载。

---

## 通信链路

Mpx Web 下的调用链如下：

1. `mpx-web-view` 向 H5 页面地址追加 `mpx_webview_id`，用于区分页面内的多个 WebView 实例。
2. H5 页面中的 bridge 从 URL 读取该 ID，并随消息发送 `clientUid`。
3. bridge 使用 `window.parent.postMessage` 把调用类型、参数和 `callbackId` 发给宿主。
4. 宿主按调用类型执行导航、消息转发或 `apiImplementations` 中的业务方法。
5. 宿主将结果和 `callbackId` 发回 iframe，bridge 再触发调用方的 `success`、`fail`、`complete` 回调。

`postMessage` 用于向宿主 `<web-view>` 触发 `message` 事件；`invoke` 用于调用宿主在 `apiImplementations` 中注册的自定义方法。

---

## H5 页面使用

在 `web-view` 标签加载的 H5 页面中引入：

```js
import webviewBridge from '@mpxjs/webview-bridge'

webviewBridge.postMessage({
  data: { type: 'ready' },
  success (res) {
    console.log(res)
  }
})

webviewBridge.navigateTo({
  url: '/pages/detail/index?id=1'
})
```

调用自定义宿主 API：

```js
webviewBridge.invoke('getTheme', {
  success (res) {
    console.log(res)
  },
  fail (err) {
    console.error(err)
  }
})
```

接口采用小程序风格回调对象，不返回业务结果 Promise。使用某个平台独有的 API 前先判断方法是否存在，避免把某一宿主的能力当作跨端通用能力。

---

## Web 宿主配置

Mpx Web 宿主通过 `mpx.config.webConfig.webviewConfig` 配置白名单与自定义 API：

```js
import mpx from '@mpxjs/core'

mpx.config.webConfig = Object.assign({}, mpx.config.webConfig, {
  webviewConfig: {
    hostWhitelists: ['https://h5.example.com'],
    apiImplementations: {
      getTheme () {
        return {
          theme: 'light'
        }
      }
    }
  }
})
```

配置说明：

- `hostWhitelists`：限制 iframe 可加载的 origin，同时限制宿主接收消息的 `event.origin`；空数组表示不启用名单限制。运行时当前对完整 origin 执行 `endsWith(item)`，因此条目使用含协议的完整可信 origin，例如 `https://h5.example.com`，不要只写 `h5.example.com`。裸 host 会让 `https://evilh5.example.com` 之类的相似域名也通过后缀匹配。
- `apiImplementations`：注册 iframe 可通过 `invoke(name, options)` 调用的业务方法。实现可以返回普通值或 Promise。
- 导航方法 `navigateTo`、`navigateBack`、`redirectTo`、`switchTab`、`reLaunch` 已由内建 WebView 处理，无需重复注册。

只暴露嵌入页确实需要的最小 API，不要通过桥接返回长期凭证、隐私数据或任意执行能力。

普通业务 `postMessage` 可通过 `web-view` 的 `bindmessage` 接收，避免重复监听同一批消息；这不代表内建组件已经完成严格来源校验，见[安全与排查](#安全与排查)。

页面处理器按已声明的协议校验消息类型、载荷及必要的业务身份。协议要求 ID 时，先确认当前预期 ID 有效，再拒绝缺失或不匹配的消息 ID；不要强制所有协议新增 `resourceId`。Web 与小程序协议不同时可分平台处理，保留已有小程序协议。

---

## 环境与能力

bridge 会根据 UA 或宿主全局对象识别以下环境：

| 环境 | 识别结果 | 行为 |
| --- | --- | --- |
| 微信、QQ、支付宝、百度、抖音小程序 WebView | `wx`、`qq`、`my`、`swan`、`tt` | 动态加载对应 JS SDK，并转发宿主支持的方法。 |
| Mpx Web iframe | `web` | 使用 `window.parent.postMessage` 与 `mpx-web-view` 通信。 |
| React Native WebView | `rn` | 使用 `window.ReactNativeWebView.postMessage` 通信。 |

`getEnv(callback)` 在 Web 下返回 `{ webapp: true }`，在 RN WebView 下返回 `{ reactNative: true }`。各小程序 SDK 的非通用接口并不完全一致，使用前应判空并提供降级方案。

---

## SDK 加载

在小程序 WebView 环境中，bridge 会动态加载内置 CDN 地址对应的 JS SDK。业务可在引入 bridge 之前通过 `window.sdkUrlMap` 覆盖地址：

```js
window.sdkUrlMap = {
  wx: {
    url: 'https://example.com/jweixin.js'
  }
}
```

监听或取消监听 SDK 加载失败：

```js
function handleLoadError (message) {
  console.error(message)
}

webviewBridge.onLoadScriptError(handleLoadError)
webviewBridge.offLoadScriptError(handleLoadError)
```

微信需要使用额外 JSSDK 能力时，可调用 `webviewBridge.config(config)`；该方法在非微信环境不会生效。

---

## 安全与排查

当前实现存在双向来源校验缺口，不能把通信 ID 当作认证或严格实例隔离：

- **宿主接收调用**：`mpx-web-view` 仅在消息携带 `clientUid` 且与实例不匹配时拒绝，缺失 ID 仍可通过；没有检查 `event.source`。即使配置了白名单，也不能区分同源的不同窗口。导航和自定义 API 直接在内建消息处理器执行，页面 `bindmessage` 的业务校验不能保护这些调用。
- **子页面接收回包**：bridge 根据 `callbackId` 分发回调，未检查 `event.origin` 或 `event.source`；向父页面发送时使用 `targetOrigin: '*'`。宿主白名单不保护子页面的回包接收方向。

源码位置：`packages/webpack-plugin/lib/runtime/components/web/mpx-web-view.vue` 的 `messageCallback` / `hostValidate`，以及 `packages/webview-bridge/src/index.js` 的 `eventListener` / `runCallback`。

需要严格来源隔离时，应在实际接收并执行副作用的入口校验精确 origin 和目标窗口 source：宿主对应当前 iframe 的 `contentWindow`，子页面对应预期父窗口。现有内建协议不能仅通过新增一个并行监听器或页面业务 ID 检查完成加固；需评估经授权的实现修复，或使用具备双向校验的独立通信方案。无法取得目标窗口引用时，应明确限制，不能将改用内建 `bindmessage` 当作已解决。

常见排查项：

- 目标站点还需允许 iframe 嵌入，检查 CSP `frame-ancestors` 与 `X-Frame-Options`。
- 自定义 API 无响应时，依次检查 `mpx_webview_id`、`clientUid`、消息 `type`、`callbackId` 和 `apiImplementations` 注册名称。
- 小程序环境 SDK 加载失败时，检查 UA 识别结果、网络策略、SDK CDN 地址，并通过 `onLoadScriptError` 收集错误。
