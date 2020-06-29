# 周边拓展

## mpx-fetch

mpx-fetch提供了一个实例**xfetch** ，该实例包含以下api

### fetch(config)
>  正常的promisify风格的请求方法
- **参数：**

    - **config**
    
        - 预期：`Object`
        
        config可指定以下属性：
        - **url**
        
            预期：`string`
        
            请求Url
        - header
    
            预期：`Object`
        
            请求头信息
        - method
    
            预期：`string`
        
            请求方式
        - data
    
            预期：`Object`
        
            请求数据
        - params
    
            预期：`Object`
        
            请求数据
        - emulateJSON
        
            预期：`Boolean`
        
            设置为true时，等价于header = {'content-type': 'application/x-www-form-urlencoded'}

- **示例：**

```js
import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'
mpx.use(mpxFetch)
// 第一种访问形式
mpx.xfetch.fetch({
	url: 'http://xxx.com'
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
## mpx-mock

## api-proxy

## webview-bridge
