# React Native 跨端基础

Mpx 支持将小程序项目编译到 React Native 平台，让开发者能够使用统一的小程序开发模式来构建原生移动应用。通过 Mpx 的跨端能力，可以实现小程序、Web 和 React Native 的代码复用。

## 特性概览

### 核心能力
- **统一开发体验** - 使用小程序的开发模式开发 React Native 应用
- **代码复用** - 小程序代码可以直接编译到 React Native 平台
- **组件映射** - 小程序组件自动映射为 React Native 组件
- **API 适配** - 小程序 API 自动适配为 React Native API
- **样式转换** - 小程序样式自动转换为 React Native 样式
- **原生性能** - 享受 React Native 的原生性能优势

### 支持程度
- ✅ 基础组件（view、text、image等）
- ✅ 表单组件（input、button、picker等）
- ✅ 滚动组件（scroll-view、swiper等）
- ✅ 媒体组件（audio、video等）
- ⚠️ 地图组件（需要额外配置）
- ⚠️ 画布组件（需要第三方库）
- ❌ 小程序特有组件（不支持）

## 环境准备

### 1. 安装依赖

```bash
# 安装 React Native CLI
npm install -g @react-native-community/cli

# 安装 Mpx React Native 相关依赖
npm install @mpxjs/webpack-plugin @mpxjs/core @mpxjs/api-proxy-rn
```

### 2. 平台环境

**iOS 开发环境：**
- Xcode 12.0 或更高版本
- iOS 11.0 或更高版本
- CocoaPods

**Android 开发环境：**
- Android Studio
- Android SDK (API 21 或更高)
- Java Development Kit (JDK 8 或更高)

### 3. 项目配置

在现有的小程序项目中添加 React Native 编译配置：

```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    mpx: {
      srcMode: 'wx', // 源码模式
      plugin: {
        hackResolveBuildDependencies: ({ files, resolveDependencies }) => {
          const path = require('path')
          const packageJSONPath = path.resolve('package.json')
          if (files.has(packageJSONPath)) {
            resolveDependencies()
          }
        }
      },
      loader: {
        // React Native 平台特殊配置
      }
    }
  }
}
```

## 快速开始

### 1. 创建 React Native 项目

```bash
# 使用 Mpx CLI 创建支持 RN 的项目
npx @mpxjs/cli@latest create my-rn-app

# 选择包含 React Native 支持的模板
```

### 2. 项目结构

```
my-rn-app/
├── src/                    # 源码目录
│   ├── pages/             # 页面目录
│   ├── components/        # 组件目录
│   ├── utils/            # 工具函数
│   ├── store/            # 状态管理
│   ├── app.mpx           # 应用入口
│   └── app.json          # 应用配置
├── platforms/             # 平台特定代码
│   └── react-native/     # React Native 平台
│       ├── android/      # Android 项目
│       ├── ios/          # iOS 项目
│       ├── index.js      # RN 入口文件
│       └── package.json  # RN 依赖
├── dist/                  # 编译输出
│   └── react-native/     # RN 编译结果
└── vue.config.js         # 构建配置
```

### 3. 构建命令

```bash
# 编译到 React Native
npm run build:rn

# 启动 React Native 开发服务器
npm run serve:rn

# 运行 iOS 应用
npm run ios

# 运行 Android 应用
npm run android
```

## 组件映射

### 基础组件

Mpx 会自动将小程序组件映射为对应的 React Native 组件：

| 小程序组件 | React Native 组件 | 说明 |
|------------|-------------------|------|
| `<view>` | `<View>` | 容器组件 |
| `<text>` | `<Text>` | 文本组件 |
| `<image>` | `<Image>` | 图片组件 |
| `<scroll-view>` | `<ScrollView>` | 滚动容器 |
| `<swiper>` | 自定义组件 | 轮播组件 |
| `<icon>` | 自定义组件 | 图标组件 |
| `<progress>` | 自定义组件 | 进度条 |
| `<rich-text>` | 自定义组件 | 富文本 |

**示例：**

