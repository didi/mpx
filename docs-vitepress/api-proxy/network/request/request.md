## [RequestTask](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/RequestTask.html) mpx.request(Object object)

发起 HTTPS 网络请求

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)

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
      <th>支付宝</th>
      <th>RN</th>
      <th>web</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>url</td>
      <td>string</td>
      <td></td>
      <td>是</td>
      <td>开发者服务器接口地址</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>data</td>
      <td>string/object/ArrayBuffer</td>
      <td></td>
      <td>否</td>
      <td>请求的参数</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>header</td>
      <td>Object</td>
      <td></td>
      <td>否</td>
      <td>设置请求的 header，header 中不能设置 Referer。</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td colspan="9">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>content-type</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>默认为 application/json</td><td></td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>timeout</td>
      <td>number</td>
      <td>60000</td>
      <td>否</td>
      <td>超时时间，单位为毫秒。默认值为 60000</td>
      <td>2.10.0</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>method</td>
      <td>string</td>
      <td>GET</td>
      <td>否</td>
      <td>HTTP 请求方法</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td colspan="9">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>OPTIONS</td><td>HTTP 请求 OPTIONS</td></tr>
            <tr><td>GET</td><td>HTTP 请求 GET</td></tr>
            <tr><td>HEAD</td><td>HTTP 请求 HEAD</td></tr>
            <tr><td>POST</td><td>HTTP 请求 POST</td></tr>
            <tr><td>PUT</td><td>HTTP 请求 PUT</td></tr>
            <tr><td>DELETE</td><td>HTTP 请求 DELETE</td></tr>
            <tr><td>TRACE</td><td>HTTP 请求 TRACE</td></tr>
            <tr><td>CONNECT</td><td>HTTP 请求 CONNECT</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>dataType</td>
      <td>string</td>
      <td>json</td>
      <td>否</td>
      <td>返回的数据格式</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td colspan="9">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>json</td><td>返回的数据为 JSON，返回后会对返回的数据进行一次 JSON.parse</td></tr>
            <tr><td>其他</td><td>不对返回的内容进行 JSON.parse</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>responseType</td>
      <td>string</td>
      <td>text</td>
      <td>否</td>
      <td>响应的数据类型</td>
      <td>1.7.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td colspan="9">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>text</td><td>响应的数据为文本</td></tr>
            <tr><td>arraybuffer</td><td>响应的数据为 ArrayBuffer</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>useHighPerformanceMode</td>
      <td>boolean</td>
      <td>true</td>
      <td>否</td>
      <td>使用高性能模式。从基础库 v3.5.0 开始在 Android 端默认开启，其他端暂不生效。该模式下有更优的网络性能表现，更多信息请查看下方说明。</td>
      <td>3.3.3</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>enableHttp2</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>开启 http2</td>
      <td>2.10.4</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>enableProfile</td>
      <td>boolean</td>
      <td>true</td>
      <td>否</td>
      <td>是否开启 profile。iOS 和 Android 端默认开启，其他端暂不支持。开启后可在接口回调的 res.profile 中查看性能调试信息。</td>
      <td></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>enableQuic</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>是否开启 Quic/h3 协议</td>
      <td>2.10.4</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>enableCache</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>开启 Http 缓存</td>
      <td>2.10.4</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>enableHttpDNS</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>是否开启 HttpDNS 服务。如开启，需要同时填入 httpDNSServiceId 。 HttpDNS 用法详见 移动解析HttpDNS</td>
      <td>2.19.1</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>httpDNSServiceId</td>
      <td>string</td>
      <td></td>
      <td>否</td>
      <td>HttpDNS 服务商 Id。 HttpDNS 用法详见 移动解析HttpDNS</td>
      <td>2.19.1</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>httpDNSTimeout</td>
      <td>number</td>
      <td>60000</td>
      <td>否</td>
      <td>HttpDNS 超时时间。HttpDNS解析时间超过该值时不再走HttpDNS，本次请求将回退到localDNS。默认为 60000 毫秒。</td>
      <td>3.8.9</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>enableChunked</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>开启 transfer-encoding chunked。</td>
      <td>2.20.2</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>forceCellularNetwork</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>强制使用蜂窝网络发送请求</td>
      <td>2.21.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>redirect</td>
      <td>string</td>
      <td>follow</td>
      <td>否</td>
      <td>重定向拦截策略。（目前安卓、iOS、开发者工具已支持，PC端将在后续支持）</td>
      <td>3.2.2</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="9">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>follow</td><td>不拦截重定向，即客户端自动处理重定向</td></tr>
            <tr><td>manual</td><td>拦截重定向。开启后，当 http 状态码为 3xx 时客户端不再自动重定向，而是触发 onHeadersReceived 回调，并结束本次 request 请求。可通过 onHeadersReceived 回调中的 header.Location 获取重定向的 url</td></tr>
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
      <td><span style="color: green; font-weight: bold;">✓</span></td>
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
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
  </tbody>
