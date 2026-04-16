## mpx.getImageInfo(Object object)

获取图片信息。网络图片需先配置download域名才能生效。

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.getImageInfo.html)

### 参数

**Object object**


| 属性     | 类型     | 默认值 | 必填 | 说明                                         |
| -------- | -------- | ------ | ---- | -------------------------------------------- |
| src      | string   |        | 是   | 图片的路径，支持网络路径、本地路径、代码包路径 |
| success  | function |        | 否   | 接口调用成功的回调函数                       |
| fail     | function |        | 否   | 接口调用失败的回调函数                       |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

**object.success 回调函数**

**参数**

**Object res**



<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
      <th>最低版本</th>
      <th>支付宝</th>
      <th>RN</th>
      <th>Web</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>width</td>
      <td>number</td>
      <td>图片原始宽度，单位px。不考虑旋转。</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>height</td>
      <td>number</td>
      <td>图片原始高度，单位px。不考虑旋转。</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>path</td>
      <td>string</td>
      <td>图片的本地路径</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>orientation</td>
      <td>string</td>
      <td>拍照时设备方向，合法值见下表</td>
      <td>1.9.90</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>up</td><td>默认方向（手机横持拍照），对应 Exif 中的 1。或无 orientation 信息。</td></tr>
            <tr><td>up-mirrored</td><td>同 up，但镜像翻转，对应 Exif 中的 2</td></tr>
            <tr><td>down</td><td>旋转180度，对应 Exif 中的 3</td></tr>
            <tr><td>down-mirrored</td><td>同 down，但镜像翻转，对应 Exif 中的 4</td></tr>
            <tr><td>left-mirrored</td><td>同 left，但镜像翻转，对应 Exif 中的 5</td></tr>
            <tr><td>right</td><td>顺时针旋转90度，对应 Exif 中的 6</td></tr>
            <tr><td>right-mirrored</td><td>同 right，但镜像翻转，对应 Exif 中的 7</td></tr>
            <tr><td>left</td><td>逆时针旋转90度，对应 Exif 中的 8</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>type</td>
      <td>string</td>
      <td>图片格式，合法值见下表</td>
      <td>1.9.90</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>unknown</td><td>未知格式</td></tr>
            <tr><td>jpeg</td><td>jpeg压缩格式</td></tr>
            <tr><td>png</td><td>png压缩格式</td></tr>
            <tr><td>gif</td><td>gif压缩格式</td></tr>
            <tr><td>tiff</td><td>tiff压缩格式</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>


### 示例代码
```js
mpx.getImageInfo({
  src: 'images/a.jpg',
  success (res) {
    console.log(res.width)
    console.log(res.height)
  }
})

mpx.chooseImage({
  success (res) {
    mpx.getImageInfo({
      src: res.tempFilePaths[0],
      success (res) {
        console.log(res.width)
        console.log(res.height)
      }
    })
  }
})
```