# Skyline 配置项与接入规范参考

## 目录

- [接入代码配置](#接入代码配置)
  - [全局 skyline 配置](#全局-skyline-配置)
  - [页面 json 配置](#页面-json-配置)
  - [Worklet Babel 插件](#worklet-babel-插件)
- [rendererOptions 配置项](#rendereroptions-配置项)
  - [defaultDisplayBlock](#defaultdisplayblock)
  - [defaultContentBox](#defaultcontentbox)
  - [tagNameStyleIsolation](#tagnamestyleisolation)
  - [enableScrollViewAutoSize](#enablescrollviewautosize)
  - [keyframeStyleIsolation](#keyframestylisolation)
- [WebView/Skyline 混合渲染](#webviewskyline-混合渲染)
- [glass-easel 变更点适配](#glass-easel-变更点适配)
- [预加载优化](#预加载优化)
- [上线与放量](#上线与放量)
- [微信 Bug 反馈流程](#微信-bug-反馈流程)
- [微信 App 版本与基础库关系](#微信-app-版本与基础库关系)

---

## 接入代码配置

### 全局 skyline 配置

小程序需要新增的全局 Skyline 配置（在 `app.json` 中）：

```json
{
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true
    }
  }
}
```

- `lazyCodeLoading`：按需注入组件代码
- `rendererOptions.skyline.defaultDisplayBlock`：将 Skyline 默认布局从 flex 改为 block，对齐 WebView 行为

### 页面 json 配置

要适配 Skyline 的页面，json 配置新增：

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "disableScroll": true,
  "navigationStyle": "custom"
}
```

| 字段 | 说明 |
| --- | --- |
| `renderer` | 渲染引擎，`skyline` 或 `webview` |
| `componentFramework` | 组件框架，Skyline 下必须为 `glass-easel` |
| `disableScroll` | 禁止页面滚动，Skyline 不支持页面滚动，必须设为 `true` |
| `navigationStyle` | 导航样式，Skyline 不支持默认导航，必须设为 `custom` |

### Worklet Babel 插件

如果页面使用到 worklet 函数，需要配置 Babel 插件：

```bash
npm i babel-plugin-worklet@0.0.5
```

Mpx 项目中通过 `overrides` 配置：

```json
{
  "overrides": [{
    "include": ["./src/components/worklet/gesture.mpx"],
    "plugins": [
      ["@babel/plugin-transform-arrow-functions"],
      ["@babel/plugin-transform-shorthand-properties"],
      ["@babel/plugin-proposal-class-properties"],
      "babel-plugin-worklet"
    ]
  }]
}
```

**注意**：配置 worklet Babel 插件后，**不需要勾选**「将 JS 编译成 ES5」（会导致包体积增加）。

## rendererOptions 配置项

在 `app.json` 或 `page.json` 中通过 `rendererOptions.skyline` 配置：

```json
{
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "enableScrollViewAutoSize": true,
      "keyframeStyleIsolation": "legacy"
    }
  }
}
```

### defaultDisplayBlock

将 Skyline 默认布局从 `flex` 改为 `block`，对齐 WebView 行为。

| 平台 | 最低版本 |
| --- | --- |
| Android | 8.0.34 |
| iOS | 8.0.36 |
| 基础库 | 2.31.1 |

```json
{
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true
    }
  }
}
```

### defaultContentBox

将 Skyline 默认盒模型从 `border-box` 改为 `content-box`，对齐 WebView 行为。

| 平台 | 最低版本 |
| --- | --- |
| Android / iOS | 8.0.42 |
| 基础库 | 3.1.0 |

```json
{
  "rendererOptions": {
    "skyline": {
      "defaultContentBox": true
    }
  }
}
```

### tagNameStyleIsolation

控制 tag 选择器的样式隔离行为。

| 值 | 说明 |
| --- | --- |
| `isolated` | 遵循样式隔离机制（Skyline 默认行为） |
| `legacy` | 对齐 WebView 表现，tag 选择器不受样式隔离约束 |

| 平台 | 最低版本 |
| --- | --- |
| Android / iOS | 8.0.51 |
| 基础库 | 3.6.0 |

### enableScrollViewAutoSize

开启 scroll-view 自动根据内容撑开，替代默认需要指定宽高的行为。

| 平台 | 最低版本 |
| --- | --- |
| Android / iOS | 8.0.54 |
| 基础库 | 3.7.2 |

```json
{
  "rendererOptions": {
    "skyline": {
      "enableScrollViewAutoSize": true
    }
  }
}
```

### keyframeStyleIsolation

控制 `@keyframe` 规则的样式隔离行为。

| 值 | 说明 |
| --- | --- |
| `isolated` | 遵循样式隔离机制（Skyline 默认行为） |
| `legacy` | 对齐 WebView 表现，@keyframe 不受样式隔离约束 |

| 平台 | 最低版本 |
| --- | --- |
| Android / iOS | 8.0.57 |
| 基础库 | 3.8.0 |

## WebView/Skyline 混合渲染

Skyline 渲染引擎下，页面有两种渲染模式：WebView 和 Skyline，通过页面配置中的 `renderer` 字段区分。

- **页面级配置**：每个页面可独立选择 `renderer: 'skyline'` 或 `renderer: 'webview'`
- **web-view 页面**：必须使用 `renderer: 'webview'`，建议承载 web-view 的页面单独配置
- **自定义路由**：仅在连续的 Skyline 页面间跳转时才支持自定义路由效果
- **降级机制**：不支持 Skyline 渲染的微信版本会自动降级为 WebView 渲染

**重要**：适配过程中必须保证 WebView 渲染引擎和支付宝小程序下 iOS 和 Android 机型渲染正常。这样在 Skyline 有问题时可以关量走 WebView 渲染；在不支持 Skyline 的微信版本上，微信也会降级为 WebView。

## glass-easel 变更点适配

Skyline 使用 `glass-easel` 作为组件框架，与 WebView 下的组件框架存在一些变更点需要适配：

- **JSON 配置差异**：`componentFramework: 'glass-easel'` 必须声明
- **组件行为差异**：部分组件在 glass-easel 下的行为与旧组件框架不同
- **properties 默认值**：必须使用 `value` 字段，`default` 字段无效
- **properties 类型校验**：更严格，类型不匹配会报错，可用 `type: null` 跳过
- **initData 机制**：glass-easel 新增 `initData` 声明初始化数据，wx:for 绑定 computed 属性时需提供默认值
- **异步组件时序**：`attached` 可能在渲染前触发，依赖 DOM 信息的逻辑应移至 `ready`
- **wxs 跨包引用**：主包无 glass-easel 组件时 wxs 跨包引用可能报错，需在主包添加空 glass-easel 组件

详细的 glass-easel 适配指引参考微信官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/glass-easel/migration.html

详细的踩坑记录与适配示例见 [适配最佳实践 · glass-easel 适配注意](./skyline-migration-practice.md#glass-easel-适配注意)。

## 预加载优化

`wx.preloadSkylineView` 接口可预加载 Skyline 环境，用于加速后续 Skyline 页面的打开：

```js
// 在可能跳转到 Skyline 页面的路径上调用
Page({
  onShow() {
    // 延迟一段时间后预加载（建议设为该页面的 90 分位加载时长）
    setTimeout(() => {
      wx.preloadSkylineView()
    }, this.pageLoadP90)
  }
})
```

建议在 `onShow` 生命周期里延迟一段时间后调用，使得 Skyline 页面被返回时能够重新预载。

**已知问题**：`wx.redirectTo` 跳转到已预加载的 Skyline 页面后，退出操作可能异常。如遇到此问题，暂时移除 `preloadSkylineView` 调用。
