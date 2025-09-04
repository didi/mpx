## mpx.hideLoading(Object object)

隐藏 loading 提示框

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideLoading.html)

### 参数
**Object object**

| 属性        | 类型     | 默认值 | 必填 | 说明                                               | 最低版本 |
|-------------|----------|--------|------|----------------------------------------------------|----------|
| noConflict  | boolean  | false  | 否   | 目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性 | 2.22.1   |
| success     | function |        | 否   | 接口调用成功的回调函数                             |          |
| fail        | function |        | 否   | 接口调用失败的回调函数                             |          |
| complete    | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）    |          |

