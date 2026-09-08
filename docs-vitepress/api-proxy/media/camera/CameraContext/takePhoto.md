## CameraContext.takePhoto(Object object)

开始录像

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.takePhoto.html)

### 参数 {#parameters}
**Object object**

<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>默认值</th>
      <th>必填</th>
      <th>说明</th>
      <th>最低版本</th>
      <th>支付宝</th>
      <th>RN</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>quality</td>
      <td>string</td>
      <td>normal</td>
      <td>否</td>
      <td>
        成像质量<br>
        <strong>合法值</strong><br>
        <table>
          <thead>
            <tr>
              <th>值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>high</td>
              <td>高质量</td>
            </tr>
            <tr>
              <td>normal</td>
              <td>普通质量</td>
            </tr>
            <tr>
              <td>low</td>
              <td>低质量</td>
            </tr>
            <tr>
              <td>original</td>
              <td>原图</td>
            </tr>
          </tbody>
        </table>
      </td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>selfieMirror</td>
      <td>boolean</td>
      <td>true</td>
      <td>否</td>
      <td>是否开启镜像</td>
      <td>2.22.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>captureMetadata</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>是否返回照片的拍摄信息</td>
      <td>3.15.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>success</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用成功的回调函数</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>fail</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用失败的回调函数</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>complete</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
  </tbody>
</table>


### object.success 回调函数
**参数**
**Object res**

| 属性 | 类型 | 说明 | 最低版本 | 支付宝 | RN |
| --- | --- | --- | --- | --- | --- |
| tempImagePath | string | 照片文件的临时路径 (本地路径)，安卓是jpg图片格式，ios是png | | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| metadata | Object | 照片的拍摄信息,仅当传入的 captureMetadata 属性值为 true 时返回该字段 | 3.15.0 | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
