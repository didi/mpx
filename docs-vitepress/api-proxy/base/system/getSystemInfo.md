## mpx.getSystemInfo(Object object)
<font color="#fa5151" style="font-weight:bold;" size="2">微信小程序从基础库 <font style="color: #576b95;">2.20.1</font> 开始，该接口停止维护</font>

获取系统信息。

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfo.html)

### 参数

**Object object**

属性	类型	默认值	必填	说明
| 属性    | 类型     | 默认值 | 必填 | 说明                 |
| ------- | -------- | ------ | ---- | -------------------- |
| success | function |        | 否   | 接口调用成功的回调函数 |
| fail    | function |        | 否   | 接口调用失败的回调函数 |
| complete| function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行） |

**object.success 回调函数**

**参数**

**Object res**

<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
      <th>最低版本</th>
      <th>支付宝</th>
      <th>RN</th>
      <th>web</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>brand</td><td>string</td><td>设备品牌</td><td>1.5.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>model</td><td>string</td><td>设备型号。新机型刚推出一段时间会显示unknown，微信会尽快进行适配。</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>pixelRatio</td><td>number</td><td>设备像素比</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>screenWidth</td><td>number</td><td>屏幕宽度，单位px</td><td>1.1.0</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>screenHeight</td><td>number</td><td>屏幕高度，单位px</td><td>1.1.0</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>windowWidth</td><td>number</td><td>可使用窗口宽度，单位px</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>windowHeight</td><td>number</td><td>可使用窗口高度，单位px</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>statusBarHeight</td><td>number</td><td>状态栏的高度，单位px</td><td>1.9.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>language</td><td>string</td><td>微信设置的语言</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>version</td><td>string</td><td>微信版本号</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>system</td><td>string</td><td>操作系统及版本</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr><td>platform</td><td>string</td><td>客户端平台</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
    <tr>
      <td colspan="7">
        <table>
          <thead>
            <tr>
              <th>合法值</th>
              <th>说明</th>
              <th>支付宝</th>
              <th>RN</th>
              <th>web</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>ios</td><td>iOS微信（包含 iPhone、iPad）</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
            <tr><td>android</td><td>Android微信</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
            <tr><td>ohos</td><td>HarmonyOS微信</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>windows</td><td>Windows微信</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>mac</td><td>macOS微信</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
            <tr><td>devtools</td><td>微信开发者工具</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr><td>fontSizeSetting</td><td>number</td><td>用户字体大小（单位px）。以微信客户端「我-设置-通用-字体大小」中的设置为准</td><td>1.5.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>SDKVersion</td><td>string</td><td>客户端基础库版本</td><td>1.1.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>benchmarkLevel</td><td>number</td><td>设备性能等级（仅 Android）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好）<br>注意：性能等级当前仅反馈真机机型，暂不支持 IDE 模拟器机型</td><td>1.8.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>albumAuthorized</td><td>boolean</td><td>允许微信使用相册的开关（仅 iOS 有效）</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>cameraAuthorized</td><td>boolean</td><td>允许微信使用摄像头的开关</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>locationAuthorized</td><td>boolean</td><td>允许微信使用定位的开关</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>microphoneAuthorized</td><td>boolean</td><td>允许微信使用麦克风的开关</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>notificationAuthorized</td><td>boolean</td><td>允许微信通知的开关</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>notificationAlertAuthorized</td><td>boolean</td><td>允许微信通知带有提醒的开关（仅 iOS 有效）</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>notificationBadgeAuthorized</td><td>boolean</td><td>允许微信通知带有标记的开关（仅 iOS 有效）</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>notificationSoundAuthorized</td><td>boolean</td><td>允许微信通知带有声音的开关（仅 iOS 有效）</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>phoneCalendarAuthorized</td><td>boolean</td><td>允许微信使用日历的开关</td><td>2.19.3</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>bluetoothEnabled</td><td>boolean</td><td>蓝牙的系统开关</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>locationEnabled</td><td>boolean</td><td>地理位置的系统开关</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>wifiEnabled</td><td>boolean</td><td>Wi-Fi 的系统开关</td><td>2.6.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>safeArea</td><td>Object</td><td>在竖屏正方向下的安全区域。部分机型没有安全区域概念，也不会返回 safeArea 字段，开发者需自行兼容。</td><td>2.7.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td colspan="7"><b>safeArea 结构属性：</b>
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
    </td></tr>
    <tr><td>locationReducedAccuracy</td><td>boolean</td><td>`true` 表示模糊定位，`false` 表示精确定位，仅 iOS 支持</td><td></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>theme</td><td>string</td><td>系统当前主题，取值为<span style="color:#42b883;">light</span>(浅色主题)或<span style="color:#42b883;">dark</span>（深色主题），全局配置<span style="color:#42b883;">"darkmode":true</span>时才能获取，否则为 undefined （不支持小游戏）</td><td>2.11.0</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td>host</td><td>Object</td><td>当前小程序运行的宿主环境</td><td>2.12.3</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
    <tr><td colspan="7"><b>host 结构属性：</b>
      <table style="width:100%">
        <thead><tr><th>属性</th><th>类型</th><th>说明</th></tr></thead>
          <tbody>
            <tr><td>appId</td><td>string</td><td>宿主 app 对应的 appId</td></tr>
            <tr><td>enableDebug</td><td>boolean</td><td>是否已打开调试。可通过右上角菜单或 wx.setEnableDebug 打开调试。</td></tr>
        </tbody>
      </table>
    </td></tr>
    <tr><td>deviceOrientation</td><td>string</td><td>设备方向（注意：IOS客户端横屏游戏获取deviceOrientation可能不准，建议以屏幕宽高为准）值： portrait(竖屏)/landscape(横屏)</td><td></td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
  </tbody>
</table>


### 示例代码
```js
mpx.getSystemInfo({
  success (res) {
    console.log(res.model)
    console.log(res.pixelRatio)
    console.log(res.windowWidth)
    console.log(res.windowHeight)
    console.log(res.language)
    console.log(res.version)
    console.log(res.platform)
  }
})
```
