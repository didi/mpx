# 组合式 API

## 什么是组合式 API
组合式 API 是 Vue3 中包含的最重要的特性之一，主要由 `setup` 函数及一系列响应式 API 及生命周期钩子函数组成，与传统的选项式 API 相比，组合式 API 具备以下优势：

* 更好的逻辑复用，通过函数包装复用逻辑，显式引入调用，方便简洁且符合直觉，规避消除了 mixins 复用中存在的缺陷；
* 更灵活的代码组织，相比于选项式 API 提前规定了代码的组织方式，组合式 API 在这方面几乎没有做任何限制与规定，更加灵活自由，在功能复杂的庞大组件中，我们能够通过组合式 API 让我们的功能代码更加内聚且有条理，不过这也会对开发者自身的代码规范意识提出更高要求；
* 更方便的类型推导，虽然基于 `this` 的选项式 API 通过 `ThisType` 也能在一定程度上实现 TS 类型推导，但推导和实现成本较高，同时仍然无法完美覆盖一些复杂场景（如嵌套 mixins 等）；而组合式 API 以本地变量和函数为基础，本身就是类型友好的，我们在类型方面几乎不需要做什么额外的工作就能享受到完美的类型推导。

同时与 React Hooks 相比，组合式 API 中的 `setup` 函数只在初始化时单次执行，在数据响应能力的加持下大大降低了理解与使用成本，基于以上原因，我们决定为 Mpx 添加组合式 API 能力，让用户能够用组合式 API 方式进行小程序开发。

