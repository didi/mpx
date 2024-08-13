---
sidebarDepth: 2
---

# 响应式 API

## 响应式基础 API

### reactive
将对象处理为响应性对象。
```js
const obj = reactive({ count: 0 })
obj.count++
```
响应式转换是“深层”的：它会影响到所有嵌套的 property。一个响应式对象也将深层地解包任何 ref property，同时保持响应性。

```js
const count = ref(1)
const obj = reactive({ count })

// ref 会被解包
console.log(obj.count === count.value) // true

// 它会更新 `obj.count`
count.value++
console.log(count.value) // 2
console.log(obj.count) // 2
```

当将 `ref` 分配给 `reactive` property 时，ref 将被自动解包。

```ts
const count = ref(1)
const obj = reactive({})

obj.count = count

console.log(obj.count) // 1
console.log(obj.count === count.value) // true
```

当访问到某个响应式数组或 Map 这样的原生集合类型中的 ref 元素时，不会执行 ref 的解包

```js
const refArr = ref([ref(2)])
const state = reactive({
    count: 1,
    refArr
})

// 无需.vlaue
console.log(state.refArr)
// 这里需要.value
console.log(state.refArr[0].value)
```
当需要给响应式对象新增属性时，需要使用set，并且新增属性的响应式对象需要为 ref 或者做为其他响应性对象的key

```js
const state = reactive({
    count: 1
})
const stateRef = ref({
    count: 1
})
const stateRefWrap = reactive({
    data: {
        count: 1
    }
})

onLoad(() => {
    setTimeout(() => {
        set(state, 'foo', 1) // 不生效
        set(stateRef.value, 'foo', 1) // 生效
        set(stateRefWrap.data, 'foo', 1) // 生效
    }, 2000)
})

return {
    state,
    stateRef,
    stateRefWrap
}
```

### isReactive
检查对象是否是由 reactive 创建的响应式对象。

```js
import { createComponent, reactive, isReactive } from '@mpxjs/core'

createComponent({
    setup(){
        const state = reactive({
            count: 1
        })
        console.log(isReactive(state)) // -> true
        return {
            state
        }
    }
})
```

### markRaw
标记一个对象，使其永远不会被抓换为响应性对象，并返回对象本身

```js
import { markRaw, reactive, isReactive } from '@mpxjs/core'

const foo = markRaw({
    count: 1
})
const state = reactive({
    foo
})
console.log(isReactive(state.foo)) // -> false
```
**注意：**

如果将标记对象内部的未标记对象添加进响应性对象，然后再次访问该响应性对象，就会得到该原始对象的可响应性对象
```js
import { markRaw, reactive, isReactive } from '@mpxjs/core'

const foo = markRaw({
    nested: {}
})

const bar = reactive({
    nested: foo.nested
})

console.log(foo.nested === bar.nested) // -> true
```

### shallowReactive
reactive() 的浅层作用形式，只跟踪自身 property 的响应性，但不执行嵌套对象的深层响应式转换(返回原始值)

**注意：**

和 reactive() 不同，这里没有深层级的转换：一个浅层响应式对象里只有根级别的 property 是响应式的。property 的值会被原样存储和暴露，这也意味着值为 ref 的 property 不会被自动解包了。

```js
import { shallowReactive } from '@mpxjs/core'

const count = ref(0)
const state = shallowReactive({
  foo: 1,
  nested: {
    bar: 2
  },
  head: count  
})

// 更改状态自身的属性是响应式的
state.foo++

// ...但下层嵌套对象不会被转为响应式
isReactive(state.nested) // false

// 不是响应式的
state.nested.bar++

// ref 属性不会解包
state.head.value 
```

### set
用于对一个响应式对象新增属性，会`触发订阅者更新操作`

```ts
function set(target: Object | Array, property: string | number, value: any): void
```

```js
import { set, reactive } from '@mpxjs/core'
const person = reactive({name: 1})
// 具名导出使用
set(person, 'age', 17) // age 改变后会触发订阅者视图更新
```

