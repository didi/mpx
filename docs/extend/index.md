# 扩展mpx

mpx支持使用mpx.use来进行扩展。扩展本身需要提供一个install方法或本身是一个function，该函数接收一个proxyMPX。扩展的形式采用直接在proxyMPX挂载新api属性或在prototype上挂属性。需要注意的是，一定要在app创建之前进行mpx.use

### 基础例子

扩展: test.js

```js
export default function install(proxyMPX) {
  proxyMPX.newApi = () => console.log('is new api')
  proxyMPX
    .injectMixins({
      onLaunch() {
        console.log('app onLaunch')
      }
    }, 'app')
    .injectMixins({
      onShow() {
        console.log('page onShow')
      }
    }, 'page') // proxyMPX.injectMixins === proxyMPX.mixin

    //  注意：proxyMPX.prototype上挂载的属性都将挂载到组件实例（page实例、app实例上，可以直接通过this访问）, 可以看mixin中的case
    proxyMPX.prototype.testHello = function() {
      console.log('hello')
    }
}
```

在app.js内注入扩展

```js
import mpx from '@mpxjs/core'
import test from './test'
mpx.use(test)
mpx.createApp({
  onLaunch() {
    mpx.newApi() // out put: "is new api"
    this.testHello() // output: 'hello'
  }
})
```

### [目前已有扩展](https://git.xiaojukeji.com/webapp/mpx-extension)

使用 npm 安装

- fetch: @mpxjs/fetch [详细介绍](extend/index.md#fetch)

- 小程序api promisify：@mpxjs/promisify，[详细介绍](extend/index.md#promisify)



## Fetch

小程序request存在不限域名的并发限制，因此封装一个fetch来处理这种缺陷，能支持请求优先级，同时fetch还支持拦截器，请求取消等等


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

### 导入api说明

mpx-fetch提供了一个实例 **xfetch** ，该实例包含以下api

- fetch(config, priority)， 正常的promisify风格的请求方法, priority表示请求优先级（normal，low），默认为normal
- addLowPriorityWhiteList(rules)， 按域名规则设置低优先级请求的白名单，接收一个参数，可以是字符串，也可以是正则表达式，也可以是数组 (如果fetch传入了第二个参数，那么无视这个白名单)
- CancelToken，实例属性，用于创建一个取消请求的凭证。
- create()， 用于创建一个新的mpx-fetch实例
- interceptors，实例属性，用于添加拦截器，包含两个属性，request & response

### 请求优先级

```js
mpx.xfetch.fetch({
	url: 'http://xxx.com',
	data: {
		name: 'test'
	}
}, 'low')

// or addSignWhiteList
mpx.xfetch.addLowPriorityWhiteList('http://xxx.com')
```

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
### 自动过滤值为undefined和null的属性，其中null未转换成空字符串

## Promisify

小程序api的异步操作主要是采用回调进行，mpx-promisify主要是将小程序（支持success，fail）的api转换成promise形式的调用，并不是全部转换，具体可参考小程序api

### 使用说明

```js
import mpx from '@mpxjs/core'
import promisify from '@mpxjs/promisify'
mpx.use(promisify)
mpx.request({
	url: 'http://xxx.com'
}).then(res => {
	console.log(res.data)
})
```
