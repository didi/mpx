# Setup

## 参数

使用 `setup` 函数时，它将接收两个参数：

1. `props`
2. `context`

让我们更深入地研究如何使用每个参数。

### Props

`setup` 函数中的第一个参数是 `props`。正如在一个标准小程序组件中所期望的那样，`setup` 函数中的 `props` 是响应式的，当传入新的 prop 时，它将被更新。

```js
// List.mpx
import {createComponent} from '@mpxjs/core'
createComponent({
  properties: {
      min: {
          type: Number,
          value: 0
      },
  },
  setup(props) {
    console.log(props.min)
  }
})
```

:::warning
因为 `props` 是响应式对象，你**不能使用 ES6 解构**，它会消除 prop 的响应性。
:::

如果需要解构 prop，可以在 `setup` 函数中使用 `toRefs` 函数来完成此操作：

```js
// List.mpx
import {createComponent} from '@mpxjs/core'
createComponent({
    properties: {
        min: {
            type: Number,
            value: 0
        },
    },
    setup(props) {
        const { min } = toRefs(props)
        console.log(min.value)
    }
})
```

### Context

传递给 `setup` 函数的第二个参数是 `context`。`context` 是一个普通 JavaScript 对象，暴露了其它可能在 `setup` 中有用的值：

```js
// List.mpx
import {createComponent} from '@mpxjs/core'
createComponent({
    setup(props, context) {
        console.log(context.triggerEvent)
        console.log(context.refs)
        console.log(context.nextTick)
        console.log(context.forceUpdate)
        console.log(context.selectComponent)
        console.log(context.selectAllComponents)
        console.log(context.createSelectorQuery)
        console.log(context.createIntersectionObserver)
    }
})
```

`context` 是一个普通的 JavaScript 对象，也就是说，它不是响应式的，这意味着你可以安全地对 `context` 使用 ES6 解构。

```js
import {createComponent} from '@mpxjs/core'
createComponent({
    setup(props, {forceUpdate, nextTick}) {
        ...
    }
})
```

因此，你**将无法访问**以下组件选项：

- `data`
- `computed`
- `methods`
- `watch`

## 结合模板使用

如果 `setup` 返回一个对象，那么该对象的 property 以及传递给 `setup` 的 `props` 参数中的 property 就都可以在模板中访问到：

```html
// List.mpx
<template>
    <view>{{count}}</view>
    <view>{{min}}</view>
</template>
<script>
    import {createComponent} from '@mpxjs/core'
    createComponent({
        properties: {
            min: {
                type: Number,
                value: 0
            },
        },
        setup(props) {
            const { min } = toRefs(props)
            console.log(min.value)
            const count = ref(0)
            return {
                count
            }
        }
    })
</script>
```

注意，从 `setup` 返回的 `refs` 在模板中访问时是被自动浅解包的，因此不应在模板中使用 `.value`。

## 使用 `this`

**在 `setup()` 内部，`this` 不是该活跃实例的引用**，因为 `setup()` 是在解析其它组件选项之前被调用的，所以 `setup()` 内部的 `this` 的行为与其它选项中的 `this` 完全不同。。

