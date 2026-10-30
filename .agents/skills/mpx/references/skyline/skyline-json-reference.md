# Skyline JSON 配置差异

本页记录微信 WebView / Skyline 双渲染模式下，应用与页面 JSON 相对基准的配置差异。JSON 区块语法与注册方式见 [JSON 基准](../base/json-reference.md)，编译插件、Worklet 与开发者工具配置见 [配置参考](./skyline-config-reference.md)。

## 目录

- [App 配置](#app-配置)
  - [app.json 顶层配置](#appjson-顶层配置)
  - [rendererOptions.skyline 配置项](#rendereroptionsskyline-配置项)
  - [应用配置示例](#应用配置示例)
- [页面配置](#页面配置)

## App 配置

页面与组件注册沿用 [App 配置基准](../base/json-reference.md#app-配置)。全局渲染配置位于应用 JSON，使用 `renderer`、`componentFramework` 与 `rendererOptions`；混合渲染项目按页面配置选择渲染模式，不能仅依据全局配置推断所有页面的实际 renderer。

### app.json 顶层配置

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `lazyCodeLoading` | string | — | 位置：`app.json` 顶层。开启按需注入用到的组件代码，降低页面初始化时一次性注入的代码量。使用 Skyline 时必填，值必须为 `"requiredComponents"`；WebView 可按需配置。 |
| `convertRpxToVw` | boolean | — | 位置：`app.json` 顶层。基础库 3.3.0+；开启后会将 WebView rpx 计算逻辑对齐 Skyline（`rpx` 单位转换为 `vw` 单位），用于修复部分 `rpx` 精度问题。 |

### rendererOptions.skyline 配置项

以下字段配置在 **应用 JSON 的 `rendererOptions.skyline`** 中：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `defaultDisplayBlock` | boolean | false | 默认 `display: block`（对齐 WebView）。推荐值：true。 |
| `defaultContentBox` | boolean | false | 默认 `box-sizing: content-box`（对齐 WebView）。推荐值：true。 |
| `tagNameStyleIsolation` | string | "isolated" | 标签选择器全局匹配（对齐 WebView）。推荐值："legacy"。 |
| `enableScrollViewAutoSize` | boolean | false | scroll-view 自动撑开高度。推荐值：true。 |
| `keyframeStyleIsolation` | string | - | `@keyframes` 全局共享，避免迁移项目中动画关键帧作用域变化。推荐值："legacy"。 |
| `disableABTest` | boolean | false | 关闭 Skyline AB 实验，确保稳定性（非必要配置）。推荐值：按需。 |

> 前 5 项用于减少 WebView 与 Skyline 的默认行为差异，迁移项目应逐项检查。`disableABTest` 不是必填项，仅在需要排除灰度实验干扰、让页面全部使用 Skyline 时开启。

### 应用配置示例

应用 JSON 中对齐 WebView 默认行为的配置示例：

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

> `defaultDisplayBlock` / `defaultContentBox` / `tagNameStyleIsolation` / `enableScrollViewAutoSize` / `keyframeStyleIsolation` 要写在 `rendererOptions.skyline` 内，不能放到 app.json 顶层。`lazyCodeLoading` 与 `convertRpxToVw` 属于顶层配置，其中 `convertRpxToVw` 和 `disableABTest` 根据项目需要选配。

## 页面配置

页面配置区块的写法见 [页面配置基准](../base/json-reference.md#页面配置)。Skyline 页面的渲染、导航与滚动配置如下：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `renderer` | `string` | — | 选择 Skyline 渲染；需要 WebView 的页面使用 `'webview'`。Skyline 配置：`'skyline'`。 |
| `componentFramework` | `string` | — | 使用 glass-easel 组件框架。Skyline 配置：`'glass-easel'`。 |
| `navigationStyle` | `string` | — | 使用自定义导航栏，并在页面中实现导航。Skyline 配置：`'custom'`。 |
| `disableScroll` | `boolean` | — | 禁用页面滚动，通过 scroll-view 承载滚动并迁移业务事件。Skyline 配置：`true`。 |

滚动、下拉刷新、触底与滚动监听的事件迁移见 [页面滚动实践](./skyline-runtime-practice.md#页面滚动替代方案)。需要透明页面容器时按需配置：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `backgroundColorContent` | HexColor | — | 位置：页面 JSON。Skyline 特有页面配置；设置页面容器背景色，支持 `#RRGGBBAA` 透明度格式，常用于自定义路由透明背景。 |

页面 JSON 示例：

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