```html
<!-- 小程序代码 -->
<template>
  <view class="container">
    <text class="title">{{ title }}</text>
    <image :src="imageUrl" class="image" />
    <scroll-view scroll-y class="scroll-area">
      <view v-for="item in list" :key="item.id" class="item">
        <text>{{ item.name }}</text>
      </view>
    </scroll-view>
  </view>
</template>
```

```jsx
// 编译后的 React Native 代码
import React from 'react'
import { View, Text, Image, ScrollView } from 'react-native'

const Component = ({ title, imageUrl, list }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <ScrollView style={styles.scrollArea}>
        {list.map(item => (
          <View key={item.id} style={styles.item}>
            <Text>{item.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
```

### 表单组件

| 小程序组件 | React Native 组件 | 说明 |
|------------|-------------------|------|
| `<input>` | `<TextInput>` | 输入框 |
| `<textarea>` | `<TextInput>` | 多行输入 |
| `<button>` | `<TouchableOpacity>` + `<Text>` | 按钮 |
| `<checkbox>` | 自定义组件 | 复选框 |
| `<radio>` | 自定义组件 | 单选框 |
| `<switch>` | `<Switch>` | 开关 |
| `<slider>` | `<Slider>` | 滑块 |
| `<picker>` | `<Picker>` | 选择器 |

**表单示例：**

```html
<template>
  <view class="form">
    <input 
      :value="formData.name"
      placeholder="请输入姓名"
      @input="onNameInput"
      class="input"
    />
    <textarea 
      :value="formData.desc"
      placeholder="请输入描述"
      @input="onDescInput"
      class="textarea"
    />
    <switch 
      :checked="formData.agree"
      @change="onAgreeChange"
    />
    <button @tap="onSubmit" class="submit-btn">
      提交
    </button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        name: '',
        desc: '',
        agree: false
      }
    }
  },
  methods: {
    onNameInput(e) {
      this.formData.name = e.detail.value
    },
    onDescInput(e) {
      this.formData.desc = e.detail.value
    },
    onAgreeChange(e) {
      this.formData.agree = e.detail.value
    },
    onSubmit() {
      if (!this.formData.agree) {
        // 显示提示
        return
      }
      console.log('提交表单', this.formData)
    }
  }
}
</script>
```

### 导航组件

```html
<template>
  <view class="navigation">
    <navigator 
      url="/pages/detail/detail?id=123"
      class="nav-item"
    >
      <text>跳转到详情页</text>
    </navigator>
    
    <navigator 
      url="/pages/user/user"
      open-type="switchTab"
      class="nav-item"
    >
      <text>切换到用户页</text>
    </navigator>
  </view>
</template>
```

## API 适配

### 网络请求

```javascript
// 使用统一的网络请求 API
import { request } from '@mpxjs/api-proxy-rn'

// 发起网络请求
request({
  url: 'https://api.example.com/data',
  method: 'GET',
  data: {
    id: 123
  }
}).then(res => {
  console.log('请求成功', res.data)
}).catch(err => {
  console.error('请求失败', err)
})

// 上传文件
import { uploadFile } from '@mpxjs/api-proxy-rn'

uploadFile({
  url: 'https://api.example.com/upload',
  filePath: 'file://path/to/image.jpg',
  name: 'file',
  formData: {
    user: 'test'
  }
}).then(res => {
  console.log('上传成功', res)
})
```

### 存储 API

```javascript
// 使用统一的存储 API
import { 
  setStorageSync, 
  getStorageSync, 
  removeStorageSync,
  clearStorageSync
} from '@mpxjs/api-proxy-rn'

// 设置存储
setStorageSync('userInfo', {
  name: '张三',
  age: 25
})

// 获取存储
const userInfo = getStorageSync('userInfo')
console.log('用户信息', userInfo)

// 删除存储
removeStorageSync('userInfo')

// 清空存储
clearStorageSync()
```

### 系统信息

