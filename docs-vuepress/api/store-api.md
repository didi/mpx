---
sidebarDepth: 2
---
# Store API
**注意：** 以下 API 在 **2.8** 版本后无法通过全局应用实例 `mpx` 访问。若项目中有类似 mpx.createStore 的用法，在升级到 **2.8** 版本后请进行修改。

## createStore

```ts
function createStore(options: Object): Store
```

> 创建一个全局状态管理容器，实现复杂场景下的组件通信需求

- `options`

  options 可指定以下属性：
    - **state**: `Object`

      store的根 state 对象。

      [详细介绍](../guide/advance/store.html#state)

    - **mutations**: `{ [type: string]: Function }`

      在 store 上注册 mutation，处理函数总是接受 state 作为第一个参数（如果定义在模块中，则为模块的局部状态），payload 作为第二个参数（可选）。

      [详细介绍](../guide/advance/store.html#mutation)

    - **actions**: `{ [type: string]: Function }`

      在 store 上注册 action。处理函数总是接受 context 作为第一个参数，payload 作为第二个参数（可选）。

      context 对象包含以下属性：
          ```js
          {
            state,      // 等同于 `store.state`
            commit,     // 等同于 `store.commit`
            dispatch,   // 等同于 `store.dispatch`
            getters     // 等同于 `store.getters`
          }
          ```
      同时如果有第二个参数 payload 的话也能够接收。

      [详细介绍](../guide/advance/store.html#action)

    - **getters**：`{[key: string]: Function }`

      在 store 上注册 getter，getter 方法接受以下参数：
        ```js
        {
          state,     // 如果在模块中定义则为模块的局部状态
          getters   // 等同于 store.getters
        }
        ```
      注册的 getter 暴露为 store.getters。

      [详细介绍](../guide/advance/store.html#getter)

    - **modules**：`Object`

      包含了子模块的对象，会被合并到 store，大概长这样：
      
        ```js
        {
          key: {
            state,
            mutations,
            actions?,
            getters?,
            modules?
            },
            // ...
        }
        ```

      与根模块的选项一样，每个模块也包含 state 和 mutations 选项。模块的状态使用 key 关联到 store 的根状态。模块的 mutation 和 getter 只会接收 module 的局部状态作为第一个参数，而不是根状态，并且模块 action 的 context.state 同样指向局部状态。

      [详细介绍](../guide/advance/store.html#modules)

    - **deps**：`Object`

      包含了当前store依赖的第三方store：
        ```js
        {
          store1: storeA,
          store2: storeB
        }
        ```
      [详细介绍](../guide/advance/store.html#modules)


```js
import {createStore} from '@mpxjs/core'
const store1 = createStore({
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
  },
  ...
})
const store2 = createStore({ ...options })
```

### **Store 实例属性**

* **state**：`Object`
    根状态。
*  **getters**：`Object`
   暴露出注册的 getter。

### **Store 实例方法**

* commit
```js
commit(type: string, payload?: any, options?: Object) | commit(mutation: Object, options?: Object)
```
提交 mutation。[详细介绍](../guide/advance/store.html#mutation)

* dispatch
```js
dispatch(type: string, payload?: any, options?: Object) | dispatch(action: Object, options?: Object)
```
分发 action。返回一个Promise。[详细介绍](../guide/advance/store.html#action)

* mapState
```js
mapState(map: Array<string> | Object): Object
```
为组件创建计算属性以返回 store 中的状态。[详细介绍](../guide/advance/store.html#state)

* mapGetters
```js
mapGetters(map: Array<string> | Object): Object
```
为组件创建计算属性以返回 getter 的返回值。[详细介绍](../guide/advance/store.html#getter)

* mapActions
```js
mapActions(map: Array<string> | Object): Object
```
创建组件方法分发 action。[详细介绍](../guide/advance/store.html#action)

* mapMutations
```js
mapMutations(map: Array<string> | Object): Object
```
创建组件方法提交 mutation。[详细介绍](../guide/advance/store.html#mutation)

* mapStateToRefs
```ts
mapStateToRefs(maps: Array<string> | Object): {
    [key: string]: ComputedRef<any>
}
```
**组合式 API 特有**，在组合式 API 场景下解构访问 getter 并保持 getter 响应性，可以使用该方法。[详细介绍](../guide/advance/store.html#use-store-in-composition-api)

* mapGettersToRefs
```js
mapGettersToRefs(maps: Array<string> | Object): {
    [key: string]: ComputedRef<any>
}
```
**组合式 API 特有**，在组合式 API 场景下需解构访问 state 并保持 state 响应性，可以使用该方法。[详细介绍](../guide/advance/store.html#use-store-in-composition-api)

## createStoreWithThis

```ts
function createStoreWithThis(store: Store): Store
```

> createStoreWithThis 为 createStore 的变种方法，主要为了在 `Typescript` 环境中，可以更好地支持 store 中的类型推导。<br>
其主要变化在于定义 getters， mutations 和 actions 时，
自身的 state，getters 等属性不再通过参数传入，而是会挂载到函数的执行上下文 this 当中，通过 this.state 或 this.getters 的方式进行访问。
由于TS的能力限制，getters/mutations/actions 只有使用对象字面量的方式直接传入 createStoreWithThis 时
才能正确推导出 this 的类型，当需要将 getters/mutations/actions 拆解为对象编写时，需要用户显式地声明 this 类型，无法直接推导得出。

```js

import {createComponent, getMixin, createStoreWithThis} from '@mpxjs/core'

const store = createStoreWithThis({
  state: {
    aa: 1,
    bb: 2
  },
  getters: {
    cc() {
      return this.state.aa + this.state.bb
    }
  },
  actions: {
    doSth3() {
      console.log(this.getters.cc)
      return false
    }
  }
})

createComponent({
  data: {
    a: 1,
    b: '2'
  },
  computed: {
    c() {
      return this.b
    },
    d() {
      // data, mixin, computed中定义的数据能够被推导到this中
      return this.a + this.aaa + this.c
    },
    // 从store上map过来的计算属性或者方法同样能够被推导到this中
    ...store.mapState(['aa'])
  },
  mixins: [
    // 使用mixins，需要对每一个mixin子项进行getMixin辅助函数包裹，支持嵌套mixin
    getMixin({
      computed: {
        aaa() {
          return 123
        }
      },
      methods: {
        doSth() {
          console.log(this.aaa)
          return false
        }
      }
    })
  ],
  methods: {
    doSth2() {
      this.a++
      console.log(this.d)
      console.log(this.aa)
      this.doSth3()
    },
    ...store.mapActions(['doSth3'])
  }
})
```

## createStateWithThis

```ts
function createStateWithThis(state: Object): Object
```

> createStateWithThis 为创建 state 提供了类型推导，对于基本类型可以由 TypeScript 自行推导，使用其他类型时，推荐使用 as 进行约束

  ```js
  import { createStateWithThis } from '@mpxjs/core'

  export type StatusType = 'start' | 'running' | 'stop'

  export default createStateWithThis({
    status: 'running' as StatusType
  })
  ```

## createGettersWithThis

```ts
function createGettersWithThis(getters: Object, options: Object):Object
```

- getters

  需要定义的 getters 对象。
- options（可选参数）

  在 options 中可以传入 state，getters，deps。由于 getter 的类型推论需要基于 state，所以导出 getters 时，需要将 state 进行传入。deps 是作为一个扩展存在，getters 可以通过 deps 中传入的其他 store 来获取值，当 store 没有其他需要依赖的 deps 时可以不传。createMutationsWithThis 和 createActionsWithThis 同理。

```js
import { createGettersWithThis, createStoreWithThis } from '@mpxjs/core'

export default createGettersWithThis({
  isStart () {
    return this.state.status === 'start'
  },
  getNum () {
    return this.state.base.test + this.getters.base.getTest
  }
}, {
  state,
  deps: {
    base: createStoreWithThis({
      state: {
        testNum: 0
      },
      getters: {
        getTest () {
          return this.state.testNum * 2
        }
      }
    })
}})
```

## createMutationsWithThis

```ts
function createMutationsWithThis(mutations: Object, options: Object): Object
```

- mutations

  需要定义的 mutations 对象。
- options（可选参数）

  在 options 中可以传入 state，deps。

```js
import { createMutationsWithThis } from '@mpxjs/core'

export default createMutationsWithThis({
  setCurrentStatus (payload: StatusType) {
    this.state.status = payload
  }
}, { state })
```

## createActionsWithThis

```ts
function createActionsWithThis(actions: Object, options: Object): Object
```

- actions

  需要定义的 actions 对象。
- options（可选参数）

  由于action 可以同时调用 getters、mutations，所以需要将这些都传入，以便进行类型推导。因此 options 可以传入 state、getters、mutations、deps。

```js
import { createActionsWithThis } from '@mpxjs/core'
import state, { StatusType } from './state'
import getters from './getters'
import mutations from './mutations'

export default createActionsWithThis({
  testActions (payload: StatusType) {
    return Promise.resolve(() => {
      this.commit('setCurrentStatus', payload)
    })
  }
}, {
  state,
  getters,
  mutations
})
```