### del
用于对一个响应式对象删除属性，会`触发订阅者更新操作`

```ts
function del(target: Object | Array, property: string | number): void
```

```js
import {del, reactive } from '@mpxjs/core'
const person = reactive({name: 1})
del(person, 'age')
```


## Computed 与 Watch

### computed

```ts
// 只读形式
function computed<T>(
    getter: () => T
): Readonly<Ref<Readonly<T>>>

// 可写形式
function computed<T>(
    options: {
        get: () => T
        set: (value: T) => void
    }
): Ref<T>
```

接受一个 getter 函数，并根据 getter 的返回值返回一个不可变的响应式 ref 对象。
```js
const count = ref(1)
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 2

plusOne.value++ // 错误
```

或者接受一个具有 get 和 set 函数的对象，用来创建可写的 ref 对象。
```js
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

### watchEffect

```ts
function watchEffect(
  effect: (onInvalidate: InvalidateCbRegistrator) => void,
  options?: WatchEffectOptions
): StopHandle

interface WatchEffectOptions {
    flush?: 'pre' | 'post' | 'sync' // 默认：'pre'
}

type InvalidateCbRegistrator = (invalidate: () => void) => void

type StopHandle = () => void
```

立即执行传入的函数，同时对其依赖进行响应式追踪，并在其依赖变更时重新运行该函数。
```js
const count = ref(0)

watchEffect(() => console.log(count.value))
// -> logs 0

setTimeout(() => {
  count.value++
  // -> logs 1
}, 100)
```
* 停止侦听

```js
const stop = watchEffect(() => {
  /* ... */
})

// later
stop()
```
* 清除副作用

侦听副作用传入的函数可以接收一个函数作入参，用来注册清理回调，清理回调会在该副作用下一次执行前被调用，
可以用来清理无效的副作用，例如等待中的异步请求
```js
watchEffect(async (onCleanup) => {
  const { response, cancel } = doAsyncWork(id.value)
  // `cancel` 会在 `id` 更改时调用
  // 以便取消之前未完成的请求
  onCleanup(cancel)
  data.value = await response
})
```
* 副作用刷新时机

响应式系统会进行副作用函数缓存，并异步地刷新执行他们

组件的 update 函数也是一个被侦听的副作用。当一个用户定义的副作用函数进入队列时，默认情况下，会在所有的组件 update 前执行，
在watchEffect的第二个参数中，我们可以传入flush来进行副作用刷新时机调整

```js
// 默认为 pre
watchEffect(callback, {
    flush: 'pre'
})

// 侦听器回调中能访问被更新之后的DOM
// 注意：这也将推迟副作用的初始运行，直到组件的首次渲染完成。
watchEffect(callback, {
  flush: 'post'
})

// 强制同步触发, 十分低效
watchEffect(callback, {
    flush: 'sync'
})
```

### watchSyncEffect
watchEffect 的别名，带有 flush: 'sync' 选项。

### watchPostEffect
watchEffect 的别名，带有 flush: 'post' 选项。

### watch

```ts
// 侦听单一源
function watch<T>(
    source: WatcherSource<T>,
    callback: (
        value: T,
        oldValue: T,
        onInvalidate: InvalidateCbRegistrator
    ) => void,
    options?: WatchOptions
): StopHandle

// 侦听多个源

type WatcherSource<T> = Ref<T> | (() => T)

type InvalidateCbRegistrator = (invalidate: () => void) => void

type StopHandle = () => void

interface WatchOptions extends WatchEffectOptions {
    immediate?: boolean // 默认：false
    deep?: boolean // 默认：false
    immediateAsync: boolean // 默认：false
}
```

该 API 与选项式 API 中的 watch 基本等效，watch 需要侦听特定的数据源，并在单独的回调函数中执行副作用。默认情况下
是惰性的——即回调仅在侦听源发生变化时被调用。

与 watchEffect 比较，watch 允许我们：
* 懒执行副作用；
* 更具体地说明什么状态应该触发侦听器重新运行；
* 访问侦听状态变化前后的值。


#### 侦听单一源
watch 可以侦听一个具有返回值的 getter，也可以直接是一个 ref
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

#### 侦听多个源

还可以使用数组的形式同时侦听多个数据源：
```js
import { watch } from '@mpxjs/core'

