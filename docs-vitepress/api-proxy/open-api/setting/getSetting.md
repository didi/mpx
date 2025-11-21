## mpx.getSetting(Object object)

获取用户的当前设置。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/setting/wx.getSetting.html)

### 参数

**Object object**

| 属性              | 类型     | 默认值 | 必填 | 说明                                                                 | 最低版本 |
| ----------------- | -------- | ------ | ---- | -------------------------------------------------------------------- | -------- |
| withSubscriptions | Boolean  | false  | 否   | 是否同时获取用户订阅消息的订阅状态，默认不获取。注意：withSubscriptions 只返回用户勾选过订阅面板中的“总是保持以上选择，不再询问”的订阅消息。 | 2.10.1   |
| success           | function |        | 否   | 接口调用成功的回调函数                                               |          |
| fail              | function |        | 否   | 接口调用失败的回调函数                                               |          |
| complete          | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                     |          |

**object.success 回调函数**

**参数**

**Object res**

| 属性                   | 类型                | 说明                                                         | 最低版本 | 支付宝 |
| ---------------------- | ------------------- | ------------------------------------------------------------ | -------- | ------ |
| authSetting            | AuthSetting         | 用户授权结果                                                 |          | <span style="color: green; font-weight: bold;">✓</span> |
| subscriptionsSetting   | SubscriptionsSetting| 用户订阅消息设置，接口参数withSubscriptions值为true时才会返回。 | 2.10.1   | <span style="color: green; font-weight: bold;">✓</span> |
| miniprogramAuthSetting | AuthSetting         | 在插件中调用时，当前宿主小程序的用户授权结果                 |          | <span style="color: red; font-weight: bold;">✗</span> |


### 示例代码

```js
mpx.getSetting({
  success (res) {
    console.log(res.authSetting)
  }
})
```