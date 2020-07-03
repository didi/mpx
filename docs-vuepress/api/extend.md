# 周边拓展

## mpx-fetch

mpx-fetch提供了一个实例**xfetch** ，该实例包含以下api

### fetch(config)
>  正常的promisify风格的请求方法
- **参数：**
    - `{Object} config`

        config 可指定以下属性：
        - **url**
        
            类型：`string`
        
            设置请求url
        - **method**
    
            类型：`string`
        
            设置请求方式，默认为GET
        - **data**
    
            类型：`Object`
        
            设置请求参数
        - **params**
    
            类型：`Object`
        
            设置请求参数，参数会以 Query String 的形式进行传递
        - **emulateJSON**
        
            类型：`Boolean`
        
            设置为 true 时，等价于 header = {'content-type': 'application/x-www-form-urlencoded'}

- **示例：**

```js
import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'
mpx.use(mpxFetch)
// 第一种访问形式
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	params: {
		age: 10
	},
	data: {
		name: 'test'
	},
	emulateJSON: true 
}).then(res => {
	console.log(res.data)
})

mpx.createApp({
	onLaunch() {
		// 第二种访问形式
		this.$xfetch.fetch({url: 'http://test.com'})
	}
})
```

### CancelToken
>实例属性，用于创建一个取消请求的凭证。

- **示例**:
```js
const cancelToken = new mpx.xfetch.CancelToken()
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	data: {
		name: 'test'
	},
	cancelToken: cancelToken.token
})
cancelToken.exec('手动取消请求') // 执行后请求中断，返回abort fail
```
### create()
>用于创建一个新的mpx-fetch实例

- **示例**:
```js
const newFetch = new mpx.xfetch.create() // 生成新的mpx-fetch实例
```

### interceptors
>实例属性，用于添加拦截器，包含两个属性，request & response

- **示例**:
```js
mpx.xfetch.interceptors.request.use(function(config) {
    console.log(config)
    // 也可以返回promise
    return config
})
mpx.xfetch.interceptors.response.use(function(res) {
    console.log(res)
    // 也可以返回promise
    return res
})
```

## api-proxy
 Mpx目前已经支持的API转换列表，供参考

| 方法/平台      | wx         | ali    | web    |
| ------------- |:-----:| :-----:| :-----: |
| getSystemInfo|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| getSystemInfoSync|:white_check_mark:|:white_check_mark:|:white_check_mark:|
| nextTick |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| showToast |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| hideToast |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| showModal |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| showLoading |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| hideLoading |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| showActionSheet |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| showNavigationBarLoading |:white_check_mark:|:white_check_mark:|:x:|
| hideNavigationBarLoading  |:white_check_mark:|:white_check_mark:|:x:|
| setNavigationBarTitle |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| setNavigationBarColor |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| request |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| downloadFile  |:white_check_mark:|:white_check_mark:|:x:|
| uploadFile |:white_check_mark:|:white_check_mark:|:x:|
| setStorageSync  |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| removeStorageSync |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| getStorageSync  |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| saveImageToPhotosAlbum  |:white_check_mark:|:white_check_mark:|:x:|
| previewImage |:white_check_mark:|:white_check_mark:|:x:|
| compressImage |:white_check_mark:|:white_check_mark:|:x:|
| chooseImage |:white_check_mark:|:white_check_mark:|:x:|
| getLocation |:white_check_mark:|:white_check_mark:|:x:|
| saveFile |:white_check_mark:|:white_check_mark:|:x:|
| removeSavedFile |:white_check_mark:|:white_check_mark:|:x:|
| getSavedFileList |:white_check_mark:|:white_check_mark:|:x:|
| getSavedFileInfo |:white_check_mark:|:white_check_mark:|:x:|
| addPhoneContact |:white_check_mark:|:white_check_mark:|:x:|
| setClipboardData |:white_check_mark:|:white_check_mark:|:x:|
| getClipboardData |:white_check_mark:|:white_check_mark:|:x:|
| setScreenBrightness |:white_check_mark:|:white_check_mark:|:x:|
| getScreenBrightness |:white_check_mark:|:white_check_mark:|:x:|
| makePhoneCall |:white_check_mark:|:white_check_mark:|:x:|
| stopAccelerometer |:white_check_mark:|:white_check_mark:|:x:|
| startAccelerometer |:white_check_mark:|:white_check_mark:|:x:|
| stopCompass |:white_check_mark:|:white_check_mark:|:x:|
| startCompass |:white_check_mark:|:white_check_mark:|:x:|
| stopGyroscope |:white_check_mark:|:white_check_mark:|:x:|
| startGyroscope |:white_check_mark:|:white_check_mark:|:x:|
| scanCode |:white_check_mark:|:white_check_mark:|:x:|
| login |:white_check_mark:|:white_check_mark:|:x:|
| checkSession |:white_check_mark:|:white_check_mark:|:x:|
| getUserInfo |:white_check_mark:|:white_check_mark:|:x:|
| requestPayment |:white_check_mark:|:white_check_mark:|:x:|
| createCanvasContext |:white_check_mark:|:white_check_mark:|:x:|
| canvasToTempFilePath |:white_check_mark:|:white_check_mark:|:x:|
| canvasPutImageData |:white_check_mark:|:white_check_mark:|:x:|
| canvasGetImageData |:white_check_mark:|:white_check_mark:|:x:|
| createSelectorQuery |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| onWindowResize |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| offWindowResize |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| arrayBufferToBase64 |:x:|:x:|:white_check_mark:|
| base64ToArrayBuffer |:x:|:x:|:white_check_mark:|

