# script增强特性

在原生自定义组件config的基础上，`mpx`新增支持了watch、computed、mixins、pageShow & pageHide等字段提高开发体验，同时`mpx`提供一个深度优化的机制来接管小程序的`setData`调用，用户在组件/页面当中可以使用`this.someData = 'abc'`的方式来设置数据，永远不应该直接调用`setData`去设置数据，这有可能导致数据不一致的问题。

## computed

计算属性是一个函数/带setter和getter的对象，利用组合其它数据的方式返回一个新的数据，你可以像绑定普通数据一样在模板中绑定计算属性。
> 类型：{ [key: string]: Function | { get: Function, set: Function } }
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
    message: 'Hello',
    num: 5
  },
  computed: {
    // 计算属性
    reversedMessage: function () {
      return this.message.split('').reverse().join('')
    },
    // 读取和设置
    computeNum: {
      get: function () {
        return this.num - 1
      },
      set: function (val) {
        this.num = val + 1
      }
    }
  },
  ready() {
    // 改变message后reversedMessage会同步更新，模板也会重新渲染
    this.message = 'Hello world!'
    this.computeNum // 4
    this.computeNum = 10
    this.num // 11
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
    answer: 'I cannot give you an answer until you ask a question!',
    info: {
      name: 'a'
    },
    arr: [{
      age: 1
    }]
  },
  watch: {
    // 如果 `question` 发生改变，这个函数就会运行
    question: function (newval, oldval) {
      console.log(newval, ':',  oldval) // test:old
      this.answer = 'Waiting for you to stop typing...'
    },
    question: {
      handler (newval, oldval) {
        console.log(newval, ':',  oldval) // test:old
        this.answer = 'Waiting for you to stop typing...'
      },
      immediate: true // 立即执行一次
      // deep: true // 是否深度观察
      // sync: true // 数据变化之后是否同步执行，默认是进行异步队列
    },
    'info.name' (val) {
      // 支持路径表达式
      console.log(val) // b
    },
    'arr[0].age' (val) {
      // 支持路径表达式
      console.log(val) // 100
    },
    'question, answer' (val, old) {
      // 同时观察多个值, val为数组个数, question变化时
      console.log(val) // ['test', 'I cannot give you an answer until you ask a question!']
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
      this.info.name = 'b'
      this.arr[0].age = 100
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

``` js
mixins ready: 手机
component ready: 电视
```

## 页面生命周期转换

除了类支付宝小程序之外，其他平台都能以组件的方式创建页面，因此mpx内部默认是以Component来创建页面的（微信小程序、百度小程序、头条小程序等类微信小程序）。[按官方标准](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)，以Component创建页面时，页面特有的生命周期（onLoad、onReady、onShow等等）都必须`定义在methods内部`。为了进行统一处理，使用`mpx.createPage创建页面`时，可以统一使用标准页面的格式，`所有生命周期都定义在最外层即可`，mpx内部会根据普通进行`自动转换`到methods里面

```html
<script>
import {createPage} from '@mpxjs/core'
// 类微信小程序
createPage({
  onLoad () {
    // 页面加载
    console.log('page onload')
  },
  onShow () {
    // 页面显示
    console.log('page onload')
  },
  onPullDownRefresh () {
    // 需在json域开启enablePullDownRefresh
    console.log('page onPullDownRefresh')
  },
  attached () {
    // 以Component创建页面，那么页面也将具体组件的生命周期
  },
  detached () {
    // 以Component创建页面，那么页面也将具体组件的生命周期
  }
})
</script>
```

## 组件生命周期扩展

> 2.5.x 起不建议使用
> 2.6.x 将废弃
> 早期小程序本身缺乏组件感应所在页面的状态的能力做的增强，在小程序本身提供了 pageLifetimes 后失去意义且有不必要的性能开销，2.5.x为了避免业务异常，换手段hack实现了这两个方法，但同时有在控制台提示不要再使用，2.6.x将彻底去掉。

除了小程序自定义组件本身的生命周期外，`mpx`为组件本身提供了两个生命周期钩子，`pageShow`和`pageHide`，用于监听当前组件所属页面的显示或隐藏状态。

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