```javascript
// 获取系统信息
import { getSystemInfoSync } from '@mpxjs/api-proxy-rn'

const systemInfo = getSystemInfoSync()
console.log('系统信息', {
  platform: systemInfo.platform, // 'ios' 或 'android'
  version: systemInfo.version,
  screenWidth: systemInfo.screenWidth,
  screenHeight: systemInfo.screenHeight,
  statusBarHeight: systemInfo.statusBarHeight
})
```

### 导航 API

```javascript
// 页面导航
import { 
  navigateTo, 
  redirectTo, 
  navigateBack,
  switchTab,
  reLaunch
} from '@mpxjs/api-proxy-rn'

// 跳转到新页面
navigateTo({
  url: '/pages/detail/detail?id=123'
})

// 重定向
redirectTo({
  url: '/pages/login/login'
})

// 返回上一页
navigateBack({
  delta: 1
})

// 切换 Tab
switchTab({
  url: '/pages/index/index'
})

// 重新启动
reLaunch({
  url: '/pages/index/index'
})
```

### 设备 API

```javascript
// 震动
import { vibrateShort, vibrateLong } from '@mpxjs/api-proxy-rn'

// 短震动
vibrateShort()

// 长震动
vibrateLong()

// 获取位置信息
import { getLocation } from '@mpxjs/api-proxy-rn'

getLocation({
  type: 'gcj02'
}).then(res => {
  console.log('位置信息', {
    latitude: res.latitude,
    longitude: res.longitude,
    accuracy: res.accuracy
  })
})

// 选择图片
import { chooseImage } from '@mpxjs/api-proxy-rn'

chooseImage({
  count: 1,
  sizeType: ['original', 'compressed'],
  sourceType: ['album', 'camera']
}).then(res => {
  console.log('选择的图片', res.tempFilePaths)
})
```

## 样式处理

### 样式转换

Mpx 会自动将小程序样式转换为 React Native 样式：

```css
/* 小程序样式 */
<style>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 750rpx;
  height: 400rpx;
  background-color: #ffffff;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 100rpx;
}
</style>
```

```javascript
// 转换后的 React Native 样式
const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // 750rpx 转换为 100%
    height: 200,   // 400rpx 转换为 200
    backgroundColor: '#ffffff',
    borderRadius: 5, // 10rpx 转换为 5
    // box-shadow 转换为 elevation (Android) 和 shadowXXX (iOS)
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  title: {
    fontSize: 16,      // 32rpx 转换为 16
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10   // 20rpx 转换为 10
  },
  image: {
    width: 100,        // 200rpx 转换为 100
    height: 100,       // 200rpx 转换为 100
    borderRadius: 50   // 100rpx 转换为 50
  }
})
```

### 单位转换规则

| 小程序单位 | React Native 转换 | 说明 |
|------------|-------------------|------|
| `rpx` | 按比例转换为数值 | 750rpx = 屏幕宽度 |
| `px` | 直接转换为数值 | 1px = 1 |
| `%` | 转换为字符串 | 保持百分比 |
| `em/rem` | 转换为数值 | 基于字体大小计算 |

### 样式限制

React Native 不支持的样式属性会被自动过滤：

```css
<style>
.element {
  /* 支持的属性 */
  width: 200rpx;
  height: 100rpx;
  backgroundColor: '#ff0000';
  borderRadius: 10rpx;
  margin: 20rpx;
  padding: 10rpx;
  
  /* 不支持的属性（会被过滤） */
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1); /* 转换为 elevation 和 shadow 属性 */
  background-image: url('image.png'); /* 不支持 */
  float: left; /* 不支持 */
  position: absolute; /* 部分支持 */
}
</style>
```

## 平台差异处理

### 条件编译

