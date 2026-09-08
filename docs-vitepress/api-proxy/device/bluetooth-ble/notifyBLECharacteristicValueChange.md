## mpx.notifyBLECharacteristicValueChange(Object object)

启用蓝牙低功耗设备特征值变化时的 notify 功能，订阅特征。注意：必须设备的特征支持 notify 或者 indicate 才可以成功调用。

另外，必须先启用 `mpx.notifyBLECharacteristicValueChange` 才能监听到设备 characteristicValueChange 事件

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.notifyBLECharacteristicValueChange.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 | 最低版本 | 支付宝 | RN |
| --- | --- | --- | --- | --- | --- | --- | --- |
| deviceId | string |  | 是 | 蓝牙设备 id |  | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| serviceId | string |  | 是 | 蓝牙特征对应服务的 UUID |  | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| characteristicId | string |  | 是 | 蓝牙特征的 UUID |  | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| state | boolean |  | 是 | 是否启用 notify |  | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| type | string | indication | 否 | 设置特征订阅类型，有效值有 notification 和 indication | 2.4.0 | **<span style="color: red;">✗</span>** | **<span style="color: red;">✗</span>** |
| success | function |  | 否 | 接口调用成功的回调函数 |  | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| fail | function |  | 否 | 接口调用失败的回调函数 |  | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| complete | function |  | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） |  | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |



### 错误 {#error}

| 错误码 | 错误信息 | 说明 | 支付宝 | RN |
| --- | --- | --- | --- | --- |
| 0 | ok | 正常 | **<span style="color: red;">✗</span>** | **<span style="color: green;">✓</span>** |
| -1 | already connect | 已连接 | **<span style="color: red;">✗</span>** | **<span style="color: red;">✗</span>** |
| 10000 | not init | 未初始化蓝牙适配器 | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| 10001 | not available | 当前蓝牙适配器不可用 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10002 | no device | 没有找到指定设备 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10003 | connection fail | 连接失败 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10004 | no service | 没有找到指定服务 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10005 | no characteristic | 没有找到指定特征 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10006 | no connection | 当前连接已断开 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10007 | property not support | 当前特征不支持此操作 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10008 | system error | 其余所有系统上报的异常 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10009 | system not support | Android 系统特有，系统版本低于 4.3 不支持 BLE | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10012 | operate time out | 连接超时 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10013 | invalid_data | 连接 deviceId 为空或者是格式不正确 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |

### 示例代码 {#example-code}

```js
mpx.notifyBLECharacteristicValueChange({
  state: true, // 启用 notify 功能
  // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
  deviceId,
  // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
  serviceId,
  // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
  characteristicId,
  success (res) {
    console.log('notifyBLECharacteristicValueChange success', res.errMsg)
  }
})
```
