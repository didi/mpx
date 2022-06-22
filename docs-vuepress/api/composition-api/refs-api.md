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

2.如果将一个对象赋值给 ref，那么这个对象将通过 reactive() 转为具有深层次响应式的对象。这也意味着如果对象中包含了嵌套的 ref，它们将被深层地解包。

## unref

如果参数是一个 ref，则返回内部值，否则返回参数本身，是 `val = isRef(ref) ? ref.value : ref` 的语法糖函数。

**示例：**
```js
function useFoo(x: number | Ref<number>) {
    const unwrapped = unref(x)     // unwrapped 现在保证为 number 类型
}

```

## toRef

## toRefs

## isRef

检查某个值是否为 ref。

## customRef

## shallowRef

## triggerRef


