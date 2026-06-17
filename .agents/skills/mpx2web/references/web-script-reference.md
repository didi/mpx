# 跨端输出 Web 脚本能力参考

> **填充说明（待补充，删除本块后正式发布）**：本文件为骨架。Web 脚本能力（基于 Vue 2.7）与小程序高度一致，填充时**重点标注差异项**：小程序专属生命周期/方法在 Web 的缺失与降级。可参考 `mpx2rn/references/rn-script-reference.md` 的形态。

## 目录

- [构造选项](#构造选项)
- [数据响应](#数据响应)
- [组合式 API](#组合式-api)
- [生命周期](#生命周期)
- [页面 / 组件实例方法与属性](#页面--组件实例方法与属性)
- [Mpx 运行时导出](#mpx-运行时导出)
- [全局 API](#全局-api)
- [环境 API](#环境-api)
- [状态管理](#状态管理)

---

## 构造选项

TODO：`data` / `properties` / `methods` / `computed` / `watch` / `mixins` 等在 Web 的支持。

## 数据响应

TODO：响应式系统（Vue 2.7 reactivity）、`setData` 兼容、`$set` 等。

## 组合式 API

TODO：`<script setup>` / `defineProps` / `defineExpose` / `ref` / `reactive` / `computed` / `watch` 在 Web 的支持。

## 生命周期

> **本节为重点**：标注小程序专属生命周期在 Web 的缺失。

TODO 表格（生命周期 | Web 支持 | 说明）：
- 应用：`onLaunch` / `onShow` / `onHide` / `onError` —— TODO
- 页面：`onLoad` / `onReady` / `onShow` / `onHide` / `onUnload` / `onPullDownRefresh` / `onReachBottom` / `onPageScroll`（Web 支持）—— TODO
- 小程序专属：`onShareAppMessage` / `onShareTimeline` / `onAddToFavorites` / `onTabItemTap` / `onSaveExitState` —— **Web 无等效，需隔离/降级**
- 组件：`created` / `attached` / `ready` / `detached` 等 —— TODO

## 页面 / 组件实例方法与属性

TODO：`selectComponent` / `selectAllComponents` / `createSelectorQuery` / `createIntersectionObserver` 在 Web 的支持。selector 语法与微信小程序保持一致（ID、class、子元素 `>`、后代、跨组件后代 `>>>`、并集 `,`），Web 版基于真实 DOM（`document.querySelector` / `querySelectorAll`）查询。

## Mpx 运行时导出

TODO：`createApp` / `createPage` / `createComponent` / `getMixin` 等运行时导出在 Web 的支持。

## 全局 API

TODO：`mpx.xxx` 全局 API（`mpx.set` / `mpx.watch` / `mpx.use` 等）。

## 环境 API

详见 [环境 API 参考](./web-api-reference.md)。

## 状态管理

TODO：`@mpxjs/pinia` / `@mpxjs/store` 在 Web 的支持与推荐。
