## mpx.getSystemInfo(Object object)
<font color="#fa5151" style="font-weight:bold;" size="2">微信小程序从基础库 <font style="color: #576b95;">2.20.1</font> 开始，该接口停止维护</font>

mpx.getSystemInfo 的同步版本。

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfoSync.html)

> RN 环境下配置 [`mpx.config.rnConfig.customDimensions`](/guide/rn/application-api.html#foldable-screen-adaption) 后，返回值中的 `screenWidth`、`screenHeight`、`windowWidth`、`windowHeight` 使用自定义尺寸，`deviceOrientation` 根据自定义后的屏幕宽高计算；`safeArea`、`statusBarHeight` 和 `screenTop` 仍基于原生窗口与安全区信息计算。

### 示例代码 {#example-code}
```js
try {
  const res = mpx.getSystemInfoSync()
  console.log(res.model)
  console.log(res.pixelRatio)
  console.log(res.windowWidth)
  console.log(res.windowHeight)
  console.log(res.language)
  console.log(res.version)
  console.log(res.platform)
} catch (e) {
  // Do something when catch error
}

```
