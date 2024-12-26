# 列表渲染

在组件上使用 wx:for 控制属性绑定一个数组，即可使用数组中各项的数据重复渲染该组件。

默认数组的当前项的下标变量名默认为 index，数组当前项的变量名默认为 item。

> 值得注意的是wx:key与Vue中的key属性的区别，不能使用数据绑定，只能传递普通字符串将数组item中的对应属性作为key，或者传入保留关键字*this将item本身作为key

下面是简单示例：

```html
<template>
  <!-- 使用数组中元素的 id属性/保留关键字*this 作为key值  -->
  <view wx:for="{{titleList}}">
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

使用 wx:for-item 可以指定数组当前元素的变量名，

使用 wx:for-index 可以指定数组当前下标的变量名：

```js
<view wx:for="{{array}}" wx:for-index="idx" wx:for-item="itemName">
  {{idx}}: {{itemName.name}}
</view>
```

wx:for 也可以嵌套，下边是一个九九乘法表:

```html
<view wx:for="{{[1, 2, 3, 4, 5, 6, 7, 8, 9]}}" wx:for-item="i">
  <view wx:for="{{[1, 2, 3, 4, 5, 6, 7, 8, 9]}}" wx:for-item="j">
    <view wx:if="{{i <= j}}">
      {{i}} * {{j}} = {{i * j}}
    </view>
  </view>
</view>
```

### block wx:for

也可以将 wx:for 用在 `<block/>` 标签上，以渲染一个包含多节点的结构块：

```html
<block wx:for="{{[1, 2, 3]}}">
  <view> {{index}}: </view>
  <view> {{item}} </view>
</block>
```

### wx:key


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

