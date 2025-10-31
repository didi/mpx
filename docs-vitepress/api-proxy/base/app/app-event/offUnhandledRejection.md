## mpx.offLazyLoadError(function listener)

移除未处理的 Promise 拒绝事件的监听函数

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offUnhandledRejection.html)

### 参数

**function listener**

onUnhandledRejection 传入的监听函数。不传此参数则移除所有监听函数(支付宝除外)。

### 示例代码
```js
const listener = function (res) { console.log(res) }

mpx.onUnhandledRejection(listener)
mpx.offUnhandledRejection(listener) // 需传入与监听时同一个的函数对象
```