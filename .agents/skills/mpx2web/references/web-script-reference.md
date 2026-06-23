# 跨端输出 Web 脚本能力参考

本文档说明 Mpx 输出 Web（`mode: 'web'`）时，`<script>` 中可用的构造选项、生命周期、实例 API、组合式 API 与状态管理能力。Web 侧基于 Vue 2.7 运行，整体能力与小程序写法高度一致；下文重点记录 Web 运行时确认支持的能力与需要隔离的小程序专属能力。

## 目录

- [构造选项](#构造选项)
  - [App 构造选项](#app-构造选项)
  - [页面 / 组件构造选项](#页面--组件构造选项)
  - [页面 / 组件实例方法与属性](#页面--组件实例方法与属性)
- [数据响应](#数据响应)
- [组合式 API](#组合式-api)
- [生命周期](#生命周期)
- [Mpx 运行时导出](#mpx-运行时导出)
- [全局 API](#全局-api)
- [环境 API](#环境-api)
- [状态管理](#状态管理)

---

## 构造选项

### App 构造选项

`createApp(options)` 用于注册应用级逻辑、全局字段与 SSR 钩子。Web 下非生命周期字段会进入 `getApp()` 返回对象；全局响应式状态建议使用 Pinia 或业务 store，不要依赖 App 自身响应式。

| 选项 | Web 侧说明 |
| --- | --- |
| `onLaunch` | Web 应用创建后触发，入参包含当前路由 `path`、`query` 等基础信息。 |
| `onShow` | 首次启动后触发；页面从隐藏切回可见时也会触发。 |
| `onHide` | 页面进入隐藏态时触发，Web 下不提供隐藏原因。 |
| `onError` | Web 侧注册到全局错误回调链。 |
| `onUnhandledRejection` | Web 侧注册到未处理 Promise 拒绝回调链。 |
| `onPageNotFound` | 首次进入不存在页面时可触发；非首次路由跳转找不到页面会按导航 API 失败处理。 |
| `onSSRAppCreated` | SSR 服务端应用创建钩子，见[生命周期](#生命周期)。 |
| `onAppInit` | SSR / 应用创建前扩展钩子，常用于创建并返回新的 Pinia 实例。 |
| `provide` | 可作为 Vue App 级 provide 使用。 |
| 其他顶层字段 | 挂到 `getApp()` 返回对象上。 |
| `data` / `computed` / `watch` | App 级不作为业务响应式状态使用。 |

### 页面 / 组件构造选项

页面使用 `createPage`，组件使用 `createComponent`。常规选项会转换为 Vue 组件选项运行。

| 选项 | 适用 | Web 侧说明 |
| --- | --- | --- |
| `properties` / `props` | 组件 | 转换为 Vue `props`；`value` 会转为默认值。 |
| `data` | 页面 / 组件 | 响应式状态，支持对象或函数形态。 |
| `computed` | 页面 / 组件 | 计算属性。 |
| `watch` | 页面 / 组件 | 侦听器；字符串路径支持逗号分隔多字段。 |
| `methods` | 页面 / 组件 | 事件处理与业务方法，Web 下会包裹错误处理。 |
| `mixins` | 页面 / 组件 | 支持 Mpx / Vue 选项合并。 |
| `provide` / `inject` | 页面 / 组件 | 支持。 |
| `setup` | 页面 / 组件 | 支持组合式 API，详见[组合式 API](#组合式-api)。 |
| `components` | 页面 / 组件 | 可注册 Web / Vue 组件；跨端组件依赖优先使用 JSON `usingComponents`。 |
| `pageLifetimes.show` | 组件 | 所在页面展示时触发。 |
| `pageLifetimes.hide` | 组件 | 所在页面隐藏时触发。 |
| `pageLifetimes.resize` | 组件 | 所在页面尺寸变化时触发。 |
| `relations` | 组件 | Web 下不按小程序原生 relations 能力实现，需避免依赖。 |
| `moved` / `definitionFilter` | 组件 | Web 运行时转换不支持。 |

### 页面 / 组件实例方法与属性

| 名称 | 类型 | 适用 | Web 侧说明 |
| --- | --- | --- | --- |
| `route` | 属性 | 页面 | 当前页面路由路径。 |
| `data` | 属性 | 页面 / 组件 | 合并后的 `$props` 与 `$data` 快照。 |
| `dataset` | 属性 | 页面 / 组件 | 从 DOM attrs 收集的 dataset。 |
| `id` | 属性 | 页面 / 组件 | 当前实例根节点 id。 |
| `getPageId()` | 方法 | 页面 / 组件 | 返回当前页面 id。 |
| `getOpenerEventChannel()` | 方法 | 页面 | 获取 `navigateTo` 创建的 `EventChannel`。 |
| `triggerEvent(name, detail?)` | 方法 | 组件 | 派发自定义事件；`click` 会转为内部 `_click` 事件以避开原生点击冲突。 |
| `selectComponent(selector)` | 方法 | 页面 / 组件 | 查找第一个匹配组件实例；Web 下仅支持基础选择器，不支持关系选择器。 |
| `selectAllComponents(selector)` | 方法 | 页面 / 组件 | 查找全部匹配组件实例；规则同 `selectComponent`。 |
| `createSelectorQuery()` | 方法 | 页面 / 组件 | 创建 selector 查询，基于 Web DOM 实现。 |
| `createIntersectionObserver(options?)` | 方法 | 页面 / 组件 | 创建交叉观察器，基于 Web DOM / IntersectionObserver 能力。 |
| `$refs` | 属性 | 页面 / 组件 | 支持 `wx:ref`；DOM / 内建组件 ref 会转换为 selector 查询结果。 |
| `$watch` | 方法 | 页面 / 组件 | Vue 实例 watch，支持 Mpx 对逗号路径的扩展。 |
| `$forceUpdate` | 方法 | 页面 / 组件 | 强制刷新视图。 |
| `$nextTick` | 方法 | 页面 / 组件 | 视图更新后执行回调。 |
| `$set` / `$delete` | 方法 | 页面 / 组件 | 响应式新增 / 删除字段。 |
| `$t` / `$tc` / `$te` / `$tm` | 方法 | 页面 / 组件 | i18n 方法，依赖工程 i18n 配置。 |
| `setData` | 方法 | 页面 / 组件 | 小程序兼容 API；Web 业务优先直接赋值。 |

---

## 数据响应

Web 侧运行在 Vue 2.7 响应式系统上，页面和组件数据可直接赋值更新视图。

| 能力 | Web 侧说明 |
| --- | --- |
| `data` | 响应式状态根。 |
| `computed` | 基于依赖缓存。 |
| `watch` / `$watch` | 支持路径、函数和对象写法。 |
| `setData` | 兼容小程序写法，不是 Web 首选。 |
| `$set` / `mpx.set` | 为响应式对象新增字段。 |
| `$delete` / `mpx.delete` | 删除响应式对象字段。 |

---

## 组合式 API

Web 支持 Mpx 组合式 API，从 `@mpxjs/core` 命名导出引入。

| 能力 | Web 侧说明 |
| --- | --- |
| `setup(props, context)` | 支持；生命周期钩子需在 `setup` 同步执行期间注册。 |
| `props` | 对应组件 `properties` / `props`，直接解构会丢响应式，按需使用 `toRefs`。 |
| `context.triggerEvent` | 同实例 `triggerEvent`。 |
| `context.refs` | 同实例 `$refs`。 |
| `context.forceUpdate` | 同实例 `$forceUpdate`。 |
| `context.selectComponent` / `selectAllComponents` | 同实例选择组件方法。 |
| `context.createSelectorQuery` / `createIntersectionObserver` | 同实例查询 / 观察方法。 |
| `context.getPageId` | 同实例 `getPageId`。 |
| `<script setup>` | 支持 Mpx 编译宏；需要通过 `defineExpose` 显式暴露模板使用的数据和方法。 |
| `defineProps` | `<script setup>` 编译宏，接收 `properties` 同形态声明。 |
| `defineExpose` | `<script setup>` 编译宏，用于限定暴露给模板的绑定。 |
| `defineOptions` | `<script setup>` 编译宏，用于声明选项式配置。 |
| `useContext` | `<script setup>` 编译宏，用于获取 `setup` 的 `context`。 |

常用响应式导出包括 `ref`、`reactive`、`computed`、`watch`、`watchEffect`、`toRef`、`toRefs`、`provide`、`inject`、`getCurrentInstance`、`useI18n` 等。

---

## 生命周期

### 生命周期对应关系

| 生命周期 | 适用 | Web 侧说明 |
| --- | --- | --- |
| `onLaunch` | App | 应用创建后触发。 |
| `onShow` | App / 页面 | App 可见、页面激活时触发。 |
| `onHide` | App / 页面 | App 隐藏、页面失活时触发。 |
| `onError` | App | 全局错误回调。 |
| `onUnhandledRejection` | App | 未处理 Promise 拒绝回调。 |
| `onPageNotFound` | App | 首次进入不存在页面时触发。 |
| `onLoad` | 页面 | 页面创建后触发，入参为路由 query。 |
| `onReady` | 页面 | 页面首次挂载完成后触发。 |
| `onUnload` | 页面 | 页面卸载时触发。 |
| `onResize` | 页面 / 组件 `pageLifetimes` | 浏览器窗口尺寸变化时触发。 |
| `onPullDownRefresh` | 页面 | 需页面 JSON 开启 `enablePullDownRefresh`。 |
| `onReachBottom` | 页面 | 页面滚动触底时触发，距离由 `onReachBottomDistance` 控制。 |
| `onPageScroll` | 页面 | 页面滚动时触发。 |
| `created` / `attached` | 组件 | 组件创建 / 挂载阶段触发。 |
| `ready` | 组件 | 组件挂载完成后触发。 |
| `detached` | 组件 | 组件销毁时触发。 |
| `pageLifetimes.show` / `hide` / `resize` | 组件 | 随所属页面状态触发。 |
| `serverPrefetch` | App / 页面 / 组件 | SSR 服务端数据预取。 |
| `onAppInit` | App | SSR / 应用创建前扩展，常用于创建 Pinia。 |
| `onSSRAppCreated` | App | SSR 服务端应用创建后回调，可处理路由和状态注入。 |

### Web 没有对应能力或需降级

| 生命周期 | Web 侧说明 |
| --- | --- |
| `onShareAppMessage` | Web 没有小程序分享面板能力；如需分享，使用 Web 分享或业务自定义分享方案。 |
| `onShareTimeline` | Web 没有朋友圈分享生命周期能力。 |
| `onAddToFavorites` | Web 没有小程序收藏生命周期能力。 |
| `onTabItemTap` | Web 有 tabBar 路由切换，但没有小程序 `onTabItemTap` 生命周期能力。 |
| `onSaveExitState` | Web 没有小程序退出状态保存能力。 |
| `onThemeChange` | Web 没有小程序主题变更生命周期能力；如需适配主题，使用 Web 媒体查询或业务方案。 |

### 注意事项

- 页面 show / hide 由 Web 路由 keep-alive 激活态与浏览器可见性变化驱动。
- `onPullDownRefresh` 需页面配置 `enablePullDownRefresh: true`。
- `onPageScroll` / `onReachBottom` 在 `disableScroll: true` 时不按页面滚动触发。
- SSR 阶段不要直接访问 `window`、`document`、`localStorage` 等浏览器对象。

---

## Mpx 运行时导出

### 默认导出

默认导出的 `mpx` 对象包含全局 API、插件安装与环境 API 能力。

| 能力 | Web 侧说明 |
| --- | --- |
| `mpx.use(plugin, options?)` | 安装插件。 |
| `mpx.mixin` / `mpx.injectMixins` | 注入全局 mixin。 |
| `mpx.observable` | 创建响应式对象。 |
| `mpx.watch` | 创建侦听器。 |
| `mpx.set` / `mpx.delete` | 响应式新增 / 删除字段。 |
| `mpx.isReactive` / `mpx.isRef` | 响应式判断。 |
| `mpx.nextTick` | 下一轮更新后执行。 |
| `mpx.xxx` 环境 API | 详见 [环境 API 参考](./web-api-reference.md)。 |

### 命名导出

| 导出 | Web 侧说明 |
| --- | --- |
| `createApp` / `createPage` / `createComponent` | App / 页面 / 组件构造函数。 |
| `nextTick` | 更新后回调。 |
| `ref` / `reactive` / `computed` / `watch` | 组合式响应能力。 |
| `toRef` / `toRefs` / `unref` / `isRef` | ref 工具。 |
| `watchEffect` / `watchSyncEffect` / `watchPostEffect` | effect 类侦听。 |
| `effectScope` / `getCurrentScope` / `onScopeDispose` | effect scope。 |
| `provide` / `inject` | 依赖注入。 |
| `getCurrentInstance` | 获取当前 Mpx 实例代理。 |
| `useI18n` | i18n 组合式入口。 |
| `onLoad` / `onShow` / `onHide` / `onReady` 等 | 组合式生命周期注册函数。 |

---

## 全局 API

| API | Web 侧说明 |
| --- | --- |
| `getApp()` | 返回 App 级普通字段对象；服务端调用有风险。 |
| `getCurrentPages()` | 返回当前 Web 路由栈对应页面实例；服务端调用有风险。 |
| `mpx.config.webConfig.routeConfig` | Web 路由配置，见 [JSON 配置参考](./web-json-reference.md)。 |
| `plugin.webConfig.useSSR` | SSR 异步分包编译配置，见 [JSON 配置参考](./web-json-reference.md)。 |

---

## 环境 API

环境能力统一通过 `mpx.xxx` 调用，Web 侧由 `@mpxjs/api-proxy` 映射到浏览器实现。具体支持范围见 [环境 API 参考](./web-api-reference.md)。

---

## 状态管理

### `@mpxjs/pinia`（推荐）

Web 端 `@mpxjs/pinia` 直接适配 Pinia，推荐新项目和组合式 API 场景使用。

| 场景 | Web 侧说明 |
| --- | --- |
| CSR | 可创建全局 Pinia 实例并使用 `defineStore`。 |
| SSR | 需在 `onAppInit` 中为每次请求创建并返回新的 Pinia 实例。 |
| 数据预取 | 配合 `serverPrefetch` 与 `onSSRAppCreated` 同步服务端状态。 |

### `@mpxjs/store`

`@mpxjs/store` 为历史 Vuex 风格状态管理方案。新状态域优先使用 `@mpxjs/pinia`；已有项目深度依赖时可继续维护。
