# RN 配置差异

本页仅维护 RN 专属配置及相对基准的差异。插件接入、规则匹配、通用模板与样式配置、运行时初始化及全局字段统一见 [配置基准](../base/config-reference.md)。

应用、页面、组件的 JSON 区块配置见 [JSON 配置参考](./rn-json-reference.md)；`createApp` / `createPage` / `createComponent` 的构造选项见 [脚本能力参考](./rn-script-reference.md#构造选项)。

## 目录

- [编译配置](#编译配置)
  - [目标与源码](#目标与源码)
  - [编译期 rnConfig](#编译期-rnconfig)
- [运行时配置](#运行时配置)
  - [初始化方式](#初始化方式)
  - [Mpx.config](#mpxconfig)
  - [Mpx.config.rnConfig](#mpxconfigrnconfig)

## 编译配置

### 目标与源码

RN 输出选择 `ios` / `android` / `harmony`，项目 `srcMode` 使用 `wx`；不能把 mode 写成 `rn` 或 `react`。RN 条件文件回退见 [条件编译基准](../base/conditional-compile.md#rn-条件文件回退)。

### 编译期 rnConfig

以下字段配置在 **`MpxWebpackPlugin` 的 `rnConfig`** 中：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `projectName` | 未设置 | RN 根组件注册名称。设置后入口生成 `AppRegistry.registerComponent(projectName, () => app)`；未设置时入口默认导出 App，交给宿主注册。 |
| `supportSubpackage` | `true` | 是否启用 RN 页面与组件的异步分包，以及框架的 `require.async` 支持。设为 `false` 时，页面与组件映射使用同步引用。 |
| `asyncCommonSubpackage` | `true` | 多个异步分包的公共模块默认抽取为 `async-common/index.js`；设为 `false` 时合并进 App 主入口 chunk。 |
| `transSubpackageRules` | 未设置 | RN 专用的分包资源转移规则，格式为 `[{ from: ['sub1'], to: 'common' }]`，作用于页面、组件及 `require.async` 引用的模块；`to: ''` 表示转移到主包。 |
| `asyncChunk.loading` | 未设置 | 异步**页面**加载中的组件路径；不配置时使用内置 loading。 |
| `asyncChunk.fallback` | 未设置 | 异步**页面**加载失败的组件路径；不配置时使用内置失败页。自定义 Mpx 组件调用 `this.triggerEvent('reload')` 触发重试；React 组件调用传入的 `onReload` 回调。 |
| `customBuiltInComponents` | 未设置 | 主模板及 import 引入的子模板均生效；`Record<string, string>`，替换或扩展基础标签实现。key 为模板中的微信基础标签名（如 `view`、`text`、`scroll-view`），不使用 `mpx-*`；value 为绝对路径或 npm 包模块路径，不使用 `./`、`../`、`~` 前缀，避免将 `src/...` 误写为包路径。自定义实现负责对齐属性、事件和子节点行为。 |

```js
const path = require('path')

// MpxWebpackPlugin 的 rnConfig 配置片段
const rnConfig = {
  projectName: 'MyMpxApp',
  supportSubpackage: true,
  asyncCommonSubpackage: true,
  transSubpackageRules: [
    { from: ['sub1'], to: 'common' }
  ],
  asyncChunk: {
    loading: path.resolve(__dirname, 'src/rn/page-loading.mpx'),
    fallback: path.resolve(__dirname, 'src/rn/page-fallback.mpx')
  },
  customBuiltInComponents: {
    view: path.resolve(__dirname, 'src/rn/custom-view.mpx')
  }
}
```

#### 注意事项

- 异步**组件**的占位使用引用方 JSON 中的 `componentPlaceholder`，不使用这里的页面 `asyncChunk.loading` / `fallback`，详见 [JSON 配置参考](./rn-json-reference.md)。
- 当前实现没有读取 `rnConfig.asyncChunk.timeout`；宿主需要超时控制时，应在运行时 `loadChunkAsync` 实现中处理。
- 编译期 `projectName` 用于根组件注册，不会自动成为运行时分享标题。

## 运行时配置

### 初始化方式

初始化顺序与合并方式沿用 [配置基准](../base/config-reference.md#初始化方式)。RN 导航初始化示例：

```js
// src/config.js，由 app.mpx 的 script 引入
import Mpx from '@mpxjs/core'

if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') {
  Object.assign(Mpx.config.rnConfig, {
    parseAppProps(props) {
      return {
        initialRouteName: props.route, // 使用应用中已注册的页面路径
        initialParams: props.params
      }
    },
    onStateChange(state) {
      console.log('navigation state', state)
    },
    disablePageTransition: true
  })
}
```

### Mpx.config

共用运行时字段见 [运行时配置基准](../base/config-reference.md#运行时配置)。`useStrictDiff` 和 `setDataHandler` 在 RN 环境下不生效。

### Mpx.config.rnConfig

以下字段均配置在 **运行时 `Mpx.config.rnConfig`** 中。“未设置”表示框架没有预置该回调或值；表内同时注明消费端的默认行为。

#### 应用与导航

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `parseAppProps` | 未设置 | `(props) => { initialRouteName?, initialParams? }`，解析宿主传给 RN 根组件的参数。`initialRouteName` 使用已注册页面路径；不指定时使用应用首页。 |
| `onStateChange` | 未设置 | `(state) => void`，初始导航就绪及后续导航状态变化时回调。 |
| `disablePageTransition` | `false` | 为 `true` 时禁用 RN 页面转场动画。 |
| `disableAppStateListener` | 未设置 | 为 `true` 时不自动响应应用前后台变化，适合由宿主接管前后台状态的场景；应用卸载仍会正常处理。 |
| `onAppBack` | 未设置 | `(delta) => boolean`，`navigateBack` 请求越过当前页面栈时触发，入参为超出栈的返回层数。返回 `true` 表示已由宿主接管，本次返回操作报告成功，不再继续退页；退出宿主页面的操作需自行实现。 |
| `onStackTopBack` | 未设置 | `() => void`，配置函数后，默认导航栏在首页也显示返回按钮，点击时调用该函数；实际返回由宿主处理。自定义导航栏不使用该按钮。 |

**初始参数的作用范围：** `parseAppProps` 返回的 `initialParams` 仅作为 RN 根组件初始化时首个路由实例的参数，传入该页面的 `onLoad`，并作为初始化阶段应用 `onLaunch` / `onShow` 的 `query`。后续创建的同路径页面实例不会自动继承；应用再次展示时，`onShow` 的 `query` 以当前路由实例参数为准。

若 `initialRouteName` 未注册，框架通过统一错误处理上报（配置了 `Mpx.config.errorHandler` 时会触发该回调），回退至应用首页，并丢弃该错误路由的 `initialParams`。

#### 布局与基础组件

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `defaultBoxSizing` | `'content-box'` | 节点未显式声明 `box-sizing` 时使用的默认盒模型，可设为 `'border-box'`。 |
| `allowFontScaling` | 未设置，按 `false` 处理 | 文本类基础组件是否跟随系统字体缩放；组件显式传入的 `allowFontScaling` 优先。 |
| `customDimensions` | 未设置 | `({ window, screen }) => ({ window, screen })`，自定义框架样式换算使用的尺寸信息；返回空值时沿用原始尺寸。`rpx` / `vw` 依赖其中的 `window.width`，`vh` 依赖 `window.height`。 |
| `getBottomVirtualHeight` | 未设置 | `() => number`，修正 Android 非横屏场景下底部虚拟区域高度；未配置时采用安全区域底部 inset，横屏时使用屏幕与窗口高度差。 |
| `enableNativeKeyboardAvoiding` | 未设置，按 `true` 处理 | Android 默认配合原生键盘避让。宿主关闭原生避让时设为 `false`，启用 Mpx 内置补偿逻辑，仍受输入组件 `adjust-position` 控制。 |
| `onPickerVibrate` | 未设置 | `() => void`，为 `picker-view-column` 滚动选择提供宿主振动反馈。 |

当前状态栏由页面配置与内置导航组件控制，见 [JSON 配置参考](./rn-json-reference.md)。虽然类型中仍声明了 `statusBarTranslucent`，当前实现没有读取该运行时字段，不应依赖它切换透明状态栏。

#### open-type 容器实现

`openTypeHandler` 用于对接 `button` 的宿主能力，未配置对应键时点击会告警。框架默认不会直接提供系统分享或用户授权能力。

| 配置项 | 说明 |
| --- | --- |
| `projectName` | 运行时分享的默认标题，未设置时使用 `'AwesomeProject'`。与编译期同名字段分别配置，页面 `onShareAppMessage` 返回的 `title` 可覆盖它。 |
| `openTypeHandler.onShareAppMessage` | `(shareInfo) => void`，对应 `open-type="share"`。框架合并默认 `title` / `path` 与当前页 `onShareAppMessage` 的返回结果后调用，可接收 `imageUrl` 等字段；宿主负责执行分享。 |
| `openTypeHandler.onUserInfo` | 对应 `open-type="getUserInfo"`。当前按钮实现对该值执行 `Promise.resolve(value)`，得到对象后直接传给 `bindgetuserinfo`，**不会调用函数值**；接入时提供结果对象或 Promise，不使用返回对象的函数。该字段尚未在 `RnConfig` 类型中声明。 |

在 `button open-type="share"` 场景中，页面 `onShareAppMessage` 可返回 `promise` 提供异步分享数据；框架会与约 3 秒的等待上限竞争，超时使用同步返回的信息。系统或容器提供的非 button 分享入口由宿主自行接入，不要求经过 `openTypeHandler`，其回调参数与异步结果处理以宿主约定为准。

```js
// 放在 RN 配置初始化模块中
Object.assign(Mpx.config.rnConfig, {
  projectName: 'MyMpxApp'
})
Mpx.config.rnConfig.openTypeHandler = Object.assign({}, Mpx.config.rnConfig.openTypeHandler, {
  onShareAppMessage(shareInfo) {
    // 在此调用项目宿主提供的分享能力
    console.log('share', shareInfo)
  }
})
```

基础组件的属性与事件约束见 [模板能力参考](./rn-template-reference.md)。

#### 异步分包加载与预下载

| 配置项 | 说明 |
| --- | --- |
| `loadChunkAsync` | `({ url, package }) => Promise`，宿主负责加载并**执行**异步 chunk，使 webpack 注册对应模块。只有下载文件而未执行，不能完成模块加载。 |
| `downloadChunkAsync` | `(packages: string[]) => void`，按分包名数组预下载、不执行，由页面命中的应用 `preloadRule` 触发。 |
| `onLazyLoadPageError` | `({ subpackage, errType }) => void`，异步页面加载失败时触发，可用于监控或宿主提示；错误类型取自加载错误（如 `'timeout'` / `'fail'`）。 |

`loadChunkAsync` 必须返回 Promise，且应在首次异步加载前注册。成功时先完成 chunk 执行，再结束 Promise（类型约定为 `Promise<null>`）；失败时按加载协议结束为 `'fail'` / `'timeout'` 等状态，框架交给 webpack 的加载完成回调处理。当前 RN 加载适配器不会自行启动超时计时器，超时与宿主侧重试策略需在实现中明确。

页面加载失败可通过编译期 `rnConfig.asyncChunk.fallback` 展示重试界面；组件失败通知与 `componentPlaceholder` 的说明见 [JSON 配置参考](./rn-json-reference.md)。

#### 权限

| 配置项 | 说明 |
| --- | --- |
| `bluetoothPermission` | `() => Promise<boolean>`，在 `openBluetoothAdapter` 中替代默认蓝牙权限检查，返回 `true` 表示通过。 |
| `wifiPermission` | `() => Promise<boolean>`，在 `startWifi` 中替代默认 Wi-Fi 权限检查，返回 `true` 表示通过。 |
| `cameraPermission` | `() => Promise<boolean>`，配置后 Camera 等待结果严格为 `true` 才渲染；未配置时框架不通过此回调阻塞渲染。 |

权限回调与环境 API 的 RN 支持范围见 [环境 API 参考](./rn-api-reference.md)。

#### WebView

| 配置项 | 说明 |
| --- | --- |
| `webviewConfig.hostWhitelists` | 字符串数组，从 URL 提取主机名后进行后缀匹配；未设置或为空数组时不限制主机。 |
| `webviewConfig.apiImplementations` | 默认未设置，无自定义方法。按方法名配置函数，处理内置分支未处理的桥接调用；桥接参数逐项传入，结果经 Promise 回传，未配置对应函数时返回调用失败。 |

WebView 使用方式见 [模板能力参考](./rn-template-reference.md)。
