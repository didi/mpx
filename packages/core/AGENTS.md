# @mpxjs/core

Mpx 框架的运行时核心，提供响应式系统、组件/页面/应用生命周期、跨平台 patch 与 composition API。

## 入口文件

- [src/index.js](src/index.js)：聚合导出 `createApp` / `createPage` / `createComponent` / `nextTick` / 生命周期常量与组合式 API；同时 re-export `@mpxjs/store`。
- [src/runtime/mpx.js](src/runtime/mpx.js)：CommonJS 兼容入口，转发 `src/index.js` 的 default 导出（即 Mpx 单例）。
- [@types/index.d.ts](@types/index.d.ts)：对外 TS 类型声明，供使用方 IDE/类型检查使用。

## 核心模块

- [src/platform/](src/platform/)：跨端平台实现层。
  - [src/platform/createApp.js](src/platform/createApp.js) / [createPage.js](src/platform/createPage.js) / [createComponent.js](src/platform/createComponent.js)：三大入口工厂。
  - [src/platform/createApp.ios.js](src/platform/createApp.ios.js)：RN/iOS 分支实现（构建期通过 .ios 后缀路由）。
  - [src/platform/builtInMixins/](src/platform/builtInMixins/)：内置 mixin（如 i18n、refs、style、ref 收集等）。
  - [src/platform/patch/](src/platform/patch/)：各平台属性/事件/数据的对齐补丁。
  - [src/platform/env/index.js](src/platform/env/index.js)：运行时环境检测与初始化。
  - [src/platform/export/](src/platform/export/)：聚合对外导出的 API 与 InstanceAPIs。
- [src/core/](src/core/)：与平台无关的内核逻辑。
  - [proxy.js](src/core/proxy.js)：MpxProxy（实例代理，挂在 `__mpxProxy` 上，承载 reactive/data/watch/lifecycle 调度）。
  - [mergeOptions.js](src/core/mergeOptions.js) / [transferOptions.js](src/core/transferOptions.js)：options 合并与跨端转换的入口。
  - [innerLifecycle.js](src/core/innerLifecycle.js)：所有内部生命周期常量（BEFORECREATE / CREATED / ONLOAD / ONSHOW / REACTHOOKSEXEC 等）。
  - [injectMixins.js](src/core/injectMixins.js)：全局 mixin 注入。
  - [implement.js](src/core/implement.js)：能力声明（用于 polyfill 检测）。
- [src/observer/](src/observer/)：响应式系统（Vue3 风格）。
  - [reactive.js](src/observer/reactive.js) / [ref.js](src/observer/ref.js) / [computed.js](src/observer/computed.js) / [effect.js](src/observer/effect.js) / [effectScope.js](src/observer/effectScope.js) / [watch.js](src/observer/watch.js) / [scheduler.js](src/observer/scheduler.js) / [dep.js](src/observer/dep.js) / [array.js](src/observer/array.js)。
- [src/convertor/](src/convertor/)：编译期/运行期的小程序方言转换（wxToAli / wxToWeb / wxToReact 等），由 [convertor.js](src/convertor/convertor.js) 与 [getConvertMode.js](src/convertor/getConvertMode.js) 调度，[mergeLifecycle.js](src/convertor/mergeLifecycle.js) 提供生命周期映射。
- [src/dynamic/](src/dynamic/)：动态运行时渲染（Web/RN 的 vnode 体系），核心是 [dynamicRenderMixin.js](src/dynamic/dynamicRenderMixin.js) 与 [vnode/](src/dynamic/vnode/)。
- [src/helper/](src/helper/)：辅助工具，例如 [MpxScroll/](src/helper/MpxScroll/)。

## 典型调用链

1. **应用启动**：用户代码 `createApp(options)` → `src/platform/createApp.js` → 通过 `transferOptions` 跨端转换 → 注入 `injectMixins` → 由具体平台运行（小程序原生 / Web `Vue` / RN `createApp.ios.js`）。
2. **页面/组件实例化**：`createPage` / `createComponent` → 创建 `MpxProxy`（[core/proxy.js](src/core/proxy.js)）→ `mergeOptions` 合并配置 → `observer/reactive` 建立响应式 → 派发 `BEFORECREATE` / `CREATED` 等生命周期。
3. **响应式更新**：data / setup 中的状态变更 → `dep.notify` → `effect` 进入 `scheduler` 队列 → `nextTick` 刷新 → 触发 `setData`（小程序）或重新 render（Web/RN）。
4. **跨端构建期路由**：构建工具命中 `__mpx_mode__` / `.ios.js` 后缀 / `convertor` 表，将同一份 options 适配到目标平台运行时。

## 注意

- 运行时代码禁止使用对象 spread 合并，统一使用 `Object.assign` 或 `@mpxjs/utils` 的 `extend`/`merge`。
- 新增对外 API 需要同步维护 [@types/index.d.ts](@types/index.d.ts)。
- 跨端逻辑差异优先放进 `platform/` 或通过 `__mpx_mode__` 分支，不要污染 `core/` / `observer/`。
