# script增强特性

在原生自定义组件config的基础上，`mpx`新增支持了watch、computed、mixins、pageShow & pageHide等字段提高开发体验，同时`mpx`提供一个深度优化的机制来接管小程序的`setData`调用，用户在组件/页面当中可以使用`this.someData = 'abc'`的方式来设置数据，永远不应该直接调用`setData`去设置数据，这有可能导致数据不一致的问题。

## computed

计算属性是一个纯函数，利用组合其它数据的方式返回一个新的数据，你可以像绑定普通数据一样在模板中绑定计算属性。

> 适用于【页面 | 组件】

示例：

```html
<template>
  <view>
    <text>Original message: "{{ message }}"</text>
    <text>Computed reversed message: "{{ reversedMessage }}"</text>
  </view>
</template>

<script>
import {createComponent} from '@mpxjs/core'
createComponent({
  data: {
    message: 'Hello'
  },
  computed: {
    // 计算属性
    reversedMessage: function () {
      return this.message.split('').reverse().join('')
    }
  },
  ready() {
    // 改变message后reversedMessage会同步更新，模板也会重新渲染
    this.message = 'Hello world!'
  }
})
</script>
```

## watch

`mpx`为小程序原生组件提供了观察和响应上的数据变动的能力。虽然计算属性在大多数情况下已满足需求，但有时也需要一个自定义的侦听器。当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的。

> 适用于【页面 | 组件】

例如：

```html
<template>
<view>
  <view>{{question}}</view>
  <view>{{answer}}</view>
</view>
</template>

<script>
import {createComponent} from '@mpxjs/core'
createComponent({
  data: {
    question: 'old',
    answer: 'I cannot give you an answer until you ask a question!'
  },
  watch: {
    // 如果 `question` 发生改变，这个函数就会运行
    question: function (newval, oldval) {
      console.log(newval, ':',  oldval) // test:old
      this.answer = 'Waiting for you to stop typing...'
    }
  },
  attached () {
    // 3s之后修改数据
    setTimeout(() => {
      this.changeData()
    }, 3000)
  },
  methods: {
    changeData() {
      this.question = 'test'
    }
  }
})
</script>
```

除了 watch 选项之外，您还可以使用命令式的 `this.$watch` API。

## mixins

`mixins` 选项接受一个混合对象的数组。这些混合实例对象可以像正常的实例对象一样包含选项，他们将使用相同的选项合并逻辑合并。举例：如果你混合包含一个钩子而创建组件本身也有一个，两个函数将被调用。
Mixin 钩子按照传入顺序依次调用，并在调用组件自身的钩子之前被调用。

> 适用于【APP | 页面 | 组件】

示例：

```js
// mixin.js
export default {
  data: {
    list: {
      'phone': '手机',
      'tv': '电视',
      'computer': '电脑'
    }
  },
  ready () {
    console.log('mixins ready:', this.list.phone)
  }
}
```

```html
<template xmlns="">
  <view class="list">
    <view wx:for="{{list}}">{{item}}</view>
  </view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  import mixin from './mixin'
  createComponent({
    mixins: [mixin],
    ready () {
      console.log('component ready:', this.list.tv)
    }
  })
</script>
```

输出结果为  
```
mixins ready: 手机 
component ready: 电视
```


## 页面生命周期

除了小程序自定义组件本身的生命周期外，`mpx`提供了两个页面生命周期钩子，`pageShow`和`pageHide`，用于监听当前所属页面的显示或隐藏状态。

> 适用于【组件】

```html
<template>
  <view>组件新生命周期</view>
</template>

<script>
import {createComponent} from '@mpxjs/core'
createComponent({
  pageShow () {
    // 所在页面显示之后就会执行一次
    console.log('page show')
  },
  pageHide () {
    // 页面切入后台执行
    console.log('page hide')
  }
})
</script>
```
