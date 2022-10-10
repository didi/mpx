# 网络请求


Mpx 提供了网络请求库 fetch，抹平了微信，阿里等平台请求参数及响应数据的差异；同时支持请求拦截器，请求取消等


### 使用说明

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

### 导出说明

mpx-fetch提供了一个实例 **xfetch** ，该实例包含以下api

- fetch(config)， 正常的promisify风格的请求方法
- CancelToken，实例属性，用于创建一个取消请求的凭证。
- interceptors，实例属性，用于添加拦截器，包含两个属性，request & response

### 请求拦截器

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

### 请求中断

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

### 支持 emulateJSON

```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	data: {
		name: 'test'
	},
	emulateJSON: true // 等价于header = {'content-type': 'application/x-www-form-urlencoded'}
})
```

### 支持 timeout

```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	data: {
		name: 'test'
	},
	timeout: 10000 // 超时时间
})
```

### 支持 params
```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	params: {
		name: 'test'
	}
})

mpx.xfetch.fetch({
	url: 'http://xxx.com',
	method: 'POST',
	params: {
		age: 10
	},
	data: {
		name: 'test'
	},
	emulateJSON: true // 等价于header = {'content-type': 'application/x-www-form-urlencoded'}
})
```


### 在组合式 API 中发起请求
在组合式 API 中我们提供了 [useFetch](/api/extend.html#usefetch) 方法来访问 `xfetch` 实例对象

```js
// app.mpx
import mpx, { createComponent } from '@mpxjs/core'
import { useFetch } from '@mpxjs/fetch'

createComponent({
  setup() {
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
  }
})

```
