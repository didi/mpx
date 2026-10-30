# 环境 API

Mpx 提供的基准环境 API，收录不表示每个目标端都支持；跨端输出时请同时查阅对应 API 的 [RN 差异](../rn/rn-api-reference.md)或 [Web 差异](../web/web-api-reference.md)。支付宝系统信息、尺寸与节点查询的实践边界见 [支付宝 API 实践](../ali/ali-api-reference.md)，该页不提供完整支持表。

## 目录

- [使用说明](#使用说明)
  - [接入与调用](#接入与调用)
  - [自定义 API 扩展](#自定义-api-扩展)
  - [入参与返回值约定](#入参与返回值约定)
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
  - [switchTab](#switchtab)
- [界面](#界面)
  - [showActionSheet](#showactionsheet)
  - [showModal](#showmodal)
  - [showToast](#showtoast)
  - [hideToast](#hidetoast)
  - [showLoading](#showloading)
  - [hideLoading](#hideloading)
  - [setNavigationBarTitle](#setnavigationbartitle)
  - [setNavigationBarColor](#setnavigationbarcolor)
  - [hideHomeButton](#hidehomebutton)
  - [pageScrollTo](#pagescrollto)
  - [startPullDownRefresh](#startpulldownrefresh)
  - [stopPullDownRefresh](#stoppulldownrefresh)
  - [createAnimation](#createanimation)
  - [nextTick](#nexttick)
  - [getMenuButtonBoundingClientRect](#getmenubuttonboundingclientrect)
  - [onWindowResize](#onwindowresize)
  - [offWindowResize](#offwindowresize)
  - [setTabBarItem](#settabbaritem)
  - [setTabBarStyle](#settabbarstyle)
  - [showTabBar](#showtabbar)
  - [hideTabBar](#hidetabbar)
- [网络](#网络)
  - [request](#request)
  - [connectSocket](#connectsocket)
  - [sendSocketMessage](#sendsocketmessage)
  - [closeSocket](#closesocket)
  - [onSocketOpen](#onsocketopen)
  - [onSocketError](#onsocketerror)
  - [onSocketMessage](#onsocketmessage)
  - [onSocketClose](#onsocketclose)
- [文件](#文件)
  - [downloadFile](#downloadfile)
  - [uploadFile](#uploadfile)
  - [saveFile](#savefile)
- [数据缓存](#数据缓存)
  - [setStorage](#setstorage)
  - [setStorageSync](#setstoragesync)
  - [getStorage](#getstorage)
  - [getStorageSync](#getstoragesync)
  - [getStorageInfo](#getstorageinfo)
  - [getStorageInfoSync](#getstorageinfosync)
  - [removeStorage](#removestorage)
  - [removeStorageSync](#removestoragesync)
  - [clearStorage](#clearstorage)
  - [clearStorageSync](#clearstoragesync)
- [媒体](#媒体)
  - [previewImage](#previewimage)
  - [compressImage](#compressimage)
  - [getImageInfo](#getimageinfo)
  - [chooseMedia](#choosemedia)
  - [createInnerAudioContext](#createinneraudiocontext)
  - [createVideoContext](#createvideocontext)
  - [createCameraContext](#createcameracontext)
  - [canvasToTempFilePath](#canvastotempfilepath)
  - [canvasGetImageData](#canvasgetimagedata)
- [位置](#位置)
  - [getLocation](#getlocation)
  - [openLocation](#openlocation)
  - [chooseLocation](#chooselocation)
  - [startLocationUpdate](#startlocationupdate)
  - [stopLocationUpdate](#stoplocationupdate)
  - [onLocationChange](#onlocationchange)
  - [offLocationChange](#offlocationchange)
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
  - [setClipboardData](#setclipboarddata)
  - [getClipboardData](#getclipboarddata)
  - [setScreenBrightness](#setscreenbrightness)
  - [getScreenBrightness](#getscreenbrightness)
  - [setVisualEffectOnCapture](#setvisualeffectoncapture)
  - [onUserCaptureScreen](#onusercapturescreen)
  - [offUserCaptureScreen](#offusercapturescreen)
  - [addPhoneContact](#addphonecontact)
  - [scanCode](#scancode)
- [低功耗蓝牙](#低功耗蓝牙)
  - [openBluetoothAdapter](#openbluetoothadapter)
  - [closeBluetoothAdapter](#closebluetoothadapter)
  - [startBluetoothDevicesDiscovery](#startbluetoothdevicesdiscovery)
  - [stopBluetoothDevicesDiscovery](#stopbluetoothdevicesdiscovery)
  - [onBluetoothDeviceFound](#onbluetoothdevicefound)
  - [offBluetoothDeviceFound](#offbluetoothdevicefound)
  - [getConnectedBluetoothDevices](#getconnectedbluetoothdevices)
  - [getBluetoothAdapterState](#getbluetoothadapterstate)
  - [onBluetoothAdapterStateChange](#onbluetoothadapterstatechange)
  - [offBluetoothAdapterStateChange](#offbluetoothadapterstatechange)
  - [getBluetoothDevices](#getbluetoothdevices)
  - [createBLEConnection](#createbleconnection)
  - [closeBLEConnection](#closebleconnection)
  - [onBLEConnectionStateChange](#onbleconnectionstatechange)
  - [offBLEConnectionStateChange](#offbleconnectionstatechange)
  - [writeBLECharacteristicValue](#writeblecharacteristicvalue)
  - [readBLECharacteristicValue](#readblecharacteristicvalue)
  - [notifyBLECharacteristicValueChange](#notifyblecharacteristicvaluechange)
  - [onBLECharacteristicValueChange](#onblecharacteristicvaluechange)
  - [offBLECharacteristicValueChange](#offblecharacteristicvaluechange)
  - [setBLEMTU](#setblemtu)
  - [getBLEDeviceRSSI](#getbledevicerssi)
  - [getBLEDeviceServices](#getbledeviceservices)
  - [getBLEDeviceCharacteristics](#getbledevicecharacteristics)
- [Wi-Fi](#wi-fi)
  - [startWifi](#startwifi)
  - [stopWifi](#stopwifi)
  - [getWifiList](#getwifilist)
  - [onGetWifiList](#ongetwifilist)
  - [offGetWifiList](#offgetwifilist)
  - [getConnectedWifi](#getconnectedwifi)
- [开放能力](#开放能力)
  - [login](#login)
  - [checkSession](#checksession)
  - [getUserInfo](#getuserinfo)
  - [requestPayment](#requestpayment)
  - [getSetting](#getsetting)
  - [openSetting](#opensetting)
  - [enableAlertBeforeUnload](#enablealertbeforeunload)
  - [disableAlertBeforeUnload](#disablealertbeforeunload)
  - [getExtConfig](#getextconfig)
  - [getExtConfigSync](#getextconfigsync)
- [WXML](#wxml)
  - [createSelectorQuery](#createselectorquery)
  - [createIntersectionObserver](#createintersectionobserver)

## 使用说明

### 接入与调用

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, { usePromise: true })
mpx.request({ url: 'https://api.example.com/list' }).then((res) => {
  console.log(res.data)
})
```

也可使用 `getProxy(options?)` 获取独立 API 对象，或 `install(target, options?)` 安装到指定对象。`install` 是默认导出的本地命名，如 `import install, { getProxy, promisify } from '@mpxjs/api-proxy'`，不是名为 install 的具名导出。直接按名称导入 API 时，不应用安装选项中的 usePromise/custom。

| 调用 | 参数 | 返回值 |
| --- | --- | --- |
| `getProxy(options?)` | 安装配置对象，默认 `{}`，字段见下表。 | 新的 API 对象，如 `const api = getProxy({ usePromise: true })` 后调用 `api.request(...)`。 |
| `install(target, options?)` | `target: object` 为要挂载 API 的对象，options 同上。 | `void`；直接修改 target，不返回 API 对象。 |
| `promisify(apiMap, whiteList?, blackList?)` | API 名到函数的对象；两个可选名单均为 API 名称的 `string[]`，白名单优先。 | 新的 API 函数对象，按规则包装异步方法，未包装的方法保留原调用形式；不修改输入对象，也不自动安装到 Mpx。 |

以下为 `mpx.use(apiProxy, options)`、`install(target, options)` 与 `getProxy(options)` 共用的安装配置 `options` 字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| usePromise | `boolean` | false | 对符合规则的异步 API 返回 Promise。 |
| whiteList | `string[]` | [] | 开启 usePromise 后强制指定名称参与包装；同名项优先于 blackList。 |
| blackList | `string[]` | [] | 开启 usePromise 后保留指定 API 的原调用形式。 |
| custom | `object` | {} | 目标端名称到 API 函数对象的映射；按实际输出目标覆盖或新增 API，详见[自定义 API 扩展](#自定义-api-扩展)。 |

### 自定义 API 扩展

`@mpxjs/api-proxy` 通过安装选项 `custom` 接入业务自定义 API。当目标端缺少某项内置适配，或需要替换已有实现时，可将宿主 SDK、浏览器能力或业务实现适配为统一接口，再通过代理对象调用。

| 配置与调用 | 约定 |
| --- | --- |
| 平台选择 | `custom` 按实际输出目标分组，如 `wx/web/ios/android/harmony`；仅当前目标对应的对象生效，没有统一的 `rn` 分组，也不会自动继承 `custom.ios`。 |
| 覆盖与新增 | 同名方法覆盖内置 API（包括已 Promise 化的方法）；新名称作为扩展 API 挂到目标对象。 |
| 接入入口 | `mpx.use(apiProxy, options)`、`install(target, options)` 与 `getProxy(options)` 均支持 `custom`；在业务调用前完成安装。 |
| Promise 与回调 | 自定义方法不自动应用 `usePromise/whiteList/blackList`。实现方须明确并提供回调、Promise、同步返回值或任务对象；替换已有 API 时对齐调用方依赖的参数、结果与错误契约。 |
| 调用范围 | 通过安装后的 `mpx`、指定 target 或 `getProxy()` 返回的对象调用；`import { scanCode } from '@mpxjs/api-proxy'` 这类具名导入不会使用 custom 实现，也不会新增具名导出。 |

业务模块 `api-custom` 导出 API 名到实现函数的映射，例如 `{ scanCode }`。按[文件维度条件编译](./conditional-compile.md#文件维度条件编译)提供 `api-custom.web.js`、`api-custom.ios.js` 等实现，默认文件可导出空对象；平台 SDK 的引用放在对应条件文件内。

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'
import customApi from './api-custom'

mpx.use(apiProxy, {
  usePromise: true,
  custom: {
    [__mpx_mode__]: customApi
  }
})
```

示例将条件文件导出的实现注册到当前输出目标；即使 Android 构建复用了 `.ios.js` 文件，注册的分组仍为 `android`。业务通过 `mpx.scanCode(...)` 等方法消费自定义实现。`custom` 负责注册与覆盖，不会自动补足宿主能力；目标端实际能力、权限及不支持的参数仍由实现方处理。

### 入参与返回值约定

- 未另行注明时，异步 API 的业务参数放在第一个 options 对象中；下表中的回调适用于这些调用，不在每个参数表重复。
- 本文的“返回值”首先描述未开启 Promise 化时的同步返回值；“成功回调参数”是 success 或 Promise resolve 的结果，“监听回调参数”是 on* 的事件载荷。
- 开启 usePromise 后用 await/then/catch；若需保留回调写法，单次调用传 `usePromise: false`。不要在同一调用混用两套处理。
- request、connectSocket、downloadFile、uploadFile 等原同步任务句柄位于返回 Promise 的 `__returned`；await 不会得到任务对象。同步方法、监听方法和大部分工厂默认不包装。
- 文档列出基础业务参数和用于跨端比较的常用字段。端差异列出 API、参数、返回字段和对象方法的不支持项，以及有效返回值的类型和默认值差异。不支持字段归入不支持项；正常可空返回值仍按类型描述。支持范围、类型与默认值一致时沿用基准，暂不比较行为和使用条件。

| 回调 | 参数 | 用法 |
| --- | --- | --- |
| success | 本 API 的成功结果 | 调用成功后接收数据。 |
| fail | 通常含 errMsg，可含 errCode/errno | 处理调用失败。 |
| complete | 本次成功或失败结果 | 调用结束后的处理。 |

以上回调均为可选函数 `(res) => void`，返回值不被消费；不能通过在 success 中 return 数据取得外层 API 的返回值。监听 API 的 callback 也不返回取消函数，事件载荷见各节；无业务载荷的通知可使用无参回调。异步成功结果通常含 `errMsg: string`；仅有协议结果、无额外业务字段时直接说明。取消监听应使用原函数引用；只有接口明确允许时才省略回调清空全部。

工厂返回的上下文、任务对象的方法不会因安装 `usePromise: true` 自动 Promise 化。下文的 `void` 表示没有业务同步返回值，异步结果仍从该方法自己的回调取得。

## 基础

### base64ToArrayBuffer

将 Base64 字符串转换为二进制缓冲。

调用：`mpx.base64ToArrayBuffer(base64)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `base64` | `string` | 是 | — | 要转化成 ArrayBuffer 对象的 Base64 字符串。 |

#### 返回值

返回 `ArrayBuffer`。

### arrayBufferToBase64

将二进制字节数据转换为 Base64 字符串。

调用：`mpx.arrayBufferToBase64(arrayBuffer)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `arrayBuffer` | `Uint8Array`（跨端基准用法） | 是 | — | 待编码的字节数组；已有 ArrayBuffer 时使用 `new Uint8Array(buffer)`，已有 Uint8Array 时直接传入。 |

微信文档的参数表标注为 ArrayBuffer，但官方示例直接传入 Uint8Array。Mpx 跨端代码统一采用该示例的字节数组写法，不将其作为 RN/Web 专属适配。

```js
const bytes = new Uint8Array([11, 22, 33])
const base64 = mpx.arrayBufferToBase64(bytes)
```

#### 返回值

返回 `string`。

### canIUse

判断指定 API、参数、返回字段或组件能力是否可用。

调用：`mpx.canIUse(schema)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `schema` | `string` | 是 | — | 使用 `${API}.${method}.${param}.${option}` 或者 `${component}.${attribute}.${option}` 方式来调用。 |

#### 返回值

返回 `boolean`。

#### 使用注意

schema 可使用 API、参数、返回值或组件属性名称。结果只反映该查询覆盖的能力，不代替授权或设备可用性检查。

### getSystemInfo

获取系统与窗口信息。

调用：`mpx.getSystemInfo(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `SDKVersion` | `string` | — | 客户端基础库版本。 |
| `albumAuthorized` | `boolean` | — | 允许微信使用相册的开关（仅 iOS 有效）。 |
| `benchmarkLevel` | `number` | — | 设备性能等级。 |
| `bluetoothEnabled` | `boolean` | — | 蓝牙的系统开关。 |
| `brand` | `string` | — | 设备品牌。 |
| `cameraAuthorized` | `boolean` | — | 允许微信使用摄像头的开关。 |
| `deviceOrientation` | `'portrait' \| 'landscape'` | — | 设备方向（注意：IOS客户端横屏游戏获取deviceOrientation可能不准，建议以屏幕宽高为准）。 |
| `enableDebug` | `boolean` | — | 是否已打开调试。 |
| `fontSizeSetting` | `number` | — | 用户字体大小（单位px）。 |
| `host` | `Object` | — | 当前小程序运行的宿主环境。 |
| `language` | `string` | — | 微信设置的语言。 |
| `locationAuthorized` | `boolean` | — | 允许微信使用定位的开关。 |
| `locationEnabled` | `boolean` | — | 地理位置的系统开关。 |
| `locationReducedAccuracy` | `boolean` | — | `true` 表示模糊定位，`false` 表示精确定位，仅 iOS 支持。 |
| `microphoneAuthorized` | `boolean` | — | 允许微信使用麦克风的开关。 |
| `model` | `string` | — | 设备型号。 |
| `notificationAlertAuthorized` | `boolean` | — | 允许微信通知带有提醒的开关（仅 iOS 有效）。 |
| `notificationAuthorized` | `boolean` | — | 允许微信通知的开关。 |
| `notificationBadgeAuthorized` | `boolean` | — | 允许微信通知带有标记的开关（仅 iOS 有效）。 |
| `notificationSoundAuthorized` | `boolean` | — | 允许微信通知带有声音的开关（仅 iOS 有效）。 |
| `phoneCalendarAuthorized` | `boolean` | — | 允许微信使用日历的开关。 |
| `pixelRatio` | `number` | — | 设备像素比。 |
| `platform` | `'ios' \| 'android' \| 'ohos' \| 'ohos_pc' \| 'windows' \| 'mac' \| 'devtools'` | — | 运行平台标识。 |
| `safeArea` | `Object` | — | 安全区矩形，含 top/right/bottom/left/width/height。 |
| `screenHeight` | `number` | — | 屏幕高度，逻辑 px。 |
| `screenWidth` | `number` | — | 屏幕宽度，逻辑 px。 |
| `statusBarHeight` | `number` | — | 状态栏高度，逻辑 px。 |
| `system` | `string` | — | 操作系统与版本。 |
| `version` | `string` | — | 微信版本号。 |
| `wifiEnabled` | `boolean` | — | Wi-Fi 的系统开关。 |
| `windowHeight` | `number` | — | 可用窗口高度，逻辑 px。 |
| `windowWidth` | `number` | — | 可用窗口宽度，逻辑 px。 |
| `theme` | `'dark' \| 'light'` | — | 系统当前主题，取值为`light`或`dark`，全局配置`"darkmode":true`时才能获取，否则为 undefined （不支持小游戏）。 |

`host` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `appId` | `string` | — | 宿主 app 对应的 appId。 |

`safeArea` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `bottom` | `number` | — | 安全区域右下角纵坐标。 |
| `height` | `number` | — | 高度；布局使用 px。 |
| `left` | `number` | — | 安全区域左上角横坐标。 |
| `right` | `number` | — | 安全区域右下角横坐标。 |
| `top` | `number` | — | 安全区域左上角纵坐标。 |
| `width` | `number` | — | 宽度；布局使用 px。 |

#### 使用注意

新代码按需要优先使用 getWindowInfo/getDeviceInfo 等细分接口；不同微信版本提供的字段范围见官方文档。

### getSystemInfoSync

同步获取系统与窗口信息。

调用：`mpx.getSystemInfoSync()`。

#### 入参

无。

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `SDKVersion` | `string` | — | 客户端基础库版本。 |
| `albumAuthorized` | `boolean` | — | 允许微信使用相册的开关（仅 iOS 有效）。 |
| `benchmarkLevel` | `number` | — | 设备性能等级。 |
| `bluetoothEnabled` | `boolean` | — | 蓝牙的系统开关。 |
| `brand` | `string` | — | 设备品牌。 |
| `cameraAuthorized` | `boolean` | — | 允许微信使用摄像头的开关。 |
| `deviceOrientation` | `'portrait' \| 'landscape'` | — | 设备方向（注意：IOS客户端横屏游戏获取deviceOrientation可能不准，建议以屏幕宽高为准）。 |
| `enableDebug` | `boolean` | — | 是否已打开调试。 |
| `fontSizeSetting` | `number` | — | 用户字体大小（单位px）。 |
| `host` | `Object` | — | 当前小程序运行的宿主环境。 |
| `language` | `string` | — | 微信设置的语言。 |
| `locationAuthorized` | `boolean` | — | 允许微信使用定位的开关。 |
| `locationEnabled` | `boolean` | — | 地理位置的系统开关。 |
| `locationReducedAccuracy` | `boolean` | — | `true` 表示模糊定位，`false` 表示精确定位，仅 iOS 支持。 |
| `microphoneAuthorized` | `boolean` | — | 允许微信使用麦克风的开关。 |
| `model` | `string` | — | 设备型号。 |
| `notificationAlertAuthorized` | `boolean` | — | 允许微信通知带有提醒的开关（仅 iOS 有效）。 |
| `notificationAuthorized` | `boolean` | — | 允许微信通知的开关。 |
| `notificationBadgeAuthorized` | `boolean` | — | 允许微信通知带有标记的开关（仅 iOS 有效）。 |
| `notificationSoundAuthorized` | `boolean` | — | 允许微信通知带有声音的开关（仅 iOS 有效）。 |
| `phoneCalendarAuthorized` | `boolean` | — | 允许微信使用日历的开关。 |
| `pixelRatio` | `number` | — | 设备像素比。 |
| `platform` | `'ios' \| 'android' \| 'ohos' \| 'ohos_pc' \| 'windows' \| 'mac' \| 'devtools'` | — | 运行平台标识。 |
| `safeArea` | `Object` | — | 安全区矩形，含 top/right/bottom/left/width/height。 |
| `screenHeight` | `number` | — | 屏幕高度，逻辑 px。 |
| `screenWidth` | `number` | — | 屏幕宽度，逻辑 px。 |
| `statusBarHeight` | `number` | — | 状态栏高度，逻辑 px。 |
| `system` | `string` | — | 操作系统与版本。 |
| `version` | `string` | — | 微信版本号。 |
| `wifiEnabled` | `boolean` | — | Wi-Fi 的系统开关。 |
| `windowHeight` | `number` | — | 可用窗口高度，逻辑 px。 |
| `windowWidth` | `number` | — | 可用窗口宽度，逻辑 px。 |
| `theme` | `'dark' \| 'light'` | — | 系统当前主题，取值为`light`或`dark`，全局配置`"darkmode":true`时才能获取，否则为 undefined （不支持小游戏）。 |

`host` 字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `appId` | `string` | — | 宿主 app 对应的 appId。 |

`safeArea` 字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `bottom` | `number` | — | 安全区域右下角纵坐标。 |
| `height` | `number` | — | 高度；布局使用 px。 |
| `left` | `number` | — | 安全区域左上角横坐标。 |
| `right` | `number` | — | 安全区域右下角横坐标。 |
| `top` | `number` | — | 安全区域左上角纵坐标。 |
| `width` | `number` | — | 宽度；布局使用 px。 |

#### 使用注意

返回字段与 [getSystemInfo](#getsysteminfo) 的业务结果一致。

### getWindowInfo

获取窗口、屏幕和安全区信息。

调用：`mpx.getWindowInfo()`。

#### 入参

无。

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `pixelRatio` | `number` | — | 设备像素比。 |
| `safeArea` | `Object` | — | 安全区矩形，含 top/right/bottom/left/width/height。 |
| `screenHeight` | `number` | — | 屏幕高度，逻辑 px。 |
| `screenTop` | `number` | — | 窗口上边缘相对屏幕的位置，逻辑 px。 |
| `screenWidth` | `number` | — | 屏幕宽度，逻辑 px。 |
| `statusBarHeight` | `number` | — | 状态栏高度，逻辑 px。 |
| `windowHeight` | `number` | — | 可用窗口高度，逻辑 px。 |
| `windowWidth` | `number` | — | 可用窗口宽度，逻辑 px。 |

`safeArea` 字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `bottom` | `number` | — | 安全区域右下角纵坐标。 |
| `height` | `number` | — | 高度；布局使用 px。 |
| `left` | `number` | — | 安全区域左上角横坐标。 |
| `right` | `number` | — | 安全区域右下角横坐标。 |
| `top` | `number` | — | 安全区域左上角纵坐标。 |
| `width` | `number` | — | 宽度；布局使用 px。 |

### getDeviceInfo

获取设备与系统概要信息。

调用：`mpx.getDeviceInfo()`。

#### 入参

无。

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `abi` | `string` | — | 应用二进制接口类型。 |
| `benchmarkLevel` | `number` | — | 设备性能等级。 |
| `brand` | `string` | — | 设备品牌。 |
| `cpuType` | `string` | — | 设备 CPU 型号。 |
| `deviceAbi` | `string` | — | 设备二进制接口类型。 |
| `memorySize` | `string` | — | 设备内存，单位 MB。 |
| `model` | `string` | — | 设备型号。 |
| `platform` | `'ios' \| 'android' \| 'ohos' \| 'ohos_pc' \| 'windows' \| 'mac' \| 'devtools'` | — | 运行平台标识。 |
| `system` | `string` | — | 操作系统与版本。 |

#### 使用注意

memorySize 的微信基准类型为 string。benchmarkLevel 在较新微信版本中已停止维护，勿依赖其持续更新。

### getEnterOptionsSync

获取最近一次进入应用时的参数。

调用：`mpx.getEnterOptionsSync()`。

#### 入参

无。

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `apiCategory` | `'default' \| 'nativeFunctionalized' \| 'browseOnly' \| 'embedded' \| 'chatTool'` | — | API 类别。 |
| `forwardMaterials` | `Object[]` | — | 打开的文件信息数组，只有从聊天素材场景打开（scene为1173）才会携带该参数。 |
| `hostExtraData` | `Object` | — | 宿主传递的数据，第三方 app 中运行小程序时返回。 |
| `path` | `string` | — | 页面路径。 |
| `query` | `Record<string, string>` | — | 页面查询参数。 |
| `referrerInfo` | `Object` | — | 来源信息。 |
| `scene` | `number` | — | 进入应用的场景值。 |
| `chatType` | `1 \| 2 \| 3 \| 4` | — | 从微信群聊/单聊打开小程序时，chatType 表示具体微信群聊/单聊类型。 |
| `shareTicket` | `string` | — | 转发票据。 |

`referrerInfo` 字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `appId` | `string` | — | 来源小程序、公众号或 App 的 appId。 |
| `extraData` | `Object` | — | 来源小程序传过来的数据，scene=1037或1038时支持。 |

### getLaunchOptionsSync

获取应用冷启动时的参数。

调用：`mpx.getLaunchOptionsSync()`。

#### 入参

无。

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `apiCategory` | `'default' \| 'nativeFunctionalized' \| 'browseOnly' \| 'embedded' \| 'chatTool'` | — | API 类别。 |
| `forwardMaterials` | `Object[]` | — | 打开的文件信息数组，只有从聊天素材场景打开（scene为1173）才会携带该参数。 |
| `hostExtraData` | `Object` | — | 宿主传递的数据，第三方 app 中运行小程序时返回。 |
| `path` | `string` | — | 页面路径。 |
| `query` | `Record<string, string>` | — | 页面查询参数。 |
| `referrerInfo` | `Object` | — | 来源信息。 |
| `scene` | `number` | — | 进入应用的场景值。 |
| `chatType` | `1 \| 2 \| 3 \| 4` | — | 从微信群聊/单聊打开小程序时，chatType 表示具体微信群聊/单聊类型。 |
| `shareTicket` | `string` | — | 转发票据。 |

`referrerInfo` 字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `appId` | `string` | — | 来源小程序、公众号或 App 的 appId。 |
| `extraData` | `Object` | — | 来源小程序传过来的数据，scene=1037或1038时支持。 |

#### 使用注意

与最近一次进入参数区分；应用生命周期内的再次进入可能只改变 getEnterOptionsSync 的结果。

### onAppShow

监听应用进入前台。

调用：`mpx.onAppShow(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `apiCategory` | `'default' \| 'nativeFunctionalized' \| 'browseOnly' \| 'embedded' \| 'chatTool'` | — | API 类别。 |
| `forwardMaterials` | `Object[]` | — | 打开的文件信息数组，只有从聊天素材场景打开（scene为1173）才会携带该参数。 |
| `hostExtraData` | `Object` | — | 宿主传递的数据，第三方 app 中运行小程序时返回。 |
| `path` | `string` | — | 页面路径。 |
| `query` | `Record<string, string>` | — | 页面查询参数。 |
| `referrerInfo` | `Object` | — | 来源信息。 |
| `scene` | `number` | — | 进入应用的场景值。 |
| `chatType` | `1 \| 2 \| 3 \| 4` | — | 从微信群聊/单聊打开小程序时，chatType 表示具体微信群聊/单聊类型。 |
| `shareTicket` | `string` | — | 转发票据。 |

`referrerInfo` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `appId` | `string` | — | 来源小程序、公众号或 App 的 appId。 |
| `extraData` | `Object` | — | 来源小程序传过来的数据，scene=1037或1038时支持。 |

### onAppHide

监听应用进入后台。

调用：`mpx.onAppHide(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `reason` | `0 \| 1 \| 2 \| 3` | — | 后台原因：0 退出、1 进入其他小程序、2 原生功能页、3 其他。 |

### offAppShow

取消 onAppShow 注册的监听。

调用：`mpx.offAppShow(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### offAppHide

取消 onAppHide 注册的监听。

调用：`mpx.offAppHide(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### onError

监听应用级 JavaScript 错误。

调用：`mpx.onError(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

回调签名为 `(message: string) => void`，直接接收错误字符串，不是 `{ message }` 对象。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `message` | `string` | — | 错误信息，包含堆栈。 |

### offError

取消 onError 注册的监听。

调用：`mpx.offError(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### onUnhandledRejection

监听未处理的 Promise 拒绝。

调用：`mpx.onUnhandledRejection(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `promise` | `Promise<any>` | — | 被拒绝的 Promise 对象。 |
| `reason` | `string` | — | Promise 的拒绝原因，通常为 Error 对象；RN/Web 的实际类型见端差异。 |

### offUnhandledRejection

取消 onUnhandledRejection 注册的监听。

调用：`mpx.offUnhandledRejection(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### onLazyLoadError

监听异步组件加载失败。

调用：`mpx.onLazyLoadError(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `errMsg` | `string` | — | 调用结果信息。 |
| `subpackage` | `any[]` | — | 异步组件所属的分包。 |
| `type` | `string` | — | 失败类型，通常为 subpackage。 |

### offLazyLoadError

取消 onLazyLoadError 注册的监听。

调用：`mpx.offLazyLoadError(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

## 路由

### navigateTo

保留当前页并打开非 tabBar 页面。

调用：`mpx.navigateTo(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |
| `events` | `Object` | 否 | — | 页面间通信接口，用于监听被打开页面发送到当前页面的数据。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `eventChannel` | `Object` | — | EventChannel 和被打开页面进行通信。 |

#### 使用注意

events 是 `{ [eventName]: (...args) => void }` 监听函数映射，接收目标页回传。成功结果中的 eventChannel 向目标页发送消息；目标页通过 `getOpenerEventChannel()` 获取通道。`emit/on/once/off` 的参数和返回值见 [页面事件通道](./script-reference.md#页面与组件实例属性与方法)。

### redirectTo

关闭当前页并打开非 tabBar 页面。

调用：`mpx.redirectTo(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### reLaunch

关闭已有页面并打开目标页。

调用：`mpx.reLaunch(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### navigateBack

关闭当前页并回退指定层数。

调用：`mpx.navigateBack(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `delta` | `number` | 否 | 1 | 返回的页面数，如果 delta 大于现有页面数，则返回到页面栈中只剩一个页面为止。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### switchTab

切换到已配置的 tabBar 页面。

调用：`mpx.switchTab(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

## 界面

### showActionSheet

显示操作菜单。

调用：`mpx.showActionSheet(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `itemList` | `string[]` | 是 | — | 按钮的文字数组，数组长度最大为 6。 |
| `alertText` | `string` | 否 | — | 警示文案。 |
| `itemColor` | `string` | 否 | #000000 | 按钮的文字颜色。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `tapIndex` | `number` | — | 用户点击的按钮序号，从上到下的顺序，从0开始。 |

### showModal

显示确认对话框，可按需开启输入框。

调用：`mpx.showModal(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `cancelColor` | `string` | 否 | #000000 | 取消按钮的文字颜色，必须是 16 进制格式的颜色字符串。 |
| `cancelText` | `string` | 否 | 取消 | 取消按钮的文字，最多 4 个字符。 |
| `confirmColor` | `string` | 否 | #576B95 | 确认按钮的文字颜色，必须是 16 进制格式的颜色字符串。 |
| `confirmText` | `string` | 否 | 确定 | 确认按钮的文字，最多 4 个字符。 |
| `content` | `string` | 否 | — | 提示的内容。 |
| `editable` | `boolean` | 否 | false | 是否显示输入框。 |
| `placeholderText` | `string` | 否 | — | 显示输入框时的提示文本。 |
| `showCancel` | `boolean` | 否 | true | 是否显示取消按钮。 |
| `title` | `string` | 否 | — | 提示的标题。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `cancel` | `boolean` | — | 为 true 时，表示用户点击了取消（用于 Android 系统区分点击蒙层关闭还是点击取消按钮关闭）。 |
| `confirm` | `boolean` | — | 为 true 时，表示用户点击了确定按钮。 |
| `content` | `string` | — | editable 为 true 时，用户输入的文本。 |

### showToast

显示短暂的消息提示。

调用：`mpx.showToast(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `title` | `string` | 是 | — | 提示的内容。 |
| `duration` | `number` | 否 | 1500 | 提示的延迟时间。 |
| `icon` | `'success' \| 'error' \| 'loading' \| 'none'` | 否 | success | 图标。 |
| `image` | `string` | 否 | — | 自定义图标的本地路径，image 的优先级高于 icon。 |
| `mask` | `boolean` | 否 | false | 是否显示透明蒙层，防止触摸穿透。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### hideToast

关闭消息提示。

调用：`mpx.hideToast(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `noConflict` | `boolean` | 否 | false | 目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### showLoading

显示持续的加载提示。

调用：`mpx.showLoading(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `title` | `string` | 是 | — | 提示的内容。 |
| `mask` | `boolean` | 否 | false | 是否显示透明蒙层，防止触摸穿透。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### hideLoading

关闭加载提示。

调用：`mpx.hideLoading(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `noConflict` | `boolean` | 否 | false | 目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### setNavigationBarTitle

修改当前页标题。

调用：`mpx.setNavigationBarTitle(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `title` | `string` | 是 | — | 页面标题。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### setNavigationBarColor

修改导航栏前景色与背景色。

调用：`mpx.setNavigationBarColor(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `backgroundColor` | `string` | 是 | — | 背景颜色值，有效值为十六进制颜色。 |
| `frontColor` | `string` | 是 | — | 前景颜色值，包括按钮、标题、状态栏的颜色，仅支持 #ffffff 和 #000000。 |
| `animation` | `Object` | 否 | — | 动画效果。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### hideHomeButton

隐藏宿主提供的回首页按钮。

调用：`mpx.hideHomeButton(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### pageScrollTo

将页面滚动到指定位置或节点。

调用：`mpx.pageScrollTo(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `duration` | `number` | 否 | 300 | 滚动动画的时长，单位 ms。 |
| `offsetTop` | `number` | 否 | — | 偏移距离，需要和 selector 参数搭配使用，可以滚动到 selector 加偏移距离的位置，单位 px。 |
| `scrollTop` | `number` | 否 | — | 滚动到页面的目标位置，单位 px。 |
| `selector` | `string` | 否 | — | 选择器。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

#### 使用注意

scrollTop 与 selector 至少提供一个；页面需具备可滚动内容。

### startPullDownRefresh

开始页面下拉刷新。

调用：`mpx.startPullDownRefresh(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### stopPullDownRefresh

结束页面下拉刷新。

调用：`mpx.stopPullDownRefresh(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### createAnimation

创建可链式配置的动画对象，导出后绑定到节点。

调用：`mpx.createAnimation(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `delay` | `number` | 否 | 0 | 动画延迟时间，单位 ms。 |
| `duration` | `number` | 否 | 400 | 动画持续时间，单位 ms。 |
| `timingFunction` | `'linear' \| 'ease' \| 'ease-in' \| 'ease-in-out' \| 'ease-out' \| 'step-start' \| 'step-end'` | 否 | 'linear' | 动画的效果。 |
| `transformOrigin` | `string` | 否 | '50% 50% 0' | 变换原点，依次为 x、y、z 轴位置，取值规则同 CSS transform-origin。 |

#### 返回值

返回 `Animation`。

#### 对象用法

除 `export()` 外，下列方法均返回当前 `Animation`，可以链式调用；所有角度参数单位为度，数值位移单位为 px。

| 方法 | 参数与结果 |
| --- | --- |
| `opacity(value)` / `backgroundColor(color)` | value 为 `0–1` 的 number；color 为颜色 string。 |
| `width(value)` / `height(value)` / `top(value)` / `right(value)` / `bottom(value)` / `left(value)` | value 为 number 或带单位的 string，数值按 px 使用。 |
| `rotate(angle)` / `rotateX(angle)` / `rotateY(angle)` / `rotateZ(angle)` | angle 为 number。 |
| `rotate3d(x, y, z, angle)` | 四个 number，前三项组成旋转轴向量，angle 为旋转角度。 |
| `scale(sx, sy?)` / `scaleX(value)` / `scaleY(value)` / `scaleZ(value)` | number 类型的缩放比例，1 表示原尺寸；scale 省略 sy 时与 sx 相同。 |
| `scale3d(sx, sy, sz)` | 三个 number，分别指定三个方向的缩放比例。 |
| `translate(tx?, ty?)` / `translate3d(tx?, ty?, tz?)` | number 类型的位移，省略的方向默认为 0。 |
| `translateX(value)` / `translateY(value)` / `translateZ(value)` | value 为 number 类型的单轴位移。 |
| `skew(ax, ay)` / `skewX(angle)` / `skewY(angle)` | number 类型的倾斜角度。 |
| `matrix(a, b, c, d, tx, ty)` / `matrix3d(...values)` | 分别传 6 个 / 16 个 number，顺序对应 CSS matrix / matrix3d 的矩阵参数，不传数组。 |
| `step(options?)` | 完成一组动画；options 可含 `duration/delay: number`（ms）、`timingFunction: string`、`transformOrigin: string`，取值同创建选项，未指定的字段沿用创建配置。 |
| `export()` | 无参数，返回可绑定到模板 `animation` 的动画数据对象；导出后清空已记录的步骤，不返回 Animation。 |

矩阵、三维变换等方法的端支持范围见差异。

### nextTick

延后执行指定函数。

调用：`mpx.nextTick(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `() => void` | 是 | — | 延后执行的无参函数，返回值不被消费。 |

#### 返回值

无。

#### 使用注意

延后执行不等于等待视图布局完成；等待 Mpx 数据更新后的视图，请使用 core 的 nextTick 或实例 $nextTick。

### getMenuButtonBoundingClientRect

获取菜单胶囊的布局矩形。

调用：`mpx.getMenuButtonBoundingClientRect()`。

#### 入参

无。

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `bottom` | `number` | — | 下边界坐标，单位：px。 |
| `height` | `number` | — | 高度；布局使用 px。 |
| `left` | `number` | — | 左边界坐标，单位：px。 |
| `right` | `number` | — | 右边界坐标，单位：px。 |
| `top` | `number` | — | 上边界坐标，单位：px。 |
| `width` | `number` | — | 宽度；布局使用 px。 |

### onWindowResize

监听窗口尺寸变化。

调用：`mpx.onWindowResize(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `size` | `{ windowWidth: number, windowHeight: number }` | — | 变化后的窗口宽高，单位 px。 |

### offWindowResize

取消 onWindowResize 注册的监听。

调用：`mpx.offWindowResize(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### setTabBarItem

修改指定 tabBar 项的文案与图标。

调用：`mpx.setTabBarItem(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `index` | `number` | 是 | — | tabBar 的哪一项，从左边算起。 |
| `iconPath` | `string` | 否 | — | 图片路径，icon 大小限制为 40kb，建议尺寸为 81px * 81px，当 postion 为 top 时，此参数无效。 |
| `selectedIconPath` | `string` | 否 | — | 选中时的图片路径，icon 大小限制为 40kb，建议尺寸为 81px * 81px ，当 postion 为 top 时，此参数无效。 |
| `text` | `string` | 否 | — | tab 上的按钮文字。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### setTabBarStyle

修改 tabBar 的文字、背景与边框样式。

调用：`mpx.setTabBarStyle(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `backgroundColor` | `string` | 否 | — | tab 的背景色，HexColor。 |
| `borderStyle` | `string` | 否 | — | tabBar上边框的颜色， 仅支持 black/white。 |
| `color` | `string` | 否 | — | tab 上的文字默认颜色，HexColor。 |
| `selectedColor` | `string` | 否 | — | tab 上的文字选中时的颜色，HexColor。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### showTabBar

显示 tabBar。

调用：`mpx.showTabBar(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `animation` | `boolean` | 否 | false | 是否需要动画效果。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### hideTabBar

隐藏 tabBar。

调用：`mpx.hideTabBar(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `animation` | `boolean` | 否 | false | 是否需要动画效果。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

## 网络

### request

发起网络请求。

调用：`mpx.request(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |
| `data` | `string \| Object \| ArrayBuffer` | 否 | — | 传入或返回的数据。 |
| `dataType` | `string` | 否 | json | 响应解析方式；json 表示尝试 JSON 解析。 |
| `enableCache` | `boolean` | 否 | false | 开启 Http 缓存。 |
| `enableChunked` | `boolean` | 否 | false | 开启 transfer-encoding chunked。 |
| `enableHttp2` | `boolean` | 否 | false | 开启 http2。 |
| `enableHttpDNS` | `boolean` | 否 | false | 是否开启 HttpDNS 服务。 |
| `enableHttpDNSFallback` | `boolean` | 否 | true | 是否开启 HttpDNS 兜底。 |
| `enableProfile` | `boolean` | 否 | true | 是否开启 profile。 |
| `enableQuic` | `boolean` | 否 | false | 是否启用 QUIC/HTTP3 请求。 |
| `forceCellularNetwork` | `boolean` | 否 | false | 强制使用蜂窝网络发送请求。 |
| `header` | `Object` | 否 | — | HTTP 请求头或响应头。 |
| `httpDNSServiceId` | `string` | 否 | — | HttpDNS 服务商 Id。 |
| `httpDNSTimeout` | `number` | 否 | 10000 | HttpDNS 超时时间。 |
| `method` | `'OPTIONS' \| 'GET' \| 'HEAD' \| 'POST' \| 'PUT' \| 'DELETE' \| 'TRACE' \| 'CONNECT'` | 否 | GET | HTTP 方法。 |
| `redirect` | `'follow' \| 'manual'` | 否 | follow | 重定向拦截策略。 |
| `responseType` | `'text' \| 'arraybuffer'` | 否 | text | 响应数据类型。 |
| `timeout` | `number` | 否 | 60000 | 超时时间，单位 ms。 |
| `useHighPerformanceMode` | `boolean` | 否 | true | 使用高性能模式。 |

#### 返回值

同步返回 `RequestTask`；开启 Promise 化后从 `Promise.__returned` 取得。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `cookies` | `string[]` | — | 响应携带的 Cookie 列表。 |
| `data` | `any` | — | 传入或返回的数据。 |
| `exception` | `Object` | — | 请求异常信息。 |
| `header` | `Object` | — | HTTP 请求头或响应头。 |
| `profile` | `Object` | — | 请求性能信息。 |
| `statusCode` | `number` | — | HTTP 状态码。 |
| `useHttpDNS` | `boolean` | — | 本次请求是否使用了 HttpDNS。 |

#### 对象用法

| RequestTask 方法 | 参数与回调 | 返回值 |
| --- | --- | --- |
| `abort()` | 无参数，取消请求。 | `void` |
| `onHeadersReceived(callback)` | `(res) => void`，`res.header` 为响应头对象。 | `void` |
| `onChunkReceived(callback)` | `(res) => void`，`res.data: ArrayBuffer` 为收到的分块；请求需开启 `enableChunked`。 | `void` |
| `offHeadersReceived(callback?)` / `offChunkReceived(callback?)` | 原监听函数；省略时移除对应事件的全部监听。 | `void` |

任务监听的端支持情况见差异。可变参数请求应在回写前检查请求身份，取消时先废弃身份再 abort，避免晚到结果覆盖新状态。

#### 使用注意

收到服务器响应时，HTTP 状态码通过 statusCode 判断，不能只用 success 判断业务成功。任务句柄支持的附加方法见目标端差异。

### connectSocket

创建 WebSocket 连接任务。

调用：`mpx.connectSocket(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |
| `forceCellularNetwork` | `boolean` | 否 | false | 强制使用蜂窝网络发送请求。 |
| `header` | `Object` | 否 | — | HTTP 请求头或响应头。 |
| `perMessageDeflate` | `boolean` | 否 | false | 是否开启压缩扩展。 |
| `protocols` | `string[]` | 否 | — | 子协议数组。 |
| `tcpNoDelay` | `boolean` | 否 | false | 建立 TCP 连接的时候的 TCP_NODELAY 设置。 |
| `timeout` | `number` | 否 | — | 超时时间，单位 ms。 |

#### 返回值

同步返回 `SocketTask`；开启 Promise 化后从 `Promise.__returned` 取得。

成功结果无额外业务字段，使用通用调用结果信息。

#### 对象用法

SocketTask 的下列方法均返回 `void`，监听回调返回值不被消费。

| SocketTask 方法 | 参数与回调 |
| --- | --- |
| `send(options)` | 必填 `data: string \| ArrayBuffer`，可传 `success/fail/complete`；这些回调接收调用结果对象，不是服务端消息。 |
| `close(options)` | 可传 `{}`；`code?: number` 默认 1000，`reason?: string` 为关闭原因，可传 `success/fail/complete`；连接关闭事件从 onClose 取得。 |
| `onOpen(callback)` | `(res) => void`，res 含握手响应头 `header: object`。 |
| `onMessage(callback)` | `(res) => void`，`res.data: string \| ArrayBuffer` 为服务端消息。 |
| `onError(callback)` | `(res) => void`，res 含 `errMsg: string`。 |
| `onClose(callback)` | `(res) => void`，res 含 `code: number`、`reason: string`。 |

#### 使用注意

success 表示连接任务创建成功，发送应等待 SocketTask.onOpen。参数变化或重连时，应隔离旧任务回调；卸载时先清空当前任务身份再关闭旧连接。

### sendSocketMessage

通过全局 Socket 接口发送消息；新业务优先使用 SocketTask.send。

调用：`mpx.sendSocketMessage(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `data` | `string \| ArrayBuffer` | 是 | — | 传入或返回的数据。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### closeSocket

通过全局接口关闭 Socket；新业务优先使用 SocketTask.close。

调用：`mpx.closeSocket(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `code` | `number` | 否 | 1000（表示正常关闭连接） | 一个数字值表示关闭连接的状态号，表示连接被关闭的原因。 |
| `reason` | `string` | 否 | — | 关闭 WebSocket 连接的原因。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### onSocketOpen

监听全局 Socket 连接成功；优先使用 SocketTask.onOpen。

调用：`mpx.onSocketOpen(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `header` | `Object` | — | HTTP 请求头或响应头。 |

### onSocketError

监听全局 Socket 错误；优先使用 SocketTask.onError。

调用：`mpx.onSocketError(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `errMsg` | `string` | — | 调用结果信息。 |

### onSocketMessage

监听全局 Socket 消息；优先使用 SocketTask.onMessage。

调用：`mpx.onSocketMessage(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `data` | `string \| ArrayBuffer` | — | 传入或返回的数据。 |

### onSocketClose

监听全局 Socket 关闭；优先使用 SocketTask.onClose。

调用：`mpx.onSocketClose(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `code` | `number` | — | 一个数字值表示关闭连接的状态号，表示连接被关闭的原因。 |
| `reason` | `string` | — | 关闭 WebSocket 连接的原因。 |

## 文件

### downloadFile

下载文件到临时路径。

调用：`mpx.downloadFile(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |
| `enableHttp2` | `boolean` | 否 | false | 是否开启 http2。 |
| `enableProfile` | `boolean` | 否 | true | 是否开启 profile。 |
| `enableQuic` | `boolean` | 否 | false | 是否启用 QUIC/HTTP3 请求。 |
| `filePath` | `string` | 否 | — | 指定文件下载后存储的路径 (本地路径)。 |
| `header` | `Object` | 否 | — | HTTP 请求头或响应头。 |
| `timeout` | `number` | 否 | 60000 | 超时时间，单位 ms。 |

#### 返回值

同步返回 `DownloadTask`；开启 Promise 化后从 `Promise.__returned` 取得。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `filePath` | `string` | — | 用户文件路径 (本地路径)。 |
| `profile` | `Object` | — | 请求性能信息。 |
| `statusCode` | `number` | — | HTTP 状态码。 |
| `tempFilePath` | `string` | — | 临时文件路径。 |

#### 对象用法

DownloadTask 的方法均返回 `void`：`abort()` 无参数，用于取消下载；`onProgressUpdate(callback)` 接收 `(res) => void`，res 含 `progress`（0–100）、`totalBytesWritten`、`totalBytesExpectedToWrite`，均为 number，后两项单位为字节。`onHeadersReceived(callback)` 的回调接收 `{ header: object }`。

`offProgressUpdate(callback?)` / `offHeadersReceived(callback?)` 传原监听函数移除对应监听，省略时移除该事件全部监听；目标端支持范围见差异。

### uploadFile

以表单方式上传文件。

调用：`mpx.uploadFile(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `filePath` | `string` | 是 | — | 要上传文件资源的路径 (本地路径)。 |
| `name` | `string` | 是 | — | 文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容。 |
| `url` | `string` | 是 | — | 目标地址或应用内页面路径。 |
| `enableHttp2` | `boolean` | 否 | false | 是否开启 http2。 |
| `enableProfile` | `boolean` | 否 | true | 是否开启 profile。 |
| `enableQuic` | `boolean` | 否 | false | 是否启用 QUIC/HTTP3 请求。 |
| `formData` | `Object` | 否 | — | HTTP 请求中其他额外的 form data。 |
| `header` | `Object` | 否 | — | HTTP 请求头或响应头。 |
| `timeout` | `number` | 否 | — | 超时时间，单位 ms。 |

#### 返回值

同步返回 `UploadTask`；开启 Promise 化后从 `Promise.__returned` 取得。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `data` | `string` | — | 传入或返回的数据。 |
| `profile` | `Object` | — | 请求性能信息。 |
| `statusCode` | `number` | — | HTTP 状态码。 |

#### 对象用法

UploadTask 的方法均返回 `void`：`abort()` 无参数，用于取消上传；`onProgressUpdate(callback)` 接收 `(res) => void`，res 含 `progress`（0–100）、`totalBytesSent`、`totalBytesExpectedToSend`，均为 number，后两项单位为字节。`onHeadersReceived(callback)` 的回调接收 `{ header: object }`。

`offProgressUpdate(callback?)` / `offHeadersReceived(callback?)` 传原监听函数移除对应监听，省略时移除该事件全部监听；目标端支持范围见差异。

### saveFile

将临时文件保存为持久文件。

调用：`mpx.saveFile(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `tempFilePath` | `string` | 是 | — | 临时文件路径。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `savedFilePath` | `string` | — | 持久文件路径。 |

#### 使用注意

仅在提供该调用的宿主可用。微信当前文档使用 FileSystemManager.saveFile；不要将文件管理器的方法与 mpx.saveFile 的可用性混为一谈。

## 数据缓存

### setStorage

写入一项本地缓存。

调用：`mpx.setStorage(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `data` | `any` | 是 | — | 传入或返回的数据。 |
| `key` | `string` | 是 | — | 缓存键。 |
| `encrypt` | `boolean` | 否 | false | 是否开启加密存储。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### setStorageSync

同步写入一项本地缓存。

调用：`mpx.setStorageSync(key, data)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `key` | `string` | 是 | — | 缓存键。 |
| `data` | `any` | 是 | — | 传入或返回的数据。 |

#### 返回值

无。

### getStorage

读取一项本地缓存。

调用：`mpx.getStorage(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `key` | `string` | 是 | — | 缓存键。 |
| `encrypt` | `boolean` | 否 | false | 是否开启加密存储。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `data` | `any` | — | 传入或返回的数据。 |

### getStorageSync

同步读取一项本地缓存。

调用：`mpx.getStorageSync(key)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `key` | `string` | 是 | — | 缓存键。 |

#### 返回值

返回 `any`。

### getStorageInfo

获取缓存键及容量信息。

调用：`mpx.getStorageInfo(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `currentSize` | `number` | — | 已用缓存容量，单位 KB。 |
| `keys` | `string[]` | — | 缓存键列表。 |
| `limitSize` | `number` | — | 缓存容量上限，单位 KB。 |

### getStorageInfoSync

同步获取缓存键及容量信息。

调用：`mpx.getStorageInfoSync()`。

#### 入参

无。

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `currentSize` | `number` | — | 已用缓存容量，单位 KB。 |
| `keys` | `string[]` | — | 缓存键列表。 |
| `limitSize` | `number` | — | 缓存容量上限，单位 KB。 |

#### 使用注意

字段含义与 [getStorageInfo](#getstorageinfo) 相同。

### removeStorage

删除指定缓存键。

调用：`mpx.removeStorage(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `key` | `string` | 是 | — | 缓存键。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### removeStorageSync

同步删除指定缓存键。

调用：`mpx.removeStorageSync(key)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `key` | `string` | 是 | — | 缓存键。 |

#### 返回值

无。

### clearStorage

清空本地缓存。

调用：`mpx.clearStorage(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### clearStorageSync

同步清空本地缓存。

调用：`mpx.clearStorageSync()`。

#### 入参

无。

#### 返回值

无。

## 媒体

### previewImage

预览图片列表。

调用：`mpx.previewImage(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `urls` | `string[]` | 是 | — | 需要预览的图片链接列表。 |
| `current` | `string` | 否 | urls 的第一张 | 当前显示图片的链接。 |
| `referrerPolicy` | `string` | 否 | no-referrer | `origin`: 发送完整的referrer。 |
| `showmenu` | `boolean` | 否 | true | 是否显示长按菜单。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### compressImage

压缩图片并返回临时路径。

调用：`mpx.compressImage(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `src` | `string` | 是 | — | 图片路径，图片的路径，支持本地路径、代码包路径。 |
| `compressedHeight` | `number` | 否 | — | 压缩后图片的高度，单位为px，若不填写则默认以compressedWidth为准等比缩放。 |
| `compressedWidth` | `number` | 否 | — | 压缩后图片的宽度，单位为px，若不填写则默认以compressedHeight为准等比缩放。 |
| `quality` | `number` | 否 | 80 | 压缩质量，范围0～100，数值越小，质量越低，压缩率越高（仅对jpg有效）。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `tempFilePath` | `string` | — | 临时文件路径。 |

### getImageInfo

获取图片尺寸、格式和方向等信息。

调用：`mpx.getImageInfo(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `src` | `string` | 是 | — | 图片的路径，支持网络路径、本地路径、代码包路径。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `height` | `number` | — | 高度；布局使用 px。 |
| `orientation` | `'up' \| 'up-mirrored' \| 'down' \| 'down-mirrored' \| 'left-mirrored' \| 'right' \| 'right-mirrored' \| 'left'` | — | 拍照时设备方向。 |
| `path` | `string` | — | 页面路径。 |
| `type` | `'unknown' \| 'jpeg' \| 'png' \| 'gif' \| 'tiff'` | — | 类型标识，取值见本 API。 |
| `width` | `number` | — | 宽度；布局使用 px。 |

### chooseMedia

从相册或拍摄入口选择图片、视频。

调用：`mpx.chooseMedia(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `camera` | `'back' \| 'front'` | 否 | 'back' | 仅在 sourceType 为 camera 时生效，使用前置或后置摄像头。 |
| `count` | `number` | 否 | 9 | 最多可以选择的文件个数，基础库2.25.0前，最多可支持9个文件，2.25.0及以后最多可支持20个文件。 |
| `maxDuration` | `number` | 否 | 10 | 拍摄视频最长拍摄时间，单位秒。 |
| `mediaType` | `Array<'image' \| 'video' \| 'mix'>` | 否 | ['image', 'video'] | 文件类型。 |
| `sizeType` | `string[]` | 否 | ['original', 'compressed'] | 是否压缩所选文件，基础库2.25.0前仅对 mediaType 为 image 时有效，2.25.0及以后对全量 mediaType 有效。 |
| `sourceType` | `Array<'album' \| 'camera'>` | 否 | ['album', 'camera'] | 图片和视频选择的来源。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `tempFiles` | `Object[]` | — | 本地临时文件列表。 |
| `type` | `string` | — | 选择结果的媒体类型：image、video 或 mix。 |

`tempFiles[]` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `duration` | `number` | — | 视频的时间长度。 |
| `fileType` | `'image' \| 'video'` | — | 文件类型。 |
| `height` | `number` | — | 高度；布局使用 px。 |
| `size` | `number` | — | 本地临时文件大小，单位 B。 |
| `tempFilePath` | `string` | — | 临时文件路径。 |
| `thumbTempFilePath` | `string` | — | 视频缩略图临时文件路径。 |
| `width` | `number` | — | 宽度；布局使用 px。 |

### createInnerAudioContext

创建音频播放上下文。

调用：`mpx.createInnerAudioContext(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `useWebAudioImplement` | `boolean` | 否 | false | 启用适合短音频频繁播放的 WebAudio 模式。 |

#### 返回值

返回对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `autoplay` | `boolean` | — | 是否自动开始播放，默认为 `false`。 |
| `buffered` | `number` | — | 音频缓冲的时间点，仅保证当前播放时间点到此时间点内容已缓冲（只读）。 |
| `currentTime` | `number` | — | 当前音频的播放位置（单位 s）。 |
| `duration` | `number` | — | 当前音频的长度（单位 s）。 |
| `loop` | `boolean` | — | 是否循环播放，默认为 `false`。 |
| `obeyMuteSwitch` | `boolean` | — | 是否遵循系统静音开关，默认为 `true`。 |
| `paused` | `boolean` | — | 当前是是否暂停或停止状态（只读）。 |
| `playbackRate` | `number` | — | 播放速度。 |
| `referrerPolicy` | `string` | — | `origin`: 发送完整的referrer。 |
| `src` | `string` | — | 音频资源的地址，用于直接播放。 |
| `startTime` | `number` | — | 开始播放的位置（单位：s），默认为 0。 |
| `volume` | `number` | — | 音量。 |

#### 对象用法

下列方法均返回 `void`，不会返回 Promise 或取消监听函数；属性与方法的端限制见差异。

| 方法 | 参数与回调 |
| --- | --- |
| `play()` / `pause()` / `stop()` / `destroy()` | 无参数，分别播放、暂停、停止、销毁上下文。 |
| `seek(position)` | `position: number`，跳转到指定秒数；不通过给 currentTime 赋值跳转。 |
| `onPlay(callback)` / `onPause(callback)` / `onStop(callback)` / `onEnded(callback)` | 状态通知函数，可用无参回调；返回值不被消费。 |
| `onCanplay(callback)` / `onWaiting(callback)` / `onSeeking(callback)` / `onSeeked(callback)` / `onTimeUpdate(callback)` | 状态通知函数，可用无参回调；播放位置、时长从上下文 `currentTime/duration` 读取，不把它们当作回调直接返回的 number。 |
| `onError(callback)` | `(res) => void`，res 含 `errCode: number`、`errMsg: string`。 |
| `offPlay/offPause/offStop/offEnded/offCanplay/offWaiting/offSeeking/offSeeked/offTimeUpdate/offError(callback?)` | 对应事件的原监听函数；省略时移除该事件的全部监听。 |

### createVideoContext

取得视频组件的操作上下文。

调用：`mpx.createVideoContext(id, component?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 是 | — | video 组件的 id。 |
| `component` | `组件或页面实例` | 否 | — | 在自定义组件下，当前组件实例的this，以操作组件内 video 组件。 |

#### 返回值

返回 `VideoContext`。

#### 对象用法

下列方法均返回 `void`；播放进度、结束、错误等从 video 组件事件取得，端支持范围见差异。

| 方法 | 参数 |
| --- | --- |
| `play()` / `pause()` / `stop()` | 无参数，分别播放、暂停、停止。 |
| `seek(position)` | `position: number`，跳转位置，单位 s。 |
| `playbackRate(rate)` | `rate: number`，支持 `0.5/0.8/1/1.25/1.5/2` 倍速。 |
| `requestFullScreen(options)` / `exitFullScreen()` | 请求时传 `{ direction?: 0 \| 90 \| -90 }`，省略 direction 时按视频宽高选择方向；退出无参数。 |
| `showStatusBar()` / `hideStatusBar()` | 无参数，控制全屏下状态栏。 |
| `sendDanmu(data)` | `{ text: string, color?: string }`，发送弹幕文本及颜色。 |
| `requestBackgroundPlayback()` / `exitBackgroundPlayback()` | 无参数，进入 / 退出后台音频播放。 |
| `exitPictureInPicture(options?)` | 可选 `success/fail/complete` 回调配置，回调接收调用结果对象。 |

### createCameraContext

取得相机组件的操作上下文。

调用：`mpx.createCameraContext()`。

#### 入参

无。

#### 返回值

返回 `CameraContext`。

#### 对象用法

操作前需相机组件已就绪。下列方法均返回 `void`，options 均可带 `success/fail/complete` 回调；拍照、录像结果从各自 success 回调取得。

| 方法 | 业务参数 | 成功结果 |
| --- | --- | --- |
| `setZoom(options)` | 必填 `zoom: number`，范围为 1 到 camera 的 initdone 事件提供的 maxZoom。 | `{ zoom: number }`，实际设置的缩放值。 |
| `takePhoto(options)` | `quality?: 'high' \| 'normal' \| 'low' \| 'original'` 指定画质，`selfieMirror?: boolean` 控制镜像。 | `{ tempImagePath: string }`，照片临时路径。 |
| `startRecord(options)` | `timeout?: number` 为录制上限（s，最长 300），`selfieMirror?: boolean` 控制镜像；`timeoutCallback?: (res) => void` 在超时结束或异常退出时接收 `{ tempVideoPath: string, tempThumbPath: string }`。 | 开始录制的调用结果，不包含最终录像文件；文件从 stopRecord 或 timeoutCallback 取得。 |
| `stopRecord(options)` | `compressed?: boolean` 控制视频压缩。 | `{ tempVideoPath: string, tempThumbPath: string }`，视频及封面临时路径。 |

### canvasToTempFilePath

将画布区域导出为图片。

调用：`mpx.canvasToTempFilePath(options, component?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `canvas` | `Object` | 否 | — | 画布标识，传入 canvas 组件实例 （canvas type="2d" 时使用该属性）。 |
| `canvasId` | `string` | 否 | — | 画布标识，传入 canvas 组件的 canvas-id。 |
| `destHeight` | `number` | 否 | height*屏幕像素密度 | 输出的图片的高度。 |
| `destWidth` | `number` | 否 | width*屏幕像素密度 | 输出的图片的宽度。 |
| `fileType` | `'jpg' \| 'png'` | 否 | png | 目标文件的类型。 |
| `height` | `number` | 否 | canvas高度-y | 高度；布局使用 px。 |
| `quality` | `number` | 否 | — | 图片的质量，目前仅对 jpg 有效。 |
| `width` | `number` | 否 | canvas宽度-x | 宽度；布局使用 px。 |
| `x` | `number` | 否 | 0 | 指定的画布区域的左上角横坐标。 |
| `y` | `number` | 否 | 0 | 指定的画布区域的左上角纵坐标。 |

其他位置参数：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `component` | `组件或页面实例` | 否 | — | 在自定义组件下，当前组件实例的this，以操作组件内 canvas 组件。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `tempFilePath` | `string` | — | 临时文件路径。 |

### canvasGetImageData

读取画布指定区域的像素数据。

调用：`mpx.canvasGetImageData(options, component?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `canvasId` | `string` | 是 | — | 画布标识，传入 canvas 组件的 `canvas-id` 属性。 |
| `height` | `number` | 是 | — | 高度；布局使用 px。 |
| `width` | `number` | 是 | — | 宽度；布局使用 px。 |
| `x` | `number` | 是 | — | 将要被提取的图像数据矩形区域的左上角横坐标。 |
| `y` | `number` | 是 | — | 将要被提取的图像数据矩形区域的左上角纵坐标。 |

其他位置参数：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `component` | `组件或页面实例` | 否 | — | 在自定义组件下，当前组件实例的this，以操作组件内 canvas 组件。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `data` | `Uint8ClampedArray` | — | 传入或返回的数据。 |
| `height` | `number` | — | 高度；布局使用 px。 |
| `width` | `number` | — | 宽度；布局使用 px。 |

## 位置

### getLocation

获取一次地理位置。

调用：`mpx.getLocation(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `altitude` | `boolean` | 否 | false | 是否需要返回海拔高度。 |
| `highAccuracyExpireTime` | `number` | 否 | — | 高精度定位超时时间(ms)，指定时间内返回最高精度，该值3000ms以上高精度定位才有效果。 |
| `isHighAccuracy` | `boolean` | 否 | false | 开启高精度定位。 |
| `type` | `string` | 否 | wgs84 | 坐标类型：wgs84 或 gcj02。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `accuracy` | `number` | — | 位置精度，单位 m。 |
| `altitude` | `number` | — | 是否需要返回海拔高度。 |
| `horizontalAccuracy` | `number` | — | 水平精度，单位 m。 |
| `latitude` | `number` | — | 纬度，-90 到 90。 |
| `longitude` | `number` | — | 经度，-180 到 180。 |
| `speed` | `number` | — | 移动速度，单位 m/s。 |
| `verticalAccuracy` | `number` | — | 垂直精度，单位 m。 |

### openLocation

打开地图查看指定位置。

调用：`mpx.openLocation(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `latitude` | `number` | 是 | — | 纬度，-90 到 90。 |
| `longitude` | `number` | 是 | — | 经度，-180 到 180。 |
| `address` | `string` | 否 | — | 地址的详细说明。 |
| `name` | `string` | 否 | — | 位置名。 |
| `scale` | `number` | 否 | 18 | 缩放比例，范围5~18。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### chooseLocation

打开地图选择位置。

调用：`mpx.chooseLocation(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `latitude` | `number` | 否 | — | 纬度，-90 到 90。 |
| `longitude` | `number` | 否 | — | 经度，-180 到 180。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `address` | `string` | — | 详细地址。 |
| `latitude` | `number` | — | 纬度，-90 到 90。 |
| `longitude` | `number` | — | 经度，-180 到 180。 |
| `name` | `string` | — | 位置名称。 |

### startLocationUpdate

开始接收位置更新。

调用：`mpx.startLocationUpdate(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `type` | `'wgs84' \| 'gcj02'` | 否 | — | 持续定位的坐标系；wgs84 为 GPS 坐标，gcj02 可用于 openLocation。依赖坐标系时显式指定。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### stopLocationUpdate

停止位置更新。

调用：`mpx.stopLocationUpdate(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### onLocationChange

监听持续位置变化。

调用：`mpx.onLocationChange(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `accuracy` | `number` | — | 位置精度，单位 m。 |
| `altitude` | `number` | — | 海拔，单位 m。 |
| `horizontalAccuracy` | `number` | — | 水平精度，单位 m。 |
| `latitude` | `number` | — | 纬度，-90 到 90。 |
| `longitude` | `number` | — | 经度，-180 到 180。 |
| `speed` | `number` | — | 移动速度，单位 m/s。 |
| `verticalAccuracy` | `number` | — | 垂直精度，单位 m。 |

### offLocationChange

取消 onLocationChange 注册的监听。

调用：`mpx.offLocationChange(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

## 设备

### getNetworkType

读取当前网络类型。

调用：`mpx.getNetworkType(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `hasSystemProxy` | `boolean` | — | 设备是否使用了网络代理。 |
| `networkType` | `'wifi' \| '2g' \| '3g' \| '4g' \| '5g' \| 'unknown' \| 'none'` | — | 网络类型。 |
| `signalStrength` | `number` | — | 信号强度，范围和单位见宿主。 |
| `weakNet` | `boolean` | — | 是否处于弱网环境。 |

### onNetworkStatusChange

监听连接状态变化。

调用：`mpx.onNetworkStatusChange(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `isConnected` | `boolean` | — | 当前是否联网。 |
| `networkType` | `'wifi' \| '2g' \| '3g' \| '4g' \| '5g' \| 'unknown' \| 'none'` | — | 网络类型。 |

### offNetworkStatusChange

取消 onNetworkStatusChange 注册的监听。

调用：`mpx.offNetworkStatusChange(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### hideKeyboard

收起软键盘。

调用：`mpx.hideKeyboard(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### onKeyboardHeightChange

监听软键盘高度变化。

调用：`mpx.onKeyboardHeightChange(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `height` | `number` | — | 键盘高度，单位 px。 |

### offKeyboardHeightChange

取消 onKeyboardHeightChange 注册的监听。

调用：`mpx.offKeyboardHeightChange(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### makePhoneCall

打开拨号界面。

调用：`mpx.makePhoneCall(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `phoneNumber` | `string` | 是 | — | 需要拨打的电话号码。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### vibrateShort

触发短振动或触感反馈。

调用：`mpx.vibrateShort(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `type` | `'heavy' \| 'medium' \| 'light'` | 是 | — | 短振动强度，分别为强、中、弱。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### vibrateLong

触发长振动。

调用：`mpx.vibrateLong(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### setClipboardData

向剪贴板写入字符串。

调用：`mpx.setClipboardData(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `data` | `string` | 是 | — | 传入或返回的数据。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### getClipboardData

读取剪贴板内容。

调用：`mpx.getClipboardData(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `data` | `string` | — | 传入或返回的数据。 |

### setScreenBrightness

设置屏幕亮度。

调用：`mpx.setScreenBrightness(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `value` | `number` | 是 | — | 屏幕亮度，范围 0–1。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### getScreenBrightness

读取屏幕亮度。

调用：`mpx.getScreenBrightness(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `value` | `number` | — | 屏幕亮度，范围 0–1。 |

### setVisualEffectOnCapture

配置截屏或录屏时的视觉效果。

调用：`mpx.setVisualEffectOnCapture(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `visualEffect` | `string` | 否 | none | 截屏/录屏时的表现，仅支持 none / hidden，传入 hidden 则表示在截屏/录屏时隐藏屏幕。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### onUserCaptureScreen

监听用户截屏。

调用：`mpx.onUserCaptureScreen(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `promise` | `Promise<any>` | — | 如果该参数存在，则其它的参数将会以 resolve 结果为准，如果一秒内不 resolve，分享会使用上面传入的默认参数。 |
| `query` | `string` | — | 页面查询参数。 |

### offUserCaptureScreen

取消 onUserCaptureScreen 注册的监听。

调用：`mpx.offUserCaptureScreen()`。

#### 入参

无。

#### 返回值

无。

### addPhoneContact

向系统通讯录添加联系人。

调用：`mpx.addPhoneContact(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `firstName` | `string` | 是 | — | 名字。 |
| `addressCity` | `string` | 否 | — | 联系地址城市。 |
| `addressCountry` | `string` | 否 | — | 联系地址国家。 |
| `addressPostalCode` | `string` | 否 | — | 联系地址邮政编码。 |
| `addressState` | `string` | 否 | — | 联系地址省份。 |
| `addressStreet` | `string` | 否 | — | 联系地址街道。 |
| `email` | `string` | 否 | — | 电子邮件。 |
| `homeAddressCity` | `string` | 否 | — | 住宅地址城市。 |
| `homeAddressCountry` | `string` | 否 | — | 住宅地址国家。 |
| `homeAddressPostalCode` | `string` | 否 | — | 住宅地址邮政编码。 |
| `homeAddressState` | `string` | 否 | — | 住宅地址省份。 |
| `homeAddressStreet` | `string` | 否 | — | 住宅地址街道。 |
| `homeFaxNumber` | `string` | 否 | — | 住宅传真。 |
| `homePhoneNumber` | `string` | 否 | — | 住宅电话。 |
| `hostNumber` | `string` | 否 | — | 公司电话。 |
| `lastName` | `string` | 否 | — | 姓氏。 |
| `middleName` | `string` | 否 | — | 中间名。 |
| `mobilePhoneNumber` | `string` | 否 | — | 手机号。 |
| `nickName` | `string` | 否 | — | 昵称。 |
| `organization` | `string` | 否 | — | 公司。 |
| `photoFilePath` | `string` | 否 | — | 头像本地文件路径。 |
| `remark` | `string` | 否 | — | 备注。 |
| `title` | `string` | 否 | — | 职位。 |
| `url` | `string` | 否 | — | 目标地址或应用内页面路径。 |
| `weChatNumber` | `string` | 否 | — | 微信号。 |
| `workAddressCity` | `string` | 否 | — | 工作地址城市。 |
| `workAddressCountry` | `string` | 否 | — | 工作地址国家。 |
| `workAddressPostalCode` | `string` | 否 | — | 工作地址邮政编码。 |
| `workAddressState` | `string` | 否 | — | 工作地址省份。 |
| `workAddressStreet` | `string` | 否 | — | 工作地址街道。 |
| `workFaxNumber` | `string` | 否 | — | 工作传真。 |
| `workPhoneNumber` | `string` | 否 | — | 工作电话。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### scanCode

打开扫码入口并返回识别结果。

调用：`mpx.scanCode(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `onlyFromCamera` | `boolean` | 否 | false | 是否只能从相机扫码，不允许从相册选择图片。 |
| `scanType` | `Array< 'barCode' \| 'qrCode' \| 'wxCode' \| 'datamatrix' \| 'pdf417' >` | 否 | ['barCode', 'qrCode', 'wxCode'] | 扫码类型。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `charSet` | `string` | — | 所扫码的字符集。 |
| `path` | `string` | — | 页面路径。 |
| `rawData` | `string` | — | 原始数据，base64编码。 |
| `result` | `string` | — | 所扫码的内容。 |
| `scanType` | `'QR_CODE' \| 'AZTEC' \| 'CODABAR' \| 'CODE_39' \| 'CODE_93' \| 'CODE_128' \| 'DATA_MATRIX' \| 'EAN_8' \| 'EAN_13' \| 'ITF' \| 'MAXICODE' \| 'PDF_417' \| 'RSS_14' \| 'RSS_EXPANDED' \| 'UPC_A' \| 'UPC_E' \| 'UPC_EAN_EXTENSION' \| 'WX_CODE' \| 'CODE_25'` | — | 所扫码的类型。 |

## 低功耗蓝牙

### openBluetoothAdapter

初始化蓝牙模块。

调用：`mpx.openBluetoothAdapter(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `mode` | `'central' \| 'peripheral'` | 否 | central | 蓝牙模式，可作为主/从设备，仅 iOS 需要。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### closeBluetoothAdapter

关闭蓝牙模块。

调用：`mpx.closeBluetoothAdapter(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### startBluetoothDevicesDiscovery

开始扫描附近蓝牙设备。

调用：`mpx.startBluetoothDevicesDiscovery(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `allowDuplicatesKey` | `boolean` | 否 | false | 是否允许重复上报同一设备。 |
| `interval` | `number` | 否 | 0 | 上报设备的间隔，单位 ms。 |
| `powerLevel` | `'low' \| 'medium' \| 'high'` | 否 | medium | 扫描模式，越高扫描越快，也越耗电。 |
| `services` | `string[]` | 否 | — | 服务列表或服务 UUID 筛选条件。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### stopBluetoothDevicesDiscovery

停止蓝牙扫描。

调用：`mpx.stopBluetoothDevicesDiscovery(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### onBluetoothDeviceFound

监听扫描发现的设备。

调用：`mpx.onBluetoothDeviceFound(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `devices` | `Object[]` | — | 设备对象数组。 |

`devices[]` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `RSSI` | `number` | — | 当前蓝牙设备的信号强度，单位 dBm。 |
| `advertisData` | `ArrayBuffer` | — | 当前蓝牙设备的广播数据段中的 ManufacturerData 数据段。 |
| `advertisServiceUUIDs` | `string[]` | — | 当前蓝牙设备的广播数据段中的 ServiceUUIDs 数据段。 |
| `connectable` | `boolean` | — | 当前蓝牙设备是否可连接（ Android 8.0 以下不支持返回该值 ）。 |
| `deviceId` | `string` | — | 蓝牙设备标识。 |
| `localName` | `string` | — | 当前蓝牙设备的广播数据段中的 LocalName 数据段。 |
| `name` | `string` | — | 蓝牙设备名称，某些设备可能没有。 |
| `serviceData` | `Object` | — | 当前蓝牙设备的广播数据段中的 ServiceData 数据段。 |

### offBluetoothDeviceFound

取消 onBluetoothDeviceFound 注册的监听。

调用：`mpx.offBluetoothDeviceFound()`。

#### 入参

无。

#### 返回值

无。

### getConnectedBluetoothDevices

获取提供指定服务的已连接设备。

调用：`mpx.getConnectedBluetoothDevices(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `services` | `string[]` | 是 | — | 服务列表或服务 UUID 筛选条件。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `devices` | `Object[]` | — | 设备对象数组。 |

`devices[]` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `deviceId` | `string` | — | 蓝牙设备标识。 |
| `name` | `string` | — | 蓝牙设备名称，某些设备可能没有。 |

### getBluetoothAdapterState

获取蓝牙可用和扫描状态。

调用：`mpx.getBluetoothAdapterState(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `available` | `boolean` | — | 蓝牙适配器是否可用。 |
| `discovering` | `boolean` | — | 是否正在搜索设备。 |

### onBluetoothAdapterStateChange

监听蓝牙状态变化。

调用：`mpx.onBluetoothAdapterStateChange(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `available` | `boolean` | — | 蓝牙适配器是否可用。 |
| `discovering` | `boolean` | — | 蓝牙适配器是否处于搜索状态。 |

### offBluetoothAdapterStateChange

取消 onBluetoothAdapterStateChange 注册的监听。

调用：`mpx.offBluetoothAdapterStateChange()`。

#### 入参

无。

#### 返回值

无。

### getBluetoothDevices

获取当前已发现的蓝牙设备。

调用：`mpx.getBluetoothDevices(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `devices` | `Object[]` | — | 设备对象数组。 |

`devices[]` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `RSSI` | `number` | — | 当前蓝牙设备的信号强度，单位 dBm。 |
| `advertisData` | `ArrayBuffer` | — | 当前蓝牙设备的广播数据段中的 ManufacturerData 数据段。 |
| `advertisServiceUUIDs` | `string[]` | — | 当前蓝牙设备的广播数据段中的 ServiceUUIDs 数据段。 |
| `connectable` | `boolean` | — | 当前蓝牙设备是否可连接（ Android 8.0 以下不支持返回该值 ）。 |
| `deviceId` | `string` | — | 蓝牙设备标识。 |
| `localName` | `string` | — | 当前蓝牙设备的广播数据段中的 LocalName 数据段。 |
| `name` | `string` | — | 蓝牙设备名称，某些设备可能没有。 |
| `serviceData` | `Object` | — | 当前蓝牙设备的广播数据段中的 ServiceData 数据段。 |

### createBLEConnection

连接指定 BLE 设备。

调用：`mpx.createBLEConnection(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |
| `timeout` | `number` | 否 | — | 超时时间，单位 ms。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### closeBLEConnection

断开指定 BLE 设备。

调用：`mpx.closeBLEConnection(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### onBLEConnectionStateChange

监听 BLE 连接状态。

调用：`mpx.onBLEConnectionStateChange(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `connected` | `boolean` | — | 是否处于已连接状态。 |
| `deviceId` | `string` | — | 蓝牙设备标识。 |

### offBLEConnectionStateChange

取消 onBLEConnectionStateChange 注册的监听。

调用：`mpx.offBLEConnectionStateChange(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### writeBLECharacteristicValue

向特征写入二进制数据。

调用：`mpx.writeBLECharacteristicValue(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `characteristicId` | `string` | 是 | — | 特征 UUID。 |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |
| `serviceId` | `string` | 是 | — | 服务 UUID。 |
| `value` | `ArrayBuffer` | 是 | — | 写入特征的二进制数据。 |
| `writeType` | `'write' \| 'writeNoResponse'` | 否 | — | 蓝牙特征值的写模式设置，有两种模式，iOS 优先 write，安卓优先 writeNoResponse。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### readBLECharacteristicValue

发起特征读取；结果通过特征变化监听交付。

调用：`mpx.readBLECharacteristicValue(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `characteristicId` | `string` | 是 | — | 特征 UUID。 |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |
| `serviceId` | `string` | 是 | — | 服务 UUID。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

#### 使用注意

微信基准中，读取成功不直接返回 value；在 onBLECharacteristicValueChange 接收读取结果。

### notifyBLECharacteristicValueChange

开启或关闭特征值通知。

调用：`mpx.notifyBLECharacteristicValueChange(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `characteristicId` | `string` | 是 | — | 特征 UUID。 |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |
| `serviceId` | `string` | 是 | — | 服务 UUID。 |
| `state` | `boolean` | 是 | — | 是否启用 notify。 |
| `type` | `'notification' \| 'indication'` | 否 | indication | 特征订阅类型，需与该特征支持的通知方式匹配。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### onBLECharacteristicValueChange

监听特征值变化和读取结果。

调用：`mpx.onBLECharacteristicValueChange(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `characteristicId` | `string` | — | 特征 UUID。 |
| `deviceId` | `string` | — | 蓝牙设备标识。 |
| `serviceId` | `string` | — | 服务 UUID。 |
| `value` | `ArrayBuffer` | — | 数值或二进制值，含义见本 API。 |

### offBLECharacteristicValueChange

取消 onBLECharacteristicValueChange 注册的监听。

调用：`mpx.offBLECharacteristicValueChange()`。

#### 入参

无。

#### 返回值

无。

### setBLEMTU

协商传输单元大小。

调用：`mpx.setBLEMTU(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |
| `mtu` | `number` | 是 | — | 最大传输单元。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `mtu` | `number` | — | 最终协商的 MTU 值，与传入参数一致。 |

### getBLEDeviceRSSI

读取设备信号强度。

调用：`mpx.getBLEDeviceRSSI(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `RSSI` | `number` | — | 信号强度，单位 dBm。 |

### getBLEDeviceServices

查询设备的服务。

调用：`mpx.getBLEDeviceServices(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `services` | `Object[]` | — | 服务列表或服务 UUID 筛选条件。 |

`services[]` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `isPrimary` | `boolean` | — | 该服务是否为主服务。 |
| `uuid` | `string` | — | 蓝牙设备服务的 UUID。 |

### getBLEDeviceCharacteristics

查询指定服务的特征。

调用：`mpx.getBLEDeviceCharacteristics(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `deviceId` | `string` | 是 | — | 蓝牙设备标识。 |
| `serviceId` | `string` | 是 | — | 服务 UUID。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `characteristics` | `Object[]` | — | 特征对象数组。 |

`characteristics[]` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `properties` | `Object` | — | 该特征支持的操作类型。 |
| `uuid` | `string` | — | 蓝牙设备特征的 UUID。 |

## Wi-Fi

### startWifi

初始化 Wi-Fi 能力。

调用：`mpx.startWifi(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### stopWifi

停止 Wi-Fi 能力。

调用：`mpx.stopWifi(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### getWifiList

请求扫描热点，列表通过 onGetWifiList 交付。

调用：`mpx.getWifiList(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

#### 使用注意

success 只表示扫描请求成功，热点数组从 onGetWifiList 获得。

### onGetWifiList

监听扫描到的热点列表。

调用：`mpx.onGetWifiList(callback)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 是 | — | 事件发生时调用的函数。 |

#### 返回值

无同步返回值。

#### 监听回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `wifiList` | `Object[]` | — | 热点对象数组。 |

`wifiList[]` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `BSSID` | `string` | — | Wi-Fi 的 BSSID。 |
| `SSID` | `string` | — | Wi-Fi 的 SSID。 |
| `frequency` | `number` | — | Wi-Fi 频段单位 MHz。 |
| `secure` | `boolean` | — | Wi-Fi 是否安全。 |
| `signalStrength` | `number` | — | 信号强度，范围和单位见宿主。 |

### offGetWifiList

取消 onGetWifiList 注册的监听。

调用：`mpx.offGetWifiList(callback?)`。

#### 入参

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `callback` | `function` | 否 | — | 与注册时相同的函数。 |

#### 返回值

无。

### getConnectedWifi

获取当前连接的 Wi-Fi。

调用：`mpx.getConnectedWifi(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `partialInfo` | `boolean` | 否 | false | 是否需要返回部分 Wi-Fi 信息。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `wifi` | `Object` | — | 当前连接的热点信息。 |

`wifi` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `BSSID` | `string` | — | Wi-Fi 的 BSSID。 |
| `SSID` | `string` | — | Wi-Fi 的 SSID。 |
| `frequency` | `number` | — | Wi-Fi 频段单位 MHz。 |
| `secure` | `boolean` | — | Wi-Fi 是否安全。 |
| `signalStrength` | `number` | — | 信号强度，范围和单位见宿主。 |

## 开放能力

### login

获取宿主登录凭证。

调用：`mpx.login(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `timeout` | `number` | 否 | — | 超时时间，单位 ms。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `code` | `string` | — | 用户登录凭证（有效期五分钟）。 |

### checkSession

检查宿主登录会话是否仍有效。

调用：`mpx.checkSession(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### getUserInfo

获取宿主可提供的用户信息。

调用：`mpx.getUserInfo(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `lang` | `'en' \| 'zh_CN' \| 'zh_TW'` | 否 | en | 显示用户信息的语言。 |
| `withCredentials` | `boolean` | 否 | — | 是否带上登录态信息。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `cloudID` | `string` | — | 敏感数据对应的云 ID，开通云开发的小程序才会返回，可通过云调用直接获取开放数据，详细见云调用直接获取开放数据。 |
| `encryptedData` | `string` | — | 包括敏感数据在内的完整用户信息的加密数据，详见 用户数据的签名验证和加解密。 |
| `iv` | `string` | — | 加密算法的初始向量，详见 用户数据的签名验证和加解密。 |
| `rawData` | `string` | — | 不包括敏感信息的原始数据字符串，用于计算签名。 |
| `signature` | `string` | — | 使用 sha1( rawData + sessionkey ) 得到字符串，用于校验用户信息，详见 用户数据的签名验证和加解密。 |
| `userInfo` | `Object` | — | 用户信息对象，不含 openid。 |

`userInfo` 常用字段：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `avatarUrl` | `string` | — | 用户头像图片的 URL。 |
| `city` | `string` | — | 用户所在城市。 |
| `country` | `string` | — | 用户所在国家。 |
| `gender` | `0 \| 1 \| 2` | — | 用户性别。 |
| `language` | `'en' \| 'zh_CN' \| 'zh_TW'` | — | 显示 country，province，city 所用的语言。 |
| `nickName` | `string` | — | 用户昵称。 |
| `province` | `string` | — | 用户所在省份。 |

#### 使用注意

微信当前授权规则可能返回匿名头像、昵称等受限信息；不能依赖此 API 获得真实昵称或头像，具体以官方用法说明为准。

### requestPayment

发起宿主支付。

调用：`mpx.requestPayment(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `nonceStr` | `string` | 是 | — | 随机字符串，长度为32个字符以下。 |
| `package` | `string` | 是 | — | 统一下单接口返回的 prepay_id 参数值，提交格式如：prepay_id=。 |
| `paySign` | `string` | 是 | — | 签名，具体见微信支付文档。 |
| `timeStamp` | `string` | 是 | — | 时间戳，从 1970 年 1 月 1 日 00:00:00 至今的秒数，即当前的时间。 |
| `signType` | `'MD5' \| 'HMAC-SHA256' \| 'RSA'` | 否 | MD5 | 签名算法，应与后台下单时的值一致。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### getSetting

读取当前授权设置。

调用：`mpx.getSetting(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `withSubscriptions` | `boolean` | 否 | false | 是否同时获取用户订阅消息的订阅状态，默认不获取。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `authSetting` | `Object` | — | 授权项与授权状态的映射。 |
| `subscriptionsSetting` | `Object` | — | SubscriptionsSetting 用户订阅消息设置，接口参数`withSubscriptions`值为`true`时才会返回。 |
| `miniprogramAuthSetting` | `Object` | — | AuthSetting 在插件中调用时，当前宿主小程序的用户授权结果。 |

### openSetting

打开授权设置界面。

调用：`mpx.openSetting(options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `withSubscriptions` | `boolean` | 否 | false | 是否同时获取用户订阅消息的订阅状态，默认不获取。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `authSetting` | `Object` | — | 授权项与授权状态的映射。 |
| `subscriptionsSetting` | `Object` | — | SubscriptionsSetting 用户订阅消息设置，接口参数`withSubscriptions`值为`true`时才会返回。 |

### enableAlertBeforeUnload

开启离开页面前的确认提示。

调用：`mpx.enableAlertBeforeUnload(options)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `message` | `string` | 是 | — | 询问对话框内容。 |

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### disableAlertBeforeUnload

取消离页确认提示。

调用：`mpx.disableAlertBeforeUnload(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

成功结果无额外业务字段，使用通用调用结果信息。

### getExtConfig

读取宿主扩展配置。

调用：`mpx.getExtConfig(options?)`。

#### 入参

仅通用回调，无额外业务参数。

#### 返回值

无业务同步返回值；异步结果通过 success 或 Promise 交付。

#### 成功回调参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `extConfig` | `Object` | — | 扩展配置对象。 |

### getExtConfigSync

同步读取宿主扩展配置。

调用：`mpx.getExtConfigSync()`。

#### 入参

无。

#### 返回值

返回 `Object`。

## WXML

### createSelectorQuery

创建节点查询对象。

调用：`mpx.createSelectorQuery()`。

#### 入参

无。

#### 返回值

返回 `SelectorQuery`。

#### 对象用法

| 方法 | 参数与结果 |
| --- | --- |
| `query.in(component)` | component 为页面或组件实例，设置查询范围，返回当前 `SelectorQuery`。 |
| `query.select(selector)` / `query.selectAll(selector)` / `query.selectViewport()` | selector 为 CSS 选择器 string；视口查询无参数。返回 `NodesRef`，分别选首个节点、全部匹配节点或视口。 |
| `nodes.boundingClientRect(callback?)` | `(res) => void`；res 含 `id: string`、`dataset: object`，及 number 类型的 `left/right/top/bottom/width/height`（px）。返回所属 `SelectorQuery`。 |
| `nodes.scrollOffset(callback?)` | `(res) => void`；res 含 id/dataset，及 number 类型的 `scrollLeft/scrollTop/scrollWidth/scrollHeight`（px）。返回所属 `SelectorQuery`。 |
| `nodes.fields(options, callback?)` | options 的 `id/dataset/rect/size/scrollOffset/context/node` 为可选 boolean，`properties/computedStyle` 为可选 `string[]`；开启的字段才查询。`callback(res)` 接收选定的字段，返回所属 `SelectorQuery`。 |
| `nodes.context(callback?)` / `nodes.node(callback?)` | `(res) => void`，res 分别为 `{ context }` / `{ node }`，对象类型取决于目标组件；方法返回所属 `SelectorQuery`。 |
| `query.exec(callback?)` | 执行已登记查询，无业务同步返回值；`callback(results)` 按登记顺序接收结果数组。不通过返回值读取节点数据或继续链式调用。 |

上述查询回调的返回值不被消费；`selectAll` 的节点结果为数组，无匹配时为 `[]`，`select` 无匹配时为 `null`。查询未匹配、组件类型不具备所查询能力时，先检查结果再访问字段，端差异见对应参考。

#### 使用注意

先 select/selectAll/selectViewport，再选择查询字段，最后 exec。查询依赖节点已渲染；框架队列执行完不等于小程序宿主渲染完成，等待方式见 [视图更新与 watch 回调](./script-reference.md#视图更新与-watch-回调)。

### createIntersectionObserver

创建节点与参照区域的相交观察器。

调用：`mpx.createIntersectionObserver(component, options?)`。

#### 入参

配置对象中的业务字段：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `initialRatio` | `number` | 否 | 0 | 初始相交比例，用于决定首次回调。 |
| `nativeMode` | `boolean` | 否 | false | 是否使用原生观察模式。 |
| `observeAll` | `boolean` | 否 | false | 是否观察全部匹配节点。 |
| `thresholds` | `number[]` | 否 | [0] | 触发相交回调的比例阈值数组。 |

其他位置参数：

| 属性 | 类型 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `component` | `Object` | 是 | — | 自定义组件实例。 |

#### 返回值

返回 `IntersectionObserver`。

#### 对象用法

| 方法 | 参数与返回值 |
| --- | --- |
| `relativeTo(selector, margins?)` | selector 为 string；margins 可含 number 类型的 top/right/bottom/left，默认均为 0，单位 px。返回当前 `IntersectionObserver`。 |
| `relativeToViewport(margins?)` | margins 同上，相对视口观察；返回当前 `IntersectionObserver`。 |
| `observe(selector, callback)` | selector 为目标节点的选择器 string；`callback(res)` 接收 `id: string`、`dataset: object`、`intersectionRatio: number`（0–1）、`time: number`（ms 时间戳），以及 `intersectionRect/boundingClientRect/relativeRect` 矩形对象。三个矩形均含 number 类型的 `left/right/top/bottom`，前两个另含 `width/height`，单位均为 px。方法与回调均返回 `void`。 |
| `disconnect()` | 无参数，停止观察并释放监听，返回 `void`。 |

#### 使用注意

需先设置 relativeTo 或 relativeToViewport，再 observe；不再观察时 disconnect。
