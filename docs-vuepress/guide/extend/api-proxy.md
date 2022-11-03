# Api转换

> convert API at each end 各个平台之间 api 进行转换，目前已支持微信转支付宝、微信转web

## Usage

```js
// 使用 mpx 生态

import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, options)
```

```js
// 脱离 Mpx 单独使用
import { getProxy } from '@mpxjs/api-proxy'
// proxy 即为target 实例
const proxy = getProxy(options)

proxy.navigateTo({
  url: '/pages/test',
  success (res) {
    console.log(res)
  }
})
```

## Options

|参数名称|类型|含义|是否必填|默认值|备注|
|---|---|---|---|---|---|
|platform|Object|各平台之间的转换|否|{ from:'', to:'' }|使用 mpx 脚手架配置会自动进行转换，无需配置|
|exclude|Array(String)|跨平台时不需要转换的 api|-|
|usePromise|Boolean|是否将 api 转化为 promise 格式使用|否|false|-|
|whiteList|Array(String)|强行转化为 promise 格式的 api|否|[]|需要 usePromise 设为 true|
|blackList|Array(String)|强制不变成 promise 格式的 api|否|[]|-|
|fallbackMap|Object|对于不支持的API，允许配置一个映射表，接管不存在的API|否|{}|-|

## example

### 普通形式

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  exclude: ['showToast'] // showToast 将不会被转换为目标平台
})

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

### 使用promise形式

> 开启usePromise时所有的异步api将返回promise，但是小程序中存在一些异步api本身的返回值是具有意义的，如uploadFile会返回一个uploadTask对象用于后续监听上传进度或者取消上传，在对api进行promise化之后我们会将原始的返回值挂载到promise.__returned属性上，便于开发者访问使用

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  usePromise: true
})

mpx.showActionSheet({
  itemList: ['A', 'B', 'C']
})
.then(res => {
  console.log(res.tapIndex)
})
.catch(err => {
  console.log(err)
})
```
