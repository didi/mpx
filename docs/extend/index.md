# 扩展mpx

## 目前已有插件

- 网络请求库fetch: @mpxjs/fetch [详细介绍](#fetch) [源码地址](https://github.com/didi/mpx/tree/master/packages/fetch)

- ~~小程序api promisify：@mpxjs/promisify~~ (已废弃，推荐使用新的[api-proxy](#使用promise形式))

- 小程序API转换及promisify：@mpxjs/api-proxy [详细介绍](#api-proxy) [源码地址](https://github.com/didi/mpx/tree/master/packages/api-proxy)

- mock数据：@mpxjs/mock [详细介绍](#mock) [源码地址](https://github.com/didi/mpx/tree/master/packages/mock)

## 开发插件

mpx支持使用mpx.use使用插件来进行扩展。插件本身需要提供一个install方法或本身是一个function，该函数接收一个proxyMPX。插件将采用直接在proxyMPX挂载新api属性或在prototype上挂属性。需要注意的是，一定要在app创建之前进行mpx.use

### 基础例子

扩展: test.js

```js
export default function install(proxyMPX) {
  proxyMPX.newApi = () => console.log('is new api')
  proxyMPX
    .mixin({
      onLaunch() {
        console.log('app onLaunch')
      }
    }, 'app')
    .mixin({
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

在app.js内使用插件

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

## API-PROXY

> convert API at each end 各个平台之间 api 进行转换

## Usage

```js
// 使用 mpx 生态

import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, options)
```

```js
// 单独使用
import apiProxy from '@mpxjs/api-proxy'

apiProxy(target, options) // target 为要抹平的对象
```

## Options

|参数名称|类型|含义|是否必填|默认值|备注|
|---|---|---|---|---|---|
|platform|Object|各平台之间的转换|否|{ from:'', to:'' }|使用 mpx 脚手架配置会自动进行转换，无需配置|
|exclude|Array(String)|跨平台时不需要转换的 api|-|
|usePromise|Boolean|是否将 api 转化为 promise 格式使用|否|false|-|
|whiteList|Array(String)|强行转化为 promise 格式的 api|否|[]|需要 usePromise 设为 true|

## example

#### 普通形式

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  exclude: ['showToast'] // showToast 将不会被转换为目标平台
})

mpx.showModal({
  title: '标题',
  content: '这是一个弹窗',
  success (res) {
    if (res.cancel) {
      console.log('用户点击取消')
    }
  }
})
```

#### 使用promise形式

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  usePromise: true,
  whiteList: ['showToast'] // showToast 将不能使用 promise 形式
})

mpx.showActionSheet({
  itemList: ['A', 'B', 'C']
})
.then(res => {
  console.log(res.tapIndex)
})
.catch(err => {
  console.log(err)
})
```

## Mock

mock数据生成规则同[mockjs](https://github.com/nuysoft/Mock/wiki)

### 使用说明

```js
import mock from '@mpxjs/mock'
// rule 为字符串或正则表达式
mock([{
  url: 'http://api.example.com',
  rule: {
		'list|1-10': [{
			'id|+1': 1
		}]
	}
}])
```
