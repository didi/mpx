# 网络请求


>Mpx提供了网络请求库fetch，抹平了微信，阿里等平台请求参数及响应数据的差异；同时支持请求拦截器，请求取消等

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

### fetch(config)， 正常的promisify风格的请求方法
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

#### params
设置请求参数，参数会以 Query String 的形式进行传递
```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	params: {
		age: 10
	},
	emulateJSON: true
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
	},
	emulateJSON: true 
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
CancelToken，实例属性，用于创建一个取消请求的凭证。

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
interceptors，实例属性，用于添加拦截器，包含两个属性，request & response

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
porxy，实例属性，用于添加拦截器，包含两个属性，request & response

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


### 请求参数校验
Validator

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
