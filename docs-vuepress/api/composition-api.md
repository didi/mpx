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
interface SetupContext {
    triggerEvent(
       name: string,
       detail?: object, // detail对象，提供给事件监听函数
       options?: {
         bubbles?: boolean
         composed?: boolean
         capturePhase?: boolean
       }
    ): void
    refs: ObjectOf<NodesRef & ComponentIns>
    asyncRefs: ObjectOf<Promise<NodesRef & ComponentIns>> // 字节小程序特有
    nextTick: (fn: () => void) => void
    forceUpdate: (params?: object, callback?: () => void) => void
    selectComponent(selector: string): ComponentIns
    selectAllComponents(selector: string): ComponentIns[]
    createSelectorQuery(): SelectorQuery
    createIntersectionObserver(
      options: {
        thresholds?: Array<number>
        initialRatio?: number
        observeAll?: boolean
      }
    ): IntersectionObserver}

function setup(props: Record<string, any>, context: SetupContext): Record<string, any>
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

### onBeforeMount
`Function`

在组件布局完成后执行，refs 相关的前置工作在该钩子中执行。

### onMounted
`Function`

在组件布局完成后执行，refs 可以直接获取。

### onBeforeUpdate
`Function`

在数据发生改变后，组件/页面更新之前被调用。这里适合在现有组件/页面将要被更新之前访问它，
比如移除某个手动添加的监听器，或者获取某个元素更新前的高度。

### onUpdated
`Function`

在数据更改导致的页面/组件重新渲染和更新完毕之后被调用。

注意，onUpdated 不会保证所有的子组件也都被重新渲染完毕。如果你希望等待整个视图都渲染完毕，可以在 onUpdated 内部使用 nextTick。

### onBeforeUnmount
`Function`

在卸载组件/页面实例之前调用。在这个阶段，实例仍然是完全正常的。

### onUnmount
`Function`

卸载组件实例后调用。调用此钩子时，组件实例的所有指令都被解除绑定，所有事件侦听器都被移除。

### onLoad
`Function`

小程序页面 onLoad 事件，监听页面加载。

### onShow
`Function`

小程序页面 onShow 事件，监听页面展示。

### onHide
`Function`
小程序页面 onHide 事件，监听页面隐藏。

### onResize
`Function`

小程序页面 onResize 事件，页面尺寸改变时触发。

### onPullDownRefresh
`Function`

小程序监听用户下拉刷新事件。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onPullDownRefresh)

### onReachBottom
`Function`

小程序监听用户上拉触底事件。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onReachBottom)

### onShareAppMessage
`Function`

小程序监听用户点击页面内转发按钮（button 组件 open-type="share"）或右上角菜单“转发”按钮的行为，并自定义转发内容。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareAppMessage-Object-object)

### onShareTimeline
`Function`

小程序监听右上角菜单“分享到朋友圈”按钮的行为，并自定义分享内容。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareTimeline)

**注意：** 仅微信小程序支持

### onAddToFavorites
`Function`

小程序监听用户点击右上角菜单“收藏”按钮的行为，并自定义收藏内容。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onAddToFavorites-Object-object)

**注意：** 仅微信小程序支持

### onPageScroll
`Function`

小程序监听用户滑动页面事件。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onPageScroll-Object-object)

### onTabItemTap
`Function`

点击 tab 时触发。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onTabItemTap-Object-object)

### onSaveExitState
`Function`

每当小程序可能被销毁之前，页面回调函数 onSaveExitState 会被调用，可以进行退出状态的保存。[详细介绍](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onSaveExitState)

**注意：** 仅微信小程序支持


### onServerPrefetch
- **类型：** `Function`
- **详细：**

SSR渲染定制钩子，在服务端渲染期间被调用，可以实现在服务端进行数据预取。

**注意：** 仅 web 环境支持


## getCurrentInstance

getCurrentInstance 支持访问内部组件实例。

- **注意：**

getCurrentInstance 只暴露给高阶使用场景，典型的比如在库中。强烈反对在应用的代码中使用 getCurrentInstance。请不要把它当作在组合式 API 中获取 this 的替代方案来使用。

getCurrentInstance 只能在 setup 或生命周期钩子中调用。

## useI18n
点击[查看详情](./extend.md#usei18n)

## useFetch
点击[查看详情](./extend.md#usefetch)
