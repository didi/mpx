## mpx.getWindowInfo()

获取窗口信息

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getWindowInfo.html)

> RN 环境下配置 [`mpx.config.rnConfig.customDimensions`](/guide/rn/application-api.html#foldable-screen-adaption) 后，返回值中的 `screenWidth`、`screenHeight`、`windowWidth`、`windowHeight` 使用自定义尺寸；`safeArea`、`statusBarHeight` 和 `screenTop` 仍基于原生窗口与安全区信息计算。

### 参数 {#parameters}

**Object**

<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
      <th>支付宝</th>
      <th>RN</th>
      <th>web</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>pixelRatio</td><td>number</td><td>设备像素比</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>screenWidth</td><td>number</td><td>屏幕宽度，单位px</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>screenHeight</td><td>number</td><td>屏幕高度，单位px</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>windowWidth</td><td>number</td><td>可使用窗口宽度，单位px</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>windowHeight</td><td>number</td><td>可使用窗口高度，单位px</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>statusBarHeight</td><td>number</td><td>状态栏的高度，单位px</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr>
      <td colspan="6"><b>safeArea 结构属性：</b>
        <table style="width:100%">
          <thead>
            <tr><th>属性</th><th>类型</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>left</td><td>number</td><td>安全区域左上角横坐标</td></tr>
            <tr><td>right</td><td>number</td><td>安全区域右下角横坐标</td></tr>
            <tr><td>top</td><td>number</td><td>安全区域左上角纵坐标</td></tr>
            <tr><td>bottom</td><td>number</td><td>安全区域右下角纵坐标</td></tr>
            <tr><td>width</td><td>number</td><td>安全区域的宽度，单位逻辑像素</td></tr>
            <tr><td>height</td><td>number</td><td>安全区域的高度，单位逻辑像素</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr><td>screenTop</td><td>number</td><td>窗口上边缘的y值</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
  </tbody>
</table>


### 示例代码 {#example-code}
```js
const windowInfo = mpx.getWindowInfo()

console.log(windowInfo.screenWidth)
console.log(windowInfo.screenHeight)
console.log(windowInfo.windowWidth)
console.log(windowInfo.windowHeight)
console.log(windowInfo.safeArea)
```
