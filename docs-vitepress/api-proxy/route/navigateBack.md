## mpx.navigateBack(Object object)

关闭当前页面，返回上一页面或多级页面。

支持情况： 微信、支付宝、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateBack.html)

### 参数

**Object object**

| 属性      | 类型     | 默认值 | 必填 | 说明 |
|-----------|----------|--------|------|------|
| delta     | number   | 1      | 否   | 返回的页面数，如果 delta 大于现有页面数，则返回到页面栈中只剩一个页面为止。 |
| success   | function |        | 否   | 接口调用成功的回调函数 |
| fail      | function |        | 否   | 接口调用失败的回调函数 |
| complete  | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |


### 示例代码
```js
mpx.navigateTo({
  url: 'B?id=1'
})

// 此处是B页面
mpx.navigateTo({
  url: 'C?id=1'
})

// 在C页面内 navigateBack，将返回A页面
mpx.navigateBack({
  delta: 2
})

```