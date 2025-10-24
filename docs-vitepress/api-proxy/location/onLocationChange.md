## mpx.onLocationChange(function listener)

监听实时地理位置变化事件，需结合 wx.startLocationUpdateBackground、wx.startLocationUpdate使用。

支持情况： 微信

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.onLocationChange.html)

### 参数

**function listener**\
实时地理位置变化事件的监听函数

**参数**

**Object res**


| 属性              | 类型   | 说明                                                         | 最低版本 |
| ----------------- | ------ | ------------------------------------------------------------ | -------- |
| latitude          | number | 纬度，范围为 -90~90，负数表示南纬。使用 gcj02 国测局坐标系    |          |
| longitude         | number | 经度，范围为 -180~180，负数表示西经。使用 gcj02 国测局坐标系  |          |
| speed             | number | 速度，单位 m/s                                               |          |
| accuracy          | number | 位置的精确度                                                 |          |
| altitude          | number | 高度，单位 m                                                 | 1.2.0    |
| verticalAccuracy  | number | 垂直精度，单位 m（Android 无法获取，返回 0）                 | 1.2.0    |
| horizontalAccuracy| number | 水平精度，单位 m                                             | 1.2.0    |


### 示例代码

```js
const _locationChangeFn = function(res) {
  console.log('location change', res)
 }
 mpx.onLocationChange(_locationChangeFn)
 mpx.offLocationChange(_locationChangeFn)
```