# Refs

## ref

接受一个内部值，返回一个响应式的、可更改的 ref 对象，此对象只有一个指向其内部值的 property .value。

**示例：**

```js
const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1
```

**类型声明：**
```ts
interface Ref<T> {
    value: T
}
function ref<T>(value: T): Ref<T>
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

## unref

如果参数是一个 ref，则返回内部值，否则返回参数本身，是 `val = isRef(ref) ? ref.value : ref` 的语法糖函数。

**示例：**
```js
import { ref, unref } from '@mpxjs/core'
const count = ref(0)
const foo = unref(count)

console.log(foo === 0) // -> true
```
## toRef
用于为响应式对象上的property 创建 ref。创建的 ref 与其源 property 保持同步：改变源 property 
将更新 ref，改变 ref 也将更新 property。

**示例：**
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

## toRefs
将一个响应式对象转换为一个普通对象，这个普通对象的每个 property 都是指向源对象相应 property 的 ref。每个单独的 ref 都是 `toRef` 创建的

**示例：**
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

## isRef

检查某个值是否为 ref，返回true/false。

## customRef
创建一个自定义 ref，可对其进行依赖项跟踪和更新触发显示控制。需要一个工厂函数，该函数接收 `track` 和 `trigger`
做为参数，并且应该返回一个带有 `get` 和 `set` 的对象。

同时，`track()` 应该在 get() 方法中调用，`trigger()` 应该在 `set()` 中调用。不过这里具体何时调用、
是否调用都将由用户自己来控制

**示例：**
创建一个防抖 ref，即只在最近一次 set 调用后的一段固定间隔后再调用：

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
**类型声明：**
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

## shallowRef
`ref()` 的浅层作用形式，创建一个仅跟踪自身 `.value` 变化的 ref，其他值不做任何处理都为非响应式

**示例：**
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

## triggerRef
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


