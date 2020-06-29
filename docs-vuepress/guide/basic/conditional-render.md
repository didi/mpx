# 条件渲染

Mpx中的条件渲染与原生小程序中完全一致，详情可以查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/conditional.html)

简单示例如下:

```html
<template>
  <view class="container">
    <!-- 通过 wx:if 的语法来控制需要渲染的元素 -->
    <view wx:if="{{ score > 90 }}"> A </view>
    <view wx:elif="{{ score > 60 }}"> B </view>
    <view wx:else> C </view>

    <!-- 通过 wx:show 来控制元素的显示隐藏-->
    <view wx:show="{{ score > 90 }}"> very good! <view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      score: 80
    }
  })
</script>
```
