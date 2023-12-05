---
sidebarDepth: 2
---
# 周边拓展

## mpx-fetch

mpx-fetch提供了一个实例**xfetch** ，该实例包含以下api

### fetch(config)
>  正常的promisify风格的请求方法

- `{Object} config`

    config 可指定以下属性：
    - **url**
    
        `string`
    
        设置请求url
    - **method**

        `string`
    
        设置请求方式，默认为GET
    - **data**

        `object`
    
        设置请求参数
    - **params**

        `object`
    
        设置请求参数，参数会以 Query String 的形式进行传递
    - **header**

        `object`

        设置请求的 header，header 中不能设置 Referer。
        `content-type` 默认为 `application/json`
    - **timeout**
                        
        `number`
                        
        单位为毫秒。若不传，默认读取app.json文件中__networkTimeout属性。 对于超时的处理可在 catch 方法中进行
    - **emulateJSON**

        `boolean`
    
        设置为 true 时，等价于 header = {'content-type': 'application/x-www-form-urlencoded'}
    - **usePre**

        `boolean`

        预请求开关，若设置为 true，则两次请求间隔在有效期内且请求参数和请求方式对比一致的情况下，会返回上一次的请求结果
    - **cacheInvalidationTime**

        `number`

        预请求缓存有效时长，单位 ms，默认为 5000ms。当两次请求时间间隔超过设置时长后再发起二次请求时，上一次的请求缓存会失效然后重新发起请求
    - **ignorePreParamKeys**

        `array` | `string`

        在判断缓存请求是否可用对比前后两次请求参数时，默认对比的是 options 传入的所有参数（包括 params 和 data ）。但在具体业务场景下某些参数不一致时的缓存结果依旧可使用（比如参数中带有时间戳），所以提供 ignorePreParamKeys 来设置对比参数过程中可忽略的参数的 key，支持字符串数组和字符串（字符串传多个 key 时使用英文逗号分隔）类型。
        配置后在进行参数对比时，不会对比在 ignorePreParamKeys 设置的参数。

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
    header: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    emulateJSON: true,
    usePre: true,
    cacheInvalidationTime: 3000,
    ignorePreParamKeys: ['timestamp']
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
命名导出，用于创建一个取消请求的凭证。

```js
import { CancelToken } from '@mpxjs/fetch'
const cancelToken = new CancelToken()
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	data: {
		name: 'test'
	},
	cancelToken: cancelToken.token
})
cancelToken.exec('手动取消请求') // 执行后请求中断，返回abort fail
```

### XFetch
命名导出，用于创建一个新的mpx-fetch实例进行独立使用

```ts
interface FetchOptions{
    useQueue: boolean // 是否开启队列功能
    proxy: boolean // 是否开启代理功能
}
```

```js
import { XFetch } from '@mpxjs/fetch'
const newFetch = new XFetch(options) // 生成新的mpx-fetch实例
```

### interceptors
> 实例属性，用于添加拦截器，包含两个属性，request & response

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

### proxy 代理{#proxy}
#### setProxy
> 配置代理项，可以传入一个数组或者一个对象，请求会按设置的规则进行代理

