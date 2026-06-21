## mpx.offGetWifiList(function listener)

移除获取到 Wi-Fi 列表数据事件的监听函数

支持情况： 微信、支付宝、RN(仅支持android)

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.offGetWifiList.html)

### 参数 {#parameters}

**function listener**

移除当前生效的监听函数（当前实现仅保留最后一次 `onGetWifiList` 注册的函数，不支持无参移除全部监听）。

> 说明：以上为当前实测行为，与微信文档中“可按传入函数移除，或无参移除全部监听”的描述不一致。

### 示例代码 {#example-code}
```js
const listener = function (res) { console.log(res) }

mpx.onGetWifiList(listener)
mpx.offGetWifiList(listener) // 传入当前生效的监听函数
```