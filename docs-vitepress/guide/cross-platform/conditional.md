# 条件编译机制

Mpx跨端输出时在框架内针对不同平台的差异进行了大量的转换抹平工作，但框架能做的工作始终是有限的，对于框架无法抹平的部分我们会在编译和运行时进行报错提示，同时提供了完善的跨平台条件编译机制，便于用户自行进行差异化处理，该能力也能够用于实现区分平台进行业务逻辑实现。

Mpx中我们支持了三种维度的条件编译，分别是文件维度，区块维度和代码维度，其中，文件维度和区块维度主要用于处理一些大块的平台差异性逻辑，而代码维度主要用于处理一些局部简单的平台差异。

## 文件维度条件编译

文件维度条件编译简单的来说就是文件为维度进行跨平台差异代码的编写，例如在微信->支付宝的项目中存在一个业务地图组件map.mpx，由于微信和支付宝中的原生地图组件标准差异非常大，无法通过框架转译方式直接进行跨平台输出，这时你可以在相同的位置新建一个map.ali.mpx，在其中使用支付宝的技术标准进行开发，编译系统会根据当前编译的mode来加载对应模块，当mode为ali时，会优先加载map.ali.mpx，反之则会加载map.mpx。

### 文件命名规则

```
原文件名.平台标识.扩展名
```

支持的平台标识：
- `wx` - 微信小程序
- `ali` - 支付宝小程序
- `swan` - 百度小程序
- `qq` - QQ小程序
- `tt` - 抖音小程序
- `jd` - 京东小程序
- `web` - Web平台
- `ios` - iOS平台
- `android` - Android平台
- `harmony` - 鸿蒙平台

### 示例

```
components/
├── map.mpx              # 默认实现（微信）
├── map.ali.mpx          # 支付宝专用实现
├── map.web.mpx          # Web专用实现
└── map.ios.mpx          # iOS专用实现
```

### 与webpack alias结合使用

文件维度条件编译能够与webpack alias结合使用，对于npm包的文件我们并不方便在原本的文件位置创建.ali的条件编译文件，但我们可以通过webpack alias在相同位置创建一个`虚拟的`.ali文件，并将其指向项目中的其他文件位置。

```js
// 对于npm包中的文件依赖
import npmModule from 'somePackage/lib/index'

// 配置以下alias后，当mode为ali时，会优先加载项目目录中定义的projectRoot/somePackage/lib/index文件
// vue.config.js
module.exports = defineConfig({
  configureWebpack() {
    return {
      resolve: {
        alias: {
          'somePackage/lib/index.ali': path.resolve(__dirname, 'src/adapters/ali/somePackage-index.js')
        }
      }
    }
  }
})
```

## 区块维度条件编译

区块维度条件编译能够让用户在同一个文件中编写不同平台的代码块，编译时会根据当前编译的mode选择不同的代码块进行编译。

### template区块条件编译

```html
<template>
  <!-- #ifdef wx -->
  <view class="wx-specific">
    微信小程序专用内容
  </view>
  <!-- #endif -->
  
  <!-- #ifdef ali -->
  <view class="ali-specific">
    支付宝小程序专用内容
  </view>
  <!-- #endif -->
  
  <!-- #ifndef web -->
  <view class="not-web">
    非Web平台内容
  </view>
  <!-- #endif -->
</template>
```

### script区块条件编译

```javascript
<script>
export default {
  data() {
    return {
      // #ifdef wx
      title: '微信小程序标题'
      // #endif
      // #ifdef ali
      title: '支付宝小程序标题'
      // #endif
    }
  },
  methods: {
    // #ifdef wx || ali
    miniProgramMethod() {
      // 小程序专用方法
    },
    // #endif
    // #ifdef web
    webMethod() {
      // Web专用方法
    }
    // #endif
  }
}
</script>
```

### style区块条件编译

```css
<style>
/* #ifdef wx */
.wx-style {
  color: red;
}
/* #endif */

/* #ifdef ali */
.ali-style {
  color: blue;
}
/* #endif */

/* #ifndef web */
.miniprogram-style {
  background: yellow;
}
/* #endif */
</style>
```

## 代码维度条件编译

代码维度条件编译主要用于处理一些局部简单的平台差异，通过特殊的注释语法来实现。

### 条件编译语法

```javascript
// 单平台条件
// #ifdef 平台标识
代码块
// #endif

// 多平台条件（或关系）
// #ifdef 平台标识1 || 平台标识2
代码块
// #endif

// 排除平台条件
// #ifndef 平台标识
代码块
// #endif

// 复杂条件
// #ifdef (平台标识1 || 平台标识2) && !平台标识3
代码块
// #endif
```

### 实际应用示例

```javascript
// API调用差异处理
const getSystemInfo = () => {
  // #ifdef wx
  return wx.getSystemInfoSync()
  // #endif
  // #ifdef ali
  return my.getSystemInfoSync()
  // #endif
  // #ifdef web
  return {
    platform: 'web',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  }
  // #endif
}

// 样式差异处理
const getContainerStyle = () => {
  return {
    // #ifdef wx || ali
    height: '100vh',
    // #endif
    // #ifdef web
    height: '100%',
    minHeight: '100vh',
    // #endif
    background: '#f5f5f5'
  }
}
```

## 最佳实践

### 1. 选择合适的条件编译维度

- **文件维度**：适用于平台差异较大的组件或模块
- **区块维度**：适用于同一文件中有部分平台差异的情况
- **代码维度**：适用于简单的API调用或配置差异

### 2. 保持代码可读性

```javascript
// 推荐：将复杂的平台差异抽取为独立函数
const platformSpecificLogic = () => {
  // #ifdef wx
  return wxImplementation()
  // #endif
  // #ifdef ali
  return aliImplementation()
  // #endif
}

// 不推荐：在业务逻辑中混入大量条件编译
const businessLogic = () => {
  const data = getData()
  // #ifdef wx
  // 大量微信特定代码...
  // #endif
  // #ifdef ali
  // 大量支付宝特定代码...
  // #endif
  return processData(data)
}
```

### 3. 合理使用条件组合

```javascript
// 小程序通用逻辑
// #ifdef wx || ali || swan || qq || tt
const miniProgramLogic = () => {
  // 小程序通用实现
}
// #endif

// 客户端通用逻辑
// #ifdef ios || android || harmony
const nativeLogic = () => {
  // 客户端通用实现
}
// #endif
```

## 注意事项

1. **条件编译会在编译时进行代码裁剪**，未匹配的代码块不会被打包
2. **嵌套条件编译需要谨慎使用**，过深的嵌套会影响代码可读性
3. **条件编译的注释格式必须严格遵循**，否则可能不生效
4. **建议在团队中统一条件编译的使用规范**，避免滥用