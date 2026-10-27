# Mpx2Web 配置参考

本文按配置归属分为三部分，只记录 Web 输出需要单独判断或配置的差异。通用字段沿用输入项目和同版本 Mpx 文档。

## 应用 JSON 的小程序专属声明

以下字段不会自动生成 Web 等价能力。只有源码实际依赖对应能力时才处理，并保留原小程序配置：

| 输入能力 | Web 差异 | 处理方式 |
| --- | --- | --- |
| `plugins` 与 `plugin://` 组件 | 当前插件导出处理只面向微信，Web 不能把 `plugin://` 当作普通组件路径解析。 | 隔离插件组件的注册和使用，接入项目已有的 Web 组件；没有替代实现时保留真实的 `TODO(web)`。 |
| `workers` | Web 不会根据小程序的 worker 目录声明自动创建或注册 Web Worker。 | 只有业务实际调用 worker 时才增加 Web Worker 入口和通信实现。 |
| 分包 `independent: true` | Web 可异步加载页面 chunk，但没有微信独立分包的独立启动和运行环境。 | 只依赖懒加载时无需改动；依赖独立初始化或全局隔离时，为 Web 设计独立入口或初始化边界。 |

只有少数字段存在平台差异时，使用动态 JSON 保留一份公共配置，只条件赋值差异字段。例如 Web 不消费微信插件声明时：

```html
<script name="json">
const appConfig = {
  pages: [
    './pages/content/index.mpx',
    './pages/catalog/index.mpx'
  ]
}

if (__mpx_mode__ === 'wx') {
  appConfig.plugins = {
    foo: { version: '1.0.0', provider: 'wx123' }
  }
}

module.exports = appConfig
</script>
```

`<script name="json">` 中导出的对象必须可序列化。不要为删除一个 `plugins` 字段分别复制 `mode="wx"` 和 `mode="web"` 的完整 JSON，否则公共的 `pages`、分包或窗口配置会形成两份维护入口。只有两端大部分 JSON 结构确实不同时才拆分完整区块。

## 应用运行时配置（`app.mpx`）

配置归属：应用运行时的 `mpx.config.webConfig`，需要在 `createApp` 前设置。

| 配置 | 何时需要 |
| --- | --- |
| `routeConfig` | 需要修改 Web 路由模式或部署基础路径时配置；`mode` 控制 `hash` / `history`，`base` 匹配页面访问路径。 |
| `enableTitleBar` | 需要框架按页面 JSON 渲染 Web 内建标题栏时设为 `true`，默认 `false`；页面配置 `navigationStyle: 'custom'` 时仍会隐藏。 |
| `safeAreaInsetTop` | 启用内建标题栏后，需要调整非 iOS 设备顶部安全区高度时配置，默认 `24`，单位为 `px`。 |

已有项目使用的 `mpx.config.webRouteConfig` 仍兼容；无需为改名机械迁移，新代码使用 `mpx.config.webConfig.routeConfig`。

```js
import mpx, { createApp } from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  mpx.config.webConfig = Object.assign({}, mpx.config.webConfig, {
    routeConfig: {
      mode: 'history',
      base: '/content/'
    }
  })
}

createApp({})
```

## 构建期 Mpx 插件配置

配置归属：项目构建配置中的 `pluginOptions.mpx.plugin`。

| 配置 | 何时需要 |
| --- | --- |
| `autoVirtualHostRules` | 只有 Web 编译注入的组件外层节点确实阻断布局或样式时才配置，并只匹配受影响的组件，不顺带包含父组件、子组件或相邻组件。命中后模板需要单个真实根节点，详见模板参考。 |

## 构建期 Web 配置

配置归属：项目构建配置中的 `pluginOptions.mpx.plugin.webConfig`。

| 配置 | 何时需要 |
| --- | --- |
| `el` | Web 挂载节点不是默认的 `#app` 时配置。 |
| `useSSR` | SSR 首屏可能进入异步路由页面（如异步分包页面）时设为 `true`，让客户端等待路由就绪后再挂载；同步页面无需设置。 |
| `disablePageTransition` | 需要页面切换动画时设为 `false`；默认 `true`，即禁用切换动画。 |
| `transRpxFn` | 项目需要覆盖默认 `rpx` 转换规则时配置。 |
| `customBuiltInComponents` | 需要替换或扩展 Web 基础标签时配置；key 为模板标签名（如 `view`），value 为可解析的组件模块路径。替换已有内建实现时，新组件需承接业务用到的属性、事件和子节点。 |

Web 部署在子目录时，`routeConfig.base` 设置页面地址的公共前缀，例如 `/content/article/1` 的前缀是 `/content/`；构建配置顶层的 `publicPath` 设置 JS、CSS 和图片的加载地址。使用根路径部署时无需配置；静态资源放在 CDN 时，`publicPath` 填写 CDN 地址。
