## [SocketTask](https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/SocketTask.html) mpx.connectSocket(Object object)

创建一个 WebSocket 连接。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html)

### 参数

**Object object**

| 属性                | 类型           | 默认值 | 必填 | 说明                                         | 最低版本 | 支付宝 | RN/harmony | web |
| ------------------- | -------------- | ------ | ---- | -------------------------------------------- | -------- | ------ | ---------- | --- |
| url                 | string         |        | 是   | 开发者服务器 wss 接口地址                    |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| header              | Object         |        | 否   | HTTP Header，Header 中不能设置 Referer        |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| protocols           | Array.&lt;string&gt; |        | 否   | 子协议数组                                   | 1.4.0    | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| tcpNoDelay          | boolean        | false  | 否   | 建立 TCP 连接的时候的 TCP_NODELAY 设置        | 2.4.0    | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| perMessageDeflate   | boolean        | false  | 否   | 是否开启压缩扩展                             | 2.8.0    | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| timeout             | number         |        | 否   | 超时时间，单位为毫秒                         | 2.10.0   | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| forceCellularNetwork| boolean        | false  | 否   | 强制使用蜂窝网络发送请求                     | 2.29.0   | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success             | function       |        | 否   | 接口调用成功的回调函数                       |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail                | function       |        | 否   | 接口调用失败的回调函数                       |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete            | function       |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |


### 返回值
[SocketTask](https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/SocketTask.html)
