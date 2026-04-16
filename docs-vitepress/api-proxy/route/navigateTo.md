## mpx.navigateTo(Object object)

保留当前页面，跳转到应用内的某个页面。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)

### 参数

**Object object**

| 属性         | 类型     | 默认值 | 必填 | 说明 | 支付宝 | RN | web |
|--------------|----------|--------|------|------|--------|------------|-----|
| url          | string   |        | 是   | 需要跳转的应用内非 tabBar 的页面的路径 (代码包路径), 路径后可以带参数。参数与路径之间使用 ? 分隔，参数键与参数值用 = 相连，不同参数用 & 分隔；如 'path?key=value&key2=value2' | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| events       | Object   |        | 否   | 页面间通信接口，用于监听被打开页面发送到当前页面的数据。基础库 2.7.3 开始支持。 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| routeType    | string   |        | 否   | 2.29.2 自定义路由类型，相关文档 自定义路由 | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| routeConfig  | Object   |        | 否   | 3.4.0 自定义路由配置，相关文档 自定义路由 | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| routeOptions | Object   |        | 否   | 3.4.0 自定义路由参数，相关文档 自定义路由 | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success      | function |        | 否   | 接口调用成功的回调函数 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail         | function |        | 否   | 接口调用失败的回调函数 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete     | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |

**object.success 回调函数**

**参数**

**Object res**

| 属性         | 类型         | 说明                     |
|--------------|--------------|--------------------------|
| eventChannel | EventChannel | 和被打开页面进行通信     |



### 示例代码
```js
mpx.navigateTo({
  url: 'test?id=1',
  events: {
    // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
    acceptDataFromOpenedPage: function(data) {
      console.log(data)
    },
    someEvent: function(data) {
      console.log(data)
    }
    ...
  },
  success: function(res) {
    // 通过eventChannel向被打开页面传送数据
    res.eventChannel.emit('acceptDataFromOpenerPage', { data: 'test' })
  }
})

```