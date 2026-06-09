# Skyline 配置项与接入规范参考

## 目录

- [skyline 配置](#skyline-配置)
  - [skyline 相关配置项](#skyline-相关配置项)
  - [全局配置 app.json](#全局配置-appjson)
  - [页面配置 page.json](#页面配置-pagejson)
  - [推荐配置](#推荐配置)
- [Worklet Babel 插件](#worklet-babel-插件)

---

## skyline 配置

配置项，决定小程序的默认渲染器、组件框架及 Skyline 行为选项。

### skyline 相关配置项

支持全局 app.json 和 页面 page.json

| 字段 | 说明                                                                                                                                                     |
| --- |--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `renderer` | 默认渲染引擎。`"skyline"` 使用 Skyline 引擎，`"webview"` 使用 WebView（默认）。基础库 2.30.4+。                                                                               |
| `componentFramework` | 组件框架。Skyline 项目**必须**设为 `"glass-easel"`（默认 `"exparser"`）。基础库 2.30.4+。                                                                                  |
| `rendererOptions.skyline.defaultDisplayBlock` | `true`：将默认布局从 `flex`（Skyline 默认）改为 `block`，同时 `flex-direction` 默认值 `column→row`、`align-items` 默认值 `stretch→normal`，对齐 WebView 行为。迁移项目强烈建议开启。基础库 2.31.1+。 |
| `rendererOptions.skyline.defaultContentBox` | `true`：将默认盒模型从 `border-box`（Skyline 默认）改为 `content-box`，对齐 WebView 行为。基础库 3.1.0+。                                                                      |
| `rendererOptions.skyline.tagNameStyleIsolation` | 标签选择器作用域。`"isolated"`（默认）：仅匹配当前组件；`"legacy"`：全局匹配，对齐 WebView。基础库 3.6.0+。                                                                               |
| `rendererOptions.skyline.enableScrollViewAutoSize` | `true`：scroll-view 自动根据内容撑开，无需显式指定高度。基础库 3.7.2+。                                                                                                       |
| `rendererOptions.skyline.disableABTest` | `true`：关闭 Skyline AB 灰度实验，所有用户使用 Skyline 渲染。上线时建议开启。                                                                                                   |
| `navigationStyle` | 导航栏样式。Skyline 不支持原生导航栏，应设为 `"custom"`；各页面 json 仍需单独声明。                                                                                                 |

### 全局配置 app.json
| 字段 | 说明 |
| --- | --- |
| `lazyCodeLoading` | 设为 `"requiredComponents"` 开启按需注入，仅在用到时才加载组件代码，优化启动性能。基础库 2.11.1+。                                                                      |
| `convertRpxToVw` | `true`：rpx 单位转换为 vw，修复部分精度问题。基础库 3.3.0+。                                                                                                               |

### 页面配置 page.json
| 字段 | 说明 |
| --- | --- |
| `disableScroll` | Skyline 不支持页面级全局滚动，应设为 `true`，改用 `scroll-view` 管理滚动区域。仅页面 json 有效，无法在 app.json 中配置。 |
| `backgroundColorContent` | 页面容器背景色，支持带透明度的颜色值（如 `"#00000000"`）。常用于自定义路由的透明背景页面。Skyline 特有。 |

### 推荐配置

**新项目***

适用于从零创建的全 Skyline 项目，直接配置 app.json

```json5
// app.json
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

**迁移项目**

适用于从 WebView 迁移至 Skyline，按页面开启 skyline 配置：

```json5
// app.json
{
  "pages": ["pages/index/index"],
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

```json5
// page.json
{
  "navigationStyle": "custom",
  "disableScroll": true,
  "renderer": "skyline",
  "componentFramework": "glass-easel"
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
