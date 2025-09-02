## mpx.getLocation(Object object)

获取当前的地理位置、速度。当用户离开小程序后，此接口无法调用。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html)

### 参数

**Object object**


| 属性                   | 类型     | 默认值 | 必填 | 说明                                                                 | 最低版本 | 支付宝 | RN | Web |
| ---------------------- | -------- | ------ | ---- | -------------------------------------------------------------------- | -------- | ------ |----|-----|
| type                   | string   | wgs84  | 否   | wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标         |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| altitude               | boolean  | false  | 否   | 传入 true 会返回高度信息，由于获取高度需要较高精确度，会减慢接口返回速度 | 1.6.0    | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| isHighAccuracy         | boolean  | false  | 否   | 开启高精度定位                                                      | 2.9.0    | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| highAccuracyExpireTime | number   |        | 否   | 高精度定位超时时间(ms)，指定时间内返回最高精度，该值3000ms以上高精度定位才有效果 | 2.9.0    | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success                | function |        | 否   | 接口调用成功的回调函数                                               |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail                   | function |        | 否   | 接口调用失败的回调函数                                               |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete               | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                     |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |

**object.success 回调函数**

**参数**

**Object res**



| 属性              | 类型   | 说明                                                         | 最低版本 | 支付宝 | RN | Web |
| ----------------- | ------ | ------------------------------------------------------------ | -------- | ------ |----|-----|
| latitude          | number | 纬度，范围为 -90~90，负数表示南纬                            |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| longitude         | number | 经度，范围为 -180~180，负数表示西经                          |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| speed             | number | 速度，单位 m/s                                               |          | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| accuracy          | number | 位置的精确度，反应与真实位置之间的接近程度，可以理解成10即与真实位置相差10m，越小越精确 |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| altitude          | number | 高度，单位 m                                                 | 1.2.0    | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| verticalAccuracy  | number | 垂直精度，单位 m（Android 无法获取，返回 0）                 | 1.2.0    | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| horizontalAccuracy| number | 水平精度，单位 m                                             | 1.2.0    | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |



### 示例代码
```js
mpx.getLocation({
 type: 'wgs84',
 success (res) {
   const latitude = res.latitude
   const longitude = res.longitude
   const speed = res.speed
   const accuracy = res.accuracy
 }
})
```