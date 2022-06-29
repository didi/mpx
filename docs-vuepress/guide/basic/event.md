# 事件处理

Mpx在事件处理上基于原生小程序，支持原生小程序的全部事件处理技术规范，在此基础上新增了事件处理内联传参的增强机制。

原生小程序事件处理详情请参考[这里](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html)

增强的内联传参能力对于传递参数的个数和类型没有特殊限制，可以传递各种字面量，可以传递组件数据，甚至可以传递for中的item和index，
当内联事件处理器中需要访问原始事件对象时，可以传递`$event`特殊关键字作为参数，在事件处理器的对应参数位置即可获取。

示例如下：

#### 原生小程序语法，dataset传参
```html
<template>
    <button data-name="a" bindtap="handleTap">a</button>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    methods: {
      handleTap (e) {
        console.log('name:', e.target.dataset.name)
      }
    }
  })
</script>
```


#### Mpx增强语法，模板内联传参
```html
<template>
   <button bindtap="handleTapInline('b')">b</button>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    methods: {
      // 直接通过参数获取数据，直观方便
      handleTapInline (name) {
        console.log('name:', name)
      }
    }
  })
</script>
```

#### 参数支持传递字面量和组件数据
```html
<template>
  <button bindtap="handleTapInline(name)"></button>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    data: {
      name: 'a'
    },
    methods: {
      // 直接通过参数获取数据，直观方便
      handleTapInline (name) {
        console.log('name:', name)
      }
    }
  })
</script>
```
#### 参数支持传递for作用域下的item/index
```html
<template>
    <button wx:for="{{names}}" bindtap="handleTapInline(item)">{{item}}</button>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    data: {
      names: ['d', 'e', 'f']
    },
    methods: {
      // 直接通过参数获取数据，直观方便
      handleTapInline (name) {
        console.log('name:', name)
      }
    }
  })
</script>
```

#### $event特殊关键字传参
```html
<template>
    <!-- 需要使用原始事件对象时可以传递$event特殊关键字 -->
    <button bindtap="handleTapInlineWithEvent('g', $event)">g</button>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    methods: {
      handleTapInlineWithEvent (name, e) {
        console.log('name:', name)
        console.log('event:', e)
      }
    }
  })
</script>
```
