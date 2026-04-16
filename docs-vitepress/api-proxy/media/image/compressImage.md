## mpx.compressImage(Object object)

压缩图片接口，可选压缩质量。iOS 仅支持压缩 JPG 格式图片。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.compressImage.html)

### 参数

**Object object**

| 属性              | 类型     | 默认值 | 必填 | 说明                                                                 | 最低版本 |
| ----------------- | -------- | ------ | ---- | -------------------------------------------------------------------- | -------- |
| src               | string   |        | 是   | 图片路径，图片的路径，支持本地路径、代码包路径                        |          |
| quality           | number   | 80     | 否   | 压缩质量，范围0～100，数值越小，质量越低，压缩率越高（仅对jpg有效）。 |          |
| compressedWidth   | number   |        | 否   | 压缩后图片的宽度，单位为px，若不填写则默认以compressedHeight为准等比缩放。 | 2.26.0   |
| compressedHeight  | number   |        | 否   | 压缩后图片的高度，单位为px，若不填写则默认以compressedWidth为准等比缩放 | 2.26.0   |
| success           | function |        | 否   | 接口调用成功的回调函数                                               |          |
| fail              | function |        | 否   | 接口调用失败的回调函数                                               |          |
| complete          | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                     |

**object.success 回调函数**

**参数**

**Object res**


| 属性         | 类型   | 说明                           |
| ------------ | ------ | ------------------------------ |
| tempFilePath | string | 压缩后图片的临时文件路径 (本地路径) |


### 示例代码
```js
mpx.compressImage({
  src: '', // 图片路径
  quality: 80 // 压缩质量
})
```