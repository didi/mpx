# 组合式 API

## setup
一个组件选项，在组件被创建之前，props 被解析之后执行。是组合式 API 的入口。

- **参数**：
    - `{Data} props`
    - `{SetupContext} context`

该 **props** 对象仅包含显性声明的 properties。并且所有声明了的prop，不论父组件是否向其传递，
都将出现在 **props** 对象中。其中未被传入的可选的 prop 的值会是默认值或 undefined。

```js
import { createComponent } from '@mpxjs/core'

createComponent({
    properties: {
        min: {
            type: Number,
            value: 0
        },
        lastLeaf: {
            // 这个属性可以是 Number 、 String 、 Boolean 三种类型中的一种
            type: Number,
            optionalTypes: [String, Object],
            value: 0
        }
    },
    setup(props) {
        console.log(props.min)
        console.log(props.lastLeaf)
    }
})
```

- **类型声明**：
```ts
interface Data {
    [key: string]: unknown
}

interface SetupContext {
    triggerEvent<DetailType = any>(
            name: string,
            detail?: DetailType,
            options?: TriggerEventOption
    ): void
    refs: ObjectOf<WechatMiniprogram.NodesRef & ComponentIns<{}, {}, {}, {}, []>>
    nextTick: (fn: () => void) => void
    forceUpdate: (params?: object, callback?: () => void) => void
    selectComponent(selector: string): TrivialInstance
    selectAllComponents(selector: string): TrivialInstance[]
    createSelectorQuery(): SelectorQuery
    createIntersectionObserver(
            options: CreateIntersectionObserverOption
    ): IntersectionObserver}

function setup(props: Data, context: SetupContext): Data
```

## 生命周期钩子
可以通过直接导入 on* 函数来注册生命周期钩子：

```js
import { onMounted, onUpdated, onUnmounted, createComponent } from '@mpxjs/core'

createComponent({
  setup() {
    onMounted(() => {
      console.log('mounted!')
    })
    onUpdated(() => {
      console.log('updated!')
    })
    onUnmounted(() => {
      console.log('unmounted!')
    })
  }
})
```

这些生命周期钩子注册函数只能在 setup() 期间同步使用，因为它们依赖于内部的全局状态来定位当前活动的实例 (此时正在调用其 setup() 的组件实例)。
在没有当前活动实例的情况下，调用它们将会出错。

组件实例的上下文也是在生命周期钩子的同步执行期间设置的，因此，在生命周期钩子内同步创建的侦听器和计算属性也会在组件卸载时自动删除。

新版本的生命周期钩子我们基本上和 Vue 中的生命周期钩子对齐，相较于之前还是有部分生命周期钩子的改动。

### onBeforeCreate
- **类型：** `Function`
- **详细：**

在组件实例刚刚被创建时执行，在实例初始化之后、进行数据侦听和 data 初始化之前同步调用。


### onCreated
- **类型：** `Function`
- **详细：**

在组件实例刚刚被创建时执行。在这一步中，实例已完成对选项的处理，意味着以下内容已被配置完毕：数据侦听、计算属性、事件/侦听器的回调函数。
然而，挂载阶段还没开始。

### onBeforeMount
- **类型：** `Function`
- **详细：**

在组件布局完成后执行，refs 相关的前置工作在该钩子中执行

### onMounted
- **类型：** `Function`
- **详细：**

在组件布局完成后执行，refs 可以直接获取

### onBeforeUpdate
-**类型：** `Function`
-**详细：**

在数据发生改变后，组件/页面更新之前被调用。这里适合在现有组件/页面将要被更新之前访问它，
比如移除某个手动添加的监听器，或者获取某个元素更新前的高度。

### onUpdated
- **类型：** `Function`
- **详细：**

在数据更改导致的页面/组件重新渲染和更新完毕之后被调用。

注意，onUpdated 不会保证所有的子组件也都被重新渲染完毕。如果你希望等待整个视图都渲染完毕，可以在 onUpdated 内部使用 nextTick

### onBeforeUnmount
- **类型：** `Function`
- **详细：**

在卸载组件/页面实例之前调用。在这个阶段，实例仍然是完全正常的。

### onUnmount
- **类型：** `Function`
- **详细：**

卸载组件实例后调用。调用此钩子时，组件实例的所有指令都被解除绑定，所有事件侦听器都被移除。

### onLoad
- **类型：** `Function`
- **详细：**

微信小程序页面 onLoad 事件，监听页面加载

### onShow
- **类型：** `Function`
- **详细：**

微信小程序页面 onShow 事件，监听页面展示

### onHide
- **类型：** `Function`
- **详细：**

微信小程序页面 onHide 事件，监听页面隐藏

### onResize
- **类型：** `Function`
- **详细：**

微信小程序页面 onResize 事件，页面尺寸改变时触发

