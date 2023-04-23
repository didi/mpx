# 响应式 API

在 Mpx 中，为了支持[组合式 API](composition-api.md) 的使用，我们参考 Vue3 提供了相关的响应式 API，但由于 `proxy` 目前仍然存在浏览器兼容性问题，我们在底层还是基于 `Object.defineProperty` 实现的数据响应，因此相较于 Vue3 提供的 API 存在一些删减，同时也存在与 Vue2 一样的数据响应[使用限制](https://v2.cn.vuejs.org/v2/guide/reactivity.html#%E6%A3%80%E6%B5%8B%E5%8F%98%E5%8C%96%E7%9A%84%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)。

## 创建响应式对象

在 Mpx 中，我们可以使用 `reactive` 方法将一个 JavaScript 对象**深度转换**为响应式对象，当对象内数据发生变化时能够被系统感知，相当于 Vue2 中的 `observable`，需要注意的是在 Mpx 中 `reactive()` 是将传入的对象进行响应性转化后返回原对象，而在 Vue3 中则会基于 `proxy` API 返回传入对象的响应式代理。

目前 `reactive` 仅支持传入基础对象类型，包括纯对象和数组，暂不支持 `Map` 和 `Set` 这样的集合类型。

```js
import { reactive } from '@mpxjs/core'

// 响应式对象
const state = reactive({
  count: 0
})
```

你可以在[响应式基础 API](../../api/reactivity-api/basic-reactivity.md) 章节中了解更多关于 `reactive` 的信息。

## 使用`ref()`创建独立的响应式值 {#use-ref-create-reactive-value}

上面提到 `reactive` 只能传入对象类型数据，当我们想将一个原始数据类型的值（如数字、字符串、布尔值）变成响应式时，我们不得不先将其包装为一个对象，使用起来较为繁琐，新的 `ref` 方法能够让我们便捷地达成上述目标：

```js
import { ref } from '@mpxjs/core'

// 响应式值
const count = ref(0)
```

`ref()` 会返回一个可变的响应式对象，该对象作为一个**响应式引用**通过 `value` 属性维护着传入的内部值：

```js
import { ref } from '@mpxjs/core'

const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1
```

### Ref 解包

当 `ref` 作为渲染上下文 (从 `setup()` 中返回的对象) 上的 property 返回并可以在模板中被访问时，它将自动浅层次解包内部值。只有访问嵌套的 ref 时需要在模板中添加 `.value`：

```html
<template>
  <view>
    <view>{{ count }}</view>
    <view>{{ nested.count.value }}</view>
  </view>
</template>

<script>
  import { createComponent, ref } from '@mpxjs/core'
   
  createComponent({
    setup() {
      const count = ref(0)
      return {
        count,
        nested: {
          count
        }
      }
    }
  }
</script>
```

### 访问响应式对象

当 `ref` 作为响应式对象的 property 被访问或更改时，为使其行为类似于普通 property，它会自动解包内部值：

```js
const count = ref(0)
const state = reactive({
  count
})

console.log(state.count) // 0

state.count = 1
console.log(count.value) // 1
```

如果将新的 ref 赋值给现有 ref 的 property，将会替换旧的 ref：

```js
const otherCount = ref(2)

state.count = otherCount
console.log(state.count) // 2
console.log(count.value) // 1
```

Ref 解包仅发生在被响应式 `Object` 嵌套的时候。当从 `Array` 访问 ref 时，不会进行解包：

```js
const arr = reactive([ref('Hello world')])
// 这里需要 .value
console.log(arr[0].value)
```

## 响应式对象解构

当我们想使用大型响应式对象的一些 property 时，可能很想使用 **ES6 解构**来获取我们想要的 property：

```js
import { reactive } from '@mpxjs/core'

const people = reactive({
  name: 'hiyuki',
  age: 26,
  gender: 'male',
  city: 'Beijing'
})

let { name, age } = people
```

遗憾的是，使用解构的两个 property 的响应性都会丢失。对于这种情况，我们需要将我们的响应式对象转换为一组 ref。这些 ref 将保留与源对象的响应式关联：

```js
import { reactive, toRefs } from '@mpxjs/core'

const people = reactive({
  name: 'hiyuki',
  age: 26,
  gender: 'male',
  city: 'Beijing'
})

let { name, age } = toRefs(people)
age.value = 30 // age 现在是个 ref，我们需要使用 .value 进行访问，对其进行修改也将直接作用在原响应式对象中
console.log(people.age) // 30
```

你可以在[Refs API](../../api/reactivity-api/refs-api.md) 章节中了解更多关于 `refs` 的信息。

## 计算值

有时我们需要依赖于其他状态的状态——在 选项式 API 中，这是用组件计算属性处理的，在新的组合式 API 中，我们可以使用 `computed` 函数直接创建计算值：它接受 getter 函数并为 getter 返回的值返回一个不可变的响应式 ref 对象。

```js
import { ref, computed } from '@mpxjs/core'

const count = ref(1)
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 2

plusOne.value++ // error
```

或者，可以使用一个带有 get 和 set 函数的对象来创建一个可写的 ref 对象。

```js
import { ref, computed } from '@mpxjs/core'

const count = ref(1)
const plusOne = computed({
  get: () => count.value + 1,
  set: val => {
    count.value = val - 1
  }
})

plusOne.value = 1
console.log(count.value) // 0
```

## `watchEffect`

为了根据响应式状态自动应用和重新应用副作用，我们可以使用 `watchEffect` 函数。它立即执行传入的一个函数，同时响应式追踪其依赖，并在其依赖变更时重新运行该函数。

```js
const count = ref(0)

watchEffect(() => console.log(count.value))
// -> logs 0

setTimeout(() => {
  count.value++
  // -> logs 1
}, 100)
```

### 停止侦听

当 `watchEffect` 在组件的 [setup()](composition-api.md#Setup) 函数或[生命周期钩子](composition-api.md#生命周期钩子)被调用时，侦听器会被链接到该组件的生命周期，并在组件卸载时自动停止。

在一些情况下，也可以显式调用返回值以停止侦听：

```js
const stop = watchEffect(() => {
  /* ... */
})

// later
stop()
```

### 清除副作用

有时副作用函数会执行一些异步的副作用，这些响应需要在其失效时清除 (即完成之前状态已改变了) 。所以侦听副作用传入的函数可以接收一个 `onInvalidate` 函数作入参，用来注册清理失效时的回调。当以下情况发生时，这个失效回调会被触发：

* 副作用即将重新执行时
* 侦听器被停止 (如果在 `setup()` 或生命周期钩子函数中使用了 `watchEffect`，则在组件卸载时)

```js
watchEffect(onInvalidate => {
  const token = performAsyncOperation(id.value)
  onInvalidate(() => {
    // id has changed or watcher is stopped.
    // invalidate previously pending async operation
    token.cancel()
  })
})
```

之所以是通过传入一个函数去注册失效回调，而不是从回调返回它，是因为返回值对于异步错误处理很重要。

在执行数据请求时，副作用函数往往是一个异步函数：

```js
const data = ref(null)
watchEffect(async onInvalidate => {
  onInvalidate(() => {
    /* ... */
  }) // 在Promise解析之前注册清除函数
  data.value = await fetchData(props.id)
})
```

我们知道异步函数都会隐式地返回一个 Promise，但是清理函数必须要在 Promise 被 resolve 之前被注册。

### 副作用刷新时机

默认情况下，数据发生变更时，关联的副作用会被推入异步队列中，进行异步刷新，这样可以避免同一个“tick” 中多个状态改变导致的不必要的重复调用。在核心的具体实现中，组件的 `render` 函数也是一个被侦听的副作用。当一个用户定义的副作用函数进入队列时，默认情况下，会在所有的组件 `render` 前执行：

```html
<template>
  <view>{{ count }}</view>
</template>

<script>
import { createComponent, ref, watchEffect } from '@mpxjs/core'

createComponent({
  setup() {
    const count = ref(0)

    watchEffect(() => {
      console.log(count.value)
    })

    return {
      count
    }
  }
})
</script>
```

在这个例子中：

* `count` 会在初始运行时同步打印出来
* 更改 `count` 时，将在组件**更新前**执行副作用。

如果需要在组件更新(例如：当与[模板引用](composition-api.md#模板引用)一起)后重新运行侦听器副作用，我们可以传递带有 `flush` 选项的附加 `options` 对象 (默认为 `'pre'`)：

```js
// 在组件更新后触发，这样你就可以访问更新的 DOM。
// 注意：这也将推迟副作用的初始运行，直到组件的首次渲染完成。
watchEffect(
  () => {
    /* 访问视图 */
  },
  {
    flush: 'post'
  }
)
```

`flush` 选项还接受 `sync`，这将强制效果始终同步触发。然而，这是低效的，应该很少需要。

与此同时，我们还提供了 `watchPostEffect` 和 `watchSyncEffect` 别名用来让代码意图更加明显。

## `watch`

`watch` API 相当于选项式 API 中的 `watch property`。`watch` 需要侦听特定的数据源，并在回调函数中执行副作用。默认情况下，它也是惰性的，即只有当被侦听的源发生变化时才执行回调。

* 与 [watchEffect](#watcheffect) 比较，`watch` 允许我们：
  * 懒执行副作用；
  * 更具体地说明什么状态应该触发侦听器重新运行；
  * 访问侦听状态变化前后的值。
  
### 侦听单个数据源

侦听器数据源可以是返回值的 getter 函数，也可以直接是 `ref`：

```js
// 侦听一个 getter
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (count, prevCount) => {
    /* ... */
  }
)

// 直接侦听ref
const count = ref(0)
watch(count, (count, prevCount) => {
  /* ... */
})
```

### 侦听多个数据源

侦听器还可以使用数组同时侦听多个源：

```js
const firstName = ref('')
const lastName = ref('')

watch([firstName, lastName], (newValues, prevValues) => {
  console.log(newValues, prevValues)
})

firstName.value = 'John' // logs: ["John", ""] ["", ""]
lastName.value = 'Smith' // logs: ["John", "Smith"] ["John", ""]
```

尽管如此，如果你在同一个函数里同时改变这些被侦听的来源，侦听器仍只会执行一次：

```js
createComponent({
  setup() {
    const firstName = ref('')
    const lastName = ref('')
  
    watch([firstName, lastName], (newValues, prevValues) => {
      console.log(newValues, prevValues)
    })
  
    const changeValues = () => {
      firstName.value = 'John'
      lastName.value = 'Smith'
      // 打印 ["John", "Smith"] ["", ""]
    }
  
    return { changeValues }
  }
})
```

注意多个同步更改只会触发一次侦听器。

通过更改设置 `flush: 'sync'`，我们可以为每个更改都强制触发侦听器，尽管这通常是不推荐的。或者，可以用 [nextTick](../../api/global-api.md#nexttick) 等待侦听器在下一步改变之前运行。例如：

```js
const changeValues = async () => {
  firstName.value = 'John' // 打印 ["John", ""] ["", ""]
  await nextTick()
  lastName.value = 'Smith' // 打印 ["John", "Smith"] ["John", ""]
}
```

### 侦听响应式对象

为了侦听深度嵌套的对象或数组中 property 变化，我们需要将 `deep` 选项设置为 true：

```js
const state = reactive({ 
  id: 1,
  attributes: { 
    name: '',
  }
})

watch(
  () => state,
  (state, prevState) => {
    console.log('not deep', state.attributes.name, prevState.attributes.name)
  }
)

watch(
  () => state,
  (state, prevState) => {
    console.log('deep', state.attributes.name, prevState.attributes.name)
  },
  { deep: true }
)

state.attributes.name = 'Alex' // 日志: "deep" "Alex" "Alex"
```

然而，侦听一个响应式对象或数组将始终返回该对象的引用。为了完全侦听深度嵌套的对象和数组，可能需要对值进行深拷贝。这可以通过诸如 `lodash.cloneDeep` 这样的实用工具来实现：

```js
import _ from 'lodash'

const state = reactive({
  id: 1,
  attributes: {
    name: '',
  }
})

watch(
  () => _.cloneDeep(state),
  (state, prevState) => {
    console.log(state.attributes.name, prevState.attributes.name)
  }
)

state.attributes.name = 'Alex' // 日志: "Alex" ""
```

我们也可以直接给 `watch()` 传入一个响应式对象，这种情况下会隐式地强制开启 `deep` 选项，确保嵌套的深层变更能够被监听到：

```js
const state = reactive({ 
  id: 1,
  attributes: { 
    name: '',
  }
})

watch(
  state,
  (state, prevState) => {
    console.log('implicit deep', state.attributes.name, prevState.attributes.name)
  }
)

state.attributes.name = 'Alex' // 日志: "implicit deep" "Alex" "Alex"
```

> 需要注意的是，在侦听使用 `reactive()` 创建的响应式对象时，受数据响应限制影响，在改变数组或使用 `set()` 新增对象属性时，存在和 Vue3 中表现不一致的情况，详情查看[这里](#数据响应限制带来的差异)

### 立即回调的侦听器

同选项式 `watch` 一致，我们也可以通过传递 `immediate` 选项让侦听回调立即执行：

```js
const state = reactive({ 
  count: 0
})

watch(
  () => state.count,
  (value, oldValue) => {
    console.log('immediate', value, oldValue) // 日志: "immediate" 0 undefined
  },
  { immediate: true }
)
```

### 与 watchEffect 共享的行为

`watch` 与 `watchEffect` 共享[停止侦听](#停止侦听)，[清除副作用](#清除副作用) (相应地 `onInvalidate` 会作为回调的第三个参数传入)、[副作用刷新时机](#副作用刷新时机)行为。

## 响应式 API 与 Vue3 中的区别

下面我们来总结一下 Mpx 中响应式 API 与 Vue3 中的区别：

* 不支持 `raw` 相关 API（`markRaw` 除外，我们提供了该 API 用于跳过部分数据的响应式转换）
* 不支持 `readonly` 相关 API
* 不支持 `watchEffect`、`watch`、`computed` 的调试选项
* 不支持对 `map`、`set` 等集合类型进行响应式转换
* 受到 `Object.defineProperty` 实现带来的数据响应限制影响

### 数据响应限制带来的差异

同 Vue2 一致，Mpx 无法感知到对象 property 的添加或移除，我们暴露了 `set` 和 `del` API 来让用户显式地进行相关操作：

```js
import { ref, watchSyncEffect, set, del } from '@mpxjs/core'

const state = ref({
  count: 0
})

watchSyncEffect(() => {
  console.log(JSON.stringify(state.value)) // {"count":0}
})

set(state.value, 'hello', 'world') // {"count":0,"hello":"world"}

del(state.value, 'count') // {"hello":"world"}
```

同样，我们需要使用 `set` 或数组原型方法对数组进行修改：

```js
import { ref, watchSyncEffect, set } from '@mpxjs/core'

const state = ref([0, 1, 2, 3])

watchSyncEffect(() => {
  console.log(JSON.stringify(state.value)) // [0,1,2,3]
})

set(state.value, 1, 3) // [0,3,2,3]

state.value.push(4) // [0,3,2,3,4]
```

可能你已经注意到，上面两个示例当中我们都使用了 `ref()` 进行响应式数据创建，这是有原因的，在新的响应式 API 模式下，我们使用 `reactive()` 创建的响应式数据在上述情况下仍然无法绕过 Vue2 设计中的数据响应限制，即使你使用了 `set` 或数组原型方法：

```js
import { reactive, watchSyncEffect, set } from '@mpxjs/core'

const state = reactive([0, 1, 2, 3])

watchSyncEffect(() => {
  console.log(JSON.stringify(state)) // [0,1,2,3]
})

set(state, 1, 3) // 不会触发 watchEffect

state.push(4) // 不会触发 watchEffect
```

对于对象和在模板中使用也是同理：

```html
<template>
  <view bindtap="addCount2">
    <view>{{state.count}}</view>
    <view>{{state.count2}}</view>
  </view>

</template>

<script>
  import { createComponent, reactive, set } from '@mpxjs/core'
  
  createComponent({
    setup () {
      const state = reactive({
        count: 0
      })

      const addCount2 = () => {
        set(state, 'count2', 10) // 不会触发视图更新
      }

      return {
        state,
        addCount2
      }
    }
  })
</script>
```

为什么会产生这个现象呢？原因在于：基于 `Object.defineProperty` 实现的数据响应系统中，我们会对对象的每个已有属性创建了一个 `Dep` 对象，在对该属性进行 `get` 访问时通过这个对象将其与依赖它的观察者 `ReactiveEffect` 关联起来，并在 `set` 操作时触发关联 `ReactiveEffect` 的更新，这是我们大家都知道的数据响应的基本原理。但是对于新增/删除对象属性和修改数组的场景，我们无法事先定义当前不存在属性的 `get/set` (当然这在 `proxy` 当中是可行的)，因此我们会把对象或者数组本身作为一个数据依赖创建 `Dep` 对象，**通过父级访问**该数据时定义的 `get/set` 将其关联到对应的 `ReactiveEffect`，并在对数据进行新增/删除属性或数组操作时通过数据本身持有的 `Dep` 对象触发关联 `ReactiveEffect` 的更新，如下图所示：

![数据响应原理](https://gift-static.hongyibo.com.cn/static/kfpub/3547/ReactiveEffect.png)

需要注意的是，**通过父级访问**是建立 `Dep` 与 `ReactiveEffect` 关联关系的先决条件，在选项式 API 中，我们访问组件的响应式数据都需要通过 `this` 进行访问，相当于这些数据都存在 `this` 这个必要的**父级**，因此我们在使用 `$set/$delete` 进行对对象进行新增/删除属性或对数组进行修改时都能得到符合预期的结果，唯一的限制在于不能新增/删除根级数据属性，原因就在于 `this` 不存在访问它的父级。

但是在组合式 API 中，我们不需要通过 `this` 访问响应式数据，因此通过 `reactive()` 创建的响应式数据本身就是根级数据，我们自然无法通过上述方式感知到根级数据自身的变化（在 Vue3 中，基于 `proxy` 提供的强大能力响应式系统能够精确地感知到数据属性，甚至是当前不存在属性的访问与修改，不需要为数据自身建立 `Dep` 对象，自然也不存在相关问题）。

在这种情况下，我们就需要用 `ref()` 创建响应式数据，因为 `ref` 创建了一个包装对象，我们永远需要通过 `.value` 来访问其持有的数据（不管是显式访问还是隐式自动解包），这样就能保证 `ref` 数据自身的变化能够被响应式系统感知，因此也不会遇到上面描述的问题。
