## mpx.offWindowResize(function listener)

移除窗口尺寸变化事件的监听函数

支持情况： 微信、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.offWindowResize.html)

### 参数

**function listener**\
onWindowResize 传入的监听函数。不传此参数则移除所有监听函数。

### 示例代码

```js
const listener = function (res) { console.log(res) }

mpx.onWindowResize(listener)
mpx.offWindowResize(listener) // 需传入与监听时同一个的函数对象
```
