## mpx.onNetworkStatusChange(function listener)

监听网络状态变化事件

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.onNetworkStatusChange.html)

### 参数
**function listener**\
网络状态变化事件的监听函数

**参数**

**Object res**

<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>isConnected</td>
      <td>boolean</td>
      <td>当前是否有网络连接</td>
    </tr>
    <tr>
      <td>networkType</td>
      <td>string</td>
      <td>网络类型</td>
    </tr>
    <tr>
      <td colspan="3">
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
  </tbody>
</table>


### 示例代码

```js
mpx.onNetworkStatusChange(function (res) {
  console.log(res.isConnected)
  console.log(res.networkType)
})
```