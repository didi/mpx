# 跨端输出 RN 模版能力参考

## 模板指令

Mpx 跨端输出 RN 时，支持以下模板指令。

| 指令 | 支持状态 | 说明 | 示例 |
|------|---------|------|------|
| wx:if | ✅ | 条件渲染 | `<view wx:if="{{condition}}">...</view>` |
| wx:else | ✅ | 条件渲染 | `<view wx:else>...</view>` |
| wx:elif | ✅ | 条件渲染 | `<view wx:elif="{{condition}}">...</view>` |
| wx:show | ✅ | 显示/隐藏控制 | `<view wx:show="{{isVisible}}">...</view>` |
| wx:for | ✅ | 列表渲染 | `<view wx:for="{{list}}">...</view>` |
| wx:for-item | ✅ | 指定循环项变量名 | `<view wx:for="{{list}}" wx:for-item="item">...</view>` |
| wx:for-index | ✅ | 指定循环索引变量名 | `<view wx:for="{{list}}" wx:for-index="idx">...</view>` |
| wx:class | ✅ | 动态类名绑定 | `<view wx:class="{{ {active: isActive} }}">...</view>` |
| wx:style | ✅ | 动态样式绑定 | `<view wx:style="{{ {color: colorVar} }}">...</view>` |
| wx:model | ✅ | 双向数据绑定 | `<input wx:model="{{value}}" />` |
| wx:model-prop | ✅ | 双向绑定属性 | `<custom-input wx:model="{{value}}" wx:model-prop="myValue" />` |
| wx:model-event | ✅ | 双向绑定事件 | `<custom-input wx:model="{{value}}" wx:model-event="myChange" />` |
| wx:model-value-path | ✅ | 定义了双向绑定时从 `e.detail` 中获取更新值的访问路径，默认值为 `value`，即通过 `e.detail.value` 获取更新值，如通过 `e.detail` 直接作为更新值，可以设置 `wx:model-value-path="[]"` | `<custom-input wx:model="{{value}}" wx:model-value-path="[]" />` |
| wx:model-filter | ✅ | 双向绑定过滤器，可绑定内建（如 trim）或组件实例方法，在双向绑定时对更新值进行过滤和修饰 | `<input wx:model="{{value}}" wx:model-filter="trim" />` |
| wx:ref | ✅ | 获取基础组件节点或自定义组件实例 | `<view wx:ref="myView">...</view>` |

## 事件处理

### 基础通用事件

在跨端输出 RN 时，所有基础组件均支持以下基础通用事件，并且支持事件冒泡和捕获。

| 事件名 | 触发时机 |
| --- | --- |
| tap | 手指触摸后马上离开 |
| longpress | 手指触摸后，超过 350ms 再离开 |
| touchstart | 手指触摸动作开始 |
| touchmove | 手指触摸后移动 |
| touchend | 手指触摸动作结束 |
| touchcancel | 手指触摸动作被打断，如来电提醒，弹窗等 |

### 事件绑定语法

**普通事件绑定**
```js
<view bindtap="handleTap">
    Click here!
</view>
```

**绑定并阻止事件冒泡**
```js
<view catchtap="handleTap">
    Click here!
</view>
```

**事件捕获**

```js
<view capture-bind:touchstart="handleTap1">
  outer view
  <view capture-bind:touchstart="handleTap2">
    inner view
  </view>
</view>
```

**中断捕获阶段和取消冒泡阶段**

```js
<view capture-catch:touchstart="handleTap1">
  outer view
</view>
```

**事件内联传参**

Mpx 支持了事件内联传参机制。

```html
<template>
  <!--Mpx增强语法，模板内联传参，方便简洁-->
  <view bindtap="handleTapInline('inline')">内联传参</view>
</template>
<script setup>
  // 直接通过参数获取数据，直观方便
  const handleTapInline = (params) => {
    console.log('params:', params)
  }
  // ...
</script>
```

**动态事件绑定**

Mpx 也支持使用 `{{}}` 插值进行动态事件绑定。

```html
<template>
  <!--动态事件绑定-->
  <view wx:for="{{items}}" bindtap="handleTap_{{index}}">
    {{item}}
  </view>
</template>
<script setup>
  import { ref } from '@mpxjs/core'
  const items = ref(['Item 1', 'Item 2', 'Item 3', 'Item 4'])
  const handleTap_0 = (event) => {
    console.log('Tapped on item 1');
  }
  const handleTap_1 = (event) => {
    console.log('Tapped on item 2');
  }
  const handleTap_2 = (event) => {
    console.log('Tapped on item 3');
  }
  const handleTap_3 = (event) => {
    console.log('Tapped on item 4');
  }
  // ...
</script>
```
### 注意事项

1. 除基础通用事件外，其余所有事件均不支持事件冒泡和捕获。
2. 当使用了事件委托想获取 `e.target.dataset` 时，只有点击到文本节点才能获取到，点击其他区域无效。建议直接将事件绑定到事件触发的元素上，使用 `e.currentTarget` 来获取 `dataset` 等数据。
3. 由于 `tap` 和 `longpress` 事件是由 `touchstart` / `touchend` 等底层触摸事件模拟实现，所以在 RN 环境，如果子组件绑定了 `catchtouchend`，那么父组件的 `tap` 事件将不会响应。
4. 如果元素上设置了 `opacity: 0` 的样式，会导致 ios 事件无法响应。