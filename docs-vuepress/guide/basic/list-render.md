# 列表渲染

Mpx中的列表渲染与原生小程序中完全一致，详情可以查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/list.html)

> 值得注意的是wx:key与Vue中的key属性的区别，不能使用数据绑定，只能传递普通字符串将数组item中的对应属性作为key，或者传入保留关键字*this将item本身作为key

下面是简单示例：

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

## 特殊处理

当列表中一些需要特殊二次处理的数据，可参考下列两种方式


### computed方式

```html
<template>
  <!-- 使用数组中元素的 id属性/保留关键字*this 作为key值  -->
  <view wx:for="{{refactorTitleList}}" wx:key="id">
    <!-- item 默认代表数组的当前项 -->
    <view>{{item.id}}: {{item.name}}</view>
    <!-- bad方式 不可用computed或methods中方法处理 -->
    <!-- <view>{{item.id}}: {{format(item.name)}}</view> -->
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
      ],
      nameMap: {
        '1': 'mpx'
      }
    },
    computed: {
      refactorTitleList () {
        return this.titleList.map(item => {
          // 列表中需要特殊处理的数据可在computed中处理好再渲染
          item.name = this.nameMap[item.id] ? this.nameMap[item.id] : item.name
          return item
        })
      }
    }
  })
</script>
```


### wxs方式

```html
<template>
  <wxs module="foo">
    var formatName = function (item, nameMap) {
      // 这里区别string和number
      var id = ''+item.id
      if(nameMap[id]){
        return nameMap[id];
      }
      return item.name;
    }
    module.exports = {
      formatName: formatName
    };
  </wxs>
  <!-- 使用数组中元素的 id属性/保留关键字*this 作为key值  -->
  <view wx:for="{{titleList}}" wx:key="id">
    <!-- item 默认代表数组的当前项 -->
    <view>{{item.id}}: {{foo.formatName(item, nameMap)}}</view>
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
      ],
      nameMap: {
        '1': 'mpx'
      }
    }
  })
</script>
```

