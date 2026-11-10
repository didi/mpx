## mpx.getConnectedWifi(Object object)

获取已连接中的 Wi-Fi 信息。

支持情况： 微信、支付宝、RN(仅支持android)

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.getConnectedWifi.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 | 最低版本 | 支付宝 | RN |
| --- | --- | --- | --- | --- | --- | --- | --- |
| partialInfo | boolean | false | 否 | 是否需要返回部分 Wi-Fi 信息 | 2.22.0 | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: green; font-weight: bold;">✓</span> |
| success | function | | 否 | 接口调用成功的回调函数 | | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail | function | | 否 | 接口调用失败的回调函数 | | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete | function | | 否 | 接口调用结束的回调函数（调用成功、失败都会执行）| | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |

### object.success 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| wifi | [WifiInfo](https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/WifiInfo.html) | Wi-Fi 信息 |

**提示：** WifiInfo 中的 `secure` 字段在 RN 平台不支持。

### 错误 {#error}

| 错误码 | 错误信息 | 说明 | 支付宝 | RN |
| --- | --- | --- | --- | --- |
| 0 | ok | 正常 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| 12000 | not init | 未先调用 startWifi 接口 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| 12001 | system not support | 当前系统不支持相关能力 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| 12002 | password error Wi-Fi | 密码错误 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12003 | connection timeout | 连接超时, 仅 Android 支持 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12004 | duplicate request | 重复连接 Wi-Fi | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12005 | wifi not turned on | Android 特有，未打开 Wi-Fi 开关 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| 12006 | gps not turned on | Android 特有，未打开 GPS 定位开关 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12007 | user denied | 用户拒绝授权链接 Wi-Fi | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12008 | invalid SSID | 无效 SSID | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12009 | system config err | 系统运营商配置拒绝连接 Wi-Fi | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12010 | system internal error | 系统其他错误，需要在 errmsg 打印具体的错误原因 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12011 | weapp in background | 应用在后台无法配置 Wi-Fi | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12013 | wifi config may be expired | 系统保存的 Wi-Fi 配置过期，建议忘记 Wi-Fi 后重试，仅 Android 支持 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| 12014 | invalid WEP / WPA password | iOS 特有，无效的 WEP / WPA 密码 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
