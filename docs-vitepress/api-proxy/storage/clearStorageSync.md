## mpx.clearStorageSync()

清理本地数据缓存，mpx.clearStorage 的同步版本。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.clearStorageSync.html)


### 示例代码
```js
try {
  mpx.clearStorageSync()
} catch(e) {
  // Do something when catch error
}
```