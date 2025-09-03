## mpx.checkSession(Object object)

检查登录态 session_key 是否过期。

支持情况： 微信

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.checkSession.html)

### 参数

**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明                                         |
| -------- | -------- | ------ | ---- | -------------------------------------------- |
| success  | function |        | 否   | 接口调用成功的回调函数                       |
| fail     | function |        | 否   | 接口调用失败的回调函数                       |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |


### 示例代码
```js
mpx.checkSession({
  success () {
    //session_key 未过期，并且在本生命周期一直有效
  },
  fail () {
    // session_key 已经失效，需要重新执行登录流程
    mpx.login() //重新登录
  }
})
```