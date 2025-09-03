## mpx.reLaunch(Object object)

关闭所有页面，打开到应用内的某个页面

支持情况： 微信、支付宝、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.reLaunch.html)

### 参数

**Object object**

| 属性      | 类型     | 默认值 | 必填 | 说明 |
|-----------|----------|--------|------|------|
| url       | string   |        | 是   | 需要跳转的应用内页面路径 (代码包路径)，路径后可以带参数。参数与路径之间使用?分隔，参数键与参数值用=相连，不同参数用&分隔；如 'path?key=value&key2=value2' |
| success   | function |        | 否   | 接口调用成功的回调函数 |
| fail      | function |        | 否   | 接口调用失败的回调函数 |
| complete  | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

### 示例代码
```js
mpx.reLaunch({
  url: 'test?id=1'
})
```