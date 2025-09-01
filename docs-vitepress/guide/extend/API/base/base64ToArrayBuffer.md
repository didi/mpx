## mpx.base64ToArrayBuffer(string base64)
<font color="#fa5151" style="font-weight:bold;" size="2">微信小程序从基础库 <font style="color: #576b95;">2.4.0</font> 开始，该接口停止维护</font>

将 Base64 字符串转成 ArrayBuffer 对象

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.base64ToArrayBuffer.html)

### 参数
**string base64**\
要转化成 ArrayBuffer 对象的 Base64 字符串

### 返回值
**ArrayBuffer**\
ArrayBuffer 对象

### 示例代码
```js
const base64 = 'CxYh'
const arrayBuffer = mpx.base64ToArrayBuffer(base64)
```