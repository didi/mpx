# mpx-ant vs mpx的区别

由于原生支付宝小程序和微信小程序存在区别，因此mpx的实现上也存在些差异

### createPage & createComponent

```js
  mpx.createPage(options)
  mpx.createComponent(options)
  // 由于支付宝小程序的Page和Component都属于闭包变量，需要手动传递（微信是全局变量）
  mpxAnt.createPage(options, Page)
  mpxAnt.createComponent(options, Component)
```

### 其他

主要是小程序原生差异，具体可以查看文档，mpx并没有抹平`原生差异`，比如`props vs properties`，`生命周期差异` 等等，对于mpx增强小程序的部分，比如watch， computed， pageShow， pageHide， Store 等等，都是一致的