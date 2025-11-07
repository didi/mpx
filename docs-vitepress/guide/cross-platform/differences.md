# 平台差异处理

在跨端开发过程中，不同平台之间存在各种差异，Mpx框架在编译时和运行时都做了大量工作来抹平这些差异。本文档将详细介绍各种平台差异及其处理方案。

## 差异类型概览

### 1. API差异
不同平台提供的原生API在命名、参数、返回值等方面存在差异。

### 2. 组件差异
各平台的原生组件在属性、事件、样式支持等方面有所不同。

### 3. 样式差异
不同平台对CSS样式的支持程度和表现形式存在差异。

### 4. 生命周期差异
各平台的组件和页面生命周期钩子函数有所不同。

### 5. 配置差异
项目配置文件的格式和支持的配置项存在差异。

## API差异处理

### 系统信息获取

```javascript
// Mpx统一API
import { getSystemInfoSync } from '@mpxjs/api-proxy'

// 在不同平台会自动转换为对应的API调用
const systemInfo = getSystemInfoSync()

// 等价于：
// 微信: wx.getSystemInfoSync()
// 支付宝: my.getSystemInfoSync()
// 百度: swan.getSystemInfoSync()
```

### 网络请求

```javascript
// Mpx统一API
import { request } from '@mpxjs/api-proxy'

request({
  url: 'https://api.example.com/data',
  method: 'GET',
  success: (res) => {
    console.log(res.data)
  }
})

// 自动适配不同平台的request API
```

### 存储API

```javascript
// Mpx统一API
import { setStorageSync, getStorageSync } from '@mpxjs/api-proxy'

// 设置存储
setStorageSync('key', 'value')

// 获取存储
const value = getStorageSync('key')
```

## 组件差异处理

### 地图组件

不同平台的地图组件差异较大，建议使用文件维度条件编译：

```html
<!-- map.wx.mpx -->
<template>
  <map 
    :latitude="latitude" 
    :longitude="longitude"
    :markers="markers"
    @markertap="onMarkerTap"
  />
</template>

<!-- map.ali.mpx -->
<template>
  <map 
    :latitude="latitude" 
    :longitude="longitude"
    :markers="markers"
    @markerTap="onMarkerTap"
  />
</template>
```

### 输入组件

```html
<template>
  <input 
    :value="inputValue"
    :placeholder="placeholder"
    <!-- #ifdef wx -->
    @input="onInput"
    <!-- #endif -->
    <!-- #ifdef ali -->
    @input="onInput"
    <!-- #endif -->
    <!-- #ifdef web -->
    @input="onInput"
    <!-- #endif -->
  />
</template>
```

### 滚动组件

```html
<template>
  <!-- #ifdef wx || ali -->
  <scroll-view 
    :scroll-y="true"
    :style="scrollStyle"
    @scroll="onScroll"
  >
    <slot />
  </scroll-view>
  <!-- #endif -->
  
  <!-- #ifdef web -->
  <div 
    :style="scrollStyle"
    @scroll="onScroll"
  >
    <slot />
  </div>
  <!-- #endif -->
</template>
```

## 样式差异处理

### 单位处理

```css
<style>
/* Mpx会自动处理单位转换 */
.container {
  /* 小程序中转换为rpx，Web中转换为vw */
  width: 750rpx;
  
  /* 固定像素值在所有平台保持一致 */
  border-width: 1px;
  
  /* 百分比在所有平台保持一致 */
  height: 100%;
}
</style>
```

### 选择器支持

```css
<style>
/* 支持的选择器 */
.class-name { /* 类选择器 - 所有平台支持 */ }
#id-name { /* ID选择器 - 部分平台支持 */ }
element { /* 标签选择器 - 部分平台支持 */ }

/* 不支持的选择器（会被过滤） */
.parent > .child { /* 子选择器 */ }
.sibling + .next { /* 相邻选择器 */ }
.element:hover { /* 伪类选择器 */ }
</style>
```

### 样式属性差异

