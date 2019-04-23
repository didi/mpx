# mpx-api-proxy

> convert API at each end
> 各个平台之间 api 进行转换

## Usage

```js
// 使用 mpx 生态

import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, options)
```

```js
// 单独使用
import apiProxy from '@mpxjs/api-proxy'

apiProxy(target, options) // target 为要抹平的对象
```

## Options

|参数名称|类型|含义|是否必填|默认值|备注|
|---|---|---|---|---|---|
|platform|Object|各平台之间的转换|否|{from:'', to:'' }|使用 mpx 脚手架配置会自动进行转换，无需配置|
|exclude|Array(String)|跨平台时不需要转换的 api|-|
|usePromise|Boolean|是否将 api 转化为 promise 格式使用|否|false|-|
|whiteList|Array(String)|不需要转化 promise 格式的 api|否|[]|需要 usePromise 设为 true|

## Done

* ⚔ **微信 → 支付宝**
