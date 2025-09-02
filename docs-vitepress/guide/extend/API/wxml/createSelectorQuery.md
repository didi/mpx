## [SelectorQuery](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.html) mpx.createSelectorQuery()

返回一个 SelectorQuery 对象实例。在自定义组件或包含自定义组件的页面中，应使用 this.createSelectorQuery() 来代替。

支持情况： 微信、支付宝、web、RN、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createSelectorQuery.html)

### 特别说明RN、harmony中
1. 调用 createSelectorQuery 组件时，需要通过 wx:ref 进行绑定。
2. 调用 createSelectorQuery 方法创建的 SelectorQuery 实例, 在使用过程中需要手动调用实例上的 in 方法来指定组件上下文。


### 返回值
[SelectorQuery](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.html)

### 示例代码
```js
const query = mpx.createSelectorQuery()
query.select('#the-id').boundingClientRect()
query.selectViewport().scrollOffset()
query.exec(function(res){
  res[0].top       // #the-id节点的上边界坐标
  res[1].scrollTop // 显示区域的竖直滚动位置
}).in(this) // RN、harmony需要指定上下文，其他环境不强制
```