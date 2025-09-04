## mpx.onLazyLoadError(function listener)

监听小程序异步组件加载失败事件。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onLazyLoadError.html)

### 参数

**function listener**

小程序异步组件加载失败事件的监听函数

**参数**


**Object res**

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| type | string | 'subpackage' 失败类型 |
| subpackage | Array | 异步组件所属的分包 |
| errMsg | string | 详细信息 |
