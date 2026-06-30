# Skyline 配置项与接入规范参考

## 目录

- [适用场景](#适用场景)
- [skyline 配置](#skyline-配置)
  - [三级配置层次](#三级配置层次)
  - [必要配置](#必要配置)
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


### 必要配置

| 配置项 | 类型 | 默认值 | 推荐值 | 说明                                    |
|--------|------|--------|--------|---------------------------------------|
| `defaultDisplayBlock` | boolean | false | true | 默认 display:block（对齐 WebView）          |
| `defaultContentBox` | boolean | false | true | 默认 box-sizing:content-box（对齐 WebView） |
| `tagNameStyleIsolation` | string | "isolated" | "legacy" | 标签选择器全局匹配（对齐 WebView）                 |
| `enableScrollViewAutoSize` | boolean | false | true | scroll-view 自动撑开高度                    |
| `disableABTest` | boolean | false | true | 关闭 Skyline AB 实验，确保稳定性（非必要配置）         |

> 说明：前 4 项（`defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize`）是对齐 WebView 行为的**必配项**，适配时务必逐项补齐。`disableABTest` 为**非必填**：仅在需要关闭 Skyline 灰度 AB 实验、强制全量走 Skyline 以排除实验态干扰时按需开启，常规适配可不配，不作为校验项。

**项目配置 app.json 新增以下配置**

 ```json5
// 对齐 webview
{
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "enableScrollViewAutoSize": true
    }
  }
}
```

> 注意：上述配置项均为 `rendererOptions.skyline` 的子项，须写在该对象内，**不要**放到 app.json 顶层；只有 `lazyCodeLoading` 是顶层配置。补齐 app.json 时务必逐项核对前 4 项必配项都不遗漏；`disableABTest` 按需选配。

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
