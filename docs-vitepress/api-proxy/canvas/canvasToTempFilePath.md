## mpx.canvasToTempFilePath(Object object, Object this)

把当前画布指定区域的内容导出生成指定大小的图片。在 draw() 回调里调用该方法才能保证图片导出成功。

支持情况： 微信、支付宝

| 属性       | 类型     | 默认值                | 必填 | 说明                                                                          | 最低版本 |
| ---------- | -------- | --------------------- | ---- | ----------------------------------------------------------------------------- | -------- |
| x          | number   | 0                     | 否   | 指定的画布区域的左上角横坐标                                                  | 1.2.0    |
| y          | number   | 0                     | 否   | 指定的画布区域的左上角纵坐标                                                  | 1.2.0    |
| width      | number   | canvas 宽度 - x       |      | 指定的画布区域的宽度                                                          | 1.2.0    |
| height     | number   | canvas 高度 - y       | 否   | 指定的画布区域的高度                                                          | 1.2.0    |
| destWidth  | number   | width × 屏幕像素密度  | 否   | 输出的图片的宽度                                                              | 1.2.0    |
| destHeight | number   | height × 屏幕像素密度 | 否   | 输出的图片的高度                                                              | 1.2.0    |
| canvasId   | string   |                       | 否   | 画布标识，传入 canvas 组件的 canvas-id                                        |          |
| canvas     | Object   |                       | 否   | 画布标识，传入 canvas 组件实例（canvas type="2d" 时使用该属性）。             |          |
| fileType   | string   | png                   | 否   | 目标文件的类型，合法值：`png`、`jpg`                                          | 1.7.0    |
| quality    | number   |                       | 否   | 图片的质量，目前仅对 jpg 有效。取值范围为 (0, 1]，不在范围内时当作 1.0 处理。 | 1.7.0    |
| success    | function |                       | 否   | 接口调用成功的回调函数                                                        |          |
| fail       | function |                       | 否   | 接口调用失败的回调函数                                                        |          |
| complete   | function |                       | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                              |          |

### object.success 回调函数

### 参数

**Object res**

| 属性         | 类型   | 说明                          |
| ------------ | ------ | ----------------------------- |
| tempFilePath | string | 生成文件的临时路径 (本地路径) |

**Object this**\
在自定义组件下，当前组件实例的 this，以操作组件内 canvas 组件

### 示例代码

```js
mpx.canvasToTempFilePath({
  x: 100,
  y: 200,
  width: 50,
  height: 50,
  destWidth: 100,
  destHeight: 100,
  canvasId: "myCanvas",
  success(res) {
    console.log(res.tempFilePath)
  },
})
```
