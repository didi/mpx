## mpx.setVisualEffectOnCapture(Object object)

设置截屏/录屏时屏幕表现

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.setVisualEffectOnCapture.html)

### 参数

**Object object**

| 属性         | 类型     | 默认值 | 必填 | 说明                                                         |
| ------------ | -------- | ------ | ---- | ------------------------------------------------------------ |
| visualEffect | string   | none   | 否   | 截屏/录屏时的表现，仅支持 none / hidden，传入 hidden 则表示在截屏/录屏时隐藏屏幕 |
| success      | function |        | 否   | 接口调用成功的回调函数                                       |
| fail         | function |        | 否   | 接口调用失败的回调函数                                       |
| complete     | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）             |
