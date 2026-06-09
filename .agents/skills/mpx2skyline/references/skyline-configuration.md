# Skyline 配置项与接入规范参考

## 目录

- [应用配置（app.json）](#应用配置appjson)
- [Worklet Babel 插件](#worklet-babel-插件)
- [页面配置（页面.json）](#页面配置页面json)
  - [混合渲染策略](#混合渲染策略)
- [开发者工具配置（project.config.json）](#开发者工具配置projectconfigjson)
- [配置模板](#配置模板)
  - [新项目](#新项目)
  - [迁移项目](#迁移项目)
  - [混合渲染（渐进式迁移）](#混合渲染渐进式迁移)
  - [标准页面 json 模板](#标准页面-json-模板)
---

## 应用配置（app.json）

全局配置，决定小程序的默认渲染器、组件框架及 Skyline 行为选项。

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "enableScrollViewAutoSize": true,
      "disableABTest": true
    }
  },
  "window": {
    "navigationStyle": "custom"
  },
  "convertRpxToVw": true
}
```

| 字段 | 说明 |
| --- | --- |
| `renderer` | 全局默认渲染引擎。`"skyline"` 使用 Skyline 引擎，`"webview"` 使用 WebView（默认）。基础库 2.30.4+。 |
| `componentFramework` | 组件框架。Skyline 项目**必须**设为 `"glass-easel"`（默认 `"exparser"`）。基础库 2.30.4+。 |
| `lazyCodeLoading` | 设为 `"requiredComponents"` 开启按需注入，仅在用到时才加载组件代码，优化启动性能。基础库 2.11.1+。 |
| `rendererOptions.skyline.defaultDisplayBlock` | `true`：将默认布局从 `flex`（Skyline 默认）改为 `block`，同时 `flex-direction` 默认值 `column→row`、`align-items` 默认值 `stretch→normal`，对齐 WebView 行为。迁移项目强烈建议开启。基础库 2.31.1+。 |
| `rendererOptions.skyline.defaultContentBox` | `true`：将默认盒模型从 `border-box`（Skyline 默认）改为 `content-box`，对齐 WebView 行为。基础库 3.1.0+。 |
| `rendererOptions.skyline.tagNameStyleIsolation` | 标签选择器作用域。`"isolated"`（默认）：仅匹配当前组件；`"legacy"`：全局匹配，对齐 WebView。基础库 3.6.0+。 |
| `rendererOptions.skyline.enableScrollViewAutoSize` | `true`：scroll-view 自动根据内容撑开，无需显式指定高度。基础库 3.7.2+。 |
| `rendererOptions.skyline.disableABTest` | `true`：关闭 Skyline AB 灰度实验，所有用户使用 Skyline 渲染。上线时建议开启。 |
| `window.navigationStyle` | 全局导航栏样式。Skyline 不支持原生导航栏，应设为 `"custom"`；各页面 json 仍需单独声明。 |
| `convertRpxToVw` | `true`：rpx 单位转换为 vw，修复部分精度问题。基础库 3.3.0+。 |

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

## 页面配置（页面.json）

写在各页面的 `.json` 文件中，可覆盖 `app.json` 中的全局设置。

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "navigationStyle": "custom",
  "disableScroll": true,
  "backgroundColorContent": "#00000000"
}
```

| 字段 | 说明 |
| --- | --- |
| `renderer` | 覆盖全局渲染引擎，实现混合渲染。`"skyline"` 或 `"webview"`。基础库 2.30.4+。 |
| `componentFramework` | 混合渲染时，使用 Skyline 的页面**必须**声明 `"glass-easel"`。基础库 2.30.4+。 |
| `navigationStyle` | **Skyline 必须设为 `"custom"`**，否则编译报错。即使 app.json 已全局配置，页面 json 仍建议显式声明。 |
| `disableScroll` | Skyline 不支持页面级全局滚动，应设为 `true`，改用 `scroll-view` 管理滚动区域。仅页面 json 有效，无法在 app.json 中配置。 |
| `backgroundColorContent` | 页面容器背景色，支持带透明度的颜色值（如 `"#00000000"`）。常用于自定义路由的透明背景页面。Skyline 特有。 |
| `rendererOptions` | 覆盖 app.json 中的 `rendererOptions` 配置，字段与全局配置相同。基础库 3.1.0+。 |

### 混合渲染策略

| 策略 | app.json renderer | 页面 json renderer | 适用场景 |
| --- | --- | --- | --- |
| 全局 Skyline | `"skyline"` | 不设置 | 新项目，全部页面用 Skyline |
| 全局 WebView + 部分 Skyline | 不设置 / `"webview"` | `"skyline"` | 渐进式迁移 |
| 全局 Skyline + 部分 WebView | `"skyline"` | `"webview"` | 个别页面不兼容时单独回退 |

- `web-view` 组件页面必须使用 `renderer: "webview"`
- 自定义路由仅在连续的 Skyline 页面之间跳转时生效
- 不支持 Skyline 的微信版本会自动降级为 WebView 渲染

---

## 开发者工具配置（project.config.json）

开发者工具项目配置，影响本地调试行为，**不影响线上渲染**（线上渲染器由 `app.json` 的 `renderer` 决定）。个人配置建议写在 `project.private.config.json`（加入 `.gitignore`，优先级高于 `project.config.json`）。

```json
{
  "setting": {
    "skylineRenderEnable": true
  },
  "libVersion": "3.7.2"
}
```

| 字段 | 说明 |
| --- | --- |
| `setting.skylineRenderEnable` | `true`：在开发者工具中启用 Skyline 渲染调试。 |
| `libVersion` | 基础库版本。Skyline 功能最低要求 2.30.4；完整特性建议 3.7.2+（含 `enableScrollViewAutoSize`）。 |

---

## 配置模板

### 新项目

适用于从零创建的全 Skyline 项目：

```json
{
  "pages": ["pages/index/index"],
  "window": {
    "navigationStyle": "custom",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5"
  },
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "enableScrollViewAutoSize": true,
      "disableABTest": true
    }
  }
}
```

### 迁移项目

适用于从 WebView 迁移至 Skyline，开启所有兼容选项：

```json
{
  "pages": ["pages/index/index"],
  "window": {
    "navigationStyle": "custom",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black"
  },
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "enableScrollViewAutoSize": true,
      "disableABTest": true
    }
  }
}
```

迁移要点：

- `defaultDisplayBlock: true` — 对齐 WebView 的 `display: block` 默认行为，避免 flex 布局导致的错位
- `defaultContentBox: true` — 对齐 WebView 的 `box-sizing: content-box`，避免盒模型差异
- `tagNameStyleIsolation: "legacy"` — 标签选择器全局匹配，避免样式作用域变化
- `disableABTest: true` — 关闭灰度实验，确保所有用户体验一致

### 混合渲染（渐进式迁移）

`app.json`（全局 WebView，不设 renderer）：

```json
{
  "pages": ["pages/index/index", "pages/skyline-page/index", "pages/webview-page/index"],
  "lazyCodeLoading": "requiredComponents"
}
```

Skyline 页面 json：

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "navigationStyle": "custom",
  "disableScroll": true,
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true
    }
  }
}
```

WebView 页面 json 无需特殊配置。

### 标准页面 json 模板

**可滚动页面**：

```json
{
  "navigationStyle": "custom",
  "disableScroll": true,
  "usingComponents": {
    "nav-bar": "/components/nav-bar/index"
  }
}
```

**透明背景页面**（自定义路由）：

```json
{
  "navigationStyle": "custom",
  "backgroundColorContent": "#00000000",
  "disableScroll": true
}
```
