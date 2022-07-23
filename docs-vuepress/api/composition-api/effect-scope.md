# Effect 作用域 API

## effectScope
创建一个 effect 作用域对象，捕获在其内部创建的响应性副作用(例如计算属性或监听器)，可以对这些副作用进行批量处理

**类型声明：**
```ts
function effectScope(detached?: boolean): EffectScope

interface EffectScope {
    run<T>(fn: () => T): T | undefined
    stop(): void
}
```
**示例：**
```js
import { effectScope } from '@mpxjs/core'

const scope = effectScope()
scope.run(() => {
    const doubled = computed(() => counter.value * 2)
    
    watch(doubled, () => console.log(doubled.value))
    
    watchEffect(() => console.log('Count: ', doubled.value))
})

scope.stope()
```

## getCurrentScope
返回当前活跃的 effect 作用域。

**类型声明：**
```ts
function getCurrentScope(): EffectScope | undefined
```

## onScopeDispose
在当前活跃的 effect 作用域上注册一个处理回调。该回调会在相关的 effect 作用域结束之后被调用。

**类型声明：**

```ts
function onScopeDispose(fn: () => void): void
```
