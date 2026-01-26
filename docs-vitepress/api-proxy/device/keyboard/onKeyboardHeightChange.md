## mpx.onKeyboardHeightChange(function listener)

监听键盘高度变化事件

支持情况： 微信、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/keyboard/wx.onKeyboardHeightChange.html)

### 参数

**function listener**\
键盘高度变化事件的监听函数

**参数**

**Object res**

| 属性  | 类型   | 说明     |
| ----- | ------ | -------- |
| height| number | 键盘高度 |


### 示例代码
```js
mpx.onKeyboardHeightChange(res => {
  console.log(res.height)
})
```