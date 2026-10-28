# 编译与运行时配置

本页描述 Mpx 核心配置入口与作用，不要求每个配置项在所有输出端都生效；目标端限制见对应配置参考。支付宝目标、样式编译选项与开发者工具配置见 [支付宝配置](../ali/ali-config-reference.md)。

编译配置与运行时配置是独立入口，同名字段不会自动整体同步。`.mpx` JSON 区块中的应用/页面/组件声明见 [JSON](./json-reference.md)。

## 目录

- [编译配置](#编译配置)
  - [入口与阶段](#入口与阶段)
  - [目标与源码](#目标与源码)
  - [规则匹配](#规则匹配)
  - [模板与样式配置](#模板与样式配置)
  - [分包与异步配置](#分包与异步配置)
- [运行时配置](#运行时配置)
  - [初始化方式](#初始化方式)
  - [全局字段](#全局字段)

## 编译配置

### 入口与阶段

| 入口 | 阶段与用途 |
| --- | --- |
| `new MpxWebpackPlugin(options?)` | 接收编译选项对象，省略时使用默认配置；返回用于 webpack `plugins` 数组的插件实例。CLI 工程通常为 `mpx.config.js` 的 `pluginOptions.mpx.plugin`。 |
| 插件的 `rnConfig` / `webConfig` | 各目标的编译配置，影响产物，需要重新构建。 |

直接使用 webpack 时，将选项传给 `@mpxjs/webpack-plugin` 构造函数。以下为插件配置片段，入口、loader 与各端打包链沿用工程现有设置：

```js
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

module.exports = {
  plugins: [
    new MpxWebpackPlugin({
      mode: 'wx',
      srcMode: 'wx'
    })
  ]
}
```

CLI 工程将相同选项写入 `pluginOptions.mpx.plugin`。已有多端构建配置时沿用工程的目标选择方式，端扩展分别放在 `rnConfig` / `webConfig` 中。所有编译配置变更均需重新构建。

### 目标与源码

以下为 `MpxWebpackPlugin` 的顶层编译选项，用于指定输出目标、源码方言与编译环境：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `mode` | `string` | `'wx'` | 输出目标；注入 `__mpx_mode__`。 |
| `srcMode` | `string` | 同 mode | 源码方言；注入 `__mpx_src_mode__`。跨 RN/Web 的微信源码明确设为 `'wx'`。 |
| `env` | `string` | `''` | 环境标识，注入 `__mpx_env__` 并参与条件编译。 |
| `defs` | `object` | `{}` | 编译常量；不覆盖 `__mpx_mode__`、`__mpx_src_mode__`、`__mpx_env__`、`__mpx_perf__`。 |
| `srcModeRules` | `object` | `{}` | 按源码方言映射匹配规则；历史别名 `modeRules` 不能同时配置。 |
| `fileConditionRules` | `object` | 全部匹配 | 控制参与文件维度条件编译的资源范围。 |

文件和区块筛选、src-mode 优先级见 [条件编译](./conditional-compile.md)。

### 规则匹配

规则通常是 `{ include, exclude }`，条件可为字符串、正则或 `(resourcePath: string) => boolean` 函数，也可组成数组；函数接收当前资源路径，返回 `true` 表示命中。

- include 命中且 exclude 未命中时生效，数组任一项命中即可。
- 字符串按路径包含关系匹配，不是 glob；精确匹配用正则/函数。
- `{}` 不匹配任何资源。某规则没有默认 include 时，仅写 exclude 不会启用其余资源；全量需显式 `include: () => true`。
- 按实际受影响资源限定范围，不把特殊组件修复扩成全工程开关。

### 模板与样式配置

以下均为编译插件顶层选项；涉及资源筛选时，匹配语义见 [规则匹配](#规则匹配)。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `externalClasses` | `string[]` | `['custom-class', 'i-class']` | 输出支付宝、Web 和 RN 时，使用外部样式类能力必须在此配置中声明对应类名。自定义数组替换默认值，保留仍在使用的名称，并与组件声明、模板和调用方一致。 |
| `transRpxRules` | `object\|object[]` | `null` | 对匹配样式资源执行 px→rpx，默认不转换。支持单条规则或规则数组；规则含 include/exclude、mode（none/only/all）、designWidth（默认 750）与 comment。后续 rpx 换算由目标端处理，该配置不是启用 rpx 的前提。 |
| `autoScopeRules` | `object` | `{}` | 按资源路径批量启用 scoped，用于在输出支付宝和 Web 时模拟微信组件的样式隔离行为。命中文件的所有样式区块均启用；未命中仍尊重单个 `<style scoped>`。 |
| `autoVirtualHostRules` | `object` | `{}` | 按组件路径批量虚拟化宿主节点，使组件不生成额外的实体宿主包裹节点。跨端优先使用该配置，不仅依赖微信组件内部的 `options.virtualHost`；只匹配实际需要调整的组件。 |
| `customTextRules` | `object` | `{}` | 按组件路径将命中的自定义组件声明为文本类组件，供目标端按文本组件语义处理，用于自定义文本组件的内联嵌套等场景。 |
| `i18n` | `object` | `null` | 配置国际化语言与消息资源，启用模板和脚本翻译能力，详见 [模板基准](./template-reference.md#i18n-国际化)。 |

这些配置的支持情况和限制按目标端核对；Web 的样式隔离与单根节点要求见 [Web 样式参考](../web/web-style-reference.md)。

### 分包与异步配置

以下均为编译插件顶层选项，详细规则与用法见 [分包基准](./subpackage-reference.md#异步规则配置)。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `asyncSubpackageRules` | `object[]` | `[]` | 按资源匹配规则指定异步分包及组件占位。 |
| `retryRequireAsync` | `boolean\|object` | `false` | 配置 `require.async` 加载失败后的重试次数与间隔。 |
| `disableRequireAsync` | `boolean` | `false` | 关闭框架对 `require.async` 的处理。 |

## 运行时配置

通过 `@mpxjs/core` 默认导出的 `Mpx.config` 配置，`rnConfig` / `webConfig` 为对应目标端的运行时扩展。运行时路由或原生分包加载钩子在此配置。

### 初始化方式

在 `createApp` 及依赖该配置的页面/组件模块执行前初始化，只改需要的字段。可在 app.mpx 先导入独立 config 模块，再构造应用；注意静态 import 先于模块主体执行。

```js
// src/config.js
import Mpx from '@mpxjs/core'

Mpx.config.errorHandler = (msg, location, e) => {
  console.error(msg, location, e)
}
```

在 `app.mpx` 的脚本中先 `import './config'`，再引入依赖该配置的业务模块并调用 `createApp(...)`。保留框架默认值和已有配置；扩展已有对象时使用 `Object.assign`，嵌套对象需在对应层合并。平台专属初始化通过 [条件编译](./conditional-compile.md) 限定实际目标，平台依赖也需隔离。

运行时配置是普通对象，不是可随时动态更新的响应式配置中心，不保证页面挂载后修改仍然生效。

### 全局字段

以下为运行时 `Mpx.config` 对象的配置字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `useStrictDiff` | `boolean` | `false` | 将数据 diff 细化为子路径，主要用于小程序渲染链路。 |
| `ignoreWarning` | `boolean\|string\|RegExp\|Function` | `false` | 布尔值、包含字符串、正则或 `(msg: string, location: string \| undefined, e: Error \| undefined) => boolean` 过滤警告；函数返回 `true` 时忽略本次警告。 |
| `ignoreProxyWhiteList` | `string[]` | `['id', 'dataset', 'data']` | 不代理到实例的保留字段；不要为避错随意移除。 |
| `observeClassInstance` | `boolean\|Function[]` | `false` | 允许观测 class 实例，或用构造函数数组限定。 |
| `errorHandler` / `warnHandler` | `Function` | `null` | `(msg: string, location: string \| undefined, e: unknown) => void` 接管框架错误/未被过滤的警告；`location` 是来源说明，`e` 是错误详情，警告场景可能为 `undefined`。返回值不使用。 |
| `proxyEventHandler` | `Function` | `null` | `(event: object, instance: ComponentInstance) => void`，接收原始事件对象与当前组件/页面实例，观察代理事件；返回值不使用。 |
| `setDataHandler` | `Function` | `null` | `(data: object, instance: ComponentInstance) => void`，接收本次提交给 `setData` 的数据与当前实例；返回值不使用。仅在小程序环境下生效，用于统计发送频次和数据量。 |
| `forceFlushSync` | `boolean` | `false` | 强制同步调度，按需使用。 |
| `webConfig` / `rnConfig` | `object` | 按目标实现 | 端扩展见对应配置参考；不混用两者。 |
