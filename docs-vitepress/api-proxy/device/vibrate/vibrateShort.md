## mpx.vibrateShort(Object object)

使手机发生较短时间的振动（15 ms）。仅在 iPhone 7 / 7 Plus 以上及 Android 机型生效

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/vibrate/wx.vibrateShort.html)

### 参数

**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明                                   | 最低版本 |
|----------|----------|--------|------|----------------------------------------|----------|
| type     | string   |        | 是   | 震动强度类型，有效值为：heavy、medium、light | 2.13.0   |
| success  | function |        | 否   | 接口调用成功的回调函数                 |          |
| fail     | function |        | 否   | 接口调用失败的回调函数                 |          |
| complete | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |          |

**object.success 回调函数**

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
    <tr><td>errMsg</td><td>string</td><td>错误信息</td></tr>
    <tr>
      <td colspan="3"><b>合法值：</b>
        <table style="width:100%">
          <thead>
            <tr><th>合法值</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>style is not support</td><td>当前设备不支持设置震动等级(只有微信生效)</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>

