## mpx.getStorageSync(string key)

从本地缓存中同步获取指定 key 的内容。

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html)


### 示例代码

```js
try {
  var value = mpx.getStorageSync('key')
  if (value) {
    // Do something with return value
  }
} catch (e) {
  // Do something when catch error
}
```