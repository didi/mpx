## mpx.setBLEMTU(Object object)

协商设置蓝牙低功耗的最大传输单元 (Maximum Transmission Unit, MTU)。需在 wx.createBLEConnection 调用成功后调用。仅安卓系统 5.1 以上版本有效，iOS 因系统限制不支持。

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.setBLEMTU.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| deviceId | string |  | 是 | 蓝牙设备 id |
| mtu | number |  | 是 | 最大传输单元。设置范围为 (22,512) 区间内，单位 bytes |
| success | function |  | 否 | 接口调用成功的回调函数 |
| fail | function |  | 否 | 接口调用失败的回调函数 |
| complete | function |  | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） |


### object.success 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| mtu | number | 最终协商的 MTU 值，与传入参数一致。安卓客户端 8.0.9 开始支持。 |

### 错误 {#error}

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| mtu | number | 最终协商的 MTU 值。如果协商失败则无此参数。安卓客户端 8.0.9 开始支持。 |
