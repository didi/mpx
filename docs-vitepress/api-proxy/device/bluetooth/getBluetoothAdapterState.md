## mpx.getBluetoothAdapterState(Object object)

获取本机蓝牙适配器状态。

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getBluetoothAdapterState.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| success | function |  | 否 | 接口调用成功的回调函数 |
| fail | function |  | 否 | 接口调用失败的回调函数 |
| complete | function |  | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） |

### object.success 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| discovering | boolean | 是否正在搜索设备 |
| available | boolean | 蓝牙适配器是否可用 |


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
mpx.getConnectedBluetoothDevices({
  services: ['FEE7'],
  success (res) {
    console.log(res)
  }
})
```
