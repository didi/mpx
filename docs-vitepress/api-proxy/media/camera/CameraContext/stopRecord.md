## CameraContext.stopRecord(Object object)

开始录像

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.stopRecord.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 | 支付宝 | RN |
| --- | --- | --- | --- | --- | --- | --- |
| compressed | boolean | false | 否 | 启动视频压缩，压缩效果同chooseVideo | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success | function | | 否 | 接口调用成功的回调函数 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail | function | | 否 | 接口调用失败的回调函数 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete | function | | 否 | 接口调用结束的回调函数（调用成功、失败都会执行）| <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |

### object.success 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 | 支付宝 | RN |
| --- | --- | --- | --- | --- |
| tempThumbPath | string | 封面图片文件的临时路径 (本地路径) | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| tempVideoPath | string | 视频的文件的临时路径 (本地路径) | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
