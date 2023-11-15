# 全局 API

## 全局对象 Mpx {#global-mpx}

`@mpxjs/core` 默认导出 mpx 全局实例对象，通过该实例对象我们可以访问部分应用实例 API

### mixin
全局注入mixin方法接收两个参数：mpx.mixin(mixins, options)
- 第一个参数是要混入的mixins，接收类型 `MixinObject|MixinObject[]`
- 第二个参数是为全局混入配置，形如`{types:string|string[], stage:number}`，其中`types`用于控制mixin注入的范围，可选值有`'app'|'page'|'component'`；`stage`用于控制注入mixin的插入顺序，当stage为负数时，注入的mixin会被插入到构造函数配置中的`options.mixins`之前，数值越小约靠前，反之当stage为正数时，注入的mixin会被插入到`options.mixins`之后，数值越大越靠后。

> 所有mixin中生命周期的执行均先于构造函数配置中直接声明的生命周期，mixin之间的执行顺序则遵从于其在`options.mixins`数组中的顺序

> options的默认值为`{types: ['app','page','component'], stage: -1}`，不传stage时，全局注入mixin的声明周期默认在`options.mixins`之前执行

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

```ts
function observable(options: object): Mpx
```

用于创建响应式数据。

```js
import mpx from '@mpxjs/core'
// 直接通过 mpx 对象访问
const b = mpx.observable(object)
```
- **注意：**
  Mpx 2.8 版本后该 API 等同于 `reactive`，同时不再支持具名导出方式，建议直接使用 `reactive` 替代，请[点击](/api/reactivity-api/basic-reactivity.html#reactive)查看。

### set
用于对一个响应式对象新增属性，会`触发订阅者更新操作`。[查看详情](/api/global-api.html#set)

### delete

```ts
function delete(target: Object, key: string | number): void
```

用于对一个响应式对象删除属性，会`触发订阅者更新操作`

```js
import mpx, { reactive } from '@mpxjs/core'
const person = reactive({name: 1})
mpx.delete(person, 'age')
```
- **注意：**
  `mpx.delete` 也可以使用具名导出的 `del`。[查看详情](/api/global-api.html#del)

### use
>用于安装外部扩展, 支持多参数
方法接收两个参数：mpx.use(plugin, options)
- 第一个参数是要安装的外部扩展
- 第二个参数是对象，如果第二个参数是一个包含（prefix or postfix）的option， 那么将会对插件扩展的属性添加前缀或后缀

```js
import mpx from '@mpxjs/core'
import test from './test'
mpx.use(test)
mpx.use(test, {prefix: 'mpx'}, 'otherparams')
```

### watch

watch 可以通过全局实例访问，也可以使用具名导出的方式，二者逻辑相同，我们推荐使用具名导出的方式。[查看详情](reactivity-api/computed-watch-api.html#watch)

## createApp
> 注册一个小程序，接受一个 Object 类型的参数

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

```ts
function createPage(options: object, config?: object): void
```
 
- options: 

  具体形式除了 computed、watch 这类 Mpx 扩展特性之外，其他的属性都参照原生小程序的官方文档即可。

- config:

  如果希望标识一个组件是最纯粹的原生组件，不用数据响应等能力，可通过 config.isNative 传 true 声明。
  如果有需要复写/改写最终调用的创建页面的构造器，可以通过 config 对象的 customCtor 提供。
  - **注意:**
    mpx本身是用 component 来创建页面的，如果传page可能在初始化时候生命周期不正常导致取props有一点问题

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

```ts
function createComponent(options: object, config?: object): void
```

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

```ts
function nextTick(callback: Function): void
```

当我们在 Mpx 中更改响应性状态时，最终页面的更新并不是同步立即生效的，而是由 Mpx 将它们缓存在一个队列中， 等到下一个 tick 一起执行，
从而保证了组件/页面无论发生多少状态改变，都仅执行一次更新，从而减少 `setData` 调用次数。

`nextTick()` 可以在状态改变后立即调用，可以传递一个函数作为参数，在等待页面/组件更新完成后，函数参数会触发执行。

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

```ts
function toPureObject(options: object): object
```

业务拿到的数据可能是响应式数据实例（包含了些其他属性），使用`toPureObject`方法可以将响应式的数据转化成纯 js 对象。

```js
import {toPureObject} from '@mpxjs/core'
const pureObject = toPureObject(object)
```

## getMixin
专为ts项目提供的反向推导辅助方法，该函数接收类型为 `Object` ,会将传入的嵌套mixins对象拉平成一个扁平的mixin对象

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

```ts
function implement(name: string, options: object): object
```

- `{Object} options`
  - `{Array} modes`：需要取消的平台
  - `{Boolean} remove`：是否将此能力直接移除
  - `{Function} processor`：设置成功的回调函数


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

## 内建生命周期变量 {#built-in-lifecycle-variable}
Mpx 在运行时自身有着一套内建生命周期，当开发者想使用内建生命周期时，可以通过内建生命周期变量进行对应生命周期的注册，
需要注意的是，这部分内建生命周期变量**只能用于选项式 API 中**。

### BEFORECREATE

`string`

在组件实例刚刚被创建时执行，在实例初始化之后、进行数据侦听和 data 初始化之前同步调用，注意此时不能调用 setData。

```js
import {createComponent, BEFORECREATE} from "@mpxjs/core"

createComponent({
  [BEFORECREATE]() {
      console.log('beforecreate trigger')
  }
})
```

### CREATED

`string`

在组件实例刚刚被创建时执行。在这一步中，实例已完成对选项的处理，意味着以下内容已被配置完毕：数据侦听、计算属性、事件/侦听器的回调函数。
然而，挂载阶段还没开始，注意此时不能调用 setData。

```js
import {createComponent, CREATED} from "@mpxjs/core"

createComponent({
  [CREATED]() {
      console.log('beforecreate trigger')
  }
})
```

### BEFOREMOUNT

选项式 API 中使用，作用同[onBeforeMount](/api/composition-api.html#onbeforemount)

### MOUNTED

选项式 API 中使用，作用同[onMounted](/api/composition-api.html#onmounted)

### BEFOREUPDATE

选项式 API 中使用，作用同[onBeforeUpdate](/api/composition-api.html#onbeforeupdate)

### UPDATED

选项式 API 中使用，作用同[onUpdated](/api/composition-api.html#onupdated)

### SERVERPREFETCH

选项式 API 中使用，作用同[onServerPrefetch](/api/composition-api.html#onServerPrefetch)

### BEFOREUNMOUNT

选项式 API 中使用，作用同[onBeforeUnmount](/api/composition-api.html#onbeforeunmount)

### UNMOUNTED

选项式 API 中使用，作用同[onUnmounted](/api/composition-api.html#onunmounted)

### ONLOAD

选项式 API 中使用，作用同[onLoad](/api/composition-api.html#onload)

### ONSHOW

选项式 API 中使用，作用同[onShow](/api/composition-api.html#onshow)

### ONHIDE

选项式 API 中使用，作用同[onHide](/api/composition-api.html#onhide)

### ONRESIZE

选项式 API 中使用，作用同[onResize](/api/composition-api.html#onresize)

## 响应式 API
详情请[移步](/api/reactivity-api/basic-reactivity.html)

## 组合式 API
详情请[移步](/api/composition-api.html)

## store API
详情请[移步](/api/store-api.html)
