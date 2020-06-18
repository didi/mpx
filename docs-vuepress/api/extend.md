# 周边拓展

## mpx-fetch

## mpx-mock

## api-proxy

## webview-bridge
Mpx 支持小程序跨平台后，多个平台的小程序里都提供了 webview 组件，webview 打开的 H5 页面可以通过小程序提供的 API 来与小程序通信以及调用一些小程序的能力，但是各家小程序对于 webview 提供的API是不一样的。

比如微信的 webview 打开的 H5 页面里是通过调用 wx.miniProgram.navigateTo 来跳转到原生小程序页面的，而在支付宝是通过调用 my.navigateTo 来实现跳转的，那么我们开发 H5 时候为了让 H5 能适应各家小程序平台就需要写多份对应逻辑。

为解决这个问题，Mpx 提供了抹平平台差异的bridge库：@mpxjs/webview-bridge。

安装
```js
npm install @mpxjs/webview-bridge
```
使用
```js
import mpx from '@mpxjs/webview-bridge'
mpx.navigateBack()
mpx.env // 输出：wx/qq/ali/baidu/tt
mpx.checkJSApi()
```
基础方法提供
| 方法/平台      | wx            | qq    | ali    | baidu    | tt    |
| ------------- |:-----:| :-----:| :-----: |:-----:| -----:|
| navigateTo|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| navigateBack|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| switchTab |:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| reLaunch |:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| redirectTo |:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| getEnv |:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| postMessage |:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| getLoadError |:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| onMessage |:x:|:x:|:white_check_mark:|:x:|:x:|



扩展方法提供
| 方法/平台      | wx            | qq    | ali    | baidu    | tt    |
| ------------- |:-----:| :-----:| :-----: |:-----:| -----:|
| checkJSApi|:white_check_mark:|:x:|:x:|:x:|:x:|
| chooseImage|:white_check_mark:|:x:|:white_check_mark:|:white_check_mark:|:x:|
| previewImage |:white_check_mark:|:x:|:white_check_mark:|:white_check_mark:|:x:|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| uploadImage |:white_check_mark:|:x:|:x:|:x:|:x:|
| downloadImage |:white_check_mark:|:x:|:x:|:x:|:x:|
| getLocalImgData |:white_check_mark:|:x:|:x:|:x:|:x:|
| startRecord |:white_check_mark:|:x:|:x:|:x:|:x:|
| stopRecord |:white_check_mark:|:x:|:x:|:x:|:x:|
| onVoiceRecordEnd |:white_check_mark:|:x:|:x:|:x:|:x:|
| playVoice |:white_check_mark:|:x:|:x:|:x:|:x:|
| pauseVoice |:white_check_mark:|:x:|:x:|:x:|:x:|
| stopVoice |:white_check_mark:|:x:|:x:|:x:|:x:|
| onVoicePlayEnd |:white_check_mark:|:x:|:x:|:x:|:x:|
| uploadVoice |:white_check_mark:|:x:|:x:|:x:|:x:|
| downloadVoice |:white_check_mark:|:x:|:x:|:x:|:x:|
| translateVoice |:white_check_mark:|:x:|:x:|:x:|:x:|
| getNetworkType |:white_check_mark:|:x:|:white_check_mark:|:white_check_mark:|:x:|
| openLocation |:white_check_mark:|:x:|:white_check_mark:|:white_check_mark:|:x:|
| getLocation |:white_check_mark:|:x:|:white_check_mark:|:white_check_mark:|:x:|
| stopSearchBeacons |:white_check_mark:|:x:|:x:|:x:|:x:|
| onSearchBeacons |:white_check_mark:|:x:|:x:|:x:|:x:|
| scanQRCode |:white_check_mark:|:x:|:x:|:x:|:x:|
| chooseCard |:white_check_mark:|:x:|:x:|:x:|:x:|
| addCard |:white_check_mark:|:x:|:x:|:x:|:x:|
| openCard |:white_check_mark:|:x:|:x:|:x:|:x:|
| alert |:x:|:x:|:white_check_mark:|:x:|:x:|
| showLoading |:x:|:x:|:white_check_mark:|:x:|:x:|
| hideLoading |:x:|:x:|:white_check_mark:|:x:|:x:|
| setStorage |:x:|:x:|:white_check_mark:|:x:|:x:|
| getStorage |:x:|:x:|:white_check_mark:|:x:|:x:|
| removeStorage |:x:|:x:|:white_check_mark:|:x:|:x:|
| clearStorage |:x:|:x:|:white_check_mark:|:x:|:x:|
| getStorageInfo |:x:|:x:|:white_check_mark:|:x:|:x:|
| startShare |:x:|:x:|:white_check_mark:|:x:|:x:|
| tradePay |:x:|:x:|:white_check_mark:|:x:|:x:|
| onMessage |:x:|:x:|:white_check_mark:|:x:|:x:|

::: warning
这个库仅提供给 H5 使用，请勿在小程序环境引入
:::