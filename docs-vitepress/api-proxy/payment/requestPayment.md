## mpx.requestPayment(Object object)

发起微信/支付宝支付。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html)

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
      <th>支付宝</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>timeStamp</td>
      <td>string</td>
      <td></td>
      <td>是</td>
      <td>时间戳，从 1970 年 1 月 1 日 00:00:00 至今的秒数，即当前的时间</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>nonceStr</td>
      <td>string</td>
      <td></td>
      <td>是</td>
      <td>随机字符串，长度为32个字符以下</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>package</td>
      <td>string</td>
      <td></td>
      <td>是</td>
      <td>统一下单接口返回的 prepay_id 参数值，提交格式如：prepay_id=***</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>tradeNO</td>
      <td>String</td>
      <td>-</td>
      <td>否</td>
      <td><span style="font-weight:bold;">支付宝交易号</span>，注意参数有大小写区分。接入 JSAPI 支付 时传入此参数，且必须传入，如何获取交易号参考本文接入流程 JSAPI 支付 中第四步骤。<span style="font-weight:bold;">该属性仅支持支付宝</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>signType</td>
      <td>string</td>
      <td>MD5</td>
      <td>否</td>
      <td>签名算法，应与后台下单时的值一致</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="6">
        <table style="width:100%;margin-top:8px;">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>MD5</td><td>仅在 v2 版本接口适用</td></tr>
            <tr><td>HMAC-SHA256</td><td>仅在 v2 版本接口适用</td></tr>
            <tr><td>RSA</td><td>仅在 v3 版本接口适用</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>paySign</td>
      <td>string</td>
      <td></td>
      <td>是</td>
      <td>签名，具体见微信支付文档</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>success</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用成功的回调函数</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>fail</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用失败的回调函数</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>complete</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
  </tbody>
</table>

### 示例代码
```js

mpx.requestPayment({
  timeStamp: '',
  nonceStr: '',
  package: '',
  signType: 'MD5',
  paySign: '',
  success (res) { },
  fail (res) { }
})
```