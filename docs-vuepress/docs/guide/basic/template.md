# 模板语法

Mpx中的模板语法以小程序模板语法为基础，支持小程序的全部模板语法，同时提供了一系列增强的模板指令及语法。

小程序原生模板语法请参考[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/)

Mpx提供的增强指令语法如下：

* [wx:style动态样式](./class-style-binding.md#样式绑定)
* [wx:class动态类名](./class-style-binding.md#类名绑定)
* [wx:model双向绑定](./two-way-binding.md)
* [wx:model-prop双向绑定属性](./two-way-binding.md#更改双向绑定的监听事件及数据属性)
* [wx:model-event双向绑定事件](./two-way-binding.md#更改双向绑定的监听事件及数据属性)
* [wx:model-value-path双向绑定数据路径](./two-way-binding.md#更改双向绑定事件数据路径)
* [wx:model-filter双向绑定过滤器](./two-way-binding.md#双向绑定过滤器)
* [wx:ref获取实例](./refs.md)
* [wx:show隐藏显示](./conditional-render.md)
* [component动态组件](./component.md#动态组件)
* [事件处理内联传参](./event.md)
* [模板条件编译](./template.md)

下面是使用了模板增强语法的一个简单实例，许多在原生小程序上很繁琐的模板描述在增强语法的帮助下变得清晰简洁：

```html
<template>
  <!--动态样式-->
  <view class="container" wx:style="{{dynamicStyle}}">
    <!--数据绑定-->
    <view class="title">{{title}}</view>
    <!--计算属性数据绑定-->
    <view class="title">{{reversedTitle}}</view>
    <view class="list">
      <!--循环渲染，动态类名，事件处理内联传参-->
      <view wx:for="{{list}}" wx:key="id" class="list-item" wx:class="{{ {active:item.active} }}"
            bindtap="handleTap(index)">
        <view>{{item.content}}</view>
        <!--循环内部双向数据绑定-->
        <input type="text" wx:model="{{list[index].content}}"/>
      </view>
    </view>
    <!--自定义组件获取实例，双向绑定，自定义双向绑定属性及事件-->
    <custom-input wx:ref="ci" wx:model="{{customInfo}}" wx:model-prop="info" wx:model-event="change"/>
    <!--动态组件，is传入组件名字符串，可使用的组件需要在json中注册，全局注册也生效-->
    <component is="{{current}}"></component>
    <!--显示/隐藏dom-->
    <view class="bottom" wx:show="{{showBottom}}">
      <!--模板条件编译，__mpx_mode__为框架注入的环境变量，条件判断为false的模板不会生成到dist-->
      <view wx:if="{{__mpx_mode__ === 'wx'}}">wx env</view>
      <view wx:if="{{__mpx_mode__ === 'ali'}}">ali env</view>
    </view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      // 动态样式和类名也可以使用computed返回
      dynamicStyle: {
        fontSize: '16px',
        color: 'red'
      },
      title: 'hello world',
      list: [
        {
          content: '全军出击',
          id: 0,
          active: false
        },
        {
          content: '猥琐发育，别浪',
          id: 1,
          active: false
        }
      ],
      customInfo: {
        title: 'test',
        content: 'test content'
      },
      current: 'com-a',
      showBottom: false
    },
    computed: {
      reversedTitle () {
        return this.title.split('').reverse().join('')
      }
    },
    handleTap (index) {
      // 处理函数直接通过参数获取当前点击的index，清晰简洁
      this.list[index].active = !this.list[index].active
    }
  })
</script>

<script type="application/json">
  {
    "usingComponents": {
      "custom-input": "../components/custom-input",
      "com-a": "../components/com-a",
      "com-b": "../components/com-b"
    }
  }
</script>
```

## 模板预编译

Mpx还支持开发者使用插值语法与小程序不冲突第三方的模板引擎语法来编写template，如pug：

```html
<template lang="pug">
  view(class="list")
    view(class="list-item") red
    view(class="list-item") blue
    view(class="list-item") green
</template>
```

