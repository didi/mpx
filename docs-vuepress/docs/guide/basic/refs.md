# 获取组件实例/节点信息

微信小程序中原生提供了`selectComponent/SelectorQuery.select`方法获取自定义组件实例和wxml节点信息，但是该api使用起来不太方便，并且不具备平台无关性，我们提供了增强指令`wx:ref`用于获取组件实例及节点信息，该指令的使用方式同vue中的ref类似，在模板中声明了`wx:ref`后，在组件ready后用户可以通过`this.$refs`获取对应的组件实例或节点查询对象(NodeRefs)，调用响应的组件方法或者获取视图节点信息。

> `wx:ref`其实也是模板编译和运行时注入结合实现的语法糖，本质还是通过原生小程序平台提供的能力进行获取，其实现的主要意义在于抹平跨平台差异以及提升用户的使用体验。

简单的使用示例如下：

```html
  <template>
    <view class="container">
      <!-- my-header 为一个组件，组件内部定义了一个 show 方法 -->
      <my-header wx:ref="myHeader"></my-header>
      <view wx:ref="content"></view>
    </view>
  </template>

  <script>
    import { createComponent } from '@mpxjs/core'

    createComponent({
      ready() {
        // 通过 this.$refs 获取view的节点查询对象
        this.$refs.content.fields({size: true},function (res){
          // res 就是我们要拿到的节点大小
        }).exec()
        // 通过 this.$refs 可直接获取组件实例
        this.$refs.myHeader.show()  // 拿到组件实例，调用组件内部的方法
      }
    })
  </script>
```

## 在列表渲染中使用`wx:ref`

在列表渲染中定义的`wx:ref`存在多个实例/节点，Mpx会在模板编译中判断某个`wx:ref`是否存在于列表渲染`wx:for`中，是的情况下在注入`this.$refs`时会通过`selectAllComponents/SelectQuery.selectAll`方法获取组件实例数组或数组节点查询对象，确保开发者能拿到列表渲染中所有的组件实例/节点信息。

使用示例如下：

```html
<template>
  <view>
    <!-- list 组件 -->
    <list wx:ref="list" wx:for="{{listData}}" data="{{item.name}}" wx:key="id"></list>
    <!-- view 节点 -->
    <view wx:ref="test" wx:for="{{listData}}" wx:key="id">{{item.name}}</view>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    data: {
      listData: [
        {id: 1, name: 'A'},
        {id: 2, name: 'B'},
        {id: 3, name: 'C'},
      ]
    },
    ready () {
      // 通过 this.$refs.list 获取的是组件实例的数组
      this.$refs.list.forEach(item => {
        // 对每一个组件实例的操作...
      })
      // 通过 this.$refs.test 获取的是节点查询对象，通过相关的方法操作节点
      this.$refs.test.fields({size: true}, function (res) {
        // 此处拿到的 res 是一个数组，包含了列表渲染中的所有节点的大小信息
      }).exec()
    }
  })
</script>

```
