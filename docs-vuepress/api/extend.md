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
        - **timeout**
                            
            类型：`Number`
                            
            单位为毫秒。若不传，默认读取app.json文件中__networkTimeout属性。 对于超时的处理可在 catch 方法中进行
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
> 命名导出，用于创建一个取消请求的凭证。

- **示例**:
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
> 命名导出，用于创建一个新的mpx-fetch实例进行独立使用

- **示例**:
```js
import { XFetch } from '@mpxjs/fetch'
const newFetch = new XFetch(options) // 生成新的mpx-fetch实例
```

### interceptors
> 实例属性，用于添加拦截器，包含两个属性，request & response

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

### proxy 代理
#### setProxy
> 配置代理项，可以传入一个数组或者一个对象，请求会按设置的规则进行代理

- **参数：**

    类型： `{Array | Object}`
    - **test**

        类型：`object`

        - url

            类型：`string`

            详细：全路径匹配，规则可以参考[path-to-regexp](https://www.npmjs.com/package/path-to-regexp)，也可参考下面的简单示例。

            ::: warning
            如果设置了此项，则 protocol、host、port、path 规则不再生效。此项支持 path-to-regexp 匹配，protocol、host、port、path 为全等匹配。
            :::

        - protocol

            类型：`string`

            详细：待匹配的协议头

        - host

            类型：`string`

            详细：不包含端口的 host

        - port

            类型：`string`

            详细：待匹配的端口

        - path

            类型：`string`

            详细：待匹配的路径

        - params

            类型：`object`

            详细：同时匹配请求中的 `params` 和 `query`

        - data

            类型：`object`

            详细：匹配请求中的 `data`

        - header

            类型：`object`

            详细：匹配请求中的 `header`

        - method

            类型：`Method | Method[]`

            详细：匹配请求方法，不区分大小写，可以传一个方法，也可以传一个方法数组

        - custom

            类型：`function`

            详细：自定义匹配规则，参数会注入原始请求配置，结果需返回 `true` 或 `false`

            ::: warning
            如果设置了此项，匹配结果以此项为准，以上规则均不再生效。
            :::

    - **proxy**

        类型：`object`

        - url

            类型：`string`

            详细：代理的 url

        - protocol

            类型：`string`

            详细：修改原请求的协议头

        - host

            类型：`string`

            详细：代理的 host，不包含端口号

        - port

            类型：`string`

            详细：修改端口号

        - path

            类型：`string`

            详细：修改原请求路径

        - params

            类型：`object`

            详细：合并原请求的 params

        - data

            类型：`object`

            详细：合并原请求的 data

        - header

            类型：`object`

            详细：合并原请求的 header

        - method

            类型：`Method`

            详细：替换原请求的方法

        - custom

            类型：`function`

            详细：自定义代理规则，会注入两个参数，第一个是上一个匹配规则处理后的请求配置，第二个是 match 的参数对象，结果需返回要修改的请求配置对象。

            ::: warning
            如果设置了此项，最终代理配置将以此项为准，其他配置规则均不再生效。
            :::

    - **waterfall**

        类型：`boolean`

        详细：默认为 `false`，为 `false` 时，命中当前规则处理完就直接返回；为 `true` 时，命中当前匹配规则处理完成后将结果传递给下面命中匹配规则继续处理。

- **示例：**
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

- **示例：**
```js
mpx.xfetch.prependProxy({
	test: {},
	proxy: {},
	waterfall: true
})
```

#### appendProxy
> 向后追加代理规则

- **示例：**
```js
mpx.xfetch.appendProxy({
	test: {},
	proxy: {},
	waterfall: true
})
```

#### getProxy
> 查看已有的代理配置

- **示例：**
```js
console.log(mpx.xfetch.getProxy())
```

#### clearProxy
> 解除所有的代理配置

- **示例：**
```js
mpx.xfetch.clearProxy()
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

## mpx-mock

- 请参考 [数据 mock](/guide/extend/mock.md)

### 使用参数校验功能

::: warning
参数校验功能会阻断xfetch发送请求,建议在测试阶段使用
:::
#### setValidator
> 配置校验规则，可以自定义，也可以根据以下规则传入一个数组

- **参数：**
    
    类型  `Array`
  
    - **test**
  
    - 类型：`{object | function}`

        - url

            类型：`string`

            详细：全路径匹配，规则可以参考[path-to-regexp](https://www.npmjs.com/package/path-to-regexp)，也可参考下面的简单示例。

            ::: warning
            如果设置了此项，则 protocol、host、port、path 规则不再生效。此项支持 path-to-regexp 匹配，protocol、host、port、path 为全等匹配。
            :::

        - protocol

            类型：`string`

            详细：待匹配的协议头

        - host

            类型：`string`

            详细：不包含端口的 host

        - port

            类型：`string`

            详细：待匹配的端口

        - path

            类型：`string`

            详细：待匹配的路径

        - params

            类型：`object`

            详细：同时匹配请求中的 `params` 和 `query`

        - data

            类型：`object`

            详细：匹配请求中的 `data`

        - header

            类型：`object`

            详细：匹配请求中的 `header`

        - method

            类型：`Method | Method[]`

            详细：匹配请求方法，不区分大小写，可以传一个方法，也可以传一个方法数组

        - custom

            类型：`function`

            详细：自定义匹配规则，参数会注入原始请求配置，结果需返回 `true` 或 `false`

            ::: warning
            如果设置了此项，匹配结果以此项为准，以上规则均不再生效。
            :::
    - **validator**
    - 类型: `{object}`
        ::: warning
        object类型有两种配置方式，第一种是区分params(一般对应get请求)和data(一般对应post/put请求)分别配置，第二种不区分两种请求配置，如果不分开配置所有参数不区分请求方式全部校验，详情请看以下示例。
        function类型为自定义配置,第一个参数是接口请求的参数以及url,请求方法等
        注：post请求会校验params和data get请求会校验params 
        :::
        - params
            类型：`object`
            详细：参数对象
            - type
            类型:  `{ Array | string }`
            详细：Array类型时支持多种类型校验，type支持的类型有基本类型、enum(枚举值)、any(默认不校验)
            - require
            类型：`boolean`
            详细：参数是否必须
            - include
            类型：`Array`
            详细： 枚举类型校验时提供
        - data
            类型：`object`
            详细：参数对象
            - type
            类型:  `{ Array | string }`
            详细：Array类型时支持多种类型校验，type支持的类型有基本类型、enum(枚举值)、any(默认不校验)
            - require
            类型：`boolean`
            详细：参数是否必须
            - include
            类型：`Array`
            详细： 枚举类型校验时提供
        - custom

            类型：`function`

            详细：自定义校验规则，会注入一个参数，是上一个匹配规则处理后的请求配置

            ::: warning
            如果设置了此项，最终代理配置将以此项为准，其他配置规则均不再生效。
            :::
            - **自定义校验规则返回数据的格式**

            ```js
            interface ValidatorRes {
              valid: boolean,
              message: Array<string>
            }
            
            const validatorCustom = (config:Config) => boolean｜ValidatorRes
            ```
    - **greedy**
        是否默认校验所有参数 没有这个属性或者属性值为true时校验所有参数，否则校验填写校验规则的参数值
#### getValidator
> 返回所有校验规则

- **示例**
```js

mpx.xfetch.setValidator([
  {
    test: {
      protocol: 'https:',// 配置协议
      host: 'xxx.com',// 配置域名
      port: '',// 配置端口
      path: '/app',// 配置路径
      method: 'GET'// 配置请求方法
    },
    validator: { // validator直接配置参数 无论是post请求还是get请求校验所有参数
      lang: {
        type: 'string'
      },
      project_id: {
        type: 'number'
      },
      phone: {
        type: ['string', 'number'] //支持多个类型
        require:true // 属性是否必须
      },
      platform_type: {
        type: 'enum',//支持枚举类型校验
        include: [1, 2, 3]
      }
    },
    greedy:false // 是否校验所有参数 不写这个属性或属性值为true校验所有参数
  },
  {
    test: {
      protocol: 'https:',
      host: 'xxxx.com',
      port: '',
      path: '/app',
      method: 'POST'
    },
    validator: { // validator配置不同请求的参数 post校验params和data get校验params
      params: {
      },
      data: {
      }
    }
  },
  {
    test: {
      custom: testCustom // 自定义匹配规则 必须是方法
    },
    validator: {
      custom: validatorCustom // 自定义校验规则 必须是方法
    }
  }
])
```