- **参数：**

    `{Array | Object}`
    - **test**

        `object`

        - url

            `string`

            全路径匹配，规则可以参考[path-to-regexp](https://www.npmjs.com/package/path-to-regexp)，也可参考下面的简单示例。

            ::: warning
            如果设置了此项，则 protocol、host、port、path 规则不再生效。此项支持 path-to-regexp 匹配，protocol、host、port、path 为全等匹配。
            :::

        - protocol

            `string`

            待匹配的协议头

        - host

            `string`

            不包含端口的 host

        - port

            `string`

            待匹配的端口

        - path

            `string`

            待匹配的路径

        - params

            `object`

            同时匹配请求中的 `params` 和 `query`

        - data

            `object`

            匹配请求中的 `data`

        - header

            `object`

            匹配请求中的 `header`

        - method

            `Method | Method[]`

            匹配请求方法，不区分大小写，可以传一个方法，也可以传一个方法数组

        - custom

            `function`

            自定义匹配规则，参数会注入原始请求配置，结果需返回 `true` 或 `false`

            ::: warning
            如果设置了此项，匹配结果以此项为准，以上规则均不再生效。
            :::

    - **proxy**

        `object`

        - url

            `string`

            代理的 url

        - protocol

            `string`

            修改原请求的协议头

        - host

            `string`

            代理的 host，不包含端口号

        - port

            `string`

            修改端口号

        - path

            `string`

            修改原请求路径

        - params

            `object`

            合并原请求的 params

        - data

            `object`

            合并原请求的 data

        - header

            `object`

            合并原请求的 header

        - method

            `Method`

            替换原请求的方法

        - custom

            `function`

            自定义代理规则，会注入两个参数，第一个是上一个匹配规则处理后的请求配置，第二个是 match 的参数对象，结果需返回要修改的请求配置对象。

            ::: warning
            如果设置了此项，最终代理配置将以此项为准，其他配置规则均不再生效。
            :::

    - **waterfall**

        `boolean`

        默认为 `false`，为 `false` 时，命中当前规则处理完就直接返回；为 `true` 时，命中当前匹配规则处理完成后将结果传递给下面命中匹配规则继续处理。

```js
mpx.xfetch.setProxy([{
    test: { // 此项匹配之后，会按下面 proxy 配置的修改请求配置
		header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        method: 'get',
        params: {
            a: 1
        },
        data: {
            test1: 'abc'
        }
	},
	proxy: {
		header: {
			env: 'env test'
		},
		params: {
			b: 2
        },
        data: {
            test2: 'cba'
        }
	},
	waterfall: true // 为 true 时会将此次修改后的请求配置继续传递给下面的规则处理
}, {
    test: {// 可以分别单独匹配 protocol、host、port、path；代理规则同样
        protocol: 'http:',
		host: 'mock.didi.com',
		port: '',
		path: '/mock/test'
    },
    proxy: {
        host: 'test.didi.com',
        port: 8888
    },
    waterfall: true
}, {
    test: { // 自定义匹配规则
        custom (config) { // config 为原始的请求配置
            // 自定义匹配逻辑
			if (xxx) {
				return true
			}
			return false
		}
    },
    proxy: { // 自定义代理配置
        custom (config, params) {
			// config 为上面匹配后修改过的请求配置
            // params 为 match 后的参数对象
            // 返回需要修改的请求配置对象
			return {
                params: {
                    c: 3
                },
				data: {
					test3: 'aaa'
				}
			}
		}
    },
    waterfall: true
}, {
    test: {
        // : 可以匹配目标项，并将 match 结果返回到代理 custom 函数中
        // :和?都属于保留符号，若不想做匹配时需用 '\\' 转义
        // (.*)为全匹配
        url: ':protocol\\://mock.didi.com/mock/:id/oneapi/router/forum/api/v1/(.*)',
        method: ['get', 'post']
    },
    proxy: {
        url: 'https://127.0.0.1:8080/go/into/$id/api/v2/abcd' // '$'项在代理生效后会替换匹配规则中的':'项
    },
    waterfall: false // false 时不会继续匹配后面的规则
}])
```

#### prependProxy
> 向前追加代理规则

```js
mpx.xfetch.prependProxy({
	test: {},
	proxy: {},
	waterfall: true
})
```

#### appendProxy
> 向后追加代理规则

```js
mpx.xfetch.appendProxy({
	test: {},
	proxy: {},
	waterfall: true
})
```

#### getProxy
> 查看已有的代理配置

```js
console.log(mpx.xfetch.getProxy())
```

#### clearProxy
> 解除所有的代理配置

```js
mpx.xfetch.clearProxy()
```

### useFetch
```ts
useFetch(options?: FetchOptions):xfetch
```

在组合式 API 中使用，用来获取 `@mpxjs/fetch` 插件的 xfetch 实例，等用于 `mpx.xfetch`。 关于 xfetch 实例的详细介绍，请点击[查看](/api/extend.html#mpx-fetch)

此外该方法可选择传入 `options` 参数，若传入参数，则会创建一个新的 XFetch 实例返回，若不传入参数，则默认将全局 `xfetch` 实例返回。

```js
// app.mpx
import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'
mpx.use(mpxFetch)

// script-setup.mpx
import { useFetch } from '@mpxjs/fetch'
useFetch().fetch({
  url: 'http://xxx.com',
  method: 'POST',
  params: {
    age: 10
  },
  data: {
    name: 'test'
  },
  emulateJSON: true,
  usePre: true,
  cacheInvalidationTime: 3000,
  ignorePreParamKeys: ['timestamp']
}).then(res => {
  console.log(res.data)
})
```

* **注意：** options 参数同 [XFetch](./extend.md#XFetch) 章节。


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
| onMessage |:x:|:x:|:white_check_mark:|:x:|:x:|



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
| onMessage |:x:|:x:|:white_check_mark:|:x:|:x:|

::: warning
这个库仅提供给 H5 使用，请勿在小程序环境引入
:::

## size-report
Mpx框架项目包体积可以进行分组、分包、页面、冗余Npm包等维度的分析和对比，详细[请见](/advance/size-report.html)

### 插件配置项

- **server**

  `object`

  本地可视化服务相关配置

- **filename**

  `string`

  构建生成的包体积详细输出文件地址

- **threshold**

  `object`

  配置项目总体积和分包体积阈值，包含两个字段，size 为项目总体积阈值，packages 为分包体积阈值

  ```html
  {
     size: '16MB', // 项目总包体积限额 16M
     packages: '2MB' // 项目每个分包体积限额 2M
  }
  ```

- **groups**

  `Array<object>`

  配置体积计算分组，以输入分组为维度对体积进行分析，当没有该配置时结果中将不会包含分组体积信息
  
  - name
  
    `string`

    分组名称

  - threshold
  
    `string | object`

    分组相关体积阈值，若不配置则该分组不校验体积阈值，同时也支持对分组中占各分包体积阈值

    
    ```html
    // 分组体积限额 500KB
    threshold: '500KB'
    // 或者如下方，分组体积限额500KB，分组占主包体积限额160KB
    threshold: {
      size: '500KB',
      packages: {
        main: '160KB'
      }
    }
    ```
    
  - entryRules
  
    `object`
  
    配置分组 entry 匹配规则，小程序中所有的页面和组件都可被视为 entry
  
      - include: 包含符合条件的入口文件，默认为空数组，规则数组中支持函数、正则、字符串
      - exclude: 剔除符合条件的入口文件，默认为空数组，规则数组中支持函数、正则、字符串
    
    
    ```html
    include: [/@someGroup\/some-npm-package/],
    exclude: [/@someGroup\/some-two-pack/]
    ```
    
  - noEntryRules

    `object`

    配置计算分组中纯 js 入口引入的体积（不包含组件和页面）
  
      - include: 包含符合条件的 js 文件，默认为空数组，规则数组中支持函数、正则、字符串
      - exclude: 剔除符合条件的 js 文件，默认为空数组，规则数组中支持函数、正则、字符串
    
    
    ```html
    include: [/@someGroup\/some-npm-package/],
    exclude: [/@someGroup\/some-two-pack/]
    ```

- **reportPages**

  `boolean`

  是否收集页面维度体积详情，默认 false

- **reportAssets**

  `boolean`

  是否收集资源维度体积详情，默认 false

- **reportRedundance**

  `boolean`

  是否收集冗余资源，默认 false

- **showEntrysPackages**

  `Array<string>`

  展示某些分包资源的引用来源信息，例如 ['main'] 为查看主包资源的引用来源信息，默认为 []


配置使用示例：

```html
{
  // 本地可视化服务相关配置
  server: {
    enable: true, // 是否启动本地服务，非必填，默认 true
    autoOpenBrowser: true, // 是否自动打开可视化平台页面，非必填，默认 true
    port: 0, // 本地服务端口，非必填，默认 0(随机端口)
    host: '127.0.0.1', // 本地服务host，非必填
  },
  // 体积报告生成后输出的文件地址名，路径相对为 dist/wx 或者 dist/ali
  filename: '../report.json',
  // 配置阈值，此处代表总包体积阈值为 16MB，分包体积阈值为 2MB，超出将会触发编译报错提醒，该报错不阻断构建
  threshold: {
    size: '16MB',
    packages: '2MB'
  },
  // 配置体积计算分组，以输入分组为维度对体积进行分析，当没有该配置时结果中将不会包含分组体积信息
  groups: [
    {
      // 分组名称
      name: 'vant',
      // 配置分组 entry 匹配规则，小程序中所有的页面和组件都可被视为 entry，如下所示的分组配置将计算项目中引入的 vant 组件带来的体积占用
      entryRules: {
        include: '@vant/weapp'
      }
    },
    {
      name: 'pageGroup',
      // 每个分组中可分别配置阈值，如果不配置则表示
      threshold: '500KB',
      entryRules: {
        include: ['src/pages/index', 'src/pages/user']
      }
    },
    {
      name: 'someSdk',
      entryRules: {
        include: ['@somegroup/someSdk/index', '@somegroup/someSdk2/index']
      },
      // 有的时候你可能希望计算纯 js 入口引入的体积（不包含组件和页面），这种情况下需要使用 noEntryModules
      noEntryModules: {
        include: 'src/lib/sdk.js'
      }
    }
  ],
  // 是否收集页面维度体积详情，默认 false
  reportPages: true,
  // 是否收集资源维度体积详情，默认 false
  reportAssets: true,
  // 是否收集冗余资源，默认 false
  reportRedundance: true,
  // 展示某些分包资源的引用来源信息，默认为 []
  showEntrysPackages: ['main']
}
```

## i18n

### useI18n

组合式 API 中使用，用来获取 i18n 实例。

**参数选项**

------

#### locale

`Locale`

设置语言环境

**注意：** 只传 locale，不传 messages 属性时不起作用

#### fallbackLocale

`Locale`

预设的语言环境，找不到语言环境时进行回退。

#### messages

`LocaleMessages`

本地化的语言环境信息。

**返回实例属性和方法**

-----

#### locale
`WritableComputedRef<Locale>`

可响应性的 ref 对象，表示当前 i18n 实例所使用的 locale。

修改 ref 值会对局部或者全局语言集的 locale 进行更改，并触发翻译方法重新执行。

#### fallbackRoot

`boolean`

本地化失败时是否回归到全局作用域。

#### getLocaleMessage( locale )

```ts
function getLocaleMessage (locale: string): LocaleMessageObject
```

获取语言环境的 `locale` 信息。

#### setLocaleMessage( locale, message )

```ts
function setLocaleMessage(locale: Locale, messages: LocaleMessageObject): void
```

设置语言环境的 `locale` 信息。

#### mergeLocaleMessage( locale, message )

```ts
function mergeLocaleMessage(locale: Locale, messages: LocaleMessageObject): void
```

将语言环境信息 `locale` 合并到已注册的语言环境信息中。

#### messages

```ts
readonly messages: ComputedRef<{
   [K in keyof Messages]: Messages[K];
}>;
```

* **只读**

局部或者全局的语言环境信息。

#### isGlobal

`boolean`

是否是全局 i18n 实例。

#### t

```ts
function t(key: string, choice?: number, values: Array | Object): TranslateResult
```

文案翻译函数

根据传入的 key 以及当前 locale 环境获取对应文案，文案来源是全局作用域还是本地作用域取决于 `useI18n` 执行时是否传入对应的 `messages、locale` 等值。

**choice 参数可选** ，当传入 choice 时，t 函数的表现为使用复数进行翻译，和老版本中的 tc 函数表现一致。

```html
<template>
  <view>{{t('car', 1)}}</view>
  <view>{{t('car', 2)}}</view>

  <view>{{t('apple', 0)}}</view>
  <view>{{t('apple', 1)}}</view>
  <view>{{t('apple', 10, {count: 10})}}</view>
</template>

<script>
  // 语言环境信息如下：
  const messages = {
    en: {
      car: 'car | cars',
      apple: 'no apples | one apple | {count} apples'
    }
  }
</script>
```
输入如下：
```html
<view>car</view>
<view>cars</view>

<view>no apples</view>
<view>one apple</view>
<view>10 apples</view>
```
关于复数的更多信息可以点击[查看](https://kazupon.github.io/vue-i18n/zh/guide/pluralization.html#%E5%A4%8D%E6%95%B0)

**values 参数可选** ，如果需要对文案信息即逆行格式化处理，则需要传入 values。

```html
<template>
  // 模版输出 hello world
  <view>{{t('message.hello', { msg: 'hello'})}}</view>
</template>
<script>
  import {createComponent, useI18n} from "@mpxjs/core"

  const messages = {
    en: {
      message: {
        hello: '{msg} world'
      }
    }
  }
  
  createComponent({
    setup(){
        const { t } = useI18n({
          messages: {
              'en-US': en
          }
        })
      return {t}
    }
  })

</script>
```

#### te

```ts
function te(key: string): boolean
```


检查 key 是否存在。
