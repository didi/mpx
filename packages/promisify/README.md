# `mpx-promisify`

> make miniprogram api promisify

## Usage

```js
import mpx from '@mpxjs/core'
import promisify from '@mpxjs/promisify'

mpx.use(promisify)

// use以后通过mpx调用小程序的API就可以用promise的形式来写了。
// 注意，没有回调的方法以及on方法等无法使用
mpx.request({url}).then(res => {console.log(res)})

mpx.uploadFile(uploadObj).then(res => {})
```
