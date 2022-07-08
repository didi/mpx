# 网络请求


>Mpx提供了网络请求库fetch，抹平了微信，阿里等平台请求参数及响应数据的差异；同时支持请求拦截器、请求取消、请求代理、请求参数校验等功能

## 安装
```sh
npm i @mpxjs/fetch
```

## 使用说明

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

## 导出说明

mpx-fetch提供了一个实例 **xfetch** ，该实例包含以下api

### fetch(config)
正常的 promisify 风格的请求方法, config 支持以下配置
#### params
设置请求参数，参数会以 Query String 的形式进行传递
```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	params: {
		age: 10
	}
})
```

#### data
设置请求参数，参数会在 body 中进行传递
```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	data: {
		name: 'test'
	}
})
```
#### emulateJSON
设置为 true 时，等价于 header = {'content-type': 'application/x-www-form-urlencoded'}

```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	data: {
		name: 'test'
	},
	emulateJSON: true
})
```
#### timeout
设置超时时间

```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	data: {
		name: 'test'
	},
	timeout: 10000
})
```

#### isPre
设置预请求开关，若设置为 true，则两次请求间隔在有效期内且请求参数和请求方式完全一致的情况下，返回上一次请求的结果
```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	params: {
		age: 10
	},
	isPre: true
})
```

#### cacheInvalidationTime
设置预请求缓存有效时长，默认为 5000ms
```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	params: {
		age: 10
	},
	cacheInvalidationTime: 3000
})
```

### 请求中断
CancelToken，用于创建一个取消请求的凭证。

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

### 请求拦截器
interceptors，用于添加拦截器，包含两个属性，request & response

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

### 请求代理
#### setProxy
配置代理项,请求会按设置的规则进行代理
```js
mpx.xfetch.setProxy([{
    test: { // 此项匹配之后，会按下面 proxy 配置的修改请求配置    	
        host: 'mock.didi.com',
        port: 8080
	},
	proxy: {
    	host: 'test.didi.com',
        port: 8888
	},
	waterfall: true // 为 true 时会将此次修改后的请求配置继续传递给下面的规则处理
}])
```
#### getProxy
查看已有的代理配置
```js
console.log(mpx.xfetch.getProxy())
```
#### prependProxy
向前追加代理规则
```js
mpx.xfetch.prependProxy({
	test: {},
	proxy: {},
	waterfall: true
})
```
#### appendProxy
向后追加代理规则
```js
mpx.xfetch.appendProxy({
	test: {},
	proxy: {},
	waterfall: true
})
```
#### clearProxy
解除所有的代理配置
```js
mpx.xfetch.clearProxy()
```
### 请求参数校验
配置请求参数校验规则
::: warning 注意
参数校验功能会阻断 xfetch 发送请求,建议在测试阶段使用
:::

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
        type: ['string', 'number'], //支持多个类型
        require:true // 属性是否必须
      },
      platform_type: {
        type: 'enum',//支持枚举类型校验
        include: [1, 2, 3]
      }
    },
    greedy: false // 是否校验所有参数 不写这个属性或属性值为true校验所有参数
  }
])
```
