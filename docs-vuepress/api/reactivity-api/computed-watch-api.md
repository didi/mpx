# Computed 与 Watch

## computed

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
**类型声明：**
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

## watchEffect

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

**类型声明：**
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

## watchSyncEffect
watchEffect 的别名，带有 flush: 'sync' 选项。

## watchPostEffect
watchEffect 的别名，带有 flush: 'post' 选项。

## watch
该 API 与选项式 API 中的 watch 基本等效，watch 需要侦听特定的数据源，并在单独的回调函数中执行副作用。默认情况下
是惰性的——即回调仅在侦听源发生变化时被调用。

与 watchEffect 比较，watch 允许我们：
* 懒执行副作用；
* 更具体地说明什么状态应该触发侦听器重新运行；
* 访问侦听状态变化前后的值。

**类型声明：**

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

### 侦听单一源
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

### 侦听多个源

还可以使用数组的形式同时侦听多个数据源：
```js
import { watch } from '@mpxjs/core'

watch([aRef, bRef], ([a, b], [prevA, prevB]) => {
    /* ... */
})
```

### 与 watchEffect 相同的行为

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

### watch 选项
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
