# @mpxjs/pinia

Mpx 的 Pinia 实现，对齐 Vue 生态的 Pinia API，跑在 Mpx 的响应式之上，支持小程序、Web、RN。

## 入口文件

- [src/index.js](src/index.js)：小程序/RN 入口，导出 `createPinia` / `defineStore` / `mapStores` / `mapState` / `mapActions` / `storeToRefs` / `MutationType` / `setMapStoreSuffix` 等。
- [src/index.web.js](src/index.web.js)：Web 端入口（`.web.js` 后缀，由 webpack-plugin resolver 选择），通常直接桥接官方 pinia。
- [@types/index.d.ts](@types/index.d.ts)：对外类型。

## 核心模块

- [src/createPinia.js](src/createPinia.js)：创建 Pinia 实例与全局 state 容器。
- [src/util.js](src/util.js)：`activePinia` 全局指针、`mergeReactiveObjects`、`isComputed` 等工具。
- [src/subscription.js](src/subscription.js)：`addSubscription` / `triggerSubscriptions`，承载 `$subscribe` / `$onAction`。
- [src/storeToRefs.js](src/storeToRefs.js)：把 store 上的 state/getter 转成 refs。
- [src/mapHelper.js](src/mapHelper.js)：`mapStores` / `mapState` / `mapActions` / `setMapStoreSuffix`。
- [src/const.js](src/const.js)：`MutationType` 等常量。

## 典型调用链

1. **安装**：`const pinia = createPinia(); mpx.use(pinia)` → [createPinia.js](src/createPinia.js) 把 pinia 实例注入到 Mpx 全局，组件 setup 中可获取。
2. **定义/使用 store**：`defineStore('id', { state, getters, actions })` → 首次调用时基于 `@mpxjs/core` 的 `reactive` / `computed` / `effectScope` 创建 store 实例并缓存到 pinia。
3. **订阅**：`store.$subscribe(cb)` / `store.$onAction(cb)` → [subscription.js](src/subscription.js) → 在 mutation/action 触发时调用。

## 注意

- Web 端走 [src/index.web.js](src/index.web.js)，直接复用官方 pinia 行为；小程序/RN 端在 Mpx 响应式系统上自实现，二者要保证 API 形状一致。
- 响应式 API 全部从 `@mpxjs/core` 引入，不要直接依赖 Vue。
