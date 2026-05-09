# @mpxjs/webview-bridge

H5 在小程序 webview 中运行时的桥接库：根据当前宿主小程序自动加载对应平台 SDK（jweixin / qqjssdk / appx / swan / tt 等），并对外暴露统一的 webview 调用入口。

## 入口文件

- [src/index.js](src/index.js)：源码主入口，决定宿主、加载对应 SDK、暴露统一 API。
- [src/loadscript.js](src/loadscript.js)：通用 `<script>` 动态加载器，处理超时与错误回调。
- 产物：
  - [dist/webviewbridge.min.js](dist/webviewbridge.min.js)（`package.json#main`，UMD）
  - [dist/webviewbridge.esm.js](dist/webviewbridge.esm.js)（`package.json#module`，ESM）
- [build/](build/)：构建脚本/配置。

## 核心实现

- [src/index.js](src/index.js)：
  - `SDK_URL_MAP`：内置各平台 SDK CDN 地址，可通过全局 `window.sdkUrlMap` 覆盖。
  - `getMpxWebViewId()`：从 `location.href` 解析 `mpx_webview_id` query。
  - 通过 UA / global 对象判断当前宿主，调用 [loadscript.js](src/loadscript.js) 加载对应 SDK，统一 resolve `sdkReady`，注册到 `loadErrorCallbacks`。
  - 对外导出小程序 webview JS-SDK 能力的 polyfill / 转发函数。

## 典型调用链

1. H5 引入 `@mpxjs/webview-bridge`（UMD/ESM）→ [index.js](src/index.js) 在模块初始化时探测宿主并加载 SDK → 对外提供 `Promise` 风格的就绪信号与统一调用方法。
2. 业务调用 `bridge.xxx()` → 内部等待 `sdkReady` → 调用宿主 SDK 的对应方法。
3. SDK 加载失败 → 触发 `loadErrorCallbacks` 注册的回调。

## 注意

- 这是浏览器侧库，禁止使用 Node API；构建产物形态固定为 UMD + ESM，必要时同步更新 [build/](build/) 配置。
- 新宿主接入：在 `SDK_URL_MAP` 增加条目，并补全宿主探测分支 + 调用层映射。
- SDK CDN 地址可被业务通过 `window.sdkUrlMap` 覆盖，新增字段时保留这个覆盖入口。
