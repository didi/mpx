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
**全局注入mixin**
方法接收两个参数：mpx.mixin(mixins, types)
- 第一个参数是要混入的mixins，接收类型 `Array|Object`
- 第二个参数是控制将mixins混入到哪个实例上，接收参数 `String`
>types参数仅支持 String 类型，如果传递的参数为非 String 类型或不传，则走兜底逻辑，值为 ['app', 'page', 'component']

**使用**
```js
import mpx from '@mpxjs/core'
// 指定实例混入
mpx.mixin({
  methods: {
    getData: function(){}
  }
}, 'page')
// 全部实例混入，在 `app|page|component` 都会混入
mpx.mixin([
  {
    methods: {
      getData: function(){}
    }
  }, 
  {
    methods: {
      setData: function(){}
    }
  }
])
// 混入结果同上
mpx.mixin([
  {
    methods: {
      getData: function(){}
    }
  }, 
  {
    methods: {
      setData: function(){}
    }
  }
], ['page'])
```
## injectMixins
该方法仅为 `mixin` 方法的一个别名，`mpx.injectMixins({})` 等同于 `mpx.mixin({})`

## getMixin
专为ts项目提供的反向推导辅助方法，该函数接收类型为 `Object` ,会将传入的嵌套mixins对象拉平成一个扁平的mixin对象

**使用**
```js
import mpx, { createComponent } from '@mpxjs/core'
// 使用mixins，需要对每一个mixin子项进行getMixin辅助函数包裹，支持嵌套mixin
const mixin = mpx.getMixin({
  mixins: [mpx.getMixin({
    data: {
      value1: 2
    },
    lifetimes: {
      attached () {
        console.log(this.value1, 'attached')
      }
    },
    mixins: [mpx.getMixin({
      data: {
        value2: 6
      },
      created () {
        console.log(this.value1 + this.value2 + this.outsideVal)
      }
    })]
  })]
})
/* 
mixin值
{
  data: {value2: 6, value1: 2},
  created: ƒ created(),
  attached: ƒ attached()
}
*/
createComponent({
  data: {
    outsideVal: 20
  },
  mixins: [mixin]
})

/* 
以上执行输出：
28
2 "attached"
*/
```

## toPureObject

- **参数**：
  - `{Object} options`

- **用法**:

由于使用的 mobx 的响应式数据，所以业务拿到的数据可能是 mobx 响应式数据实例（包含了些其他属性），使用`toPureObject`方法可以将响应式的数据转化成纯 js 对象。

```js
import mpx, {toPureObject} from '@mpxjs/core'
// mpx.toPureObject(...)
const pureObject = toPureObject(object)
```

## observable

- **参数**：
  - `{Object} options`

- **用法**:

用于创建响应式数据，属于 mobx 提供的能力。

```js
import mpx, {observable} from '@mpxjs/core'
// mpx.observable(...)
const a = observable(object)
```

## watch

- **参数**：
  - `{Object} context`
  - `{String | Function} expr`
  - `{Function | Object} handler`

- **用法**:

用于观察数据从而触发相应操作。参数详细说明：
1. context：回调执行的上下文
2. expr：观察的表达式。可以是 path 字符串（取值将在context上进行查找），也可以是函数
3. handler：响应函数，如果是对象，则 handler.handler 为回调函数，其他参数作为 options，与组件的 watch 一致

```js
import mpx, {watch} from '@mpxjs/core'
// mpx.watch(...)
const a = observable({name: 1})
watch(null, () => {
  console.log(a.name)
  return a.name
}, (val) => {
  console.log('update a.name', val)
})
a.name = 10
```

## use
>用于安装外部扩展, 支持多参数
方法接收两个参数：mpx.use(plugin, options)
- 第一个参数是要安装的外部扩展
- 第二个参数是对象，如果第二个参数是一个包含（prefix or postfix）的option， 那么将会对插件扩展的属性添加前缀或后缀

**示例：**
```js
import mpx from '@mpxjs/core'
import test from './test'
mpx.use(test)
mpx.use(test, {prefix: 'mpx'}, 'otherparams')
```

## set
用于对一个响应式对象新增属性，会`触发订阅者更新操作`
- **参数**：
  - `{Object | Array} target`
  - `{string | number} propertyName/index`
  - `{any} value`

- **示例：**
```js
mport mpx, {observable} from '@mpxjs/core'
const person = observable({name: 1})
mpx.set(person, 'age', 17) // age 改变后会触发订阅者视图更新
```

## delete
用于对一个响应式对象删除属性，会`触发订阅者更新操作`
- **参数**：
  - `{Object | Array} target`
  - `{string | number} propertyName/index`
- **示例：**
```js
mport mpx, {observable} from '@mpxjs/core'
const person = observable({name: 1})
mpx.delete(person, 'age')
```

## setConvertRule

- **参数**：
  - `{Object} rule`

- **用法**:

在微信转换其他平台的过程中，不同平台有不同的生命周期转换规则。如微信、支付宝、百度、qq、头条小程序平台。`setConvertRule`方法用来设置生命周期的转换规则为哪个平台。

```js
import mpx, {setConvertRule} from '@mpxjs/core'
// mpx.setConvertRule(...)
setConvertRule({
  lifecycleTemplate: 'ali' // 可设置 wx（微信）、ali（支付宝）、swan（百度）、tt（头条）、qq
})
```

## getComputed

- **参数**：
  - `{Function} computedItem`

- **用法**:

Typescript 类型推导辅助函数。在 computed 中访问当前 computed 对象中的其他计算属性时，需要用 getComputed 辅助函数包裹。

```js
import {createComponent, getComputed} from '@mpxjs/core'

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
      return getComputed(this.c) + this.a + this.a
    },
  }
})
```

## implement

- **参数**：
  - `{String} name` 
  - `{Object} config`

- **用法**:

以微信为 base 将代码转换输出到其他平台时（如支付宝、web 平台等），会存在一些无法进行模拟的跨平台差异，会在运行时进行检测并报错指出，例如微信转支付宝时使用 moved 生命周期等。使用`implement`方法可以取消这种报错。您可以使用 mixin 自行实现跨平台差异，然后使用 implement 取消报错。

```js
import mpx from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  const processor = () => {
  }
  mpx.implement('onShareAppMessage', {
    modes: ['web'], // 需要取消的平台，可配置多个
    remove: true, // 是否将此能力直接移除
    processor // 设置成功的回调函数
  })
}
```
