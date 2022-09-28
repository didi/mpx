# 创建实例 API

**注意：** 以下 API 在 **2.8** 版本后无法通过全局应用实例 `mpx` 访问。若项目中有类似 mpx.createApp 的用法，在升级到 **2.8** 版本后请进行修改。

## createApp
> 注册一个小程序，接受一个 Object 类型的参数
- **用法：**
```js
createApp(options)
```

- **参数：**
    - `{Object} options`

      可指定小程序的生命周期回调，以及一些全局变量等
  

- **示例：**
```js
import {createApp} from '@mpxjs/core'

createApp({
  onLaunch () {
    console.log('Launch')
  },
  onShow () {
    console.log('Page show')
  },
  //全局变量 可通过getApp()访问
  globalDataA: 'I am global dataA',
  globalDataB: 'I am global dataB'
})
// 或者
createApp(options)
```


## createPage
> 类微信小程序（微信、百度、头条等）内部使用[Component的方式创建页面](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)，所以除了支持页面的生命周期之外还同时支持组件的一切特性。当使用 Component 创建页面时，页面生命周期需要写在 methods 内部（微信小程序原生规则），mpx 进行了统一封装转换，页面生命周期都写在最外层即可

- **用法：**
    ```js
    createPage(options, config?)
    ```
- **参数：**
    - `{Object} options`

      具体形式除了 computed、watch 这类 Mpx 扩展特性之外，其他的属性都参照原生小程序的官方文档即可。
    - `{Object} config`（可选参数）

      如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过 config.isNative 传 true 声明。
      如果有需要复写/改写最终调用的创建页面的构造器，可以通过 config 对象的 customCtor 提供。
      **注意:**
      mpx本身是用 component 来创建页面的，如果传page可能在初始化时候生命周期不正常导致取props有一点问题

- **示例：**
```js
import {createPage} from '@mpxjs/core'

createPage({
  data: {test: 1},
  computed: {
    test2 () {
      return this.test + 1
    }
  },
  watch: {
    test (val, old) {
      console.log(val, old)
    }
  },
  onShow () {
    this.test++
  }
})
```

## createComponent
> 创建自定义组件，接受两个Object类型的参数。

- **用法：**
    ```js
    createComponent(options, config?)
    ```
- **参数：**
    - `{Object} options`

      具体形式除了 computed、watch 这类 Mpx 扩展特性之外，其他的属性都参照原生小程序的官方文档即可。
    - `{Object} config`（可选参数）

      如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过 config.isNative 传 true 声明。
      如果有需要复写/改写最终调用的创建组件的构造器，可以通过 config 对象的 customCtor 提供。


- **示例：**
```js
import {createComponent} from '@mpxjs/core'

createComponent({
  properties: {
    prop: {
      type: Number,
      value: 10
    }
  },
  data: {test: 1},
  computed: {
    test2 () {
      return this.test + this.prop
    }
  },
  watch: {
    test (val, old) {
      console.log(val, old)
    },
    prop: {
      handler (val, old) {
        console.log(val, old)
      },
      immediate: true // 是否首次执行一次
    }
  }
})
```
