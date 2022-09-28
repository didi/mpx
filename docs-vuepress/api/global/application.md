# 全局对象 API

`@mpxjs/core` 默认导出 mpx 全局实例对象，通过该实例对象我们可以访问部分应用实例 API

## mixin
全局注入mixin方法接收两个参数：mpx.mixin(mixins, options)
- 第一个参数是要混入的mixins，接收类型 `MixinObject|MixinObject[]`
- 第二个参数是为全局混入配置，形如`{types:string|string[], stage:number}`，其中`types`用于控制mixin注入的范围，可选值有`'app'|'page'|'component'`；`stage`用于控制注入mixin的插入顺序，当stage为负数时，注入的mixin会被插入到构造函数配置中的`options.mixins`之前，数值越小约靠前，反之当stage为正数时，注入的mixin会被插入到`options.mixins`之后，数值越大越靠后。

> 所有mixin中生命周期的执行均先于构造函数配置中直接声明的生命周期，mixin之间的执行顺序则遵从于其在`options.mixins`数组中的顺序

> options的默认值为`{types: ['app','page','component'], stage: -1}`，不传stage时，全局注入mixin的声明周期默认在`options.mixins`之前执行

**使用**
```js
import mpx from '@mpxjs/core'
// 只在page中混入
mpx.mixin({
  methods: {
    getData: function(){}
  }
}, {
  types:'page'
})

// 默认混入，在app|page|component中都会混入
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

// 只在component中混入，且执行顺序在options.mixins之后
mpx.mixin({
  attached() {
    console.log('com attached')
  }
}, {
  types: 'component',
  stage: 100
})
```

## injectMixins
该方法是 `mpx.mixin` 方法的别名，`mpx.injectMixins({})` 等同于 `mpx.mixin({})`

## observable

- **参数**：
    - `{Object} options`

- **用法**:

用于创建响应式数据。

```js
import mpx from '@mpxjs/core'
// 直接通过 mpx 对象访问
const b = mpx.observable(object)
```
- **注意：**
  Mpx 2.8 版本后该 API 等同于 `reactive`，同时不再支持具名导出方式，建议直接使用 `reactive` 替代。

## set
用于对一个响应式对象新增属性，会`触发订阅者更新操作`
- **参数**：
    - `{Object | Array} target`
    - `{string | number} propertyName/index`
    - `{any} value`

- **示例：**
```js
import mpx, { set, reactive } from '@mpxjs/core'
const person = reactive({name: 1})
// 直接通过应用实例访问
mpx.set(person, 'age', 19) 
// 具名导出使用
set(person, 'age', 17) // age 改变后会触发订阅者视图更新
```
- **注意：**
`set` 支持通过全局实例对象访问，同时也支持具名导入的方式使用。

## delete
用于对一个响应式对象删除属性，会`触发订阅者更新操作`
- **参数**：
    - `{Object | Array} target`
    - `{string | number} propertyName/index`
- **示例：**
```js
import mpx, { reactive } from '@mpxjs/core'
const person = reactive({name: 1})
mpx.delete(person, 'age')
```
- **注意：**
`mpx.delete` 也可以使用具名导出的 `del` todo方法替换

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

## watch

watch 可以通过全局实例访问，也可以使用[具名导出的方式](reactivity-api/computed-watch-api.html#watch)，也可以在组件/页面实例访问[$watch](instance-api.html#watch)

- **参数**：
    - `{Function} expr`
    - `{Function | Object} callback`
    - `{Object} [options]`
        - `{boolean} deep`
        - `{boolean | Function} once`
        - `{boolean} immediate`

- **返回值**：`{Function} unwatch`

- **用法**:

  观察一个函数计算结果的变化。回调函数得到的参数分别为新值和旧值。参数详细说明：
    1. `expr`：是函数类型，返回一个你需要观察的表达式，表达式的运算量需要是响应式数据。
    2. `callback`：响应函数，如果是对象，则 callback.handler 为回调函数，其他参数作为 options。

  返回值详细说明：

  `unwatch`：返回一个函数，用来取消观察，停止触发回调。

- **示例**：

```js
import { watch } from '@mpxjs/core'

let unwatch = mpx.watch(() => {
  return this.a + this.b
}, (newVal, oldVal) => {
  // 做点什么
})

// 调用返回值unwatch可以取消观察
unwatch()
```

- **选项**：deep

  为了发现对象内部值的变化，可以在选项参数中指定 deep: true。

  ``` javascript
  import {watch} from '@mpxjs/core'

  watch(() => {
    return this.someObject
  }, () => {
    // 回调函数
  }), {
    deep: true
  })
  this.someObject.nestedValue = 123
  // callback is fired
  ```
- **选项**：once

  在选项参数中指定 `once: true` 该回调方法只会执行一次，后续的改变将不会触发回调；  
  该参数也可以是函数，若函数返回值为 `true` 时，则后续的改变将不会触发回调

  ```JavaScript
  import {watch} from '@mpxjs/core'
  
  watch(() => {
    return this.a
  }, () => {
    // 该回调函数只会执行一次
  }, {
    once: true
  })
  
  // 当 once 是函数时
  watch(() => {
    return this.a
   }, (val, newVal) => {
    // 当 val 等于2时，this.a 的后续改变将不会被监听
   }, {
    once: (val, oldVal) => {
      if (val == 2) {
        return true
      }
    }
  })
  ```

- **选项**：immediate

  在选项参数中指定 `immediate: true` 将立即以表达式的当前值触发回调。

  ``` javascript
  import {watch} from '@mpxjs/core'

  watch(() => {
    return this.a
  }, () => {
    // 回调函数
  }), {
    immediate: true
  })
  // 立即以 `this.a` 的当前值触发回调
  ```
  注意在带有 immediate 选项时，你不能在第一次回调时取消侦听。
  ``` javascript
  import {watch} from '@mpxjs/core'

  var unwatch = watch(() => {
    return this.a
  }, () => {
    unwatch() // 这会导致报错！
  }), {
    immediate: true
  })

  ```
  如果你仍然希望在回调内部调用取消侦听的函数，你应该先检查其可用性。
  ``` javascript
  import {watch} from '@mpxjs/core'

  var unwatch = watch(() => {
    return this.a
  }, () => {
    if (unwatch) { // 请先检查其可用性！
      unwatch()
    }
  }), {
    immediate: true
  })


