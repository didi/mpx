# @mpxjs/api-proxy

把各小程序平台 / Web / RN 的宿主 API 统一映射成 `wx.*` 风格调用，并支持 promisify。

## 入口文件

- [src/index.js](src/index.js)：导出默认 `install`、`getProxy`、`promisify` 以及 `platform/*` 全部 API。
- [src/install.js](src/install.js)：`install(target, options)` 实现，按 `__mpx_mode__` 合并 `ENV_OBJ`、平台 API、自定义实现，并按需 promisify。
- [@types/index.d.ts](@types/index.d.ts)：对外类型声明。

## 核心模块

- [src/platform/index.js](src/platform/index.js)：聚合导出该平台目录下的所有 API 模块。
- [src/platform/api/](src/platform/api/)：按能力划分的 API 实现目录，每个能力一个子目录（`request`、`route`、`storage`、`location`、`canvas`、`audio`、`ble-connection`、`socket-task`、`upload-file`、`download-file`、`system` 等），子目录内通过 `.wx.js` / `.ali.js` / `.web.js` / `.ios.js` / `.android.js` 等后缀做平台分发。
- [src/common/js/](src/common/js/)：跨平台公共工具。
  - [index.js](src/common/js/index.js)：`ENV_OBJ` 等环境常量。
  - [promisify.js](src/common/js/promisify.js)：根据 `whiteList` / `blackList` 把回调式 API 包装成 Promise。
  - [utils.js](src/common/js/utils.js)：参数处理 / 回调归一化等。
  - [web.js](src/common/js/web.js)：Web 端公用辅助。
- [src/common/stylus/](src/common/stylus/)：Web 端 UI 类 API（如 `showModal`、`showToast`）使用的样式。
- [__tests__/web/](__tests__/web/)、[__tests__/rn/](__tests__/rn/)：Web 与 RN 端 API 的单测。

## 典型调用链

1. **集成**：业务方在 Mpx 入口调用 `install(mpx, { usePromise: true, custom: { web: {...} } })` → [install.js](src/install.js) 把 `ENV_OBJ + platformApi + 自定义` 挂到 `target` 上，并按需 promisify。
2. **运行期调用**：业务代码 `mpx.request({...})` → 命中 [platform/api/request/](src/platform/api/request/) 中对应 mode 的实现 → 调用宿主 SDK（`wx.request` / `fetch` / RN 实现） → 通过 `utils` 的回调归一化反射结果。
3. **新增 API**：在 [platform/api/](src/platform/api/) 新建子目录，按目标平台后缀实现，再加进 [platform/index.js](src/platform/index.js)；如需 promisify 默认行为，在 [common/js/promisify.js](src/common/js/promisify.js) 的白/黑名单处理中考虑该 API。

## 注意

- 平台分发依赖文件后缀（`.wx.js` / `.ali.js` / `.web.js` / `.ios.js` 等），由 `@mpxjs/webpack-plugin` 的 resolver（`AddModePlugin`/`AddEnvPlugin`）选择，不要在运行时通过 `if (mode)` 自行分支。
- promisify 仅在 `usePromise=true` 或命中 `whiteList` 时启用，避免破坏原始回调签名。
