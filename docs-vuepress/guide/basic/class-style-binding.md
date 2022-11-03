# 类名样式绑定

Mpx利用wxs完整实现了Vue中的类名样式绑定，性能优良且没有任何使用限制（很多小程序框架基于字符串解析来实现该能力，只支持在模板上写简单的字面量，大大限制了使用场景）

## 类名绑定

类名绑定的增强指令是wx:class，可以与普通的class属性同时存在，在视图渲染中进行合成。

### 对象语法

wx:class中传入对象，key值为类名，value值控制该类名是否生效。

```html
<template>
  <!--支持传入对象字面量，此处视图的class="outer active"-->
  <view class="outer" wx:class="{{ {active:active, disabled:disabled} }}">
    <!--直接直接传入对象数据，此处视图的class="inner selected"-->
    <view class="inner" wx:class="{{innerClass}}"></view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      active: true,
      disable: false,
      innerClass: {
        selected: true
      }
    }
  })
</script>
```

### 数组语法

wx:class中传入字符串数组，字符串为类名。

```html
<template>
  <!--支持传入数组字面量，此处视图的class="outer active danger"-->
  <view class="outer" wx:class="{{ ['active', 'danger'] }}">
    <!--直接直接传入数组数据，此处视图的class="inner selected"-->
    <view class="inner" wx:class="{{innerClass}}"></view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      innerClass: ['selected']
    }
  })
</script>
```

## 样式绑定


样式的增强指令是wx:style，可以与普通的style属性同时存在，在视图渲染中进行合成。

### 对象语法

wx:style中传入用样式对象，带有横杠的样式名可以用驼峰写法来代替

```html
<template>
  <!--支持传入对象字面量，模板会显得杂乱，此处视图的style="color:red;font-size:16px;font-weight:bold;"-->
  <view style="color:red;" wx:style="{{ {fontSize:'16px', fontWeight:'bold'} }}">
    <!--更好的方式是直接传入对象数据，此处视图的style="color:blue;font-size:14px;"-->
    <view wx:style="{{innerStyle}}"></view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      innerStyle: {
        color: 'blue',
        fontSize: '14px'
      }
    }
  })
</script>
```

### 数组语法

wx:style同样支持传入数组将多个样式合成应用到视图上

```html
<template>
  <!--此处视图的style="color:blue;font-size:14px;background-color:red;"-->
  <view wx:style="{{ [baseStyle, activeStyle] }}">

  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      baseStyle: {
        color: 'blue',
        fontSize: '14px'
      },
      activeStyle:{
        backgroundColor: 'red'
      }
    }
  })
</script>
```

