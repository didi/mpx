## mpx.getBLEDeviceRSSI(Object object)

获取蓝牙低功耗设备的信号强度 (Received Signal Strength Indication, RSSI)。

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceRSSI.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| deviceId | string |  | 是 | 蓝牙设备 id |
| success | function |  | 否 | 接口调用成功的回调函数 |
| fail | function |  | 否 | 接口调用失败的回调函数 |
| complete | function |  | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） |


### object.success 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| RSSI | Number | 信号强度，单位 dBm |
