## mpx.setStorage(Object object)

将数据存储在本地缓存中指定的 key 中。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorage.html)

### 参数

**Object object**

属性	类型	默认值	必填	说明	最低版本
| 属性      | 类型     | 默认值 | 必填 | 说明 | 最低版本 | 支付宝 | RN | web |
| --------- | -------- | ------ | ---- | ------------------------------------------------------------ | --------- | ------ | ---- | --- |
| key       | string   |        | 是   | 本地缓存中指定的 key                                         |           | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| data      | any      |        | 是   | 需要存储的内容。只支持原生类型、Date、及能够通过JSON.stringify序列化的对象。 |           | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| encrypt   | Boolean  | false  | 否   | 是否开启加密存储。只有异步的 setStorage 接口支持开启加密存储。开启后，将会对 data 使用 AES128 加密，接口回调耗时将会增加。若开启加密存储，setStorage 和 getStorage 需要同时声明 encrypt 的值为 true。此外，由于加密后的数据会比原始数据膨胀1.4倍，因此开启 encrypt 的情况下，单个 key 允许存储的最大数据长度为 0.7MB，所有数据存储上限为 7.1MB | 2.21.3   | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success   | function |        | 否   | 接口调用成功的回调函数                                       |           | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail      | function |        | 否   | 接口调用失败的回调函数                                       |           | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete  | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）              |           | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |


### 示例代码
```js
mpx.setStorage({
  key:"key",
  data:"value"
})
```