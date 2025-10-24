## mpx.stopLocationUpdate(Object object)

关闭监听实时位置变化，前后台都停止消息接收

支持情况： 微信

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.stopLocationUpdate.html)

### 参数

**Object object**


| 属性     | 类型     | 默认值 | 必填 | 说明                                         |
| -------- | -------- | ------ | ---- | -------------------------------------------- |
| success  | function |        | 否   | 接口调用成功的回调函数                       |
| fail     | function |        | 否   | 接口调用失败的回调函数                       |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |
