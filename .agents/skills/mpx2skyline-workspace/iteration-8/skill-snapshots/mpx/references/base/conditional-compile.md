# 条件编译

以 Mpx 核心能力为基准，按实际输出目标判断实现能否复用；仅在目标端差异无法等效抹平时隔离最小片段。目标集合来自实际工程，不能把所有非 RN 端写成一个未经核实的 else 分支。

## 目录

- [目标与源码方言](#目标与源码方言)
- [文件维度条件编译](#文件维度条件编译)
  - [RN 条件文件回退](#rn-条件文件回退)
- [区块维度条件编译](#区块维度条件编译)
- [模板条件编译](#模板条件编译)
- [脚本条件编译](#脚本条件编译)
- [样式条件编译](#样式条件编译)
  - [避免产物中出现空选择器](#避免产物中出现空选择器)
- [JSON 配置条件编译](#json-配置条件编译)

## 目标与源码方言

`mode` 只负责输出目标筛选，`srcMode` 只负责源码方言。条件文件后缀、区块 `mode`、节点/属性 `@mode` 命中后，仍按原有 srcMode 正常跨端转换。不能因命中条件文件或属性就跳过转换。

`srcModeRules` 按资源匹配方言；`modeRules` 是历史兼容别名，不能同时配置。区块 `src-mode` 显式指定该区块方言，不能用它代替目标筛选。版本升级审计时先确认工程采用本语义的版本。

## 文件维度条件编译

命名为 `原名.目标.扩展名`，如 `card.web.mpx`、`card.ios.mpx`。业务仍引用默认 `card.mpx`，构建时按目标优先选择条件文件。

文件级隔离用于大块实现差异或平台专属依赖（React Native / Vue 组件等）；命中的文件默认继承项目源码方言。

### RN 条件文件回退

RN 条件文件解析链：

- `ios`：`.ios.*` → 默认文件。
- `android`：`.android.*` → `.ios.*` → 默认文件。
- `harmony`：`.harmony.*` → `.ios.*` → 默认文件。

三端相同可只写 `.ios.*`。但文件回退不改变输出目标：Android 命中 `.ios.mpx` 后，其中的 `<template mode="ios">` 仍不会命中 Android；共用区块不要只限定 ios，应去掉该筛选或提供匹配目标的区块。后缀只筛选目标，默认仍继承源码方言；涉及 RN 原生语法时按 [RN 混合开发](../rn/rn-hybrid-dev.md) 配置，不能因文件带 ios 后缀就直接改写为原生语法。

该回退链仅适用于 RN 输出目标，不适用于 Web。

## 区块维度条件编译

SFC 的 template/script/style/JSON 可通过 `mode` 选择平台专用区块，命中仍转换；需要改写源码方言时再声明 `src-mode`。

```html
<template mode="web">
  <view bindtap="handleTap">Web 内容，仍按 Mpx/微信语法转换</view>
</template>
```

同一模板内部 `<template name>` 继承区块方言；`<import>` / `<include>` 引用的是独立资源，方言由该资源的 `srcModeRules` 决定，不继承引用者方言。SFC `<template src="..." src-mode="...">` 仍是当前模板区块，默认继承当前资源方言，显式 src-mode 优先；include 是否受支持另查目标端。

## 模板条件编译

通过 `wx:if="{{__mpx_mode__ === 'web'}}"` 或节点/属性 `@mode` 筛选；不需要在 data 声明编译常量。

```html
<view @web bindtap="handleTap">仅 Web</view>
<text numberOfLines@ios|android|harmony="{{1}}">{{title}}</text>
<view mpxTagName@web="web-card">内容</view>
```

`@web`、`@ios|android|harmony` 只筛选对应节点或属性，命中后仍正常转换；`mpxTagName@mode` 替换标签名。`@_mode` 与 `@mode` 语义相同，仅作历史兼容；新增代码使用 `@mode`。

## 脚本条件编译

```js
if (__mpx_mode__ === 'web') {
  // Web 专属逻辑
}
```

用编译常量直接限定差异；平台独有依赖优先放入条件文件，避免无条件静态 import 被其他端解析。运行时 if 不会自动隔离文件顶部的静态 import。

## 样式条件编译

`/* @mpx-if (...) */` / `/* @mpx-else */` / `/* @mpx-endif */` 仅用于 style，不用于 template/script/JSON。

```html
<style>
.title {
  color: #222;
  /* @mpx-if (__mpx_mode__ === 'web') */
  text-overflow: ellipsis;
  /* @mpx-endif */
}
</style>
```

stylus / 缩进式 sass 中条件注释与所在块同级缩进，避免注释占位破坏上下文，触发 `expected "indent", got "outdent"`。保留 `/*use rpx*/` 与 `/*use px*/` 单位注释。

### 避免产物中出现空选择器

优先只包裹不兼容声明；若某目标会删掉整条规则的全部声明，则把选择器及声明块整体纳入条件，避免后续预处理器或插件处理空规则时出错。

```html
<style>
/* @mpx-if (__mpx_mode__ === 'web') */
.web-only {
  display: grid;
}
/* @mpx-endif */
</style>
```

这里是构建兼容约束，不意味着标准 CSS 的空规则本身语法非法。

## JSON 配置条件编译

动态 JSON 使用 `<script name="json">` 与 `module.exports`，按 `__mpx_mode__` / `__mpx_env__` 生成配置；见 [动态 JSON](./json-reference.md#动态-json)。不为只调整一个属性而分叉整个组件。
