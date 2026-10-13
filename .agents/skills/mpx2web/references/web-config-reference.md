# 跨端输出 Web 编译与运行时配置参考

本文档按配置入口与生效阶段组织 Mpx 跨端输出 Web 的配置，包括 `MpxWebpackPlugin` 的 Web 相关选项、编译期 `webConfig`、运行时 `Mpx.config.webConfig`。只记录 Web 输出需要单独判断或配置的内容，通用字段沿用输入项目和同版本 Mpx 文档。

应用、页面与组件的 JSON 字段、tabBar、分包与抽象节点见 [JSON 配置参考](./web-json-reference.md)；模板与基础组件约束见 [模板能力参考](./web-template-reference.md)；应用与页面的脚本差异见 [脚本能力参考](./web-script-reference.md)；SSR 生命周期与状态同步见 [SSR 参考](./ssr-reference.md)。

## 目录

- [配置入口与生效阶段](#配置入口与生效阶段)
- [编译配置](#编译配置)
  - [配置方式](#配置方式)
  - [模板与样式](#模板与样式)
  - [编译期 webConfig](#编译期-webconfig)
- [运行时配置](#运行时配置)
  - [初始化方式](#初始化方式)
  - [Mpx.config.webConfig](#mpxconfigwebconfig)
- [注意事项](#注意事项)

---

## 配置入口与生效阶段

| 配置入口 | 生效阶段 | 主要用途 |
| --- | --- | --- |
| `new MpxWebpackPlugin(options)` | 编译期 | 输出目标、样式隔离与单位转换、模板与组件编译。使用 CLI 工程时通常对应 `pluginOptions.mpx.plugin`。 |
| `options.webConfig` | 编译期 | 挂载节点、SSR 客户端挂载时机、页面切换动画、异步公共模块拆分、基础组件替换等 Web 输出配置。 |
| `Mpx.config.webConfig` | 运行时 | Web 路由、内建标题栏、顶部安全区与 web-view 桥接配置。 |
| `app.mpx` 的 JSON 区块 | 编译期 | 应用页面、分包及小程序专属能力声明。 |

**编译期 `webConfig` 与运行时 `Mpx.config.webConfig` 是两个独立入口，不会自动整体同步。** 例如 `customBuiltInComponents` 必须在编译插件中配置，`routeConfig` 必须在运行时代码中设置；仅修改运行时对象无法改变已生成的基础组件映射。

---

## 编译配置

### 配置方式

直接使用 webpack 时，将配置传给 `@mpxjs/webpack-plugin` 的构造函数。下面为插件配置片段，入口、loader 与 Web 打包链沿用工程现有设置：

```js
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

module.exports = {
  plugins: [
    new MpxWebpackPlugin({
      mode: 'web',
      srcMode: 'wx',
      webConfig: {
        el: '#app',
        disablePageTransition: true
      }
    })
  ]
}
```

使用 Mpx CLI 工程时，以上插件选项通常写在 `mpx.config.js` 的 `pluginOptions.mpx.plugin` 中，Web 专属编译选项通常放在 `webConfig` 下，同时也有部分通用编译配置影响 web 输出。

### 模板与样式

以下字段是 **`MpxWebpackPlugin` 顶层选项**，与 `webConfig` 同级：

| 配置项 | 默认值或行为 | Web 输出用途与边界 |
| --- | --- | --- |
| `autoScopeRules` | `{}`，不自动启用 scoped | 按 `.mpx` 文件路径批量启用样式隔离，命中后该文件的所有样式区块都启用 scoped；未命中时仍尊重单个 `<style scoped>`。不默认模拟微信组件的样式隔离，也不阻止外部全局 CSS 影响内部节点。全局样式入口不应纳入匹配范围，详见 [样式隔离](./web-style-reference.md#样式隔离)。 |
| `externalClasses` | `['custom-class', 'i-class']` | 声明编译器需要转换的外部样式类名。自定义数组会替换默认数组，新增名称时保留仍在使用的默认名称，并与组件脚本、模板占位类和调用方属性保持一致，详见 [外部样式类](./web-style-reference.md#外部样式类)。 |
| `transRpxRules` | `null`，不转换 `px` | 可配置单条规则或规则数组，对匹配样式资源执行 `px → rpx`，Web 随后再按 `webConfig.transRpxFn` 或默认规则转换 `rpx`。不影响模板内联样式中的 `px`，也不是启用 Web `rpx` 支持的前提；`mode`、`designWidth` 与注释控制见 [px 自动转换](./web-style-reference.md#px-自动转换)。 |
| `autoVirtualHostRules` | `{}`，不自动虚拟化宿主 | 只有 Web 编译注入的组件外层节点确实阻断布局或样式时才配置，并只匹配受影响的组件，不顺带包含父组件、子组件或相邻组件。命中后模板需要单个真实根节点，详见 [Web 模板编译限制](./web-template-reference.md#web-模板编译限制)。 |

### 编译期 webConfig

以下字段配置在 **`MpxWebpackPlugin` 的 `webConfig`** 中：

| 配置项 | 默认值或行为 | 说明 |
| --- | --- | --- |
| `el` | `'#app'` | Web 挂载节点；项目使用其他挂载节点时配置。 |
| `useSSR` | `false` | SSR 首屏可能进入异步路由页面（如异步分包页面）时设为 `true`，让客户端等待路由就绪后再挂载；同步页面无需设置。 |
| `disablePageTransition` | `true` | 默认禁用页面切换动画；需要动画时设为 `false`。 |
| `asyncCommonSubpackage` | `true` | 默认将多个异步 chunk 共享的公共模块抽取到 `async-common/index`；设为 `false` 时改为从所有 chunk 中提取公共模块并归入 app 主入口。插件仅在对应的 `async` / `main` cache group 未配置时添加该规则。 |
| `transRpxFn` | 未设置，默认按 `750rpx = 100vw` 换算 | 自定义 `rpx` 转换函数，同时用于编译期样式转换和运行时动态样式转换；函数约束见下文。 |
| `customBuiltInComponents` | 未设置，使用内建组件 | 替换或扩展 Web 基础标签；key 为模板标签名（如 `view`），value 为可解析的组件模块路径。替换已有内建实现时，新组件需承接业务用到的属性、事件和子节点。 |

`useSSR` 控制客户端挂载时机；SSR 生命周期、首屏数据加载和状态同步仍需按 [SSR 参考](./ssr-reference.md) 处理。

`transRpxFn` 按字符串替换回调接收参数，前两个参数为完整匹配文本与数值部分字符串（如 `'10rpx'`、`'10'`），返回转换后的字符串。函数源码会直接写入运行时代码，应使用自包含的普通函数表达式，不能依赖构建配置中的闭包变量或仅构建环境可用的依赖。单位转换、样式隔离与外部样式类见 [样式能力参考](./web-style-reference.md)。

---

## 运行时配置

### 初始化方式

`Mpx` 为 `@mpxjs/core` 默认导出。Web 运行时配置应在 `createApp` 前设置；仅修改需要的字段，保留框架默认值与工程中已有的配置。

```js
// src/config.js，由 app.mpx 的 script 引入
import Mpx from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  Mpx.config.webConfig.routeConfig = Object.assign({}, Mpx.config.webConfig.routeConfig, {
    mode: 'history',
    base: '/content/'
  })
}
```

在 `app.mpx` 的脚本中先 `import './config'`，再调用 `createApp(...)`。静态 `import` 会先于当前模块主体执行，因此初始化模块也应先于依赖这些配置的业务模块引入。

### Mpx.config.webConfig

以下字段均配置在 **运行时 `Mpx.config.webConfig`** 中。该对象初始为 `{}`，表中同时注明消费端的默认行为。

| 配置项 | 默认值或行为 | 说明 |
| --- | --- | --- |
| `routeConfig` | 未设置时回退到旧入口 `Mpx.config.webRouteConfig`；两者均未配置时沿用 VueRouter 默认行为 | 需要修改 Web 路由模式或部署基础路径时配置；`mode` 控制 `hash` / `history`，`base` 匹配页面访问路径。新旧入口按优先级择一使用，不会合并；设置空对象也会覆盖旧入口。 |
| `enableTitleBar` | 未设置，按 `false` 处理 | 需要框架按页面 JSON 渲染 Web 内建标题栏时设为 `true`；页面配置 `navigationStyle: 'custom'` 时仍会隐藏。 |
| `safeAreaInsetTop` | 未设置，使用 `24` | 启用内建标题栏后，调整非 iOS 设备顶部安全区高度，单位为 `px`。 |
| `webviewConfig.hostWhitelists` | 未设置时按空数组处理，不限制消息来源 | Web 内建 `web-view` 接收桥接消息时校验 `event.origin`；非空时，来源字符串须以名单中的某一项结尾（`endsWith`）才会处理。 |
| `webviewConfig.apiImplementations` | 未设置，无自定义桥接方法 | 按方法名配置函数，处理内建 `postMessage` 和路由方法以外的桥接调用；未配置对应函数时返回调用失败。 |

---

## 注意事项

- 编译配置修改后需要重新构建；运行时配置为普通对象，不是响应式配置中心，不保证在页面挂载后修改仍能生效。
- Web 专属运行时初始化通过 `__mpx_mode__ === 'web'` 限制生效平台；使用 SSR 时，初始化模块也会进入服务端构建，浏览器对象的使用限制见 [SSR 注意事项](./ssr-reference.md#注意事项)。
