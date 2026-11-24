# Skyline 配置差异

本页仅维护 Skyline 专属配置及相对基准的差异。插件接入、规则匹配、通用模板与样式配置、运行时初始化及全局字段统一见 [配置基准](../base/config-reference.md)。

应用与页面的 JSON 配置差异、渲染引擎与 rendererOptions 见 [JSON 配置参考](./skyline-json-reference.md)；模板与基础组件约束见 [模板与基础组件差异](./skyline-template-reference.md)；渲染模式判断、页面滚动与实例方法见 [运行时最佳实践](./skyline-runtime-practice.md)。

## 目录

- [编译配置](#编译配置)
  - [目标与源码](#目标与源码)
  - [Worklet Babel 插件](#worklet-babel-插件)
- [开发者工具配置](#开发者工具配置)

## 编译配置

### 目标与源码

Mpx 微信源码输出 Skyline 时仍使用 `mode: 'wx'`、`srcMode: 'wx'`。Skyline 与微信 WebView 共用编译目标，不能将 mode 写成 skyline；条件文件、区块 mode 与 `@wx` 也不能区分这两种渲染模式，见 [条件编译基准](../base/conditional-compile.md)。

渲染引擎由应用/页面 JSON 的 `renderer` 配置；运行时通过实例的 `renderer` 判断实际渲染模式，见 [渲染模式判断](./skyline-runtime-practice.md#判断当前渲染模式)。

### Worklet Babel 插件

使用 Worklet 函数时，通过 Babel 插件按需编译：

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

- 配置 Worklet Babel 插件后，**不需要勾选**「将 JS 编译成 ES5」，否则会增加包体积。
- 未配置插件时，需要开启开发者工具的「编译 Worklet 函数」选项。「将 JS 编译成 ES5」也能完成编译，但会处理更多无关代码。更推荐集成 Babel 插件按需编译。

## 开发者工具配置

微信开发者工具的 Skyline 渲染开关位于 `project.config.json` 的 `setting.skylineRenderEnable`，用于工具调试；应用与页面仍需声明对应的 [渲染配置](./skyline-json-reference.md)。Worklet 的工具编译选项与 Babel 插件的配合见 [Worklet Babel 插件](#worklet-babel-插件)。
