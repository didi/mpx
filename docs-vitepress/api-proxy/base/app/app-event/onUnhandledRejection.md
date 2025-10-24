## mpx.onUnhandledRejection(function listener)

监听未处理的 Promise 拒绝事件。该事件与 App.onUnhandledRejection 的回调时机与参数一致。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html)

### 参数

**function listener**

未处理的 Promise 拒绝事件的监听函数

**参数**


**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| reason | string | 拒绝原因，一般是一个 Error 对象 |
| promise | Promise.&lt;any&gt; | 被拒绝的 Promise 对象 |