## getCurrentInstance

getCurrentInstance 支持访问内部组件实例。

- **注意：**

getCurrentInstance 只暴露给高阶使用场景，典型的比如在库中。强烈反对在应用的代码中使用 getCurrentInstance。请不要把它当作在组合式 API 中获取 this 的替代方案来使用。

getCurrentInstance 只能在 setup 或生命周期钩子中调用。

## useI18n

组合式 API 中使用，用来获取 i18n 实例。

### 参数选项

#### locale

* **类型：** `Locale`

设置语言环境

**注意：** 只传 locale，不传 messages 属性时不起作用

#### fallbackLocale

* **类型：** `Locale`

预设的语言环境，找不到语言环境时进行回退。

#### messages

* **类型：** `LocaleMessages`

本地化的语言环境信息。

### 返回实例属性和方法

#### locale
* **类型：** `WritableComputedRef<Locale>`

可响应性的 ref 对象，表示当前 i18n 实例所使用的 locale。

修改 ref 值会对局部或者全局语言集的 locale 进行更改，并触发翻译方法重新执行。

#### fallbackRoot
* **类型：** `Boolean`

本地化失败时是否回归到全局作用域。

#### getLocaleMessage( locale )

* **参数：**
  * `{Locale} locale`
* **返回值：** `LocaleMessageObject`
    
获取语言环境的 `locale` 信息。

#### setLocaleMessage( locale, message )

* **参数：**

  * `{Locale} locale`
  * `{LocaleMessageObject} message`

设置语言环境的 `locale` 信息。

#### mergeLocaleMessage( locale, message )

* **参数：**

  * `{Locale} locale`
  * `{LocaleMessageObject} message`

将语言环境信息 `locale` 合并到已注册的语言环境信息中。

#### messages

* **类型：**
```ts
readonly messages: ComputedRef<{
   [K in keyof Messages]: Messages[K];
}>;
```

* **只读**

局部或者全局的语言环境信息。

#### isGlobal
* **类型：**`Boolean`

是否是全局 i18n 实例。

#### t

文案翻译函数

* **参数：**

  * {Path} key：必填
  * {number} choice：可选
  * {Array | Object} values：可选

* **返回值：** TranslateResult

根据传入的 key 以及当前 locale 环境获取对应文案，文案来源是全局作用域还是本地作用域取决于 `useI18n` 执行时是否传入对应的 `messages、locale` 等值。

**choice 参数可选** ，当传入 choice 时，t 函数的表现为使用复数进行翻译，和老版本中的 tc 函数表现一致。

```html
<template>
  <view>{{t('car', 1)}}</view>
  <view>{{t('car', 2)}}</view>

  <view>{{t('apple', 0)}}</view>
  <view>{{t('apple', 1)}}</view>
  <view>{{t('apple', 10, {count: 10})}}</view>
</template>

<script>
  // 语言环境信息如下：
  const messages = {
    en: {
      car: 'car | cars',
      apple: 'no apples | one apple | {count} apples'
    }
  }
</script>
```
输入如下：
```html
<view>car</view>
<view>cars</view>

<view>no apples</view>
<view>one apple</view>
<view>10 apples</view>
```
关于复数的更多信息可以点击[查看](https://kazupon.github.io/vue-i18n/zh/guide/pluralization.html#%E5%A4%8D%E6%95%B0)

**values 参数可选** ，如果需要对文案信息即逆行格式化处理，则需要传入 values。

```html
<template>
  // 模版输出 hello world
  <view>{{t('message.hello', { msg: 'hello'})}}</view>
</template>
<script>
  import {createComponent, useI18n} from "@mpxjs/core"

  const messages = {
    en: {
      message: {
        hello: '{msg} world'
      }
    }
  }
  
  createComponent({
    setup(){
        const { t } = useI18n({
          messages: {
              'en-US': en
          }
        })
      return {t}
    }
  })

</script>
```

#### te
* **参数：**

  * {Path} key：必填
* **返回值：** boolean

检查 key 是否存在。


## useFetch

组合式 API 中使用，用来获取 `@mpxjs/fetch` 插件的 xfetch 实例，等用于 `mpx.xfetch`。 关于 xfetch 实例的详细介绍，请点击[查看](/api/extend.html#mpx-fetch)

示例：
```js
// app.mpx
import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'
mpx.use(mpxFetch)

// script-setup.mpx
import { useFetch } from '@mpxjs/core'
useFetch().fetch({
  url: 'http://xxx.com',
  method: 'POST',
  params: {
    age: 10
  },
  data: {
    name: 'test'
  },
  emulateJSON: true,
  usePre: true,
  cacheInvalidationTime: 3000,
  ignorePreParamKeys: ['timestamp']
}).then(res => {
  console.log(res.data)
})
```