watch([aRef, bRef], ([a, b], [prevA, prevB]) => {
    /* ... */
})
```

#### 与 watchEffect 相同的行为

**watch** 与 **watchEffect** 在手动停止侦听、清除副作用、副作用刷新时机方面有相同的行为。

```js
import { watch } from '@mpxjs/core'

let unwatch = watch(() => {
  return a.value + b.value
}, (newVal, oldVal) => {
  // 做点什么
})

// 调用返回值unwatch可以取消观察
unwatch()
```

#### watch 选项
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

## Effect 作用域 API

### effectScope

```ts
function effectScope(detached?: boolean): EffectScope

interface EffectScope {
    run<T>(fn: () => T): T | undefined
    stop(): void
    pause(): void
    resume(): void
}
```

创建一个 effect 作用域对象，捕获在其内部创建的响应性副作用(例如计算属性或监听器)，可以对这些副作用进行批量处理

```js
import { effectScope } from '@mpxjs/core'

const scope = effectScope()
scope.run(() => {
    const doubled = computed(() => counter.value * 2)
    
    watch(doubled, () => console.log(doubled.value))
    
    watchEffect(() => console.log('Count: ', doubled.value))
})

scope.stop()
```

需要注意的是，effectScope 接受一个 detached 参数，默认为false，该参数来表示当前作用域是否和父级作用域进行分离，若 detached 为 true，
当前 effectScope 则不会被父级作用域收集。

* 暂停侦听

Mpx 提供了 pause 方法可以将整个作用域中的响应性副作用批量暂停侦听。

```js
import { effectScope, onHide } from '@mpxjs/core'
const scope = effectScope()
scope.run(() => {
    const doubled = computed(() => counter.value * 2)

    watch(doubled, () => console.log(doubled.value))

    watchEffect(() => console.log('Count: ', doubled.value))
})

onHide(() => {
    scope.pause()
})
```

* 恢复侦听

被暂停的作用域可以使用 resume 方法来恢复侦听。

```js
import {onShow} from '@mpxjs/core'
// ......

onShow(() => {
    scope.resume()
})
```

### getCurrentScope

```ts
function getCurrentScope(): EffectScope | undefined
```

返回当前活跃的 effect 作用域。

### onScopeDispose

```ts
function onScopeDispose(fn: () => void): void
```

在当前活跃的 effect 作用域上注册一个处理回调。该回调会在相关的 effect 作用域结束之后被调用。

## Refs

### ref

```ts
interface Ref<T> {
    value: T
}
function ref<T>(value: T): Ref<T>
```

接受一个内部值，返回一个响应式的、可更改的 ref 对象，此对象只有一个指向其内部值的 property .value。

```js
const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1
```

**注意事项：**

1.所有对 .value 的操作都将被追踪，并且写操作会触发与之相关的副作用。

2.如果将一个对象赋值给 ref，那么这个对象将被 reactive 转为具有深层次响应式的对象。这也意味着如果对象中包含了嵌套的 ref，它们将被深层地解包。
```js
import { ref } from '@mpxjs/core'
const foo = ref(0)
const state = ref({
    count: 1,
    foo
})
// 获取count
console.log(state.value.count)
// 获取foo
console.log(state.value.foo)
```

### unref

如果参数是一个 ref，则返回内部值，否则返回参数本身，是 `val = isRef(ref) ? ref.value : ref` 的语法糖函数。

```js
import { ref, unref } from '@mpxjs/core'
const count = ref(0)
const foo = unref(count)

