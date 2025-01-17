# 选项式 API

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
