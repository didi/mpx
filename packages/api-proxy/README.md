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
|platform|Object|各平台之间的转换|否|{ from:'', to:'' }|使用 mpx 脚手架配置会自动进行转换，无需配置|
|exclude|Array(String)|跨平台时不需要转换的 api|否|[]|-|
|custom|Object|自定义对应平台的转换规则|否|{}|-|
|usePromise|Boolean|是否将 api 转化为 promise 格式使用|否|false|-|
|whiteList|Array(String)|强行转化为 promise 格式的 api|否|[]|需要 usePromise 设为 true|

## example

#### 普通形式

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

#### 使用 promise 形式

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  usePromise: true,
  custom: { // 自定义微信到百度的 compressImage 转换规则，支持 wx、ali、swan、qq、tt
    'wx_swan': {
      compressImage (options = {}) {
        const res = {}
        // TODO
        options.success && options.success(res)
      }
    }
  }
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

## Done

* ⚔ **微信 → 支付宝**
* ⚔ **百度 → 支付宝**
* ⚔ **QQ → 支付宝**
