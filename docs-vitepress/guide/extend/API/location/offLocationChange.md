## mpx.offLocationChange(function listener)

移除实时地理位置变化事件的监听函数

支持情况： 微信

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.offLocationChange.html)

### 参数

**function listener**\
onLocationChange 传入的监听函数。不传此参数则移除所有监听函数。

### 示例代码
```js
const listener = function (res) { console.log(res) }

mpx.onLocationChange(listener)
mpx.offLocationChange(listener) // 需传入与监听时同一个的函数对象
```