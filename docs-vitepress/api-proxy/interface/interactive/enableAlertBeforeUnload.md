## mpx.disableAlertBeforeUnload(Object object)

关闭小程序页面返回询问对话框。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.disableAlertBeforeUnload.html)

### 参数
**Object object**

| 属性    | 类型     | 默认值 | 必填 | 说明                 |
| ------- | -------- | ------ | ---- | -------------------- |
| success | function |        | 否   | 接口调用成功的回调函数 |
| fail    | function |        | 否   | 接口调用失败的回调函数 |
| complete| function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

### 示例代码

```js
mpx.disableAlertBeforeUnload({
  success: function(res) {
    console.log(res);
  },
  fail: function(err) {
    console.log(err);
  }
})
```
