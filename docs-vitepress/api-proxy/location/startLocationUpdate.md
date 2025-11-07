## mpx.startLocationUpdate(Object object)

开启小程序进入前台时接收位置消息。

支持情况： 微信

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.startLocationUpdate.html)

### 参数

**Object object**


| 属性     | 类型     | 默认值      | 必填 | 说明                                         |
| -------- | -------- | ----------- | ---- | -------------------------------------------- |
| type     | string   | 坐标，gcj02 | 否   | wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标 |
| success  | function |             | 否   | 接口调用成功的回调函数                       |
| fail     | function |             | 否   | 接口调用失败的回调函数                       |
| complete | function |             | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |
