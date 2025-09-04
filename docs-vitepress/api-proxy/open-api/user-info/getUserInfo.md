## mpx.getUserInfo(Object object)

获取用户信息。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserInfo.html)

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
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>withCredentials</td>
      <td>boolean</td>
      <td></td>
      <td>否</td>
      <td>是否带上登录态信息。当 withCredentials 为 true 时，要求此前有调用过 wx.login 且登录态尚未过期，此时返回的数据会包含 encryptedData, iv 等敏感信息；当 withCredentials 为 false 时，不要求有登录态，返回的数据不包含 encryptedData, iv 等敏感信息。</td>
    </tr>
    <tr>
      <td>lang</td>
      <td>string</td>
      <td>en</td>
      <td>否</td>
      <td>显示用户信息的语言</td>
    </tr>
    <tr>
      <td colspan="5">
        <table>
          <thead>
            <tr>
              <th>合法值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>en</td>
              <td>英文</td>
            </tr>
            <tr>
              <td>zh_CN</td>
              <td>简体中文</td>
            </tr>
            <tr>
              <td>zh_TW</td>
              <td>繁体中文</td>
            </tr>
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
    </tr>
    <tr>
      <td>fail</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用失败的回调函数</td>
    </tr>
    <tr>
      <td>complete</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
    </tr>
  </tbody>
</table>

**object.success 回调函数**

**参数**

**Object res**

属性	类型	说明	最低版本
| 属性         | 类型     | 说明                                                                 | 最低版本 |
|--------------|----------|----------------------------------------------------------------------|----------|
| userInfo     | UserInfo | 用户信息对象，不包含 openid 等敏感信息                               |          |
| rawData      | string   | 不包括敏感信息的原始数据字符串，用于计算签名                         |          |
| signature    | string   | 使用 sha1( rawData + sessionkey ) 得到字符串，用于校验用户信息，详见 用户数据的签名验证和加解密 |          |
| encryptedData| string   | 包括敏感数据在内的完整用户信息的加密数据，详见 用户数据的签名验证和加解密 |          |
| iv           | string   | 加密算法的初始向量，详见 用户数据的签名验证和加解密                   |          |
| cloudID      | string   | 敏感数据对应的云 ID，开通云开发的小程序才会返回，可通过云调用直接获取开放数据，详细见云调用直接获取开放数据 | 2.7.0    |


### 示例代码

```js
mpx.getUserInfo({
  success: function(res) {
    var userInfo = res.userInfo
    var nickName = userInfo.nickName
    var avatarUrl = userInfo.avatarUrl
    var gender = userInfo.gender //性别 0：未知、1：男、2：女
    var province = userInfo.province
    var city = userInfo.city
    var country = userInfo.country
  }
})
```