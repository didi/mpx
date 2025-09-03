mpx.createBLEConnection(Object object)

连接蓝牙低功耗设备。

若小程序在之前已有搜索过某个蓝牙设备，并成功建立连接，可直接传入之前搜索获取的 deviceId 直接尝试连接该设备，无需再次进行搜索操作。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.createBLEConnection.html)

### 参数
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 | 支付宝 |
| --- | --- | --- | --- | --- | --- |
| deviceId | string |  | 是 | 蓝牙设备 id | **<span style="color: green;">✓</span>** |
| timeout | number |  | 否 | 超时时间，单位 ms，不填表示不会超时 | **<span style="color: red;">✗</span>** |
| success | function |  | 否 | 接口调用成功的回调函数 | **<span style="color: green;">✓</span>** |
| fail | function |  | 否 | 接口调用失败的回调函数 | **<span style="color: green;">✓</span>** |
| complete | function |  | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） | **<span style="color: green;">✓</span>** |


### 错误

| 错误码 | 错误信息 | 说明 | 支付宝 |
| --- | --- | --- | --- |
| 0 | ok | 正常 | **<span style="color: red;">✗</span>** |
| -1 | already connect | 已连接 | **<span style="color: red;">✗</span>** |
| 10000 | not init | 未初始化蓝牙适配器 | **<span style="color: green;">✓</span>** |
| 10001 | not available | 当前蓝牙适配器不可用 | **<span style="color: green;">✓</span>** |
| 10002 | no device | 没有找到指定设备 | **<span style="color: green;">✓</span>** |
| 10003 | connection fail | 连接失败 | **<span style="color: green;">✓</span>** |
| 10004 | no service | 没有找到指定服务 | **<span style="color: green;">✓</span>** |
| 10005 | no characteristic | 没有找到指定特征 | **<span style="color: green;">✓</span>** |
| 10006 | no connection | 当前连接已断开 | **<span style="color: green;">✓</span>** |
| 10007 | property not support | 当前特征不支持此操作 | **<span style="color: green;">✓</span>** |
| 10008 | system error | 其余所有系统上报的异常 | **<span style="color: green;">✓</span>** |
| 10009 | system not support | Android 系统特有，系统版本低于 4.3 不支持 BLE | **<span style="color: green;">✓</span>** |
| 10012 | operate time out | 连接超时 | **<span style="color: green;">✓</span>** |
| 10013 | invalid_data | 连接 deviceId 为空或者是格式不正确 | **<span style="color: green;">✓</span>** |


### 示例代码

```js
mpx.createBLEConnection({
  deviceId,
  success (res) {
    console.log(res)
  }
})
```
