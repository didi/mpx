## [UploadTask](https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html) mpx.uploadFile(Object object)

将本地资源上传到服务器。客户端发起一个 HTTPS POST 请求，其中 content-type 为 multipart/form-data

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html)

### 参数

**Object object**

| 属性           | 类型     | 默认值 | 必填 | 说明                                                                                                                        | 最低版本 | 支付宝 |
| -------------- | -------- | ------ | ---- | --------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| url            | string   |        | 是   | 开发者服务器地址                                                                                                           |          | <span style="color: green; font-weight: bold;">✓</span> |
| filePath       | string   |        | 是   | 要上传文件资源的路径 (本地路径)                                                                                            |          | <span style="color: green; font-weight: bold;">✓</span> |
| name           | string   |        | 是   | 文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容                                                        |          | <span style="color: green; font-weight: bold;">✓</span> |
| header         | Object   |        | 否   | HTTP 请求 Header，Header 中不能设置 Referer                                                                                |          | <span style="color: green; font-weight: bold;">✓</span> |
| formData       | Object   |        | 否   | HTTP 请求中其他额外的 form data                                                                                            |          | <span style="color: green; font-weight: bold;">✓</span> |
| timeout        | number   |        | 否   | 超时时间，单位为毫秒                                                                                                       | 2.10.0   | <span style="color: green; font-weight: bold;">✓</span> |
| enableProfile  | boolean  | true   | 否   | 是否开启 profile。iOS 和 Android 端默认开启，其他端暂不支持。开启后可在接口回调的 res.profile 中查看性能调试信息。           | 3.5.0    | <span style="color: red; font-weight: bold;">✗</span> |
| enableHttp2    | boolean  | false  | 否   | 是否开启 http2                                                                                                             | 2.10.4   | <span style="color: red; font-weight: bold;">✗</span> |
| enableQuic     | boolean  | false  | 否   | 是否开启 Quic/h3 协议（iOS 微信目前使用 gQUIC-Q43；Android 微信在 v8.0.54 前使用 gQUIC-Q43，v8.0.54 开始使用 IETF QUIC，即 h3 协议；PC微信使用 IETF QUIC，即 h3 协议） | 2.10.4   | <span style="color: red; font-weight: bold;">✗</span> |
| success        | function |        | 否   | 接口调用成功的回调函数                                                                                                      |          | <span style="color: green; font-weight: bold;">✓</span> |
| fail           | function |        | 否   | 接口调用失败的回调函数                                                                                                      |          | <span style="color: green; font-weight: bold;">✓</span> |
| complete       | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                                                                            |          | <span style="color: green; font-weight: bold;">✓</span> |

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
    </tr>
  </thead>
  <tbody>
  <tr>
    <td>data</td>
    <td>string</td>
    <td>开发者服务器返回的数据</td>
    <td></td>
    <td><span style="color: green; font-weight: bold;">✓</span></td>
  </tr>
  <tr>
    <td>statusCode</td>
    <td>number</td>
    <td>开发者服务器返回的 HTTP 状态码</td>
    <td></td>
    <td><span style="color: green; font-weight: bold;">✓</span></td>
  </tr>
  <tr>
    <td>profile</td>
    <td>Object</td>
    <td>网络请求过程中一些调试信息，查看详细说明。目前 iOS 和 Android 端支持。</td>
    <td>3.5.0</td>
    <td><span style="color: red; font-weight: bold;">✗</span></td>
  </tr>
    <tr>
      <td colspan="5">
        <strong>结构属性：</strong>
      </td>
    </tr>
    <tr>
      <td colspan="5">
        <table style="width:100%">
          <thead>
            <tr>
              <th>结构属性</th>
              <th>类型</th>
              <th>说明</th>
              <th>最低版本</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>invokeStart</td><td>number</td><td>调用接口的时间。</td><td>3.8.10</td></tr>
            <tr><td>httpDNSDomainLookUpStart</td><td>number</td><td>httpDNS 开始查询的时间。仅当开启 httpDNS 功能时返回该字段。目前仅wx.request接口支持</td><td>3.8.9</td></tr>
            <tr><td>httpDNSDomainLookUpEnd</td><td>number</td><td>httpDNS 完成查询的时间。仅当开启 httpDNS 功能时返回该字段。目前仅wx.request接口支持</td><td>3.8.9</td></tr>
            <tr><td>queueStart</td><td>number</td><td>开始排队的时间。达到并行上限时才需要排队。</td><td>3.8.10</td></tr>
            <tr><td>queueEnd</td><td>number</td><td>结束排队的时间。达到并行上限时才需要排队。如果未发生排队，则该字段和 queueStart 字段值相同</td><td>3.8.10</td></tr>
            <tr><td>redirectStart</td><td>number</td><td>第一个 HTTP 重定向发生时的时间。有跳转且是同域名内的重定向才算，否则值为 0</td><td></td></tr>
            <tr><td>redirectEnd</td><td>number</td><td>最后一个 HTTP 重定向完成时的时间。有跳转且是同域名内部的重定向才算，否则值为 0</td><td></td></tr>
            <tr><td>fetchStart</td><td>number</td><td>组件准备好使用 HTTP 请求抓取资源的时间，这发生在检查本地缓存之前</td><td></td></tr>
            <tr><td>domainLookUpStart</td><td>number</td><td>Local DNS 域名查询开始的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等</td><td></td></tr>
            <tr><td>domainLookUpEnd</td><td>number</td><td>Local DNS 域名查询完成的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等</td><td></td></tr>
            <tr><td>connectStart</td><td>number</td><td>HTTP（TCP） 开始建立连接的时间，如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接开始的时间</td><td></td></tr>
            <tr><td>connectEnd</td><td>number</td><td>HTTP（TCP） 完成建立连接的时间（完成握手），如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接完成的时间。注意这里握手结束，包括安全连接建立完成、SOCKS 授权通过</td><td></td></tr>
            <tr><td>SSLconnectionStart</td><td>number</td><td>SSL建立连接的时间,如果不是安全连接,则值为 0</td><td></td></tr>
            <tr><td>SSLconnectionEnd</td><td>number</td><td>SSL建立完成的时间,如果不是安全连接,则值为 0</td><td></td></tr>
            <tr><td>requestStart</td><td>number</td><td>HTTP请求读取真实文档开始的时间（完成建立连接），包括从本地读取缓存。连接错误重连时，这里显示的也是新建立连接的时间</td><td></td></tr>
            <tr><td>requestEnd</td><td>number</td><td>HTTP请求读取真实文档结束的时间</td><td></td></tr>
            <tr><td>responseStart</td><td>number</td><td>HTTP 开始接收响应的时间（获取到第一个字节），包括从本地读取缓存</td><td></td></tr>
            <tr><td>responseEnd</td><td>number</td><td>HTTP 响应全部接收完成的时间（获取到最后一个字节），包括从本地读取缓存</td><td></td></tr>
            <tr><td>rtt</td><td>number</td><td>当次请求连接过程中实时 rtt</td><td></td></tr>
            <tr><td>estimate_nettype</td><td>number</td><td>评估的网络状态 unknown, offline, slow 2g, 2g, 3g, 4g, last/0, 1, 2, 3, 4, 5, 6</td><td></td></tr>
            <tr><td>httpRttEstimate</td><td>number</td><td>协议层根据多个请求评估当前网络的 rtt（仅供参考）</td><td></td></tr>
            <tr><td>transportRttEstimate</td><td>number</td><td>传输层根据多个请求评估的当前网络的 rtt（仅供参考）</td><td></td></tr>
            <tr><td>downstreamThroughputKbpsEstimate</td><td>number</td><td>评估当前网络下载的kbps</td><td></td></tr>
            <tr><td>throughputKbps</td><td>number</td><td>当前网络的实际下载kbps</td><td></td></tr>
            <tr><td>peerIP</td><td>string</td><td>当前请求的IP</td><td></td></tr>
            <tr><td>port</td><td>number</td><td>当前请求的端口</td><td></td></tr>
            <tr><td>socketReused</td><td>boolean</td><td>是否复用连接</td><td></td></tr>
            <tr><td>sendBytesCount</td><td>number</td><td>发送的字节数</td><td></td></tr>
            <tr><td>receivedBytedCount</td><td>number</td><td>收到字节数</td><td></td></tr>
            <tr><td>protocol</td><td>string</td><td>使用协议类型，有效值：http1.1, h2, quic, unknown</td><td></td></tr>
            <tr><td>usingHighPerformanceMode</td><td>boolean</td><td>是否走到了高性能模式。基础库 v3.3.4 起支持。</td><td></td></tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>

### 返回值
[UploadTask](https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html)

### 示例代码

```js
mpx.chooseImage({
  success (res) {
    const tempFilePaths = res.tempFilePaths
    mpx.uploadFile({
      url: 'https://example.weixin.qq.com/upload', //仅为示例，非真实的接口地址
      filePath: tempFilePaths[0],
      name: 'file',
      formData: {
        'user': 'test'
      },
      success (res){
        const data = res.data
        //do something
      }
    })
  }
})
```