console.log(foo === 0) // -> true
```
### toRef
用于为响应式对象上的property 创建 ref。创建的 ref 与其源 property 保持同步：改变源 property
将更新 ref，改变 ref 也将更新 property。

```js
const state = reactive({
    f: 1,
    b: 2
})

const stateRef = ref({
    black: 1,
    white: 2
})

const fooRef = toRef(state, 'f')
const blackRef = toRef(stateRef.value, 'black') 

// 更改ref的值更新属性
fooRef.value++
blackRef.value++
console.log(state.f) // 2
console.log(stateRef.value.black) // 2

// 更改property的值更新ref
state.f++
stateRef.value.black++
console.log(fooRef.value) // 3
console.log(blackRef.value) // 3
```
**注意：**

即使源 property 当前不存在，toRef() 也会返回一个可用的 ref，而 toRefs 则不会，这在处理可选properties的时候
非常有用

### toRefs
将一个响应式对象转换为一个普通对象，这个普通对象的每个 property 都是指向源对象相应 property 的 ref。每个单独的 ref 都是 `toRef` 创建的

```js
const state = reactive({
    black: 1,
    white: 2
})

const stateAsRefs = toRefs(state)

state.black++
console.log(stateAsRefs.black.value) // 2

stateAsRefs.black.value++
console.log(state.black) // 3
```
toRefs 在使用组合式函数中的响应式对象时有很大作用，使用它，对响应式对象进行解构将不会失去响应性

```js
function useFeatX() {
    const state = reactive({
        black: 1,
        white: 2
    })
    
    // 在返回时都转为 ref
    return toRefs(state)
}

// 解构而不会失去响应性
const {black, white} = useFeatX()
```
**注意：**
* toRefs 在调用时只会为源对象上可以列举出的 property 创建 ref。如果要为可能还不存在的 property
  创建 ref，请改用 `toRef`

### isRef

检查某个值是否为 ref，返回true/false。

### customRef

```ts
function customRef<T>(factory: CustomRefFactory<T>): Ref<T>

type CustomRefFactory<T> = (
    track: () => void,
    trigger: () => void
) => {
    get: () => T,
    set: (value: T) => void
}
```

创建一个自定义 ref，可对其进行依赖项跟踪和更新触发显示控制。需要一个工厂函数，该函数接收 `track` 和 `trigger`
做为参数，并且应该返回一个带有 `get` 和 `set` 的对象。

同时，`track()` 应该在 get() 方法中调用，`trigger()` 应该在 `set()` 中调用。不过这里具体何时调用、
是否调用都将由用户自己来控制


示例：创建一个防抖 ref，即只在最近一次 set 调用后的一段固定间隔后再调用：
```js
function useDebouncedRef(value, delay = 200) {
  let timeout
  return customRef((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      }
    }
  })
}

// text 的每次改变都只在最近一次set后的200ms后调用
const text = useDebouncedRef('hello')
```

### shallowRef
`ref()` 的浅层作用形式，创建一个仅跟踪自身 `.value` 变化的 ref，其他值不做任何处理都为非响应式

```js
const state = shallowRef({
    count: 1
})

// 不会触发更改
state.value.count++

// 会触发更改
state.value = {
    black: 1
}
```
**注意：**
shallowRef 的内部值将会被原样存储和暴露，不会被深层递归转为响应性， 只有对 `.value` 的访问是响应式的

常常用于对大型数据结构的性能优化或是与外部的状态管理系统集成。

### triggerRef
强制触发依赖于一个浅层 `ref` 的副作用，这通常在对浅引用的内部值进行深度变更后使用。

```js
const shallow = shallowRef({
  greet: 'Hello, world'
})

// 触发该副作用第一次应该会打印 "Hello, world"
watchEffect(() => {
  console.log(shallow.value.greet)
})

// 这次变更不应触发副作用，因为这个 ref 是浅层的
shallow.value.greet = 'Hello, universe'

// 手动执行该 shallowRef 关联的副作用，打印 "Hello, universe"
triggerRef(shallow)

```
