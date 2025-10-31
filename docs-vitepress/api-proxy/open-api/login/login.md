## mpx.login(Object object)

调用接口获取登录凭证（code）。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)

### 参数

**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明                                   | 最低版本 |
|----------|----------|--------|------|----------------------------------------|----------|
| timeout  | number   |        | 否   | 超时时间，单位ms                       | 1.9.90   |
| success  | function |        | 否   | 接口调用成功的回调函数                 |          |
| fail     | function |        | 否   | 接口调用失败的回调函数                 |          |
| complete | function |        | 否   | 接口调用结束的回调函数（成功或失败均执行） |          |

**object.success 回调函数**

**参数**

**Object res**

| 属性 | 类型   | 说明 |
|------|--------|------|
| code | string | 用户登录凭证（有效期五分钟）。开发者需要在开发者服务器后台调用 code2Session，使用 code 换取 openid、unionid、session_key 等信息 |

**object.fail 回调函数**

**参数**

**Object err**

| 属性   | 类型   | 说明                                   | 最低版本 |
|--------|--------|----------------------------------------|----------|
| errMsg | String | 错误信息                               |          |
| errno  | Number | errno 错误码，错误码的详细说明参考 Errno错误码 | 2.24.0   |


### 示例代码
```js

mpx.login({
  success (res) {
    if (res.code) {
      //发起网络请求
      mpx.request({
        url: 'https://example.com/onLogin',
        data: {
          code: res.code
        }
      })
    } else {
      console.log('登录失败！' + res.errMsg)
    }
  }
})
```