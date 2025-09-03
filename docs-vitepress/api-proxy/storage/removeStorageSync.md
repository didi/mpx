## mpx.removeStorageSync(string key)

从本地缓存中移除指定 key，mpx.removeStorage 的同步版本。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorageSync.html)


### 示例代码
```js
try {
  mpx.removeStorageSync('key')
} catch (e) {
  // Do something when catch error
}
```