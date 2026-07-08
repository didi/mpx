# Skyline 配置项与接入规范参考

## 目录

- [适用场景](#适用场景)
- [skyline 配置](#skyline-配置)
  - [三级配置层次](#三级配置层次)
  - [rendererOptions.skyline 配置项](#rendereroptionsskyline-配置项)
  - [其他配置项](#其他配置项)
- [Worklet Babel 插件](#worklet-babel-插件)

---

## 适用场景

- 创建新的 Skyline 小程序项目
- 从 WebView 迁移到 Skyline 渲染引擎
- 配置混合渲染（部分页面 Skyline、部分 WebView）
- 配置 rendererOptions 优化样式兼容性
- 排查 Skyline 配置相关的编译错误

## skyline 配置

### 三级配置层次

| 层级 | 文件 | 作用 | 关键配置 |
|------|------|------|----------|
| 全局 | `app.json` | 全局启用 Skyline | renderer, componentFramework, rendererOptions |
| 页面 | `页面.json` | 页面级配置/覆盖 | navigationStyle, disableScroll, renderer |
| 工具 | `project.config.json` | 开发者工具调试 | setting.skylineRenderEnable |


### rendererOptions.skyline 配置项

| 配置项 | 类型 | 默认值 | 推荐值 | 说明                                    |
|--------|------|--------|--------|---------------------------------------|
| `defaultDisplayBlock` | boolean | false | true | 默认 display:block（对齐 WebView）          |
| `defaultContentBox` | boolean | false | true | 默认 box-sizing:content-box（对齐 WebView） |
| `tagNameStyleIsolation` | string | "isolated" | "legacy" | 标签选择器全局匹配（对齐 WebView）                 |
| `enableScrollViewAutoSize` | boolean | false | true | scroll-view 自动撑开高度                    |
| `keyframeStyleIsolation` | string | - | "legacy" | `@keyframes` 全局共享，避免迁移项目中动画关键帧作用域变化 |
| `disableABTest` | boolean | false | true | 关闭 Skyline AB 实验，确保稳定性（非必要配置）         |

> 说明：前 5 项（`defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` / `keyframeStyleIsolation`）是对齐 WebView 行为的**推荐补齐项**，适配时务必逐项核对。`disableABTest` 为**非必填**：仅在需要关闭 Skyline 灰度 AB 实验、强制全量走 Skyline 以排除实验态干扰时按需开启，常规适配可不配，不作为校验项。

### 其他配置项

| 配置项 | 位置 | 类型 | 推荐值 / 示例 | 说明 |
|--------|------|------|---------------|------|
| `convertRpxToVw` | `app.json` 顶层 | boolean | true | 基础库 3.3.0+；开启后将 `rpx` 单位转换为 `vw` 单位，用于修复部分 `rpx` 精度问题 |
| `backgroundColorContent` | 页面 json | HexColor | `"#00000000"` | Skyline 特有页面配置；设置页面容器背景色，支持 `#RRGGBBAA` 透明度格式，常用于自定义路由透明背景 |

**项目配置 app.json 新增以下配置**

 ```json5
// 对齐 webview
{
  "lazyCodeLoading": "requiredComponents",
  "convertRpxToVw": true,
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

> 注意：`defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` / `keyframeStyleIsolation` 均为 `rendererOptions.skyline` 的子项，须写在该对象内，**不要**放到 app.json 顶层；`lazyCodeLoading` 与 `convertRpxToVw` 是 app.json 顶层配置。补齐 app.json 时务必逐项核对上述推荐项都不遗漏；`disableABTest` 按需选配。

**适配 skyline 页面的 page.json新增以下配置**

```json5
// 
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

如果页面使用到 worklet 函数，需要配置 Babel 插件：

```bash
npm i babel-plugin-worklet@0.0.5
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
- 配置 worklet Babel 插件后，**不需要勾选**「将 JS 编译成 ES5」（会导致包体积增加）
- 若未配置以上插件，则需要在开启开发者工具 "编译 worklet 函数" 选项（（"将 JS 编译成 ES5" 选项也可以，更推荐集成 babel 插件按需编译）

---
