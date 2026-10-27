# 网络请求

`@mpxjs/fetch` 提供 Promise 请求、拦截器、取消与预请求能力，底层请求由 `@mpxjs/api-proxy` 提供。传输限制见目标端 API 参考，SSR 上下文见 [Web SSR](../web/ssr-reference.md)。

## 目录

- [接入与调用方式](#接入与调用方式)
- [`fetch(config)` 常用配置](#fetchconfig-常用配置)
- [拦截器](#拦截器)
- [取消请求](#取消请求)

## 接入与调用方式

- `mpx.use(mpxFetch, options?)` 安装全局实例，第二参数为构造选项，如 `useQueue`、`proxy`。
- 模块用 `mpx.xfetch`，选项式页面 / 组件也可用 `this.$xfetch`；App 通常没有 `this.$xfetch`。
- 命名导出 `useFetch()` 返回已安装的全局实例，未安装会报错；`useFetch(options)` 创建独立实例，拦截器、预请求缓存等不与全局共享。
- 响应包含业务数据 `data`、小程序风格的 `statusCode` / `header`，以及本次 `requestConfig`。

```js
import mpx from '@mpxjs/core'
import mpxFetch, { useFetch } from '@mpxjs/fetch'

mpx.use(mpxFetch)
const xfetch = useFetch() // 与 mpx.xfetch 相同
xfetch.fetch({ url: 'https://api.example.com/list' }).then((res) => {
  console.log(res.data)
})
```

## `fetch(config)` 常用配置

`method` 自动转大写，`headers` 先合并、`header` 覆盖同名键。其他字段按目标端 `request` 支持情况透传；`Referer` 等限制仍按宿主契约。部分模式（如 QQ 小程序请求队列）支持第二参数指定优先级，以对应端说明为准。

| 字段 | 规则 |
| --- | --- |
| `url` | 必填，缺失抛出 `Error('no url')` |
| `method` | 默认 `GET` |
| `params` | 对象，序列化为 URL 查询参数 |
| `data` | `GET` / `DELETE` / `HEAD` 与 `params` 合并为查询参数，不单独携带 body；`POST` / `PUT` 按 Content-Type 序列化，常见为 JSON 字符串或表单字符串 |
| `header` / `headers` | 合并为 `header`；`POST` / `PUT` 未指定 Content-Type 时，JSON 体一般按 `application/json` 发送 |
| `timeout` | 毫秒；Web / RN 按单次配置 → 应用 `networkTimeout.request`（兼容历史数值 `networkTimeout`）→ 默认 `60000` 的顺序取值 |
| `emulateJSON` | 仅 `POST` / `PUT` 且未设置 `content-type` / `Content-Type` 时，设为 `application/x-www-form-urlencoded` |
| `usePre` | 预请求 / 结果复用；`true` 等价于 `{ enable: true }`，对象选项见下表 |
| `cancelToken` | 传 `CancelToken` 实例的 `.token`（Promise），不传实例本身；取消错误可带 `__CANCEL__`，用 `xfetch.isCancel(err)` 判断 |

`usePre` 对象的常用选项：

| 字段 | 规则 |
| --- | --- |
| `enable` | 是否启用 |
| `cacheInvalidationTime` | 缓存有效期，默认 `3000` 毫秒 |
| `ignorePreParamKeys` | 忽略的参数键，字符串数组或英文逗号分隔的字符串 |
| `equals` | 自定义缓存命中判断 |
| `onUpdate` | 命中缓存后仍发真实请求，最新响应到达时回调；`then` 结果可能带 `isCache` |
| `mode` | `auto`（默认）、`consumer`（仅消费缓存）、`producer`（仅写入缓存）等 |

## 拦截器

`xfetch.interceptors.request/response.use(fulfilled[, rejected])` 注册拦截器；请求成功处理函数返回 `config` / `Promise<config>`，响应成功处理函数返回 `res` / `Promise<res>`。可选 `rejected` 处理链上的错误分支。**`use` 返回卸载函数**，调用后移除本次注册的两个处理函数。

以下示例沿用已安装的 `xfetch`，业务成功码按项目约定（此处为 `code: 0`）：

```js
const ejectReq = xfetch.interceptors.request.use((config) => {
  return Object.assign({}, config, {
    header: Object.assign({}, config.header, { 'X-Client': 'mpx' })
  })
})

const ejectRes = xfetch.interceptors.response.use((res) => {
  if (res.data && res.data.code !== 0) {
    return Promise.reject(new Error(res.data.message || '业务错误'))
  }
  return res
})

// 不再需要时调用 ejectReq() / ejectRes()
```

## 取消请求

创建 `new CancelToken()` 或 `new xfetch.CancelToken()`，将 `.token` 传入请求；在页面卸载、替换旧请求等时机调用 `exec(可选原因)`。`.token` Promise 会被 resolve 以通知取消，请求进入 fail / catch；用 `isCancel` 区分取消与普通错误。

```js
import { CancelToken } from '@mpxjs/fetch'

const cancelToken = new CancelToken()
xfetch.fetch({
  url: 'https://api.example.com/user',
  cancelToken: cancelToken.token
}).catch((err) => {
  if (xfetch.isCancel(err)) return
  console.error(err)
})

// 需要中断时调用 cancelToken.exec('leave-page')
```
