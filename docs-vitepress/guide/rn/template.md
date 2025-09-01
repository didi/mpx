## 模版指令

### 支持范围

在 React Native 环境下，Mpx 目前支持以下模板指令。详细的指令使用方法请参考 [模板指令 API 文档](/api/directives.html)。

#### 基础模板指令

| 指令 | 支持状态 | 说明 |
|------|---------|------|
| [wx:if](/api/directives.html#wx-if) | ✅ | 条件渲染 |
| [wx:else](/api/directives.html#wx-else) | ✅ | 条件渲染 |
| [wx:elif](/api/directives.html#wx-elif) | ✅ | 条件渲染 |
| [wx:show](/api/directives.html#wx-show) | ✅ | 显示/隐藏控制 |
| [wx:for](/api/directives.html#wx-for) | ✅ | 列表渲染 |
| [wx:for-item](/api/directives.html#wx-for-item) | ✅ | 指定循环项变量名 |
| [wx:for-index](/api/directives.html#wx-for-index) | ✅ | 指定循环索引变量名 |

#### 增强模板指令

| 指令 | 支持状态 | 说明 |
|------|---------|------|
| [wx:class](/api/directives.html#wx-class) | ✅ | 动态类名绑定 |
| [wx:style](/api/directives.html#wx-style) | ✅ | 动态样式绑定 |
| [wx:model](/api/directives.html#wx-model) | ✅ | 双向数据绑定 |
| [wx:model-prop](/api/directives.html#wx-model-prop) | ✅ | 双向绑定属性 |
| [wx:model-event](/api/directives.html#wx-model-event) | ✅ | 双向绑定事件 |
| [wx:model-value-path](/api/directives.html#wx-model-value-path) | ✅ | 双向绑定数据路径 |
| [wx:model-filter](/api/directives.html#wx-model-filter) | ✅ | 双向绑定过滤器 |
| [wx:ref](/api/directives.html#wx-ref) | ⚠️ | 获取基础组件节点或自定义组件实例，RN 环境选择器受限 |

#### 条件编译指令

| 指令 | 支持状态 | 说明 |
|------|---------|------|
| [@mode](/api/directives.html#mode) | ✅ | 平台条件编译 |
| [@_mode](/api/directives.html#mode-1) | ✅ | 平台条件编译（保留转换能力）|
| [@env](/api/directives.html#env) | ✅ | 自定义环境条件编译 |
| [mpxTagName](/api/directives.html#mpxtagname) | ✅ | 动态标签名 |

### 特殊说明

#### wx:ref 使用注意事项

在 RN 环境下使用 `wx:ref` 时需要注意选择器功能的限制：

* 选择器仅支持 id 选择器（`#id`）和 class 选择器（`.class`）

```html
<template>
  <!-- 基础组件 -->
  <view wx:ref="tref">123</view>
  <!-- 自定义组件 -->
  <test-component wx:ref="cref"></test-component>
</template>

<script>
import { createPage } from "@mpxjs/core"

createPage({
  ready() {
    // 基础节点 nodeRef 获取节点信息
    this.$refs.tref.fields({size: true}, function (res) {
      console.log(res)
    }).exec()
    
    // 获取自定义组件实例，调用组件方法
    this.$refs.cref.show()
  }
})
</script>
```

## 事件

在 React Native 环境下，Mpx 目前支持以下事件编写规范。

普通事件绑定
```js
<view bindtap="handleTap">
    Click here!
</view>
```

绑定并阻止事件冒泡
```js
<view catchtap="handleTap">
    Click here!
</view>
```

事件捕获

```js
<view capture-bind:touchstart="handleTap1">
  outer view
  <view capture-bind:touchstart="handleTap2">
    inner view
  </view>
</view>
```

中断捕获阶段和取消冒泡阶段

```js
<view capture-catch:touchstart="handleTap1">
  outer view
</view>

```

在此基础上也新增了事件处理内联传参的增强机制。

```html
<template>
 <!--Mpx增强语法，模板内联传参，方便简洁-->
 <view bindtap="handleTapInline('inline')">内联传参</view>
 </template>
 <script setup>
  // 直接通过参数获取数据，直观方便
  const handleTapInline = (params) => {
    console.log('params:', params)
  }
  // ...
</script>
```

除此之外，Mpx 也支持了动态事件绑定

```html
<template>
 <!--动态事件绑定-->
 <view wx:for="{{items}}" bindtap="handleTap_{{index}}">
  {{item}}
</view>
 </template>
 <script setup>
  import { ref } from '@mpxjs/core'

  const items = ref(['Item 1', 'Item 2', 'Item 3', 'Item 4'])
  const handleTap_0 = (event) => {
    console.log('Tapped on item 1');
  },

  const handleTap_1 = (event) => {
    console.log('Tapped on item 2');
  },

  const handleTap_2 = (event) => {
    console.log('Tapped on item 3');
  },

  const handleTap_3 = (event) => {
    console.log('Tapped on item 4');
  }
</script>
```

更多事件相关内容可以查看 [Mpx 事件处理](../basic/event.md)

注意事项

1. 当使用了事件委托想获取 e.target.dataset 时，只有点击到文本节点才能获取到，点击其他区域无效。建议直接将事件绑定到事件触发的元素上，使用 e.currentTarget 来获取 dataset 等数据。
2. 由于 tap 事件是由 touchend 事件模拟实现，所以在 RN 环境，如果子组件绑定了 catchtouchend，那么父组件的 tap 事件将不会响应。
3. 如果元素上设置了 opacity: 0 的样式，会导致 ios 事件无法响应。
   
## 生命周期
RN 环境支持 Mpx 除 SSR 外所有生命周期钩子，关于生命周期的完整说明和最佳实践，请参考 [**生命周期详细文档**](/guide/basic/lifecycle.html)。