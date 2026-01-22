## mpx.arrayBufferToBase64(ArrayBuffer arrayBuffer)
<font color="#fa5151" style="font-weight:bold;" size="2">微信小程序从基础库 <font style="color: #576b95;">2.4.0</font> 开始，该接口停止维护</font>

将 ArrayBuffer 对象转成 Base64 字符串

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.arrayBufferToBase64.html)

### 参数
**ArrayBuffer arrayBuffer**\
要转换成 Base64 字符串的 ArrayBuffer 对象

### 返回值
**string**\
Base64 字符串

### 示例代码
```js
const arrayBuffer = new Uint8Array([11, 22, 33])
const base64 = mpx.arrayBufferToBase64(arrayBuffer)
```