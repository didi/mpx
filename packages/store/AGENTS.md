# @mpxjs/store

Mpx 内置的 Vuex 风格 store（在 [@mpxjs/core](../core/AGENTS.md) 中被 re-export），跑在 Mpx 自有响应式上。新项目推荐使用 [@mpxjs/pinia](../pinia/AGENTS.md)，本包用于历史项目兼容。

## 入口文件

- [src/index.js](src/index.js)：核心实现，导出 `createStore` / `createStoreWithThis`、辅助函数与 `Store` 类。
- [src/mapStore.js](src/mapStore.js)：`mapState` / `mapGetters` / `mapMutations` / `mapActions` 帮助函数。
- [@types/index.d.ts](@types/index.d.ts)：对外类型。

## 核心模块

- [src/index.js](src/index.js) 内主要分两部分：
  - `transformGetters`：把用户传入的 getters 包装成对当前 module/state 的代理函数，注入响应式（`reactive` + `computed`）。
  - `Store` 类：`commit` / `dispatch` / `getters` / `state` / `subscribe`，支持 module 嵌套与 `withThis` 风格。
- [src/mapStore.js](src/mapStore.js)：四个 map 帮助函数把 store 字段映射到组件 computed/methods。

## 典型调用链

1. **创建**：用户 `createStore({ state, mutations, actions, getters, modules })` → 内部基于 `@mpxjs/core` 的 `reactive` / `computed` / `effectScope` 构造 `Store` 实例。
2. **挂载**：通过 `mpx.use(store)` 或 `createApp({ store })` 注入，组件实例上可通过 `this.$store` 访问。
3. **读取/变更**：`store.state.x` / `store.getters.y`（响应式追踪） → `commit('mutation')` 同步变更 → `dispatch('action')` 异步流程 → 通过 `subscribe` 派发订阅。

## 注意

- 新项目优先用 [@mpxjs/pinia](../pinia/AGENTS.md)，本包仅做兼容维护。
- 响应式 API 全部从 `@mpxjs/core` 引入，不要直接依赖 Vue。
- 与 `@mpxjs/utils` 的 `proxy` / `getByPath` / `warn` 配合做路径访问与告警。
