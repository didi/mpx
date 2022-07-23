# 响应式基础 API

## reactive
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

## isReactive
检查对象是否是由 reactive 创建的响应式对象。

**示例：**
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
## markRaw
标记一个对象，使其永远不会被抓换为响应性对象，并返回对象本身

**示例：**

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

## shallowReactive
reactive() 的浅层作用形式，只跟踪自身 property 的响应性，但不执行嵌套对象的深层响应式转换(返回原始值)

**注意：**

和 reactive() 不同，这里没有深层级的转换：一个浅层响应式对象里只有根级别的 property 是响应式的。property 的值会被原样存储和暴露，这也意味着值为 ref 的 property 不会被自动解包了。

**示例：**

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
