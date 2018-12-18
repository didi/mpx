# template扩展特性

对于模板部分，我们提供了class与style的绑定，`wx:model`指令，动态组件等特性

## class与style绑定

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

> 注意：由于编译能力的限制，在wx:for中使用class和style绑定不能将for中的item和index作为数据传入，如果有对应需求可以使用包装组件将item和index作为props传入，在包装组件内部使用class和style绑定实现。

例子：
父组件
```html
<template>
  <view>
  <!--直接将for中的item/index传入wx:style和wx:class中无法正常运行-->
  <view wx:for="{{list}}" wx:style="{{item.style}}">{{item.name}}</view>
  <!--将item/index传入包装组件中，再在包装组件内使用wx:style和wx:class进行样式和类名绑定-->
  <wrap wx:for="{{list}}" item="{{item}}"></wrap>
  </view>
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

子组件
```html
<template>
  <view wx:style="{{item.style}}">{{item.name}}</view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    properties: {
      item: Object
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

> 注意：由于微信的限制，如果方法名使用横线链接分割（如: 'click-handle'），将不可以使用该feature。

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

除了小程序原生指令之外，mpx 基于`input`事件扩展了一个指令 `wx:model`, 用于双向绑定。

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
