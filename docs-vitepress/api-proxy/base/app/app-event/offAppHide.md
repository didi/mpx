## mpx.offAppHide(function listener)

移除小程序切后台事件的监听函数

支持情况： 微信、支付宝、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAppShow.html)

### 参数

**function listener**

onAppHide 传入的监听函数。不传此参数则移除所有监听函数(支付宝除外)。

### 示例代码
```js
const listener = function (res) { console.log(res) }

mpx.onAppHide(listener)
mpx.offAppHide(listener)
```