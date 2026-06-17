# 跨端输出 Web 环境 API 参考

## 使用说明

通过 `@mpxjs/api-proxy` 提供的统一 `mpx.xxx` 调用环境能力，避免直接使用 `wx.xxx` / `my.xxx`。Web 端由 api-proxy 映射为浏览器（H5）实现。如用户通过 `custom` 配置扩充了 API 能力，以用户说明为准。

支持状态图例：

- ✓ Web 已实现，可直接使用
- ⚠️ Web 已实现但有差异 / 部分字段缺失 / 受浏览器条件限制
- ✗ Web **未实现**，调用会报错 `web环境不支持xxx方法`（api-proxy 默认实现回退到 `envError`），改造时需用条件编译降级或避免使用

> 一条贯穿性结论：**凡依赖原生硬件 / 系统能力的 API（蓝牙、NFC、扫码、振动、剪贴板、屏幕亮度、拨打电话、登录、支付、Wi-Fi 等）在 Web 基本均为 ✗**，见文末「Web 未实现 API 一览」。

## 目录

- [基础](#基础)
- [路由](#路由)
- [界面](#界面)
- [网络](#网络)
- [数据缓存](#数据缓存)
- [媒体](#媒体)
- [位置](#位置)
- [设备](#设备)
- [Web 未实现 API 一览](#web-未实现-api-一览)

---

## 基础

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `getSystemInfo` / `getSystemInfoSync` | ⚠️ | 基于 `navigator` / `window.screen` / `document` 拼装。`pixelRatio`、`screenWidth/Height`、`windowWidth/Height`、`language`、`platform` 等有效；`brand` / `model` 由 UA 猜测，`system` 由 UA 解析。**大量字段恒为 `null`**：`version`、`SDKVersion`、`fontSizeSetting`、`benchmarkLevel`、`statusBarHeight`、`safeArea`、各类 `*Authorized`、`bluetoothEnabled` / `locationEnabled` / `wifiEnabled`、`abi` / `cpuType` / `memorySize`。需要状态栏高度 / 安全区域时应改用 CSS（见 `web-style-practice.md`）。 |
| `getDeviceInfo` | ⚠️ | 同上，`brand`/`model`/`system` 由 UA 推断，精度有限。 |
| `getWindowInfo` | ⚠️ | 有效返回 `pixelRatio`、`screenWidth/Height`、`windowWidth/Height`；`statusBarHeight`、`safeArea`、`screenTop` 恒为 `null`。 |
| `getLaunchOptionsSync` / `getEnterOptionsSync` | ⚠️ | 返回 `global.__mpxLaunchOptions` / `__mpxEnterOptions`，无对应数据时返回 `{}`。**无异步版 `getLaunchOptions`**。 |
| `base64ToArrayBuffer` / `arrayBufferToBase64` | ✓ | 纯 JS 实现，无差异。 |

## 路由

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `navigateTo` | ✓ | 基于内部 `vue-router`（`global.__mpxRouter.push`）。支持 `events` / `eventChannel` 页面间通信；目标为 tabBar 页会 fail。 |
| `redirectTo` | ✓ | `router.replace`；目标为 tabBar 页会 fail。 |
| `navigateBack` | ✓ | `router.go(-delta)`，`delta` 会被栈深度收敛。 |
| `reLaunch` | ✓ | 支持额外 `delta` 参数，用于宿主 webview 内页面跳转无法统计时由用户手动校正跳转层数。 |
| `switchTab` | ✓ | 仅可切到 tabBar 页，否则 fail。 |

> 路由模式（history / hash）、`publicPath` 部署路径等配置见 [Web 路由、部署与 SEO/SSR](./web-routing-deploy.md)。

## 界面

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `showToast` / `hideToast` | ✓ | 内置 DOM 组件渲染。 |
| `showLoading` / `hideLoading` | ✓ | 同上，`duration: -1` 常驻。 |
| `showModal` | ✓ | 内置 DOM 弹窗。 |
| `showActionSheet` | ✓ | 内置 DOM 组件。 |
| `setNavigationBarTitle` | ✓ | 设置 `document.title`。 |
| `setNavigationBarColor` | ⚠️ | 仅插入 `<meta name="theme-color">`，普通浏览器多无视觉效果。 |
| `hideHomeButton` | ✗ | `envError`。 |
| `pageScrollTo` | ✓ | 经 `nextTick` 后调用内部滚动管理器，需页面已挂载。 |
| `startPullDownRefresh` / `stopPullDownRefresh` | ⚠️ | 需当前页面开启了下拉刷新（页面 JSON `enablePullDownRefresh`）才生效，否则静默无效。 |
| `setTabBarItem` / `setTabBarStyle` / `showTabBar` / `hideTabBar` | ⚠️ | 操作内置 `global.__tabBar`；**自定义 tabBar（`custom: true`）下 set 类调用会 fail**，需自行管理。 |
| `onWindowResize` / `offWindowResize` | ✓ | 监听 `window.resize`。 |

## 网络

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `request` | ⚠️ | 基于 `axios`。**受同源策略约束，跨域需服务端正确配置 CORS**；`GET` 自动拼 query，`application/x-www-form-urlencoded` 的 `POST` 自动序列化。返回结果中 `cookies` / `profile` / `exception` 为不支持字段（访问会告警）。返回 `RequestTask` 可 `abort()`。 |
| `connectSocket` | ⚠️ | 基于浏览器 `WebSocket`，返回 `SocketTask`。**请通过 `socketTask.send/close/onOpen/onMessage/onError/onClose` 操作**；全局式 `sendSocketMessage` / `closeSocket` / `onSocketXxx` 仅打印告警、不工作。 |
| `uploadFile` / `downloadFile` | ✗ | Web 无实现（`envError`）。如需上传/下载请用条件编译，在 Web 端改用 `FormData` + `fetch` / `<a download>` 等原生方案。 |

## 数据缓存

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `setStorage` / `setStorageSync` | ✓ | 映射 `localStorage`，值经 `JSON.stringify` 存储。 |
| `getStorage` / `getStorageSync` | ✓ | 取不到时异步版 fail、同步版返回 `''`。 |
| `removeStorage` / `removeStorageSync` | ✓ | `localStorage.removeItem`。 |
| `clearStorage` / `clearStorageSync` | ✓ | `localStorage.clear`。 |
| `getStorageInfo` / `getStorageInfoSync` | ⚠️ | 返回 `keys`，但 `limitSize` / `currentSize` 恒为 `null`。 |

> 限制：`localStorage` 仅存字符串、容量约 5MB、同步阻塞，且隐私模式 / 禁用 Cookie 时可能不可用。

## 媒体

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `previewImage` | ✓ | 内置 DOM 预览组件。 |
| `getImageInfo` | ⚠️ | 通过 `new Image()` 加载，仅返回 `width` / `height`；`path` / `orientation` / `type` 为不支持字段。 |
| `compressImage` | ✗ | `envError`。 |
| `chooseMedia` | ✗ | `envError`。Web 选图请用条件编译，改用 `<input type="file" accept="image/*">`。 |
| `chooseImage` | ✗ | api-proxy 未导出该 API（同上用原生 `input`）。 |
| `createInnerAudioContext` | ⚠️ | 基于 HTML `Audio`，支持 `play/pause/stop/seek/destroy` 及 `src/autoplay/loop/volume/duration/currentTime` 等属性；`obeyMuteSwitch`、`startTime` 等为占位。 |
| `createVideoContext` | ⚠️ | 操作页面内 `<video>`（按 `id` 查找，须存在）。`requestBackgroundPlayback` / `exitBackgroundPlayback` / `exitPictureInPicture` / `sendDanmu` 等仅打印「暂不支持」告警。 |

## 位置

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `getLocation` | ⚠️ | 基于 `navigator.geolocation.getCurrentPosition`，**需 HTTPS 且用户授权**；返回 `latitude` / `longitude` / `accuracy` / `speed`，`horizontalAccuracy` / `verticalAccuracy` 为不支持字段。 |
| `openLocation` | ✗ | `envError`。 |
| `chooseLocation` | ✗ | `envError`。 |
| `onLocationChange` / `offLocationChange` | ✗ | `envError`（如需持续定位用 `navigator.geolocation.watchPosition` 自行封装并条件编译）。 |
| `startLocationUpdate` / `stopLocationUpdate` | ✗ | `envError`。 |

## 设备

| API | 状态 | Web 实现与差异 |
| --- | --- | --- |
| `getNetworkType` | ⚠️ | 基于 `navigator.connection.effectiveType`，不支持的浏览器返回 `'unknown'`。 |
| `onNetworkStatusChange` / `offNetworkStatusChange` | ⚠️ | 监听 `navigator.connection` 的 `change`；无该 API 时退化为监听 `window` 的 `online` / `offline`。 |
| `setClipboardData` / `getClipboardData` | ✗ | Web 无实现（`envError`）。如需剪贴板请条件编译改用 `navigator.clipboard`（需 HTTPS + 授权）。 |
| `vibrateShort` / `vibrateLong` | ✗ | Web 无实现。可条件编译改用 `navigator.vibrate`（桌面端及 iOS Safari 多不支持）。 |
| **蓝牙 / NFC / 扫码 / Wi-Fi / 相机 / 屏幕亮度 等** | ✗ | 见下表，Web 一律未实现。 |

## Web 未实现 API 一览

以下能力 **Web 端无 `index.web.js` 实现，调用即 `envError`**（`web环境不支持xxx方法`）。改造时必须用条件编译隔离，或在 Web 端提供原生替代方案：

| 分类 | API |
| --- | --- |
| 文件 | `uploadFile`、`downloadFile` |
| 媒体 | `chooseMedia`、`chooseImage`、`compressImage` |
| 位置 | `openLocation`、`chooseLocation`、`onLocationChange`、`offLocationChange`、`startLocationUpdate`、`stopLocationUpdate` |
| 剪贴板 | `setClipboardData`、`getClipboardData` |
| 振动 | `vibrateShort`、`vibrateLong` |
| 蓝牙 | `createBLEConnection`、`closeBLEConnection`、`onBLEConnectionStateChange` 等全部 BLE API |
| Wi-Fi | `startWifi`、`stopWifi`、`getWifiList`、`getConnectedWifi` 等 |
| 扫码 | `scanCode` |
| 相机 | `createCameraContext` |
| 画布 | `canvasToTempFilePath`、`canvasGetImageData` |
| 设备能力 | `setScreenBrightness`、`getScreenBrightness`、`makePhoneCall`、`addPhoneContact` |
| 键盘 | `onKeyboardHeightChange`、`offKeyboardHeightChange`、`hideKeyboard` |
| 账号 / 授权 | `login`、`checkSession`、`getUserInfo`、`getSetting`、`openSetting`、`requestPayment`、`getExtConfig` / `getExtConfigSync` |

> 处理原则：**不要为兼容 Web 而删改小程序原有写法**，用条件编译（脚本 `@mpx-if`、属性后缀 `@web` 等）将 Web 替代实现与小程序原实现并存。条件编译语法见 [条件编译](./conditional-compile.md)。