```css
<style>
.element {
  /* 通用样式属性 */
  color: red;
  background-color: blue;
  font-size: 16px;
  
  /* 平台特定样式 */
  /* #ifdef web */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  /* #endif */
  
  /* #ifdef wx || ali */
  box-shadow: none; /* 小程序不支持box-shadow */
  /* #endif */
}
</style>
```

## 生命周期差异处理

Mpx统一了不同平台的生命周期，提供一致的开发体验：

```javascript
<script>
export default {
  // 页面生命周期
  onLoad() {
    // 页面加载时触发
    // 自动映射到各平台对应的生命周期
  },
  
  onShow() {
    // 页面显示时触发
  },
  
  onHide() {
    // 页面隐藏时触发
  },
  
  onUnload() {
    // 页面卸载时触发
  },
  
  // 组件生命周期
  created() {
    // 组件创建时触发
  },
  
  mounted() {
    // 组件挂载时触发
  },
  
  destroyed() {
    // 组件销毁时触发
  }
}
</script>
```

## 配置差异处理

### 页面配置

```json
{
  "navigationBarTitleText": "页面标题",
  "navigationBarBackgroundColor": "#000000",
  "navigationBarTextStyle": "white",
  "backgroundColor": "#ffffff",
  "backgroundTextStyle": "dark",
  "enablePullDownRefresh": true,
  "onReachBottomDistance": 50
}
```

Mpx会自动将这些配置转换为各平台对应的格式。

### 应用配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail"
  ],
  "window": {
    "navigationBarTitleText": "应用标题",
    "navigationBarBackgroundColor": "#000000"
  },
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "images/icon_home.png",
        "selectedIconPath": "images/icon_home_selected.png",
        "text": "首页"
      }
    ]
  }
}
```

## 平台特性处理

### 微信小程序特性

```javascript
// 微信支付
// #ifdef wx
wx.requestPayment({
  timeStamp: '',
  nonceStr: '',
  package: '',
  signType: 'MD5',
  paySign: '',
  success: (res) => {
    console.log('支付成功')
  }
})
// #endif
```

### 支付宝小程序特性

```javascript
// 支付宝支付
// #ifdef ali
my.tradePay({
  orderStr: '',
  success: (res) => {
    console.log('支付成功')
  }
})
// #endif
```

### Web平台特性

```javascript
// Web特有功能
// #ifdef web
// 使用浏览器API
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    console.log('位置信息', position)
  })
}

// 使用DOM操作
document.addEventListener('click', (event) => {
  console.log('点击事件', event)
})
// #endif
```

## 错误处理和调试

### 平台兼容性检查

```javascript
// 检查当前平台
const platform = process.env.MPX_CURRENT_TARGET_MODE

if (platform === 'wx') {
  // 微信小程序特定逻辑
} else if (platform === 'ali') {
  // 支付宝小程序特定逻辑
} else if (platform === 'web') {
  // Web平台特定逻辑
}
```

### 运行时错误处理

```javascript
// 统一错误处理
const handleError = (error) => {
  console.error('发生错误:', error)
  
  // #ifdef wx
  wx.showToast({
    title: '操作失败',
    icon: 'none'
  })
  // #endif
  
  // #ifdef ali
  my.showToast({
    content: '操作失败',
    type: 'none'
  })
  // #endif
  
  // #ifdef web
  alert('操作失败')
  // #endif
}
```

## 最佳实践

### 1. 优先使用框架抹平的差异

尽量使用Mpx提供的统一API和组件，减少手动处理平台差异的工作量。

### 2. 合理选择差异处理方式

- **小差异**：使用代码维度条件编译
- **中等差异**：使用区块维度条件编译
- **大差异**：使用文件维度条件编译

### 3. 建立平台差异处理规范

在团队中建立统一的平台差异处理规范，包括：
- 条件编译的使用原则
- 平台特定代码的组织方式
- 错误处理的统一方案

### 4. 充分测试

在所有目标平台上进行充分测试，确保差异处理的正确性。

### 5. 文档记录

详细记录项目中的平台差异处理方案，便于团队成员理解和维护。