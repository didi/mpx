## mpx.showTabBar(Object object)

显示 tabBar

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.showTabBar.html)

### 参数

**Object object**

| 属性     | 类型     | 默认值 | 必填 | 说明                                   | 支付宝 | web |
|----------|----------|--------|------|----------------------------------------|--------|-----|
| animation| boolean  | false  | 否   | 是否需要动画效果                       | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> |
| success  | function |        | 否   | 接口调用成功的回调函数                 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| fail     | function |        | 否   | 接口调用失败的回调函数                 | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| complete | function |        | 否   | 接口调用结束的回调函数（成功或失败均执行） | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
