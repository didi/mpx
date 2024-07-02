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

如果你的应用想使用 SSR 渲染模式，请将 pinia 的创建放在 `onAppInit` 钩子中执行
```js
// app.mpx

import mpx, { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

createApp({
  // ...
  onAppInit () {
    const pinia = createPinia()
    mpx.use(pinia)
    return {
      pinia
    }
  }
})
```

### 创建 store

然后调用`defineStore`方法，传入 store 唯一标识（id），来创建一个 store，支持 Setup 和 Options 两种风格的 store。

#### Setup store
与组合式 API 的 setup 函数类似，我们可以传入一个函数，该函数定义了一些响应式属性和方法，并返回一个带有我们想暴露出去的属性和方法的对象。

``` js
// setup.js
import { defineStore } from '@mpxjs/pinia'
import { ref, computed } from '@mpxjs/core'

export const useSetupStore = defineStore('setup', () => {
  const count = ref(0)
  const name = ref('pinia')
  const myName = computed(() => {
    return name.value
  })
  function increment() {
    count.value++
  }
  return { count, name, myName, increment }
})
```

在 Setup Store 中：
* `ref()` 就是 `state` 属性
* `computed()` 就是 `getters`
* `function()` 就是 `actions`

#### Options store

```js
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

在选项式 API 中使用，如果你不能使用组合式 API，但你可以使用 `computed`, `methods`, '...'，那你可以使用 `mapState()`, `mapActions()` 辅助函数
来将 `state`, `getter`, `action` 等映射到你的组件中。

无论是 optionsStore、还是 setupStore，我们都可以在选项式组件中使用，且使用方式并无差异，下方例子我们统一使用 useSetupStore 来作为示范例

```js
import { createComponent } from '@mpxjs/core'
import { storeToRefs, mapState, mapActions } from '@mpxjs/pinia'
import { useOptionsStore } from 'xxx/options'
import { useSetupStore } from 'xxx/setup'


// 选项式API（Options API）风格下通过mapHelper函数使用
createComponent({
  computed: {
    // 可以访问组件中的 this.name
    // 此处与直接从 useSetupStore 中读取的数据相同
    ...mapState(useSetupStore, ['name', 'count']),
    // 也可以将state修改别名，例如将name 注册为 otherName
    ...mapState(useSetupStore, {
      otherName: 'name',
      // 也可以写一个函数来获取对 useSetupStore 的访问权
      double: store => store.count * 2,
      // 也可以通过访问 `this` 拿到数据
      magicValue() {
        return this.count + this.double
      }
    }),
    // 在pinia中，getter 也是通过 mapState 来进行映射
    ...mapState(useSetupStore, ['myName'])
  },
  methods: {
    ...mapActions(useSetupStore, ['increment']),
    // 也可以将其注册问题 this.setupIncrement 方法
    ...mapActions(useSetupStore, {
      setupIncrement: 'increment'
    })
  }
})
```
**注意：** 在 `pinia` 中，getter 也是通过 mapState 来进行映射

在组合式API (Setup API) 风格下使用
```js
import { useSetupStore } from 'xxx/setup'
import { storeToRefs, mapState, mapActions } from '@mpxjs/pinia'

createComponent({
  setup (props, context) {
    const setupStore = useSetupStore()
    setupStore.count = 2
    // 作为 store 的一个属性，我们可以直接访问任何 getter(与 state )
    setupStore.myName // pinia

    function onIncrementClick() {
      // 调用 action 方法
      setupStore.increment()
      console.log('New Count:', setupStore.count)
    }
    return {
      onIncrementClick,
      ...storeToRefs(setupStore)
    }
  }
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
