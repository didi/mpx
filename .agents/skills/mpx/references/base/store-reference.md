# 状态管理

本页描述 Mpx 提供的状态管理方案及其基准用法。方案是否适用于具体目标端或 SSR 场景，需结合对应差异参考判断。**`@mpxjs/pinia`（Pinia 风格）为当前优先推荐**；新功能、新模块及与组合式 API 混编时，宜采用 Pinia 范式。若工程已深度使用 **`@mpxjs/store`（Vuex 风格）**，可继续维护，无需为切换输出端单独换栈；同一业务域避免用两套方案重复建模。

> SSR 例外：Web SSR 需在 `onAppInit` 中为每个请求创建并返回 Pinia，不使用模块级共享实例；`@mpxjs/store` 不支持 SSR 状态同步。涉及 SSR 时先读 [SSR 请求隔离与状态管理](../web/ssr-reference.md#请求隔离与状态管理)。下文入口单例示例用于普通客户端。

## 目录

- [`@mpxjs/pinia`（Pinia 风格，推荐）](#mpxjspiniapinia-风格推荐)
  - [创建 pinia](#创建-pinia)
  - [使用 store（选项式 API）](#使用-store选项式-api)
  - [使用 store（组合式 API）](#使用-store组合式-api)
- [`@mpxjs/store`（Vuex 风格）](#mpxjsstorevuex-风格)
  - [创建 store](#创建-store)
  - [多实例 store](#多实例-store)
  - [使用 store（选项式 API）](#使用-store选项式-api-1)
  - [使用 store（组合式 API）](#使用-store组合式-api-1)
  - [注意事项](#注意事项)
- [选型建议](#选型建议)

## `@mpxjs/pinia`（Pinia 风格，推荐）

概念与 API 与 Pinia 对齐，与 Vuex 式 store 的主要差异包括：

1. 无 **`mutations`**，同步与异步状态变更都通过 **`actions`** 完成。  
2. 运行时通过 **`useXxxStore()`** 动态获取 store 实例。  
3. **扁平**结构，无 `modules` 嵌套；多个 store 之间可组合使用。

### 创建 pinia

在入口调用 **`createPinia()`** 后即可使用对应 store，**无需再执行 `Mpx.use(pinia)`**；若需注册插件，在得到的实例上执行 **`pinia.use(plugin)`**。

```js
// app.mpx（节选）
import { createPinia } from '@mpxjs/pinia'

const pinia = createPinia()
```

**定义 store：`defineStore(id, setupFn | options)`**

Setup Store 与组合式 **`setup`** 类似：`ref` 视为 state，`computed` 视为 getter，普通函数视为 action。

```js
// stores/setup.js
import { defineStore } from '@mpxjs/pinia'
import { ref, computed } from '@mpxjs/core'

export const useSetupStore = defineStore('setup', () => {
  const count = ref(0)
  const name = ref('pinia')
  const myName = computed(() => name.value)
  function increment () {
    count.value += 1
  }
  return { count, name, myName, increment }
})
```

Options Store 示例：

```js
// stores/options.js
import { defineStore } from '@mpxjs/pinia'

export const useOptionsStore = defineStore('options', {
  state: () => ({
    count: 0,
    name: 'pinia'
  }),
  getters: {
    myName (state) {
      return state.name
    }
  },
  actions: {
    increment () {
      this.count += 1
    }
  }
})
```

### 使用 store（选项式 API）

在 Pinia 中，**getter 同样通过 `mapState` 映射**（`mapGetters` 与 `mapState` 等价别名）。options / setup 两种 store 在选项式组件中的用法相同。

```js
import { createComponent } from '@mpxjs/core'
import { mapState, mapActions } from '@mpxjs/pinia'
import { useSetupStore } from '../stores/setup'

createComponent({
  computed: Object.assign(
    {},
    mapState(useSetupStore, ['name', 'count']),
    mapState(useSetupStore, {
      otherName: 'name',
      double: (store) => store.count * 2,
      magicValue () {
        return this.count + this.double
      }
    }),
    mapState(useSetupStore, ['myName'])
  ),
  methods: Object.assign(
    {},
    mapActions(useSetupStore, ['increment']),
    mapActions(useSetupStore, {
      setupIncrement: 'increment'
    })
  )
})
```

### 使用 store（组合式 API）

直接解构 store 会丢失响应式，需用 **`storeToRefs`**；**`storeToRefs` 仅包含 state 与 getter**。

```js
import { createComponent } from '@mpxjs/core'
import { storeToRefs } from '@mpxjs/pinia'
import { useSetupStore } from '../stores/setup'

createComponent({
  setup (props, context) {
    const setupStore = useSetupStore()
    function onIncrementClick () {
      setupStore.increment()
    }
    return Object.assign(
      { onIncrementClick },
      storeToRefs(setupStore)
    )
  }
})
```

**插件**：在 **`createPinia()`** 得到实例后执行 **`pinia.use(plugin)`**；例如通过 **`store.$onAction`** 订阅 action 前后钩子。

## `@mpxjs/store`（Vuex 风格）

参考 Vuex：**`state` / `getters` / `mutations` / `actions`**。与随意挂到全局的普通对象相比：① store 内状态是 **响应式** 的；② **不能直接改 `state`**，须通过 **`commit` mutation** 变更，便于追溯。异步与组合逻辑放在 **`actions`** 中 **`dispatch`**。与「单一状态树 + `this.$store`」不同，Mpx 支持 **多实例 store**，组件内需 **显式引入** 实例，再用计算属性或 **`mapState` / `mapGetters` 等** 注入。

### 创建 store

从 **`@mpxjs/core`** 引入（由 core 再导出 **`@mpxjs/store`**，与直接依赖 **`@mpxjs/store`** 等价）。

**优先使用 `createStoreWithThis`**：getter / mutation / action 内通过 **`this.state`**、**`this.commit`** 等访问，与 **`createStateWithThis` / `createGettersWithThis` / `createMutationsWithThis` / `createActionsWithThis`** 等辅助声明配合时，**TypeScript 类型推导更完整**。**`createStore`** 仍为合法写法：getter、mutation 以 **`(state, …)`**、action 以 **`(context, …)`** 接收参数，在 TS 下推导通常弱于 **`createStoreWithThis`**。

```js
// store.js
import { createStoreWithThis } from '@mpxjs/core'

const store = createStoreWithThis({
  state: {
    count: 0
  },
  getters: {
    doubled () {
      return this.state.count * 2
    }
  },
  mutations: {
    increment () {
      this.state.count += 1
    },
    subCount () {
      this.state.count -= 1
    }
  },
  actions: {
    increment () {
      this.commit('increment')
    }
  }
})

export default store
```

### 多实例 store

多个 store 可并列创建、并通过 **`deps`** 进行组合，`deps` 里的 **key** 即命名空间，依赖方的 **`state` / `mutations` 等** 会挂到当前 store 的 **`state[key]`**、**`commit('key.mutationName')`** 等路径下。

```js
import { createComponent, createStoreWithThis } from '@mpxjs/core'

// 子模块：普通多实例之一，可被多个上层 store 复用
const childStore = createStoreWithThis({
  state: { n: 0 },
  mutations: {
    addN () {
      this.state.n += 1
    }
  }
})

// 根模块：deps 写在 options 根；childStore 挂到 state.child（命名空间 = 键名 child）
const rootStore = createStoreWithThis({
  state: { local: 0 },
  getters: {
    sum () {
      // this.state.child 与 childStore.state 同源，改任一侧都会联动
      return this.state.local + this.state.child.n
    }
  },
  mutations: {
    addLocal () {
      this.state.local += 1
    },
    // 触发依赖 store 的 mutation：'命名空间.mutation 名'
    proxyAddChild () {
      this.commit('child.addN')
    }
  },
  deps: {
    child: childStore
  }
})

createComponent({
  computed: Object.assign(
    {},
    // 第一个参数为 deps 里的命名空间，第二个为子 state 上的字段名
    rootStore.mapState('child', ['n']),
    rootStore.mapState(['local']),
    rootStore.mapGetters(['sum'])
  ),
  methods: Object.assign(
    {},
    rootStore.mapMutations(['addLocal', 'proxyAddChild']),
    // 也可把依赖 mutation 映射成本地方法名
    rootStore.mapMutations({ addNFromChild: 'child.addN' })
  )
})
```

### 使用 store（选项式 API）

`mapState` 只映射 **`state` 路径**；派生状态用 **`mapGetters`**。

```js
import { createComponent } from '@mpxjs/core'
import store from '../store'

createComponent({
  computed: Object.assign(
    {},
    store.mapState(['count']),
    store.mapGetters(['doubled'])
  ),
  methods: Object.assign(
    {},
    store.mapMutations(['increment']),
    store.mapActions(['increment'])
  )
})
```

### 使用 store（组合式 API）

组合式场景下更推荐 **`@mpxjs/pinia`**；沿用 Vuex 式 store 时，可用 **`mapStateToRefs` / `mapGettersToRefs`** 在 `setup` 里拿到 **state、getters 的 ref**。**`mutations` / `actions`** 可直接 **`store.commit` / `store.dispatch`**，也可继续用 **`mapMutations` / `mapActions`** 映射成函数。**`createStore`** 与 **`createStoreWithThis`** 得到的实例均具备上述 **`map*ToRefs`** 与 **`map*`** 方法。

```js
import { createComponent, watchEffect } from '@mpxjs/core'
import store from '../store'

createComponent({
  setup () {
    const { count } = store.mapStateToRefs(['count'])
    const { doubled } = store.mapGettersToRefs(['doubled'])
    const { increment } = store.mapMutations(['increment'])

    watchEffect(() => {
      console.log(count.value, doubled.value)
    })

    return {
      count,
      doubled,
      increment,
      subCount () {
        store.commit('subCount')
      }
    }
  }
})
```

上例中 **`increment`** 来自 **`mapMutations`**，**`subCount`** 直接 **`store.commit`**，演示两种提交 mutation 的方式。

### 注意事项

- **`action` 的返回值会被包装为 `Promise`**，便于 `then` / `async` 组合。  
- 虽支持 **`modules`**，更推荐 **多实例 store + `deps` 组合** 做模块划分，灵活度更高。

## 选型建议

- **优先 `@mpxjs/pinia`**：新项目、新状态域、与 **`setup` / `script setup`** 协同、希望与 Pinia 生态一致时选用。  
- **保留 `@mpxjs/store`**：已有 Vuex 式仓库、`mutations` 可追溯链路或团队规范仍以 Vuex 为主时继续沿用，按需渐进迁移即可。
