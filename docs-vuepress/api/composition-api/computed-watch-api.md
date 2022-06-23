# Computed 与 watch

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
## watchEffect
立即执行传入的一个函数，同时响应式追踪其依赖，并在其依赖变更时重新运行该函数。
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

// Mpx中待确认
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

## watch
该 API 与选项式 API 中的 watch 基本等效，watch 需要侦听特定的数据源，并在单独的回调函数中执行副作用。默认情况下
是惰性的。

与 watchEffect 比较，watch 允许我们：
* 懒执行副作用；
* 更具体地说明什么状态应该触发侦听器重新运行；
* 访问侦听状态变化前后的值。

**示例：**
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

## watchSyncEffect
watchEffect 的别名，带有 flush: 'sync' 选项。

## watchPostEffect
watchEffect 的别名，带有 flush: 'post' 选项。
