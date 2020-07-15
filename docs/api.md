# API参考

mpx和mpx-webpack-plugin中暴露出的api文档

### createApp

``` js
import mpx, {createApp} from '@mpxjs/core'
mpx.createApp(object)
createApp(object)
```

### createPage

> 类微信小程序（微信、百度、头条等）内部使用[Component的方式创建页面](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)，所以除了支持页面的生命周期之外还同时`支持组件的一切特性`。当使用Component创建页面时，`页面生命周期`需要写在`methods内部`（微信小程序原生规则），mpx进行了统一封装转换，`页面生命周期都写在最外层`即可

> options的具体形式，除了computed、watch这类mpx扩展特性之外，其他的属性都参照原生小程序的官方文档即可。

用法：`createPage(options, config?)`

config是一个可选参数，应为一个对象。  
如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过config.isNative传true声明。  
如果有需要复写/改写最终调用的创建页面的构造器，可以通过config对象的customCtor提供。`注意：mpx本身是用component来创建页面的，如果传page可能在初始化时候生命周期不正常导致取props有一点问题`

``` js
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

### createComponent

> options的具体形式，除了computed、watch这类mpx扩展特性之外，其他的属性都参照原生小程序的官方文档即可。

用法：`createComponent(options, config?)`

config是一个可选参数，应为一个对象。  
如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过config.isNative传true声明。  
如果有需要复写/改写最终调用的创建组件的构造器，可以通过config对象的customCtor提供。

``` js
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

### createStore

``` js
import mpx, {createStore} from '@mpxjs/core'
const store1 = mpx.createStore({ ...options })
const store2 = createStore({ ...options })
```

##### options选项

- **state**

  - 类型: `Object`

    store的根 state 对象。[详细介绍](store/index.md#state)

- **mutations**

  - 类型: `{ [type: string]: Function }`

    在 store 上注册 mutation，处理函数总是接受 `state` 作为第一个参数（如果定义在模块中，则为模块的局部状态），`payload` 作为第二个参数（可选）。

    [详细介绍](store/index.md#mutation)

- **actions**

  - 类型: `{ [type: string]: Function }`

    在 store 上注册 action。处理函数总是接受 `context` 作为第一个参数，`payload` 作为第二个参数（可选）。

    `context` 对象包含以下属性：

    ``` js
    {
      state,      // 等同于 `store.state`
      commit,     // 等同于 `store.commit`
      dispatch,   // 等同于 `store.dispatch`
      getters     // 等同于 `store.getters`
    }
    ```

    同时如果有第二个参数 `payload` 的话也能够接收。

    [详细介绍](store/index.md#action)

- **getters**

  - 类型: `{ [key: string]: Function }`

  在 store 上注册 getter，getter 方法接受以下参数：

    ```
    state,     // 如果在模块中定义则为模块的局部状态
    getters,   // 等同于 store.getters
    ```

    注册的 getter 暴露为 `store.getters`。

    [详细介绍](store/index.md#getters)

- **modules**

  - 类型: `Object`

    包含了子模块的对象，会被合并到 store，大概长这样：

    ``` js
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

    与根模块的选项一样，每个模块也包含 `state` 和 `mutations` 选项。模块的状态使用 key 关联到 store 的根状态。模块的 mutation 和 getter 只会接收 module 的局部状态作为第一个参数，而不是根状态，并且模块 action 的 `context.state` 同样指向局部状态。

    [详细介绍](store/index.md#module)

- **deps**

  - 类型: `Object`

    包含了当前store依赖的第三方store：

    ``` js
    {
      store1: storeA,
      store2: storeB
    }
    ```

    [详细介绍](store/index.md#多实例)


### Store 实例属性

- **state**

  - 类型: `Object`

    根状态。

- **getters**

  - 类型: `Object`

    暴露出注册的 getter。

### Store 实例方法

- **`commit(type: string, payload?: any, options?: Object) | commit(mutation: Object, options?: Object)`**

  提交 mutation。[详细介绍](store/index.md#mutation)

- **`dispatch(type: string, payload?: any, options?: Object) | dispatch(action: Object, options?: Object)`**

  分发 action。返回一个Promise。[详细介绍](store/index.md#action)

- **`mapState(map: Array<string> | Object): Object`**

  为组件创建计算属性以返回 store 中的状态。[详细介绍](store/index.md#mapstate-辅助函数)

- **`mapGetters(map: Array<string> | Object): Object`**

  为组件创建计算属性以返回 getter 的返回值。[详细介绍](store/index.md#mapgetters-辅助函数)

- **`mapActions(map: Array<string> | Object): Object`**

  创建组件方法分发 action。[详细介绍](store/index.md#在组件中分发-action)

- **`mapMutations(map: Array<string> | Object): Object`**

  创建组件方法提交 mutation。[详细介绍](store/index.md#在组件中提交-mutation)


### toPureObject

由于使用的mobx的响应式数据，所以业务拿到的数据可能是mobx响应式数据实例（包含了些其他属性），使用toPureObject可以将响应式的数据转化成纯js对象

```js
import {toPureObject} from '@mpxjs/core'
const pureObject = toPureObject(object)
```

### observable

用于创建响应式数据，属于mobx提供的能力

```js
import {observable} from '@mpxjs/core'
// mpx.observable(...)
const a = observable(object)
```

~~### extendObservable~~

~~（已废弃）用于扩展响应式数据，属于mobx提供的能力, 主要用于添加新的可观察数据, `并不会触发订阅者更新`~~

```js
import {observable, extendObservable} from '@mpxjs/core'
const a = observable(object)
// mpx.extendObservable(...)
const b = extendObservable(a, {newProp: 10})
```

### watch(context, expr, handler)

用于观察数据从而触发相应操作

- context 回调执行的上下文
- expr 观察的表达式[String | Function]。可以是path字符串（取值将在context上进行查找），也可以是函数
- handler 响应函数[Function | Object]。如果是对象，则handler.handler为回调函数，其他参数作为options，与组件的watch一致

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

### mpx.set & mpx.remove

用于对一个响应式对象新增或删除属性，会`触发订阅者更新操作`

```js
import mpx, {observable} from '@mpxjs/core'
const a = observable({name: 1})
mpx.set(a, 'age', 'test')
mpx.remove(a, 'age')
```

### mpx.use

mpx.use用于安装外部扩展, 支持多参数，如果第二个参数是一个包含（prefix or postfix）的option，
那么将会对插件扩展的属性添加前缀或后缀（主要考虑插件开发者直接导出的属性可能存在同名问题，use时指定
前缀或后缀能在业务角度去处理这种情况）

```js
import mpx from '@mpxjs/core'
import test from './test'
mpx.use(test)
mpx.use(test, {prefix: 'mpx'}, 'otherparams')
```

[具体例子](extend/index.md)

### mpx.mixin

用于注入mixin

```js
import mpx from '@mpxjs/core'
mpx.mixin({
  methods: {
    $fetch: function(){}
  }
}, types)
```
##### types选项
types决定了mixin会注入到哪种实例上，app | page | component

- String, 'app' | 'page' | 'component'
- Array, ['app', 'page', 'component']
- 如果不传，默认为['app', 'page', 'component']

