## mpx.offLazyLoadError(function listener)

移除小程序异步组件加载失败事件的监听函数

支持情况： 微信、支付宝、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offLazyLoadError.html)

### 参数

**function listener**

onLazyLoadError 传入的监听函数。不传此参数则移除所有监听函数(支付宝除外)。

### 示例代码
```js
const listener = function (res) { console.log(res) }

mpx.onLazyLoadError(listener)
mpx.offLazyLoadError(listener) // 需传入与监听时同一个的函数对象
```