## mpx.redirectTo(Object object)

关闭当前页面，跳转到应用内的某个页面。但是不允许跳转到 tabbar 页面。

支持情况： 微信、支付宝、RN、web

RN 端命中 [preload](./preload.md) 预加载的同路径页面时，复用该路由替换当前页，页面参数以本次 `redirectTo` 的 query 为准，不合并预加载参数；其他页面及预加载记录保留。未命中或当前导航器不支持预加载时，保持普通替换行为。

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.redirectTo.html)

### 参数 {#parameters}

**Object object**

| 属性      | 类型     | 默认值 | 必填 | 说明 |
|-----------|----------|--------|------|------|
| url       | string   |        | 是   | 需要跳转的应用内非 tabBar 的页面的路径 (代码包路径), 路径后可以带参数。参数与路径之间使用 ? 分隔，参数键与参数值用 = 相连，不同参数用 & 分隔；如 'path?key=value&key2=value2' |
| success   | function |        | 否   | 接口调用成功的回调函数 |
| fail      | function |        | 否   | 接口调用失败的回调函数 |
| complete  | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |


### 示例代码 {#example-code}
```js
mpx.redirectTo({
  url: 'test?id=1'
})
```