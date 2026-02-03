## mpx.startPullDownRefresh(Object object)

开始下拉刷新。调用后触发下拉刷新动画，效果与用户手动下拉刷新一致。

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.startPullDownRefresh.html)

### 参数
**Object object**

| 属性      | 类型      | 默认值 | 必填 | 说明                                                         |
|-----------|-----------|--------|------|--------------------------------------------------------------|
| success   | function  |        | 否   | 接口调用成功的回调函数                                       |
| fail      | function  |        | 否   | 接口调用失败的回调函数                                       |
| complete  | function  |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）             |



### 示例代码

```js
mpx.startPullDownRefresh()
```
