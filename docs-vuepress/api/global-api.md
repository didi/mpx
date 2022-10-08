---
sidebarDepth: 2
---
# 全局 API

## 全局对象 Mpx

`@mpxjs/core` 默认导出 mpx 全局实例对象，通过该实例对象我们可以访问部分应用实例 API

### mixin
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

### injectMixins
该方法是 `mpx.mixin` 方法的别名，`mpx.injectMixins({})` 等同于 `mpx.mixin({})`

### observable

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
  Mpx 2.8 版本后该 API 等同于 `reactive`，同时不再支持具名导出方式，建议直接使用 `reactive` 替代，请[点击](/api/reactivity-api/basic-reactivity.html#reactive)查看。

### set
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

### delete
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

### use
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

### watch

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




## createApp
> 注册一个小程序，接受一个 Object 类型的参数
- **用法：**
```js
createApp(options)
```

- **参数：**
  - `{Object} options`

    可指定小程序的生命周期回调，以及一些全局变量等


- **示例：**
```js
import {createApp} from '@mpxjs/core'

createApp({
  onLaunch () {
    console.log('Launch')
  },
  onShow () {
    console.log('Page show')
  },
  //全局变量 可通过getApp()访问
  globalDataA: 'I am global dataA',
  globalDataB: 'I am global dataB'
})
// 或者
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

    具体形式除了 computed、watch 这类 Mpx 扩展特性之外，其他的属性都参照原生小程序的官方文档即可。
  - `{Object} config`（可选参数）

    如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过 config.isNative 传 true 声明。
    如果有需要复写/改写最终调用的创建页面的构造器，可以通过 config 对象的 customCtor 提供。
    **注意:**
    mpx本身是用 component 来创建页面的，如果传page可能在初始化时候生命周期不正常导致取props有一点问题

- **示例：**
```js
import {createPage} from '@mpxjs/core'

createPage({
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
```

## createComponent
> 创建自定义组件，接受两个Object类型的参数。

- **用法：**
    ```js
    createComponent(options, config?)
    ```
- **参数：**
  - `{Object} options`

    具体形式除了 computed、watch 这类 Mpx 扩展特性之外，其他的属性都参照原生小程序的官方文档即可。
  - `{Object} config`（可选参数）

    如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过 config.isNative 传 true 声明。
    如果有需要复写/改写最终调用的创建组件的构造器，可以通过 config 对象的 customCtor 提供。


- **示例：**
```js
import {createComponent} from '@mpxjs/core'

createComponent({
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
```


## nextTick

* **参数：**
  * `{Function} callback`
* **用法：**

当我们在 Mpx 中更改响应性状态时，最终页面的更新并不是同步立即生效的，而是由 Mpx 将它们缓存在一个队列中， 等到下一个 tick 一起执行，
从而保证了组件/页面无论发生多少状态改变，都仅执行一次更新，从而减少 `setData` 调用次数。

`nextTick()` 可以在状态改变后立即调用，可以传递一个函数作为参数，在等待页面/组件更新完成后，函数参数会触发执行。
* **示例：**
 ``` js
      import {createComponent, nextTick, ref} from '@mpxjs/core'
      createComponent({
        setup (props, context) {
          const showChild = ref(false)
          // DOM 还没有更新
          setTimeOut(() => {
             showChild.value = true
          }, 2000)
          nextTick(function() {
            context.refs['child'].showToast()
          })
          return {
            showChild
          }
        }
      })
  ```

## toPureObject

- **参数**：
  - `{Object} options`

- **用法**:

业务拿到的数据可能是响应式数据实例（包含了些其他属性），使用`toPureObject`方法可以将响应式的数据转化成纯 js 对象。

```js
import {toPureObject} from '@mpxjs/core'
const pureObject = toPureObject(object)
```

## getMixin
专为ts项目提供的反向推导辅助方法，该函数接收类型为 `Object` ,会将传入的嵌套mixins对象拉平成一个扁平的mixin对象

**使用**
```js
import { createComponent, getMixin} from '@mpxjs/core'
// 使用mixins，需要对每一个mixin子项进行getMixin辅助函数包裹，支持嵌套mixin
const mixin = getMixin({
  mixins: [getMixin({
    data: {
      value1: 2
    },
    lifetimes: {
      attached () {
        console.log(this.value1, 'attached')
      }
    },
    mixins: [getMixin({
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

## implement

- **参数**：
  - `{String} name`
  - `{Object} options`
    - `{Array} modes`：需要取消的平台
    - `{Boolean} remove`：是否将此能力直接移除
    - `{Function} processor`：设置成功的回调函数


- **用法**:

以微信为 base 将代码转换输出到其他平台时（如支付宝、web 平台等），会存在一些无法进行模拟的跨平台差异，会在运行时进行检测并报错指出，例如微信转支付宝时使用 moved 生命周期等。使用`implement`方法可以取消这种报错。您可以使用 mixin 自行实现跨平台差异，然后使用 implement 取消报错。

```js
import {implement} from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  const processor = () => {
  }
  implement('onShareAppMessage', {
    modes: ['web'], // 需要取消的平台，可配置多个
    remove: true, // 是否将此能力直接移除
    processor // 设置成功的回调函数
  })
}
```


## 响应式 API
请[点击](/api/reactivity-api/basic-reactivity.html)查看

## 组合式 API
请[点击](/api/composition-api.html)查看

## store API
请[点击](/api/store-api.html)查看
