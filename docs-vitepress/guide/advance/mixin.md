# 使用 mixin

Mpx 提供了一套完善的 mixin 机制，有人可能要问，原生小程序中已经支持了 behaviors，为何我们还需要提供 mixin 呢？主要有以下两点原因：
1. Behaviors 是平台限度的，只有在部分小程序平台中可以使用，而且内置 behaviors 承载了除了 mixin 外的其他功能，框架提供的 mixin 是一个与平台无关的基础能力；
2. Behaviors 只有组件支持使用，页面不支持，而且只支持局部声明，框架提供的 mixin 与组件页面无关，且支持全局 mixin 声明。

## 局部 Mixin
`App`、`Page`、`Component` 接收 mixins 参数,参数格式为[Mixin1(Object),Mixin2(Object)]
> Mixin 混合实例对象可以像正常的实例对象一样包含选项，相同选项将进行逻辑合并。举例：如果 mixin1 包含一个钩子 ready,而创建组件 Component 也有一个钩子 ready，两个函数将被调用。 Mixin 钩子按照传入顺序(数组顺序)依次调用，并在调用组件自身的钩子之前被调用。
```js
// mixin.js
export default {
  data: {
    list: {
      'phone': '手机',
      'tv': '电视',
      'computer': '电脑'
    }
  },
  ready () {
    console.log('mixins ready:', this.list.phone)
  }
}
```
```html
<template>
  <view class="list">
    <view wx:for="{{list}}" wx:key="index">{{item}}</view>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'
  import mixins from '../common/mixins'

  createComponent({
    mixins: [mixins],
    data: {
      list: ['手机', '电视', '电脑']
    },
    ready () {
      console.log('component ready:', this.list.phone)
    }
  })
</script>
```
```shell
// 输出结果为
mixins ready: 手机
component ready: 手机
```

## 全局 Mixin

Mpx 中可以使用 `mpx.injectMixins` 方法配置全局 mixin，能够按照 App / 组件 / 页面维度自由配置，简单示例如下：

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
