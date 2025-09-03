## mpx.setScreenBrightness(Object object)

设置屏幕亮度

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.setScreenBrightness.html)

### 参数

**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明 |
| -------- | -------- | ------ | ---- | ------------------------------------------------------------ |
| value    | number   |        | 是   | 屏幕亮度值，范围 0 ~ 1，0 最暗，1 最亮。在安卓端支持传入特殊值 -1，表示屏幕亮度跟随系统变化 |
| success  | function |        | 否   | 接口调用成功的回调函数 |
| fail     | function |        | 否   | 接口调用失败的回调函数 |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |
