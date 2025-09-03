## mpx.scanCode(Object object)

调起客户端扫码界面进行扫码

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/scan/wx.scanCode.html)

### 参数

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
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>onlyFromCamera</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>是否只能从相机扫码，不允许从相册选择图片</td>
      <td>1.2.0</td>
    </tr>
    <tr>
      <td>scanType</td>
      <td>Array.&lt;string&gt;</td>
      <td>['barCode', 'qrCode', 'wxCode']</td>
      <td>否</td>
      <td>扫码类型</td>
      <td>1.7.0</td>
    </tr>
    <tr>
      <td colspan="6">
        <table>
            <thead>
              <tr>
                <th>合法值</th>
                <th>说明</th>
                <th>支付宝</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>barCode</td><td>一维码</td><td style="color: green; font-weight: bold;">✓</td></tr>
              <tr><td>qrCode</td><td>二维码</td><td style="color: green; font-weight: bold;">✔</td></tr>
              <tr><td>wxCode</td><td>小程序码</td><td style="color: red; font-weight: bold;">✗</td></tr>
                <tr><td>barCode</td><td>一维码</td><td style="color: green; font-weight: bold;">✓</td></tr>
                <tr><td>qrCode</td><td>二维码</td><td style="color: green; font-weight: bold;">✓</td></tr>
                <tr><td>wxCode</td><td>小程序码</td><td style="color: red; font-weight: bold;">✗</td></tr>
               <tr><td>datamatrix</td><td>Data Matrix 码</td><td style="color: red; font-weight: bold;">✗</td></tr>
               <tr><td>pdf417</td><td>PDF417 条码</td><td style="color: red; font-weight: bold;">✗</td></tr>
            </tbody>
          </table>
      </td>
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
  </tbody>
</table>


**object.success 回调函数**

**参数**

**Object res**

<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
      <th>支付宝</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>result</td>
      <td>string</td>
      <td>所扫码的内容</td>
      <td style="color: green; font-weight: bold;">✓</td>
    </tr>
    <tr>
      <td>scanType</td>
      <td>string</td>
      <td>所扫码的类型</td>
      <td style="color: green; font-weight: bold;">✓</td>
    </tr>
    <tr>
      <td colspan="4">
        <table style="width:100%">
          <thead>
            <tr>
              <th>合法值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>QR_CODE</td><td>二维码</td></tr>
            <tr><td>AZTEC</td><td>一维码</td></tr>
            <tr><td>CODABAR</td><td>一维码</td></tr>
            <tr><td>CODE_39</td><td>一维码</td></tr>
            <tr><td>CODE_93</td><td>一维码</td></tr>
            <tr><td>CODE_128</td><td>一维码</td></tr>
            <tr><td>DATA_MATRIX</td><td>二维码</td></tr>
            <tr><td>EAN_8</td><td>一维码</td></tr>
            <tr><td>EAN_13</td><td>一维码</td></tr>
            <tr><td>ITF</td><td>一维码</td></tr>
            <tr><td>MAXICODE</td><td>一维码</td></tr>
            <tr><td>PDF_417</td><td>二维码</td></tr>
            <tr><td>RSS_14</td><td>一维码</td></tr>
            <tr><td>RSS_EXPANDED</td><td>一维码</td></tr>
            <tr><td>UPC_A</td><td>一维码</td></tr>
            <tr><td>UPC_E</td><td>一维码</td></tr>
            <tr><td>UPC_EAN_EXTENSION</td><td>一维码</td></tr>
            <tr><td>WX_CODE</td><td>二维码</td></tr>
            <tr><td>CODE_25</td><td>一维码</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>charSet</td>
      <td>string</td>
      <td>所扫码的字符集</td>
      <td style="color: red; font-weight: bold;">✗</td>
    </tr>
    <tr>
      <td>path</td>
      <td>string</td>
      <td>当所扫的码为当前小程序二维码时，会返回此字段，内容为二维码携带的 path</td>
      <td style="color: red; font-weight: bold;">✗</td>
    </tr>
    <tr>
      <td>rawData</td>
      <td>string</td>
      <td>原始数据，base64编码</td>
      <td style="color: red; font-weight: bold;">✗</td>
    </tr>
  </tbody>
</table>



### 示例代码

```js
// 允许从相机和相册扫码
mpx.scanCode({
  success (res) {
    console.log(res)
  }
})

// 只允许从相机扫码
mpx.scanCode({
  onlyFromCamera: true,
  success (res) {
    console.log(res)
  }
})
```