</table>


**object.success 回调函数**

**参数**

**Object res**

<!-- 结果表格，嵌套子表，平台支持列，样式全部标准化 -->
<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
      <th>最低版本</th>
      <th>支付宝</th>
      <th>RN</th>
      <th>web</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>data</td>
      <td>string/Object/Arraybuffer</td>
      <td>开发者服务器返回的数据</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>statusCode</td>
      <td>number</td>
      <td>开发者服务器返回的 HTTP 状态码</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>header</td>
      <td>Object</td>
      <td>开发者服务器返回的 HTTP Response Header</td>
      <td>1.2.0</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>cookies</td>
      <td>Array.&lt;string&gt;</td>
      <td>开发者服务器返回的 cookies，格式为字符串数组</td>
      <td>2.10.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>profile</td>
      <td>Object</td>
      <td>网络请求过程中一些调试信息，查看详细说明。目前仅 iOS 和 Android 端支持，其他端暂不支持。</td>
      <td>2.10.4</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr>
              <th>结构属性</th>
              <th>类型</th>
              <th>说明</th>
              <th>最低版本</th>
              <th>支付宝</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>invokeStart</td><td>number</td><td>调用接口的时间。</td><td>3.8.10</td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>httpDNSDomainLookUpStart</td><td>number</td><td>httpDNS 开始查询的时间。仅当开启 httpDNS 功能时返回该字段。目前仅wx.request接口支持</td><td>3.8.9</td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>httpDNSDomainLookUpEnd</td><td>number</td><td>httpDNS 完成查询的时间。仅当开启 httpDNS 功能时返回该字段。目前仅wx.request接口支持</td><td>3.8.9</td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>queueStart</td><td>number</td><td>开始排队的时间。达到并行上限时才需要排队。</td><td>3.8.10</td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>queueEnd</td><td>number</td><td>结束排队的时间。达到并行上限时才需要排队。如果未发生排队，则该字段和 queueStart 字段值相同</td><td>3.8.10</td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>redirectStart</td><td>number</td><td>第一个 HTTP 重定向发生时的时间。有跳转且是同域名内的重定向才算，否则值为 0</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>redirectEnd</td><td>number</td><td>最后一个 HTTP 重定向完成时的时间。有跳转且是同域名内部的重定向才算，否则值为 0</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>fetchStart</td><td>number</td><td>组件准备好使用 HTTP 请求抓取资源的时间，这发生在检查本地缓存之前</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>domainLookUpStart</td><td>number</td><td>Local DNS 域名查询开始的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>domainLookUpEnd</td><td>number</td><td>Local DNS 域名查询完成的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>connectStart</td><td>number</td><td>HTTP（TCP） 开始建立连接的时间，如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接开始的时间</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>connectEnd</td><td>number</td><td>HTTP（TCP） 完成建立连接的时间（完成握手），如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接完成的时间。注意这里握手结束，包括安全连接建立完成、SOCKS 授权通过</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>SSLconnectionStart</td><td>number</td><td>SSL建立连接的时间,如果不是安全连接,则值为 0</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>SSLconnectionEnd</td><td>number</td><td>SSL建立完成的时间,如果不是安全连接,则值为 0</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>requestStart</td><td>number</td><td>HTTP请求读取真实文档开始的时间（完成建立连接），包括从本地读取缓存。连接错误重连时，这里显示的是新建立连接的时间</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>requestEnd</td><td>number</td><td>HTTP请求读取真实文档结束的时间</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>responseStart</td><td>number</td><td>HTTP 开始接收响应的时间（获取到第一个字节），包括从本地读取缓存</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>responseEnd</td><td>number</td><td>HTTP 响应全部接收完成的时间（获取到最后一个字节），包括从本地读取缓存</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>rtt</td><td>number</td><td>当次请求连接过程中实时 rtt</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>estimate_nettype</td><td>number</td><td>评估的网络状态 unknown, offline, slow 2g, 2g, 3g, 4g, last/0, 1, 2, 3, 4, 5, 6</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>httpRttEstimate</td><td>number</td><td>协议层根据多个请求评估当前网络的 rtt（仅供参考）</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>transportRttEstimate</td><td>number</td><td>传输层根据多个请求评估的当前网络的 rtt（仅供参考）</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>downstreamThroughputKbpsEstimate</td><td>number</td><td>评估当前网络下载的kbps</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>throughputKbps</td><td>number</td><td>当前网络的实际下载kbps</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>peerIP</td><td>string</td><td>当前请求的IP</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>port</td><td>number</td><td>当前请求的端口</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>socketReused</td><td>boolean</td><td>是否复用连接</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
            <tr><td>sendBytesCount</td><td>number</td><td>发送的字节数</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>receivedBytedCount</td><td>number</td><td>收到字节数</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>protocol</td><td>string</td><td>使用协议类型，有效值：http1.1, h2, quic, unknown</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>exception</td>
      <td>Object</td>
      <td>网络请求过程中的一些异常信息，例如httpdns超时等</td>
      <td>3.0.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr>
              <th>结构属性</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>retryCount</td>
              <td>number</td>
              <td>本次请求底层重试次数</td>
            </tr>
            <tr>
              <td>reasons</td>
              <td>Array.&lt;Object&gt;</td>
              <td>本次请求底层失败信息，所有失败信息均符合Errno错误码</td>
            </tr>
            <tr>
              <td colspan="3">
                <table style="width:100%;margin-top:8px;">
                  <thead>
                    <tr>
                      <th>结构属性</th>
                      <th>类型</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>errMsg</td>
                      <td>string</td>
                      <td>错误原因</td>
                    </tr>
                    <tr>
                      <td>errno</td>
                      <td>string</td>
                      <td>错误码</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>useHttpDNS</td>
      <td>boolean</td>
      <td>最终请求是否使用了HttpDNS解析的IP。仅当enableHttpDNS传true时返回此字段。如果开启enableHttpDNS但最终请求未使用HttpDNS解析的IP，可在exception查看原因。</td>
      <td>3.4.10</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
  </tbody>
