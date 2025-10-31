## mpx.offAppShow(function listener)

移除小程序切前台事件的监听函数

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAppShow.html)

### 参数

**function listener**

onAppShow 传入的监听函数。不传此参数则移除所有监听函数(支付宝除外)。

### 示例代码
```js
const listener = function (res) { console.log(res) }

mpx.onAppShow(listener)
mpx.offAppShow(listener)
```