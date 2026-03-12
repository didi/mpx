## mpx.onGetWifiList(function listener)

监听获取到 Wi-Fi 列表数据事件

支持情况： 微信、支付宝、RN(仅支持android)

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.onBluetoothDeviceFound.html)

### 参数 {#parameters}

**function listener**

获取到 Wi-Fi 列表数据事件的监听函数

**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| wifiList | Array.&lt;[WifiInfo](https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/WifiInfo.html)&gt; | Wi-Fi 列表数据 |
