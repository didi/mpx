# 跨端输出 Web 环境 API 参考

> **填充说明（待补充，删除本块后正式发布）**：本文件为骨架。`@mpxjs/api-proxy` 在 Web 端将 `mpx.xxx` 映射为 H5 实现。填充时**重点标注受浏览器限制不可用或需降级**的 API（多为设备硬件类）。可参考 `mpx2rn/references/rn-api-reference.md` 的分类与表格形态，但支持结论须按 Web（H5）实际重写。

## 使用说明

通过 `@mpxjs/api-proxy` 提供的统一 `mpx.xxx` 调用环境能力，避免直接使用 `wx.xxx` / `my.xxx`。Web 端由 api-proxy 映射为浏览器（H5）实现。如用户通过 `custom` 配置扩充了 API 能力，以用户说明为准。

## 目录

- [基础](#基础)
- [路由](#路由)
- [界面](#界面)
- [网络](#网络)
- [数据缓存](#数据缓存)
- [媒体](#媒体)
- [位置](#位置)
- [设备](#设备)

---

## 基础

TODO：`getSystemInfo` / `getLaunchOptions` 等在 Web 的实现与字段差异。

## 路由

TODO：`navigateTo` / `redirectTo` / `switchTab` / `navigateBack` / `reLaunch` 在 Web（基于路由）的映射与差异，参见 [Web 路由、部署与 SEO/SSR](./web-routing-deploy.md)。

## 界面

TODO：`showToast` / `showModal` / `showLoading` / `showActionSheet` / `setNavigationBarTitle` / `pageScrollTo` 等在 Web 的支持。

## 网络

TODO：`request` / `uploadFile` / `downloadFile` / `connectSocket` 在 Web 的支持（跨域 / CORS 注意事项）。

## 数据缓存

TODO：`setStorage` / `getStorage`（映射到 localStorage）同步异步在 Web 的支持与容量限制。

## 媒体

TODO：`chooseImage` / `previewImage` / `chooseMedia` / 音视频 API 在 Web 的支持与降级。

## 位置

TODO：`getLocation` / `chooseLocation` 在 Web（浏览器 Geolocation，需 HTTPS 与授权）。

## 设备

> **本节为重点**：标注受浏览器限制的硬件能力。

TODO：
- 网络状态 `getNetworkType` —— TODO
- 剪贴板 `setClipboardData` —— TODO
- 振动 `vibrateShort` —— TODO
- **蓝牙 / NFC / 部分传感器 / 扫码等**：Web 多数不支持或需特定降级 —— 重点标注
