# template增强特性

对于模板部分，我们提供了class与style的绑定，`wx:model`指令，动态组件等特性

## class与style绑定

#### 绑定HTML Class

类似vue的class绑定

例子：
```html
<template>
  <view wx:class="{{ {active: isActive} }}">
    这是一段测试文字
  </view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'

  createComponent({
    properties: {
      isActive: Boolean
    }
  })
</script>

<style lang="stylus">
  .active
    background-color blue
</style>
```

当该组件接受一个参数isActive为true时，就会为view加上class:active。

> 注意：由于微信的限制，wx:class 中的 key 值不能使用引号（如: { 'my-class-name': xx }）。

#### 绑定内联样式

例子：
```html
<template>
  <view wx:for="{{list}}" wx:style="{{item.style}}">{{item.name}}</view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    data:{
      list:[
        {
          name: 'red',
          style: {
            color: 'red'
          }
        },
        {
          name: 'blue',
          style: {
            color: 'blue'
          }
        }         
      ]
    }
  })
</script>
```

## 内联事件绑定

对于事件处理在模板上的绑定，原生小程序只能通过事件信息结合手工拿取data里的信息，我们希望能和vue的事件绑定一样更灵活地传参

例子：
```html
<template>
  <view>
    <view bindtap="handleTap1(1)">Click me!</view>
    <view bindtap="handleTap2(testVal, $event)">Click me!</view>
  </view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    data: {
      testVal: '123'
    },
    methods: {
      handleTap1 (val) {
        console.log(val) // 1
      },
      handleTap2 (val, event) {
        console.log(val) // '123'
        console.log(event) // 微信原生事件
      }
    }
  })
</script>
```

> 注意：由于微信的限制，如果事件名使用横线链接分割（如: 'value-change'），将不可以使用该feature。以及在wx:for中，若遍历的是对象数组，内联传入的item并非是对象的引用，若想修改对象，请用index到原数组中获取。

## 动态组件

通过使用保留的 `<component>` 组件，并对其 is 特性进行动态绑定，你可以在同一个挂载点动态切换多个组件：

```html
<template>
  <!--动态组件，此处的componentName为json中注册的usingComponents的key值-->
  <component is="{{componentName}}"></component>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    data: {
      componentName: 'test'
    },
    ready () {
      setTimeout(() => {
        this.componentName = 'list'
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

## 双向绑定

除了小程序原生指令之外，mpx 基于`input`事件提供了一个指令 `wx:model`, 用于双向绑定。

例子：
```html
<template>
  <view>
    <input wx:model="{{val}}"/>
    <input wx:model="{{test.val}}"/>
    <input wx:model="{{test['val']}}"/>
  </view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    data: {
      val: 'test',
      test: {
        val: 'xxx'
      }
    }
  })
</script>
```

wx:model并不会影响相关的事件处理函数，比如像下面这样：

```html
<input wx:model="{{inputValue}}" bindinput="handleInput"/>
```

#### wx:model对应的属性和事件

wx:model默认监听`input`事件使用`value`属性传值，如果我们希望改变默认行为，可以使用`wx:model-prop`和`wx:model-event`来定义wx:model对应的属性和事件：

父组件
```html
<template>
  <customCheck wx:model="{{checked}}" wx:model-prop="checkedProp" wx:model-event="checkedChange"></customCheck>
</template>

<script>
  import {createPage} from '@mpxjs/core'
  createPage({
    data: {
      checked: true
    }
  })
</script>
```

子组件（customCheck）
```html
<template>
  <view bindtap="handleTap">{{checkedProp}}</view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    properties: {
      checkedProp: Boolean
    },
    methods: {
      handleTap () {
        // 这里第二个参数为自定义事件的detail，需要以下面的形式传递值以保持与原生组件对齐
        this.triggerEvent('checkedChange', {
          value: !this.checkedProp
        })
      }
    }
  })
</script>
```

如示例，当子组件被点击时，父组件的checked数据会发生变化

> 注意：由于微信的限制，如果事件名使用横线链接分割（如: 'checked-change'），将不可以使用该feature。

以及并不是所有的组件都会按微信的标准格式event.detail.value来传值，比如vant的input组件，值的抛出是用event.detail本身来传递的，这时我们可以使用 `wx:model-value-path` 来指定双向绑定时的取值路径。

例如：
```html
<vant-field wx:model-value-path="[]" wx:model="{{a}}"></vant-field>
```

## Refs

提供了 `wx:ref="xxx"` 来更方便获取 WXML 节点信息的对象。在JS里只需要通过this.$refs.xxx 即可获取节点。

示例：
```html
<template>
  <view wx:ref="tref">
    123
  </view>
</template>

<script>
import {createComponent} from '@mpxjs/core'
  createComponent({
    ready () {
      this.$refs.tref.fields({size: true}, function (res) {
        console.log(res)
      }).exec()
    }
  })
</script>
```
