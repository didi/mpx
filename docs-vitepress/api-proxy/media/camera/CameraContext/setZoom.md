## CameraContext.setZoom(Object object)

设置缩放级别

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.setZoom.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| zoom | number | | 是 | 缩放级别，范围[1, maxZoom]。zoom 可取小数，精确到小数后一位。maxZoom 可在 bindinitdone 返回值中获取。|
| success | function | | 否 | 接口调用成功的回调函数 |
| fail | function | | 否 | 接口调用失败的回调函数 |
| complete | function | | 否 | 接口调用结束的回调函数（调用成功、失败都会执行）|

### object.success 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 | 支付宝 | RN |
| --- | --- | --- | --- | --- |
| zoom | number | 实际设置的缩放级别。由于系统限制，某些机型可能无法设置成指定值，会改用最接近的可设值。| <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
