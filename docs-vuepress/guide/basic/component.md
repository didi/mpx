# 自定义组件

在 Mpx 中也可以使用类似 Vue 中的单文件自定义组件，我们可以在每个组件内封装自定义内容和逻辑。

在Mpx中自定义组件，语法默认以微信小程序为基准，与此同时，Mpx 额外提供的数据响应和模版增强语法等一系列增强能力都可以在自定义组件中使用。

>作为参考，原生小程序自定义组件的规范详情查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html)，但在Mpx中自定义组件所支持的属性和功能还需以当前文档为准。

## 注册使用

```html
<!--组件 components/list.mpx-->
<template>
    <view>组件名称: {{ name }}</view>
</template>
<script>
    import { createComponent } from '@mpxjs/core'
    createComponent({
        data: {
          name: 'list'
        }
    })
</script>

<!--页面 index.mpx-->
<template>
    <view>
        <list></list>
    </view>
</template>
<script>
    import { createPage } from '@mpxjs/core'
    createPage({})
</script>
<script type="application/json">
  {
    "usingComponents": {
        "list": "components/list"
    }
  }
</script>
```
使用 [createComponent](/api/global-api.html#createcomponent) 方法创建自定义组件，在父组件/页面中通过 usingComponents 注册使用。

## 组件属性

### properties

用于声明组件接收的外部属性。属性的类型可以为 String、Number、Boolean、Object、Array 其一，也可以为 null 表示不限制类型。

```ts
interface ComponentOptions {
  properties?: {
    [key: string]: PropOptions | Constructor | Constructor[]
  }
}

interface PropOptions {
  type: Constructor | Constructor[] // type 为必填项
  value?: any
  optionalTypes?: Constructor[] // 属性的类型（可以指定多个）
  observer?: string | ((newVal: any, oldVal: any) => void)
  required?: boolean
}
```

properties 定义包含以下选项：
* **`type`**: 必填，属性的类型
* **`optionalTypes`**: 可选，属性的类型（可以指定多个）
* **`value`**: 可选，属性的初始值
* **`observer`**: 可选，属性值变化时的回调函数（不推荐使用，建议使用 observers）

> **注意：**
> 1. 属性名应避免以 data 开头，因为在 WXML 中，data-xyz="" 会被作为节点 dataset 来处理
> 2. 在组件定义和使用时，属性名和 data 字段相互间都不能冲突
> 3. type 字段为必填项，虽然新版本基础库兼容未填写的情况，但建议始终显式指定类型
> 4. 从基础库 2.0.9 开始，对象类型的属性和 data 字段中可以包含函数类型的子字段

```js
createComponent({
  properties: {
    // 基础类型
    propA: {
      type: String,
      value: ''
    },
    // 简化的定义方式
    propB: Number,
    // 多种类型
    propC: {
      type: Number,
      optionalTypes: [String, Object],
      value: 0
    },
    // 必填属性
    propD: {
      type: String,
      required: true
    },
    // 带有属性值变化回调
    propE: {
      type: Object,
      observer(newVal, oldVal) {
        console.log('propE changed:', newVal, oldVal)
      }
    }
  }
})
```

在 WXML 中指定属性值时，应注意：
* 指定静态值时使用连字符写法：`<custom-comp prop-a="value" />`
* 使用动态绑定时使用驼峰写法：`<custom-comp :propA="value" />`

多数情况下，属性最好指定一个确切的类型。这样，在 WXML 中以字面量指定属性值时，值可以获得正确的类型转换：

```html
<custom-comp min="1" max="5" />
```

此时，由于属性被规定为 Number 类型，min 和 max 会被转换为数值 1 和 5，而非字符串：

```js
this.data.min === 1 // true
this.data.max === 5 // true
```

### data

用于声明组件的内部数据状态。

```ts
interface ComponentOptions {
  data?: object | (() => object)
}
```

data 选项声明组件内部的响应式数据。在 Mpx 中，data 必须是一个返回对象的函数，以确保每个组件实例都有独立的数据副本。

组件实例会代理所有 data 函数返回对象上的属性，因此可以直接通过 `this.propertyName` 访问这些数据。

```js
createComponent({
  data() {
    return {
      count: 0,
      message: 'Hello',
      userInfo: {
        name: '',
        age: 0
      }
    }
  }
})
```

### computed

用于声明基于现有数据的计算属性。

```ts
interface ComponentOptions {
  computed?: {
    [key: string]: (() => any) | ComputedOptions
  }
}

interface ComputedOptions {
  get(): any
  set?(value: any): void
}
```

computed 选项用于声明依赖于其他数据的计算属性。计算属性的结果会被缓存，只有在依赖发生变化时才会重新计算。

计算属性可以通过以下方式定义：
  * 使用函数形式（只读）
  * 使用带有 get/set 的对象形式（可读写）

```js
createComponent({
  data() {
    return {
      price: 100,
      quantity: 2
    }
  },
  computed: {
    // 只读计算属性
    total() {
      return this.price * this.quantity
    },
    // 可读写计算属性
    discount: {
      get() {
        return this.price * 0.9
      },
      set(value) {
        this.price = value / 0.9
      }
    }
  }
})
```

### watch

用于声明对数据变化的监听回调。

```ts
interface ComponentOptions {
  watch?: {
    [key: string]: WatchOption | WatchCallback | string
  }
}

type WatchCallback = (newValue: any, oldValue: any) => void

interface WatchOption {
  handler: WatchCallback | string
  immediate?: boolean
  deep?: boolean
}
```

watch 选项用于监听数据的变化并执行相应的回调函数。支持以下功能：
  * 监听单个数据源
  * 监听多个数据源
  * 深度监听（deep）
  * 立即执行（immediate）

```js
createComponent({
  data() {
    return {
      message: 'Hello',
      user: {
        name: 'John',
        age: 20
      }
    }
  },
  watch: {
    // 简单监听
    message(newVal, oldVal) {
      console.log('message changed:', newVal, oldVal)
    },
    // 深度监听
    user: {
      handler(newVal, oldVal) {
        console.log('user changed:', newVal, oldVal)
      },
      deep: true,
      immediate: true
    },
    // 监听对象的属性
    'user.name'(newVal, oldVal) {
      console.log('user.name changed:', newVal, oldVal)
    }
  }
})
```

### methods

用于声明组件的方法。

```ts
interface ComponentOptions {
  methods?: {
    [key: string]: (...args: any[]) => any
  }
}
```

methods 选项用于声明组件实例可以访问的方法。所有方法的 this 上下文会自动绑定为组件实例。

```js
createComponent({
  methods: {
    handleClick() {
      // 访问数据
      console.log(this.message)
      // 调用其他方法
      this.otherMethod()
    },
    otherMethod() {
      // ...
    }
  }
})
```

## 动态组件

Mpx中提供了使用方法类似于 Vue 的动态组件能力，这是一个基于 wx:if 实现的语法。通过对 `is` 属性进行动态绑定，可以实现在同一个挂载点切换多个组件，前提需要动态切换的组件已经在全局或者组件中完成注册。

使用示例如下：

```html
<view>
  <!-- current为组件名称字符串，可选范围为局部注册的自定义组件和全局注册的自定义组件 -->
  <!-- 当 `current`改变时，组件也会跟着切换  -->
  <component is="{{current}}"></component>
</view>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    data: {
      current: 'test'
    },
    ready () {
      setTimeout(() => {
        this.current = 'list'
      }, 3000)
    }
  })
</script>

<script type="application/json">
  {
    "usingComponents": {
      "list": "../components/list",
      "test": "../components/test"
    }
  }
</script>
```

## slot

在组件中使用slot（插槽）可以使我们封装的组件更具有可扩展性，Mpx完全支持原生插槽的使用。

### 基础用法

```html
<!-- 组件模板 -->
<!-- components/mySlot.mpx -->
<view>
  <view>这是组件模板</view>
  <slot name="slot1"></slot>
  <slot name="slot2"></slot>
</view>
```

使用组件时：

```html
<!-- index.mpx -->
<template>
  <view>
    <my-slot>
      <view slot="slot1">我是slot1中的内容</view>
      <view slot="slot2">我是slot2中的内容</view>
    </my-slot>
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  options: {
    multipleSlots: true // 启用多slot支持
  }
})
</script>

<script type="application/json">
  {
    "usingComponents": {
      "my-slot": "components/mySlot"
    }
  }
</script>
```

> 注意：使用多个slot时，需要在组件选项中开启 `multipleSlots: true`。

更多关于插槽的使用细节可查看[微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html)。
