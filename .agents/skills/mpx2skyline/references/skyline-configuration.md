# Skyline 配置项与接入规范参考

## 目录

- [适用场景](#适用场景)
- [Skyline 配置](#skyline-配置)
  - [三级配置层次](#三级配置层次)
  - [rendererOptions.skyline 配置项](#rendereroptionsskyline-配置项)
  - [app.json 顶层配置](#appjson-顶层配置)
  - [其他配置项](#其他配置项)
  - [适配参考](#适配参考)
- [Worklet Babel 插件](#worklet-babel-插件)

---

## 适用场景

- 创建新的 Skyline 小程序项目
- 从 WebView 迁移到 Skyline 渲染引擎
- 配置混合渲染（部分页面 Skyline、部分 WebView）
- 配置 rendererOptions 优化样式兼容性
- 排查 Skyline 配置相关的编译错误

## Skyline 配置

### 三级配置层次

| 层级 | 文件 | 作用 | 关键配置 |
|------|------|------|----------|
| 全局 | `app.json` | 全局启用 Skyline | renderer, componentFramework, rendererOptions |
| 页面 | `页面.json` | 页面级配置/覆盖 | navigationStyle, disableScroll, renderer |
| 工具 | `project.config.json` | 开发者工具调试 | setting.skylineRenderEnable |

### rendererOptions.skyline 配置项

| 配置项 | 类型 | 默认值 | 推荐值 | 说明                                    |
|--------|------|--------|--------|---------------------------------------|
| `defaultDisplayBlock` | boolean | false | true | 默认 `display: block`（对齐 WebView）          |
| `defaultContentBox` | boolean | false | true | 默认 `box-sizing: content-box`（对齐 WebView） |
| `tagNameStyleIsolation` | string | "isolated" | "legacy" | 标签选择器全局匹配（对齐 WebView）                 |
| `enableScrollViewAutoSize` | boolean | false | true | scroll-view 自动撑开高度                    |
| `keyframeStyleIsolation` | string | - | "legacy" | `@keyframes` 全局共享，避免迁移项目中动画关键帧作用域变化 |
| `disableABTest` | boolean | false | 按需 | 关闭 Skyline AB 实验，确保稳定性（非必要配置）         |

> 说明：前 5 项（`defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` / `keyframeStyleIsolation`）是对齐 WebView 行为的**推荐补齐项**，适配时务必逐项核对。`disableABTest` 为**非必填**：仅在需要关闭 Skyline 灰度 AB 实验、强制全量走 Skyline 以排除实验态干扰时按需开启，常规适配可不配，不作为校验项。

### app.json 顶层配置

| 配置项 | 位置 | 类型 | 推荐值 / 示例               | 说明                                                                                |
|--------|------|------|------------------------|-----------------------------------------------------------------------------------|
| `lazyCodeLoading` | `app.json` 顶层 | string | `"requiredComponents"` | 开启按需注入用到的组件代码，降低页面初始化时一次性注入的代码量，Skyline 必需，WebView 可按需         |
| `convertRpxToVw` | `app.json` 顶层 | boolean | 按需  | 基础库 3.3.0+；开启后会将 WebView rpx 计算逻辑对齐 Skyline（`rpx` 单位转换为 `vw` 单位），用于修复部分 `rpx` 精度问题 |

### 其他配置项

| 配置项 | 位置 | 类型 | 推荐值 / 示例 | 说明 |
|--------|------|------|---------------|------|
| `backgroundColorContent` | 页面 JSON | HexColor | `"#00000000"` | Skyline 特有页面配置；设置页面容器背景色，支持 `#RRGGBBAA` 透明度格式，常用于自定义路由透明背景 |

### 适配参考

**项目配置 app.json 新增以下配置**

```json5
// 对齐 WebView
{
  "lazyCodeLoading": "requiredComponents",
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

> 注意：`defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` / `keyframeStyleIsolation` 均为 `rendererOptions.skyline` 的子项，须写在该对象内，**不要**放到 app.json 顶层；`lazyCodeLoading` 与 `convertRpxToVw` 是 app.json 顶层配置。补齐 app.json 时务必逐项核对上述推荐项都不遗漏；`convertRpxToVw` 和 `disableABTest` 除外，可按需选配。

**适配 Skyline 页面的 page.json 新增以下配置**

```json5
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "navigationStyle": "custom",
  "disableScroll": true
}
```

`backgroundColorContent` 按页面需要配置：普通页面可不配；需要透明页面容器背景（如自定义路由转场、弹层页）时单独添加：

```json5
{
  "backgroundColorContent": "#00000000"
}
```

---

## Worklet Babel 插件

如果页面使用到 Worklet 函数，需要配置 Babel 插件：

```bash
npm i babel-plugin-worklet
```

Mpx 项目中通过 `overrides` 配置：

```json5
{
  "overrides": [{
    // 组件路径
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

**注意**：
- 配置 Worklet Babel 插件后，**不需要勾选**「将 JS 编译成 ES5」（会导致包体积增加）
- 若未配置以上插件，则需要开启开发者工具的「编译 Worklet 函数」选项；「将 JS 编译成 ES5」也可以，但更推荐集成 Babel 插件按需编译

---
