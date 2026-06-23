# 跨端输出 Web 环境 API 参考

## 目录

- [使用说明](#使用说明)
- [基础](#基础)
  - [base64ToArrayBuffer](#base64toarraybuffer)
  - [arrayBufferToBase64](#arraybuffertobase64)
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
- [路由](#路由)
- [界面](#界面)
  - [交互反馈](#交互反馈)
  - [导航栏](#导航栏)
  - [页面滚动与下拉刷新](#页面滚动与下拉刷新)
  - [TabBar](#tabbar)
  - [createAnimation](#createanimation)
  - [nextTick](#nexttick)
  - [窗口尺寸监听](#窗口尺寸监听)
- [网络](#网络)
  - [request](#request)
  - [connectSocket](#connectsocket)
- [数据缓存](#数据缓存)
- [媒体](#媒体)
  - [previewImage](#previewimage)
  - [getImageInfo](#getimageinfo)
  - [createInnerAudioContext](#createinneraudiocontext)
  - [createVideoContext](#createvideocontext)
- [位置](#位置)
- [设备](#设备)
- [WXML](#wxml)
  - [createSelectorQuery](#createselectorquery)
  - [createIntersectionObserver](#createintersectionobserver)

---

## 使用说明

`@mpxjs/api-proxy` 提供跨端环境 API 抹平。输出 Web 时，在应用入口执行 `mpx.use(apiProxy, options)`，即可通过 `mpx.xxx` 使用本参考中列出的 API。

```js
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  usePromise: true,
  whiteList: [],
  blackList: [],
  custom: {
    web: {
      myCustomApi () {
        // 仅在 Web 编译目标下挂载为 mpx.myCustomApi
      }
    }
  }
})
```

若无需配置，可简写为 `mpx.use(apiProxy)`。

### options

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `usePromise` | `boolean` | `false` | 为符合 Promise 化规则的异步 API 增加 Promise 返回值。 |
| `whiteList` | `string[]` | `[]` | 强制指定 API 参与 Promise 化，可覆盖内置排除规则。 |
| `blackList` | `string[]` | `[]` | 强制指定 API 保持原始回调风格。 |
| `custom` | `Object` | `{}` | 按编译目标扩展或覆盖 API；Web 对应键为 `web`。 |

### Promise 化

同步 API、监听 API、名称以 `create` 开头的上下文工厂、名称以 `Sync` 结尾的 API，以及内置黑名单中的 API 默认不会 Promise 化。单次调用可在第一个参数对象中传入 `usePromise: false`，临时保留回调风格。

`request`、`connectSocket` 等 API 可返回任务实例；开启 `usePromise: true` 后按 Promise 风格获取异步结果。需要操作任务实例时，优先使用回调风格调用。

### 支持范围

本文展开说明的 API 可在 Web 使用。未在本文列出的 `mpx.xxx` API，默认按 Web 不支持处理；如能力存疑，应扫描 `@mpxjs/api-proxy` Web 侧源码确认。需要时通过条件编译提供 Web 替代方案，或使用 `custom.web` 扩展。

### 浏览器与 SSR

依赖界面、媒体、位置、网络状态或浏览器存储的 API 应在客户端生命周期内调用；需要操作页面节点的 API 应在组件挂载后调用。SSR 渲染阶段不要调用此类 API。`base64ToArrayBuffer`、`arrayBufferToBase64` 等纯 JavaScript 能力不受此限制。

**自定义覆盖与扩展**：Web 默认能力不满足业务需求时，可通过 `custom.web` 提供自定义 API。同名 API 会覆盖默认能力，新名称会作为 Web 专属扩展挂到 `mpx` 上。

---

## 基础

### base64ToArrayBuffer

#### 说明

同步将 Base64 字符串解码为 `ArrayBuffer`。

#### 入参

第一个参数为 `base64`（`string`，必填）。非法 Base64 可能抛出异常，调用侧需按需捕获。

#### 返回值

返回解码后的 `ArrayBuffer`。

---

### arrayBufferToBase64

#### 说明

同步将 `ArrayBuffer` 或可逐字节遍历的二进制数据编码为 Base64 字符串。

#### 返回值

返回 Base64 字符串。

---

### getSystemInfo

#### 说明

异步获取设备概要与当前窗口尺寸。Web 可获得的信息少于小程序宿主，品牌、型号和系统版本为浏览器环境推断值，不应作为可靠的设备识别依据。

#### 入参

第一个参数为包含 `success`、`complete` 的 Object。

#### 成功回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `errMsg` | `string` | `getSystemInfo:ok`。 |
| `brand` | `string` | 根据 UA 匹配的品牌；无法识别时回退为 `Android`。 |
| `model` | `string` | 浏览器推断值，不保证为精确机型。 |
| `system` | `string` | 根据 UA 推断的 iOS 或 Android 版本。 |
| `platform` | `string` | 浏览器报告的平台标识。 |
| `language` | `string` | 浏览器语言。 |
| `pixelRatio` | `number` | 设备像素比。 |
| `screenWidth` / `screenHeight` | `number` | 屏幕宽高。 |
| `windowWidth` / `windowHeight` | `number` | 文档根节点的可视区域宽高。 |
| `statusBarHeight` / `safeArea` | `null` | Web 当前无法提供。 |
| `version` / `SDKVersion` / `fontSizeSetting` | `null` | Web 当前无法提供。 |
| 各类 `*Authorized`、`*Enabled` | `null` | 不可用于浏览器权限或设备能力判断。 |

---

### getSystemInfoSync

同步版本，返回字段与 `getSystemInfo` 成功载荷一致，但不包含 `errMsg`。仅可在浏览器环境调用。

---

### getWindowInfo

#### 说明

同步读取浏览器屏幕与视口尺寸。

#### 返回值

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `pixelRatio` | `number` | 设备像素比。 |
| `screenWidth` / `screenHeight` | `number` | 屏幕宽高。 |
| `windowWidth` / `windowHeight` | `number` | 页面视口宽高。 |
| `statusBarHeight` / `safeArea` / `screenTop` | `null` | Web 当前无法提供。 |

安全区域应优先使用 CSS `env(safe-area-inset-*)` 处理，不要依赖本 API 的 `safeArea`。

---

### getDeviceInfo

#### 说明

同步返回 UA 推断的设备概要。品牌、型号和系统版本只能作为展示或粗略兼容判断，不能作为可靠的设备识别依据。

#### 返回值

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `brand` / `model` | `string` | UA 推断值，`model` 当前与 `brand` 相同。 |
| `system` | `string` | UA 推断的系统版本。 |
| `platform` | `string` | 浏览器报告的平台标识。 |
| `abi` / `deviceAbi` / `benchmarkLevel` / `cpuType` / `memorySize` | `null` | Web 当前无法提供。 |

---

### getEnterOptionsSync

#### 说明

同步获取**最近一次进入应用或回到前台**时的启动参数，与冷启动参数可能不同。

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
| （其余） | - | 随启动场景变化的其他字段。 |

---

### getLaunchOptionsSync

#### 说明

同步获取**应用冷启动**时的参数。

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
| （其余） | - | 随启动场景变化的其他字段。 |

---

### onAppShow

#### 说明

监听应用进入**前台**（展示态；监听 API，非 `success` / `fail` 模型）。应用首次创建以及页面由隐藏状态恢复可见时触发。

Web 不区分小程序意义上的冷启动与热启动。首次触发时回调包含当前页面的启动参数；页面从隐藏状态恢复时，回调参数为空对象。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 应用进入展示态时调用。仅在浏览器环境注册。 |

#### 监听回调参数

首次触发时收到 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `path` | `string` | 当前路由路径，已移除开头的 `/`。 |
| `query` | `Object` | 当前路由查询参数。 |
| `scene` | `number` | Web 当前固定为 `0`。 |
| `shareTicket` | `string` | Web 当前为空字符串。 |
| `referrerInfo` | `Object` | Web 当前为空对象。 |

页面从隐藏状态恢复时收到空对象。

#### 返回值

无。

---

### onAppHide

#### 说明

监听应用进入**后台**（隐藏态；监听 API）。Web 页面由可见状态变为隐藏状态时触发。

该事件反映浏览器页面可见性变化，例如切换标签页、最小化浏览器或进入后台；具体触发时机仍受浏览器实现影响，不等同于网页被关闭或组件被卸载。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 应用进入隐藏态时调用。仅在浏览器环境注册。 |

#### 监听回调参数

Web 端回调不传参数，业务侧只应将其作为“页面进入隐藏态”的通知使用，不应读取隐藏原因。

#### 返回值

无。

---

### offAppShow

#### 说明

取消 `onAppShow` 监听；不传回调则清空该事件下全部监听。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 与注册时相同的函数引用；省略则移除全部展示态监听。 |

#### 返回值

无。

---

### offAppHide

#### 说明

取消 `onAppHide` 监听；不传回调则清空该事件下全部监听。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 与注册时相同的函数引用；省略则移除全部隐藏态监听。 |

#### 返回值

无。

---

### onError

#### 说明

监听 Web 环境中的全局 JavaScript 错误（监听 API）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 全局错误发生时调用。仅在浏览器环境注册。 |

#### 监听回调参数

回调参数通常为 `Error` 对象；部分资源加载错误或浏览器受限场景下可能为空。

#### 返回值

无。

---

### offError

#### 说明

取消 `onError` 监听；不传回调则清空全部错误监听。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 与注册时相同的函数引用；省略则移除全部错误监听。 |

#### 返回值

无。

---

### onUnhandledRejection

#### 说明

监听未处理的 Promise 拒绝（监听 API）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 未处理的 Promise 拒绝发生时调用。仅在浏览器环境注册。 |

#### 监听回调参数

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `reason` | `any` | Promise 的拒绝原因。 |
| `promise` | `Promise` | 发生未处理拒绝的 Promise。 |

#### 返回值

无。

---

### offUnhandledRejection

#### 说明

取消 `onUnhandledRejection` 监听；不传回调则清空全部监听。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 否 | 与注册时相同的函数引用；省略则移除全部监听。 |

#### 返回值

无。

---

`onLazyLoadError` / `offLazyLoadError` 在 Web 下不可用。

---

## 路由

业务代码统一使用下列 Mpx 导航 API，不要直接引入 `vue-router` 或手写 Web 路由跳转。

以下 API 只能在浏览器且 Mpx 路由实例已初始化后工作。路由与 SSR 相关配置见 [JSON 配置参考](./web-json-reference.md)。

### navigateTo

#### 说明

**异步 API**。保留当前页并打开新页面（入栈）。Web 下目标页面不能是 tabBar 页面，支持 `EventChannel`。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 打开的页面路径。 |
| `events` | `Object` | 否 | 页面间通信通道，与小程序一致。 |

#### 返回值

无同步返回值。

### redirectTo

#### 说明

**异步 API**。关闭当前页并打开指定页（替换栈顶）。Web 下目标页面不能是 tabBar 页面。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 打开的页面路径。 |

#### 返回值

无同步返回值。

### navigateBack

#### 说明

**异步 API**。关闭当前页面，返回栈内上一层或多层。`delta` 大于当前可回退层数时会被收敛。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `delta` | `number` | 否 | 回退步数，默认 `1`。 |

#### 返回值

无同步返回值。

### reLaunch

#### 说明

**异步 API**。清理现有页面栈后打开目标页。Web 下可通过扩展参数 `delta` 校正宿主 webview 无法统计的额外跳转层数。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 打开的页面路径。 |
| `delta` | `number` | 否 | Web 扩展参数，用于校正宿主 webview 额外跳转层数。 |

#### 返回值

无同步返回值。

### switchTab

#### 说明

**异步 API**。切换到 tabBar 页面。Web 下仅可切换到 tabBar 配置中的页面。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | tabBar 页面路径。 |

#### 返回值

无同步返回值。

---

## 界面

### 交互反馈

#### showActionSheet

##### 说明

**异步 API**。显示操作菜单。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `itemList` | `string[]` | 是 | 按钮标题列表。 |
| `itemColor` | `string` | 否 | 按钮文字颜色。 |

##### 返回值

无同步返回值。

#### showModal

##### 说明

**异步 API**。显示模态对话框。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 否 | 标题。 |
| `content` | `string` | 否 | 内容。 |
| `showCancel` | `boolean` | 否 | 是否显示取消按钮。 |
| `cancelText` | `string` | 否 | 取消按钮文案。 |
| `cancelColor` | `string` | 否 | 取消按钮颜色。 |
| `confirmText` | `string` | 否 | 确认按钮文案。 |
| `confirmColor` | `string` | 否 | 确认按钮颜色。 |

##### 返回值

无同步返回值。

#### showToast

##### 说明

**异步 API**。显示轻提示。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 提示文字。 |
| `icon` | `string` | 否 | `success` / `error` / `loading` / `none` 等。 |
| `image` | `string` | 否 | 自定义图标路径。 |
| `duration` | `number` | 否 | 显示时长 ms。 |
| `mask` | `boolean` | 否 | 是否显示透明蒙层。 |

##### 返回值

无同步返回值。

#### hideToast

##### 说明

**异步 API**。隐藏当前 Toast。

##### 入参

常规异步 API 回调。

##### 返回值

无同步返回值。

#### showLoading

##### 说明

**异步 API**。显示加载提示。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 否 | 提示文字。 |
| `mask` | `boolean` | 否 | 是否显示透明蒙层。 |

##### 返回值

无同步返回值。

#### hideLoading

##### 说明

**异步 API**。隐藏 Loading。

##### 入参

常规异步 API 回调。

##### 返回值

无同步返回值。

上述交互 API 只能在客户端调用，SSR 渲染阶段不可用。

---

### 导航栏

#### setNavigationBarTitle

##### 说明

**异步 API**。设置当前 Web 页面标题。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 标题文字。 |

##### 返回值

无同步返回值。

#### setNavigationBarColor

##### 说明

**异步 API**。设置浏览器主题色。仅部分浏览器会呈现，`frontColor` 等字段在 Web 下不生效。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `backgroundColor` | `string` | 否 | 背景色值。 |

##### 返回值

无同步返回值。

#### hideHomeButton

##### 说明

Web 不支持。

---

### 页面滚动与下拉刷新

#### pageScrollTo

##### 说明

**异步 API**。将页面滚动到指定位置。必须在页面挂载后调用。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `scrollTop` | `number` | 否 | 纵向滚动位置 px。 |
| `selector` | `string` | 否 | 选择器，滚动到节点。 |
| `duration` | `number` | 否 | 滚动动画时长 ms。 |

##### 返回值

无同步返回值。

#### startPullDownRefresh

##### 说明

**异步 API**。启动当前页面的下拉刷新。页面需要在 JSON 配置中开启下拉刷新。

##### 入参

常规异步 API 回调。

##### 返回值

无同步返回值。

#### stopPullDownRefresh

##### 说明

**异步 API**。停止当前页面的下拉刷新。

##### 入参

常规异步 API 回调。

##### 返回值

无同步返回值。

---

### TabBar

没有 tabBar 配置时调用会失败。`showTabBar` / `hideTabBar` 可操作自定义 tabBar 的显示状态，但 `setTabBarItem` / `setTabBarStyle` 不会修改自定义 tabBar 内容。

#### setTabBarItem

##### 说明

**异步 API**。修改 Mpx 内置 tabBar 项。自定义 tabBar 不支持。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `index` | `number` | 是 | tabBar 项索引。 |
| `text` | `string` | 否 | tabBar 项文案。 |
| `iconPath` | `string` | 否 | 默认图标路径。 |
| `selectedIconPath` | `string` | 否 | 选中图标路径。 |

##### 返回值

无同步返回值。

#### setTabBarStyle

##### 说明

**异步 API**。修改 Mpx 内置 tabBar 样式。自定义 tabBar 不支持。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | 否 | 默认文字颜色。 |
| `selectedColor` | `string` | 否 | 选中文字颜色。 |
| `backgroundColor` | `string` | 否 | 背景色。 |
| `borderStyle` | `string` | 否 | 边框颜色风格。 |

##### 返回值

无同步返回值。

#### showTabBar

##### 说明

**异步 API**。显示已注册的 tabBar。

##### 入参

常规异步 API 回调。

##### 返回值

无同步返回值。

#### hideTabBar

##### 说明

**异步 API**。隐藏已注册的 tabBar。

##### 入参

常规异步 API 回调。

##### 返回值

无同步返回值。

---

### createAnimation

#### 说明

**同步风格工厂**。创建动画描述对象，用于节点 `animation` 绑定。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `duration` | `number` | 否 | 默认动画时长 ms。 |
| `timingFunction` | `string` | 否 | 如 `linear`、`ease`。 |
| `delay` | `number` | 否 | 延迟 ms。 |
| `transformOrigin` | `string` | 否 | 变换原点。 |

#### 返回值

返回 **`Animation`** 实例；链式方法与 `export()` 与小程序对齐，全集以实现为准。带 `rpx` 的动画配置应在客户端使用。

---

### nextTick

#### 说明

同步调度：在下一微任务执行回调（非异步 `success` / `fail` 模型）。

#### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `fn` | `function` | 是 | 要执行的函数。 |

#### 返回值

无。

---

### 窗口尺寸监听

#### onWindowResize

##### 说明

监听窗口尺寸变化。Web 返回的是屏幕尺寸，不是文档视口尺寸。

##### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 窗口尺寸变化时调用。 |

##### 返回值

无。

#### offWindowResize

##### 说明

取消窗口尺寸变化监听。

##### 入参

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callback` | `function` | 是 | 与注册时相同的函数引用。 |

##### 返回值

无。

---

## 网络

### request

#### 说明

发起 HTTP 请求，受浏览器同源策略和 CORS 限制。跨域请求需要服务端正确配置响应头。

#### 入参

| 字段名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | `''` | 请求地址。 |
| `data` | `any` | `{}` | GET 时拼接到 URL；其他方法作为请求体。 |
| `method` | `string` | `GET` | 会转换为大写。 |
| `header` | `Object` | `{}` | 请求头。 |
| `dataType` | `string` | `json` | 为 `json` 且响应为字符串时尝试 `JSON.parse`。 |
| `responseType` | `string` | `text` | 响应数据类型。 |
| `timeout` | `number` | 应用 `networkTimeout` 或 60000 | 超时时间，单位 ms。 |

`POST` 且 Content-Type 为 `application/x-www-form-urlencoded` 时，非字符串数据会自动序列化。

#### 返回值

返回 `RequestTask`，当前仅提供 `abort()`。

Web 下不提供 `cookies`、`profile`、`exception` 字段。

---

### connectSocket

#### 说明

建立 WebSocket 连接。支持 `url` 和 `protocols`；`header` 在 Web 下不生效。

#### 返回值

返回 `SocketTask`。

Web 不支持全局 `sendSocketMessage`、`closeSocket`、`onSocketOpen`、`onSocketError`、`onSocketMessage`、`onSocketClose`，请使用 `SocketTask` 对应方法。

---

## 数据缓存

Web 缓存受浏览器配额、隐私模式和站点存储策略限制，写入可能失败。缓存数据应当可序列化。

所有缓存 API 只能在客户端使用。`clearStorage` 会清除当前站点下的其他同源缓存数据，调用前需确认影响范围。

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

---

### setStorageSync

#### 说明

同步写入本地缓存。

#### 入参

参数如下。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 键。 |
| `data` | `any` | 是 | 可序列化数据。 |

#### 返回值

无。

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

---

### getStorageSync

#### 说明

同步读取本地缓存。

#### 入参

参数如下。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 键。 |

#### 返回值

返回缓存数据；未找到时返回空字符串。

---

### getStorageInfo

#### 说明

**异步 API**。获取缓存键列表。Web 下不提供 `limitSize`、`currentSize`。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

---

### getStorageInfoSync

#### 说明

同步获取缓存键列表。Web 下不提供 `limitSize`、`currentSize`。

#### 入参

无。

#### 返回值

返回缓存信息。

---

### removeStorage

#### 说明

**异步 API**。删除指定缓存。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 键。 |

#### 返回值

无同步返回值。

---

### removeStorageSync

#### 说明

同步删除指定缓存。

#### 入参

参数如下。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 键。 |

#### 返回值

无。

---

### clearStorage

#### 说明

**异步 API**。清空当前站点的全部缓存。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

---

### clearStorageSync

#### 说明

同步清空当前站点的全部缓存。

#### 入参

无。

#### 返回值

无。

---

## 媒体

### previewImage

预览图片列表，支持触摸横向切换和点击关闭。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `urls` | `string[]` | 是 | 图片地址列表。 |
| `current` | `string` | 否 | 初始图片地址；不在列表时从第一张开始。 |

Web 下仅支持 `urls` 和 `current` 字段。

---

### getImageInfo

基于浏览器 `Image` 加载图片，`src` 必填且不能为空。Web 下不提供 `path`、`orientation`、`type` 字段。

只能在客户端调用。

---

### createInnerAudioContext

同步创建基于 HTML `Audio` 的音频上下文。Web 下 `startTime`、`obeyMuteSwitch` 仅为兼容属性。

浏览器自动播放策略可能阻止未经过用户交互触发的 `play()`。

---

### createVideoContext

根据元素 `id` 获取页面中的 `<video>`，可传入带 `$el` 的组件实例限定查询范围。

`requestBackgroundPlayback`、`exitBackgroundPlayback`、`exitPictureInPicture`、`sendDanmu` 在 Web 下不生效。全屏效果受浏览器支持与用户手势策略限制。

`compressImage`、`chooseMedia` 和 `chooseImage` 在 Web 下不可用。

---

## 位置

### getLocation

获取当前地理位置。浏览器通常要求 HTTPS 安全上下文和用户授权。

| 字段名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `isHighAccuracy` | `boolean` | `false` | 是否使用高精度定位。 |

Web 下不提供 `horizontalAccuracy`、`verticalAccuracy`；`speed` 不建议作为真实移动速度使用。

`openLocation`、`chooseLocation`、`onLocationChange`、`offLocationChange`、`startLocationUpdate`、`stopLocationUpdate` 在 Web 下不支持。

---

## 设备

### getNetworkType

获取当前网络类型。浏览器无法识别时返回 `unknown`，枚举值不保证与小程序完全一致。

### onNetworkStatusChange / offNetworkStatusChange

监听或取消监听网络连接状态变化。不同浏览器能够提供的网络类型精度不同，无法识别时按未知网络处理。

---

## WXML

### createSelectorQuery

创建 `SelectorQuery`，支持 ID、class、子元素、后代、跨组件后代和并集选择器。必须在节点挂载后调用，SSR 渲染阶段不可用。

---

### createIntersectionObserver

创建节点相交状态观察器。

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `thresholds` | `number[]` | 相交比例阈值，默认 `[0]`。 |
| `initialRatio` | `number` | 初始比例过滤依据，默认 `0`。 |
| `observeAll` | `boolean` | 为 `true` 时观察匹配选择器的全部节点。 |

旧浏览器可能不支持该能力，需要按目标浏览器范围提供降级方案。
