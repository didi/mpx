# 状态管理（store）

Mpx 参考 vuex 设计实现了外部状态管理系统（store），其中的概念与 api 与 vuex 保持一致，为了更好地支持状态模块管理和跨团队合作场景，我们提出多实例 store 作为 vuex 中 modules 的替代方案，该方案在模块拆分及合并上的灵活性远高于 modules。

## 介绍

`Store` 是一个全局状态管理容器，能够轻松实现复杂场景下的组件通信需求，store 与简单的全局状态对象主要有以下两点不同：

1. Store 中存放的状态是响应式的。当用户将 store 中的状态注入到组件以后，若 store 中状态发生变化，那么对应的组件也会得到更新。

2. 你不能直接改变 store 中的状态。改变 store 中的状态的唯一途径是显式地提交变更（commit mutation），这种方式能使整个应用中的状态变更变得可回朔可追踪，同时也更加安全。

### 创建 store

让我们来创建一个简单 store。创建过程直截了当，仅需要提供一个初始 state 对象和一些 mutation 方法，并调用 Mpx 暴露的 `createStore` 方法进行创建：

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
console.log(store.state.count) // 1
```

接下来，我们将会更深入地探讨一些 store 的核心概念。让我们先从 [State](#state) 开始。

## State

State 存放了 store 中的原始状态数据，可以通过 `store.state` 进行访问。

### 在组件中获取 state

Mpx 在小程序组件中实现了数据响应，而刚才提到 store 中的状态也是响应式的，组件中获取 store 状态最简单的方法就是建立一个计算属性，在计算属性中访问 store 中需要的状态数据并返回：

```js
// store.js
import {createStore, createComponent} from '@mpxjs/core'

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

createComponent({
  computed: {
    count () {
      return store.state.count
    }
  }
})
```

当 store.state.count 发生变化时, 组件中访问了 count 计算属性的 watcher 将得到响应。

> 于 vuex 中的不同的地方在于，vuex 奉行`单一状态树`，一个应用当中只存在一个 store 示例，用户能够在组件中通过`this.$store`隐式地访问到当前应用的 store；而 Mpx 当中为了追求灵活便捷的状态模块化管理及跨团队合作的能力，支持了多实例 store，用户需要显式地引入 store 实例，并通过计算属性将其注入到组件当中。

### MapState 辅助函数

当一个组件需要获取多个状态时候，将这些状态都声明为计算属性会有些重复和冗余。为了解决这个问题，我们可以使用 `mapState` 辅助函数帮助我们生成计算属性

``` js
import store from '../store'
import {createComponent} from '@mpxjs/core'

createComponent({
  computed: store.mapState({
    // 箭头函数可使代码更简练
    count: state => state.count,

    // 传字符串参数 'count' 等同于 state => state.count
    countAlias: 'count',

    // 为了能够使用 `this` 获取局部状态，必须使用常规函数
    countPlusLocalState (state) {
      return state.count + this.localCount
    }
  })
})
```

当映射的计算属性的名称与 state 的子节点名称相同时，我们也可以给 mapState 传一个字符串数组。

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

MapState 函数返回的是一个对象。我们如何将它与局部计算属性混合使用呢？通常，我们需要使用一个工具函数将多个对象合并为一个，以使我们可以将最终对象传给 computed 属性。但是自从有了[对象展开运算符](https://github.com/sebmarkbage/ecmascript-rest-spread)，我们可以极大地简化写法：

``` js
import store from '../store'
import {createComponent} from '@mpxjs/core'

createComponent({
  computed: {
    localComputed () { /* ... */ },
    // 使用对象展开运算符将 mapState 返回的对象合并到计算属性中
    ...store.mapState([
      'count',
      // ...
    ])
  }
})
```

> 使用 store 并不意味着你需要将所有的状态放入 store。如果有些状态严格属于单个组件，最好将其放到组件内部的 data 当中。

## Getter

有时候我们需要从 state 中派生出一些状态，例如经过过滤的列表：

```js
createComponent({
  computed: {
    doneTodos () {
      return store.state.todos.filter(todo => todo.done)
    }
  }
})
```

如果有多个组件需要用到此属性，我们要么复制这个函数，或者抽取到一个共享函数然后在多处导入它，无论哪种方式都不是很理想。

这个时候我们可以在 store 中定义 `getter` 来完成这个功能，getter 可以简单认为是 store 中的计算属性。同计算属性一样，getter 的返回值会根据它的依赖被缓存起来，只有当它的依赖发生变化时才会被重新计算。

Getter 接受 state 作为第一个参数：

```js
import {createStore} from '@mpxjs/core'

