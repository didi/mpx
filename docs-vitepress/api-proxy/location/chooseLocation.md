## mpx.chooseLocation(Object object)

打开地图选择位置。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.chooseLocation.html)

### 参数

**Object object**


| 属性      | 类型     | 默认值 | 必填 | 说明                                 | 最低版本 |
| --------- | -------- | ------ | ---- | ------------------------------------ | -------- |
| latitude  | number   |        | 否   | 目标地纬度                           | 2.9.0    |
| longitude | number   |        | 否   | 目标地经度                           | 2.9.0    |
| success   | function |        | 否   | 接口调用成功的回调函数               |          |
| fail      | function |        | 否   | 接口调用失败的回调函数               |          |
| complete  | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |          |

**object.success 回调函数**

**参数**

**Object res**


| 属性      | 类型   | 说明                                                                 |
| --------- | ------ | -------------------------------------------------------------------- |
| name      | string | 位置名称                                                             |
| address   | string | 详细地址                                                             |
| latitude  | number | 纬度，浮点数，范围为-90~90，负数表示南纬。使用 gcj02 国测局坐标系     |
| longitude | number | 经度，浮点数，范围为-180~180，负数表示西经。使用 gcj02 国测局坐标系   |
