## mpx.setNavigationBarTitle(Object object)

动态设置当前页面的标题

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarTitle.html)

Web 会同时更新浏览器页面标题与当前页面的内建标题栏；需预先启用 `Mpx.config.webConfig.enableTitleBar`，API 不会自动显示已关闭或通过 `navigationStyle: 'custom'` 隐藏的标题栏。RN 更新当前页面的内建标题栏；标题栏更新接口不可用时触发 `fail` 和 `complete`。

> Web 获取不到当前页面实例时触发 `fail` 和 `complete`，不会修改标题。请在页面 `onMounted`（选项式为 `[MOUNTED]`）或之后调用。

### 参数 {#parameters}
**Object object**

| 属性    | 类型     | 默认值 | 必填 | 说明                 |
| ------- | -------- | ------ | ---- | -------------------- |
| title   | string   |        | 是   | 页面标题             |
| success | function |        | 否   | 接口调用成功的回调函数 |
| fail    | function |        | 否   | 接口调用失败的回调函数 |
| complete| function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

### 示例代码 {#example-code}

```js
mpx.setNavigationBarTitle({
  title: '当前页面'
})
```
