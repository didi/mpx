## mpx.canvasGetImageData(Object object, Object this)

获取 canvas 区域隐含的像素数据。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasGetImageData.html)

### 参数
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| canvasId | string | - | 是 | 画布标识，传入 canvas 组件的 canvas-id 属性 |
| x | number | - | 是 | 将要被提取的图像数据矩形区域的左上角横坐标 |
| y | number | - | 是 | 将要被提取的图像数据矩形区域的左上角纵坐标 |
| width | number | - | 是 | 将要被提取的图像数据矩形区域的宽度 |
| height | number | - | 是 | 将要被提取的图像数据矩形区域的高度 |
| success | function | - | 否 | 接口调用成功的回调函数 |
| fail | function | - | 否 | 接口调用失败的回调函数 |
| complete | function | - | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） |

### object.success 回调函数
### 参数
**Object res**
| 属性 | 类型 | 说明 |
| --- | --- | --- |
| width | number | 图像数据矩形的宽度 |
| height | number | 图像数据矩形的高度 |
| data | Uint8ClampedArray | 图像像素点数据，一维数组，每四项表示一个像素点的 rgba |

**Object this**\
在自定义组件下，当前组件实例的this，以操作组件内 canvas 组件



### 示例代码

```js
mpx.canvasGetImageData({
  canvasId: 'myCanvas',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  success(res) {
    console.log(res.width) // 100
    console.log(res.height) // 100
    console.log(res.data instanceof Uint8ClampedArray) // true
    console.log(res.data.length) // 100 * 100 * 4
  }
})
```
