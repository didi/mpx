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
## watch
该 API 与选项式 API 中的 watch 基本等效

## watchEffect

## watchSyncEffect

## watchPostEffect