## webview-bridge
Mpx 支持小程序跨平台后，多个平台的小程序里都提供了 webview 组件，webview 打开的 H5 页面可以通过小程序提供的 API 来与小程序通信以及调用一些小程序的能力，但是各家小程序对于 webview 提供的API是不一样的。

比如微信的 webview 打开的 H5 页面里是通过调用 wx.miniProgram.navigateTo 来跳转到原生小程序页面的，而在支付宝是通过调用 my.navigateTo 来实现跳转的，那么我们开发 H5 时候为了让 H5 能适应各家小程序平台就需要写多份对应逻辑。

为解决这个问题，Mpx 提供了抹平平台差异的bridge库：@mpxjs/webview-bridge。

**安装：**
```js
npm install @mpxjs/webview-bridge
```
**使用：**
```js
import mpx from '@mpxjs/webview-bridge'
mpx.navigateBack()
mpx.env // 输出：wx/qq/ali/baidu/tt
mpx.checkJSApi()
```
**cdn地址引用：**
```js
<!-- 开发环境版本，方便调试 -->
<script src="https://dpubstatic.udache.com/static/dpubimg/D2JeLyT0_Y/2.2.43.webviewbridge.js"></script>

<!-- 生产环境版本，压缩了体积 -->
<script src="https://dpubstatic.udache.com/static/dpubimg/PRg145LZ-i/2.2.43.webviewbridge.min.js"></script>


<!-- 同时支持 ES Module 引入的 -->
// index.html
<script type="module" src="https://dpubstatic.udache.com/static/dpubimg/6MQOo-ocI4/2.2.43.webviewbridge.esm.browser.min.js"></script>
// main.js
import mpx from "https://dpubstatic.udache.com/static/dpubimg/6MQOo-ocI4/2.2.43.webviewbridge.esm.browser.min.js"

//ES Module 开发版本地址： https://dpubstatic.udache.com/static/dpubimg/cdhpNhmWmJ/2.2.43.webviewbridge.esm.browser.js
```
**基础方法提供：**
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
| onMessage |:white_check_mark:|:white_check_mark:|:x:|



**扩展方法提供：**
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
| alert |:white_check_mark:|:white_check_mark:|:x:|
| showLoading |:white_check_mark:|:white_check_mark:|:x:|
| hideLoading |:white_check_mark:|:white_check_mark:|:x:|
| setStorage |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| getStorage |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| removeStorage |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| clearStorage |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| getStorageInfo |:white_check_mark:|:white_check_mark:|:white_check_mark:|
| startShare |:white_check_mark:|:white_check_mark:|:x:|
| tradePay |:white_check_mark:|:white_check_mark:|:x:|
| onMessage |:white_check_mark:|:white_check_mark:|:x:|

::: warning
这个库仅提供给 H5 使用，请勿在小程序环境引入
:::

## mpx-mock

- 请参考 [数据 mock](/guide/extend/mock.md)

