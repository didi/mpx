# 自定义组件

Mpx中的自定义组件完全基于小程序原生的自定义组件支持，与此同时，Mpx提供的数据响应和模板增强等一系列增强能力都能在自定义组件中使用。

原生自定义组件的规范详情查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html)

## 动态组件

Mpx中提供了使用方法类似于 Vue 的动态组件能力，这是一个基于 wx:if 实现的语法。通过对 `is` 属性进行动态绑定，可以实现在同一个挂载点切换多个组件，前提需要动态切换的组件已经在全局或者组件中完成注册。
使用示例如下：

```html
<view>w
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

在自定义组件中，我们经常需要向一个组件传递内容，即通过插槽分发内容。在 Mpx 中完全支持微信小程序内置的 `slot` 用法，详情[戳这里](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html)。

我们可以通过在组件中提供一个 `<slot>` 节点来承载组件被引用时组件标签中嵌入的子节点内容。示例：

+ 子组件：alert.mpx

```html
<template>
  <view class="alert">
    <slot></slot>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    data: {
    }
  })
</script>

<style lang="stylus">
  .alert
    background-color red
</style>

<script type="application/json">
  {
    "component": true
  }
</script>

``` 

+ 父组件：index.mpx

```html
<template>
  <view class="cover-page">
    <alert>
      <view>这些是 slot 中的内容</view>
    </alert>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'
  createPage({
    data: {
    }
  })
</script>

<script type="application/json">
  {
    "usingComponents": {
      "alert": "../components/alert"
    }
  }
</script>

```

默认情况下，一个模板中只能包含一个 `<slot></slot>`，如果需要多个 slot，需要在 js 中通过设置 `options.multipleSlots` 启用。多个 `slot` 用 `name` 属性区分，在父组件中分发时，需要为分发内容设置 `slot="someSlotName"` 来指定承接该内容的插槽，someSlotName 是某个子组件 `slot` 标签的 `name` 属性值。 

示例：
+ panel.mpx

```html
<template>
  <view class="alert">
    <!-- 多个 slot 用 name 区分 -->
    <slot name="header"></slot>
    <slot name="body"></slot>
    <slot name="footer"></slot>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    options: {
      multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    data: {
    }
  })
</script>

<style lang="stylus">
</style>

<script type="application/json">
  {
    "component": true
  }
</script>

```   

+ 父组件：index.mpx

```html
<template>
  <view class="cover-page">
    <panel>
      <!-- 分发时通过 slot="xxx" 指定承接的插槽 -->
      <view slot="header">这是 header</view>
      <view slot="body">这是 body</view>
      <view slot="footer">这是 footer</view>
    </panel>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'
  createPage({
    data: {}
  })
</script>

<script type="application/json">
  {
    "usingComponents": {
      "panel": "../components/panel"
    }
  }
</script>

```
