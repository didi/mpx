## mpx.offNetworkStatusChange(function listener)

移除网络状态变化事件的监听函数

支持情况： 微信、支付宝、web、RN、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.offNetworkStatusChange.html)

### 参数
**function listener**\
onNetworkStatusChange 传入的监听函数。不传此参数则移除所有监听函数。


### 示例代码

```js
const listener = function (res) { console.log(res) }

mpx.onNetworkStatusChange(listener)
mpx.offNetworkStatusChange(listener) // 需传入与监听时同一个的函数对象
```