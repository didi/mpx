## mpx.onBLECharacteristicValueChange(function listener)

监听蓝牙低功耗设备的特征值变化事件。必须先调用 [mpx.notifyBLECharacteristicValueChange](/api-proxy/device/bluetooth-ble/onBLEConnectionStateChange.html) 接口才能接收到设备推送的 notification。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLECharacteristicValueChange.html)

### 参数 {#parameters}
**function listener**

蓝牙低功耗设备的特征值变化事件监听函数（多次 `onBLECharacteristicValueChange` 注册时，后一次会覆盖前一次）。

**参数**

**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| deviceId | string | 蓝牙设备 id |
| serviceId | string | 蓝牙特征对应服务的 UUID |
| characteristicId | string | 蓝牙特征的 UUID |
| value | ArrayBuffer | 特征最新的值 |

### 示例代码 {#example-code}

```js
// ArrayBuffer转16进制字符串示例
function ab2hex(buffer) {
  let hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}
mpx.onBLECharacteristicValueChange(function(res) {
  console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
  console.log(ab2hex(res.value))
})
```