</table>

**object.fail 回调函数**

**参数**

**Object err**


<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
      <th>最低版本</th>
      <th>支付宝</th>
      <th>RN</th>
      <th>web</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>errMsg</td>
      <td>String</td>
      <td>错误信息</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>errno</td>
      <td>Number</td>
      <td>errno 错误码，错误码的详细说明参考 Errno错误码</td>
      <td>2.24.0</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>exception</td>
      <td>Object</td>
      <td>网络请求过程中的一些异常信息，例如httpdns超时等</td>
      <td>3.8.10</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr>
              <th>结构属性</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>retryCount</td>
              <td>number</td>
              <td>本次请求底层重试次数</td>
            </tr>
            <tr>
              <td>reasons</td>
              <td>Array.&lt;Object&gt;</td>
              <td>本次请求底层失败信息，所有失败信息均符合Errno错误码</td>
            </tr>
            <tr>
              <td colspan="3">
                <table style="width:100%;margin-top:8px;">
                  <thead>
                    <tr>
                      <th>结构属性</th>
                      <th>类型</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>errMsg</td>
                      <td>string</td>
                      <td>错误原因</td>
                    </tr>
                    <tr>
                      <td>errno</td>
                      <td>string</td>
                      <td>错误码</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>useHttpDNS</td>
      <td>boolean</td>
      <td>最终请求是否使用了HttpDNS解析的IP。仅当enableHttpDNS传true时返回此字段。如果开启enableHttpDNS但最终请求未使用HttpDNS解析的IP，可在exception查看原因。</td>
      <td>3.8.10</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
  </tbody>
</table>


### 返回值
[RequestTask](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/RequestTask.html)

### 示例代码

```js
mpx.request({
  url: 'example.php', //仅为示例，并非真实的接口地址
  data: {
    x: '',
    y: ''
  },
  header: {
    'content-type': 'application/json' // 默认值
  },
  success (res) {
    console.log(res.data)
  }
})
```