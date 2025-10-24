mpx.onBLEConnectionStateChange(function listener)

监听蓝牙低功耗连接状态改变事件。包括开发者主动连接或断开连接，设备丢失，连接异常断开等等

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLEConnectionStateChange.html)

### 参数
**function listener**

蓝牙低功耗连接状态改变事件的监听函数

**参数**

**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| deviceId | string | 蓝牙设备 id |
| connected | boolean | 是否处于已连接状态 |

### 示例代码

```js
mpx.onBLEConnectionStateChange(function(res) {
  // 该方法回调中可以用于处理连接意外断开等异常情况
  console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
})
```
