## mpx.hideKeyboard(Object object)

在input、textarea等focus拉起键盘之后，手动调用此接口收起键盘

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/keyboard/wx.hideKeyboard.html)

### 参数

**Object object**


| 属性     | 类型     | 默认值 | 必填 | 说明                                         |
| -------- | -------- | ------ | ---- | -------------------------------------------- |
| success  | function |        | 否   | 接口调用成功的回调函数                       |
| fail     | function |        | 否   | 接口调用失败的回调函数                       |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

### 示例代码
```js
mpx.hideKeyboard({
  complete: res => {
    console.log('hideKeyboard res', res)
  }
})
```