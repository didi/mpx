# Mpx转RN API说明

mpx转RN的对标微信api目前支持及部分的api转换，目前支持的能力可以参考 [api-proxy](./extend.md#XFetch)说明文档

对于微信比较定制的能力比如说wx.getSystemInfo返回的response数据中，针对微信端的比如说albumAuthorized这类的值，在RN中都会返回null

对于一些api-proxy中没有提供的能力，用户可以搭配mpx对象方式传入custom使用即可示例如下：

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'
import { showModal } from '@test/showModal'

mpx.use(apiProxy, {
  custom: {
    ios: {
      showModal
    },
    android: {
      showModal
    }
  }
})

mpx.showModal({
  title: '标题',
  content: '这是一个弹窗',
  success (res) {
    console.log('弹框展示成功')
  }
})
```

