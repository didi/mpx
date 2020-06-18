# 列表渲染

Mpx中的列表渲染与原生小程序中完全一致，详情可以查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/list.html)

> 值得注意的是wx:key与Vue中的key属性的区别，不能使用数据绑定，只能传递普通字符串将数组item中的对应属性作为key，或者传入保留关键字*this将item本身作为key

下面是简单示例：

todo 补充示例

```html
<template>
  <!-- 使用数组中元素的 id属性/保留关键字*this 作为key值  -->
  <view wx:for="{{titleList}}" wx:key="id">
    <!-- item 默认代表数组的当前项 -->
    <view>{{item.id}}: {{item.name}}</view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      titleList: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' }
      ]
    }
  })
</script>
```
