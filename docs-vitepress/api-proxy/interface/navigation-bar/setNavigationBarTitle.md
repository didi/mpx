## mpx.setNavigationBarTitle(Object object)

动态设置当前页面的标题

支持情况： 微信、支付宝、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarTitle.html)

### 参数
**Object object**

| 属性    | 类型     | 默认值 | 必填 | 说明                 |
| ------- | -------- | ------ | ---- | -------------------- |
| title   | string   |        | 是   | 页面标题             |
| success | function |        | 否   | 接口调用成功的回调函数 |
| fail    | function |        | 否   | 接口调用失败的回调函数 |
| complete| function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

### 示例代码

```js
mpx.setNavigationBarTitle({
  title: '当前页面'
})
```