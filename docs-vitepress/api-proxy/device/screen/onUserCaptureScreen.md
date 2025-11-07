## mpx.onUserCaptureScreen(function listener)

监听用户主动截屏事件。用户使用系统截屏按键截屏时触发，只能注册一个监听

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.onUserCaptureScreen.html)

### 参数

**function listener**

用户主动截屏事件的监听函数

**参数**

**Object res**

| 属性   | 类型    | 说明                                                                 | 最低版本 | 支付宝 |
| ------ | ------- | -------------------------------------------------------------------- | -------- | ------ |
| query  | string  | 支持开发者自定义一键打开小程序时的 query                              | 3.3.0    | <span style="color: red; font-weight: bold;">✗</span> |
| promise| promise | 如果该参数存在，则其它的参数将会以 resolve 结果为准，如果一秒内不 resolve，分享会使用上面传入的默认参数 | 3.3.0    | <span style="color: red; font-weight: bold;">✗</span> |

### 示例代码

```js
mpx.onUserCaptureScreen(function (res) {
  console.log('用户截屏了')
      return {
          query: "parameter=test", // 通过截屏图片打开小程序的query参数
          promise: new Promise((resolve) => { // 通过promise延时传递小程序的query参数
                  setTimeout(() => {
                      resolve({
                          query: "parameter=test2",
                      })
                  }, 1000) // 在1秒内对query进行解析
              })
      }
  }
)
```