```html
<template>
  <view class="container">
    <!-- 通用内容 -->
    <text class="title">{{ title }}</text>
    
    <!-- React Native 特定内容 -->
    <!-- #ifdef rn -->
    <view class="rn-only">
      <text @tap="onRNAction">RN 专用功能</text>
    </view>
    <!-- #endif -->
    
    <!-- 小程序特定内容 -->
    <!-- #ifndef rn -->
    <button @tap="onMiniProgramAction">小程序专用功能</button>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      title: 'Hello React Native'
    }
  },
  methods: {
    // #ifdef rn
    onRNAction() {
      // React Native 平台特定逻辑
      import { Alert } from 'react-native'
      Alert.alert('提示', '这是 React Native 原生弹窗')
    },
    // #endif
    
    // #ifndef rn
    onMiniProgramAction() {
      // 小程序平台特定逻辑
      wx.showModal({
        title: '提示',
        content: '这是小程序弹窗'
      })
    }
    // #endif
  }
}
</script>

<style>
.container {
  padding: 20rpx;
}

/* #ifdef rn */
.rn-only {
  marginTop: 20;
  padding: 10;
  backgroundColor: '#f0f0f0';
}
/* #endif */
</style>
```

### 文件维度差异

对于差异较大的页面或组件，可以创建平台特定的文件：

```
pages/
├── camera/
│   ├── camera.mpx         # 小程序实现
│   └── camera.rn.mpx      # React Native 实现
└── map/
    ├── map.mpx            # 小程序实现
    └── map.rn.mpx         # React Native 实现
```

**React Native 特定实现示例：**

```html
<!-- camera.rn.mpx -->
<template>
  <view class="camera-container">
    <view class="camera-view" ref="cameraView">
      <!-- React Native 相机组件 -->
    </view>
    <view class="controls">
      <text @tap="takePicture" class="capture-btn">拍照</text>
    </view>
  </view>
</template>

<script>
export default {
  mounted() {
    this.initCamera()
  },
  methods: {
    initCamera() {
      // 初始化 React Native 相机
      // 使用 react-native-camera 或其他相机库
    },
    takePicture() {
      // 拍照逻辑
    }
  }
}
</script>

<style>
.camera-container {
  flex: 1;
  backgroundColor: '#000000';
}

.camera-view {
  flex: 1;
}

.controls {
  height: 100;
  justifyContent: 'center';
  alignItems: 'center';
  backgroundColor: 'rgba(0,0,0,0.5)';
}

.capture-btn {
  color: '#ffffff';
  fontSize: 18;
  fontWeight: 'bold';
}
</style>
```

## 原生模块集成

### 使用第三方库

```bash
# 安装常用的 React Native 库
npm install react-native-vector-icons
npm install react-native-maps
npm install react-native-camera
npm install @react-native-async-storage/async-storage

# iOS 需要执行 pod install
cd ios && pod install
```

### 地图组件示例

```html
<!-- map.rn.mpx -->
<template>
  <view class="map-container">
    <map-view
      :region="region"
      :markers="markers"
      @region-change="onRegionChange"
      @marker-press="onMarkerPress"
      class="map"
    />
  </view>
</template>

<script>
// #ifdef rn
import MapView, { Marker } from 'react-native-maps'
// #endif

export default {
  // #ifdef rn
  components: {
    MapView,
    Marker
  },
  // #endif
  
  data() {
    return {
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      },
      markers: [
        {
          id: 1,
          latitude: 37.78825,
          longitude: -122.4324,
          title: '标记点1'
        }
      ]
    }
  },
  
  methods: {
    onRegionChange(region) {
      this.region = region
    },
    
    onMarkerPress(marker) {
      console.log('点击标记', marker)
    }
  }
}
</script>

<style>
.map-container {
  flex: 1;
}

.map {
  flex: 1;
}
</style>
```

## 性能优化

### 列表优化

```html
<template>
  <view class="list-container">
    <!-- 使用 FlatList 优化长列表性能 -->
    <!-- #ifdef rn -->
    <flat-list
      :data="list"
      :render-item="renderItem"
      :key-extractor="keyExtractor"
      :get-item-layout="getItemLayout"
      :initial-num-to-render="10"
      :max-to-render-per-batch="5"
      :window-size="10"
    />
    <!-- #endif -->
    
    <!-- 小程序使用普通列表 -->
    <!-- #ifndef rn -->
    <scroll-view scroll-y class="scroll-list">
      <view v-for="item in list" :key="item.id" class="list-item">
        <text>{{ item.name }}</text>
      </view>
    </scroll-view>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      list: [] // 大量数据
    }
  },
  
  methods: {
    // #ifdef rn
    renderItem({ item }) {
      return (
        <View style={styles.listItem}>
          <Text>{item.name}</Text>
        </View>
      )
    },
    
    keyExtractor(item) {
      return item.id.toString()
    },
    
    getItemLayout(data, index) {
      return {
        length: 60, // 每个项目的高度
        offset: 60 * index,
        index
      }
    }
    // #endif
  }
}
</script>
```

