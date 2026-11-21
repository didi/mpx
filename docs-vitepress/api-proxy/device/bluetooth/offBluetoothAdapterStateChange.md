## mpx.offBluetoothAdapterStateChange(function listener)

移除蓝牙适配器状态变化事件的监听函数（传入 `listener` 时移除指定监听，不传时移除全部监听）。


支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.offBluetoothAdapterStateChange.html)

> 说明：当前实测 `onBluetoothAdapterStateChange` 可多次注册监听，支持按传入的 `listener` 单独移除；不传参数时会移除全部监听。


### 示例代码 {#example-code}
```js
const listener1 = (res) => console.log('listener1', res)
const listener2 = (res) => console.log('listener2', res)

mpx.onBluetoothAdapterStateChange(listener1)
mpx.onBluetoothAdapterStateChange(listener2)

// 单独移除 listener1，listener2 仍会继续触发
mpx.offBluetoothAdapterStateChange(listener1)

// 不传参数，移除全部监听
mpx.offBluetoothAdapterStateChange()
```