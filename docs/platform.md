# 多平台支持

目前mpx支持微信、支付宝、百度小程序，未来也会继续跟进更多的小程序平台。

不同平台上增强的指令也有所差别，文档和代码示例为了方便统一采用微信小程序下的书写方式。

此处提供一份对应表：

指令|微信|支付宝|百度
----|----|----|----
双向绑定|wx:model|a:model|s-model
双向绑定辅助属性|wx:model-prop|a:model-prop|s-model-prop
双向绑定辅助属性|wx:model-event|a:model-event|s-model-event
动态样式绑定|wx:class|a:class|s-class
动态样式绑定|wx:style|a:style|s-style
获取*ML上node节点|wx:ref|a:ref|s-ref

mpx**暂时**没有提供跨平台的能力，所以并没有抹平`原生差异`，比如`props vs properties`，`生命周期差异` 等等。

对于mpx增强小程序的部分，比如watch， computed， pageShow， pageHide， Store 等等，都是一致的。

在使用mpx时，由于支付宝、百度小程序中Page和Component是闭包变量，需要手动传递：

```js
// 微信小程序
mpx.createPage(options)
mpx.createComponent(options)
// 支付宝、百度小程序
mpx.createPage(options, Page)
mpx.createComponent(options, Component)
```
