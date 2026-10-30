# RN 环境 API 差异

本页比较 [API 基准](../base/api-reference.md) 中 API、参数字段、返回字段和对象方法的支持情况，以及字段类型与默认值。支持范围、类型和默认值均与基准一致时，索引直接标为“基准”。

## 目录

- [使用说明](#使用说明)
- [基础](#基础)
  - [base64ToArrayBuffer](../base/api-reference.md#base64toarraybuffer)（基准）
  - [arrayBufferToBase64](../base/api-reference.md#arraybuffertobase64)（基准）
  - [canIUse](../base/api-reference.md#caniuse)（基准）
  - [getSystemInfo](#getsysteminfo)
  - [getSystemInfoSync](#getsysteminfosync)
  - [getWindowInfo](../base/api-reference.md#getwindowinfo)（基准）
  - [getDeviceInfo](#getdeviceinfo)
  - [getEnterOptionsSync](#getenteroptionssync)
  - [getLaunchOptionsSync](#getlaunchoptionssync)
  - [onAppShow](#onappshow)
  - [onAppHide](../base/api-reference.md#onapphide)（基准）
  - [offAppShow](../base/api-reference.md#offappshow)（基准）
  - [offAppHide](../base/api-reference.md#offapphide)（基准）
  - [onError](../base/api-reference.md#onerror)（基准）
  - [offError](../base/api-reference.md#offerror)（基准）
  - [onUnhandledRejection](#onunhandledrejection)
  - [offUnhandledRejection](../base/api-reference.md#offunhandledrejection)（基准）
  - [onLazyLoadError](../base/api-reference.md#onlazyloaderror)（基准）
  - [offLazyLoadError](../base/api-reference.md#offlazyloaderror)（基准）
- [路由](#路由)
  - [navigateTo](../base/api-reference.md#navigateto)（基准）
  - [redirectTo](../base/api-reference.md#redirectto)（基准）
  - [reLaunch](../base/api-reference.md#relaunch)（基准）
  - [navigateBack](../base/api-reference.md#navigateback)（基准）
- [界面](#界面)
  - [showActionSheet](../base/api-reference.md#showactionsheet)（基准）
  - [showModal](#showmodal)
  - [showToast](../base/api-reference.md#showtoast)（基准）
  - [hideToast](../base/api-reference.md#hidetoast)（基准）
  - [showLoading](../base/api-reference.md#showloading)（基准）
  - [hideLoading](../base/api-reference.md#hideloading)（基准）
  - [setNavigationBarTitle](../base/api-reference.md#setnavigationbartitle)（基准）
  - [setNavigationBarColor](#setnavigationbarcolor)
  - [pageScrollTo](../base/api-reference.md#pagescrollto)（基准）
  - [createAnimation](#createanimation)
  - [nextTick](../base/api-reference.md#nexttick)（基准）
  - [getMenuButtonBoundingClientRect](../base/api-reference.md#getmenubuttonboundingclientrect)（基准）
  - [onWindowResize](../base/api-reference.md#onwindowresize)（基准）
  - [offWindowResize](../base/api-reference.md#offwindowresize)（基准）
- [网络](#网络)
  - [request](#request)
  - [connectSocket](#connectsocket)
- [数据缓存](#数据缓存)
  - [setStorage](#setstorage)
  - [getStorage](#getstorage)
  - [getStorageInfo](#getstorageinfo)
  - [removeStorage](../base/api-reference.md#removestorage)（基准）
  - [clearStorage](../base/api-reference.md#clearstorage)（基准）
- [媒体](#媒体)
  - [getImageInfo](#getimageinfo)
  - [createCameraContext](../base/api-reference.md#createcameracontext)（基准）
- [位置](#位置)
  - [getLocation](#getlocation)
- [设备](#设备)
  - [getNetworkType](#getnetworktype)
  - [onNetworkStatusChange](../base/api-reference.md#onnetworkstatuschange)（基准）
  - [offNetworkStatusChange](../base/api-reference.md#offnetworkstatuschange)（基准）
  - [hideKeyboard](../base/api-reference.md#hidekeyboard)（基准）
  - [onKeyboardHeightChange](../base/api-reference.md#onkeyboardheightchange)（基准）
  - [offKeyboardHeightChange](../base/api-reference.md#offkeyboardheightchange)（基准）
  - [makePhoneCall](../base/api-reference.md#makephonecall)（基准）
  - [vibrateShort](#vibrateshort)
  - [vibrateLong](../base/api-reference.md#vibratelong)（基准）
- [低功耗蓝牙](#低功耗蓝牙)
  - [openBluetoothAdapter](#openbluetoothadapter)
  - [closeBluetoothAdapter](../base/api-reference.md#closebluetoothadapter)（基准）
  - [startBluetoothDevicesDiscovery](#startbluetoothdevicesdiscovery)
  - [stopBluetoothDevicesDiscovery](../base/api-reference.md#stopbluetoothdevicesdiscovery)（基准）
  - [onBluetoothDeviceFound](../base/api-reference.md#onbluetoothdevicefound)（基准）
  - [offBluetoothDeviceFound](../base/api-reference.md#offbluetoothdevicefound)（基准）
  - [getConnectedBluetoothDevices](../base/api-reference.md#getconnectedbluetoothdevices)（基准）
  - [getBluetoothAdapterState](../base/api-reference.md#getbluetoothadapterstate)（基准）
  - [onBluetoothAdapterStateChange](../base/api-reference.md#onbluetoothadapterstatechange)（基准）
  - [offBluetoothAdapterStateChange](../base/api-reference.md#offbluetoothadapterstatechange)（基准）
  - [getBluetoothDevices](../base/api-reference.md#getbluetoothdevices)（基准）
  - [createBLEConnection](../base/api-reference.md#createbleconnection)（基准）
  - [closeBLEConnection](../base/api-reference.md#closebleconnection)（基准）
  - [onBLEConnectionStateChange](../base/api-reference.md#onbleconnectionstatechange)（基准）
  - [offBLEConnectionStateChange](../base/api-reference.md#offbleconnectionstatechange)（基准）
  - [writeBLECharacteristicValue](../base/api-reference.md#writeblecharacteristicvalue)（基准）
  - [readBLECharacteristicValue](../base/api-reference.md#readblecharacteristicvalue)（基准）
  - [notifyBLECharacteristicValueChange](#notifyblecharacteristicvaluechange)
  - [onBLECharacteristicValueChange](../base/api-reference.md#onblecharacteristicvaluechange)（基准）
  - [offBLECharacteristicValueChange](../base/api-reference.md#offblecharacteristicvaluechange)（基准）
  - [setBLEMTU](../base/api-reference.md#setblemtu)（基准）
  - [getBLEDeviceRSSI](../base/api-reference.md#getbledevicerssi)（基准）
  - [getBLEDeviceServices](#getbledeviceservices)
  - [getBLEDeviceCharacteristics](#getbledevicecharacteristics)
- [Wi-Fi](#wi-fi)
  - [startWifi](#startwifi)（部分平台不支持）
  - [stopWifi](#stopwifi)（部分平台不支持）
  - [getWifiList](#getwifilist)（部分平台不支持）
  - [onGetWifiList](#ongetwifilist)
  - [offGetWifiList](../base/api-reference.md#offgetwifilist)（基准）
  - [getConnectedWifi](#getconnectedwifi)（部分平台不支持）
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
| 不支持的返回字段 | `language`、`version`、`SDKVersion`、`benchmarkLevel`、`albumAuthorized`、`cameraAuthorized`、`locationAuthorized`、`microphoneAuthorized`、`notificationAuthorized`、`phoneCalendarAuthorized`、`host`、`enableDebug`、`notificationAlertAuthorized`、`notificationBadgeAuthorized`、`notificationSoundAuthorized`、`bluetoothEnabled`、`locationEnabled`、`wifiEnabled`、`locationReducedAccuracy`、`theme`。 |

### getSystemInfoSync

[基准用法](../base/api-reference.md#getsysteminfosync)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `language`、`version`、`SDKVersion`、`benchmarkLevel`、`albumAuthorized`、`cameraAuthorized`、`locationAuthorized`、`microphoneAuthorized`、`notificationAuthorized`、`phoneCalendarAuthorized`、`host`、`enableDebug`、`notificationAlertAuthorized`、`notificationBadgeAuthorized`、`notificationSoundAuthorized`、`bluetoothEnabled`、`locationEnabled`、`wifiEnabled`、`locationReducedAccuracy`、`theme`。 |

### getDeviceInfo

[基准用法](../base/api-reference.md#getdeviceinfo)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `benchmarkLevel`、`abi`、`cpuType`；iOS 还不支持 `deviceAbi`。 |
| 类型差异 | `memorySize`：基准类型为 `string`；RN 类型为 `number`。 |
| 类型差异 | `deviceAbi（非 iOS）`：基准类型为 `string`；RN 类型为 `string \| null`。 |

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

### onUnhandledRejection

[基准用法](../base/api-reference.md#onunhandledrejection)

| 差异类型 | 说明 |
| --- | --- |
| 类型差异 | `promise`：基准类型为 `Promise`；RN 类型为 `Promise \| null`。 |
| 类型差异 | `reason`：基准类型为 `string`；RN 类型为 `any`（原始拒绝值，不限于字符串）。 |

## 路由

用法见索引中的基准链接。

## 界面

### showModal

[基准用法](../base/api-reference.md#showmodal)

| 差异类型 | 说明 |
| --- | --- |
| 类型差异 | `content`：基准类型为 `string`；RN 类型为 `string \| null`。 |

### setNavigationBarColor

[基准用法](../base/api-reference.md#setnavigationbarcolor)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `animation`。 |

### createAnimation

[基准用法](../base/api-reference.md#createanimation)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的对象方法 | `matrix`、`matrix3d`、`rotate3d`、`scaleZ`、`scale3d`、`translateZ`、`translate3d`。 |

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
| 不支持的参数 | `forceCellularNetwork`、`timeout`、`tcpNoDelay`、`perMessageDeflate`。 |
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

## 媒体

### getImageInfo

[基准用法](../base/api-reference.md#getimageinfo)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `orientation`、`type`。 |

## 位置

### getLocation

[基准用法](../base/api-reference.md#getlocation)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `type`、`altitude`、`highAccuracyExpireTime`。 |
| 不支持的返回字段 | `horizontalAccuracy`。 |

## 设备

### getNetworkType

[基准用法](../base/api-reference.md#getnetworktype)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `signalStrength`、`hasSystemProxy`、`weakNet`。 |

### vibrateShort

[基准用法](../base/api-reference.md#vibrateshort)

| 差异类型 | 说明 |
| --- | --- |
| 默认值差异 | `type`：基准默认值为 必填，无默认值；RN 默认值为 `light`（可省略）。 |

## 低功耗蓝牙

### openBluetoothAdapter

[基准用法](../base/api-reference.md#openbluetoothadapter)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `mode`。 |

### startBluetoothDevicesDiscovery

[基准用法](../base/api-reference.md#startbluetoothdevicesdiscovery)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `interval`。 |

### notifyBLECharacteristicValueChange

[基准用法](../base/api-reference.md#notifyblecharacteristicvaluechange)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `type`。 |

### getBLEDeviceServices

[基准用法](../base/api-reference.md#getbledeviceservices)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `services[].isPrimary`。 |

### getBLEDeviceCharacteristics

[基准用法](../base/api-reference.md#getbledevicecharacteristics)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `characteristics[].properties.writeDefault`。 |

## Wi-Fi

### startWifi

[基准用法](../base/api-reference.md#startwifi)

| 差异类型 | 说明 |
| --- | --- |
| API 支持 | iOS 不支持；Android 支持。 |

### stopWifi

[基准用法](../base/api-reference.md#stopwifi)

| 差异类型 | 说明 |
| --- | --- |
| API 支持 | iOS 不支持；Android 支持。 |

### getWifiList

[基准用法](../base/api-reference.md#getwifilist)

| 差异类型 | 说明 |
| --- | --- |
| API 支持 | iOS 不支持；Android 支持。 |

### onGetWifiList

[基准用法](../base/api-reference.md#ongetwifilist)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的返回字段 | `wifiList[].secure`。 |

### getConnectedWifi

[基准用法](../base/api-reference.md#getconnectedwifi)

| 差异类型 | 说明 |
| --- | --- |
| API 支持 | iOS 不支持；Android 支持。 |
| 不支持的返回字段 | `wifi.secure`。 |

## WXML

### createSelectorQuery

[基准用法](../base/api-reference.md#createselectorquery)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的对象方法 | `selectViewport`。 |

### createIntersectionObserver

[基准用法](../base/api-reference.md#createintersectionobserver)

| 差异类型 | 说明 |
| --- | --- |
| 不支持的参数 | `nativeMode`。 |

## 不支持 API 与降级处理

以下 API 在当前 RN 内置适配中不支持。需要时可将宿主或业务实现通过 [API Proxy 自定义扩展](../base/api-reference.md#自定义-api-扩展)接入，使用 `custom` 按实际 RN 目标注册，并通过条件编译隔离平台依赖。列表链接用于查阅基准契约，不代表目标端已支持；自定义实现的支持范围与调用契约以业务适配为准。

- [switchTab](../base/api-reference.md#switchtab)
- [hideHomeButton](../base/api-reference.md#hidehomebutton)
- [startPullDownRefresh](../base/api-reference.md#startpulldownrefresh)
- [stopPullDownRefresh](../base/api-reference.md#stoppulldownrefresh)
- [setTabBarItem](../base/api-reference.md#settabbaritem)
- [setTabBarStyle](../base/api-reference.md#settabbarstyle)
- [showTabBar](../base/api-reference.md#showtabbar)
- [hideTabBar](../base/api-reference.md#hidetabbar)
- [sendSocketMessage](../base/api-reference.md#sendsocketmessage)
- [closeSocket](../base/api-reference.md#closesocket)
- [onSocketOpen](../base/api-reference.md#onsocketopen)
- [onSocketError](../base/api-reference.md#onsocketerror)
- [onSocketMessage](../base/api-reference.md#onsocketmessage)
- [onSocketClose](../base/api-reference.md#onsocketclose)
- [downloadFile](../base/api-reference.md#downloadfile)
- [uploadFile](../base/api-reference.md#uploadfile)
- [saveFile](../base/api-reference.md#savefile)
- [setStorageSync](../base/api-reference.md#setstoragesync)
- [getStorageSync](../base/api-reference.md#getstoragesync)
- [getStorageInfoSync](../base/api-reference.md#getstorageinfosync)
- [removeStorageSync](../base/api-reference.md#removestoragesync)
- [clearStorageSync](../base/api-reference.md#clearstoragesync)
- [previewImage](../base/api-reference.md#previewimage)
- [compressImage](../base/api-reference.md#compressimage)
- [chooseMedia](../base/api-reference.md#choosemedia)
- [createInnerAudioContext](../base/api-reference.md#createinneraudiocontext)
- [createVideoContext](../base/api-reference.md#createvideocontext)
- [canvasToTempFilePath](../base/api-reference.md#canvastotempfilepath)
- [canvasGetImageData](../base/api-reference.md#canvasgetimagedata)
- [openLocation](../base/api-reference.md#openlocation)
- [chooseLocation](../base/api-reference.md#chooselocation)
- [startLocationUpdate](../base/api-reference.md#startlocationupdate)
- [stopLocationUpdate](../base/api-reference.md#stoplocationupdate)
- [onLocationChange](../base/api-reference.md#onlocationchange)
- [offLocationChange](../base/api-reference.md#offlocationchange)
- [setClipboardData](../base/api-reference.md#setclipboarddata)
- [getClipboardData](../base/api-reference.md#getclipboarddata)
- [setScreenBrightness](../base/api-reference.md#setscreenbrightness)
- [getScreenBrightness](../base/api-reference.md#getscreenbrightness)
- [setVisualEffectOnCapture](../base/api-reference.md#setvisualeffectoncapture)
- [onUserCaptureScreen](../base/api-reference.md#onusercapturescreen)
- [offUserCaptureScreen](../base/api-reference.md#offusercapturescreen)
- [addPhoneContact](../base/api-reference.md#addphonecontact)
- [scanCode](../base/api-reference.md#scancode)
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
