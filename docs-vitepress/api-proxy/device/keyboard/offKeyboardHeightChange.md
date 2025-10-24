## mpx.offKeyboardHeightChange(function listener)

移除键盘高度变化事件的监听函数

支持情况： 微信、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/keyboard/wx.offKeyboardHeightChange.html)

### 参数

**function listener**\
onKeyboardHeightChange 传入的监听函数。不传此参数则移除所有监听函数。

### 示例代码
```js
const listener = function (res) { console.log(res) }

mpx.onKeyboardHeightChange(listener)
mpx.offKeyboardHeightChange(listener) // 需传入与监听时同一个的函数对象
```