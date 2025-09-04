## mpx.getNetworkType(Object object)

获取网络类型

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.getNetworkType.html)

### 参数

**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明                                         |
| -------- | -------- | ------ | ---- | -------------------------------------------- |
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
      <th>ali</th>
      <th>RN</th>
      <th>web</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>networkType</td>
      <td>string</td>
      <td>网络类型</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width:100%">
          <thead>
            <tr>
              <th>合法值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>wifi</td><td>wifi 网络</td></tr>
            <tr><td>2g</td><td>2g 网络</td></tr>
            <tr><td>3g</td><td>3g 网络</td></tr>
            <tr><td>4g</td><td>4g 网络</td></tr>
            <tr><td>5g</td><td>5g 网络</td></tr>
            <tr><td>unknown</td><td>Android 下不常见的网络类型</td></tr>
            <tr><td>none</td><td>无网络</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>signalStrength</td>
      <td>Number</td>
      <td>信号强弱，单位 dbm</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>hasSystemProxy</td>
      <td>Boolean</td>
      <td>设备是否使用了网络代理</td>
      <td>2.22.1</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>weakNet</td>
      <td>Boolean</td>
      <td>是否处于弱网环境</td>
      <td>3.5.3</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
  </tbody>
</table>


### 示例代码

```js
mpx.getNetworkType({
  success (res) {
    const networkType = res.networkType
    const weakNet = res.weakNet
  }
})
```