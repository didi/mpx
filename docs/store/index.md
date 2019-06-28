# 数据管理

我们对比了redux和vuex的设计，觉得vuex的设计更加地简单易用，最终参考了vuex的设计提供了一套数据管理方案，与vuex不同的是，我们提供了完善多实例store模式管理方案，以方便更加复杂的业务场景进行使用。

这是一个简单的例子：

* [开始](#开始)

和Vuex类似，我们的mpx内置store主要有以下核心概念：

* [state](#state)
* [getters](#getter)
* [mutation](#mutation)
* [action](#action)
* [子模块](#module)
* [多实例store](#多实例)

一些示例：
- [todoMVC示例](https://github.com/didi/mpx/tree/master/examples/mpx-todoMVC)

# 开始

“store”基本上就是一个容器，它包含着你的应用中大部分的状态 (state)。store 和单纯的全局对象有以下两点不同：

1. store 的状态存储是响应式的。当 mpx 组件从 store 中读取状态的时候，若 store 中的状态发生变化，那么相应的组件也会相应地得到高效更新。

2. 你不能直接改变 store 中的状态。改变 store 中的状态的唯一途径就是显式地提交 (commit) mutation。这样使得我们可以方便地跟踪每一个状态的变化。

### 最简单的store

让我们来创建一个 store。创建过程直截了当——仅需要提供一个初始 state 对象和一些 mutation：

```js
import {createStore} from '@mpxjs/core'

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})

export default store
```

现在，你可以通过 store.state 来获取状态对象，以及通过 store.commit 方法触发状态变更：

```js
store.commit('increment')

console.log(store.state.count) // -> 1
```

再次强调，我们通过提交 mutation 的方式，而非直接改变 store.state.count，是因为我们想要更明确地追踪到状态的变化。

接下来，我们将会更深入地探讨一些核心概念。让我们先从 [State](#state) 概念开始。

# State

### 在 mpx 组件中获得 store 状态

那么我们如何在 mpx 组件中展示状态呢？由于 mpx内置的store 的状态存储是响应式的，从 store 实例中读取状态最简单的方法就是在计算属性中返回某个状态：

```js
// store.js
import {createStore} from '@mpxjs/core'

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})

export default store
```

``` js
import store from '../store'
import {createComponent} from '@mpxjs/core'

createComponent({
  computed: {
    count () {
      return store.state.count
    }
  }
})
```

每当 `store.state.count` 变化的时候, 都会重新求取计算属性，并且触发更新相关联的 DOM。

因为小程序原生组件的限制，无法实现自动向上查找父组件挂载的store，所以mpx的store无法像vuex一样提供vue类似的注入机制将其注入到每一个子组件中，所以需要在每个要用到store的地方手工地显式引入。

### `mapState` 辅助函数

当一个组件需要获取多个状态时候，将这些状态都声明为计算属性会有些重复和冗余。为了解决这个问题，我们可以使用 `store.mapState` 辅助函数帮助我们生成计算属性

``` js
// 在单独构建的版本中辅助函数为 mpx内置的store.mapState
import store from '../store'
import {createComponent} from '@mpxjs/core'

createComponent({
  // ...
  computed: store.mapState({
    // 箭头函数可使代码更简练
    count: state => state.count,

    // 传字符串参数 'count' 等同于 `state => state.count`
    countAlias: 'count',

    // 为了能够使用 `this` 获取局部状态，必须使用常规函数
    countPlusLocalState (state) {
      return state.count + this.localCount
    }
  })
})
```

当映射的计算属性的名称与 state 的子节点名称相同时，我们也可以给 `store.mapState` 传一个字符串数组。

``` js
import store from '../store'
import {createComponent} from '@mpxjs/core'

createComponent({
  computed: store.mapState([
    // 映射 this.count 为 store.state.count
    'count'
  ])
})
```

### 对象展开运算符

`store.mapState` 函数返回的是一个对象。我们如何将它与局部计算属性混合使用呢？通常，我们需要使用一个工具函数将多个对象合并为一个，以使我们可以将最终对象传给 `computed` 属性。但是自从有了[对象展开运算符](https://github.com/sebmarkbage/ecmascript-rest-spread)（现处于 ECMASCript 提案 stage-3 阶段），我们可以极大地简化写法：

``` js
import store from '../store'
import {createComponent} from '@mpxjs/core'

createComponent({
  computed: {
    localComputed () { /* ... */ },
    // 使用对象展开运算符将此对象混入到外部对象中
    ...store.mapState({
      // ...
    })
  }
})
```

### 组件仍然保有局部状态

使用 mpx内置的store 并不意味着你需要将**所有的**状态放入`store`。如果有些状态严格属于单个组件，最好还是作为组件的`局部状态data`

# Getter

有时候我们需要从 store 中的 state 中派生出一些状态，例如对列表进行过滤并计数：

```js
computed: {
  doneTodosCount () {
    return store.state.todos.filter(todo => todo.done).length
  }
}
```

如果有多个组件需要用到此属性，我们要么复制这个函数，或者抽取到一个共享函数然后在多处导入它——无论哪种方式都不是很理想。

mpx内置store 允许我们在 store 中定义“getter”（可以认为是 store 的计算属性）。就像计算属性一样，getter 的返回值会根据它的依赖被缓存起来，且只有当它的依赖值发生了改变才会被重新计算。

Getter 接受 state 作为其第一个参数：

```js
import {createStore} from '@mpxjs/core'

const store = createStore({
  state: {
    todos: [
      { id: 1, text: '...', done: true },
      { id: 2, text: '...', done: false }
    ]
  },
  getters: {
    doneTodos: state => {
      return state.todos.filter(todo => todo.done)
    }
  }
})

export default store
```

Getter 会暴露为 `store.getters` 对象：

``` js
store.getters.doneTodos // -> [{ id: 1, text: '...', done: true }]
```

Getter 也可以接受其他 getters 作为第二个参数, rootState作为第三个参数：

```js
getters: {
  // ...
  doneTodosCount: (state, getters, rootState) => {
    return getters.doneTodos.length
  }
}
```

```js
store.getters.doneTodosCount // -> 1
```

我们可以很容易地在任何组件中使用它：

``` js
computed: {
  doneTodosCount () {
    return store.getters.doneTodosCount
  }
}
```

你也可以通过让 getter 返回一个函数，来实现给 getter 传参。在你对 store 里的数组进行查询时非常有用。

```js
getters: {
  // ...
  getTodoById: (state) => (id) => {
    return state.todos.find(todo => todo.id === id)
  }
}
```

```js
store.getters.getTodoById(2) // -> { id: 2, text: '...', done: false }
```

### `store.mapGetters` 辅助函数

`store.mapGetters` 辅助函数仅仅是将 store 中的 getter 映射到局部计算属性`computed`里面：

``` js
import store from 'path to store'

export default {
  // ...
  computed: {
  // 使用对象展开运算符将 getter 混入 computed 对象中
    ...store.mapGetters([
      'doneTodosCount',
      'anotherGetter',
      // ...
    ])
  }
}
```

如果你想将一个 getter 属性另取一个名字，使用对象形式：

``` js
store.mapGetters({
  // 映射 `this.doneCount` 为 `store.getters.doneTodosCount`
  doneCount: 'doneTodosCount'
})
```

# Mutation

更改 mpx内置store 的 store 中的状态的唯一方法是提交 mutation。mpx内置store 中的 mutation 非常类似于事件：每个 mutation 都有一个字符串的 **事件类型 (type)** 和 一个 **回调函数 (handler)**。这个回调函数就是我们实际进行状态更改的地方，并且它会接受 state 作为第一个参数：

``` js
import {createStore} from '@mpxjs/core'

const store = createStore({
  state: {
    count: 1
  },
  mutations: {
    increment (state) {
      // 变更状态
      state.count++
    }
  }
})

export default store
```

你不能直接调用一个 mutation handler。这个选项更像是事件注册：“当触发一个类型为 `increment` 的 mutation 时，调用此函数。”要唤醒一个 mutation handler，你需要以相应的 type 调用 **store.commit** 方法：

``` js
store.commit('increment')
```

### 提交载荷（Payload）

你可以向 `store.commit` 传入额外的参数，即 mutation 的 **载荷（payload）**：

``` js
// ...
mutations: {
  increment (state, n) {
    state.count += n
  }
}
```
``` js
store.commit('increment', 10)
```

在大多数情况下，载荷应该是一个对象，这样可以包含多个字段并且记录的 mutation 会更易读：

``` js
// ...
mutations: {
  increment (state, payload) {
    state.count += payload.amount
  }
}
```

``` js
store.commit('increment', {
  amount: 10
})
```

### Mutation 需遵守的响应规则

mpx内置store 中的状态是响应式的，那么当我们变更状态时，监视状态的 mpx页面或组件也会自动更新。这也意味着 mpx内置store 中的 mutation需要遵守一些注意事项：

1. 无法感知属性的添加或删除，所以最好提前在你的 store 中初始化好所有所需属性。

2. 当需要在对象上添加新属性时，你可以
    ``` js
    state.obj = { ...state.obj, newProp: 123 }
    ```

### Mutation 必须是同步函数

一条重要的原则就是要记住 **mutation 必须是同步函数**


### 在组件中提交 Mutation

你可以在组件中使用 `store.commit('xxx')` 提交 mutation，或者使用 `store.mapMutations` 辅助函数将组件中的 `methods` 映射为 `store.commit` 调用。

``` js
import { createComponent } from '@mpxjs/core'
import store from '../store'

createComponent({
  // ...
  methods: {
    ...store.mapMutations([
      'increment', // 将 `this.increment()` 映射为 `store.commit('increment')`

      // `mapMutations` 也支持载荷：
      'incrementBy' // 将 `this.incrementBy(amount)` 映射为 `store.commit('incrementBy', amount)`
    ]),
    ...store.mapMutations({
      add: 'increment' // 将 `this.add()` 映射为 `store.commit('increment')`
    })
  }
})
```

# Action

Action 类似于 mutation，不同在于：

- Action 提交的是 mutation，而不是直接变更状态。
- Action 可以包含任意异步操作。

让我们来注册一个简单的 action：

``` js
import {createStore} from '@mpxjs/core'

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  },
  actions: {
    increment (context) {
      context.commit('increment')
    },
    increment2({rootState, state, getters, dispatch, commit}) {
    }
  }
})

export default store
```

Action 函数接受一个 context 对象，因此你可以调用 `context.commit` 提交一个 mutation，或者通过 `context.rootState`、`context.state` 和 `context.getters` 来获取全局state、局部state 和 全局 getters。

实践中，我们会经常用到 ES2015 的 [参数解构](https://github.com/lukehoban/es6features#destructuring) 来简化代码（特别是我们需要调用 `commit` 很多次的时候）：

``` js
actions: {
  increment ({ commit }) {
    commit('increment')
  }
}
```

### 分发 Action

Action 通过 `store.dispatch` 方法触发：

``` js
store.dispatch('increment')
```

乍一眼看上去感觉多此一举，我们直接分发 mutation 岂不更方便？实际上并非如此，还记得 **mutation 必须同步执行**这个限制么？Action 就不受约束！我们可以在 action 内部执行**异步**操作：

``` js
actions: {
  incrementAsync ({ commit }) {
    setTimeout(() => {
      commit('increment')
    }, 1000)
  }
}
```

Actions 支持同样的载荷方式进行分发：

``` js
// 以载荷形式分发
store.dispatch('incrementAsync', {
  amount: 10
})
```

来看一个更加实际的购物车示例，涉及到**调用异步 API** 和**分发多重 mutation**：

``` js
actions: {
  checkout ({ commit, state }, products) {
    // 把当前购物车的物品备份起来
    const savedCartItems = [...state.cart.added]
    // 发出结账请求，然后乐观地清空购物车
    commit(types.CHECKOUT_REQUEST)
    // 购物 API 接受一个成功回调和一个失败回调
    shop.buyProducts(
      products,
      // 成功操作
      () => commit(types.CHECKOUT_SUCCESS),
      // 失败操作
      () => commit(types.CHECKOUT_FAILURE, savedCartItems)
    )
  }
}
```

注意我们正在进行一系列的异步操作，并且通过提交 mutation 来记录 action 产生的副作用（即状态变更）。

### 在组件中分发 Action

你在组件中使用 `store.dispatch('xxx')` 分发 action，或者使用 `store.mapActions` 辅助函数将组件的 `methods` 映射为 `store.dispatch` 调用：

``` js
import { createComponent } from '@mpxjs/core'
import store from '../store'

createComponent({
  // ...
  methods: {
    ...store.mapActions([
      'increment', // 将 `this.increment()` 映射为 `store.dispatch('increment')`

      // `mapActions` 也支持载荷：
      'incrementBy' // 将 `this.incrementBy(amount)` 映射为 `store.dispatch('incrementBy', amount)`
    ]),
    ...store.mapActions({
      add: 'increment' // 将 `this.add()` 映射为 `store.dispatch('increment')`
    })
  }
})
```

### 组合 Action

Action 通常是异步的，那么如何知道 action 什么时候结束呢？更重要的是，我们如何才能组合多个 action，以处理更加复杂的异步流程？

首先，你需要明白 `store.dispatch` 可以处理被触发的 action 的处理函数返回的 Promise，并且 `store.dispatch` 仍旧返回 Promise：

``` js
actions: {
  actionA ({ commit }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        commit('someMutation')
        resolve()
      }, 1000)
    })
  }
}
```

现在你可以：

``` js
store.dispatch('actionA').then(() => {
  // ...
})
```

在另外一个 action 中也可以：

``` js
actions: {
  // ...
  actionB ({ dispatch, commit }) {
    return dispatch('actionA').then(() => {
      commit('someOtherMutation')
    })
  }
}
```

最后，如果我们利用 [async / await](https://tc39.github.io/ecmascript-asyncawait/)，我们可以如下组合 action：

``` js
// 假设 getData() 和 getOtherData() 返回的是 Promise

actions: {
  async actionA ({ commit }) {
    commit('gotData', await getData())
  },
  async actionB ({ dispatch, commit }) {
    await dispatch('actionA') // 等待 actionA 完成
    commit('gotOtherData', await getOtherData())
  }
}
```

# Module

> PS：虽然支持module，但不支持namespace。在MPX里，我们更推荐使用[多实例模式](#多实例)

当应用变得非常复杂时，store 对象就有可能变得相当臃肿。

为了解决以上问题，mpx内置store 允许我们将 store 分割成**模块（module）**。每个模块拥有自己的 state、mutation、action、getter、甚至是嵌套子模块——从上至下进行同样方式的分割：

``` js
import {createStore} from '@mpxjs/core'

const moduleA = {
  state: { ... },
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: { ... },
  mutations: { ... },
  actions: { ... }
}

const store = createStore({
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.state.a // -> moduleA 的状态
store.state.b // -> moduleB 的状态

export default store
```

### 模块的局部状态

对于模块内部的 mutation 和 getter，接收的第一个参数是**模块的局部状态对象**。

``` js
const moduleA = {
  state: { count: 0 },
  mutations: {
    increment (state) {
      // 这里的 `state` 对象是模块的局部状态
      state.count++
    }
  },

  getters: {
    doubleCount (state) {
      return state.count * 2
    }
  }
}
```

同样，对于模块内部的 action，局部状态通过 `context.state` 暴露出来，根节点状态则为 `context.rootState`：

``` js
const moduleA = {
  // ...
  actions: {
    incrementIfOddOnRootSum ({ state, commit, rootState }) {
      if ((state.count + rootState.count) % 2 === 1) {
        commit('increment')
      }
    }
  }
}
```

对于模块内部的 getter，根节点状态会作为第三个参数暴露出来：

``` js
const moduleA = {
  // ...
  getters: {
    sumWithRootCount (state, getters, rootState) {
      return state.count + rootState.count
    }
  }
}
```

# 多实例

允许创建多实例，各store实例彼此互相独立，状态互不干扰，不需要考虑命名空间的问题，而且可以随时动态创建一个新的store，更灵活且移植性更高。相对较于[modules](#module)，更推荐多实例模式

### 联合多个store实例

如果需要使用外部store的数据，`mpx` 也提供的createStore支持传入`deps`参数，表示注入的外部store。在store内部访问外部store的资源使用如下方式（都是加namespace形式的`path访问`模式）。由于注入store的各部分（state, getters, mutations, actions）是 **以key作为namespace** merge在options对应属性内部的，所以deps的key要防止冲突

### 基础例子

例子：

```js
import {createStore} from '@mpxjs/core'

const store1 = createStore({
  state: {
    a: 1
  },
  getters: {
    getA(state) {
      return state.a
    }
  },
  mutations: {
    setA(state, payload) {
      state.a = payload
    }
  },
  actions: {
    actionA({commit}, payload) {
      commit('setA', payload)
    }
  }
})
const store2 = createStore({
  state: {
    b: 1
  },
  getters: {
    getB(state, getters) {
      // 访问外部store1的数据，按路径访问
      return state.b + state.store1.a + getters.store1.getA
    }
  },
  mutations: {
    setB(state, payload) {
      state.b = payload
    }
  },
  actions: {
    actionB({dispatch, commit}, payload) {
      // 同理，mutations、actions访问外部store1的方法时，也是按路径访问
      commit('store1.setA', payload)
      dispatch('store1.actionA', payload)
      commit('setB', payload)
    }
  },
  deps: {
    store1
  }
})

export {store1, store2}
```

### 多store注入下的'store.mapGetters、store.mapMuations、store.mapActions'

```js

import {createStore, createComponent} from '@mpxjs/core'
const store1 = createStore({
  state: {
    a: 1
  },
  getters: {
    getA(state, getters) {
      return state.b + state.store1.a + getters.store1.getA
    }
  },
  mutations: {
    setA(state, payload) {
      state.a = payload
    }
  },
  actions: {
    actionA({commit}, payload) {
      commit('setA', payload)
    }
  }
})
const store2 = createStore({
  state: {
    b: 1
  },
  getters: {
    getB(state) {
      return state.b + state.store1.a
    }
  },
  mutations: {
    setB(state, payload) {
      state.b = payload
    }
  },
  actions: {
    actionB({dispatch, commit}, payload) {
      commit('store1.setA', payload)
      dispatch('store1.actionA', payload)
      commit('setB', payload)
    }
  },
  deps: {
    // xx: store1
    store1
  }
})

// 组件内部使用store
createComponent({
  computed: {
    ...store2.mapGetters(['getB', 'store1.getA'])
  },
  methods: {
    ...store2.mapMutations(['setB', 'store1.setA']),
    ...store2.mapActions(['actionB', 'store1.actionA'])
  }
})
```