### 图片优化

```html
<template>
  <view class="image-container">
    <!-- React Native 图片优化 -->
    <!-- #ifdef rn -->
    <image
      :source="{ uri: imageUrl }"
      :resize-mode="'cover'"
      :cache="'force-cache'"
      :loading-indicator-source="loadingImage"
      class="optimized-image"
      @load="onImageLoad"
      @error="onImageError"
    />
    <!-- #endif -->
    
    <!-- 小程序图片 -->
    <!-- #ifndef rn -->
    <image
      :src="imageUrl"
      :mode="'aspectFill'"
      :lazy-load="true"
      class="normal-image"
    />
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      imageUrl: 'https://example.com/image.jpg',
      loadingImage: require('@/assets/loading.png')
    }
  },
  
  methods: {
    onImageLoad() {
      console.log('图片加载完成')
    },
    
    onImageError(error) {
      console.error('图片加载失败', error)
    }
  }
}
</script>
```

## 调试和测试

### 开发调试

```bash
# 启动 Metro 服务器
npm run serve:rn

# 在另一个终端运行应用
npm run ios     # 运行 iOS 应用
npm run android # 运行 Android 应用
```

### 真机调试

```bash
# iOS 真机调试
npm run ios -- --device

# Android 真机调试
npm run android -- --variant=release
```

### 性能监控

```javascript
// 性能监控
import { Performance } from 'react-native'

// 监控页面加载时间
const startTime = Performance.now()

// 页面加载完成后
const endTime = Performance.now()
console.log(`页面加载时间: ${endTime - startTime}ms`)

// 内存使用监控
import { DeviceInfo } from 'react-native'

DeviceInfo.getUsedMemory().then(usedMemory => {
  console.log(`已使用内存: ${usedMemory}MB`)
})
```

## 打包发布

### iOS 打包

```bash
# 生成 iOS 发布包
cd ios
xcodebuild -workspace MyApp.xcworkspace -scheme MyApp -configuration Release -archivePath MyApp.xcarchive archive

# 导出 IPA
xcodebuild -exportArchive -archivePath MyApp.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist
```

### Android 打包

```bash
# 生成 Android 发布包
cd android
./gradlew assembleRelease

# 生成的 APK 位于
# android/app/build/outputs/apk/release/app-release.apk
```

### 自动化打包

```javascript
// package.json
{
  "scripts": {
    "build:rn": "mpx-cli-service build --target=rn",
    "build:ios": "npm run build:rn && cd ios && xcodebuild -workspace MyApp.xcworkspace -scheme MyApp -configuration Release archive",
    "build:android": "npm run build:rn && cd android && ./gradlew assembleRelease"
  }
}
```

## 最佳实践

### 1. 代码组织

- 合理使用条件编译，避免过度使用
- 将平台特定代码抽离到单独文件
- 建立统一的组件库和工具库

### 2. 性能优化

- 使用 FlatList 优化长列表
- 合理使用图片缓存和懒加载
- 避免在 render 中进行复杂计算

### 3. 用户体验

- 保持与原生应用一致的交互体验
- 合理使用原生组件和动画
- 做好错误处理和加载状态

### 4. 开发效率

- 建立完善的开发和调试流程
- 使用热重载提高开发效率
- 建立自动化测试和打包流程

## 下一步

- [React Native 平台差异处理](./differences.md)
- [React Native 性能优化](./optimization.md)
- [React Native 原生模块开发](./native-modules.md)