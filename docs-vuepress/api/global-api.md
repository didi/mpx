# 全局api

## createApp

## createPage

## createComponent

## createStore

## createStoreWithThis

## mixin

## injectMixins

## Mpx.toPureObject(options)

- **参数**：
  - `{Object} options`

- **用法**:

由于使用的mobx的响应式数据，所以业务拿到的数据可能是mobx响应式数据实例（包含了些其他属性），使用`Mpx.toPureObject()`可以将响应式的数据转化成纯js对象。

```js
import {toPureObject} from '@mpxjs/core'
const pureObject = toPureObject(object)
```

## Mpx.observable(options)

- **参数**：
  - `{Object} options`

- **用法**:

用于创建响应式数据，属于mobx提供的能力。

```js
import {observable} from '@mpxjs/core'
// mpx.observable(...)
const a = observable(object)
```

## Mpx.watch(context, expr, handler)

- **参数**：
  - `{Object} context` 回调执行的上下文
  - `{String | Function} expr` 观察的表达式。可以是path字符串（取值将在context上进行查找），也可以是函数
  - `{Function | Object} handler` 响应函数，如果是对象，则handler.handler为回调函数，其他参数作为options，与组件的watch一致

- **用法**:

用于观察数据从而触发相应操作。

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

## set

## remove

## delete

## Mpx.setConvertRule(rule)

- **参数**：
  - `{Object} rule`

- **用法**:

在微信转换其他平台的过程中，不同平台有不同的生命周期转换规则。如微信、支付宝、百度、qq、头条小程序平台。`setConvertRule`方法用来设置生命周期的转换规则为哪个平台。

```js
Mpx.setConvertRule({
  lifecycleTemplate: 'ali' // 可设置 wx（微信）、ali（支付宝）、swan（百度）、tt（头条）、qq
})
```

## getMixin

## Mpx.getComputed(computedItem)

- **参数**：
  - `{Function} computedItem`

- **用法**:

Typescript 类型推导辅助函数。在computed中访问当前computed对象中的其他计算属性时，需要用getComputed辅助函数包裹。

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

## Mpx.implement(name, config)

- **参数**：
  - `{String} name` 
  - `{Object} config`

- **用法**:

以微信为base将代码转换输出到其他平台时（如支付宝、web平台等），会存在一些无法进行模拟的跨平台差异，会在运行时进行检测并报错指出，例如微信转支付宝时使用moved生命周期等。使用`implement`方法可以取消这种报错。您可以使用mixin自行实现跨平台差异，然后使用implement取消报错。

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
