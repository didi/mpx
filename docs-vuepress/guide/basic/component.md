# 自定义组件

Mpx中的自定义组件完全基于小程序原生的自定义组件支持，与此同时，Mpx提供的数据响应和模板增强等一系列增强能力都能在自定义组件中使用。

原生自定义组件的规范详情查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html)

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

简单示例如下：

```html
<!-- 组件模板 -->
<!-- components/mySlot.mpx -->

<view>
  <view>这是组件模板</view>
  <slot name="slot1"></slot>
  <slot name="slot2"></slot>
</view>
```

下面是引入 `mySlot` 组件的页面

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
  },
  // ...
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

更多详情可查看[这里](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html)
