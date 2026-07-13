# Mpx2Web 脚本差异参考

本文档只记录 `<script>` 中 Web-only 运行时差异。构造选项、组合式 API、响应式 API、实例基础方法、通用生命周期等能力当前先参考 `../mpx2rn` 公共部分，未来替换为 mpx base skill。

## 目录

- [Web 路由与页面状态](#web-路由与页面状态)
- [浏览器环境](#浏览器环境)
- [Web 缺失的宿主生命周期](#web-缺失的宿主生命周期)
- [Web 运行时配置入口](#web-运行时配置入口)
- [Web 状态管理与 SSR](#web-状态管理与-ssr)

---

## Web 路由与页面状态

Web 页面栈由 Mpx Web 运行时映射到浏览器路由。涉及 Web 路由、部署路径、页面切换动画、tabBar 或 SSR 时，同时检查 [Web JSON 配置参考](./web-json-reference.md)。

页面 show / hide 由 Web 路由激活态与浏览器可见性变化驱动。页面滚动相关行为受浏览器滚动容器和页面 JSON 中 `disableScroll` 影响：

| 场景 | Web 侧说明 |
| --- | --- |
| 页面激活 / 失活 | 由 Web 路由状态和浏览器可见性共同驱动。 |
| 页面滚动 | 默认使用浏览器滚动。 |
| `disableScroll` | 禁用页面默认滚动后，页面滚动相关逻辑不再按默认页面容器触发。 |
| 页面标题 | `navigationBarTitleText` 会映射到 `document.title`。 |

业务代码不要绕过 Mpx Web 运行时直接接管路由实例，除非是在 Web-only 架构层明确处理路由集成。

---

## 浏览器环境

`window`、`document`、`navigator`、`location`、Web Storage、DOM 节点、Canvas 上下文、IntersectionObserver、第三方 H5 SDK 等都属于浏览器运行时能力。

使用原则：

- 只在客户端阶段访问浏览器对象。
- Web-only 依赖使用动态加载，避免通用模块顶层静态引入。
- 需要 SSR 时，浏览器对象限制见 [SSR 专项参考](./ssr-reference.md)。

---

## Web 缺失的宿主能力

以下生命周期依赖非浏览器宿主语义，Web 不提供等价能力：

| 生命周期 | Web 侧处理 |
| --- | --- |
| `onShareAppMessage` | 使用 Web 分享或业务自定义分享方案。 |
| `onShareTimeline` | 使用业务分享方案。 |
| `onAddToFavorites` | 使用 Web 收藏、关注或业务用户体系。 |
| `onTabItemTap` | Web 有 tabBar 路由切换，但没有对应宿主回调。 |
| `onSaveExitState` | 使用 Web Storage、服务端状态或业务恢复方案。 |
| `onThemeChange` | 使用 Web 媒体查询或业务主题系统。 |

---

## Web 运行时配置入口

| 入口 | Web 侧用途 |
| --- | --- |
| `mpx.config.webConfig.routeConfig` | Web 路由配置，见 [Web JSON 配置参考](./web-json-reference.md)。 |
| `mpx.config.webRouteConfig` | 旧路由配置入口，仍兼容但不推荐新增使用。 |
| `webConfig.disablePageTransition` | 控制 Web 页面切换动画。 |
| `webConfig.el` | Web 应用挂载节点。 |
| `webConfig.useSSR` | SSR 与异步分包 hydrate，见 [SSR 专项参考](./ssr-reference.md)。 |

---

## Web 状态管理与 SSR

Web 端推荐使用 `@mpxjs/pinia` 承载新状态域。普通 CSR 可创建全局 Pinia 实例；SSR 必须为每次请求创建独立状态实例，避免请求间状态污染。

SSR 数据预取、`onAppInit`、`serverPrefetch`、`onSSRAppCreated` 与状态注水统一见 [SSR 专项参考](./ssr-reference.md)。
