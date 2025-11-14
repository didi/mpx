## mpx.removeStorage(Object object)

从本地缓存中移除指定 key。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorage.html)

### 参数

**Object object**

属性	类型	默认值	必填	说明
| 属性    | 类型     | 默认值 | 必填 | 说明                 |
| ------- | -------- | ------ | ---- | -------------------- |
| key     | string   |        | 是   | 本地缓存中指定的 key |
| success | function |        | 否   | 接口调用成功的回调函数 |
| fail    | function |        | 否   | 接口调用失败的回调函数 |
| complete| function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |


### 示例代码
```js
mpx.removeStorage({
  key: 'key',
  success (res) {
    console.log(res)
  }
})
```