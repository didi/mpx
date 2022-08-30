# 组合式 API

## 什么是组合式 API
组合式 API 是 Vue3 中包含的最重要的特性之一，主要由 `setup` 函数及一系列响应式 API 及生命周期钩子函数组成， 与传统的选项式 API 相比，组合式 API 具备以下优势：

* 更好的逻辑复用，通过函数包装复用逻辑，显式引入调用，方便简洁且符合直觉，规避消除了 mixins 复用中存在的缺陷；
* 更灵活的代码组织，相比于选项式 API 提前规定了代码的组织方式，组合式 API 在这方面几乎没有做任何限制与规定，更加灵活自由，在功能复杂的庞大组件中，我们能够通过组合式 API 让我们的功能代码更加内聚且有条理，不过这也会对开发者自身的代码规范意识提出更高要求；
* 更好的类型推导，虽然基于 `this` 的选项式 API 通过 `ThisType` 也能在一定程度上实现 TS 类型推导，但推导和实现成本较高，同时仍然无法完美覆盖一些复杂场景（如嵌套 mixins 等）；而组合式 API 以本地变量和函数为基础，本身就是类型友好的，我们在类型方面几乎不需要做什么额外的工作就能享受到完美的类型推导。

同时与 React Hooks 相比，组合式 API 中的 `setup` 函数只在初始化时单次执行，在数据响应能力的加持下大大降低了理解与使用成本，基于以上原因，我们决定为 Mpx 添加组合式 API 能力，让用户能够用组合式 API 方式进行小程序开发。

更多关于组合式 API 的说明可以查看 [Vue3 官方文档](https://vuejs.org/guide/extras/composition-api-faq.html)。

Mpx 是一个小程序优先的增强型跨端框架，因此我们在为 Mpx 设计实现组合式 API 的过程中，并不追求与 Vue3 中的组合式 API 完全一致，我们更多是借鉴 Vue3 中组合式 API 的设计思想，将其与目前 Mpx 及小程序中的开发模式结合起来，而非完全照搬其实现。因此在 Mpx 中一些具体的 API 设计实现会与 Vue3 存在差异，我们会在后续相关的文档中进行标注说明，如果你想查看 Mpx 与 Vue3 在组合式 API中的全部差异，可以跳转到[这里](#组合式-API-与-Vue3-中的区别)查看。 

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

## 单文件组件 `<script setup>`

和 Vue 一样，`<script setup>` 是在 Mpx 单文件组件中使用组合式 API 时的编译时语法糖。相较于普通的 `<script>` 语法，它具有一些优势：
* 更少的样板内容，更简洁的代码。
* 能够使用纯 TypeScript 声明 props 和自定义事件。
* 更好的 IDE 类型推导性能。

### 基本语法

启用该语法需要在 `<script>` 代码块上添加 `setup` attribute:

```html
<script setup>
    console.log('hello Mpx script setup')
</script>
```
`<script>` 里边的代码会被编译成组件 `setup()` 函数的内容。

### 顶层的绑定会被暴露给模版
和 Vue 一样，当使用 `<script setup>` 时，任何在 `<script setup>` 声明的顶层的绑定（包括变量，函数声明，以及 import 导入的内容） 都能在模版中直接使用：
```html
<script setup>
    const msg = 'hello';
    function log() {
        console.log(msg)
    }
</script>
<template>
    <view>msg: {{msg}}</view>
    <view ontap="log">click</view>
</template>
```
import 导入的内容也会以同样的方式暴露。这意味着我们可以直接在模版中使用引入的相关方法，而不需要通过 `methods` 选项来暴露:
```html
<template>
    <view ontap="clickTrigger">click</view>
</template>
<script setup>
    import { clickTrigger } from './utils'
</script>
```
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

### `defineReturns()`
在 `<script setup>` 声明的顶层的绑定(包括变量，函数声明，以及 import 导入的内容)，编译后在 `setup()` 都会统一被 return 出去，当开发者想对 `setup()` 中暴露给模版的变量和方法进行自定义，可以使用 `defineReturns` 编译宏进行定义。
```html
<script setup>
    const count = ref(0)
    const name = ref('black')
    defineReturns({
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
### 限制
由于模块执行语义的差异，`<script setup>` 中的代码依赖单文件组件的上下文，如果将其移动到外部的 `.js` 或者 `.ts` 的时候，对于开发者可工具来说都十分混乱。因此 `<script setup>` 不能和 `src` attribute 一起使用。

## 生命周期钩子

组合式 API 中，我们通过 `on${Hookname}(fn)` 的方式注册访问生命周期钩子。

Mpx 作为一个跨端小程序框架，需要兼容不同小程序平台不同的生命周期，在选项式 API 中，我们内置了一套生命周期转换规则，用于转换映射不同小程序平台不同的生命周期，如微信小程序中的 `attached` 钩子在输出支付宝时会被映射到支付宝小程序的 `onInit` 中执行，但是在组合式 API 的写法中，我们不太可能把不同小程序平台的全量生命周期钩子函数都提供出来，因此我们在组合式 API 版本中，参考 Vue 提供了一套标准统一的生命周期钩子，在不同的小程序平台中进行抹平映射，下表展示了不同小程序平台生命周期与组合式 API 暴露的生命周期函数的对应关系：

组件生命周期

|Hook inside `setup`|微信|支付宝|
|:----|:-----|:-------------------|
|onBeforeCreate/onCreated|attached|onInit|
|onBeforeMount/onMounted|ready|didMount|
|onBeforeUpdate/onUpdated|`setData` callback|`setData` callback|
|onBeforeUnmount/onUnmounted|detached|didUnmount|

> 除支付宝外的小程序平台支持使用Component构建页面，在页面中使用组件生命周期钩子与在组件中完全一致，并且框架在支付宝环境也进行了抹平实现。

页面生命周期

|Hook inside `setup`|微信|支付宝|
|:----|:-----|:-------------------|
|onLoad|onLoad|onLoad|
|onShow|onShow|onShow|
|onHide|onHide|onHide|
|onResize|onResize|events.onResize|

组件中访问页面生命周期

|Hook inside `setup`|微信|支付宝|
|:----|:-----|:-------------------|
|onShow|pageLifetimes.show|框架抹平实现|
|onHide|pageLifetimes.hide|框架抹平实现|
|onResize|pageLifetimes.resize|框架抹平实现|

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

## 模板引用

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

## 组合式 API 与 Vue3 中的区别

下面我们来总结一下 Mpx 中组合式 API 与 Vue3 中的区别：

* `setup` 的 `context` 参数不同，详见[这里](#Context)
* `setup` 不支持返回**渲染函数**
* `setup` 不能是异步函数
* `<script setup>` 提供的宏方法不同，详见[这里](#todo-script-setup)
* `<script setup>` 不支持 `import` 快捷引入组件
* 支持的生命周期钩子不同，详见[这里](#生命周期钩子)
* 模板引用的方式不同，详见[这里](#模板引用)
