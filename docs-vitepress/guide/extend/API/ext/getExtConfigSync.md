## mpx.getExtConfigSync()

mpx.getExtConfig 的同步版本

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ext/wx.getExtConfigSync.html)

### 参数

**Object**

第三方平台自定义的数据


### Tips
本接口暂时无法通过 `mpx.canIUse` 判断是否兼容，开发者需要自行判断 `mpx.getExtConfigSync` 是否存在来兼容

```js
let extConfig = mpx.getExtConfigSync? mpx.getExtConfigSync(): {}
console.log(extConfig)
```