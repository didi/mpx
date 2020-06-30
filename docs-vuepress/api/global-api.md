# 全局api

## createApp
> 注册一个小程序，接受一个 Object 类型的参数
- **用法：**
```js
createApp(options)
```

- **参数：**
    - `{Object} options`
    
        可指定小程序的生命周期回调，methods 方法，以及一些全局变量等 
            

- **示例：**
```js
import mpx, {createApp} from '@mpxjs/core'

mpx.createApp({
  onLaunch () {
    console.log('Launch')
  },
  onShow () {
    console.log('Page show')
  },
  methods: {},
  //全局变量 可通过getApp()访问
  globalDataA: 'I am global dataA',
  globalDataB: 'I am global dataB'
})

createApp(options)
```

## createPage
> 类微信小程序（微信、百度、头条等）内部使用[Component的方式创建页面](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)，所以除了支持页面的生命周期之外还同时支持组件的一切特性。当使用 Component 创建页面时，页面生命周期需要写在 methods 内部（微信小程序原生规则），mpx 进行了统一封装转换，页面生命周期都写在最外层即可

- **用法：**
    ```js
    createPage(options, config?)
    ```
- **参数：**
    - `{Object} options`
    
         具体形式除了 computed、watch 这类 mpx 扩展特性之外，其他的属性都参照原生小程序的官方文档即可。
    - `{Object} config`（可选参数）   
          
         如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过 config.isNative 传 true 声明。
         如果有需要复写/改写最终调用的创建页面的构造器，可以通过 config 对象的 customCtor 提供。  
         **注意:**
         mpx本身是用 component 来创建页面的，如果传page可能在初始化时候生命周期不正常导致取props有一点问题

- **示例：**
```js
import mpx, {createPage} from '@mpxjs/core'

mpx.createPage({
  data: {test: 1},
  computed: {
    test2 () {
      return this.test + 1
    }
  },
  watch: {
    test (val, old) {
      console.log(val, old)
    }
  },
  onShow () {
    this.test++
  }
})

createPage(object)
```
## createComponent
> 创建自定义组件，接受两个Object类型的参数。

- **用法：**
    ```js
    createComponent(options, config?)
    ```
- **参数：**
    - `{Object} options`
    
        具体形式除了 computed、watch 这类 mpx 扩展特性之外，其他的属性都参照原生小程序的官方文档即可。
    - `{Object} config`（可选参数）        
    
        如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过 config.isNative 传 true 声明。
        如果有需要复写/改写最终调用的创建组件的构造器，可以通过 config 对象的 customCtor 提供。  
         

- **示例：**
```js
import mpx, {createComponent} from '@mpxjs/core'

mpx.createComponent({
  properties: {
    prop: {
      type: Number,
      value: 10
    }
  },
  data: {test: 1},
  computed: {
    test2 () {
      return this.test + this.prop
    }
  },
  watch: {
    test (val, old) {
      console.log(val, old)
    },
    prop: {
      handler (val, old) {
        console.log(val, old)
      },
      immediate: true // 是否首次执行一次
    }
  }
})

createComponent(object)
```
 
## createStore
> 创建一个全局状态管理容器，实现复杂场景下的组件通信需求
- **用法：**
    ```js
    createStore({ ...options })
    ```
- **参数：**
    - `{Object} options`
        
        options 可指定以下属性：
        - **state**

            类型：`Object`

            store的根 state 对象。
                
            [详细介绍](../guide/advance/store.html#state)

        - **mutations**

            类型：`{ [type: string]: Function }`

            在 store 上注册 mutation，处理函数总是接受 state 作为第一个参数（如果定义在模块中，则为模块的局部状态），payload 作为第二个参数（可选）。
    
            [详细介绍](../guide/advance/store.html#mutation)

        - **actions**

            类型：`{ [type: string]: Function }`

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

        - **getters**

            类型：`{[key: string]: Function }`
  
            在 store 上注册 getter，getter 方法接受以下参数：
            ```js
            state,     // 如果在模块中定义则为模块的局部状态
            getters   // 等同于 store.getters
            ```
            注册的 getter 暴露为 store.getters。
    
            [详细介绍](../guide/advance/store.html#getter)

        - **modules**

            类型：`Object`

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
               ...
            }
            ```

            与根模块的选项一样，每个模块也包含 state 和 mutations 选项。模块的状态使用 key 关联到 store 的根状态。模块的 mutation 和 getter 只会接收 module 的局部状态作为第一个参数，而不是根状态，并且模块 action 的 context.state 同样指向局部状态。

            [详细介绍](../guide/advance/store.html#modules)

        - **deps**

            类型：`Object`

            包含了当前store依赖的第三方store：
            ```js
            {
              store1: storeA,
              store2: storeB
            }
            ```
            [详细介绍](../guide/advance/store.html#modules)
            
- **示例：**

```js
import mpx, {createStore} from '@mpxjs/core'
const store1 = mpx.createStore({ 
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
            
- **Store 实例属性**
    - **state** 

      - 类型：`Object`

        根状态。

    - **getters**

      - 类型：`Object`

        暴露出注册的 getter。

- **Store 实例方法**

    ```js
    commit(type: string, payload?: any, options?: Object) | commit(mutation: Object, options?: Object)
     ```

     提交 mutation。[详细介绍](../guide/advance/store.html#mutation)

    ```js
    dispatch(type: string, payload?: any, options?: Object) | dispatch(action: Object, options?: Object)
    ```

    分发 action。返回一个Promise。[详细介绍](../guide/advance/store.html#action)
    ```js
    mapState(map: Array<string> | Object): Object
    ```
    为组件创建计算属性以返回 store 中的状态。[详细介绍](../guide/advance/store.html#state)

    ```js
    mapGetters(map: Array<string> | Object): Object
    ```
    为组件创建计算属性以返回 getter 的返回值。[详细介绍](../guide/advance/store.html#getter)
    
    ```js
    mapActions(map: Array<string> | Object): Object
    ```
    创建组件方法分发 action。[详细介绍](../guide/advance/store.html#action)
    
    ```js
    mapMutations(map: Array<string> | Object): Object
    ```
    创建组件方法提交 mutation。[详细介绍](../guide/advance/store.html#mutation)
    

## createStoreWithThis

> createStoreWithThis 为 createStore 的变种方法，主要为了在 `Typescript` 环境中，可以更好地支持 store 中的类型推导。<br>
  其主要变化在于定义 getters， mutations 和 actions 时，
  自身的 state，getters 等属性不再通过参数传入，而是会挂载到函数的执行上下文 this 当中，通过 this.state 或 this.getters 的方式进行访问。
  由于TS的能力限制，getters/mutations/actions 只有使用对象字面量的方式直接传入 createStoreWithThis 时
  才能正确推导出 this 的类型，当需要将 getters/mutations/actions 拆解为对象编写时，需要用户显式地声明 this 类型，无法直接推导得出。
- **用法：**
```js
createStoreWithThis(object)
```

- **示例：**
```js

import {createComponent, getComputed, getMixin, createStoreWithThis} from '@mpxjs/core

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
      // 在computed中访问当前computed对象中的其他计算属性时，需要用getComputed辅助函数包裹，
      // 而除此以外的任何场景下都不需要使用，例如访问data或者mixins中定义的computed等数据
      return getComputed(this.c) + this.a + this.aaa
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
## mixin

## injectMixins

## toPureObject

## observable

## watch

## use

## set

## remove

## delete

## setConvertRule

## getMixin

## getComputed

## implement
