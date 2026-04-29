# Mpx 与 RN 混合开发

在 Mpx 输出 RN 的场景下，可以在 Mpx 单文件组件内直接使用 React Native 组件与 RN 代码（性能敏感等场景）。

## 目录

- [注册 RN 组件](#注册-rn-组件)
- [RN 组件样式](#rn-组件样式)
- [属性与事件](#属性与事件)
- [React Hooks 使用](#react-hooks-使用)
- [Hooks 返回值更新模板](#hooks-返回值更新模板)
- [跨端兼容隔离](#跨端兼容隔离)

---

## 注册 RN 组件

从 `react-native` 引入组件，在 `components` 中注册后即可在模板中使用；模板标签名与注册名一致，通常也与 RN 导出名一致。

**选项式 API**

```html
<template>
  <view>
    <View>
      <Text>RN Text</Text>
      <view>Mpx view</view>
      <slot name="myslot"></slot>
    </View>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'
  import { View, Text } from 'react-native'

  createComponent({
    components: { View, Text }
  })
</script>
```

**组合式 API（`defineOptions`）**

```html
<script setup>
  import { View, Text } from 'react-native'

  defineOptions({
    components: { View, Text }
  })

  defineExpose({})
</script>
```

---

## RN 组件样式

RN 模式下，编译器会将 `class` / `wx:class` / `style` / `wx:style` / `wx:show` 统一转换为 RN 组件最终接收的 `style`。`style` / `wx:style` 均支持字符串、对象与对象数组写法；其中 `style` 上的 RN 数组样式或 Animated style 对象会按 RN 原生样式继续透传，`wx:style` 作为动态样式参与合并。

```html
<template>
  <view>
    <Text style="color: red">字符串</Text>
    <Text style="{{ { color: 'red' } }}">对象</Text>
    <Text style="{{ [{ color: 'red' }] }}">数组</Text>
    <Text wx:style="color: red">wx:style 字符串</Text>
    <Text wx:style="{{ { color: 'red' } }}">wx:style 对象</Text>
    <Text wx:style="{{ [{ color: 'red' }] }}">wx:style 数组</Text>
  </view>
</template>
```

---

## 属性与事件

- RN 组件属性按 RN prop 名透传，模板里值用 Mpx 双括号绑定。
- RN 组件事件本质上也是事件 prop（如 `onTouchEnd`），直接按 RN 事件名透传，不使用 `bind` / `catch` 等 Mpx 事件指令。
- Mpx 内建组件与 Mpx 自定义组件仍使用 Mpx 事件语法。
- RN 模式下模板指令继续使用 `wx:` 前缀（如 `wx:if`、`wx:for`、`wx:style`、`wx:class`、`wx:show`）。
- 数据可来自 Mpx `data` / `computed`，或来自下方 Hooks 返回值。

```html
<template>
  <view>
    <Text numberOfLines="{{ 1 }}" onPress="{{ onTitlePress }}">
      {{ title }}
    </Text>
    <view bindtap="onMpxTap">Mpx view</view>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'
  import { Text } from 'react-native'

  createComponent({
    components: { Text },
    data: {
      title: 'RN Text'
    },
    methods: {
      onTitlePress() {
        console.log('RN Text press')
      },
      onMpxTap() {
        console.log('Mpx view tap')
      }
    }
  })
</script>
```

若 Hooks 返回值需要在模板上**随更新重渲染**，须配置 `disableMemo: true`（会关闭 RN 组件相关性能优化），见[Hooks 返回值更新模板](#hooks-返回值更新模板)。

---

## React Hooks 使用

通过 `REACTHOOKSEXEC` / `onReactHooksExec` 注册和执行 Hooks，返回值供模板绑定（展示、props、样式、事件等）。

**选项式 API**

```html
<template>
  <view>
    <View onTouchEnd="{{ onTouchEnd }}">
      <Text>Count: {{ count }}</Text>
    </View>
  </view>
</template>

<script>
  import { createComponent, REACTHOOKSEXEC } from '@mpxjs/core'
  import { View, Text } from 'react-native'
  import { useState } from 'react'

  createComponent({
    components: { View, Text },
    [REACTHOOKSEXEC]() {
      const [count, setCount] = useState(0)
      const onTouchEnd = () => {
        setCount((c) => c + 1)
      }
      return { count, onTouchEnd }
    }
  })
</script>
```

**组合式 API**

```html
<script setup>
  import { onReactHooksExec } from '@mpxjs/core'
  import { View, Text } from 'react-native'
  import { useState } from 'react'

  defineOptions({
    components: { View, Text }
  })

  onReactHooksExec(() => {
    const [count, setCount] = useState(0)
    const onTouchEnd = () => setCount((c) => c + 1)
    return { count, onTouchEnd }
  })

  defineExpose({})
</script>
```

---

## Hooks 返回值更新模板

Mpx 输出 RN 时默认会从性能角度对视图更新做 memo 优化：只有模板中使用的 Mpx 响应式数据发生变化时才会重新更新视图，其余场景会复用上一次渲染结果，避免不必要的视图更新。

混合开发中通过 `REACTHOOKSEXEC` / `onReactHooksExec` 返回的数据本身不具备 Mpx 响应性，因此这类数据变化时不会触发模板更新。若模板依赖 Hooks 返回值并需要随其变化更新视图，需要配置 `disableMemo: true` 关闭该优化，规避视图不更新的非预期表现：

**选项式**

```js
createComponent({
  // ...
  options: {
    disableMemo: true
  }
})
```

**组合式**

```js
defineOptions({
  // ...
  options: {
    disableMemo: true
  }
})
```

---

## 跨端兼容隔离

RN 混合开发通常会引入 `react-native` 组件、RN 专属属性或 React Hooks 逻辑，这些内容无法直接在小程序、Web 等原平台中运行。为了保持跨端兼容性，混编代码需要通过条件编译做好隔离，避免非 RN 平台解析到 RN 专属依赖或语法。

平台差异较大时，优先使用文件维度条件编译，将 RN 实现放到独立文件中：

```text
components/
├── hybrid-card.mpx      # 原平台实现
└── hybrid-card.ios.mpx  # RN 实现，可按需补充 .android.mpx / .harmony.mpx
```

局部差异较小时，可以使用模板条件编译隔离 RN 专属属性或少量节点：

```html
<template>
  <view>
    <text
      class="title"
      numberOfLines@ios|android|harmony="{{ 1 }}"
    >
      {{ title }}
    </text>
    <view @_ios|_android|_harmony class="rn-extra">RN extra content</view>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    data: {
      title: 'Hybrid title'
    }
  })
</script>
```

如果需要在模板中直接使用 RN 组件，通常更建议放在 RN 条件文件中实现，避免原平台构建解析 `react-native` 依赖；局部条件编译更适合隔离 RN 专属属性、少量模板节点或已经处在 RN 条件文件内部的局部差异。
