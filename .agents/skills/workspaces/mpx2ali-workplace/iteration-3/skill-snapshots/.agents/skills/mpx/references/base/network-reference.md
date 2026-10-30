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
- 默认导出上的 `mpxFetch.useFetch()` 返回已安装的全局 `XFetch` 实例；未安装时打印错误并返回 `undefined`。`mpxFetch.useFetch(options)` 传入构造选项对象（可为 `{}`）时创建独立实例，拦截器、预请求缓存等不与全局共享。也可使用命名导出的 `new XFetch(options?)`，或已有实例的 `xfetch.create(options?)`，均返回独立实例。
- 构造选项 `useQueue?: { limit?: number, delay?: number, ratio?: number }` 启用队列，默认并发上限 `10`、调度延迟 `0` 毫秒、为普通请求预留的空闲名额比例 `0.3`；QQ 安装全局实例时默认启用队列。`proxy` 接收代理规则对象或数组，`useBigInt?: boolean` 默认 `false`，`onValidatorError?: (message: string) => void` 默认打印校验错误。
- `xfetch.fetch(config, priority?)` 接收下表中的请求配置对象，返回 `Promise<Response>`。`Response` 包含 `data: any`、`statusCode: number`、`header: object`、`requestConfig: object`；命中预请求结果时可带 `isCache: true`。响应拦截器可改变最终兑现值；传输失败、取消和请求链抛错进入 rejection。

```js
import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'

mpx.use(mpxFetch)
const xfetch = mpxFetch.useFetch() // 与 mpx.xfetch 相同
xfetch.fetch({ url: 'https://api.example.com/list' }).then((res) => {
  console.log(res.data)
})
```

## `fetch(config)` 常用配置

`method` 自动转大写，`headers` 先合并、`header` 覆盖同名键。其他字段按目标端 `request` 支持情况透传；`Referer` 等限制仍按宿主契约。启用队列时，第二参数 `priority?: 'normal' | 'low'` 指定优先级；省略时按低优先级名单匹配，否则为 `normal`。`xfetch.addLowPriorityWhiteList(rules)` 接收字符串、正则或两者组成的数组，返回 `void`；未启用队列时不生效。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `url` | `string` | — | 必填字符串，缺失使请求 Promise 以 `Error('no url')` 拒绝 |
| `method` | `string` | `GET` | 请求方法。 |
| `params` | `object` | — | 对象，序列化为 URL 查询参数 |
| `data` | `string\|object\|ArrayBuffer` | — | `GET` / `DELETE` / `HEAD` 与 `params` 合并为查询参数，不单独携带 body；`POST` / `PUT` 按 Content-Type 序列化，常见为 JSON 字符串或表单字符串 |
| `header` / `headers` | `object` | — | 合并为 `header`；`POST` / `PUT` 未指定 Content-Type 时，JSON 体一般按 `application/json` 发送 |
| `timeout` | `number` | — | 毫秒；Web / RN 按单次配置 → 应用 `networkTimeout.request`（兼容历史数值 `networkTimeout`）→ 默认 `60000` 的顺序取值 |
| `emulateJSON` | `boolean` | 关闭 | 仅 `POST` / `PUT` 且未设置 `content-type` / `Content-Type` 时，设为 `application/x-www-form-urlencoded` |
| `usePre` | `boolean\|object` | — | 预请求 / 结果复用；`true` 等价于 `{ enable: true }`，对象选项见下表 |
| `cancelToken` | `Promise` | — | 传 `CancelToken` 实例的 `.token`（Promise），不传实例本身；取消错误可带 `__CANCEL__`，用 `xfetch.isCancel(err)` 判断 |
| `success` / `fail` / `complete` | `Function` | — | 可选回调，分别为 `(response: Response) => void`、`(error: object) => void`、`(result: object) => void`；返回值不使用。前两者在实际请求成功/失败时调用，结果带 `requestConfig`；`complete` 沿用宿主请求结果。命中缓存且不发新请求时，不重新执行这些底层请求回调 |

`usePre` 对象的常用选项：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `enable` | `boolean` | 不启用 | 是否启用预请求 / 结果复用。 |
| `cacheInvalidationTime` | `number` | `3000` | 缓存有效期，单位为毫秒。 |
| `ignorePreParamKeys` | `string\|string[]` | — | 忽略的参数键，字符串数组或英文逗号分隔的字符串 |
| `equals` | `Function` | — | 可选 `(config, cache) => boolean`；`config` 为当前正规化请求对象，`cache` 含 `params/data/method/cacheKey/lastTime/responsePromise`；返回 `true` 表示参数匹配，仍需请求方法一致且缓存未过期 |
| `onUpdate` | `Function` | — | 可选 `(response: Response) => void`，返回值不使用；命中缓存后仍发真实请求，若缓存先成功返回，则最新请求成功时调用。`fetch` 返回二者中最先成功的结果，缓存结果带 `isCache: true` |
| `mode` | `string` | `auto` | `auto`、`consumer`（仅消费缓存）、`producer`（仅写入缓存）等 |

## 拦截器

`xfetch.interceptors.request/response.use(fulfilled[, rejected])` 注册拦截器；请求成功处理函数返回 `config` / `Promise<config>`，响应成功处理函数返回 `res` / `Promise<res>`。可选 `rejected` 处理链上的错误分支。**`use` 返回卸载函数**，调用后移除本次注册的两个处理函数。

`fulfilled(value)` 接收当前请求配置或响应，返回 `undefined` 时保留原值。`rejected(reason: any)` 接收拒绝原因，返回普通值会继续作为拒绝原因，返回 `undefined` 保留原原因；需要恢复成功链时返回 `Promise.resolve(value)`。两者也可分别写为 `{ resolve: fulfilled, stage?: number }` / `{ reject: rejected, stage?: number }`，`stage` 默认 `0`，越小越先执行。卸载函数无参数，返回 `void`。

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

创建 `new CancelToken()` 或 `new xfetch.CancelToken()`，均无构造参数，返回令牌实例；将其 `.token: Promise<any>` 传入请求。`exec(reason?: any): Promise<void>` 通知取消，可附带原因，返回的 Promise 不代表底层请求已完成终止；请求失败由请求自身的 fail / catch 处理。`xfetch.isCancel(error: any): boolean` 根据取消标记区分取消与普通错误。

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
