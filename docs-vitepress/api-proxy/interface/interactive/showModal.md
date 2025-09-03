## mpx.showModal(Object object)

显示模态对话框

支持情况： 微信、支付宝、web、RN、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showModal.html)

### 参数
**Object object**

| 属性            | 类型     | 默认值   | 必填 | 说明                                         | 最低版本 | 支付宝 | RN/harmony | web |
|-----------------|----------|----------|------|----------------------------------------------|----------|--------|------------|-----|
| title           | string   |          | 否   | 提示的标题                                   |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| content         | string   |          | 否   | 提示的内容                                   |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| showCancel      | boolean  | true     | 否   | 是否显示取消按钮                             |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| cancelText      | string   | 取消     | 否   | 取消按钮的文字，最多 4 个字符                |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| cancelColor     | string   | #000000  | 否   | 取消按钮的文字颜色，必须是 16 进制格式的颜色字符串 |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| confirmText     | string   | 确定     | 否   | 确认按钮的文字，最多 4 个字符                |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| confirmColor    | string   | #576B95  | 否   | 确认按钮的文字颜色，必须是 16 进制格式的颜色字符串 |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| editable        | boolean  | false    | 否   | 是否显示输入框                               | 2.17.1   | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: red; font-weight: bold;'>✗</span> |
| placeholderText | string   |          | 否   | 显示输入框时的提示文本                       | 2.17.1   | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: red; font-weight: bold;'>✗</span> |
| success         | function |          | 否   | 接口调用成功的回调函数                       |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| fail            | function |          | 否   | 接口调用失败的回调函数                       |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| complete        | function |          | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |


**object.success 回调函数**

**参数**

**Object res**

| 属性   | 类型   | 说明                                                         | 最低版本 |
|--------|--------|--------------------------------------------------------------|----------|
| content | string | editable 为 true 时，用户输入的文本                          |          |
| confirm | boolean | 为 true 时，表示用户点击了确定按钮                           |          |
| cancel  | boolean | 为 true 时，表示用户点击了取消（用于 Android 区分关闭方式） | 1.1.0    |

### 示例代码

```js
mpx.showModal({
  title: '提示',
  content: '这是一个模态弹窗',
  success (res) {
    if (res.confirm) {
      console.log('用户点击确定')
    } else if (res.cancel) {
      console.log('用户点击取消')
    }
  }
})

```
