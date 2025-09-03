## mpx.setStorageSync(string key, any data)

将数据存储在本地缓存中指定的 key 中。

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html)


### 示例代码

```js
try {
  mpx.setStorageSync('key', 'value')
} catch (e) { }
```