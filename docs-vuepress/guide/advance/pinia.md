# 状态管理（pinia）

Mpx 参考 [Pinia](https://pinia.vuejs.org/) 设计实现了一套外部状态逻辑管理系统（pinia），允许跨页面/组件共享状态，其中的概念与 api 与 Pinia 保持一致，同时支持在 Mpx 组合式 API（Composition API）和选项式 API（Options API）模式下使用。

## 介绍

`pinia` 是一个状态管理容器，可支持复杂场景下的组件通信机制，与`Vuex`状态管理不同之处在于：

1. mutations 不再存在，使用 actions 来支持应用中状态的同步和异步变更。

2. 动态创建 store，使用`useStore`实现运行时动态创建 store。

3. 扁平架构，不再有 modules 嵌套结构，支持不同 store 之间的交叉组合方式使用。

### 创建 pinia

首先在应用中调用`createPinia`方法来创建全局 pinia 实例。

``` js
// app.mpx
import mpx from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

const pinia = createPinia()
mpx.use(pinia)
```
### 创建 store

然后调用`defineStore`方法，传入 store 唯一标识（id），来创建一个 store，支持 Setup 和 Options 两种风格的 store。

#### Setup store

``` js
// setup.js
import { defineStore } from '@mpxjs/pinia'
import { ref } from '@mpxjs/core'

export const useSetupStore = defineStore('setup', () => {
  const count = ref(0)
  const name = ref('pinia')
  function myName () {
    return name.value
  }
  function increment() {
    count.value++
  }
  return { count, name, myName, increment }
})
```
#### Options store

``` js
// options.js
import { defineStore } from '@mpxjs/pinia'
import { ref } from '@mpxjs/core'

export const useOptionsStore = defineStore('options', {
  state : () => {
    return {
      count: 0,
      name: 'pinia'
    }
  },
  getters: {
    myName(state) {
      return state.name
    }
  },
  actions: {
    increment () {
      this.$patch((state) => {
        state.count++
      })
    }
  }
})
```
### 使用 store

``` js
import { createComponent } from '@mpxjs/core'
import { storeToRefs, mapState, mapGetters, mapActions } from '@mpxjs/pinia'
import { useOptionsStore } from 'xxx/options'
import { useSetupStore } from 'xxx/setup'

// 选项式API（Options API）风格下通过mapHelper函数使用
createComponent({
  computed: {
    // options store
    ...mapState(useOptionsStore, ['name', 'count']),
    ...mapGetters(useOptionsStore, ['myName']),
    // setup store
    ...mapState(useSetupStore, {
      setupName: 'name',
      setupCount: 'count'
    }),
    ...mapGetters(useSetupStore, {
      setupGetName: 'myName'
    }),

  },
  methods: {
    // options store
    ...mapActions(useOptionsStore, ['increment']),
    // setup store
    ...mapActions(useSetupStore, {
      setupIncrement: 'increment'
    })
  }
})

// 组合式API（Setup API）风格下使用
createComponent({
  setup (props, context) {
    const setupStore = useSetupStore()
    const optionsStore = useOptionsStore()
    return {
      ...storeToRefs(setupStore),
      ...storeToRefs(optionsStore)
    }
  },
  ...mapActions(useSetupStore, ['increment'])
})
```
> 注意：在组合式 API（Setup API）模式下，直接解构获取到的 store 数据会失去响应性，需要通过 storeToRefs 方法处理赋予数据响应性。另外`storeToRefs`方法只会返回 state 或 getter。

## 使用插件

Mpx pinia 支持使用插件扩展当前 store 实例的功能，用法如下：

``` js
// onStoreAction.js，订阅所有store实例的方法
export const onStoreAction: context => {
  context.store.$onAction((
    {
      name,
      store,
      args,
      after,
      onError
    }) => {
      after(name => {
        console.error('after', name, store, args)
      })

      onError(error => {
        console.log('onError', error)
      })
    }, false)
}

// app.mpx
import mpx from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'
import { onStoreAction } from 'xxx/onStoreAction'

const pinia = createPinia()
pinia.use(onStoreAction)
mpx.use(pinia)
```
