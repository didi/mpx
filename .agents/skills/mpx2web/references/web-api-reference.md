# Mpx2Web 环境 API 参考

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
  - [createSelectorQuery](#createselectorquery)
  - [createIntersectionObserver](#createintersectionobserver)
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

---

## 使用说明

- Web 实际用到、且本文确认支持的 `wx.xxx`，优先在 Web 有效代码中显式改为 `mpx.xxx`；应用入口需先用 `mpx.use(apiProxy)` 安装 `@mpxjs/api-proxy`。共享代码也供微信构建时，只有微信入口同样安装代理且调用契约一致，才直接修改共享调用；否则只改 Web 分支或平台文件，保留微信的 `wx.xxx`。
- 已有 `srcMode: 'wx'` 且命中 `transMpxRules` 的调用可继续使用：Web 构建会把 `wx.xxx` 转到 Mpx API，无需批量修改未涉及的代码。
- Web 需要覆盖或扩展 API 时，可在安装代理时提供 `custom.web`；同名 API 会被覆盖。
- 本文只列 Web 可用的 API、入参和结果字段；未列出的小程序能力按 Skill 的[待接入规则](../SKILL.md#统一待接入规则)处理。返回 `null` 的兼容占位字段不作为可用字段列出；通用 `success` / `fail` / `complete` 回调不重复列。
- SSR 服务端不调用依赖浏览器的 API；节点查询在组件挂载后执行。`createSelectorQuery`、`createIntersectionObserver` 在服务端会返回 `undefined`。

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

Web 直接传标准 `ArrayBuffer` 会得到空字符串；在 Web 调用处改传 `new Uint8Array(buffer)`，例如 `mpx.arrayBufferToBase64(new Uint8Array(buffer))`。已传 `Uint8Array` 时无需修改；共享代码保留微信侧原参数。

#### 返回值

返回 Base64 字符串。

---

### getSystemInfo

#### 说明

异步获取设备概要与当前窗口尺寸。Web 可获得的信息受浏览器限制，品牌、型号和系统版本为浏览器环境推断值，不应作为可靠的设备识别依据。

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

---

### getSystemInfoSync

同步版本，可用字段与 `getSystemInfo` 成功载荷一致，但不包含 `errMsg`。仅可在浏览器环境调用。

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

Web 安全区域使用 CSS `env(safe-area-inset-*)` 处理。

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

---

### getEnterOptionsSync

#### 说明

同步返回应用创建时根据初始 Web 路由合成的进入参数。Web 不区分冷启动与热启动，应用恢复可见时不会更新该对象；当前返回值与 `getLaunchOptionsSync()` 相同。

#### 入参

无。

#### 返回值

返回 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `path` | `string` | 打开的页面路径或路由名。 |
| `scene` | `number` | 固定为 `0`。 |
| `query` | `Object` | 查询参数键值对。 |
| `shareTicket` | `string` | 固定为空字符串。 |
| `referrerInfo` | `Object` | 固定为空对象。 |

---

### getLaunchOptionsSync

#### 说明

同步返回应用创建时根据初始 Web 路由合成的启动参数。该结果不代表小程序冷启动场景，当前返回值与 `getEnterOptionsSync()` 相同。

#### 入参

无。

#### 返回值

返回 **Object**：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `path` | `string` | 启动进入的页面路径或路由名。 |
| `scene` | `number` | 固定为 `0`。 |
| `query` | `Object` | 查询参数键值对。 |
| `shareTicket` | `string` | 固定为空字符串。 |
| `referrerInfo` | `Object` | 固定为空对象。 |

---

### onAppShow

#### 说明

监听应用进入**前台**（展示态；监听 API，非 `success` / `fail` 模型）。应用首次创建以及页面由隐藏状态恢复可见时触发。

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

## 路由

Web 业务代码优先使用下列 Mpx 导航 API，由 Mpx Web 运行时映射到 Web 路由。

以下 API 只能在浏览器且 Mpx 路由实例已初始化后工作。路由与 SSR 相关配置见 [Web 配置参考](./web-config-reference.md)。

### navigateTo

#### 说明

**异步 API**。保留当前页并打开新页面（入栈）。Web 下目标页面不能是 tabBar 页面，支持 `EventChannel`。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 打开的页面路径。 |
| `events` | `Object` | 否 | 页面间通信通道。 |

`events` 用于当前页接收被打开页回传的数据；`success(res)` 中的 `res.eventChannel` 用于向被打开页发送初始化数据。两者职责不同，双向通信时都需要保留：

```js
mpx.navigateTo({
  url: '/pages/address/select',
  events: {
    addressSelected: (address) => {
      this.address = address
    }
  },
  success: (res) => {
    res.eventChannel.emit('checkoutReady', { address: this.address })
  }
})
```

被打开页可从页面实例或 setup context 获取同一通道。Web 有效路径不要用 `getCurrentPages` 或浏览器 history 模拟回传；原小程序已有可用的 `getCurrentPages`、EventChannel 或其他通信协议时，保留小程序有效路径，只为 Web 隔离替代入口，不改写共享调用协议：

```js
const channel = this.getOpenerEventChannel()
channel.on('checkoutReady', ({ address }) => {
  this.address = address
})
channel.emit('addressSelected', this.address)
mpx.navigateBack({ delta: 1 })
```

组合式页面也可直接使用 setup context：

```js
createPage({
  setup (props, { getOpenerEventChannel }) {
    const channel = getOpenerEventChannel()
    return { channel }
  }
})
```

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

**异步 API**。清理现有页面栈后打开目标页。

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

**异步 API**。设置浏览器主题色，仅部分浏览器会呈现。

##### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `backgroundColor` | `string` | 否 | 背景色值。 |

##### 返回值

无同步返回值。

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

使用前需配置 tabBar。`showTabBar` / `hideTabBar` 可控制自定义 tabBar 的显示；`setTabBarItem` / `setTabBarStyle` 用于 Mpx 内置 tabBar。

#### setTabBarItem

##### 说明

**异步 API**。修改 Mpx 内置 tabBar 项。

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

**异步 API**。修改 Mpx 内置 tabBar 样式。

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

返回 **`Animation`** 实例，链式配置后调用 `export()` 导出动画数据。带 `rpx` 的动画配置应在客户端使用。

---

### createSelectorQuery

#### 说明

同步创建 Web 节点查询对象。

#### 查询范围与方法

- `in(component)`：把后续查询限制在组件根节点内。Web 接受带 `$el` 的组件实例或 DOM Element；不调用时从整个 `document` 查询。
- `select(selector)`：选择第一个匹配节点，结果为一个对象；未找到时结果为 `null`。
- `selectAll(selector)`：选择全部匹配节点，结果为数组。
- `selectViewport()`：查询文档视口，对应 Web 的 `html` 节点。
- `exec(callback)`：按加入队列的顺序执行查询，并把结果数组传给回调。每个查询方法自身传入的回调也会收到对应结果。

字符串选择器中的 `>>>` 会在 Web 下转换为 `>`。不要依赖小程序选择器的其他宿主扩展语法。

#### NodesRef 能力

| 方法 | Web 返回内容 |
| --- | --- |
| `boundingClientRect(callback)` | `id`、`dataset`、`left`、`right`、`top`、`bottom`、`width`、`height`。 |
| `scrollOffset(callback)` | `id`、`dataset`、`scrollLeft`、`scrollTop`、`scrollWidth`、`scrollHeight`。 |
| `fields(fields, callback)` | 按 `id`、`dataset`、`rect`、`size`、`scrollOffset`、`properties`、`computedStyle`、`node` 读取字段。 |
| `node(callback)` | 返回真实 DOM 节点；Canvas 节点会补充 `createImage`、`createPath2D`、`requestAnimationFrame`、`cancelAnimationFrame`。 |

`properties` 读取值非空的 DOM attribute。

```js
const query = mpx.createSelectorQuery().in(this)

query.select('.article-card').fields({
  id: true,
  dataset: true,
  rect: true,
  size: true,
  computedStyle: ['display']
}, (result) => {
  this.cardMetrics = result
})

query.exec()
```

---

### createIntersectionObserver

#### 说明

同步创建基于浏览器原生 `IntersectionObserver` 的可见性观察对象。

#### 入参

调用形式为 `createIntersectionObserver(component, options)`；Web 在整个页面中查找观察节点。

| 参数或选项 | 类型 | 默认值 | Web 行为 |
| --- | --- | --- | --- |
| `options.thresholds` | `number[]` | `[0]` | 传给浏览器观察器的阈值列表。 |
| `options.initialRatio` | `number` | `0` | 用于过滤初始相交比例回调。 |
| `options.observeAll` | `boolean` | `false` | 为 `true` 时观察选择器匹配的全部节点，否则只观察第一个节点。 |

#### 实例方法

- `relativeTo(selector, margins)`：设置相对参照节点，`margins` 支持 `left`、`right`、`top`、`bottom`，单位为 CSS px。
- `relativeToViewport(margins)`：以浏览器视口为参照，并设置同样的四向 margin。
- `observe(targetSelector, callback)`：在下一次更新后查询并观察目标。目标不存在时输出警告，不触发回调。
- `disconnect()`：停止当前观察器。应在 `observe()` 已创建观察器后调用。

回调参数保留浏览器 `IntersectionObserverEntry` 字段，并补充 `id`、解析后的 `dataset`、`relativeRect` 和毫秒时间戳 `time`。

```js
const observer = mpx.createIntersectionObserver(this, {
  thresholds: [0, 0.5, 1],
  observeAll: true
})

observer
  .relativeToViewport({ bottom: 120 })
  .observe('.lazy-card', (entry) => {
    if (entry.intersectionRatio > 0) {
      this.handleCardVisible(entry.id)
    }
  })

// 页面或组件卸载时执行
observer.disconnect()
```

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

监听浏览器窗口的 `resize` 事件。当前回调返回屏幕尺寸，不等同于变化后的页面视口尺寸；需要视口宽高时读取 `getWindowInfo()` 或 DOM 视口尺寸。

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
| `callback` | `function` | 否 | 传入时取消对应监听；不传时取消全部监听。 |

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

成功回调常用字段为 `data`、`statusCode`、`header`。

可取消且参数会变化的请求要同时管理“任务实例”和“晚到响应身份”。应用全局启用 `usePromise: true` 时，可从 Promise 的 `__returned` 取得原始任务；取消时先清空当前身份并推进代际，再 abort：

```js
loadResource (resourceKey) {
  this.cancelResourceRequest()
  const generation = this.requestGeneration
  const promise = mpx.request({
    url: '/api/resource',
    data: { resourceKey }
  })
  const task = promise.__returned
  this.requestTask = task
  return promise.then((result) => {
    if (this.requestTask !== task || this.requestGeneration !== generation) return
    if (this.resourceKey !== resourceKey) return
    this.resource = result.data
  })
}

cancelResourceRequest () {
  const task = this.requestTask
  this.requestTask = null
  this.requestGeneration = (this.requestGeneration || 0) + 1
  if (task && task.abort) task.abort()
}

onUnload () {
  this.cancelResourceRequest()
}
```

若调用点显式设置 `usePromise: false`，`mpx.request()` 的返回值本身就是 `RequestTask`；不要在这一分支再读取 `__returned`。两种契约只能按项目实际配置选择其一。

---

### connectSocket

#### 说明

建立 WebSocket 连接。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | WebSocket 服务地址。 |
| `protocols` | `string[]` | 否 | WebSocket 子协议。 |

#### 返回值

返回 `SocketTask`。

WebSocket 的发送、关闭和事件监听使用返回的 `SocketTask`：`send`、`close`、`onOpen`、`onError`、`onMessage`、`onClose`。

组件允许重连或切换会话时，按以下身份检查管理任务，不能只覆盖 `this.socketTask`：

- 每组 `open/message/error/close` 回调捕获本次创建的局部 `task`，修改状态或派发消息前确认 `this.socketTask === task`。
- 替换和卸载时先保存旧任务、清空当前任务身份，再关闭旧任务；创建新任务后才把它设为当前任务。
- 发送前读取局部 `task = this.socketTask`，同时确认任务存在、`this.socketTask === task` 且 `task.readyState === task.OPEN`，再调用 `task.send`。

这样旧任务晚到的回调不会修改新连接状态或继续派发消息，未打开或已经被替换的任务也不会收到发送请求。

可复用的完整结构如下；四类回调都检查捕获的局部任务，重连与卸载共用同一条“先废弃身份、再关闭”链路：

```js
connectChannel () {
  this.disconnectChannel()
  const task = mpx.connectSocket({ url: this.channelUrl })
  this.socketTask = task
  task.onOpen(() => {
    if (this.socketTask !== task) return
    this.channelState = 'open'
  })
  task.onMessage((message) => {
    if (this.socketTask !== task) return
    this.handleChannelMessage(message)
  })
  task.onError((error) => {
    if (this.socketTask !== task) return
    this.channelState = 'error'
    this.channelError = error
  })
  task.onClose(() => {
    if (this.socketTask !== task) return
    this.socketTask = null
    this.channelState = 'closed'
  })
}

sendCurrentMessage (data) {
  const task = this.socketTask
  if (!task || this.socketTask !== task || task.readyState !== task.OPEN) return
  task.send({ data })
}

disconnectChannel () {
  const task = this.socketTask
  this.socketTask = null
  if (task) task.close()
}

detached () {
  this.disconnectChannel()
}
```

---

## 数据缓存

Web 缓存受浏览器配额、隐私模式和站点存储策略限制，写入可能失败。缓存数据应当可序列化。

`clearStorage` 会清除当前站点下的其他同源缓存数据，调用前需确认影响范围。

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

**异步 API**。获取缓存键列表；成功回调中的可用字段为 `keys`。

#### 入参

常规异步 API 回调。

#### 返回值

无同步返回值。

---

### getStorageInfoSync

#### 说明

同步获取缓存键列表；返回对象中的可用字段为 `keys`。

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

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `urls` | `string[]` | 是 | 图片地址列表。 |
| `current` | `string` | 否 | 初始图片地址；不在列表时从第一张开始。 |

---

### getImageInfo

基于浏览器 `Image` 加载图片；成功回调返回图片的 `width` 和 `height`。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | 是 | 图片地址，不能为空。 |

---

### createInnerAudioContext

同步创建基于 HTML `Audio` 的音频上下文。可用方法包括 `play`、`pause`、`stop`、`seek` 和 `destroy`。

浏览器自动播放策略可能阻止未经过用户交互触发的 `play()`。

---

### createVideoContext

根据元素 `id` 获取页面中的 `<video>`，可传入带 `$el` 的组件实例限定查询范围。

可用方法包括 `play`、`pause`、`stop`、`seek`、`playbackRate`、`requestFullScreen`、`exitFullScreen`、`showStatusBar` 和 `hideStatusBar`。全屏效果受浏览器支持与用户手势策略限制。

---

## 位置

### getLocation

获取当前地理位置。浏览器通常要求 HTTPS 安全上下文和用户授权。

#### 入参

第一个参数为 **Object**。

| 字段名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `isHighAccuracy` | `boolean` | `false` | 是否使用高精度定位。 |

成功回调中的可用字段包括 `latitude`、`longitude`、`accuracy` 和 `speed`；`speed` 取浏览器定位结果，浏览器无法提供时可能为 `null`。

---

## 设备

### getNetworkType

获取浏览器报告的网络类型。当前结果未完全归一为微信小程序枚举，可能出现浏览器 `effectiveType` 的值；跨端业务不要直接按微信枚举分支。

### onNetworkStatusChange / offNetworkStatusChange

监听或取消监听网络连接状态变化。不同浏览器能够提供的网络类型精度不同；当前 `networkType` 未完全归一为微信小程序枚举，跨端业务优先使用 `isConnected` 判断连接状态。
