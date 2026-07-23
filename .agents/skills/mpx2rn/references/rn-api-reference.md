# 跨端输出 RN 环境 API 参考

## 目录

- [使用说明](#使用说明)
- [基础](#基础)
  - [base64ToArrayBuffer](#base64toarraybuffer)
  - [arrayBufferToBase64](#arraybuffertobase64)
  - [canIUse](#caniuse)
  - [getSystemInfo](#getsysteminfo)
  - [getSystemInfoSync](#getsysteminfosync)
  - [getWindowInfo](#getwindowinfo)
  - [getDeviceInfo](#getdeviceinfo)
  - [getEnterOptionsSync](#getenteroptionssync)
  - [getLaunchOptionsSync](#getlaunchoptionssync)
  - [onAppShow](#onappshow)
  - [onAppHide](#onapphide)
  - [offAppShow](#offappshow)
  - [offAppHide](#offapphide)
  - [onError](#onerror)
  - [offError](#offerror)
  - [onUnhandledRejection](#onunhandledrejection)
  - [offUnhandledRejection](#offunhandledrejection)
  - [onLazyLoadError](#onlazyloaderror)
  - [offLazyLoadError](#offlazyloaderror)
- [路由](#路由)
  - [navigateTo](#navigateto)
  - [redirectTo](#redirectto)
  - [reLaunch](#relaunch)
  - [navigateBack](#navigateback)
- [界面](#界面)
  - [showActionSheet](#showactionsheet)
  - [showModal](#showmodal)
  - [showToast](#showtoast)
  - [hideToast](#hidetoast)
  - [showLoading](#showloading)
  - [hideLoading](#hideloading)
  - [setNavigationBarTitle](#setnavigationbartitle)
  - [setNavigationBarColor](#setnavigationbarcolor)
  - [pageScrollTo](#pagescrollto)
  - [createAnimation](#createanimation)
  - [nextTick](#nexttick)
  - [getMenuButtonBoundingClientRect](#getmenubuttonboundingclientrect)
  - [onWindowResize](#onwindowresize)
  - [offWindowResize](#offwindowresize)
- [网络](#网络)
  - [request](#request)
  - [connectSocket](#connectsocket)
  - [sendSocketMessage](#sendsocketmessage)
  - [closeSocket](#closesocket)
  - [onSocketOpen](#onsocketopen)
  - [onSocketError](#onsocketerror)
  - [onSocketMessage](#onsocketmessage)
  - [onSocketClose](#onsocketclose)
- [数据缓存](#数据缓存)
  - [setStorage](#setstorage)
  - [getStorage](#getstorage)
  - [removeStorage](#removestorage)
  - [clearStorage](#clearstorage)
  - [getStorageInfo](#getstorageinfo)
- [媒体](#媒体)
  - [getImageInfo](#getimageinfo)
  - [createCameraContext](#createcameracontext)
- [位置](#位置)
  - [getLocation](#getlocation)
- [设备](#设备)
  - [getNetworkType](#getnetworktype)
  - [onNetworkStatusChange](#onnetworkstatuschange)
  - [offNetworkStatusChange](#offnetworkstatuschange)
  - [hideKeyboard](#hidekeyboard)
  - [onKeyboardHeightChange](#onkeyboardheightchange)
  - [offKeyboardHeightChange](#offkeyboardheightchange)
  - [makePhoneCall](#makephonecall)
  - [vibrateShort](#vibrateshort)
  - [vibrateLong](#vibratelong)
  - [低功耗蓝牙](#低功耗蓝牙)
  - [Wi-Fi](#wi-fi)
- [WXML](#wxml)
  - [createIntersectionObserver](#createintersectionobserver)
  - [createSelectorQuery](#createselectorquery)

---

## 使用说明

**@mpxjs/api-proxy** 提供跨端环境 API 抹平。输出 **React Native** 时，在应用入口执行 **`mpx.use(apiProxy, options)`**（`options` 均可省略），即可在 **`mpx`** 上使用与小程序同名的环境 API（如 `mpx.getSystemInfo` 等，以实际已接入的接口为准）。

```js
import mpx from "@mpxjs/core"
import apiProxy from "@mpxjs/api-proxy"

mpx.use(apiProxy, {
  usePromise: true,
  whiteList: [],
  blackList: [],
  custom: {
    // 键名与当前编译目标一致（RN 常见为 ios 等，以工程配置为准）
    ios: {
      myCustomApi() {
        // 合并到 mpx，仅在对应模式下可用，例如 mpx.myCustomApi()
      },
    },
  },
})
```

若无需任何配置，可简写为 **`mpx.use(apiProxy)`**。

**`options` 一览**

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `usePromise` | `boolean` | `false` | 为 `true` 时，对符合 Promise 化规则的异步 API，调用返回 `Promise`（与 `success` / `fail` 语义对应到 `resolve` / `reject`）；部分接口若仍有同步句柄需保留，会挂在 `Promise.__returned` 上。 |
| `whiteList` | `string[]` | `[]` | 仅当 `usePromise: true` 有效：列出的 API 名称**强制**参与 Promise 化，可覆盖内置排除规则。 |
| `blackList` | `string[]` | `[]` | 仅当 `usePromise: true` 有效：列出的名称与内置排除合并，对应 API **强制**保持回调风格、不返回 `Promise`。 |
| `custom` | `Object` | `{}` | 按编译目标扩展或覆盖 API；**`custom` 的键名**与当前目标一致（如 **`ios`**）。 |

**Promise 化**

只有异步 API 接口才会进行 Promise 化。**`whiteList`** 可指定 API 强制参与 Promise 化；**`blackList`** 从内置规则中排除 API，强制保持回调风格。对于 Promise 化后的 API 若同时写 `success` / `fail` 与 `.then()` / `.catch()`，两套回调都会触发，但混用更容易出现 `Unhandled Promise Rejection`，建议同一调用只选一种风格。单次调用若在**第一个参数对象**上写 **`usePromise: false`**，可临时关闭 Promise 化。

若某异步 API 在**未 Promise 化**时除 **`success` / `fail`** 外还有**同步返回值**（例如 **`request`** 的 **`RequestTask`**、**`connectSocket`** 的 **`SocketTask`**），则在 **`usePromise: true`** 时：调用表达式得到的是 **`Promise`**，**`await` / `.then()` 拿到的是与 `success` 对应的成功载荷**；原同步返回值挂在本次返回的 **`Promise`** 的 **`__returned`** 属性上（无同步句柄时 **`__returned`** 可能为 **`undefined`**）。

**异步回调通用约定**

除各接口表中列出的业务字段外，异步 API 的第一个参数还可传入以下回调：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `success` | `function` | 否 | 接口调用成功时触发；参数为本节各 API 的「成功回调参数」。 |
| `fail` | `function` | 否 | 接口调用失败时触发；参数至少包含 `errMsg`，部分设备、蓝牙与 Wi-Fi API 还会包含 `errCode` / `errno`。 |
| `complete` | `function` | 否 | 调用结束时触发，成功与失败都会执行，并收到对应的成功或失败载荷。 |

**本文档范围与 RN 支持**

本文后续章节描述 **RN** 下各接口的 **说明、入参、返回值**（及必要的回调字段）。仅为占位、无实际能力或与小程序同名但未接好的接口不在此展开。**未出现在本文档中的同名小程序 API**，在 RN 上通常视为**未接入或不可用**，请用条件编译、原生扩展或宿主能力自行补齐。

**自定义覆盖与扩展**：当某接口在 RN 上未接入、内置实现不满足业务需要、或希望补充宿主侧专属能力时，可在 `mpx.use(apiProxy, options)` 的 **`custom`** 选项中按编译目标（如 **`ios`**）注入自定义实现 —— **同名接口会覆盖内置实现**，**新名称则作为扩展接口**挂到 `mpx` 上、仅在对应目标下可用。具体写法见上文「使用说明 · `options` 一览」中的 `custom` 字段示例。

---

## 基础

**依赖（系统信息相关）**：`getSystemInfo`、`getSystemInfoSync`、`getWindowInfo`、`getDeviceInfo` 在 RN 上依赖设备信息、屏幕与安全区、当前页面导航上下文等能力；请按 **`@mpxjs/api-proxy`** 包说明安装所需的可选原生依赖，否则可能出现取值异常或运行时报错。

---

### base64ToArrayBuffer

#### 说明

将 Base64 字符串解码为 `ArrayBuffer`，用于二进制传输、文件头解析等场景。

#### 入参

第一个参数为 **`base64`**（`string`，必填）：待解码的 Base64 字符串。格式不合法时可能抛错，需自行 `try/catch`。

#### 返回值

返回 **`ArrayBuffer`**，即解码后的二进制数据。

---

### arrayBufferToBase64

#### 说明

将二进制缓冲编码为 Base64 字符串。

#### 入参

第一个参数为 **`arrayBuffer`**（`ArrayBuffer` 或 `Uint8Array` 等可逐字节遍历的类型，必填），与小程序常见写法一致。

#### 返回值

返回 **`string`**，即 Base64 编码结果。

---

### canIUse

#### 说明

同步判断某小程序 **API / 对象 / 方法** 是否在 RN 抹平层静态能力表中被标记为可用。**`schema`** 写法与小程序 `wx.canIUse` 字符串约定一致；**非 `string`**、或经实现判定为非法占位写法时返回 **`false`**。

#### 入参

第一个参数为 **`schema`**（`string`，必填）。

#### 返回值

返回 **`boolean`**。

> 注意：该接口只查询 `rnCanIUseConfig` 静态表，不会加载原生模块，也不会探测可选原生依赖是否安装或运行时权限是否授予；通过 `custom` 注入的业务 API 也不在静态表中。静态表只收录 RN 抹平层已有实际能力的内置 API、对象与方法。

---

### getSystemInfo

#### 说明

**异步 API**。获取系统与窗口相关信息。RN 侧字段集与微信宿主**不完全一致**：下列「成功回调参数」表中已列出的键为当前实现会填充或可读取的字段；未列出且与微信文档同名的扩展字段，在 RN 上通常**无有效宿主数据**，不要依赖其做权限或系统能力判断。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

#### 成功回调参数

`success` 回调的 **Object** 载荷：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`getSystemInfo:ok`**（与小程序一致的前缀形式）。 |
| `brand` | `string` | 设备品牌。 |
| `model` | `string` | 设备型号。 |
| `system` | `string` | 操作系统名称与版本。 |
| `platform` | `string` | 平台标识；模拟器等情况可能为 `emulator` 等。 |
| `deviceOrientation` | `string` | 根据屏幕宽高计算；宽大于高时为 `landscape`，否则为 `portrait`。 |
| `fontSizeSetting` | `number` | 字体缩放相关数值。 |
| `pixelRatio` | `number` | 设备像素比。 |
| `screenWidth` | `number` | 屏幕宽度（逻辑像素）。 |
| `screenHeight` | `number` | 屏幕高度（逻辑像素）。 |
| `windowWidth` | `number` | 可使用窗口宽度。 |
| `windowHeight` | `number` | 可使用窗口高度。 |
| `screenTop` | `number` | 与窗口相对屏幕位置的纵向偏移类数值。 |
| `statusBarHeight` | `number` | 状态栏高度。 |
| `safeArea` | `Object` | 安全区：`left`、`right`、`top`、`bottom`、`width`、`height`（逻辑像素）。 |

#### 失败回调参数

`fail` 回调的 **Object** 载荷：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 错误说明，前缀一般为 `getSystemInfo:fail`，后缀为具体原因。 |

---

### getSystemInfoSync

#### 说明

同步获取系统与窗口相关信息，字段含义与 **getSystemInfo 成功回调参数** 中列出的一致（不含异步接口里用于回调协议的那类附加字段时，以实际返回对象为准；一般仍含与小程序对齐的键）。

#### 入参

无。

#### 返回值

返回 **`Object`**：键与 **getSystemInfo → 成功回调参数** 表所列一致（设备、窗口、安全区等）。同步接口通常**不含**异步 `success` 里用于协议标记的 `errMsg`。

---

### getWindowInfo

#### 说明

同步获取窗口、屏幕与安全区信息，常用于布局与刘海区域避让。

#### 入参

无。

#### 返回值

返回 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `pixelRatio` | `number` | 设备像素比。 |
| `windowWidth` | `number` | 可使用窗口宽度。 |
| `windowHeight` | `number` | 可使用窗口高度。 |
| `screenWidth` | `number` | 屏幕宽度。 |
| `screenHeight` | `number` | 屏幕高度。 |
| `screenTop` | `number` | 窗口相对屏幕顶部的偏移类数值。 |
| `statusBarHeight` | `number` | 状态栏高度。 |
| `safeArea` | `Object` | 安全区矩形：`left`、`right`、`top`、`bottom`、`width`、`height`。 |


---

### getDeviceInfo

#### 说明

同步获取设备硬件与系统概要信息。

#### 入参

无。

#### 返回值

返回 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `brand` | `string` | 设备品牌。 |
| `model` | `string` | 设备型号。 |
| `system` | `string` | 操作系统名称与版本。 |
| `platform` | `string` | 平台标识。 |
| `memorySize` | `number` | 设备内存量级（单位以实现为准，常见为 MB）。 |
| `deviceAbi` | `string` \| `null` \| `undefined` | 非 iOS 目标上的主 64 位 ABI；无数据为 `null`，iOS 当前不返回该字段。 |
| `benchmarkLevel` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |
| `abi` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |
| `cpuType` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |


---

### getEnterOptionsSync

#### 说明

同步获取**最近一次进入应用或回到前台**时的启动参数（与冷启动参数可能不同）。对象由运行时注入，字段随启动场景变化。

#### 入参

无。

#### 返回值

返回 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `path` | `string` | 打开的页面路径或路由名。 |
| `scene` | `number` | 场景值。 |
| `query` | `Object` | 查询参数键值对。 |
| `shareTicket` | `string` | 分享票据。 |
| `referrerInfo` | `Object` | 来源信息。 |
| `apiCategory` | `string` | API 类目等。 |
| `chatType` | `number` | 聊天场景枚举。 |
| （其余） | — | 运行时追加字段。 |


---

### getLaunchOptionsSync

#### 说明

同步获取**应用冷启动**时的参数。对象由运行时注入。

#### 入参

无。

#### 返回值

返回 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `path` | `string` | 启动进入的页面路径或路由名。 |
| `scene` | `number` | 场景值。 |
| `query` | `Object` | 查询参数键值对。 |
| `shareTicket` | `string` | 分享票据。 |
| `referrerInfo` | `Object` | 来源信息。 |
| `apiCategory` | `string` | API 类目等。 |
| `chatType` | `number` | 聊天场景枚举。 |
| （其余） | — | 运行时追加字段。 |


---

### onAppShow

#### 说明

监听应用进入**前台**（展示态；监听 API，非 `success` / `fail` 模型）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 进入前台时调用，载荷见下表。 |

#### 返回值

无。

#### 监听回调参数

`callback` 被调用时收到 **Object**（与小程序「应用显示」事件对齐为主）。

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `path` | `string` | 当前路径或路由名。 |
| `query` | `Object` | 当前路由查询参数。 |
| `scene` | `number` | 场景值。 |
| `shareTicket` | `string` | 分享相关。 |
| `referrerInfo` | `Object` | 来源信息。 |
| （其余） | — | 运行时按需附带。 |


---

### onAppHide

#### 说明

监听应用进入**后台**（隐藏态；监听 API）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 进入后台时调用，载荷见下表。 |

#### 返回值

无。

#### 监听回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `reason` | `number` | 隐藏原因枚举值，以运行时为准。 |

---

### offAppShow

#### 说明

取消 `onAppShow` 监听；**不传回调则清空该事件下全部监听**。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 须与注册时同一引用；省略则移除全部监听。 |

#### 返回值

无。

---

### offAppHide

#### 说明

取消 `onAppHide` 监听；**不传回调则清空全部**。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 同一引用；省略则移除全部。 |

#### 返回值

无。

---

### onError

#### 说明

监听全局 JavaScript 错误（监听 API）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 错误触发时调用；实参常见为 `string` / `Error` / 封装对象。 |

#### 返回值

无。

---

### offError

#### 说明

取消 `onError` 监听；**不传回调则清空全部**。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 同一引用；省略则移除全部。 |

#### 返回值

无。

---

### onUnhandledRejection

#### 说明

监听未处理的 Promise 拒绝（监听 API）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 拒绝时调用，载荷见下表。 |

#### 监听回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `reason` | `any` | 拒绝原因。 |
| `promise` | `Promise` | 相关 Promise，以实现为准。 |

#### 返回值

无。

---

### offUnhandledRejection

#### 说明

取消 `onUnhandledRejection` 监听；**不传回调则清空全部**。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 同一引用；省略则移除全部。 |

#### 返回值

无。

---

### onLazyLoadError

#### 说明

监听分包或懒加载资源加载失败（监听 API；RN 由运行时决定是否触发）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 失败时调用，载荷以运行时为准。 |

#### 返回值

无。

---

### offLazyLoadError

#### 说明

取消 `onLazyLoadError` 监听；**不传回调则清空全部**。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 同一引用；省略则移除全部。 |

#### 返回值

无。

---

## 路由

### navigateTo

#### 说明

**异步 API**。保留当前页并打开新页面（入栈）。RN 下由路由模块对接导航栈。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 打开的页面路径。 |
| `events` | `Object` | 否 | 页面间通信通道等，与小程序一致；以实现为准。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`navigateTo:ok`**。 |
| `eventChannel` | `EventChannel` | 与被打开页面通信的事件通道；即使未传 `events`，当前 RN 实现也会创建并返回该对象。 |

### redirectTo

#### 说明

**异步 API**。关闭当前页并打开指定页（替换栈顶）。RN 下由路由模块实现。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 打开的页面路径。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`redirectTo:ok`**。 |

### reLaunch

#### 说明

**异步 API**。关闭所有页面后打开指定页。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 打开的页面路径。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`reLaunch:ok`**；失败时以 **`reLaunch:fail`** 开头。 |

### navigateBack

#### 说明

**异步 API**。关闭当前页面，返回栈内上一层或多层。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `delta` | `number` | 否 | 回退步数，默认 `1`。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`navigateBack:ok`**。 |

> `switchTab` 当前未在 RN 实现。调用时会通过 `envError` 报告环境不支持，`canIUse('switchTab')` 返回 **`false`**。

---

## 界面

本节顺序：交互 → 导航栏 → 滚动 → 动画 → 自定义组件 → 菜单 → 窗口。以下各 **异步 API** 入参均为 **Object**；表内仅列业务字段，不含 `success` / `fail` / `complete`。

### showActionSheet

#### 说明

**异步 API**。底部操作菜单，RN 侧由弹层实现。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `itemList` | `string[]` | 是 | 按钮标题列表。 |
| `itemColor` | `string` | 否 | 按钮文字颜色。 |
| `alertText` | `string` | 否 | 顶部警示文案。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`showActionSheet:ok`**。 |
| `tapIndex` | `number` | 用户点击的按钮序号，从上到下、从 `0` 开始。点击取消按钮或蒙层时走 `fail`，不会进入 `success`。 |

### showModal

#### 说明

**异步 API**。模态对话框，RN 侧由弹层实现。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 否 | 标题。 |
| `content` | `string` | 否 | 内容。 |
| `showCancel` | `boolean` | 否 | 是否显示取消按钮。 |
| `cancelText` | `string` | 否 | 取消按钮文案。 |
| `cancelColor` | `string` | 否 | 取消按钮文字颜色，默认 `#000000`。 |
| `confirmText` | `string` | 否 | 确认按钮文案。 |
| `confirmColor` | `string` | 否 | 确认按钮文字颜色，默认 `#576B95`。 |
| `editable` | `boolean` | 否 | 是否显示输入框，默认 `false`。 |
| `placeholderText` | `string` | 否 | `editable: true` 时的输入框占位文案。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`showModal:ok`**。 |
| `confirm` | `boolean` | 用户是否点击确认按钮。 |
| `cancel` | `boolean` | 用户是否点击取消按钮。 |
| `content` | `string` \| `null` | 点击确认且 `editable: true` 时为输入内容；点击确认但不可编辑时为 `null`；点击取消时不返回该字段。 |

### showToast

#### 说明

**异步 API**。轻提示。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 提示文字；缺失或类型错误时 RN 实现会进入 `fail`。 |
| `icon` | `string` | 否 | `success` / `error` / `loading` / `none` 等。 |
| `image` | `string` | 否 | 自定义图标 URI；存在时优先于 `icon`。 |
| `duration` | `number` | 否 | 显示时长 ms。 |
| `mask` | `boolean` | 否 | 是否显示透明蒙层。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`showToast:ok`**。 |

### hideToast

#### 说明

**异步 API**。隐藏当前 Toast。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `noConflict` | `boolean` | 否 | Loading 正在显示时是否保留 Loading。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`hideToast:ok`**。 |

`noConflict: true` 且当前显示的是 Loading 时，函数会直接返回，**不会触发 `success` / `fail` / `complete`**。

### showLoading

#### 说明

**异步 API**。全屏或遮罩加载提示。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 提示文字；复用 `showToast` 的参数校验，缺失或类型错误时 RN 实现会进入 `fail`。 |
| `mask` | `boolean` | 否 | 是否显示透明蒙层。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`showLoading:ok`**。 |

### hideLoading

#### 说明

**异步 API**。隐藏 Loading。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `noConflict` | `boolean` | 否 | Toast 正在显示时是否保留 Toast。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`hideLoading:ok`**。 |

`noConflict: true` 且当前没有 Loading 时，函数会直接返回，**不会触发 `success` / `fail` / `complete`**。

### setNavigationBarTitle

#### 说明

**异步 API**。设置当前页导航栏标题。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 标题文字。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`setNavigationBarTitle:ok`**。 |

### setNavigationBarColor

#### 说明

**异步 API**。设置导航栏前景色、背景色等。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `frontColor` | `string` | 是 | 前景色值；RN 与微信一致，仅接受 `#ffffff` / `#000000`。 |
| `backgroundColor` | `string` | 是 | 背景色值；RN 接受 `#RGB` / `#RRGGBB` 格式的十六进制颜色。 |

#### 返回值

无同步返回值。

颜色参数无效时，RN 会触发 `fail` 与 `complete`，且不会修改导航栏配置；失败载荷为 `{ errMsg: 'setNavigationBarColor:fail invalid color' }`。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`setNavigationBarColor:ok`**。 |

### pageScrollTo

#### 说明

**异步 API**。将页面滚动到指定位置。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `scrollTop` | `number` | 否 | 纵向滚动位置 px。 |
| `selector` | `string` | 否 | 选择器，滚动到节点。 |
| `duration` | `number` | 否 | 滚动动画时长 ms，默认 `300`。 |
| `offsetTop` | `number` | 否 | 与 `selector` 配合使用的纵向偏移量 px，默认 `0`。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`pageScrollTo:ok`**。 |

### createAnimation

#### 说明

**同步风格工厂**：创建动画描述对象，用于节点 `animation` 绑定（非 `success`/`fail` 异步模型，入参仍为配置 **Object**）。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `duration` | `number` | 否 | 默认动画时长 ms。 |
| `timingFunction` | `string` | 否 | 如 `linear`、`ease`。 |
| `delay` | `number` | 否 | 延迟 ms。 |
| `transformOrigin` | `string` | 否 | 变换原点。 |

#### 返回值

返回 **`Animation`** 实例；链式方法与 `export()` 与小程序对齐，全集以实现为准。

#### Animation 方法支持

| 分类 | RN 支持方法 | 说明 |
| --- | --- | --- |
| 普通属性 | `opacity`、`backgroundColor`、`width`、`height`、`top`、`right`、`bottom`、`left` | 返回当前实例，可继续链式调用。 |
| 旋转 | `rotate`、`rotateX`、`rotateY`、`rotateZ` | 角度会转换为 `deg`。 |
| 缩放 | `scale`、`scaleX`、`scaleY` | `scale(x)` 会同时设置 X/Y。 |
| 位移 | `translate`、`translateX`、`translateY` | 数值通过 RN 样式单位转换逻辑处理。 |
| 倾斜 | `skew`、`skewX`、`skewY` | 角度会转换为 `deg`。 |
| 步骤与导出 | `step(options)`、`export()` | `export()` 返回 `{ id, actions }`，并清空已导出的步骤。 |

`matrix`、`matrix3d`、`rotate3d`、`scaleZ`、`scale3d`、`translateZ`、`translate3d` 当前仅报不支持错误并返回链式实例，不会生成对应动画数据；对应的 `canIUse('Animation.<method>')` 均返回 **`false`**。

### nextTick

#### 说明

同步调度：在下一微任务执行回调（非异步 `success`/`fail` 模型）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `fn` | `function` | 是 | 要执行的函数。 |

#### 返回值

无。

### getMenuButtonBoundingClientRect

#### 说明

同步获取模拟的「胶囊按钮」布局信息。RN 不存在微信右上角真实胶囊；当前实现固定宽 `87px`、高 `32px`、距右 `7px`，顶部为状态栏高度加 `4px`，仅用于兼容顶部导航布局计算。

#### 入参

无。

#### 返回值

返回 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `width` | `number` | 宽度 px。 |
| `height` | `number` | 高度 px。 |
| `top` | `number` | 上边界 px。 |
| `right` | `number` | 右边界 px。 |
| `bottom` | `number` | 下边界 px。 |
| `left` | `number` | 左边界 px。 |

### onWindowResize

#### 说明

监听窗口尺寸变化（监听 API，非 `success`/`fail` 模型）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 尺寸变化时触发。 |

#### 监听回调参数

`callback` 收到 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `size` | `Object` | 含 `windowWidth`、`windowHeight` 等，以实现为准。 |

#### 返回值

无。

### offWindowResize

#### 说明

取消窗口尺寸监听；不传 `callback` 则清空全部。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 与注册时同一引用；省略则移除全部监听。 |

#### 返回值

无。


---

## 网络

**`request`**、**`socket`** 在 RN 上与 **Web** 侧行为一致。**`downloadFile`**、**`uploadFile`** 未在本文展开；若宿主或扩展注入了对应能力，可按小程序同名用法自行接入。

### request

#### 说明

**异步 API**。发起 **HTTPS** 请求；与小程序 **`wx.request`** 语义对齐为主。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 请求地址。 |
| `method` | `string` | 否 | HTTP 方法。 |
| `data` | `any` | 否 | 请求体。 |
| `header` | `Object` | 否 | 请求头。 |
| `dataType` | `string` | 否 | 期望的数据格式，默认 `json`；响应为字符串时会尝试 `JSON.parse`。 |
| `responseType` | `string` | 否 | Axios 响应类型，默认 `text`；常用值为 `text` / `arraybuffer`。 |
| `timeout` | `number` | 否 | 超时 ms。 |

#### 返回值

同步返回 **`RequestTask`**（如取消请求等），与小程序一致。**未开启 Promise 化**时，即为 **`mpx.request(...)` 的返回值**。**开启 `usePromise: true`** 时，表达式为 **`Promise`**，**`RequestTask`** 在该 **`Promise`** 的 **`__returned`** 上；**`await` / `.then()` 的 resolve 值**仍为 **`success`** 的成功载荷（含 **`data`**、**`statusCode`** 等），与句柄分离。

> 当前 RN `RequestTask` **仅实现 `abort()`**，用于取消请求。微信 `RequestTask` 的 `onHeadersReceived` / `offHeadersReceived`、分块响应、上传/下载进度等方法当前未实现，`canIUse('RequestTask.onHeadersReceived')` 与 `canIUse('RequestTask.offHeadersReceived')` 均返回 **`false`**。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`request:ok`**。 |
| `data` | `any` | 开发者服务器返回的数据；`dataType: 'json'` 且原值为字符串时会尝试解析 JSON，解析失败则保留原字符串。 |
| `statusCode` | `number` | HTTP 状态码。 |
| `header` | `Object` | HTTP 响应头。 |
| `cookies` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |
| `profile` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |
| `exception` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |

成功载荷还会保留 Axios 响应对象上的其它字段，但它们不属于稳定的小程序兼容协议，不建议业务依赖。

当前实现使用 Axios 默认状态校验：HTTP `4xx` / `5xx` 通常进入 `fail`，与微信 `wx.request` 只要收到服务器响应通常就进入 `success` 的行为不同。

---
### connectSocket

#### 说明

**异步 API**。建立 **WebSocket** 连接，返回 **`SocketTask`** 与小程序一致。运行环境须具备 **WebSocket** 能力；若当前环境无法发起连接，可能不会触发 **`success` / `fail` / `complete`**，且无有效同步返回值，请在业务侧做好兜底。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | `wss://` 或 `ws://` 地址。 |
| `protocols` | `string[]` | 否 | 子协议列表。 |

> 微信同名 API 的 `header`、`timeout`、`tcpNoDelay`、`perMessageDeflate` 等扩展参数**当前 RN 中暂不支持**。

#### 返回值

成功创建连接任务时，同步返回 **`SocketTask`** 实例。**未开启 Promise 化**时即为调用返回值。**开启 `usePromise: true`** 时，**`SocketTask`** 在本次返回的 **`Promise.__returned`** 上；**`Promise` resolve** 值对应 **`success`** 载荷（如 **`errMsg: 'connectSocket:ok'`**）。失败时通常无有效 **`SocketTask`**，错误经 **`fail` / `complete`** 或 **`reject`** 交付。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`connectSocket:ok`**；表示 `SocketTask` 已创建，不等同于已触发 `SocketTask.onOpen`。 |

#### SocketTask 方法与回调

| 方法 | 说明 | 成功或监听载荷 |
| --- | --- | --- |
| `send(options)` | 发送 `string` 或 `ArrayBuffer`。 | `success`：`{ errMsg: 'sendSocketMessage:ok' }`。 |
| `close(options)` | 关闭连接，支持 `code`、`reason`。 | `success`：`{ errMsg: 'closeSocket:ok' }`。 |
| `onOpen(callback)` | 监听连接打开。 | 透传底层 WebSocket `open` 事件对象。 |
| `onMessage(callback)` | 监听消息。 | `{ data }`。 |
| `onError(callback)` | 监听错误。 | 透传底层 WebSocket `error` 事件对象。 |
| `onClose(callback)` | 监听关闭。 | `{ code, reason }` 或底层 WebSocket `close` 事件对象。 |

---
### sendSocketMessage

#### 说明

兼容占位：调用时仅提示应使用 **`connectSocket`** 返回对象上的 **`send`**。不建议新业务依赖此全局函数。

#### 入参

无固定约定。

#### 返回值

无。

---
### closeSocket

#### 说明

兼容占位：提示应使用 **`connectSocket`** 返回对象上的 **`close`**。

#### 入参

无固定约定。

#### 返回值

无。

---
### onSocketOpen

#### 说明

兼容占位：提示应使用 **`connectSocket`** 返回对象上的 **`onOpen`**。

#### 入参

无固定约定。

#### 返回值

无。

---
### onSocketError

#### 说明

兼容占位：提示应使用 **`connectSocket`** 返回对象上的 **`onError`**。

#### 入参

无固定约定。

#### 返回值

无。

---
### onSocketMessage

#### 说明

兼容占位：提示应使用 **`connectSocket`** 返回对象上的 **`onMessage`**。

#### 入参

无固定约定。

#### 返回值

无。

---
### onSocketClose

#### 说明

兼容占位：提示应使用 **`connectSocket`** 返回对象上的 **`onClose`**。

#### 入参

无固定约定。

#### 返回值

无。

---

## 数据缓存

以下异步接口与小程序键值语义一致；RN 侧常用本地持久化能力承载。**`setStorageSync`**、**`getStorageSync`**、**`getStorageInfoSync`**、**`removeStorageSync`**、**`clearStorageSync`** 在 RN 上不可用，调用时会输出环境不支持错误，请使用对应异步接口。

### setStorage

#### 说明

**异步 API**。写入本地缓存。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 键。 |
| `data` | `any` | 是 | 可序列化数据。 |

#### 返回值

无同步返回值。

#### 成功回调参数

`success` 回调的 **Object** 载荷：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`setStorage:ok`**。 |

---
### getStorage

#### 说明

**异步 API**。读取本地缓存。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 键。 |

#### 返回值

无同步返回值。

#### 成功回调参数

`success` 回调的 **Object** 载荷：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`getStorage:ok`**。 |
| `data` | `any` | 写入 **`setStorage`** 时保存的 **`data`**；若存储结构异常可能为 **`null`**。 |

---
### removeStorage

#### 说明

**异步 API**。删除一项。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 键。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`removeStorage:ok`**。 |

---
### clearStorage

#### 说明

**异步 API**。异步清空缓存。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`clearStorage:ok`**。 |

---
### getStorageInfo

#### 说明

**异步 API**。异步获取缓存占用与键列表。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

#### 成功回调参数

`success` 回调的 **Object** 载荷：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`getStorageInfo:ok`**。 |
| `keys` | `string[]` | 当前已存键名列表。 |
| `currentSize` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |
| `limitSize` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |

---
## 媒体

仅收录 RN 上可用的 **图片信息**、**相机上下文** 等相关接口；音频、预览、压缩、相册/相机选取等本文不列出。

### getImageInfo

#### 说明

**异步 API**。获取远程或本地图片的宽高与路径信息。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | 是 | 图片路径或 URL。 |

#### 返回值

无同步返回值。

#### 成功回调参数

`success` 回调的 **Object** 载荷：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`getImageInfo:ok`**。 |
| `width` | `number` | 图片宽度 px。 |
| `height` | `number` | 图片高度 px。 |
| `path` | `string` | 与入参 **`src`** 一致。 |
| `orientation` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |
| `type` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |

---
### createCameraContext

#### 说明

工厂方法：创建 **`CameraContext`**（非 `success`/`fail` 工厂入参模型）。需当前页面提供可用的相机能力；未就绪时 **`setZoom`** 等会 **`fail`**，**`takePhoto`** / **`startRecord`** / **`stopRecord`** 可能无效果。

#### 入参

无。

#### 返回值

返回 **`CameraContext`** 实例。

#### CameraContext 方法

| 方法 | 说明 | 成功回调参数 |
| --- | --- | --- |
| `setZoom(options)` | 设置缩放级别，读取 `options.zoom`。 | `{ errMsg: 'setZoom:ok' }`。找不到当前页相机实例时走 `fail`。 |
| `takePhoto(options)` | 委托给当前页相机实例的同名方法。 | 载荷由实际相机组件实现决定。 |
| `startRecord(options)` | 委托给当前页相机实例开始录像。 | 载荷由实际相机组件实现决定。 |
| `stopRecord(options)` | 委托给当前页相机实例停止录像。 | 载荷由实际相机组件实现决定。 |

---
## 位置

### getLocation

#### 说明

**异步 API**。获取当前地理位置（单次读取）。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `isHighAccuracy` | `boolean` | 否 | 是否启用高精度定位。 |
| `altitude` | `boolean` | 否 | 是否返回高度信息；当前 RN 实现不会读取。 |
| `type` | `string` | 否 | 坐标类型，支持 `wgs84` / `gcj02`；当前 RN 实现不会读取。 |
| `highAccuracyExpireTime` | `number` | 否 | 高精度定位超时时间，单位 ms；当前 RN 实现不会读取。 |

> 由于 `type` 未被读取，RN 实现不会按微信参数约定执行 `wgs84` / `gcj02` 坐标类型转换。

#### 返回值

无同步返回值。

#### 成功回调参数

当前实现会透传 `react-native-get-location` 的位置对象并追加 `errMsg`，因此除微信同名字段外还可能包含底层平台字段：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`getLocation:ok`**。 |
| `latitude` | `number` | 纬度。 |
| `longitude` | `number` | 经度。 |
| `accuracy` | `number` | 水平精度，单位 m。 |
| `altitude` | `number` \| `null` | 海拔，单位 m；不可用时以底层返回为准。 |
| `speed` | `number` \| `null` | 速度，单位 m/s；不可用时以底层返回为准。 |
| `verticalAccuracy` | `number` \| `null` | iOS 可能提供的垂直精度；Android 通常无该字段。 |
| `horizontalAccuracy` | `null` | RN 抹平层明确不支持该微信字段；访问会给出警告并返回 `null`。 |
| `time` | `number` | 定位时间戳，单位 ms；由底层定位库透传。 |
| `bearing` / `provider` | 平台相关 | Android 底层可能提供。 |
| `course` | `number` | iOS 底层可能提供的航向。 |

---
## 设备

### getNetworkType

#### 说明

**异步 API**。获取网络类型。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

#### 成功回调参数

`success` 回调的 **Object** 载荷：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`getNetworkType:ok`**。 |
| `networkType` | `string` | `wifi`、`none`、`2g`、`3g`、`4g`、`5g` 或 `unknown`。 |
| `signalStrength` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |
| `hasSystemProxy` | `null` | RN 当前实现不支持；访问会给出警告并返回 `null`。 |

---
### onNetworkStatusChange

#### 说明

监听网络状态（监听 API）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 网络变化时调用。 |

#### 监听回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `isConnected` | `boolean` | 是否联网。 |
| `networkType` | `string` | `wifi` / `2g` / `4g` 等。 |

#### 返回值

无。

---
### offNetworkStatusChange

#### 说明

取消网络状态监听。**不传 `callback`** 时清空全部监听并取消网络状态订阅。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 同一引用；省略则清空全部监听并取消订阅。 |

#### 返回值

无。

---
### hideKeyboard

#### 说明

**异步 API**。收起键盘。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`hideKeyboard:ok`**。 |

---
### onKeyboardHeightChange

#### 说明

监听键盘高度（监听 API）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 高度变化时调用。 |

#### 监听回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `height` | `number` | 键盘高度；键盘弹出时为可见高度，收起时 iOS 上多为 **`0`**，Android 上可能仍带高度值。 |

#### 返回值

无。

---
### offKeyboardHeightChange

#### 说明

取消键盘高度监听：仅移除与注册时**同一引用**的 **`callback`**；**不传引用不会移除其它监听**。当监听列表为空时会移除键盘显示/隐藏相关订阅。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 与 **`onKeyboardHeightChange`** 注册时为同一函数引用。 |

#### 返回值

无。

---
### makePhoneCall

#### 说明

**异步 API**。调起拨号。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `phoneNumber` | `string` | 是 | 电话号码。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`makePhoneCall:ok`**；表示系统已接受 `tel:` URL 的打开请求，不表示通话已接通。 |

---
### vibrateShort

#### 说明

**异步 API**。短触感反馈；**`type`** 档位与小程序一致，由系统触感能力承载。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | `string` | 否 | 触感档位，默认 **`light`**，首字母大写后拼到 `impact` 前缀上参与触发。 |

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`vibrateShort:ok`**。 |

---
### vibrateLong

#### 说明

**异步 API**。长震动。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | 成功时为 **`vibrateLong:ok`**。当前实现触发固定约 `400ms` 震动后同步调用 `success`。 |

当前 `vibrateLong` 不读取 `fail`，也没有异常捕获分支。

---

### 低功耗蓝牙

与小程序 **低功耗蓝牙（中心设备）** 能力对齐；使用蓝牙需系统授权，并请按 **`@mpxjs/api-proxy`** 包说明安装所需可选依赖。

表中异步 API 的普通成功载荷均包含 `errMsg: '<API>:ok'`；下表仅列出额外成功字段，监听 API 则列出完整监听载荷。

| API | 说明 | 额外成功字段或监听载荷 |
| --- | --- | --- |
| `openBluetoothAdapter` | 打开蓝牙适配器。 | `{ errno: 0 }`。 |
| `closeBluetoothAdapter` | 关闭适配器并清理扫描、连接与监听状态。 | 无额外字段。 |
| `startBluetoothDevicesDiscovery` | 开始搜寻周边蓝牙设备；支持 `services`、`allowDuplicatesKey`。 | `{ isDiscovering: true }`。 |
| `stopBluetoothDevicesDiscovery` | 停止搜寻。 | 无额外字段。 |
| `onBluetoothDeviceFound` | 发现设备监听；当前只保留最后一次注册的回调。 | `{ devices }`；设备含 `deviceId`、`name`、`RSSI`、`advertisData`、`advertisServiceUUIDs`、`localName`、`serviceData`、`connectable`。 |
| `offBluetoothDeviceFound` | 取消发现设备监听。 | 无参数；清除当前唯一回调。 |
| `getConnectedBluetoothDevices` | 按 `services` 获取底层已连接设备。 | `{ devices }`；设备仅含 `deviceId`、`name`。 |
| `getBluetoothAdapterState` | 获取适配器状态。 | `{ discovering, available }`。 |
| `onBluetoothAdapterStateChange` | 适配器状态变化监听。 | `{ discovering, available }`。 |
| `offBluetoothAdapterStateChange` | 取消适配器状态监听。 | 可传同一 `callback` 移除单个；省略则移除全部。 |
| `getBluetoothDevices` | 获取本应用本次扫描发现的设备，不是系统全部设备。 | `{ devices }`；设备结构同 `onBluetoothDeviceFound`。 |
| `createBLEConnection` | 建立与 `deviceId` 指定设备的 BLE 连接；支持 `timeout`。 | 无额外字段。 |
| `closeBLEConnection` | 断开 BLE 连接。 | 无额外字段。 |
| `onBLEConnectionStateChange` | 连接状态变化监听。 | `{ deviceId, connected }`。 |
| `offBLEConnectionStateChange` | 取消连接状态监听。 | 可传同一 `callback` 移除单个；省略则移除全部。 |
| `writeBLECharacteristicValue` | 写入 `ArrayBuffer`；支持 `writeType: 'write' \| 'writeNoResponse'`。 | 无额外字段。 |
| `readBLECharacteristicValue` | 读取特征值。 | `{ value: ArrayBuffer }`。 |
| `notifyBLECharacteristicValueChange` | 通过 `state` 开启或停止特征值通知。 | 无额外字段。 |
| `onBLECharacteristicValueChange` | 特征值变化监听；当前只保留最后一次注册的回调。 | `{ deviceId, serviceId, characteristicId, value: ArrayBuffer }`。 |
| `offBLECharacteristicValueChange` | 取消特征值变化监听。 | 无参数；清除当前唯一回调与底层订阅。 |
| `setBLEMTU` | 协商 MTU。 | `{ mtu }`，其中 `mtu` 为底层实际协商结果。 |
| `getBLEDeviceRSSI` | 读取设备信号强度。 | `{ RSSI }`。 |
| `getBLEDeviceServices` | 获取设备服务 UUID 列表，并缓存后续特征查询所需信息。 | `{ services: Array<{ uuid }> }`。 |
| `getBLEDeviceCharacteristics` | 查询特征值；应先调用 `getBLEDeviceServices`。当前实现会校验 `serviceId` 存在，但成功时返回缓存中的**全部特征值**，未按该服务过滤。 | `{ characteristics }`；每项含 `uuid` 与 `properties.read/write/notify/indicate/writeNoResponse`。 |

`deviceId`、`serviceId`、`characteristicId`、`value`、`mtu` 等必填参数缺失时，接口会进入 `fail` 回调并以对应 API 的 `:fail parameter error` 作为 `errMsg`；`complete` 随后收到同一结果。

#### 通过 mpx.config 扩展（权限）

调用 **`openBluetoothAdapter`** 时，在初始化底层蓝牙模块之前会先执行「是否具备运行所需权限」的检查。未配置时由 **`@mpxjs/api-proxy`** 内置逻辑处理（**Android** 上按系统版本申请定位或蓝牙扫描/连接等权限；**iOS** 上默认视为前置条件已满足，实际仍依赖工程 **`Info.plist`** 与系统行为）。若需要与宿主 App 统一的权限申请、文案与多语言、或厂商定制流程，可在 **`mpx.config.rnConfig`** 上提供 **`bluetoothPermission`**，**完全替代**内置检查函数。

| 配置项 | 类型 | 生效时机 | 说明 |
| --- | --- | --- | --- |
| `bluetoothPermission` | `() => Promise<boolean>` | 每次 **`openBluetoothAdapter`**，在蓝牙模块启动之前 | **`Promise`** 解析为 **`true`** 时继续；为 **`false`** 或 **`reject`** 时走失败回调（如 **`openBluetoothAdapter:fail no permission`**）。 |

```js
import mpx from "@mpxjs/core"

// 在应用入口、调用任何 BLE API 之前完成赋值
mpx.config.rnConfig.bluetoothPermission = () => {
  // 示例：改为走宿主原生模块或统一封装
  return nativeBridge.requestBlePermission().then((granted) => Boolean(granted))
}
```

类型与更多 **`rnConfig`** 字段见 **`@mpxjs/core`** 中的 **`RnConfig`** 声明。

---

### Wi-Fi

与小程序 **Wi‑Fi** 能力对齐；涉及系统 Wi‑Fi 与定位类权限，请按 **`@mpxjs/api-proxy`** 包说明处理依赖与权限。

| API | 说明 | 成功回调或监听载荷（RN 实际实现） |
| --- | --- | --- |
| `startWifi` | 校验 Wi‑Fi 与权限并进入就绪态；RN iOS 目标直接走 `fail`。 | RN Android 成功时为 `{ errMsg: 'startWifi:ok' }`。 |
| `stopWifi` | 结束 Wi‑Fi 模块并清空列表监听；RN iOS 目标直接走 `fail`。 | RN Android 成功时为 `{ errMsg: 'stopWifi:ok' }`。 |
| `getWifiList` | `startWifi` 就绪后扫描热点，通过 `onGetWifiList` 交付列表；RN iOS 目标直接走 `fail`。 | `success`：`{ errMsg: 'getWifiList:ok', errno: 0, errCode: 0 }`；热点列表不在此载荷中。 |
| `onGetWifiList` | 注册接收热点列表的回调。 | `{ wifiList }`；每项含 `SSID`、`BSSID`、`frequency`、`signalStrength`。 |
| `offGetWifiList` | 移除热点列表回调。 | 传入与注册时同一 `callback`；当前实现不支持省略参数清空全部。 |
| `getConnectedWifi` | 读取当前已连接 Wi‑Fi；支持 `partialInfo`，且需先 `startWifi` 成功就绪。 | `{ errMsg: 'getConnectedWifi:ok', wifi }`；`wifi` 含 `SSID`、`BSSID`、`signalStrength`、`frequency`。 |

Wi-Fi API 的成功 `errMsg` 与微信文档保持一致，均以 `:ok` 结尾。

#### 通过 mpx.config.rnConfig 扩展（权限）

调用 **`startWifi`** 时，在检查 Wi‑Fi 是否已打开之前会先执行「扫描热点所需权限」的检查。当前实现下，**RN 输出为 iOS** 时，**`startWifi` / `stopWifi` / `getWifiList`** 会直接 **`fail`**（系统级扫网等能力受限），**不涉及**下述配置。**RN 输出为 Android** 且使用内置 **`react-native-wifi-reborn`** 路径时，未配置 **`wifiPermission`** 则使用内置的 **`ACCESS_FINE_LOCATION`** 等申请逻辑；若需自定义（统一权限组件、补充说明文案等），可在 **`mpx.config.rnConfig`** 上提供 **`wifiPermission`**，**完全替代**内置函数。

> 当前代码只等待权限函数返回的 Promise，**不会检查 resolve 值**：resolve 为 `false` 仍会继续检查 Wi-Fi 开关并尝试后续流程，只有 Promise `reject` 才会直接进入 `startWifi` 的失败回调。自定义函数应在拒绝授权时 `reject`，不要仅 `resolve(false)`。

| 配置项 | 类型 | 生效时机 | 说明 |
| --- | --- | --- | --- |
| `wifiPermission` | `() => Promise<boolean>` | 每次 **`startWifi`**，在校验 Wi‑Fi 开关之前 | Promise resolve 后继续（当前实现不区分 `true` / `false`）；Promise reject 时 `startWifi` 走 `fail`。 |

```js
import mpx from "@mpxjs/core"

mpx.config.rnConfig.wifiPermission = () => {
  // 示例：先展示说明再申请定位权限，或对接宿主统一权限 API
  return showWifiScanRationale().then(() => requestAndroidFineLocation())
}
```

类型与更多 **`rnConfig`** 字段见 **`@mpxjs/core`** 中的 **`RnConfig`** 声明。

---

## WXML

### createIntersectionObserver

#### 说明

工厂方法：创建 **`IntersectionObserver`**（与小程序链式用法一致；非 `success` / `fail` 入参模型）。输出 RN 时，底层工厂方法要求第三个参数传入最近的滚动容器上下文。业务一般应使用组件或页面实例的 **`this.createIntersectionObserver(options)`**，框架会自动填充组件实例与第三个上下文参数；直接调用底层工厂方法时需按 **`createIntersectionObserver(component, options, intersectionCtx)`** 传参，不要只传配置对象。

#### 入参

配置 **Object** 常用字段如下（与小程序 `options` 对齐）。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `thresholds` | `number[]` | 否 | 相交比例阈值列表。 |
| `initialRatio` | `number` | 否 | 初始相交比例。 |
| `observeAll` | `boolean` | 否 | 是否观察匹配 selector 的全部节点，默认 `false`。 |
| `throttleTime` | `number` | 否 | 测量节流间隔 ms，默认 `100`。 |

#### 返回值

返回 **`IntersectionObserver`** 实例。

#### IntersectionObserver 方法与监听载荷

| 方法 | 说明 |
| --- | --- |
| `relativeTo(selectorOrNodesRef, margins?)` | 指定参照节点；支持 selector 字符串或 `NodesRef`。`margins` 支持 `top/right/bottom/left`。 |
| `relativeToViewport(margins?)` | 以当前可视窗口为参照区域。 |
| `observe(selectorOrNodesRef, callback)` | 开始观察；同一实例只能调用一次。支持 selector、`NodesRef` 或 `NodesRef[]`。 |
| `disconnect()` | 从当前 IntersectionObserver 上下文移除实例。 |

`observe` 回调收到 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 目标节点 id。 |
| `dataset` | `Object` | 目标节点 dataset。 |
| `intersectionRatio` | `number` | 相交比例，当前实现保留两位小数。 |
| `intersectionRect` | `Object` | 相交区域，含 `top`、`right`、`bottom`、`left`。 |
| `boundingClientRect` | `Object` | 目标节点布局，含 `top`、`right`、`bottom`、`left`、`width`、`height`。 |
| `relativeRect` | `Object` | 参照区域布局。 |
| `time` | `number` | 测量时间戳 ms。 |

---

### createSelectorQuery

#### 说明

工厂方法：创建 **`SelectorQuery`**（非 `success` / `fail` 入参模型）。

#### 入参

无。当前 RN 工厂函数不读取传入参数；若需组件作用域，创建后调用 **`query.in(component)`**。

#### 返回值

返回 **`SelectorQuery`** 实例。

#### SelectorQuery / NodesRef 方法

| 方法 | 返回值 / 回调载荷 | RN 说明 |
| --- | --- | --- |
| `query.in(component)` | 当前 `SelectorQuery` | 必须先设置组件作用域；未设置时选择操作会警告。 |
| `query.select(selector)` | `NodesRef` | 选择首个节点。支持 `#id` 与单个或连续 class（如 `.a.b`）；不支持组合器、逗号、空格等复杂选择器。 |
| `query.selectAll(selector)` | `NodesRef` | 选择全部匹配节点，selector 约束同上。 |
| `query.selectViewport()` | `NodesRef` | 当前 RN 实现未提供真正的 viewport 节点，仅走空 selector 占位，不应依赖；`canIUse('SelectorQuery.selectViewport')` 返回 **`false`**。 |
| `nodesRef.boundingClientRect(callback)` | 当前 `SelectorQuery` | 回调含 `id`、`dataset`、`left`、`right`、`top`、`bottom`、`width`、`height`；`selectAll` 时为数组。 |
| `nodesRef.scrollOffset(callback)` | 当前 `SelectorQuery` | 回调含 `id`、`dataset`、`scrollLeft`、`scrollTop`、`scrollWidth`、`scrollHeight`。 |
| `nodesRef.fields(config, callback)` | 当前 `SelectorQuery` | 支持 `id`、`dataset`、`rect`、`size`、`scrollOffset`、`properties`、`computedStyle`、`context`、`node`、`ref` 等当前实现分支。 |
| `nodesRef.context(callback)` / `node(callback)` / `ref(callback)` | 当前 `SelectorQuery` | 分别返回 `{ context }`、`{ node }`、`{ ref }`。 |
| `query.exec(callback)` | `undefined` | 按入队顺序聚合前述回调结果，最终参数为结果数组。 |

---
