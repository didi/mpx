## mpx.onBluetoothAdapterStateChange(function listener)

监听蓝牙适配器状态变化事件

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.onBluetoothAdapterStateChange.html)

### 参数 {#parameters}

**function listener**

蓝牙适配器状态变化事件的监听函数

**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| available | boolean | 蓝牙适配器是否可用 |
| discovering | boolean | 蓝牙适配器是否处于搜索状态 |


### 示例代码 {#example-code}
```js
mpx.onBluetoothAdapterStateChange(function (res) {
  console.log('adapterState changed, now is', res)
})
```