const store = createStore({
  state: {
    todos: [
      { id: 1, text: 'sth1', done: true },
      { id: 2, text: 'sth2', done: false }
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

定义好的 getter 可以通过 `store.getters` 访问：

``` js
store.getters.doneTodos // -> [{ id: 1, text: '...', done: true }]
```

Getter 也可以接受其他 getters 作为第二个参数, rootState作为第三个参数，rootState是模块化中引入的概念，之后会详细介绍：

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

我们采用与state类似的方法将其注入到组件中进行访问：

``` js
computed: {
  doneTodosCount () {
    return store.getters.doneTodosCount
  }
}
```

### MapGetters 辅助函数

`MapGetters` 的作用与使用方法同上面提到的 `mapState` 高度类似，唯一的区别在于 mapGetters 用于映射 store 中的 getter：

``` js
import store from '../store'
import {createComponent} from '@mpxjs/core'

createComponent({
  // ...
  computed: {
    // 使用对象展开运算符将 getter 混入 computed 对象中
    ...store.mapGetters([
      'doneTodosCount',
      'anotherGetter',
      // ...
    ])
  }
})
```

如果你想将一个 getter 在组件中映射为另一个名字，使用对象形式：

``` js
store.mapGetters({
  // 映射 this.doneCount 为 store.getters.doneTodosCount
  doneCount: 'doneTodosCount'
})
```

## Mutation

更改 store 中的状态的唯一方法是提交 mutation。Mutation 非常类似于事件：每个 mutation 都有一个字符串的**类型（type）** 和 一个**回调函数（handler）**。这个回调函数就是我们实际进行状态更改的地方，它接受 state 作为第一个参数：

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

当你需要触发某个 mutation 时，你需要使用对应的 `type` 调用 `store.commit` 方法，就像触发某个事件一样：

``` js
store.commit('increment')
```

### 提交载荷（Payload）

你可以向 `store.commit` 传入额外的参数，作为 mutation 的**载荷（payload）**：

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

在大多数情况下，载荷应该是一个对象，这样可以包含多个字段并且增强 mutation 的可读性：

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

### Mutation 必须是同步函数

一条重要的原则就是要记住 **mutation 必须是同步函数**


### 在组件中提交 Mutation

你可以在组件中使用 `store.commit('increment')` 提交 mutation，或者使用 `store.mapMutations` 辅助函数将组件中名为 `increment` 的 `method` 映射为 `store.commit('increment')` 调用。

``` js
import { createComponent } from '@mpxjs/core'
import store from '../store'

createComponent({
  // ...
  methods: {
    ...store.mapMutations([
      // 将 this.increment() 映射为 store.commit('increment')
      'increment', 
       // mapMutations 也支持载荷：将 this.incrementBy(amount) 映射为 store.commit('incrementBy', amount)
      'incrementBy'
    ]),
    // mapMutations同样支持传入对象形式的参数进行别名映射
    ...store.mapMutations({
      // 将 this.add() 映射为 store.commit('increment')
      add: 'increment'
    })
  }
})
```

## Action

Action 类似于 mutation，不同在于：

- Action 不能直接变更状态，但是可以提交 mutation 进行状态变更
- Action 可以包含任意异步操作

让我们来创建一个简单的 action：

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
    }
  }
})

export default store
```

Action 函数接受一个 `context` 对象，因此你可以调用 `context.commit` 提交一个 mutation，调用 `context.dispatch` 触发其他的 action 调用，或者通过 `context.rootState`、`context.state` 和 `context.getters` 来获取全局state、局部state 和 全局 getters。

实践中，我们会经常用到 ES2015 的[参数解构](https://github.com/lukehoban/es6features#destructuring)来简化代码：

``` js
actions: {
  increment ({ commit }) {
    commit('increment')
  }
}
```

### 调用 action

Action 可以通过 `store.dispatch` 方法进行调用：

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

Action 同样支持载荷：

``` js
// 调用载荷
store.dispatch('incrementAsync', {
  amount: 10
})
```

来看一个更加实际的购物车示例，涉及到**调用异步 API** 和**提交多个 mutation**：

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

注意我们进行了一系列异步操作，并且通过提交 mutation 来记录 action 产生的副作用（即状态变更）。

### 在组件中调用 Action

你可以在组件中使用 `store.dispatch('increment')` 进行 action 调用，或者使用 `store.mapActions` 辅助函数将组件中名为 `increment` 的 `method` 映射为 `store.dispatch('increment')`：

``` js
import { createComponent } from '@mpxjs/core'
import store from '../store'

