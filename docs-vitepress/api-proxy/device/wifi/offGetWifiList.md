## mpx.offGetWifiList(function listener)

移除获取到 Wi-Fi 列表数据事件的监听函数

支持情况： 微信、支付宝、RN(仅支持android)

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.offGetWifiList.html)

### 参数 {#parameters}

**function listener**

onGetWifiList 传入的监听函数。不传此参数则移除所有监听函数。

### 示例代码 {#example-code}
```js
const listener = function (res) { console.log(res) }

mpx.onGetWifiList(listener)
mpx.offGetWifiList(listener) // 需传入与监听时同一个的函数对象
```