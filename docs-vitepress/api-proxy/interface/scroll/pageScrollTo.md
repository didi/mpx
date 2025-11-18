## mpx.pageScrollTo(Object object)

将页面滚动到目标位置，支持选择器和滚动距离两种方式定位

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/scroll/wx.pageScrollTo.html)

### 参数
**Object object**

| 属性        | 类型     | 默认值 | 必填 | 说明                                                                 | 最低版本 | 支付宝 | web |
|-------------|----------|--------|------|----------------------------------------------------------------------|----------|--------|-----|
| scrollTop   | number   |        | 否   | 滚动到页面的目标位置，单位 px                                        |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| duration    | number   | 300    | 否   | 滚动动画的时长，单位 ms                                             |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| selector    | string   |        | 否   | 选择器                                                              | 2.7.3    | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| offsetTop   | number   |        | 否   | 偏移距离，需要和 selector 参数搭配使用，可以滚动到 selector 加偏移距离的位置，单位 px | 2.23.1   | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: red; font-weight: bold;'>✗</span> |
| success     | function |        | 否   | 接口调用成功的回调函数                                               |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| fail        | function |        | 否   | 接口调用失败的回调函数                                               |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| complete    | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                      |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |



### 示例代码

```js
mpx.pageScrollTo({
  scrollTop: 0,
  duration: 300
})
```
