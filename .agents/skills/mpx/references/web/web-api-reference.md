# Web 环境 API 差异

本页比较 [API 基准](../base/api-reference.md) 中 API、参数字段、返回字段和对象方法的支持情况，以及字段类型与默认值。支持范围、类型和默认值均与基准一致时，索引直接标为“基准”。

## 目录

- [使用说明](#使用说明)
- [基础](#基础)
  - [base64ToArrayBuffer](../base/api-reference.md#base64toarraybuffer)（基准）
  - [arrayBufferToBase64](../base/api-reference.md#arraybuffertobase64)（基准）
  - [getSystemInfo](#getsysteminfo)
  - [getSystemInfoSync](#getsysteminfosync)
  - [getWindowInfo](#getwindowinfo)
  - [getDeviceInfo](#getdeviceinfo)
  - [getEnterOptionsSync](#getenteroptionssync)
  - [getLaunchOptionsSync](#getlaunchoptionssync)
  - [onAppShow](#onappshow)
  - [onAppHide](#onapphide)
  - [offAppShow](../base/api-reference.md#offappshow)（基准）
  - [offAppHide](../base/api-reference.md#offapphide)（基准）
  - [onError](#onerror)
  - [offError](../base/api-reference.md#offerror)（基准）
  - [onUnhandledRejection](#onunhandledrejection)
  - [offUnhandledRejection](../base/api-reference.md#offunhandledrejection)（基准）
- [路由](#路由)
  - [navigateTo](../base/api-reference.md#navigateto)（基准）
  - [redirectTo](../base/api-reference.md#redirectto)（基准）
  - [reLaunch](../base/api-reference.md#relaunch)（基准）
  - [navigateBack](../base/api-reference.md#navigateback)（基准）
  - [switchTab](../base/api-reference.md#switchtab)（基准）
- [界面](#界面)
  - [showActionSheet](#showactionsheet)
  - [showModal](#showmodal)
  - [showToast](#showtoast)
  - [hideToast](#hidetoast)
  - [showLoading](#showloading)
  - [hideLoading](#hideloading)
  - [setNavigationBarTitle](../base/api-reference.md#setnavigationbartitle)（基准）
  - [setNavigationBarColor](#setnavigationbarcolor)
  - [pageScrollTo](../base/api-reference.md#pagescrollto)（基准）
  - [startPullDownRefresh](../base/api-reference.md#startpulldownrefresh)（基准）
  - [stopPullDownRefresh](../base/api-reference.md#stoppulldownrefresh)（基准）
  - [createAnimation](../base/api-reference.md#createanimation)（基准）
  - [nextTick](../base/api-reference.md#nexttick)（基准）
  - [onWindowResize](../base/api-reference.md#onwindowresize)（基准）
  - [offWindowResize](../base/api-reference.md#offwindowresize)（基准）
  - [setTabBarItem](../base/api-reference.md#settabbaritem)（基准）
  - [setTabBarStyle](../base/api-reference.md#settabbarstyle)（基准）
  - [showTabBar](#showtabbar)
  - [hideTabBar](#hidetabbar)
- [网络](#网络)
  - [request](#request)
  - [connectSocket](#connectsocket)
- [数据缓存](#数据缓存)
  - [setStorage](#setstorage)
  - [setStorageSync](../base/api-reference.md#setstoragesync)（基准）
  - [getStorage](#getstorage)
  - [getStorageSync](../base/api-reference.md#getstoragesync)（基准）
  - [getStorageInfo](#getstorageinfo)
  - [getStorageInfoSync](#getstorageinfosync)
  - [removeStorage](../base/api-reference.md#removestorage)（基准）
  - [removeStorageSync](../base/api-reference.md#removestoragesync)（基准）
  - [clearStorage](../base/api-reference.md#clearstorage)（基准）
  - [clearStorageSync](../base/api-reference.md#clearstoragesync)（基准）
- [媒体](#媒体)
  - [previewImage](#previewimage)
  - [getImageInfo](#getimageinfo)
  - [createInnerAudioContext](#createinneraudiocontext)
  - [createVideoContext](#createvideocontext)
- [位置](#位置)
  - [getLocation](#getlocation)
- [设备](#设备)
  - [getNetworkType](#getnetworktype)
  - [onNetworkStatusChange](../base/api-reference.md#onnetworkstatuschange)（基准）
  - [offNetworkStatusChange](../base/api-reference.md#offnetworkstatuschange)（基准）
- [WXML](#wxml)
  - [createSelectorQuery](#createselectorquery)
  - [createIntersectionObserver](#createintersectionobserver)
- [不支持 API 与降级处理](#不支持-api-与降级处理)

## 使用说明

- 整体不支持的 API 集中列在文末“不支持 API 与降级处理”章节；仅部分平台、参数、返回字段或对象方法不支持的 API 保留在原分类中，以“差异类型｜说明”表格描述。
- 未支持的字段归入“不支持的返回字段”，不作为类型差异描述。
- 类型差异描述已支持字段的有效返回值类型；正常可空返回值保留 `string | null` 等说明，不能仅凭某次返回 null 判为不支持。额外字段不影响基准字段的对齐。
- 暂不比较行为差异、取值含义、计算方式、触发时机和使用条件；不同含义的数值若类型相同，不据此增加差异。
- 仅列确实不同的默认值，不重复默认值相同的条目。

## 基础

### getSystemInfo

[基准用法](../base/api-reference.md#getsysteminfo)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `deviceOrientation`、`enableDebug`、`host`、`locationReducedAccuracy`、`phoneCalendarAuthorized`、`theme`、`version`、`fontSizeSetting`、`SDKVersion`、`benchmarkLevel`、`albumAuthorized`、`cameraAuthorized`、`locationAuthorized`、`microphoneAuthorized`、`notificationAlertAuthorized`、`notificationAuthorized`、`notificationBadgeAuthorized`、`notificationSoundAuthorized`、`bluetoothEnabled`、`locationEnabled`、`wifiEnabled`、`statusBarHeight`、`safeArea`。 |

### getSystemInfoSync

[基准用法](../base/api-reference.md#getsysteminfosync)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `deviceOrientation`、`enableDebug`、`host`、`locationReducedAccuracy`、`phoneCalendarAuthorized`、`theme`、`version`、`fontSizeSetting`、`SDKVersion`、`benchmarkLevel`、`albumAuthorized`、`cameraAuthorized`、`locationAuthorized`、`microphoneAuthorized`、`notificationAlertAuthorized`、`notificationAuthorized`、`notificationBadgeAuthorized`、`notificationSoundAuthorized`、`bluetoothEnabled`、`locationEnabled`、`wifiEnabled`、`statusBarHeight`、`safeArea`。 |

### getWindowInfo

[基准用法](../base/api-reference.md#getwindowinfo)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `statusBarHeight`、`safeArea`、`screenTop`。 |

### getDeviceInfo

[基准用法](../base/api-reference.md#getdeviceinfo)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `abi`、`deviceAbi`、`benchmarkLevel`、`cpuType`、`memorySize`。 |

### getEnterOptionsSync

[基准用法](../base/api-reference.md#getenteroptionssync)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `apiCategory`、`chatType`、`forwardMaterials`、`hostExtraData`。 |

### getLaunchOptionsSync

[基准用法](../base/api-reference.md#getlaunchoptionssync)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `apiCategory`、`chatType`、`forwardMaterials`、`hostExtraData`。 |

### onAppShow

[基准用法](../base/api-reference.md#onappshow)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `apiCategory`、`chatType`、`forwardMaterials`、`hostExtraData`。 |

### onAppHide

[基准用法](../base/api-reference.md#onapphide)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `reason`。 |

### onError

[基准用法](../base/api-reference.md#onerror)

| 差异类型 | 说明 |
| --- | --- |
| 类型差异 | `回调参数`：基准类型为 `Object`；Web 类型为 `Error \| undefined`。 |

### onUnhandledRejection

[基准用法](../base/api-reference.md#onunhandledrejection)

| 差异类型 | 说明 |
| --- | --- |
| 类型差异 | `reason`：基准类型为 `string`；Web 类型为 `any`（原始拒绝值，不限于字符串）。 |

## 路由

本类支持范围、类型与默认值沿用基准。

## 界面

### showActionSheet

[基准用法](../base/api-reference.md#showactionsheet)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `alertText`。 |

### showModal

[基准用法](../base/api-reference.md#showmodal)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `editable`、`placeholderText`。 |
| 不支持的返回字段 | `content`。 |

### showToast

[基准用法](../base/api-reference.md#showtoast)

| 差异类型 | 说明 |
| --- | --- |
| 默认值差异 | `title`：基准默认值为 必填，无默认值；Web 默认值为 `''`（可省略）。 |

### hideToast

[基准用法](../base/api-reference.md#hidetoast)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `noConflict`。 |

### showLoading

[基准用法](../base/api-reference.md#showloading)

| 差异类型 | 说明 |
| --- | --- |
| 默认值差异 | `title`：基准默认值为 必填，无默认值；Web 默认值为 `''`（可省略）。 |

### hideLoading

[基准用法](../base/api-reference.md#hideloading)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `noConflict`。 |

### setNavigationBarColor

[基准用法](../base/api-reference.md#setnavigationbarcolor)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `animation`。 |

### showTabBar

[基准用法](../base/api-reference.md#showtabbar)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `animation`。 |

### hideTabBar

[基准用法](../base/api-reference.md#hidetabbar)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `animation`。 |

## 网络

### request

[基准用法](../base/api-reference.md#request)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `enableCache`、`enableChunked`、`enableHttp2`、`enableHttpDNS`、`enableHttpDNSFallback`、`enableProfile`、`enableQuic`、`forceCellularNetwork`、`httpDNSServiceId`、`httpDNSTimeout`、`redirect`、`useHighPerformanceMode`。 |
| 不支持的返回字段 | `useHttpDNS`、`cookies`、`profile`、`exception`。 |
| 不支持的对象方法 | RequestTask 的 `onHeadersReceived`、`offHeadersReceived`、`onChunkReceived`、`offChunkReceived`。 |

### connectSocket

[基准用法](../base/api-reference.md#connectsocket)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `header`、`forceCellularNetwork`、`timeout`、`tcpNoDelay`、`perMessageDeflate`。 |
| 不支持的返回字段 | SocketTask 的 `onOpen` 回调中的 `header`。 |

## 数据缓存

### setStorage

[基准用法](../base/api-reference.md#setstorage)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `encrypt`。 |

### getStorage

[基准用法](../base/api-reference.md#getstorage)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `encrypt`。 |

### getStorageInfo

[基准用法](../base/api-reference.md#getstorageinfo)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `currentSize`、`limitSize`。 |

### getStorageInfoSync

[基准用法](../base/api-reference.md#getstorageinfosync)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `currentSize`、`limitSize`。 |

## 媒体

### previewImage

[基准用法](../base/api-reference.md#previewimage)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `showmenu`、`referrerPolicy`。 |

### getImageInfo

[基准用法](../base/api-reference.md#getimageinfo)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `path`、`orientation`、`type`。 |

### createInnerAudioContext

[基准用法](../base/api-reference.md#createinneraudiocontext)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `useWebAudioImplement`。 |
| 不支持的返回字段 | 音频上下文的 `startTime`、`obeyMuteSwitch`、`playbackRate`、`referrerPolicy`。 |
| 类型差异 | `buffered`：基准类型为 `number`；Web 类型为 `TimeRanges`。 |

### createVideoContext

[基准用法](../base/api-reference.md#createvideocontext)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的对象方法 | `sendDanmu`、`requestBackgroundPlayback`、`exitBackgroundPlayback`、`exitPictureInPicture`。 |

## 位置

### getLocation

[基准用法](../base/api-reference.md#getlocation)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `type`、`altitude`、`highAccuracyExpireTime`。 |
| 不支持的返回字段 | `altitude`、`horizontalAccuracy`、`verticalAccuracy`。 |
| 类型差异 | `speed`：基准类型为 `number`；Web 类型为 `number \| null`。 |

## 设备

### getNetworkType

[基准用法](../base/api-reference.md#getnetworktype)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `signalStrength`、`hasSystemProxy`、`weakNet`。 |

## WXML

### createSelectorQuery

[基准用法](../base/api-reference.md#createselectorquery)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `fields.context`。 |
| 不支持的对象方法 | `NodesRef.context`。 |

### createIntersectionObserver

[基准用法](../base/api-reference.md#createintersectionobserver)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `nativeMode`。 |

## 不支持 API 与降级处理

以下 API 在当前 Web 内置适配中不支持。需要时可将浏览器能力或业务实现通过 [API Proxy 自定义扩展](../base/api-reference.md#自定义-api-扩展)接入，使用 `custom.web` 注册，并通过条件编译隔离平台依赖。列表链接用于查阅基准契约，不代表目标端已支持；自定义实现的支持范围与调用契约以业务适配为准。

- [canIUse](../base/api-reference.md#caniuse)
- [onLazyLoadError](../base/api-reference.md#onlazyloaderror)
- [offLazyLoadError](../base/api-reference.md#offlazyloaderror)
- [hideHomeButton](../base/api-reference.md#hidehomebutton)
- [getMenuButtonBoundingClientRect](../base/api-reference.md#getmenubuttonboundingclientrect)
- [sendSocketMessage](../base/api-reference.md#sendsocketmessage)
- [closeSocket](../base/api-reference.md#closesocket)
- [onSocketOpen](../base/api-reference.md#onsocketopen)
- [onSocketError](../base/api-reference.md#onsocketerror)
- [onSocketMessage](../base/api-reference.md#onsocketmessage)
- [onSocketClose](../base/api-reference.md#onsocketclose)
- [downloadFile](../base/api-reference.md#downloadfile)
- [uploadFile](../base/api-reference.md#uploadfile)
- [saveFile](../base/api-reference.md#savefile)
- [compressImage](../base/api-reference.md#compressimage)
- [chooseMedia](../base/api-reference.md#choosemedia)
- [createCameraContext](../base/api-reference.md#createcameracontext)
- [canvasToTempFilePath](../base/api-reference.md#canvastotempfilepath)
- [canvasGetImageData](../base/api-reference.md#canvasgetimagedata)
- [openLocation](../base/api-reference.md#openlocation)
- [chooseLocation](../base/api-reference.md#chooselocation)
- [startLocationUpdate](../base/api-reference.md#startlocationupdate)
- [stopLocationUpdate](../base/api-reference.md#stoplocationupdate)
- [onLocationChange](../base/api-reference.md#onlocationchange)
- [offLocationChange](../base/api-reference.md#offlocationchange)
- [hideKeyboard](../base/api-reference.md#hidekeyboard)
- [onKeyboardHeightChange](../base/api-reference.md#onkeyboardheightchange)
- [offKeyboardHeightChange](../base/api-reference.md#offkeyboardheightchange)
- [makePhoneCall](../base/api-reference.md#makephonecall)
- [vibrateShort](../base/api-reference.md#vibrateshort)
- [vibrateLong](../base/api-reference.md#vibratelong)
- [setClipboardData](../base/api-reference.md#setclipboarddata)
- [getClipboardData](../base/api-reference.md#getclipboarddata)
- [setScreenBrightness](../base/api-reference.md#setscreenbrightness)
- [getScreenBrightness](../base/api-reference.md#getscreenbrightness)
- [setVisualEffectOnCapture](../base/api-reference.md#setvisualeffectoncapture)
- [onUserCaptureScreen](../base/api-reference.md#onusercapturescreen)
- [offUserCaptureScreen](../base/api-reference.md#offusercapturescreen)
- [addPhoneContact](../base/api-reference.md#addphonecontact)
- [scanCode](../base/api-reference.md#scancode)
- [openBluetoothAdapter](../base/api-reference.md#openbluetoothadapter)
- [closeBluetoothAdapter](../base/api-reference.md#closebluetoothadapter)
- [startBluetoothDevicesDiscovery](../base/api-reference.md#startbluetoothdevicesdiscovery)
- [stopBluetoothDevicesDiscovery](../base/api-reference.md#stopbluetoothdevicesdiscovery)
- [onBluetoothDeviceFound](../base/api-reference.md#onbluetoothdevicefound)
- [offBluetoothDeviceFound](../base/api-reference.md#offbluetoothdevicefound)
- [getConnectedBluetoothDevices](../base/api-reference.md#getconnectedbluetoothdevices)
- [getBluetoothAdapterState](../base/api-reference.md#getbluetoothadapterstate)
- [onBluetoothAdapterStateChange](../base/api-reference.md#onbluetoothadapterstatechange)
- [offBluetoothAdapterStateChange](../base/api-reference.md#offbluetoothadapterstatechange)
- [getBluetoothDevices](../base/api-reference.md#getbluetoothdevices)
- [createBLEConnection](../base/api-reference.md#createbleconnection)
- [closeBLEConnection](../base/api-reference.md#closebleconnection)
- [onBLEConnectionStateChange](../base/api-reference.md#onbleconnectionstatechange)
- [offBLEConnectionStateChange](../base/api-reference.md#offbleconnectionstatechange)
- [writeBLECharacteristicValue](../base/api-reference.md#writeblecharacteristicvalue)
- [readBLECharacteristicValue](../base/api-reference.md#readblecharacteristicvalue)
- [notifyBLECharacteristicValueChange](../base/api-reference.md#notifyblecharacteristicvaluechange)
- [onBLECharacteristicValueChange](../base/api-reference.md#onblecharacteristicvaluechange)
- [offBLECharacteristicValueChange](../base/api-reference.md#offblecharacteristicvaluechange)
- [setBLEMTU](../base/api-reference.md#setblemtu)
- [getBLEDeviceRSSI](../base/api-reference.md#getbledevicerssi)
- [getBLEDeviceServices](../base/api-reference.md#getbledeviceservices)
- [getBLEDeviceCharacteristics](../base/api-reference.md#getbledevicecharacteristics)
- [startWifi](../base/api-reference.md#startwifi)
- [stopWifi](../base/api-reference.md#stopwifi)
- [getWifiList](../base/api-reference.md#getwifilist)
- [onGetWifiList](../base/api-reference.md#ongetwifilist)
- [offGetWifiList](../base/api-reference.md#offgetwifilist)
- [getConnectedWifi](../base/api-reference.md#getconnectedwifi)
- [login](../base/api-reference.md#login)
- [checkSession](../base/api-reference.md#checksession)
- [getUserInfo](../base/api-reference.md#getuserinfo)
- [requestPayment](../base/api-reference.md#requestpayment)
- [getSetting](../base/api-reference.md#getsetting)
- [openSetting](../base/api-reference.md#opensetting)
- [enableAlertBeforeUnload](../base/api-reference.md#enablealertbeforeunload)
- [disableAlertBeforeUnload](../base/api-reference.md#disablealertbeforeunload)
- [getExtConfig](../base/api-reference.md#getextconfig)
- [getExtConfigSync](../base/api-reference.md#getextconfigsync)
