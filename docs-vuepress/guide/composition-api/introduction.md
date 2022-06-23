# 介绍

## 什么是组合式 API？
在开发多页面多组件应用时，对于重复使用到的业务逻辑或者工具方法，我们经常需要进行提取复用，

在业务逻辑复用时，我们之前常用的功能是mixin，首先mixin 很容易发生命名冲突，同时可重用性差，
无法通过传递参数来改变它内部的值。

此外逻辑较为负责的页面或组件，在选项式 API 场景下大多分散在组件的各个选项之中，开发者阅读某块逻辑时，
经常需要上下翻腾，很是麻烦。

针对这些痛点，我们希望代码能够系统性和逻辑性的收集组合在一起，最早 React 提出了 hooks概念来解决，
此后，Vue也提供了相同级别的逻辑组织能力，即为 Composition API

由于浏览器对于 Proxy 的支持覆盖率问题，Mpx框架中暂时选择使用 Object.defineProperty 来实现组合式 API

## 响应性基础简介
从我们常用的响应式前端框架来理解，即为数据变化-> 视图更新，那么自身的变化能够导致视图更新的数据就可以称之为
响应式数据。

这里我们先脱离于前端虚拟DOM，页面渲染等场景，就单纯的举个例子，这里有个冠军逻辑

```js
const teamPlayers = {
    playerOne: 'russell',
    playerTwo: 'Irving'
}
let result = ''

if (teamPlayers.playerOne === 'Lebron' && teamPlayers.playerTwo === 'Davis') {
    result === 'Lakers Championship'
} else {
    result = 'not champion'
}
```
这里 playerOne 和 playerTwo 是随时都可以进行变动更改的，我们希望这两个值变动的时候，可以自动进行冠军逻辑判断。

1.当值被读取时进行追踪

想要实现最终的冠军逻辑自执行，我们首先需要感知到那些变量的变化会知道冠军逻辑发生变化，这里首先要将冠军逻辑的因子变量
进行可追踪感知

```js
const teamPlayers = {
    playerOne: 'Durant',
    playerTwo: 'Irving'
}

const handler = {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter (target, property, receiver) {
      Track(target, property)  
      return target[property]
    }
}
Object.defineProperty(teamPlayers, 'playerOne', handler)
Object.defineProperty(teamPlayers, 'playerTwo', handler)
```
Track 稍后进行介绍，其将球员变量和冠军逻辑进行关联，让playerOne 和 playerTwo 成为了 冠军逻辑的依赖项

2. 当某个值改变时进行检测
```js
const handler = {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter (target, property, receiver) {
      Track(target, property)  
      return target[property]
    },
    set: function reactiveSetter (target, property, value, receiver) {
      trigger(target, property)
      target[property] = value
    }
}
```
这里我们在球队中球员变化的时候定义了一个 trigger 方法，这个方法将会去寻找依赖该球员的逻辑，它会找到冠军逻辑依赖该球员，
然后重新执行冠军逻辑

3.重新运行代码来读取原始值
因为我们需要在球员变化时重新执行冠军逻辑，所以这里需要对冠军逻辑进行一个函数封装来方便多次执行
```js
let result = 'not champion'
function runChampionLogic() {
    if (teamPlayers.playerOne === 'Lebron' && teamPlayers.playerTwo === 'Davis') {
        result === 'Lakers Championship'
    } else {
        result = 'not champion'
    }
}
```
经过前两步，我们已经可以感知到球员变量的获取和更新，但是球员变量和逻辑的关联是怎么执行的一直没说，这里我们就来看下
如果对一个方法响应式追踪其依赖，并在其依赖变更时重新运行该函数。

我们通过一个副作用来跟踪当前正在运行的函数
```js
let activeEffect = null
const createEffect = fn => {
    const effect = () => {
        activeEffect = effect
        fn()
        activeEffect = null
    }
    effect()
}

createEffect(runChampionLogic)
```

当对象属性get时，track会将对象属性和副作用进行关联，也可以说该副作用即为该属性的订阅者
```js
// 这会在一个副作用就要运行之前被设置
// 我们会在后面处理它
function track(target, key) {
  if (activeEffect) {
    const effects = getSubscribersForProperty(target, key)
    effects.add(activeEffect)
  }
}
```
当对象属性set时，trigger会取出该对象属性的的副作用就行执行，也可以理解为通知所有订阅者执行
```js
function trigger(target, key) {
  const effects = getSubscribersForProperty(target, key)
  effects.forEach((effect) => effect())
}
```
至此，球员和冠军逻辑看起来已经完成了响应式关联，这里playerOne 和 playerTwo的可追踪性和可检测性都是通过手动调用
`Object.defineProperty` 来实现的，那这里假如我们想封装一个方法来默认将对象的所有属性变得各追踪和可检测，我们起名字为
`reactive`

```js
function reactive(value) {
    // .... 各种判断
    Object.keys(value).forEach((key) => {
        if (isObject(value[key])) {
            //... 省略数组等其他判断
            value[key] = reactive(value[key])
        } else {
            Object.defineProperty(value, key, handler)
        }
    })
    return value
}

const teamPlayers = reactive({
    playerOne: 'Durant',
    playerTwo: 'Irving'
})
```
如此一来，经过`reactive`返回的即为响应式对象

假如我们的冠军逻辑现在依赖了一个新的因子，必须为 2020 年才能夺冠
```js
let year = 2020
```
但是在 JS 环境下，我们无法使用`Object.defineProperty`对Number类型进行追踪检测，这里我们通过`ref`来使`year`变成可追踪检测的响应式变量
```js
const ref = (val) => {
    const obj = {
        get value() {
            Track(obj, 'value')
            return val
        },
        set value(newVal) {
            Trigger(obj, 'value')
            value = newVal
        }
    }
    // ...省略各种其他处理
    return obj
}
```
至此，我们的整个冠军逻辑就变成了真正可响应性的了
```js
const teamPlayers = reactive({
    playerOne: 'Durant',
    playerTwo: 'Irving'
})
const year = ref(2022)
const result = ref('')

function runChampionLogic() {
    if (teamPlayers.playerOne === 'Lebron' && teamPlayers.playerTwo === 'Davis' && year.value === 2020) {
        result.value === 'Lakers Championship'
    } else {
        result = 'not champion'
    }
}
createEffect(runChampionLogic)
```

## 组合式 API 基础
大概了解了组合式 API 是什么和响应式基础后，这里我们就开始介绍下组合式 API 的一些基础知识。
### setup 组件选项
在组件中我们一个可以使用组合式 API 的地方，这个地方为 `setup`

`setup` 在小程序组件实例刚被创建时执行

setup 选项接收 props 和 context 两个参数，

### 响应性API
setup 声明响应式状态时需要用到响应性API，例如 ref、reactive 等

### 在 setup 内注册生命周期钩子
在 setup 中，为了使组合式 API 的功能和选项式 API 一样完整，我们还需要一种在 setup 中注册生命周期钩子的方法，
这里我们的生命周期方法名与Vue进行了对齐

这些函数接受一个回调，当钩子被组件调用时，该回调将被执行
```js
// List.mpx
import {createComponent, onMounted} from '@mpxjs/core'
createComponent({
    setup(props, context) {
        onMounted(() => {
            console.log('组件挂载完成')
        })
    }
})
```
### watch 和 computed
[传送门](api/composition-api/computed-watch-api.html)

