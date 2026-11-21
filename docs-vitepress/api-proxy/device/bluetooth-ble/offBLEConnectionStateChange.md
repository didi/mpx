## mpx.offBLEConnectionStateChange(function listener)

移除蓝牙低功耗连接状态改变事件的监听函数

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.offBLEConnectionStateChange.html)

### 参数 {#parameters}
**function listener**

onBLEConnectionStateChange 传入的监听函数。不传此参数则移除所有监听函数。

### 示例代码 {#example-code}

```js
const listener = function (res) { console.log(res) }

mpx.onBLEConnectionStateChange(listener)
mpx.offBLEConnectionStateChange(listener)
```