createComponent({
  // ...
  methods: {
    ...store.mapActions([
      // 将 this.increment() 映射为 store.dispatch('increment')
      'increment', 
      // mapActions 也支持载荷：将 this.incrementBy(amount) 映射为 store.dispatch('incrementBy', amount)
      'incrementBy'
    ]),
    // mapActions 同样支持传入对象形式的参数进行别名映射
    ...store.mapActions({
      // 将 this.add() 映射为 store.dispatch('increment')
      add: 'increment' 
    })
  }
})
```

### 组合 Action

Action 通常是异步的，那么如何知道 action 什么时候结束呢？更重要的是，我们如何才能组合多个 action，以处理更加复杂的异步流程？

在 Mpx 中，action 永远返回一个 Promise，你可以在定义 action 手动返回一个 Promise，即使你没有这样做，框架也会对你 action 的返回值进行 `Promise.resolve(returned)` 包装，确保你可以使用 Promise 的方式处理多个 action 之间的异步组合：

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

现在你可以通过 `then` 方法获取 `actionA` 执行完毕的时机：

``` js
store.dispatch('actionA').then(() => {
  // ...
})
```

在另外一个 action 中也可以通过这种方式进行一系列异步调用：

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

如果我们利用 [async / await](https://tc39.github.io/ecmascript-asyncawait/)，我们能够更方便地对一系列异步操作进行组合：

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

## Modules

> Mpx 虽然支持了 modules，但并不推荐使用。在 Mpx 中，我们更推荐使用[多实例模式](#多实例 store)进行对应用状态进行模块划分

在 Mpx 中，modules 的设计与 vuex 中基本保持一致，在 createStore 中将子模块配置传入 modules 配置项中即可使用：

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
    moduleA,
    moduleB
  }
})

store.state.moduleA // -> moduleA 的状态
store.state.moduleB // -> moduleB 的状态

export default store
```

> Mpx 并未实现 vuex 中的命名空间，除 state 外的所有属性（getters / mutations / actions）将被平铺展开到根 store 的对应空间下。在多实例 store 中，我们的实现方式则与命名空间高度相似。

### 模块的局部状态

对于模块内部的 mutation 和 getter，接收的第一个参数是模块的局部状态对象。

``` js
const moduleA = {
  state: { count: 0 },
  mutations: {
    increment (state) {
      // 这里的 state 对象是模块的局部状态
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

对于模块内部的 action，局部状态通过 `context.state` 访问，根状态则通过 `context.rootState` 访问：

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

对于模块内部的 getter，根状态能通过第三个参数访问：

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

### 模块在组件中的引入方式

``` js
const store = createStore({
  modules: {
    a: {
      state: {
        name: 1
      },
      getters: {
        getName: s => s.name
      }
    },
    b: moduleB
  }
})

createComponent({
  // 我们支持了多种方式引入子模块中的 state
  computed: {
    // 通过函数引入
    ...store.mapState({
      nameA: state => state.a.name
    }),
    // 通过路径字符串引入
    ...store.mapState({
      nameA2: 'a.name'
    }),
    // 通过传入模块路径引入
    ...store.mapState('a', ['name']),
    // 对于 getters / mutations / actions，由于我们没有实现 namespace，子模块当中定义的 getters / mutations / actions 都能在根空间下直接访问，正常调用映射方法即可
    ...store.mapGetters('getName')
  }
})
```

## 多实例 store

在 Mpx 中，我们允许在一个应用下创建多个 store 实例，进行模块化分布式的数据管理，同时提供了 deps 声明模块依赖的机制，让用户自由组合多个 store 实例并基于这些已有的 store 创建新的继承 store。在实际业务使用中，我们发现多实例模式的灵活性远高于 module，更加适合跨团队合作当中的数据管理。

使用多实例 store 的方式非常简单，你只需要多次调用 `createStore` api 创建出多个 store 示例，并分别将其注入到组件中即可使用，简单示例如下：

```js
import { createComponent, createStore } from '@mpxjs/core'

const storeA = createStore({
  state: {
    countA: 0
  },
  mutations: {
    incrementA (state) {
      state.countA++
    }
  }
})

const storeB = createStore({
  state: {
    countB: 0
  },
  mutations: {
    incrementB (state) {
      state.countB++
    }
  }
})

createComponent({
  computed: {
    // ...
    ...storeA.mapState(['countA']),
    ...storeB.mapState(['countB'])
  },
  methods: {
    // ...
    ...storeA.mapMutations(['incrementA']),
    ...storeB.mapMutations(['incrementB'])
  }
})
```

> 可以看到 Mpx 中的 map 辅助方法都挂载在 store 实例上，正是为了支持多实例 store 的实现

### 合并继承多实例 store

在实际的跨团队业务当中，我们既希望不同团队间的数据管理尽量解耦，也希望一些共同的部分能够复用，这就要求我们的 store 实例可以以某种方式组合起来使用，我们提供了 deps 能来实现多实例 store 的合并与继承。

承接上面的示例，我们基于 storeA 和 storeB 创建一个新的 storeC，在 storeC 当中可以定义自身的独立状态，也能基于 storeA 和 storeB 进行状态衍生：

```js
import { createComponent, createStore } from '@mpxjs/core'

