## mpx.setTabBarItem(Object object)

动态设置 tabBar 某一项的内容

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.setTabBarItem.html)

### 参数

**Object object**

| 属性             | 类型     | 默认值 | 必填 | 说明                                                                                   | 支付宝 | web |
|------------------|----------|--------|------|----------------------------------------------------------------------------------------|--------|-----|
| index            | number   |        | 是   | tabBar 的哪一项，从左边算起                                                           | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| text             | string   |        | 否   | tab 上的按钮文字                                                                      | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| iconPath         | string   |        | 否   | 图片路径，icon 大小限制为 40kb，建议尺寸为 81px * 81px，当 postion 为 top 时，此参数无效 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| selectedIconPath | string   |        | 否   | 选中时的图片路径，icon 大小限制为 40kb，建议尺寸为 81px * 81px ，当 postion 为 top 时，此参数无效 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| success          | function |        | 否   | 接口调用成功的回调函数                                                                | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail             | function |        | 否   | 接口调用失败的回调函数                                                                | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete         | function |        | 否   | 接口调用结束的回调函数（成功或失败均执行）                                             | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |


### 示例代码
```js
mpx.setTabBarItem({
  index: 0,
  text: 'text',
  iconPath: '/path/to/iconPath',
  selectedIconPath: '/path/to/selectedIconPath'
})
```