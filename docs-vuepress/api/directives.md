# 模板指令

## wx:if

* **预期：** `any`

* **用法：**
  
  根据表达式的值的 [truthiness](https://developer.mozilla.org/zh-CN/docs/Glossary/Truthy) 来有条件地渲染元素。在切换时元素及它的数据绑定 / 组件被销毁并重建。 **注意：如果元素是 `<block/>`, 注意它并不是一个组件，它仅仅是一个包装元素，不会在页面中做任何渲染，只接受控制属性**。

  ::: danger
  当和 `wx:if` 一起使用时，`wx:for` 的优先级比 `wx:if` 更高。详见列[表渲染教程](../guide/basic/list-render.html)
  :::

* **参考：** [条件渲染 - wx:if](../guide/basic/conditional-render.html)

## wx:elif

* **类型：** `any`

* **限制：** 前一兄弟元素必须有 `wx:if` 或 `wx:elif`

* **用法：**
  
  表示 `wx:if` 的“ `wx:elif` 块”。可以链式调用。

  ``` html
  <view wx:if="{{type === 'A'}}">
    A
  </view>
  <view wx:elif="{{type === 'B'}}">
    B
  </view>
  <view wx:elif="{{type === 'C'}}">
    C
  </view>
  <view wx:else>
    Not A/B/C
  </view>
  ```

* **参考：** [条件渲染 - wx:elif](../guide/basic/conditional-render.html)

## wx:else

* **不需要表达式**

* **限制：** 前一兄弟元素必须有 `wx:if` 或 `wx:elif`

* **用法：**
  
  为 `wx:if` 或者 `wx:elif` 添加 `wx:else` 块

  ``` html
  <view wx:if="{{type === 'A'}}">
    A
  </view>
  <view wx:else>
    Not A
  </view>
  ```

* **参考：** [条件渲染 - wx:else](../guide/basic/conditional-render.html)

## wx:for

* **预期：** `Array | Object | number | string`

* **用法：**
  
  在组件上使用 `wx:for` 控制属性绑定一个数组，即可使用数组中各项的数据重复渲染该组件。默认数组的当前项的下标变量名默认为 `index`，数组当前项的变量名默认为 `item`

  ``` html
  <view wx:for="{{array}}">
    {{ index }}: {{ item.message }}
  </view>

  // 0: foo
  // 1: bar
  ```

  ``` js
  Page({
    data: {
      array: [{
        message: 'foo'
      }, {
        message: 'bar'
      }]
    }
  })
  ```

  `wx:for` 的默认行为会尝试原地修改元素而不是移动它们。要强制其重新排序元素，你需要用特殊 `attribute key` 来提供一个排序提示：

  ``` html
  <view wx:for="{{array}}" wx:key="id">
    {{ item.text }}
  </view>

  // foo
  // bar
  ```

  ``` js
  Page({
    data: {
      array: [{
        id: 1, text: 'foo'
      }, {
        id: 2, text: 'bar'
      }]
    }
  })
  ```

  ::: danger
  当和 `wx:if` 一起使用时，`wx:for` 的优先级比 `wx:if` 更高。详见列[表渲染教程](../guide/basic/list-render.html)
  :::

  `wx:for` 的详细用法可以通过以下链接查看教程详细说明。

* **参考：** [列表渲染 - wx:for](../guide/basic/list-render.html)

## wx:for-index

* **预期：** `string`

* **用法：**

  使用 wx:for-index 可以指定数组当前下标的变量名：
  
  ``` html
  <view wx:for="{{array}}" wx:key="id" wx:for-index="idx">
    {{ idx }}: {{ item.text }}
  </view>

  // 0: foo
  // 1: bar
  ```

  ``` js
  Page({
    data: {
      array: [{
        id: 1, text: 'foo'
      }, {
        id: 2, text: 'bar'
      }]
    }
  })
  ```

* **参考：** [列表渲染 - wx:for-index](../guide/basic/list-render.html)

## wx:for-item

* **预期：** `string`

* **用法：**

  使用 wx:for-item 可以指定数组当前元素的变量名：
  
  ``` html
  <view wx:for="{{[1, 2, 3, 4, 5, 6, 7, 8, 9]}}" wx:for-item="i">
    <view wx:for="{{[1, 2, 3, 4, 5, 6, 7, 8, 9]}}" wx:for-item="j">
      <view wx:if="{{i <= j}}">
        {{i}} * {{j}} = {{i * j}}
      </view>
    </view>
  </view>
  ```

* **参考：** [列表渲染 - wx:for-item](../guide/basic/list-render.html)

## wx:key

* **预期：** `number | string`

* **用法：**
  
  如果列表中项目的位置会动态改变或者有新的项目添加到列表中，并且希望列表中的项目保持自己的特征和状态，需要使用 wx:key 来指定列表中项目的唯一的标识符。
  **注意：如不提供 wx:key，会报一个 warning， 如果明确知道该列表是静态，或者不必关注其顺序，可以选择忽略**。

  有相同父元素的子元素必须有独特的 key。重复的 key 会造成渲染错误。

  常见的用例是结合 `wx:for`：

  ``` html
  <view wx:for="{{array}}" wx:key="id">
    {{ item.text }}
  </view>
  ```

* **参考：** [列表渲染 - wx:for](../guide/basic/list-render.html)

## wx:class

* **用法：**
  
  绑定HTML Class: 类似vue的class绑定

  #对象用法

  我们可以传给 `wx:class` 一个对象，以动态地切换 class：

  ``` html
  <view wx:class="{{ {active: isActive} }}">
    这是一段测试文字
  </view>
  ```

  你可以在对象中传入更多字段来动态切换多个 class。此外，`wx:class` 指令也可以与普通的 class attribute 共存。

  ``` html
  <view class="static" wx:class="{{ {active: isActive, text-danger: hasError} }}">
    这是一段测试文字
  </view>
  ```

  ```js
  <script>
    import {createComponent} from '@mpxjs/core'

    createComponent({
      data: {
       isActive: true,
       hasError: false
      }
    })
  </script>
  ```

  渲染为：

  ``` html
  <view class="static active">
    这是一段测试文字
  </view>
  ```

  **注意：由于微信的限制，`wx:class` 中的 key 值不能使用引号（如: { 'my-class-name': xx }）**

  绑定的数据对象不必内联定义在模板里：

  ``` html
  <view wx:class="{{ classObject }}">
    这是一段测试文字
  </view>
  ```

  ```js
  <script>
    import {createComponent} from '@mpxjs/core'

    createComponent({
      data: {
        classObject: {
          active: true,
          'text-danger': false
        }
      }
    })
  </script>
  ```

  我们也可以在这里绑定一个返回对象的计算属性。

  如果你也想根据条件切换列表中的 class，可以用三元表达式：

  ``` html
  <view wx:class="{{ isActive ? 'active' : '' }}">
    这是一段测试文字
  </view>
  ```

  #数组用法

  我们可以把一个数组传给 `wx:class`，以应用一个 class 列表：

  ``` html
  <view wx:class="[{{activeClass}},{{errorClass}}]">
    这是一段测试文字
  </view>
  ```

  ```js
  <script>
    import {createComponent} from '@mpxjs/core'

    createComponent({
      data: {
        activeClass: 'active',
        errorClass: 'text-danger'
      }
    })
  </script>
  ```
  
  渲染为：

  ``` html
  <view wx:class="active text-danger">
    这是一段测试文字
  </view>
  ```

* **参考：** [类名样式绑定 - 类名绑定](../guide/basic/class-style-binding.html#类名绑定)

## wx:style

* **用法：**

  `wx:style` 的对象语法十分直观——看着非常像 CSS，但其实是一个 JavaScript 对象。CSS property 名可以用驼峰式 (camelCase) 或短横线分隔 (kebab-case) 来命名：

  ``` html
  <view wx:style="color: {{activeColor}}; font-size: {{fontSize}}px; fontWeight: bold">
    这是一段测试文字
  </view>
  ```

  ```js
  <script>
    import {createComponent} from '@mpxjs/core'

    createComponent({
      data: {
        activeColor: 'red',
        fontSize: 30
      }
    })
  </script>
  ```

  直接绑定到一个样式对象通常更好，这会让模板更清晰：

  ``` html
  <view wx:style="{{styleObject}}">
    这是一段测试文字
  </view>
  ```
  
  ```js
  <script>
    import {createComponent} from '@mpxjs/core'

    createComponent({
      styleObject: {
        color: 'red',
        fontWeight: 'bold'
      },
    })
  </script>
  ```

  例子：
  
  ``` html
  <template>
    <view wx:for="{{list}}" wx:style="{{item.style}}">{{item.name}}</view>
  </template>
  ```

  ```js
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

  同样的，对象语法常常结合返回对象的计算属性使用。

  `wx:style` 的数组语法可以将多个样式对象应用到同一个元素上

  ``` html
  <view wx:style="[baseStyles, overridingStyles]">
    这是一段测试文字
  </view>
  ```

* **参考：** [类名样式绑定 - 样式绑定](../guide/basic/class-style-binding.html#样式绑定)

## wx:model

## wx:model-prop

## wx:model-event

## wx:model-value-path

## wx:model-filter

## wx:ref

* **预期：** `String`

* **用法：**

  Mpx提供了 `wx:ref=xxx` 来更方便获取 WXML 节点信息的对象。在JS里只需要通过this.$refs.xxx 即可获取节点。

  ```html
  <view wx:ref="tref">
    123
  </view>
  ```

  ```js
  <script>
    Page({
      ready () {
        this.$refs.tref.fields({size: true}, function (res) {
          console.log(res)
        }).exec()
      }
    })
  </script>
  ```

* **参考：** [获取组件实例 - wx:ref](../guide/basic/refs.html)

## wx:show

* **预期：** `Boolean`

* **用法：**
  与 `wx:if` 所不同的是**不会移除节点**，而是设置节点的 `style` 为 `display: none`。

  ```html
  <view wx:show="{{show}}">
    123
  </view>
  ```

  ```js
  Page({
    data: {
      show: false
    }
  })
  ```

## bind

* **预期：** `String`

* **用法：**

  让 `bind + (:?) + eventType` 作为属性值

  比如：`bindtap`

  ```html
  <view bindtap="tapTest"> Click me! </view>
  <view bind:tap="tapTest1(testVal, $event)"> Click me! </view>
  ```

  ```js
  Page({
    methods: {
      tapTest () {
        // todo
      },
      tapTest1 (val, event) {
        console.log(val, event)
      }
    }
  })
  ```

  Mpx做了增强的**内联传参**能力以及具体有哪些事件**类型**参考下方
* **参考：** [事件处理 - bind](../guide/basic/event.html)

## catch

* **预期：** `String`

* **用法：**

  让 `catch + (:?) + eventType` 作为属性值

  除 `bind` 外，也可以用 `catch` 来绑定事件。与 `bind` 不同，`catch` 会阻止事件向上冒泡。

  ```html
  <view id="outer" bindtap="handleTap1">
    outer view
    <view id="middle" catchtap="handleTap2">
      middle view
      <view id="inner" bindtap="handleTap3">
        inner view
      </view>
    </view>
  </view>
  ```

  ```js
  Page({
    methods: {
      handleTap1 () {
        console.log('outer')
      },
      handleTap2 () {
        console.log('middle')
      },
      handleTap3 () {
        console.log('inner')
      }
    }
  })
  // 通过几个操作看出被catchtap的middle view阻止了向上冒泡
  // click outer
  // outer

  // click middle
  // middle

  // click inner
  // inner
  // outer
  ```

* **参考：** [事件处理 - catch](../guide/basic/event.html)

## capture-bind

* **预期：** `String`

* **用法：**

  让 `capture-bind + (:?) + eventType` 作为属性值

  capture-bind要在bind之前执行，是因为事件是先捕获后冒泡，**注意：仅触摸类事件支持捕获阶段**

  ```html
    <view id="outer" bind:touchstart="handleTap1" capture-bind:touchstart="handleTap2">
      outer view
      <view id="inner" bind:touchstart="handleTap3" capture-bind:touchstart="handleTap4">
        inner view
      </view>
    </view>
  ```

  点击inner view的调用顺序是(handleTap)2、4、3、1

* **参考：** [事件处理 - capture-bind](../guide/basic/event.html)

## capture-catch

* **预期：** `String`

* **用法：**

  让 `capture-catch + (:?) + eventType` 作为属性值

  capture-catch中断捕获阶段和取消冒泡阶段

  ```html
  <view id="outer" bind:touchstart="handleTap1" capture-catch:touchstart="handleTap2">
    outer view
    <view id="inner" bind:touchstart="handleTap3" capture-bind:touchstart="handleTap4">
      inner view
    </view>
  </view>
  ```

  点击inner view仅执行handleTap2

* **参考：** [事件处理 - capture-catch](../guide/basic/event.html)