const storeA = createStore({
  state: {
    countA: 0
  },
  mutations: {
    incrementA (state) {
      state.countA++
    }
  }
})

const storeB = createStore({
  state: {
    countB: 0
  },
  mutations: {
    incrementB (state) {
      state.countB++
    }
  }
})

const storeC = createStore({
  state: {
    countC: 0
  },
  getters: {
    abc (state) {
      // 此处 state.storeA 指向了原始的 storeA.state
      return state.storeA.countA + state.storeB.countB + state.countC
    }
  },
  mutations: {
    incrementC (state) {
      state.countC++
    }
  },
  actions: {
    incrementB ({ commit }) {
      // storeC内部也可以通过命名空间路径的方式提交 storeB 的 mutation
      commit('storeB.incrementB')
    }
  },
  // 此处 deps 声明了 storeC 的依赖，依赖中的 state / getters / mutations / actions 都会以 deps 中的 key 为命名空间存放在 storeC 对应的域下
  deps: {
    storeA,
    storeB
  }
})

// 通过继承合并得到的 storeC，我们可以完整访问其依赖 storeA / storeB
createComponent({
  computed: {
    // ...
    // 使用路径字符串或函数映射，可以看出和 modules 中 mapState 的方式非常类似
    ...storeC.mapState({
      countA: 'storeA.countA',
      countA2: state => state.storeA.countA
    }),
    // 传入命名空间参数映射 storeB 中的 countB
    ...storeC.mapState('storeB', ['countB']),
    // 映射基于 storeA/B/C 衍生得到的 getters
    ...storeC.mapGetters(['abc'])
  },
  methods: {
    // ...
    // mutation不支持函数映射
    // 下面代码以三种方式分别映射了increment、incrementB和incrementC
    ...storeC.mapMutations({
      incrementA: 'storeA.incrementA'
    }),
    ...storeC.mapMutations('storeB', ['incrementB']),
    ...storeC.mapMutations(['incrementC'])
  }
})
```

> 简单来讲，作为 deps 的 store 会以注册在 deps 中的 key 值作为命名空间，将其原始的 state / getters / mutations / actions 存放在新生成 store 对应的域下，便于新 store 对其进行访问并衍生出新的数据或操作，如上述示例中，storeA.state 会存放在 storeC.state.storeA 中，对于 getters / mutations / actions 亦然。

## 在 Typescript 中使用 store

Mpx 自 2.2 版本开始支持 Typescript，为了更好地支持 store 中的类型推导，我们针对 Typescript 环境提供了变种的 store api `createStoreWithThis` 进行 store 创建，该 api 最主要的变化在于定义 getters，mutations 和 actions 时，自身的 state，getters 等属性不再通过参数传入，而是会挂载到函数的执行上下文 `this` 当中，通过 this.state 或 this.getters 的方式进行访问，简单的使用示例如下：

```js
const store = createStoreWithThis({
  state: {
    aa: 1,
    bb: 2
  },
  getters: {
    cc() {
      // 使用 this.state 访问 state
      return this.state.aa + this.state.bb
    }
  },
  actions: {
    doSth3() {
      // 使用 this.getters 访问 getter
      console.log(this.getters.cc)
      return false
    }
  }
})
```

详细的使用方式及推导规则请查看 [Typescript 支持](../tool/ts.md)章节。

## 在组合式 API 中使用 store {#use-store-in-composition-api}

Mpx 自 2.8 版本完整支持了组合式 API 的开发方式，虽然在组合式 API 中我们首推使用 [pinia](pinia.md) 作为外部状态管理方案，不过旧的 store 在组合式 API 中仍然可以使用，我们提供了新的 `mapStateToRefs` 和 `mapGettersToRefs` 便于用户在组合式 API 中访问 `state` 和 `getters`，而对于 `mutations` 和 `actions`，用户可以直接调用 store 实例上的 `commit` 和 `dispatch` 方法进行调用，或者使用原有的 `map*` API 进行映射访问，简单使用示例如下：

```js
import { createPage, createStoreWithThis, watchEffect } from '@mpxjs/core'

const store = createStoreWithThis({
  state: {
    count: 123
  },
  getters: {
    doubleCount () {
      return this.state.count * 2
    }
  },
  mutations: {
    addCount () {
      this.state.count++
    },
    subCount () {
      this.state.count--
    }
  }
})

createPage({
  setup () {
    const { count } = store.mapStateToRefs(['count'])
    const { doubleCount } = store.mapGettersToRefs(['doubleCount'])
    const { addCount } = store.mapMutations(['addCount'])

    watchEffect(() => {
      console.log(count.value, doubleCount.value)
    })

    return {
      count,
      doubleCount,
      addCount,
      subCount () {
        // 两种方式均可以进行 mutations 调用，actions 同理
        store.commit('subCount')
      }
    }
  }
})
```


