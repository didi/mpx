# Web 任务入口

仅当实际输出包含 `web`（Mpx2Web / H5），包括 Web SSR 时使用本页。响应式、组合式 API、分包与模板等 Mpx 核心能力见 base；本页说明相对基准的 Web 支持情况、限制和专属扩展，不加载 RN 约束作为 Web 开发标准。

## 按需索引

| 涉及任务 | 读取内容 |
| --- | --- |
| 事件、内建组件、Vue 组件混用、模板复用 | [Web 模板](./web-template-reference.md) |
| 构造选项、生命周期、实例查询、setData/forceUpdate、relations、implement | [Web 脚本](./web-script-reference.md) |
| scoped、宿主节点、rpx、外部样式类 | [Web 样式](./web-style-reference.md) |
| UnoCSS / utility class | [原子 CSS 基准](../base/atomic-css.md)，生成样式结合 [Web 样式](./web-style-reference.md)与浏览器支持情况判断。 |
| tabBar、页面滚动、入口页、分包与占位 | [Web JSON](./web-json-reference.md) |
| 路由部署、编译 webConfig、运行时 webConfig | [Web 配置](./web-config-reference.md) |
| 浏览器/宿主环境 API 支持与返回值 | [API 基准](../base/api-reference.md) 查用途、参数与调用契约；[Web API 差异](./web-api-reference.md) 查不支持的 API、参数、返回字段与对象方法，以及类型和默认值差异。 |
| 服务端渲染、首屏预取、请求隔离、hydration | [Web SSR](./ssr-reference.md)，必须先于普通客户端初始化示例应用 |

## 开发与评审约束

方案设计、开发、适配、排障与评审开始前先读取本节，完成后按受影响维度复查；涉及 SSR 时同时核对下方额外约束。

- Mustache 表达式调用、动态 class/style、内联事件参数与 i18n 原名规则按[模板基准](../base/template-reference.md)核对，再检查 Web 模板差异；实例字段命名遵循[基准保留字段约束](../base/script-reference.md#页面与组件实例属性与方法)。
- Web 由 Vue 2.7 承载；共用 `.mpx` 使用 Mpx 语法，混用 `.vue` 组件需兼容 Vue 2.7，通过 usingComponents 或 components 注册并隔离其他端依赖，不能直接使用 Vue 3 专用组件。
- 保持响应式赋值，Web 不提供 `this.setData`；`$forceUpdate` / context.forceUpdate 只支持无参刷新，传入数据、选项和回调会忽略，更新后使用 nextTick。
- 组件查询支持 id/class 组合与无空格逗号分组，不支持关系选择器；不要套用 RN selector 一律添加空 wx:ref 的规则。
- 自定义组件事件不支持 `bubbles/composed/capturePhase`；跨层通知使用回调注入或状态。不支持 WXS 事件处理器、mut-bind 和事件内直接执行表达式；详见模板参考。
- 样式隔离、外部类和虚拟宿主按 Web 实际问题配置；不将所有组件全局虚拟化，也不为 Web 强制改单类选择器。页面滚动无需统一设 disableScroll:true；只有实际使用内部 scroll-view 时才采用对应方案。
- 编译期 webConfig 与运行时 Mpx.config.webConfig 分开配置。routeConfig 控制路由模式与 base；JSON entryPagePath 不负责部署前缀。
- 需要按平台或环境生成配置时，按[动态 JSON](../base/json-reference.md#动态-json)使用 `<script name="json">`，并核对 Web 支持字段。
- 内建标题栏默认关闭；JSON navigationStyle:default 不会单独开启。`setNavigationBarTitle` / `setNavigationBarColor` 同步更新当前页面的内建标题栏和浏览器标题/主题色，但不会自动显示标题栏。
- 分包沿用基准声明，但独立启动、preloadRule、onLazyLoadError 在 Web 不生效。不要把 RN loadChunkAsync/downloadChunkAsync 作为 Web 接入前提。
- 浏览器权限、CORS、媒体播放和宿主桥接按目标 API 核对；未列出的 API/JSON 字段不能视为支持。请求默认超时可通过应用 JSON 的 `networkTimeout.request` 配置，单次请求的 `timeout` 优先。

## SSR 额外约束

进入 SSR 任务时读取 [SSR 全流程](./ssr-reference.md)：server/client 使用同一 app.mpx，使用 history 路由及 context.url；useSSR 控制客户端等待路由就绪，不是服务端构建开关。每请求创建 Pinia，通过 onAppInit 返回；不使用模块级共享状态或依赖 @mpxjs/store 的 SSR 同步。首屏预取返回 serverPrefetch/onServerPrefetch 的实际 Promise，onLoad 的 Promise 不被 SSR 等待。服务端不直接访问 window/document，不无必要覆盖框架默认 onSSRAppCreated 流程。

## 验证

按 [编译校验](../base/compile-validation.md) 显式 `--target=web`，跨端时再加实际原平台。执行项目相关 ESLint/测试；浏览器验证路由直达/刷新、事件、滚动和样式。SSR 分别构建 server/client，验证请求隔离、预取状态及 hydration。编译通过不能代替这些运行行为验证。
