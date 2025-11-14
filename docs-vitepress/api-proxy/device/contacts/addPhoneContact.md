## mpx.addPhoneContact(Object object)

添加手机通讯录联系人。用户可以选择将该表单以「新增联系人」或「添加到已有联系人」的方式，写入手机系统通讯录。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/contact/wx.addPhoneContact.html)

### 参数
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| firstName | string | - | 是 | 名字 |
| photoFilePath | string | - | 否 | 头像本地文件路径 |
| nickName | string | - | 否 | 昵称 |
| lastName | string | - | 否 | 姓氏 |
| middleName | string | - | 否 | 中间名 |
| remark | string | - | 否 | 备注 |
| mobilePhoneNumber | string | - | 否 | 手机号 |
| weChatNumber | string | - | 否 | 微信号 |
| addressCountry | string | - | 否 | 联系地址国家 |
| addressState | string | - | 否 | 联系地址省份 |
| addressCity | string | - | 否 | 联系地址城市 |
| addressStreet | string | - | 否 | 联系地址街道 |
| addressPostalCode | string | - | 否 | 联系地址邮政编码 |
| organization | string | - | 否 | 公司 |
| title | string | - | 否 | 职位 |
| workFaxNumber | string | - | 否 | 工作传真 |
| workPhoneNumber | string | - | 否 | 工作电话 |
| hostNumber | string | - | 否 | 公司电话 |
| email | string | - | 否 | 电子邮件 |
| url | string | - | 否 | 网站 |
| workAddressCountry | string | - | 否 | 工作地址国家 |
| workAddressState | string | - | 否 | 工作地址省份 |
| workAddressCity | string | - | 否 | 工作地址城市 |
| workAddressStreet | string | - | 否 | 工作地址街道 |
| workAddressPostalCode | string | - | 否 | 工作地址邮政编码 |
| homeFaxNumber | string | - | 否 | 住宅传真 |
| homePhoneNumber | string | - | 否 | 住宅电话 |
| homeAddressCountry | string | - | 否 | 住宅地址国家 |
| homeAddressState | string | - | 否 | 住宅地址省份 |
| homeAddressCity | string | - | 否 | 住宅地址城市 |
| homeAddressStreet | string | - | 否 | 住宅地址街道 |
| homeAddressPostalCode | string | - | 否 | 住宅地址邮政编码 |
| success | function | - | 否 | 接口调用成功的回调函数 |
| fail | function | - | 否 | 接口调用失败的回调函数 |
| complete | function | - | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） |