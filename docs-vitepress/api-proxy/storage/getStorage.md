## mpx.getStorage(Object object)

从本地缓存中异步获取指定 key 的内容。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorage.html)

### 参数

**Object object**

| 属性    | 类型     | 默认值 | 必填 | 说明                                                                                                                        | 最低版本 |
| ------- | -------- | ------ | ---- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| key     | string   |        | 是   | 本地缓存中指定的 key                                                                                                        |          |
| encrypt | Boolean  | false  | 否   | 是否开启加密存储。只有异步的 getStorage 接口支持开启加密存储。开启后，将会对 data 使用 AES128 解密，接口回调耗时将会增加。若开启加密存储，setStorage 和 getStorage 需要同时声明 encrypt 的值为 true | 2.21.3   |
| success | function |        | 否   | 接口调用成功的回调函数                                                                                                      |          |
| fail    | function |        | 否   | 接口调用失败的回调函数                                                                                                      |          |
| complete| function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                                                                            |          |

**object.success 回调函数**

**参数**

**Object res**

| 属性 | 类型 | 说明         |
| ---- | ---- | ------------ |
| data | any  | key对应的内容 |

### 示例代码
```js
mpx.getStorage({
  key: 'key',
  success (res) {
    console.log(res.data)
  }
})
```