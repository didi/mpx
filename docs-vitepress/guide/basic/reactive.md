# 数据响应 {#reactivity}

Mpx 的核心特性之一是其非侵入性的响应式系统。数据模型仅仅是普通的 JavaScript 对象。而当你修改它们时，视图会进行更新。这使得状态管理非常简单直接。

Mpx 参考了 Vue 2 的设计，在内部实现了一套精简高效的数据响应系统。

## 响应式原理 {#reactivity-principle}

当你把一个普通的 JavaScript 对象传入 Mpx 实例作为 `data` 选项，Mpx 将遍历此对象所有的属性，并使用 [Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 把这些属性全部转为 getter/setter。

这些 getter/setter 对用户来说是不可见的，但是在内部它们让 Mpx 追踪依赖，在属性被访问和修改时通知变更。

每个组件实例都对应一个 **watcher** 实例，它会在组件渲染的过程中把“接触”过的数据属性记录为依赖。之后当依赖项的 setter 触发时，会通知 watcher，从而使它关联的组件重新渲染。

## data

- **类型**：`Object | Function`

`data` 选项用于声明组件的初始响应式数据。

### 数据对象与函数 {#data-object-and-function}

`data` 可以是一个普通 JavaScript 对象，也可以是一个返回对象的函数。

```js
createComponent({
  // 方式一：使用对象
  data: {
    message: 'Hello'
  }
})

createComponent({
  // 方式二：使用函数
  data() {
    return {
      message: 'Hello'
    }
  }
})
```

### 响应式代理 {#reactive-proxy}

Mpx 会递归地将 `data` 的 property 转换为 getter/setter，从而让 `data` 的 property 能够响应数据变化。对象必须是纯粹的对象 (含有零个或多个的 key/value 对)。

实例创建之后，可以通过 `this.key` 直接访问 `data` 中的数据，也可以通过 `this.key = value` 修改数据。

```js
createComponent({
  data: {
    a: 1
  },
  ready() {
    console.log(this.a) // 1
    this.a = 2
    console.log(this.a) // 2
  }
})
```

> **注意**：
> 只有当实例被创建时就已经存在于 `data` 中的 property 才是**响应式**的。也就是说，如果你在 `data` 中没有声明 `b`，然后通过 `this.b = 'hi'` 来添加它，那么对 `b` 的改动将不会触发任何视图更新。

## properties

`properties` 选项用于定义组件的对外属性，与微信小程序原生组件的 `properties` 定义类似。

与 `data` 类似，Mpx 也会对 `properties` 进行响应式处理，将其代理到组件实例上。这意味着你可以直接通过 `this.propertyName` 访问这些属性，它们同样遵循响应式规则，可以作为计算属性的依赖或被侦听器监听。

```js
createComponent({
  properties: {
    title: {
      type: String,
      value: 'Default Title'
    }
  },
  computed: {
    upperTitle() {
      return this.title.toUpperCase()
    }
  },
  watch: {
    title(newVal, oldVal) {
      console.log('Title changed:', newVal)
    }
  },
  ready() {
    // 与访问 data 数据一样，可以直接通过 this 访问 properties
    console.log(this.title)
  }
})
```

## 计算属性 (Computed) {#computed}

对于任何复杂逻辑，你都应当使用**计算属性**。计算属性是基于它们的响应式依赖进行缓存的。只在相关响应式依赖发生改变时它们才会重新求值。这就意味着只要 `message` 还没有发生改变，多次访问 `reversedMessage` 计算属性会立即返回之前的计算结果，而不必再次执行函数。

### 基础用法 {#computed-basic-usage}

最常见的用法是提供一个 getter 函数：

```js
createComponent({
  data: {
    message: 'Hello'
  },
  computed: {
    // 计算属性的 getter
    reversedMessage: function () {
      // `this` 指向组件实例
      return this.message.split('').reverse().join('')
    }
  }
})
```

### Computed Setter {#computed-setter}

计算属性默认只有 getter，不过在需要时你也可以提供一个 setter：

```js
createComponent({
  data: {
    firstName: 'Foo',
    lastName: 'Bar'
  },
  computed: {
    fullName: {
      // getter
      get() {
        return this.firstName + ' ' + this.lastName
      },
      // setter
      set(newValue) {
        var names = newValue.split(' ')
        this.firstName = names[0]
        this.lastName = names[names.length - 1]
      }
    }
  }
})
// 运行 this.fullName = 'John Doe' 时，setter 会被调用，
// this.firstName 和 this.lastName 也会相应地被更新。
```

## 侦听器 (Watch) {#watch}

虽然计算属性在大多数情况下更合适，但有时也需要一个自定义的侦听器。这就是为什么 Mpx 通过 `watch` 选项提供了一个更通用的方法，来响应数据的变化。当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的。

### 基础用法 {#watch-basic-usage}

```js
createComponent({
  data: {
    question: '',
  },
  watch: {
    // 只要 question 发生改变，这个函数就会执行
    question(newQuestion, oldQuestion) {
      console.log('new question is: ' + newQuestion)
    }
  }
})
```

### 侦听器选项 {#watch-options}

除了直接传入回调函数外，`watch` 还支持对象格式，提供更丰富的选项控制。

#### immediate

如果需要在侦听器创建时立即触发回调，可以设置 `immediate: true`。

```js
watch: {
  question: {
    handler(newQuestion, oldQuestion) {
      console.log('new question is: ' + newQuestion)
    },
    immediate: true
  }
}
```

#### deep

默认情况下，侦听器只监听数据本身的引用变化。如果需要监听对象内部值的变化（嵌套监听），需要设置 `deep: true`。

```js
createComponent({
  data: {
    user: {
      name: 'John',
      age: 20
    }
  },
  watch: {
    user: {
      handler(val) {
        console.log('user changed')
      },
      deep: true
    }
  }
})
```

> **注意**：`deep` 选项会递归遍历所有嵌套属性，开销较大，请按需使用。

#### flush

`flush` 选项用于控制回调的触发时机。

- `'post'` (默认): 在视图更新之后触发。
- `'sync'`: 同步触发，在数据变化时立即执行。
- `'pre'`: 在视图更新之前触发。

```js
watch: {
  count: {
    handler(val) {
      console.log('count changed')
    },
    flush: 'sync'
  }
}
```

### 监听多路径 {#watch-multi-path}

Mpx 支持在 watch 的 key 中使用逗号分隔的字符串来同时监听多个数据源。当其中任意一个数据源发生变化时，回调函数都会被执行。

此外，你也可以监听嵌套路径，或者传入一个数组来同时执行多个回调：

```js
watch: {
  // 监听多个数据源
  'a, b': function (val, oldVal) {
    console.log('a or b changed')
  },
  // 监听嵌套路径
  'user.name': function (val) {
    console.log('user.name changed')
  },
  // 多个回调
  count: [
    'methodName', // 方法名
    function (val) {
      console.log('callback 2')
    }
  ]
}
```

### 实例方法 $watch {#instance-method-watch}

除了在组件选项中定义 `watch`，你还可以使用组件实例方法 `this.$watch` 动态创建一个侦听器：

```js
// 键路径
this.$watch('a.b.c', function (newVal, oldVal) {
  // 做点什么
})

// 函数
this.$watch(
  function () {
    return this.a + this.b
  },
  function (newVal, oldVal) {
    // 做点什么
  }
)
```

`$watch` 返回一个取消观察函数，用来停止触发回调：

```js
var unwatch = this.$watch('a', cb)
// 之后取消观察
unwatch()
```

## 异步更新队列 {#async-update-queue}

可能你还没有注意到，Mpx 在更新视图时是**异步**的。只要侦听到数据变化，Mpx 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和视图更新是非常重要的。然后，在下一个的事件循环“tick”中，Mpx 刷新队列并执行实际 (已去重的) 工作。

例如，当你设置 `vm.someData = 'new value'`，该组件不会立即重新渲染。当刷新队列时，组件会在下一个事件循环“tick”中更新。如果你想基于更新后的 DOM 状态来做点什么，这就可能会有些棘手。为了在数据变化之后等待 Mpx 完成更新，可以在数据变化之后立即使用 `this.$nextTick(callback)`。这样回调函数将在更新完成后被调用。

```js
createComponent({
  methods: {
    updateMessage () {
      this.message = '已更新'
      // 此时视图尚未更新
      this.$nextTick(function () {
        // 此时视图已更新
        console.log('视图已更新')
      })
    }
  }
})
```

## 检测变化的注意事项 {#change-detection-caveats}

由于 JavaScript 的限制，Mpx **不能检测**数组和对象的变化。尽管如此，我们还是有一些办法来回避这些限制并保证它们的响应性。

### 对象 {#objects}

Mpx 无法检测 property 的添加或移除。由于 Mpx 会在初始化实例时对 property 执行 getter/setter 转化，所以 property 必须在 `data` 对象上存在才能让 Mpx 将它转换为响应式的。

```js
createComponent({
  data: {
    a: 1
  },
  ready() {
    // `this.a` 是响应式的
    this.a = 2
    // `this.b` 是非响应式的
    this.b = 2
  }
})
```

对于已经创建的实例，Mpx 不允许动态添加根级别的响应式 property。但是，可以使用 `this.$set(object, propertyName, value)` 方法向嵌套对象添加响应式 property。

```js
// this.$set(object, key, value)
this.$set(this.someObject, 'b', 2)
```

您还可以使用 `this.$delete(object, propertyName)` 方法来删除对象的 property，如果对象是响应式的，确保删除能触发更新视图。

```js
// this.$delete(object, key)
this.$delete(this.someObject, 'b')
```

### 数组 {#arrays}

Mpx 不能检测以下数组的变动：

1. 当你利用索引直接设置一个 array item 时，例如：`vm.items[indexOfItem] = newValue`
2. 当你修改数组的长度时，例如：`vm.items.length = newLength`

为了解决第一类问题，你可以使用：

```js
// Mpx.set
this.$set(this.items, indexOfItem, newValue)
// Array.prototype.splice
this.items.splice(indexOfItem, 1, newValue)
```

为了解决第二类问题，你可以使用 `splice`：

```js
this.items.splice(newLength)
```

## 示例 {#example}

下面是一个相对完整的数据响应示例：

```html
<template>
  <view>
    <view>Num: {{num}}</view>
    <view>Minus num: {{mnum}}</view>
    <view>Num plus: {{nump}}</view>
    <view>{{info.name}}</view>
    <view wx:if="{{info.age}}">{{info.age}}</view>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    // data中定义的数据会在初始化时进行数据响应处理
    data: {
      num: 1,
      info: {
        name: 'test'
      }
    },
    // 配置中直接定义watch
    watch: {
      num (val) {
        console.log(val)
      }
    },
    // 定义计算属性，模板中可以直接访问
    computed: {
      mnum () {
        return -this.num
      },
      nump: {
        get () {
          return this.num + 1
        },
        // 支持计算属性的setter
        set (val) {
          this.num = val - 1
        }
      }
    },
    ready () {
      // 使用实例方法定义watch，可以传递追踪函数更加灵活
      this.$watch(() => {
        return this.nump - this.mnum
      }, (val) => {
        console.log(val)
      })
      // 每隔一秒进行一次更新，相关watcher会被触发，视图也会发生更新
      setInterval(() => {
        this.num++
      }, 1000)
      // 使用$set新增响应属性，视图同样能够得到更新
      setTimeout(() => {
        this.$set(this.info, 'age', 23)
      }, 1000)
    }
  })
</script>
```
