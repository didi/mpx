## mpx.getClipboardData(Object object)

获取系统剪贴板的内容

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.getClipboardData.html)

### 参数

**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明                                         |
| -------- | -------- | ------ | ---- | -------------------------------------------- |
| success  | function |        | 否   | 接口调用成功的回调函数                       |
| fail     | function |        | 否   | 接口调用失败的回调函数                       |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

**object.success 回调函数**

**参数**

**Object object**

| 属性 | 类型   | 说明         |
| ---- | ------ | ------------ |
| data | string | 剪贴板的内容 |

### 示例代码
```js
mpx.getClipboardData({
  success (res){
    console.log(res.data)
  }
})
```