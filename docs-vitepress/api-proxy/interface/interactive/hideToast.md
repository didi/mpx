## mpx.hideToast(Object object)

隐藏消息提示框

支持情况： 微信、支付宝、web、RN、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideToast.html)

### 参数
**Object object**

| 属性        | 类型     | 默认值 | 必填 | 说明                                         | 最低版本 | 支付宝 | RN/harmony | web |
|-------------|----------|--------|------|----------------------------------------------|----------|--------|------------|-----|
| noConflict  | boolean  | false  | 否   | 目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性 | 2.22.1    | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success     | function |        | 否   | 接口调用成功的回调函数                       |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail        | function |        | 否   | 接口调用失败的回调函数                       |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete    | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |

