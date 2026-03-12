## CameraContext.startRecord(Object object)

开始录像

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.startRecord.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 | 最低版本 | 支付宝 | RN |
| --- | --- | --- | --- | --- | --- | --- | --- |
| timeoutCallback | function | | 否 | 超过录制时长上限时会结束录像并触发此回调，录像异常退出时也会触发此回调 | | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| timeout | number | 30 | 否 | 录制时长上限，单位为秒，最长不能超过 5 分钟 | 2.22.0 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| selfieMirror | boolean | true | 否 | 是否开启镜像 | 2.22.0 | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success | function | | 否 | 接口调用成功的回调函数 | | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail | function | | 否 | 接口调用失败的回调函数 | | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete | function | | 否 | 接口调用结束的回调函数（调用成功、失败都会执行）| | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |

### object.timeoutCallback 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 | 支付宝 | RN |
| --- | --- | --- | --- | --- |
| tempThumbPath | string | 封面图片文件的临时路径 (本地路径) | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| tempVideoPath | string | 视频的文件的临时路径 (本地路径) | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
