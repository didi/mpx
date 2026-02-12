## mpx.pageScrollTo(Object object)

将页面滚动到目标位置，支持选择器和滚动距离两种方式定位

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/scroll/wx.pageScrollTo.html)

### 参数 {#parameters}
**Object object**

| 属性        | 类型     | 默认值 | 必填 | 说明                                                                 | 最低版本 | 支付宝 | web | RN |
|-------------|----------|--------|------|----------------------------------------------------------------------|----------|--------|-----|-----|
| scrollTop   | number   |        | 否   | 滚动到页面的目标位置，单位 px                                        |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| duration    | number   | 300    | 否   | 滚动动画的时长，单位 ms                                             |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| selector    | string   |        | 否   | 选择器                                                              | 2.7.3    | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| offsetTop   | number   |        | 否   | 偏移距离，需要和 selector 参数搭配使用，可以滚动到 selector 加偏移距离的位置，单位 px | 2.23.1   | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: red; font-weight: bold;'>✗</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| success     | function |        | 否   | 接口调用成功的回调函数                                               |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| fail        | function |        | 否   | 接口调用失败的回调函数                                               |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |
| complete    | function |        | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                      |          | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> | <span style='color: green; font-weight: bold;'>✓</span> |

### 示例代码 {#example-code}

#### 使用 scrollTop 滚动到指定位置

```js
mpx.pageScrollTo({
  scrollTop: 0,
  duration: 300
})
```

#### 使用 selector 滚动到指定元素（小程序）

```xml
<view id="target-section">目标区域</view>
```

```js
mpx.pageScrollTo({
  selector: 'target-section',  // 不需要 # 前缀
  duration: 300
})
```

#### 使用 selector 滚动到指定元素（React Native）

::: warning React Native 平台特殊说明
在 React Native (iOS/Android) 平台上使用 selector 方式时，需要满足以下条件：
1. scroll-view 组件必须添加 `wx:ref` 属性
2. 目标元素必须同时添加 `id` 和 `wx:ref` 属性
3. scroll-view 必须启用 `scroll-y` 或 `scroll-x`
:::

```xml
<template>
  <view class="page">
    <!-- scroll-view 需要添加 wx:ref -->
    <scroll-view wx:ref="scrollView" scroll-y="{{true}}" style="height: 100vh;">
      <view style="height: 500px;">顶部内容</view>
      
      <!-- 目标元素需要同时添加 id 和 wx:ref -->
      <view id="target-section" wx:ref style="height: 200px;">
        目标区域
      </view>
      
      <view style="height: 500px;">底部内容</view>
    </scroll-view>
  </view>
</template>

<script>
import { createPage } from '@mpxjs/core'

createPage({
  methods: {
    scrollToTarget() {
      mpx.pageScrollTo({
          selector: 'target-section',  // 只需要 id，不需要 # 前缀
          duration: 300,
          offsetTop: 10,  // 可选：偏移 10px
          success: () => {
            console.log('滚动成功')
          },
          fail: (err) => {
            console.error('滚动失败:', err)
          }
      })
    }
  }
})
</script>
```

### React Native 平台注意事项

#### 为什么需要 wx:ref？

在 React Native 平台上，Mpx 使用 refs 系统来管理和查找元素。只有添加了 `wx:ref` 属性的元素才会被注册到 refs 系统中，从而可以被查找到。

#### 必需的配置

1. **scroll-view 必须有 wx:ref**
```xml
<!-- ✅ 正确 -->
<scroll-view wx:ref="scrollView" scroll-y="{{true}}">
  <!-- 内容 -->
</scroll-view>

<!-- ❌ 错误：缺少 wx:ref -->
<scroll-view scroll-y="{{true}}">
  <!-- 内容 -->
</scroll-view>
```

2. **目标元素必须同时有 id 和 wx:ref**
```xml
<!-- ✅ 正确：同时有 id 和 wx:ref -->
<view id="section-1" wx:ref>区域 1</view>

<!-- ❌ 错误：只有 id，没有 wx:ref -->
<view id="section-1">区域 1</view>
```

3. **启用滚动方向**
```xml
<!-- ✅ 正确：启用纵向滚动 -->
<scroll-view scroll-y="{{true}}">

<!-- ❌ 错误：没有启用滚动 -->
<scroll-view>
```
