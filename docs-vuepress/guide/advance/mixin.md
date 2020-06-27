# 使用 mixin

Mpx 提供了一套完善的 mixin 机制，有人可能要问，原生小程序中已经支持了 behaviors，为何我们还需要提供 mixin 呢？主要有以下两点原因：
1. Behaviors 是平台限度的，只有在部分小程序平台中可以使用，而且内置 behaviors 承载了除了 mixin 外的其他功能，框架提供的 mixin 是一个与平台无关的基础能力；
2. Behaviors 只有组件支持使用，页面不支持，而且只支持局部声明，框架提供的 mixin 与组件页面无关，且支持全局 mixin 声明。


todo mixin 简单示例
```js

```

## 全局 Mixin

Mpx中可以使用 `mpx.injectMixins` 方法配置全局 mixin，能够按照 App / 组件 / 页面维度自由配置，简单示例如下：

```js
import mpx from '@mpxjs/core'

// 第一个参数为 mixins，可以混入任意配置，第二个参数为混入生效范围，可传递 'app' / 'page' / 'component' 字符串或由其组成的数组
mpx.injectMixins([
  {
    data: {
      customData: '123'
    }
  }
], ['page'])

// mpx.mixin 为 mpx.injectMixins 的别名，混入单个 mixin 时可以直接传递对象，生效范围可传递字符串
mpx.mixin({
  methods: {
    useCustomData () {
      console.log(this.customData)
    }
  }
}, 'component')

// 当未传递生效范围时默认为全局生效，对 app / page / component 都生效
mpx.mixin({
  computed: {
    processedCustomData () {
      return this.customData + '321'
    }
  }
})
```
