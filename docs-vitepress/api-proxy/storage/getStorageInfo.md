## mpx.getStorageInfo(Object object)

异步获取当前storage的相关信息。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageInfo.html)

### 参数

**Object object**

| 属性    | 类型     | 默认值 | 必填 | 说明                 |
| ------- | -------- | ------ | ---- | -------------------- |
| success | function |        | 否   | 接口调用成功的回调函数 |
| fail    | function |        | 否   | 接口调用失败的回调函数 |
| complete| function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

**object.success 回调函数**

**参数**

**Object res**

| 属性       | 类型           | 说明                           | 支付宝 | RN | web |
| ---------- | -------------- | ------------------------------ | ------ | ---------- | --- |
| keys       | Array&lt;string&gt; | 当前 storage 中所有的 key      | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| currentSize| number         | 当前占用的空间大小, 单位 KB    | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| limitSize  | number         | 限制的空间大小，单位 KB         | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |


### 示例代码
```js
mpx.getStorageInfo({
  success (res) {
    console.log(res.keys)
    console.log(res.currentSize)
    console.log(res.limitSize)
  }
})
```