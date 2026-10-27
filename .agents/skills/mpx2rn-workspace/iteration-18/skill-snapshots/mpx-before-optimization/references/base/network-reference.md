# 网络请求

`@mpxjs/fetch` 提供跨端一致的 Promise 请求、拦截器、取消与预请求能力，请求能力由 `@mpxjs/api-proxy` 提供。传输限制见目标端 API 参考；SSR 请求上下文见 [Web SSR](../web/ssr-reference.md)。

## 目录

- [接入与调用方式](#接入与调用方式)
- [`fetch(config)` 常用配置](#fetchconfig-常用配置)
- [拦截器](#拦截器)
- [取消请求](#取消请求)

## 接入与调用方式

```js
import mpx from "@mpxjs/core"
import mpxFetch from "@mpxjs/fetch"

// 第二个参数会传给全局 XFetch 构造选项（如 useQueue、proxy 等，可选）
mpx.use(mpxFetch)

// 全局单例
mpx.xfetch.fetch({ url: "https://api.example.com/list" }).then((res) => {
  console.log(res.data) // 业务数据
  // res 上还有 statusCode、header 等小程序风格字段，以及本次请求的 requestConfig
})

// 选项式：页面 / 组件内
// this.$xfetch.fetch({ url: "..." })
// App 构造上通常没有 this.$xfetch，请在页面/组件或模块中通过 mpx.xfetch / useFetch 调用
```

组合式里使用 **`useFetch`**（`@mpxjs/fetch` 命名导出）：**不传参**时返回已 **`mpx.use(mpxFetch)`** 注册好的全局实例（须先安装插件，否则会报错）；**传入构造选项**时返回**新的独立** `XFetch` 实例（独立拦截器与预请求缓存等，不与全局共享）。

## `fetch(config)` 常用配置

发起请求前会做配置正规化（例如 **`method` 转大写**、**`header` / `headers` 合并为 `header`**）。除下表外，还可传各平台 `request` 支持的字段（由 api-proxy 透传）。部分模式（如 QQ 小程序开启请求队列）下 **`fetch` 还支持第二参数表示优先级**，以对应端说明为准。

| 字段 | 说明 |
| --- | --- |
| `url` | **必填**；缺失会在正规化时 **`throw new Error('no url')`**。 |
| `method` | 默认 **`GET`**。 |
| `params` | 对象，序列化后作为 **URL 查询参数**。 |
| `data` | **`GET` / `DELETE` / `HEAD`**：会与 **`params` 合并**，整体按查询参数处理（不再单独携带 body 形式的 `data`）。**`POST` / `PUT`**：按 `Content-Type` 序列化——常见为 **`application/json`**（对象会序列化为 JSON 字符串）或 **`application/x-www-form-urlencoded`**（对象会序列化为表单字符串）。 |
| `header` | 请求头。未显式指定 `Content-Type` 时，对带 JSON 体的 **`POST`/`PUT`** 一般按 **`application/json`** 发送。`Referer` 等限制以各端 `request` 为准。`header` 与 `headers` 会合并为一套请求头（后者先合并、前者覆盖同名键）。 |
| `timeout` | 毫秒。Web/RN 的单次请求 `timeout` 优先；未传时读取应用 JSON 的 `networkTimeout.request`，兼容历史数值形式的 `networkTimeout`；未配置时默认 `60000`。 |
| `emulateJSON` | 仅 **`POST` / `PUT`**：在**尚未**设置 `content-type` / `Content-Type` 时，将类型设为 **`application/x-www-form-urlencoded`**（便于表单提交）。 |
| `usePre` | **预请求 / 结果复用**。传 **`true`** 等价于 `{ enable: true }`；需要自定义时传**对象**，常用字段：`enable`、`cacheInvalidationTime`（默认 **3000** ms）、`ignorePreParamKeys`（**字符串数组**，或**英文逗号分隔**的单个字符串）、`equals`（自定义是否命中缓存）、`onUpdate`（命中缓存时仍会发真实请求，并在最新响应到达时回调；`then` 得到的结果可能带 **`isCache`**）、`mode`（**`auto`（默认）** / **`consumer`** 仅消费缓存 / **`producer`** 仅写入缓存等）。 |
| `cancelToken` | 传入 **`CancelToken` 实例的 `.token`**（`Promise`）；`exec(msg)` 后请求失败回调里可带 **`__CANCEL__`**，可用实例方法 **`mpx.xfetch.isCancel(err)`** 判断。 |

## 拦截器

`mpx.xfetch.interceptors.request` / **`response`** 的 **`use(fulfilled[, rejected])`** 与常见 axios 风格类似：**`fulfilled` 必须返回最终下发的 `config` 或 `Promise<config>`**；**`response` 的 `fulfilled` 须返回 `res` 或 `Promise<res>`**。第二个参数 **`rejected`** 可选，用于该拦截器链上的错误分支。

**`use` 的返回值是一个卸载函数**，调用后移除本次注册的一对 fulfilled / rejected。

```js
import mpx from "@mpxjs/core"

// 请求发出前：统一附加鉴权头、打日志等
const ejectReq = mpx.xfetch.interceptors.request.use(
  (config) => {
    const token = "" /* 从 storage / store 读取 accessToken */
    if (!token) return config
    const header = Object.assign({}, config.header, {
      Authorization: "Bearer " + token
    })
    return Object.assign({}, config, { header })
  },
  (err) => Promise.reject(err)
)

// 响应回到业务 then 之前：统一处理错误码、解包 data 等（按团队约定）
const ejectRes = mpx.xfetch.interceptors.response.use(
  (res) => {
    // res.data、res.statusCode、res.header、res.requestConfig …
    if (res.data && res.data.code !== 0) {
      return Promise.reject(new Error(res.data.message || "业务错误"))
    }
    return res
  },
  (err) => {
    // 网络失败、取消、或上面主动 reject 都会进入这里
    return Promise.reject(err)
  }
)

// 不再需要时（例如退出登录后撤掉全局头）
// ejectReq()
// ejectRes()
```

## 取消请求

1. **`new CancelToken()`**（或 **`new mpx.xfetch.CancelToken()`**）得到实例 **`cancelToken`**。  
2. 发起请求时在配置里传入 **`cancelToken: cancelToken.token`**（`token` 为一个 **Promise**，取消时会被 resolve）。  
3. 在合适时机调用 **`cancelToken.exec(可选原因字符串)`**，本次请求会走 **fail / `catch`**；可通过 **`mpx.xfetch.isCancel(err)`** 判断是否为取消，避免与普通网络错误混用。

```js
import mpx from "@mpxjs/core"
import { CancelToken } from "@mpxjs/fetch"

/** 封装：同时拿到 promise 与 cancel，便于在 onUnload、防抖替换等场景调用 */
function fetchWithCancel (config) {
  const cancelToken = new CancelToken()
  const promise = mpx.xfetch
    .fetch(Object.assign({}, config, { cancelToken: cancelToken.token }))
    .catch((err) => {
      if (mpx.xfetch.isCancel(err)) {
        console.warn("请求已取消:", err.errMsg)
        return null // 按业务决定是否改为 Promise.reject(err)
      }
      return Promise.reject(err)
    })

  return {
    promise,
    cancel (reason = "canceled") {
      cancelToken.exec(reason)
    }
  }
}

// 发起请求
const { promise, cancel } = fetchWithCancel({
  url: "https://api.example.com/user",
  method: "GET",
  params: { id: "10001" }
})

// 需要中断时调用，例如页面 onUnload、搜索框输入防抖取消上一次请求
// cancel("leave-page")

promise.then((res) => {
  if (res === null) return // 已取消分支
  console.log(res.data)
})
```
