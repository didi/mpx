# @mpxjs/utils

Mpx 全家桶共享的纯工具库，被 [@mpxjs/core](../core/AGENTS.md)、[@mpxjs/store](../store/AGENTS.md)、[@mpxjs/pinia](../pinia/AGENTS.md)、[@mpxjs/fetch](../fetch/AGENTS.md) 等大量复用。

## 入口文件

- [src/index.js](src/index.js)：聚合 re-export，所有对外能力都通过子模块的 `export *` 暴露。

## 核心模块（按子文件）

- [src/log.js](src/log.js)：`error` / `warn` / `log` 等日志包装；同时是 `componentError` 的实现来源（[componentError.js](src/componentError.js)）。
- [src/base.js](src/base.js)：基础类型判断、`isObject` / `isPlainObject` / `isFunction` / `noop` 等。
- [src/object.js](src/object.js)：对象操作（`hasOwn`、`getByPath`、`setByPath`、`proxy`、`def` 等）。
- [src/path.js](src/path.js)：路径解析工具。
- [src/array.js](src/array.js)：数组工具。
- [src/merge.js](src/merge.js)：`extend` / `merge` / `diffAndCloneA`（对象合并/深克隆/差分），统一替代 Object spread。
- [src/errorHandling.js](src/errorHandling.js)：统一错误处理入口，承载 `errorHandler`。
- [src/element.js](src/element.js)：DOM/元素相关辅助（Web 端用）。
- [src/env.js](src/env.js)：运行环境判断（mode / target / env）。
- [src/url.js](src/url.js)：url / query 解析与拼装。
- [src/componentError.js](src/componentError.js)：组件级错误的格式化输出。
- [src/make-map.js / makeMap](src/base.js)：构造字符串集合查表函数（在 [base.js](src/base.js) 中导出）。

> 注：[src/log.js](src/log.js) 与 [src/componentError.js](src/componentError.js) 也通过 `index.js` 的 `export * from './log'` 暴露。

## 典型调用链

1. **运行时合并 options**：`@mpxjs/core` 调用 `extend` / `merge` / `diffAndCloneA` 完成 mixin 合并与深拷贝（替代禁用的 object spread）。
2. **响应式辅助**：`@mpxjs/store` / `@mpxjs/pinia` 调用 `proxy`、`getByPath`、`hasOwn`、`warn` 实现路径访问与诊断。
3. **错误兜底**：组件/页面捕获到异常 → 调用 [errorHandling.js](src/errorHandling.js) 的统一入口 → 触发用户注册的 `errorHandler` 与日志输出。

## 注意

- 本包是纯函数仓库，禁止依赖 `@mpxjs/core` 等上层包，否则会形成环依赖。
- 新增工具尽量挂到对应子文件并通过 [index.js](src/index.js) re-export，保持单入口聚合导出的形态。
- 仓库强制约束：禁止使用对象 spread 合并，统一使用 [merge.js](src/merge.js) 中的 `extend` / `Object.assign`。
