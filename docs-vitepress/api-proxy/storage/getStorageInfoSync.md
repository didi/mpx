## mpx.getStorageInfoSync()

异步获取当前storage的相关信息，mpx.getStorageInfo 的同步版本。

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageInfoSync.html)

### 返回值

**Object object**

属性	类型	说明
| 属性       | 类型                | 说明                           |
| 属性       | 类型                | 说明                           | 支付宝 | web |
| ---------- | ------------------- | ------------------------------ | ------ | --- |
| keys       | Array&lt;string&gt;    | 当前 storage 中所有的 key      | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| currentSize| number              | 当前占用的空间大小, 单位 KB    | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| limitSize  | number              | 限制的空间大小，单位 KB         | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |

### 示例代码

```js
try {
  const res = mpx.getStorageInfoSync()
  console.log(res.keys)
  console.log(res.currentSize)
  console.log(res.limitSize)
} catch (e) {
  // Do something when catch error
}
```