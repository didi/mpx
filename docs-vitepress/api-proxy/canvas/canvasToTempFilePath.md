## mpx.canvasToTempFilePath(Object object, Object this)

把当前画布指定区域的内容导出生成指定大小的图片。在 draw() 回调里调用该方法才能保证图片导出成功。

支持情况： 微信、支付宝

<thead>
  <tr>
    <th>属性</th>
    <th>类型</th>
    <th>默认值</th>
    <th>必填</th>
    <th>说明</th>
    <th>最低版本</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>x</td>
    <td>number</td>
    <td>0</td>
    <td>否</td>
    <td>指定的画布区域的左上角横坐标</td>
    <td>1.2.0</td>
  </tr>
  <tr>
    <td>y</td>
    <td>number</td>
    <td>0</td>
    <td>否</td>
    <td>指定的画布区域的左上角纵坐标</td>
    <td>1.2.0</td>
  </tr>
  <tr>
    <td>width</td>
    <td>number</td>
    <td> </td>
    <td> </td>
    <td>canvas宽度-x</td>
    <td> </td>
  </tr>
</tbody>
<table>
  <tr>
    <td>指定的画布区域的宽度</td>
    <td>1.2.0</td>
  </tr>
  <tr>
    <td>height</td>
    <td>number</td>
    <td>canvas高度-y</td>
    <td>否</td>
    <td>指定的画布区域的高度</td>
    <td>1.2.0</td>
  </tr>
  <tr>
    <td>destWidth</td>
    <td>number</td>
    <td>width*屏幕像素密度</td>
    <td>否</td>
    <td>输出的图片的宽度</td>
    <td>1.2.0</td>
  </tr>
  <tr>
    <td>destHeight</td>
    <td>number</td>
    <td>height*屏幕像素密度</td>
    <td>否</td>
    <td>输出的图片的高度</td>
    <td>1.2.0</td>
  </tr>
  <tr>
    <td>canvasId</td>
    <td>string</td>
    <td></td>
    <td>否</td>
    <td>画布标识，传入 canvas 组件的 canvas-id</td>
    <td></td>
  </tr>
  <tr>
    <td>canvas</td>
    <td>Object</td>
    <td></td>
    <td>否</td>
    <td>画布标识，传入 canvas 组件实例 （canvas type="2d" 时使用该属性）。</td>
    <td></td>
  </tr>
  <tr>
    <td>fileType</td>
    <td>string</td>
    <td>png</td>
    <td>否</td>
    <td>目标文件的类型</td>
    <td>1.7.0</td>
  </tr>
  <tr>
    <td colspan="6">
      <table style="width:100%">
        <tr>
          <th>合法值</th>
          <th>说明</th>
        </tr>
        <tr>
          <td>jpg</td>
          <td>jpg 图片</td>
        </tr>
        <tr>
          <td>png</td>
          <td>png 图片</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td>quality</td>
    <td>number</td>
    <td></td>
    <td>否</td>
    <td>图片的质量，目前仅对 jpg 有效。取值范围为 (0, 1]，不在范围内时当作 1.0 处理。</td>
    <td>1.7.0</td>
  </tr>
  <tr>
    <td>success</td>
    <td>function</td>
    <td></td>
    <td>否</td>
    <td>接口调用成功的回调函数</td>
    <td></td>
  </tr>
  <tr>
    <td>fail</td>
    <td>function</td>
    <td></td>
    <td>否</td>
    <td>接口调用失败的回调函数</td>
    <td></td>
  </tr>
  <tr>
    <td>complete</td>
    <td>function</td>
    <td></td>
    <td>否</td>
    <td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
    <td></td>
  </tr>
</table>

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
