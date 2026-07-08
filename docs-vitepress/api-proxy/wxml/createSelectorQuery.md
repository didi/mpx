## [SelectorQuery](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.html) mpx.createSelectorQuery()

返回一个 SelectorQuery 对象实例。在自定义组件或包含自定义组件的页面中，应使用 this.createSelectorQuery() 来代替。

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createSelectorQuery.html)

### 特别说明 Web/RN 中 {#rn-note}
1. RN 中调用 createSelectorQuery 查询基础节点或自定义组件时，目标节点或组件需要通过空 `wx:ref` 进行绑定。
2. 调用 createSelectorQuery 方法创建的 SelectorQuery 实例，在使用过程中需要手动调用实例上的 in 方法来指定组件上下文。
3. Web 与 RN 查询自定义组件时，默认测量非 virtualHost 场景下的 host 根节点。


### 返回值 {#return-value}
[SelectorQuery](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.html)

### 示例代码 {#example-code}
```js
const query = mpx.createSelectorQuery()
query.select('#the-id').boundingClientRect()
query.selectViewport().scrollOffset()
query.exec(function(res){
  res[0].top       // #the-id节点的上边界坐标
  res[1].scrollTop // 显示区域的竖直滚动位置
}).in(this) // RN需要指定上下文，其他环境不强制
```
