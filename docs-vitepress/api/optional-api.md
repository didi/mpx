# 选项式 API {#optional-api}

### watch 调试选项 {#watch-debug-options}

页面和组件的选项式 `watch` 支持在 `handler` 对象中配置 `onTrack` / `onTrigger`。`onTrack` 在侦听器收集依赖时调用，`onTrigger` 在依赖变化通知侦听器时同步调用。

```js
import { createComponent } from '@mpxjs/core'

createComponent({
  data: { count: 0 },
  watch: {
    count: {
      handler(value, oldValue) {
        console.log(oldValue, value)
      },
      onTrack(event) {
        console.log('watch tracked', event.type, event.key)
      },
      onTrigger(event) {
        debugger
      }
    }
  }
})
```

支持小程序和 Mpx2RN，Web 使用 Vue 2.7 的原生实现；仅在开发环境生效，生产环境忽略调试回调。`onTrigger` 不代表 `handler` 一定执行，也不改变原有侦听回调的调度时机。回调中只观察事件或设置断点，避免修改响应式状态；Web 的 `onTrack` 中额外读取响应式状态还可能增加依赖或递归触发自身。

[`this.$watch`](instance-api.md#watch) 同样支持这两个选项。选项式 `computed` 不支持在属性配置中传入调试回调，独立排查计算属性需使用组合式 [`computed(getter, debugOptions)`](reactivity-api.md#computed-debug-options)。事件结构及更多示例见[响应式调试指南](../guide/composition-api/reactivity-debugging.md)。

### options.shallowReactivePattern
- **类型：** `RegExp`
- **详细：**

取消data/properties内数据的深度响应。

适用于每次更新均为整体的更新而非局部少量数据更新的大型数据，可减少掉对应属性“数据响应初始化”以及“diff比较”两个阶段的耗时

```html
<!-- child -->
<script>
createComponent({
  properties: {
    bigPropData: Object
  },
  data: {
    // 这个是视图上需要用到的大数据
    bigData: { a: 0 }
  },
  options: {
    // 配置具体哪些data或者properties需要忽略响应
    shallowReactivePattern: /bigData|bigPropData/
  }，
  methods: {
    foo() {
      this.bigData = { a: 1 } // 可触发视图更新
    },
    bar() {
      this.bigData.a = 2 // 不可触发视图更新
    }
  }
})
</script>

<!-- perant -->
<template>
  <child bigPropData="{{parentBigData}}"/>
</template>
<script>
createComponent({
  data: {
    parentBigData: []
  },
  options: {
    shallowReactivePattern: /parentBigData/ // 父组件中传入的data也需要开启shallowReactive
  }
})
</script>
```

> 注意

### onAppInit
- **类型：** `Function`
- **详细：**

通过 createApp 注册一个应用期间被调用，输出 web 时 SSR渲染模式下，需要在此钩子中生成 pinia 的实例并返回。


### onSSRAppCreated
- **类型：** `Function`
- **详细：**

SSR渲染定制钩子，在服务端渲染期间被调用，可以在这个钩子中可以去返回应用程序实例，以及完成服务器端路由匹配，store 的状态挂载等。类 Vue 的 server entry 中的功能。

**注意：** 仅 web 环境支持
