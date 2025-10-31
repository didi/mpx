## mpx.onError(function listener)

监听小程序错误事件。如脚本错误或 API 调用报错等。该事件与 App.onError 的回调时机与参数一致。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onError.html)

### 参数

**function listener**

小程序错误事件的监听函数

**参数**


**object error**\
错误

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| message | string | 错误信息，包含堆栈 |