更多关于组合式 API 的说明可以查看 [Vue3 官方文档](https://vuejs.org/guide/extras/composition-api-faq.html)。

Mpx 是一个小程序优先的增强型跨端框架，因此我们在为 Mpx 设计实现组合式 API 的过程中，并不追求与 Vue3 中的组合式 API 完全一致，我们更多是借鉴 Vue3 中组合式 API 的设计思想，将其与目前 Mpx 及小程序中的开发模式结合起来，而非完全照搬其实现。因此在 Mpx 中一些具体的 API 设计实现会与 Vue3 存在差异，我们会在后续相关的文档中进行标注说明，如果你想查看 Mpx 与 Vue3 在组合式 API 中的差异，可以跳转到[这里](#组合式-API-与-Vue3-中的区别)查看。 

## 组合式 API 基础

### setup 函数

同 Vue3 一样，在 Mpx 当中 `setup` 函数是组合式 API 的基础，我们可以在 `createPage` 和 `createComponent` 中声明 `setup` 函数。

`setup` 函数接收 `props` 和 `context` 两个参数，其中 `context` 参数与 Vue3 中存在差别，详情可以查看[这里](#Setup)。

我们参考 Vue3 中的示例实现一个小程序版本，可以看到它和 Vue3 中的实现基本一致，包含以下功能：

* 仓库列表
* 更新仓库列表的函数
* 返回列表和函数，以便其他组件选项可以对它们进行访问

```js
import { createComponent } from '@mpxjs/core'
import { fetchUserRepositories } from '@/api/repositories'

createComponent({
  properties: {
    user: String
  },
  setup (props) {
    let repositories = []
    const getUserRepositories = async () => {
      repositories = await fetchUserRepositories(props.user)
    }

    return {
      repositories, // 返回的数据，可以在其他选项式 API 中通过 this 访问或在模板上直接访问
      getUserRepositories // 返回的函数，它的行为与将其定义在 methods 选项中的行为相同
    }
  }
})
```
目前 `repositories` 是个非响应式变量，用户层面将无法感知它的变化，仓库列表将始终为空。

### 带 `ref` 的响应式变量

同 Vue3 一致，我们可以通过 `ref` 函数为任意一个变量创建响应式引用，`ref` 接收参数并将其包裹在一个带有 `value` property 的对象中返回，然后可以使用该 property 访问或更改响应式变量的值，简单示例如下：

```js
import { ref } from '@mpxjs/core'

const counter = ref(0)

console.log(counter) // { value: 0 }
console.log(counter.value) // 0

counter.value++
console.log(counter.value) // 1
```

回到我们的示例中，我们通过 `ref` 创建一个响应式的 `repositories` 变量：

```js
import { createComponent, ref } from '@mpxjs/core'
import { fetchUserRepositories } from '@/api/repositories'

createComponent({
  properties: {
    user: String
  },
  setup (props) {
    let repositories = ref([])
    const getUserRepositories = async () => {
      repositories.value = await fetchUserRepositories(props.user)
    }

    return {
      repositories,
      getUserRepositories
    }
  }
})
```

通过 `ref` 包裹以后，我们每次调用 `getUserRepositories` 更新 `repositories` 的值都能被外部的 `watch` 观测到，并且触发视图的更新。

### 在 `setup` 中注册生命周期钩子

为了完整实现选项式 API 中的能力，我们需要支持在 `setup` 中注册生命周期钩子，同 Vue3 类似，我们也提供了一系列生命周期钩子的注册函数，这些函数都以 `on` 开头，不过由于 Mpx 的跨平台特性，我们不可能针对不同的平台提供不同的生命周期钩子函数，因此我们提供了一份抹平跨平台差异后统一的生命周期钩子，与小程序原生生命周期的映射关系可查看[这里](#生命周期钩子)。

我们希望在组件挂载时调用 `getUserRepositories`，可以使用 `onMounted` 钩子来实现，注意这里不是 `onReady`，不过它确实对应于微信小程序中组件的 `ready` 钩子：

```js
import { createComponent, ref, onMounted } from '@mpxjs/core'
import { fetchUserRepositories } from '@/api/repositories'

createComponent({
  properties: {
    user: String
  },
  setup (props) {
    let repositories = ref([])
    const getUserRepositories = async () => {
      repositories.value = await fetchUserRepositories(props.user)
    }
    
    // 在组件挂载时（微信小程序中相当于ready）调用 getUserRepositories
    onMounted(getUserRepositories) 

    return {
      repositories,
      getUserRepositories
    }
  }
})
```

### `watch` 响应式更改

现在我们需要对 `user` prop 的变化做出响应，可以使用新的 `watch` API，该 API 接受 3 个参数：

* 一个想要侦听的响应式引用或 getter 函数
* 一个回调
* 可选的配置选项

简单示例如下：

```js
import { ref, watch } from '@mpxjs/core'

const counter = ref(0)
watch(counter, (newValue, oldValue) => {
  console.log('The new counter value is: ' + counter.value)
})
```

当 `counter` 被修改时，例如 `counter.value = 5`，侦听将触发并执行回调打印 `The new counter value is:5`。

回到我们的示例中，当 `user` prop 发生变化时调用 `getUserRepositories` 更新仓库列表：

```js
import { createComponent, ref, onMounted, watch, toRefs } from '@mpxjs/core'
import { fetchUserRepositories } from '@/api/repositories'

createComponent({
  properties: {
    user: String
  },
  setup (props) {
    // 使用 `toRefs` 创建对 `props` 中的 `user` property 的响应式引用
    const { user } = toRefs(props)
    
    let repositories = ref([])
    const getUserRepositories = async () => {
      // 更新 `prop.user` 到 `user.value` 访问引用值
      repositories.value = await fetchUserRepositories(user.value)
    }
    
    onMounted(getUserRepositories) 
    
    // 在 user prop 的响应式引用上设置一个侦听器
    watch(user, getUserRepositories)

    return {
      repositories,
      getUserRepositories
    }
  }
})
```

你可能已经注意到在我们的 setup 的顶部使用了 toRefs。这是为了确保我们的侦听器能够根据 user prop 的变化做出反应。

### 独立的 `computed` 属性

与 `ref` 和 `watch` 类似，也可以使用从 Mpx 导入的 `computed` 函数创建计算属性，简单示例如下：

```js
import { ref, computed } from '@mpxjs/core'

const counter = ref(0)
const twiceTheCounter = computed(() => counter.value * 2)

counter.value++
console.log(counter.value) // 1
console.log(twiceTheCounter.value) // 2
```

这里我们给 `computed` 函数传递了第一个参数，它是一个类似 getter 的回调函数，输出的是一个只读的响应式引用。为了访问新创建的计算变量的 value，我们需要像 `ref` 一样使用 `.value` property。

回到我们的示例，我们通过 `computed` 为仓库列表实现搜索功能：

```js
import { createComponent, ref, onMounted, watch, toRefs, computed } from '@mpxjs/core'
import { fetchUserRepositories } from '@/api/repositories'

createComponent({
  properties: {
    user: String
  },
  setup (props) {
    const { user } = toRefs(props)
    
    let repositories = ref([])
    const getUserRepositories = async () => {
      repositories.value = await fetchUserRepositories(user.value)
    }
    
    onMounted(getUserRepositories) 
    
    watch(user, getUserRepositories)
    
    const searchQuery = ref('')
    const repositoriesMatchingSearchQuery = computed(() => {
      return repositories.value.filter(
        repository => repository.name.includes(searchQuery.value)
      )
    })

    return {
      repositories,
      getUserRepositories,
      searchQuery,
      repositoriesMatchingSearchQuery
    }
  }
})
```

可以看到目前我们的 `setup` 函数已经相当庞大了，在不进行任何封装的情况下我们很可能在 `setup` 中写出流水账式的代码，可维护性很差，这也是为什么组合式 API 会对开发者的代码风格提出更高的要求，下面我们来拆解目前已经实现的功能，将它们提取到独立的组合函数中，先从创建 `useUserRepositories` 函数开始：

```js
// src/composables/useUserRepositories.js

import { fetchUserRepositories } from '@/api/repositories'
import { ref, onMounted, watch } from '@mpxjs/core'

export default function useUserRepositories(user) {
  const repositories = ref([])
  const getUserRepositories = async () => {
    repositories.value = await fetchUserRepositories(user.value)
  }

  onMounted(getUserRepositories)
  watch(user, getUserRepositories)

  return {
    repositories,
    getUserRepositories
  }
}

```

然后是搜索功能：

```js
// src/composables/useRepositoryNameSearch.js

import { ref, computed } from '@mpxjs/core'

export default function useRepositoryNameSearch(repositories) {
  const searchQuery = ref('')
  const repositoriesMatchingSearchQuery = computed(() => {
    return repositories.value.filter(repository => {
      return repository.name.includes(searchQuery.value)
    })
  })

  return {
    searchQuery,
    repositoriesMatchingSearchQuery
  }
}
```

现在我们有了两个单独的功能模块，接下来就可以开始在组件中使用它们了:

```js
import useUserRepositories from '@/composables/useUserRepositories'
import useRepositoryNameSearch from '@/composables/useRepositoryNameSearch'
import { createComponent, toRefs } from '@mpxjs/core'


createComponent({
  properties: {
    user: String
  },
  setup (props) {
    const { user } = toRefs(props)
    
    const { repositories, getUserRepositories } = useUserRepositories(user)
    
    const {
      searchQuery,
      repositoriesMatchingSearchQuery
    } = useRepositoryNameSearch(repositories)

    return {
      // 因为我们并不关心未经过滤的仓库
      // 我们可以在 `repositories` 名称下暴露过滤后的结果
      repositories: repositoriesMatchingSearchQuery,
      getUserRepositories,
      searchQuery,
    }
  }
})
```

现在我们使用组合式 API 完成了仓库列表组件的开发，它看上去相当清晰且易于维护。想要了解更多组合式 API 的信息，请继续查看本页接下来的章节，想要了解新的响应式 API 的使用，请跳转查看[响应式 API](reactive-api.md)章节。

## Setup

`setup` 函数在组件创建时执行，返回组件所需的数据和方法，是组合式 API 的核心。

> 注意，`setup` 函数不可被混入，所有定义在 `mixin` 中的 `setup` 都将被丢弃。

### 参数

`setup` 函数接受两个参数，分别是 `props` 和 `context`。

#### Props

`setup` 函数的第一个参数 `props` 和 Vue3 中完全一致，就是包含当前组件 props 的响应式数据，当父组件更新某个 prop 时，该数据也将被更新。

```js
import { createComponent } from '@mpxjs/core'

createComponent({
  props: {
    title: String
  },
  setup(props) {
    console.log(props.title)
  }
})
```
> Warning: `props` 是响应式的，你不能使用 ES6 解构，它会消除 prop 的响应性。

如果需要解构 prop，可以在 `setup` 函数中使用 `toRefs` 函数将其转换一个包含 ref 数据的纯对象：

```js
import { createComponent, toRefs } from '@mpxjs/core'

createComponent({
  props: {
    title: String
  },
  setup(props) {
    const { title } = toRefs(props)
    // `title` 是一个 ref
    console.log(title.value)
  }
})
```

如果 `title` 是可选的 prop，则传入的 `props` 中可能没有 `title` 。在这种情况下，`toRefs` 将不会为 `title` 创建一个 ref 。你需要使用 `toRef` 替代它：

```js
import { createComponent, toRef } from '@mpxjs/core'

createComponent({
  props: {
    title: String
  },
  setup(props) {
    const title = toRef(props, 'title')
    // `title` 是一个 ref
    console.log(title.value)
  }
})
```

#### Context

由于小程序与 web 基础技术规范的差异，Mpx 中 `setup` 的第二个参数 `context` 与 Vue3 中完全不同，`context` 包含的属性如下：

```js
import { createComponent } from '@mpxjs/core'

createComponent({
  setup(props, context) {
    // 触发事件，等价于 this.triggerEvent
    console.log(context.triggerEvent)
    // 获取 NodesRef/组件实例，等价于 this.$refs
    console.log(context.refs)
    // 字节小程序中异步获取组件实例，等价于 this.$asyncRefs
    console.log(context.asyncRefs)
    // 获取组件实例，等价于 this.selectComponent，可用 this.$refs 替代
    console.log(context.selectComponent)
    // 批量获取组件实例，等价于 this.selectAllComponents，可用 $refs 替代
    console.log(context.selectAllComponents)
    // 获取 SelectorQuery 对象实例查询元素布局信息，等价于 this.createSelectorQuery，可用 $refs 替代
    console.log(context.createSelectorQuery)
    // 获取 IntersectionObserver 对象实例查询视图相交信息，等价于 this.createIntersectionObserver
    console.log(context.createIntersectionObserver)
  }
})
```

`context` 是一个普通的 JavaScript 对象，也就是说，它不是响应式的，这意味着你可以安全地对 `context` 使用 ES6 解构。


```js
import { createComponent } from '@mpxjs/core'

createComponent({
  setup(props, { triggerEvent, refs }) {
    // ...
  }
})
```

`refs` 是有状态的对象，它会随组件本身的更新而更新。这意味着你应该避免对其进行解构，并始终以 refs.x 的方式访问 NodesRef 或组件实例。与 props 不同，refs 是非响应式的。如果你打算根据 refs 的更改应用副作用，那么应该在 onUpdated 生命周期钩子中执行此操作。

### 访问组件的 property
除了 `props` 和 `context` 中包含的内容，执行 `setup` 时将**无法访问**部分组件选项，包括：
* data
* computed

### 结合模板使用

如果 `setup` 返回一个对象，那么该对象的 property 可以在模板中访问到：

```html
<template>
  <view>{{ collectionName }}: {{ readersNumber }} {{ book.title }}</view>
</template>

<script>
  import { createComponent, ref, reactive } from '@mpxjs/core'

  createComponent({
    properties: {
      collectionName: String
    },
    setup(props) {
      const readersNumber = ref(0)
      const book = reactive({ title: 'Mpx' })

      // 暴露给 template
      return {
        readersNumber,
        book
      }
    }
  })
</script>
```

### 使用 `this`

**在 `setup()` 内部，`this` 不是当前组件的引用**，因为 `setup()` 是在解析其它组件选项之前被调用的，所以 `setup()` 内部的 `this` 的行为与其它选项中的 `this` 完全不同。这使得 `setup()`  在和其它选项式 API 一起使用时可能会导致混淆。

> Mpx 的组合式 API 设计极力避免了用户需要在 `setup()` 中访问 `this` 的场景，不过在一些例外情况下，用户仍然可以通过 `getCurrentInstance()` 的方式获取到当前组件实例，注意该函数必须在 `setup()` 或生命周期钩子中同步调用。

## 生命周期钩子 {#lifecycle-hooks}

组合式 API 中，我们通过 `on${Hookname}(fn)` 的方式注册访问生命周期钩子。

Mpx 作为一个跨端小程序框架，需要兼容不同小程序平台不同的生命周期，在选项式 API 中，我们在框架中内置了一套统一的生命周期，将不同小程序平台的生命周期转换映射为内置生命周期后再进行统一的驱动，以抹平不同小程序平台生命周期钩子的差异，如微信小程序的 `attached` 钩子和支付宝小程序的 `onInit` 钩子，在组合式 API 中，我们基于框架内置的生命周期暴露了一套统一的生命周期钩子函数，下表展示了框架内置生命周期/组合式 API 生命周期函数与不同小程序平台原生生命周期的对应关系：

#### 组件生命周期

|框架内置生命周期|Hook inside `setup`|微信原生|支付宝原生|
|:------------|:------------------|:-----|:-------|
| BEFORECREATE | `null` |attached（数据响应初始化前）|onInit（数据响应初始化前）|
| CREATED | `null` |attached（数据响应初始化后）|onInit（数据响应初始化后）|
| BEFOREMOUNT | onBeforeMount |ready（`MOUNTED` 执行前）|didMount（`MOUNTED` 执行前）| 
| MOUNTED | onMounted |ready（`BEFOREMOUNT` 执行后）|didMount（`BEFOREMOUNT` 执行后）| 
| BEFOREUPDATE | onBeforeUpdate |`null`（`setData` 执行前）|`null`（`setData` 执行前）|
| UPDATED | onUpdated |`null`（`setData` callback）|`null`（`setData` callback）|
| BEFOREUNMOUNT | onBeforeUnmount |detached（数据响应销毁前）|didUnmount（数据响应销毁前）|
| UNMOUNTED | onUnmounted |detached（数据响应销毁后）|didUnmount（数据响应销毁后）|

> 同 Vue3 一样，组合式 API 中没有提供 `BEFORECREATE` 和 `CREATED` 对应的生命周期钩子函数，用户可以直接在 `setup` 中编写相关逻辑。

> 除支付宝外的小程序平台支持使用Component构建页面，在页面中使用组件生命周期钩子与在组件中完全一致，并且框架在支付宝环境也进行了抹平实现。

#### 页面生命周期

|框架内置生命周期|Hook inside `setup`|微信原生|支付宝原生|
|:------------|:------------------|:-----|:-------|
|ONLOAD|onLoad|onLoad|onLoad|
|ONSHOW|onShow|onShow|onShow|
|ONHIDE|onHide|onHide|onHide|
|ONRESIZE|onResize|onResize|events.onResize|

#### 组件中访问页面生命周期

|框架内置生命周期|Hook inside `setup`|微信原生|支付宝原生|
|:------------|:------------------|:-----|:-------|
|ONSHOW|onShow|pageLifetimes.show|`null`（框架抹平实现）|
|ONHIDE|onHide|pageLifetimes.hide|`null`（框架抹平实现）|
|ONRESIZE|onResize|pageLifetimes.resize|`null`（框架抹平实现）|

下面是简单的使用示例：

```js
import { createComponent, onMounted, onUnmounted } from '@mpxjs/core'

createComponent({
  setup () {
    // mounted
    onMounted(()=>{
      console.log('Component mounted.')
    })
    // unmounted
    onUnmounted(()=>{
      console.log('Component unmounted.')
    })
    return {}
  }
})
```

### 框架内置生命周期

从上面可以看到我们在框架内部内置了一套统一的生命周期来抹平不同平台生命周期的差异，由于存在数据响应机制，这套内置生命周期与小程序原生的生命周期不完全一一对应，反而与 Vue 的生命周期更加相似，在过去的版本中，我们没有显式地暴露出 `BEFORECREATE` 这这类框架内置的生命周期，更多都在框架内部使用，但是在组合式 API 版本中，为了使选项式 API 的生命周期能力与之对齐，我们将框架内置的生命周期显式导出，让用户在选项式 API 开发环境下也能正常使用这些能力，简单使用示例如下：

```js
import { createComponent, BEFORECREATE } from '@mpxjs/core'

createComponent({
  [BEFORECREATE] () {
    console.log('beforeCreate exec.')
  },
  created () {
    // 原生的 created 会被映射为框架内部的 CREATED 执行，此处逻辑在 BEFORECREATE 后执行
    console.log('created exec.')
  }
})
```

### 具有副作用的页面事件

在小程序中，一些页面事件的注册存在副作用，即该页面事件注册与否会产生实质性的影响，比如微信中的 `onShareAppMessage` 和 `onPageScroll`，前者在不注册时会禁用当前页面的分享功能，而后者在注册时会带来视图与逻辑层之间的线程通信开销，对于这部分页面事件，我们无法通过`预注册 -> 驱动`方式提供组合式 API 的注册方式，用户可以通过选项式 API 的方式来注册使用，通过 `this` 访问组合式 API `setup` 函数的返回。

然而这种使用方式显然不够优雅，我们考虑是否可以通过一些非常规的方式提供这类副作用页面事件的组合式 API 注册支持，例如，借助编译手段。我们在运行时提供了副作用页面事件的注册函数，并在编译时通过 `babel` 插件的方式解析识别到当前页面中存在这些特殊注册函数的调用时，通过框架已有的`编译 -> 运行时注入`的方式将事件驱动逻辑添加到当前页面当中，以提供相对优雅的副作用页面事件在组合式 API 中的注册方式，同时不产生非预期的副作用影响。

我们需要先修改 `babel` 配置添加 `@mpxjs/babel-plugin-inject-page-events` 插件：

```json5
// babel.config.json
{
 "plugins": [
    [
      "@babel/transform-runtime",
      {
        "corejs": 3,
        "version": "^7.10.4"
      }
    ],
    "@mpxjs/babel-plugin-inject-page-events"
  ]
}
```

然后就能想普通生命周期一样使用组合式 API 进行页面事件注册，简单示例如下：

```js
import { createComponent, ref, onShareAppMessage } from '@mpxjs/core'

createComponent({
  setup () {
    const count = ref(0)

    onShareAppMessage(() => {
      return {
        title: '页面分享'
      }
    })

    return {
      count
    }
  }
})
```

目前我们通过这种方式支持的页面事件如下：

| 页面事件 | Hook inside `setup` | 平台支持 |
|:------------|:------------------|:-----|
| onPullDownRefresh | onPullDownRefresh | 全小程序平台 + web |
| onReachBottom | onReachBottom | 全小程序平台 + web |
| onPageScroll | onPageScroll | 全小程序平台 + web |
| onShareAppMessage | onShareAppMessage | 全小程序平台 |
| onTabItemTap | onTabItemTap | 微信/支付宝/百度/QQ |
| onAddToFavorites | onAddToFavorites | 微信 / QQ |
| onShareTimeline | onShareTimeline | 微信 |
| onSaveExitState | onSaveExitState | 微信 |

> 特别注意，由于静态编译分析实现方式的限制，这类页面事件的组合式 API 使用需要满足页面事件注册函数的调用和 `createPage` 的调用位于同一个 js 文件当中。

## 模板引用 {#template-ref}

在 Vue3 的组合式 API 中，我们可以在 `setup` 函数中使用 `ref()` 创建引用数据获取模板中绑定了 `ref` 属性的组件或 DOM 节点，优雅地将**响应式引用**和**模板引用**进行了关联统一，但在 Mpx 中，受限于小程序的技术限制，我们无法在低性能损耗下实现相同的设计，因此我们在 setup 的 context 参数中提供了 refs 对象，结合模板中的`wx:ref`指令使用，与选项式 API 中的 $refs 保持一致。

下面是组合式 API 中进行模板引用的使用示例：

```html
<template>
  <view bindtap="handleHello" wx:ref="hello">hello</view>
  <view wx:if="{{showWorld}}" wx:ref="world">world</view>
  <view wx:for="{{list}}" wx:ref="list">{{item}}</view>
</template>

<script>
  import { createComponent, ref, onMounted, nextTick } from '@mpxjs/core'

  createComponent({
    setup (props, { refs }) {
      const showWorld = ref(false)
      const list = ref(['手机', '电视', '电脑'])

      onMounted(() => {
        // 最早在 onMounted 中才能访问refs，对于节点返回 NodesRef 对象，对于组件返回组件实例
        console.log('hello ref:', refs.hello)
        // 在循环中定义 wx:ref，对应的 refs 返回数组
        console.log('list ref:', refs.list)
      })

      const handleHello = () => {
        showWorld.value = true
        nextTick(() => {
          // 数据变更后要在 nextTick 中访问更新后的视图数据
          console.log('world ref:', refs.world)
        })
      }
      
      // 暴露给 template
      return {
        showWorld,
        handleHello,
        list
      }
    }
  })
</script>
```

## `<script setup>`

和 Vue 类似，`<script setup>` 是在 Mpx 单文件组件中使用组合式 API 时的编译时语法糖。不过受小程序底层技术限制，在 Mpx 中 `<script setup>` 无法完整提供其在 Vue 中所具备的相关优势，我们提供了这个语法能力，但不作为默认的推荐选项。

### 基本语法

启用该语法需要在 `<script>` 代码块上添加 `setup` attribute:

```html
<script setup>
    console.log('hello Mpx script setup')
</script>
```
`<script>` 里边的代码会被编译成组件 `setup()` 函数的内容。

### 顶层的绑定会被暴露给模版

> 从 v2.8.19 开始，顶层绑定自动暴露给模板的能力被取消，构建时会强制用户通过 `defineExpose` 手动声明需要暴露给模板的数据或方法。

和 Vue 一样，当使用 `<script setup>` 时，任何在 `<script setup>` 声明的顶层的绑定（包括变量，函数声明，以及 import 导入的内容） 都能在模版中直接使用：
```html
<script setup>
    import { ref } from '@mpxjs/core'
    const msg = ref('hello');
    function log() {
        console.log(msg.value)
    }
</script>
<template>
    <view>msg: {{msg}}</view>
    <view ontap="log">click</view>
</template>
```

import 导入的内容，除了从 `@mpxjs/core` 中导入的变量或方法，其他模块导入的属性和方法全部都会暴露给模版。这意味着我们可以直接在模版中使用引入的相关方法，而不需要通过 `methods` 选项来暴露：

```html
<template>
    <view ontap="clickTrigger">click</view>
</template>
<script setup>
    import { clickTrigger } from './utils'
</script>
```
> 注意项：如果你 `script setup` 中有较多对象或方法的声明和引入，比如全局 store 这种十分复杂的对象，走默认逻辑暴露给模版会造成性能问题，因此需要使用 `defineExpose` 来手动定义暴露给模版的数据和方法。

### 响应式
和 Vue 中一样，响应式状态需要明确使用响应性 API 来创建。和 `setup()` 函数的返回值一样，ref 在模版中使用的时候会自动解包：
```html
<template>
    <button ontap="addCount">{{count}}</button>
</template>
<script setup>
    import { ref } from '@mpxjs/core'
    const count = ref(0)
    function addCount() {
        count.value++
    }
</script>
```

### `defineProps()` 
和 Vue 类似，为了在声明小程序组件 `properties` 选项时获得完整的类型推导支持，在 `<script setup>` 中，我们需要使用 `defineProps` API，它默认在 `<script setup>` 中可用：
```html
<script setup>
    const props = defineProps({
        testA: String
    })
</script>
```
* `defineProps` 是只能在 `<script setup>` 中使用的**编译宏**，不需要手动导入，会跟随 `<script setup>` 的处理过程一同被编译掉。
* `defineProps` 接收与小程序 `properties` 选项相同的值。
* 传入到 `defineProps` 的选项会从 setup 中提升到模块的作用域。因此传入的选项不能引用在 setup 作用域中声明的局部变量，否则会导致编译错误，不过可以引入导入的绑定。

### `defineExpose()`
在 `<script setup>` 中定义暴露给模版的变量和方法，在 Mpx `<script setup>` 中属于**强制要求**，若不使用该编译宏，则会构建报错。

Mpx 中的 defineExpose 和 Vue3 中的不尽相同，在 Vue3 中，使用 `<scrip setup>` 的组件默认是关闭的-即通过模版引用或者 `$parent` 链获取到的组件实例中不会暴露任何在`<script setup>` 中声明的绑定。


在 Mpx 中，`<script setup>` 中的声明绑定都会挂载到组件实例中，都可以通过组件实例来访问，Mpx `defineExpose` 更大的作用是假如你在 `<scrip setup>` 中引入了一些 store 实例，这些 store 实例默认会挂载到组件实例中，会导致后续的响应式处理以及组件更新速度变慢，这里我们通过强制使用
`defineExpose` 来规避掉这个问题。

```html
<script setup>
    const count = ref(0)
    const name = ref('black')
    defineExpose({
        name
    })
</script>
<template>
    <!--正确渲染 black-->
    <view>{{name}}</view>
    <!--找不到对应变量，无内容-->
    <view>{{count}}</view>
</template>
```

### `defineOptions()`
此编译宏相较于 Vue 是 Mpx 中独有的，主要是当开发者想在 `<script setup>` 中使用一些微信小程序中特有的选项式，例如 relations、moved 等，可以使用该编译宏进行定义。
```html
<script setup>
    defineOptions({
        pageLifetimes: {
            // 组件所在页面的生命周期函数
            resize: function () { }
        }
    })
</script>
```
* `defineOptions` 是只能在 `<script setup>` 中使用的**编译宏**，不需要手动导入，会跟随 `<script setup>` 的处理过程一同被编译掉。
* `defineOptions` 无返回值。
* `defineOptions` 中的选项会无脑提升至组件或页面构造器的选项之中，因此不可引用 setup 中的局部变量。

### `useContext()`
在 `<script setup>` 中，当我们想要使用 `context` 时，可以使用 `useContext()` 来获 `context` 对象。

```html
<script setup>
    const context = useContext()
    // 获取 NodesRef/组件实例，等价于 this.$refs
    console.log(context.refs)
</script>
```

### 针对 TypeScript 的功能

#### 类型 props 的声明
props 可以通过给 `defineProps` 传递纯类型函数的方式来声明：

```ts
    const props = defineProps<{
        foo: string,
        bar: number
    }>()

    // 构建转换为
    {
        properties: {
            foo: {
                type: String
            },
            bar: {
                type: Number
            }
        }
    }
```
* `defineProps` 要么使用运行时声明，要么使用类型声明。同时使用两种方式会导致编译报错。
* 小程序中 `defineProps` 类型声明若有 optional 不会生效，因为小程序的 props 只要声明则一定会存在
* 类型声明参数必须是一下内容之一，以确保正确的静态分析：
  * 类型字面量
  * 在同一文件中的接口或者类型字面量的引用

#### 使用类型声明时的默认 props 值
和 Vue3 一样，针对类型的 `defineProps` 声明的不足，它无法给 props 提供默认值。为了解决这个问题，我们也支持了 `withDefaults` 编译宏：

```ts
export interface Props {
  msg: string
  labels: string
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'hello',
  labels: 'world'
})
```
上边代码会被编译为等价的运行时 props 的 `value` 选项。

* 小程序 properties 定义中的 optionalTypes 和 observer 字段，无法使用 TypeScript 类型声明的方式定义，如果需要定义这两个字段，目前需要使用运行时的方式来定义。

### 限制
由于模块执行语义的差异，`<script setup>` 中的代码依赖单文件组件的上下文，如果将其移动到外部的 `.js` 或者 `.ts` 的时候，对于开发者可工具来说都十分混乱。因此 `<script setup>` 不能和 `src` attribute 一起使用。

## 组合式 API 与 Vue3 中的区别

下面我们来总结一下 Mpx 中组合式 API 与 Vue3 中的区别：

* `setup` 的 `context` 参数不同，详见[这里](#Context)
* `setup` 不支持返回**渲染函数**
* `setup` 不能是异步函数
* `<script setup>` 提供的宏方法不同，详见[这里](#script-setup)
* `<script setup>` 不支持 `import` 快捷引入组件
* `<script setup>` 必须使用 [defineExpose](#defineprops)
* 支持的生命周期钩子不同，详见[这里](#生命周期钩子)
* 模板引用的方式不同，详见[这里](#模板引用)

## 组合式 API 周边生态能力的使用

我们对 Mpx 提供的周边生态能力也都进行了组合式 API 适配升级，详情如下：

* `store` 在组合式 API 中使用，详见[这里](../advance/store.md#use-store-in-composition-api)
* `pinia` 在组合式 API 中使用，详见[这里](../advance/pinia.md)
* `fetch` 在组合式 API 中使用，详见[这里](../extend/fetch.md/#composition-api-usage)
* `i18n` 在组合式 API 中使用，详见[这里](../advance/i18n.md#composition-api-usage)
