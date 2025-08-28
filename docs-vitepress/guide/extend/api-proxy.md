# API 转换

> MPX 生态提供的一套跨平台 API 转换机制，能够将不同端之间的 API 进行自动适配与转换，帮助开发者实现一套代码跨端运行。目前已支持微信转支付宝、微信转web、微信转RN

## 使用

```js
// 使用 mpx 生态

import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, options)
```

## 配置项 (Options)
所有配置均为可选，可根据实际需求组合使用

|参数名称|类型|含义|是否必填| 默认值   |备注|
|---|---|---|---|-------|---|
|~~platform~~|~~Object~~|~~各平台之间的转换~~|~~否~~|       |已删除|
|~~exclude~~|~~Array(String)~~|~~跨平台时不需要转换的 api~~|~~否~~|~~[]~~|已删除|
|usePromise|Boolean|是否启用 Promise 化风格调用|否| false |开启后，异步 API 将返回 Promise 对象|
|whiteList|Array(String)|**强制启用** Promise 化的 API 名单|否| []    |仅在 usePromise: true 时有效，可覆盖 blackList|
|blackList|Array(String)|**强制禁用** Promise 化的 API 名单|否| []    |即使在 usePromise: true 时，名单内的 API 也不会返回 Promise|
|~~fallbackMap~~|~~Object~~|~~对于不支持的API，允许配置一个映射表，接管不存在的API~~|~~否~~| {}    |已删除|
| custom       | Object            | 提供用户在各渠道下自定义api开放能力      | 否     | []                     | 用于扩展或自定义特定平台下的 API 实现                    |

## 使用介绍

### 普通形式

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy)

mpx.showModal({
  title: '标题',
  content: '这是一个弹窗',
  success (res) {
    if (res.cancel) {
      console.log('用户点击取消')
    }
  }
})
```

### usePromise

> 启用 `usePromise` 选项后，所有异步 `API` 将返回 `Promise` 对象。需要注意的是，部分小程序 `API`（如 `uploadFile`）的返回值本身具有特定意义（例如返回一个 `uploadTask` 对象用于监听上传进度或取消任务）。为了兼容这种情况，这些 `API` 的原始返回值会被挂载到返回的 `Promise` 对象的 `__returned` 属性上，开发者仍可正常访问和使用。

**⚠️ 注意** 
- **与原生微信小程序差异：** 
  - 在 `Mpx` 中，开启 `usePromise` 后，**所有**接收 `success` 或 `fail` 参数的 `API` 都可返回 `Promise`，统一支持 `await` 或 `.then ()` 语法。
  - 而微信小程序原生环境中则存在差异：大部分接收 `success` 和 `fail` 回调的 `API` 已支持 `Promise` 化写法，**但存在个别特例——** 这些 `API` 虽然同样接收 `success` 和 `fail` 参数，却不支持 `promisify` 风格调用。
- **混用风险：** 
  - API 调用同时支持 `success/fail` 回调与 `Promise` 的 `then/catch` 写法，且两者两种方式可以共存使用。虽然支持共存，但还是**强烈建议开启`usePromise`后，支持 `promisify` 风格的 `API` 都走 `then/catch` 写法**以避免产生下面提示的第三项的影响
  - 当同时使用时，若调用成功，`success` 回调与 `then` 方法会依次执行；若调用失败，`fail` 回调与 `catch` 方法会依次执行。
  - 需注意：若仅使用了 `success/fail` 回调（未搭配 `then/catch`），当 API 调用失败时，由于没有 `catch` 捕获异常，会触发 `onUnhandledRejection` 事件。
- **临时关闭 Promise 转换：** 如仍需在某次调用中使用 `success/fail` 回调，且不希望触发因未捕获 `Promise` 错误而产生的警告，可通过传入 `usePromise: false` 选项临时关闭本次调用的 `Promise` 转换（默认为 `true`）。


```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

// 启用 Promise 风格
mpx.use(apiProxy, {
  blackList: ['getSystemInfo']
})

// 加入黑名单后，需要以success/fail方式调用
mpx.getSystemInfo({
  success(res) {
    console.log(res, 'getSystemInfo success')
  },
  fail(err) {
    console.log(err, 'getSystemInfo error')
  }
})

```

### whiteList 与 blackList
精细控制 Promise 化行为：

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

// 启用 Promise 风格
mpx.use(apiProxy, {
  usePromise: true,
  custom: {
    ali: { // 支付宝小程序下扩展自定义API
      myCustomMethod() {
        console.log('ali')
      }
    },
    ios: { // RN下扩展自定义API
      myCustomMethod() {
        console.log('ios')
      }
    }
  }
})

if (__mpx_mode__ === 'ali' || __mpx_mode__ === 'ios') {
  mpx.myCustomMethod()
}
```

### custom
为特定平台扩展自定义 API：

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

// 启用 Promise 风格
mpx.use(apiProxy, {
  usePromise: true,
  custom: {
    ali: { // 支付宝小程序下扩展自定义API
      myCustomMethod() {
        console.log('ali')
      }
    },
    ios: { // RN下扩展自定义API
      myCustomMethod() {
        console.log('ios')
      }
    }
  }
})

if (__mpx_mode__ === 'ali' || __mpx_mode__ === 'ios') {
  mpx.myCustomMethod()
}
```

### 独立调用

作为 Mpx 框架的内置能力，也支持独立调用，无需显式挂载在 Mpx 实例上

```js
import apiProxy from '@mpxjs/api-proxy'
// 获取代理实例，底层仍基于 Mpx 框架的转换机制
const proxy = getProxy(options)

// 调用方式与原生 API 一致，代理层会自动处理跨平台转换
proxy.navigateTo({
  url: '/pages/test',
  success (res) {
    console.log(res)
  }
})
```


### 按需导入单个 API

除了使用完整的代理实例，你也可以直接从 @mpxjs/api-proxy 中按需导入特定的 API 方法

```js

// 直接导入所需的 API 方法
import { navigateTo } from '@mpxjs/api-proxy'

// 像使用原生 API 一样直接调用
navigateTo({
  url: '/pages/test',
  success (res) {
    console.log(res)
  }
})

```