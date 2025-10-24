## mpx.showLoading(Object object)

显示 loading 提示框。需主动调用 mpx.hideLoading 才能关闭提示框

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showLoading.html)

### 参数
**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明                                   |
|----------|----------|--------|------|----------------------------------------|
| title    | string   |        | 是   | 提示的内容                             |
| mask     | boolean  | false  | 否   | 是否显示透明蒙层，防止触摸穿透         |
| success  | function |        | 否   | 接口调用成功的回调函数                 |
| fail     | function |        | 否   | 接口调用失败的回调函数                 |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |


### 示例代码

```js
mpx.showLoading({
  title: '加载中',
})

setTimeout(function () {
  mpx.hideLoading()
}, 2000)
```
