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

## wx:class

## wx:style

## wx:model

## wx:model-prop

## wx:model-event

## wx:model-value-path

## wx:model-filter

## wx:ref

## wx:show

## bind

todo 在bind中说明事件内联传参能力，下面就不需要说了

## catch

## capture-bind

## capture-catch

