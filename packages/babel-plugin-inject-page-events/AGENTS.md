# @mpxjs/babel-plugin-inject-page-events

Babel 插件：把页面文件中出现的 `onPullDownRefresh` / `onReachBottom` / `onShareAppMessage` 等小程序页面事件钩子，注入到 `createPage` 生成的 `pageEvents` 对象上，使原生小程序运行时能正确路由到 `__mpxProxy.callHook`。

## 入口文件

- [src/index.js](src/index.js)：插件主体（默认导出工厂函数）。

## 核心模块

只有单文件，逻辑分两部分：

- 收集阶段：`Program.enter` 重置 `state`；`CallExpression` visitor 中检测：
  - 是否调用了 `createPage`（标记 `state.isPage = true`）；
  - 是否调用了已知的副作用页面 hook（`onPullDownRefresh` / `onReachBottom` / `onShareAppMessage` / `onShareTimeline` / `onAddToFavorites` / `onPageScroll` / `onTabItemTap` / `onSaveExitState`），收集到 `state.sideEffectHooks`。
- 注入阶段：`Program.exit` 时若是页面且收集到了副作用 hook，则生成 `global.currentInject.pageEvents = { onXxx: function(e) { return this.__mpxProxy.callHook('__onXxx__', [e]) }, ... }` 代码，`unshiftContainer` 到模块顶部。

## 典型调用链

1. `@mpxjs/webpack-plugin` 在编译 page 的 `<script>` block 时把本插件加进 babel 配置。
2. babel 解析 page 源码 → 命中 `createPage(...)` 与若干 `onXxx` 引用 → 退出 Program 时往顶部插入 `global.currentInject.pageEvents = {...}`。
3. 运行时 `createPage`（[@mpxjs/core](../core/AGENTS.md)）读取 `global.currentInject.pageEvents` 并注册到 Page options 上，宿主小程序触发事件时反向调用 `MpxProxy.callHook`。

## 注意

- 副作用 hook 名单是硬编码（`sideEffectHookNameMap`）。新增页面事件钩子时需要同步更新该列表，否则注入会缺失。
- 该插件依赖 babel 注入的 `parse`，作为工厂参数传入，保证宿主项目的 babel 解析配置一致。
