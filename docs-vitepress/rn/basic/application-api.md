# 应用能力

本节介绍在 React Native 环境下 Mpx 支持的各种应用能力，包括配置、状态管理、API适配等核心功能。

### 目录概览

- [配置能力](#配置能力) - App配置、页面配置、导航配置
- [状态管理](#状态管理-1) - Pinia、Store、依赖注入
- [国际化](#国际化) - i18n多语言支持
- [API能力](#api能力) - 跨平台API、Webview通信
- [rnConfig 相关内容](#rnconfig-相关内容) - 异步分包、分享、路由控制、屏幕适配


## 配置能力

### App 全局配置

对标参考 [微信 app 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)，以下为 RN 环境支持情况：

| 配置项 | 支持状态 | 说明 |
|--------|----------|------|
| ✅ entryPagePath | 完全支持 | 应用启动首页路径 |
| ✅ pages | 完全支持 | 页面路径列表 |
| ⚠️ window | 部分支持 | 详见下方 window 配置 |
| ❌ tabbar | 暂不支持 | 底部标签栏配置 |
| ✅ networkTimeout | 完全支持 | 网络超时设置 |
| ✅ subpackages | 完全支持 | 分包结构配置|
| ✅ usingComponents | 完全支持 | 全局自定义组件注册 |
| ✅ vw | 完全支持 | 视窗单位支持 |

### Window 导航配置

Window 配置控制应用导航栏外观，参考 [微信 window 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#window)：

| 配置项 | 支持状态 | 说明 |
|--------|----------|------|
| ✅ navigationBarBackgroundColor | 完全支持 | 导航栏背景颜色 |
| ✅ navigationBarTextStyle | 完全支持 | 导航栏文字颜色 |
| ✅ navigationStyle | 完全支持 | 导航栏样式 |
| ✅ backgroundColor | 完全支持 | 页面背景颜色 |

### 页面配置

页面级别配置，参考 [微信页面配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)：

| 配置项 | 支持状态 | 说明 |
|--------|----------|------|
| ✅ navigationBarBackgroundColor | 完全支持 | 页面导航栏背景色 |
| ✅ navigationBarTextStyle | 完全支持 | 页面导航栏文字颜色 |
| ✅ navigationStyle | 完全支持 | 页面导航栏样式 |
| ✅ backgroundColor | 完全支持 | 页面背景颜色 |
| ✅ usingComponents | 完全支持 | 页面组件注册 |
| ❌ disableScroll | 不支持 | RN 默认不支持页面滚动，需使用 scroll-view 组件 |


## 状态管理

### Pinia 状态管理

**支持状态：✅ 完全支持**

Mpx 在 RN 环境下完整支持 Pinia 状态管理方案，提供响应式状态管理能力。

```js
// 示例：使用 Pinia Store
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    isLogin: false
  }),
  actions: {
    setUserInfo(info) {
      this.userInfo = info
      this.isLogin = true
    }
  }
})
```

📖 **详细文档：** [Pinia 状态管理指南](/guide/advance/pinia.html)

### Store 状态管理

**支持状态：✅ 完全支持**

支持 Mpx 原生的 Store 状态管理方案，兼容小程序开发习惯。

📖 **详细文档：** [Store 状态管理指南](/guide/advance/store.html)

### 依赖注入

**支持状态：✅ 完全支持**

支持 Provide/Inject 依赖注入模式，便于组件间状态共享。

📖 **详细文档：** [依赖注入指南](/guide/advance/provide-inject.html#依赖注入-provide-inject)


## 国际化

**支持状态：✅ 完全支持**

Mpx 的 i18n 国际化功能在 RN 环境下保持完整支持。

📖 **详细文档：** [国际化 i18n 指南](/guide/advance/i18n.html)

## API 能力

### 跨平台 API 适配

通过 `@mpxjs/api-proxy` 提供跨平台的小程序 API 适配能力，在 RN 环境中保持与小程序一致的使用方式。部分 API 能力相比小程序有所限制，详细支持列表请[查看完整文档](/api/extend.html#api-proxy)。

#### 使用说明

#### 1. 安装和配置

**步骤1：引入 @mpxjs/api-proxy**

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, { usePromise: true })
```

**步骤2：配置 Externals**

使用 mpx-cli 创建的项目已默认配置，无需手动设置。如需自定义，参考：

```js
// vue.config.js
externals: {
  '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage',
  '@react-native-clipboard/clipboard': '@react-native-clipboard/clipboard',
  '@react-native-community/netinfo': '@react-native-community/netinfo',
  'react-native-device-info': 'react-native-device-info',
  'react-native-safe-area-context': 'react-native-safe-area-context',
  'react-native-reanimated': 'react-native-reanimated',
  'react-native-get-location': 'react-native-get-location',
  'react-native-haptic-feedback': 'react-native-haptic-feedback'
}
```

#### 2. 依赖安装

根据使用的 API 选择性安装依赖：

| API 功能 | 相关方法 | 依赖包 |
|----------|----------|--------|
| **弹窗选择** | `showActionSheet` | `react-native-reanimated` |
| **网络状态** | `getNetworkType`、`onNetworkStatusChange` | `@react-native-community/netinfo` |
| **位置服务** | `getLocation`、`openLocation`、`chooseLocation` | `react-native-get-location` |
| **本地存储** | `setStorage`、`getStorage`、`removeStorage` | `@react-native-async-storage/async-storage` |
| **设备信息** | `getSystemInfo`、`getDeviceInfo` | `react-native-device-info` |
| **安全区域** | `getWindowInfo`、`getLaunchOptionsSync` | `react-native-safe-area-context` |
| **震动反馈** | `vibrateShort`、`vibrateLong` | `react-native-haptic-feedback` |

**按需安装示例：**

```bash
# 示例：只使用存储和设备信息API
npm install @react-native-async-storage/async-storage react-native-device-info

# 示例：使用位置服务
npm install react-native-get-location

# 示例：使用网络状态监听
npm install @react-native-community/netinfo

# iOS 项目需要执行（有原生依赖时）
cd ios && pod install
```

> 💡 **建议：** 根据实际使用的 API 选择安装对应依赖，避免不必要的包体积增加

#### 3. 平台特殊配置

**react-native-get-location**

Android 权限配置：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

**react-native-haptic-feedback**

Android 需要额外配置，参考 [官方文档](https://github.com/mkuczera/react-native-haptic-feedback)：

1. 在 `android/app/src/main/java/[...]/MainApplication.java` 顶部导入：

```java
import com.mkuczera.RNReactNativeHapticFeedbackPackage;
```

2. 在 `android/settings.gradle` 中添加：

```
include ':react-native-haptic-feedback'
project(':react-native-haptic-feedback').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-haptic-feedback/android')
```

**react-native-reanimated**

在 `babel.config.js` 中添加插件，参考 [官方文档](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)：

```js
module.exports = {
  presets: ['...'],
  plugins: [
    // 其他插件...
    'react-native-reanimated/plugin', // 必须放在最后
  ],
}
```

> ⚠️ **注意：** 确保 Mpx 项目和容器中的 `react-native-reanimated` 版本一致

### 跨平台 API 使用限制

#### createSelectorQuery

**上下文指定：** RN 环境下必须手动调用 `.in(this)` 指定组件上下文

```js
import { createComponent } from '@mpxjs/core'

createComponent({
  attached() {
    const query = wx.createSelectorQuery().in(this) // ⚠️ 必须指定组件实例
    query.select('#the-id').boundingClientRect((rect) => {
      console.log('rect', rect)
    })
    .exec()
  }
})
```

**选择器限制：** RN 环境仅支持以下选择器类型

| 选择器类型 | 格式 | 示例 |
|------------|------|------|
| ID 选择器 | `#id` | `#my-element` |
| Class 选择器 | `.class` | `.item` |
| 多 Class 选择器 | `.class1.class2` | `.item.active.selected` |

> ❌ **不支持：** 标签选择器、属性选择器、伪类选择器等

### Webview 通信

Mpx 提供 `@mpxjs/webview-bridge` 来实现 H5 页面与 RN 应用的双向通信，具体使用方式参考[webview-bridge](/guide/extend/webview-bridge.html)文档。

## 高级特性

`rnConfig` 是 Mpx 框架专为 React Native 环境提供的配置对象，用于定制 RN 平台特有的行为和功能。通过 `mpx.config.rnConfig` 可以配置异步分包、分享、路由控制、屏幕适配等高级特性。
  
### 异步分包

Mpx 在 RN 环境下实现了与微信小程序同等的异步分包功能，支持按需加载分包内容。基础使用可参考 [异步分包指南](https://www.mpxjs.cn/guide/advance/async-subpackage.html)

在异步分包的能力实现当中我们借助了 RN 容器提供的分包下载执行/分包拉取的 api，因此在你的应用开始使用异步分包的功能之前需要在运行时代码提前部署好 RN 容器提供的相关 api 以供 Mpx 应用使用：

```js
import mpx from '@mpxjs/core'

// 配置分包加载器
mpx.config.rnConfig.loadChunkAsync = function (config) {
  // 分包下载并执行 api
  return drnLoadChunkAsync(config.package)
}

mpx.config.rnConfig.downloadChunkAsync = function (packages) {
  if (packages && packages.length) {
    // 分包拉取 api
    drnDownloadChunkAsync(packages)
  }
}
```

#### 构建配置

在 `mpx.config.js` 中配置异步分包选项：

```js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        asyncChunk: {
          timeout: 5000, // 加载超时时间(ms)
          loading: path.resolve(__dirname, 'src/components/loading.mpx'),    // 加载页面
          fallback: path.resolve(__dirname, 'src/components/fallback.mpx')   // 兜底页面
        }
      }
    }
  }
})
```

#### 错误处理

**组件加载失败监听**：微信小程序提供了 wx.onLazyLoadError 的全局 api 来监听异步组件加载失败，这个 api 同样在 Mpx 转 RN 场景下生效；



```js
mpx.onLazyLoadError((error) => {
  console.error('异步组件加载失败:', error)
})
```

**页面加载失败监听**：微信小程序未提供相关的监听异常的 api，Mpx 转 RN 提供了一个额外的全局监听函数


```js
// RN 环境特有
mpx.config.rnConfig.onLazyLoadPageError = (error) => {
  console.error('异步页面加载失败:', {
    subpackage: error.subpackage, // 分包名
    errType: error.errType        // 'timeout' | 'fail'
  })
}
```

#### 自定义兜底页面

对于异步分包页面加载失败的情况会展示默认兜底页面，用户可以点击兜底页面底部的重试按钮重新加载异步分包页面。那么对于开发者提供的自定义的 fallback 兜底页面，框架会自动给自定义页面注入一个 `onReload` 方法以供开发者做页面重试的操作，具体见下方示例：

```html
<template>
  <view class="fallback-container">
    <view class="error-message">页面加载失败</view>
    <view class="retry-btn" bindtap="handleRetry">点击重试</view>
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  props: {
    onReload: Function // 框架自动注入
  },
  methods: {
    handleRetry() {
      this.onReload?.() // 触发重新加载
    }
  }
})
</script>

<style>
.fallback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.retry-btn {
  margin-top: 20rpx;
  padding: 10rpx 20rpx;
  background-color: #007aff;
  color: white;
  border-radius: 4rpx;
}
</style>
```

### 分享

#### mpx.config.rnConfig.openTypeHandler.onShareAppMessage

当使用 [button 组件](./rn.html#button) 并指定 `open-type="share"` 时，将触发分享。在 RN 中的分享实现需由容器实现，可在 onShareAppMessage 中调用容器提供的能力完成分享逻辑实现。

其参数为当前页面的 onShareAppMessage 钩子返回内容，如果返回返回内容中包含 promise，将会在 fulfilled 后将其结果合并再触发 onShareAppMessage

```ts
(shareInfo: { title: string, path: string, imageUrl?: string }) => void
```

### 路由

#### mpx.config.rnConfig.parseAppProps

```ts
(props: Record<string, any>) => ({ initialRouteName: string, initialParams: Record<string, any> }| void)
```

用于获取初始路由配置的函数，参数为 RN 根组件接收到的参数

- initialRouteName: 首页路径，例如 pages/index
- initialParams: 将作为 首页onLoad 与 应用onLaunch 的参数，例如 \{ a: 1 \}

在需要将 RN 应用嵌入到现有的 NA 应用中时，NA 可能会向 RN 的根组件传递 props，此时可在 parseAppProps 中接受 props 并进行处理和透传到页面

#### mpx.config.rnConfig.onStateChange

```ts
(state: Record<string, any>) => void
```

当导航状态发生变化时触发，例如页面跳转、返回等。

在需要将 RN 应用嵌入到现有的 NA 应用中时，可能需要将 RN 的路由栈同步到 NA 中以便于进行路径关系，此时可在此回调中将 RN 路径栈同步到容器中。

#### mpx.config.rnConfig.onAppBack

```ts
() => boolean
```

页面栈长度为 1（即根页面）且用户尝试退出 App 时触发。

- true：允许退出应用
- false：阻止退出应用

#### mpx.config.rnConfig.onStackTopBack

控制首页回退按钮是否展示，并监听点击事件。

如果绑定该函数，则首页显示返回按钮，点击后调用该函数作为回调，如果未绑定该函数，则首页不会展示返回按钮。

如需实现点击返回，请在函数内部手动调用 back。

在需要将 RN 应用嵌入到现有的 NA 应用中时，可能 RN 应用到首页并不是 NA 应用的首页，此时可能需要 RN 应用首页展示返回按钮

### 折叠屏适配

#### mpx.config.rnConfig.customDimensions

```ts
(dimensions: { window: ScaledSize; screen: ScaledSize }) => { window: ScaledSize; screen: ScaledSize } | void
```

在某些情况下，我们可能不希望当前应用全屏展示，Mpx 内部基于 ScreenWidth 与 ScreenHeight 作为 rpx、vh、vw、媒体查询、onResize等特性的依赖内容，此时可在 `mpx.config.rnConfig.customDimensions` 中自定义 screen 尺寸信息来得到想要的渲染效果。

可在此方法中返回修改后的 dimensions，如果无返回或返回 undefined，则以入参作为返回值

例如: 在折叠屏中我们期望只在其中一半屏上展示，可在 customDimensions 中判断当前是否为折叠屏展开状态，如果是则将 ScreenWidth 设置为原来的一半。


### 前后台切换

#### mpx.config.rnConfig.disableAppStateListener

```ts
boolean
```

Mpx 框架默认会使用 `ReactNative.AppState.addEventListener('change', callback)` 作为 Mpx 应用切换切换台的驱动，从而触发对于的钩子（如onhide/onshow）

在需要将 RN 应用嵌入到现有的 NA 应用中时，可能会出现AppState触发时机异常的情况（例如从 RN 页面跳转到 NA 页面时），此时可以将 disableAppStateListener 设置为 true 来禁用框架内部对 AppState 的监听。但需要在合适的时机手动调用 setAppShow() 与 setAppHide() 方法来进行驱动以确保对于的钩子能正常触发。
