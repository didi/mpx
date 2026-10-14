# 混合编写 RN {#hybrid-rn}

在编写 Mpx 组件时，在某些出于性能考虑的特定情况下，可能会涉及到 Mpx 和 RN 混合编写：**在 Mpx 项目内直接使用 RN 组件和编写 RN 代码**。

## 混合使用 RN 组件 {#hybrid-use-rn-component}

### RN 组件注册 {#rn-component-register}

在 Mpx 组件内引用 RN 组件，需在 `components` 选项中进行注册。

#### 选项式 API {#options-api}

```html {4,6,20-23}
<template>
  <view>
    <!-- RN View 组件 -->
    <View>
      <!-- RN Text 组件 -->
      <Text> 我是 RN 组件 </Text>
      <!-- Mpx 组件 -->
      <view> 我是 Mpx 组件 </view>
      <!-- 支持在 RN 组件内部定义插槽 -->
      <slot name="myslot"></slot>
    </View>
  </view>
</template>

<script>
  import { createComponent } from "@mpxjs/core"
  import { View, Text } from "react-native"

  createComponent({
    components: {
      View,
      Text,
    },
  })
</script>
```

#### 组合式 API {#composition-api}

组合式 API 需要在 [defineOptions](../composition-api/composition-api.md#defineoptions) 中进行类似选项式 API 的 `components` 组件注册。

```html {4-9}
<script setup>
  import { View, Text } from "react-native"

  defineOptions({
    components: {
      View,
      Text,
    },
  })

  defineExpose({})
</script>
```

### RN 组件样式属性 style {#rn-component-style}

RN 组件支持样式属性的透传，`style/wx:style` 样式属性用法与小程序一致，并且额外支持 RN 数组样式定义方式。

```html
<template>
  <view>
    <!-- style -->
    <Text style="color: red"> 字符串形式 value </Text>
    <Text style="{{ {color: 'red'} }}"> 对象形式样式 value </Text>
    <Text style="{{ [{color: 'red'}] }}"> 数组形式样式 value </Text>
    <!-- wx:style -->
    <Text wx:style="color: red"> 字符串形式 value </Text>
    <Text wx:style="{{ {color: 'red'} }}"> 对象形式样式 value </Text>
    <Text wx:style="{{ [{color: 'red'}] }}"> 数组形式样式 value </Text>
  </view>
</template>
```

### RN 组件的属性与事件 {#rn-component-props-events}

- RN 组件属性与事件参考 RN 原生支持的属性与事件名，对应赋值方式按照 Mpx 语法进行双括号包裹。
- 组件使用的值既可以沿用 Mpx 组件的 `data`、`computed` 等响应式数据，也可以通过 [使用 React Hooks](#use-react-hooks) 返回值进行声明。

> [!important] 注意
> 使用 React Hooks 导出的变量如果需要在模板上进行响应式更新，需要配合组件设置 `disableMemo: true` 使用，详见下方[配合模板响应式](#with-template-reactivity)。

## 使用 React Hooks {#use-react-hooks}

### 选项式 API {#options-api-1}

Mpx 提供了 React Hooks 执行机制，通过在 Mpx 组件内注册 `REACTHOOKSEXEC` 方法，保障 RN 组件的初始化执行。Hooks 的返回值支持数据与方法，比如：

- 模板上 RN 组件与 Mpx 组件的数据渲染
- 模板上的 props 传递
- 模板上的样式定义
- 模板上的事件的绑定与透传

```html {19}
<template>
  <view>
    <View onTouchEnd="{{ onTouchEnd }}">
      <Text> Count: {{ count }} </Text>
    </View>
  </view>
</template>

<script>
  import { createComponent, REACTHOOKSEXEC } from "@mpxjs/core"
  import { View, Text } from "react-native"
  import { useState } from "react"

  createComponent({
    components: {
      View,
      Text,
    },
    [REACTHOOKSEXEC]() {
      // 所有使用 hooks 的部分在此处进行注册与执行
      const [count, setCount] = useState(0)
      const onTouchEnd = () => {
        console.log("trigger event: onTouchEnd")
        setCount((count) => count + 1)
      }
      // 返回值可直接用于模板
      return {
        count,
        onTouchEnd,
      }
    },
  })
</script>
```

### 组合式 API {#composition-api-1}

Mpx 也支持组合式 API 的使用，使用方式与选项式 API 类似，均在 `onReactHooksExec` 方法内进行 hooks 的注册与执行

```html {13}
<script setup>
  import { onReactHooksExec } from "@mpxjs/core"
  import { View, Text } from "react-native"
  import { useState } from "react"

  defineOptions({
    components: {
      View,
      Text,
    },
  })

  onReactHooksExec(() => {
    const [count, setCount] = useState(0)
    const onTouchEnd = () => {
      console.log("trigger event: onTouchEnd")
      setCount((count) => count + 1)
    }
    return {
      count,
      onTouchEnd,
    }
  })

  defineExpose({})
</script>
```

### 配合模板响应式 {#with-template-reactivity}

如果你尝试了上面的示例代码，可能会好奇为什么点击后控制台正常打印了日志 `trigger event: onTouchEnd`，但是模板上的 `count` 并没有更新呢？

这是因为出于性能优化的考虑，Mpx 默认不会对 React Hooks 返回值进行响应式更新。 如果需要对使用 React Hooks 返回的变量在模板上进行响应式更新，可以通过在组件的 `options` 选项中配置 `disableMemo: true` 来开启，开启后也会关闭 RN 组件的性能优化。

选项式 API：

```js {4}
createComponent({
  // ...
  options: {
    disableMemo: true,
  },
})
```

组合式 API：

```js {4}
defineOptions({
  // ...
  options: {
    disableMemo: true,
  },
})
```

## 独立页面包裹 {#standalone-page-wrapper}

在已有 Mpx RN 运行环境中独立接入页面时，可通过 `pageWrapperHOC` 包裹页面组件，整合导航栏、手势根容器、页面布局与安全区信息、键盘避让、页面上下文和 Portal 能力。宿主需要提供 React Navigation 的 `navigation`、`route`，并在外层提供 `SafeAreaProvider`。

```js
import { pageWrapperHOC } from '@mpxjs/core'

const WrappedPage = pageWrapperHOC(PageComponent, {
  navigationBarTitleText: '独立页面'
})
// 在宿主的导航 Screen 中使用 WrappedPage，传入 navigation 和 route。
```

`navigationStyle: 'custom'` 时不展示默认导航栏，`disableKeyboardAvoiding: true` 时不添加键盘避让容器。应用内页面由框架自动添加外层容器，无需重复包裹。独立页面产物直接导出原页面，由使用方调用上述 `pageWrapperHOC` 并传入页面配置后，再接入宿主导航。

应用内的外层容器会在异步页面加载期间提前挂载，并在 App 的 `onLaunch/onShow` 前初始化窗口信息；外层同时生成稳定的 `pageId`，通过 `RouteContext` 提供页面身份并挂载 Portal。页面聚焦状态和预加载仍随真实页面挂载，不在加载占位阶段提前执行。页面内部仅保留实例和生命周期相关逻辑，不再调用 `pageWrapperHOC`，也不依赖 Context 跳过重复容器。

页面身份通过实例的 `getPageId()` 获取；框架不再把内部 `pageId` 注入页面的 `id` props。`id` 仍表示调用方传入的节点标识，不能作为内部页面身份使用。
