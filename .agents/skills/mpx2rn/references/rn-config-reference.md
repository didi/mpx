# 跨端输出 RN 编译与运行时配置参考

本文档详细描述了 Mpx 跨端输出 RN 的编译配置与运行时配置，包括 `MpxWebpackPlugin` 的常用选项、编译期 `rnConfig`、全局 `Mpx.config` 与运行时 `Mpx.config.rnConfig`。

应用、页面、组件的 JSON 区块配置见 [JSON 配置参考](./rn-json-reference.md)；`createApp` / `createPage` / `createComponent` 的构造选项见 [脚本能力参考](./rn-script-reference.md#构造选项)。

## 目录

- [配置入口与生效阶段](#配置入口与生效阶段)
- [编译配置](#编译配置)
  - [配置方式](#配置方式)
  - [平台与条件编译](#平台与条件编译)
  - [模板与样式](#模板与样式)
  - [规则匹配](#规则匹配)
  - [编译期 rnConfig](#编译期-rnconfig)
  - [分包与异步加载](#分包与异步加载)
- [运行时配置](#运行时配置)
  - [初始化方式](#初始化方式)
  - [Mpx.config](#mpxconfig)
  - [Mpx.config.rnConfig](#mpxconfigrnconfig)
    - [应用与导航](#应用与导航)
    - [布局与基础组件](#布局与基础组件)
    - [open-type 容器实现](#open-type-容器实现)
    - [异步分包加载与预下载](#异步分包加载与预下载)
    - [权限与 WebView](#权限与-webview)
- [注意事项](#注意事项)

---

## 配置入口与生效阶段

| 配置入口 | 生效阶段 | 主要用途 |
| --- | --- | --- |
| `new MpxWebpackPlugin(options)` | 编译期 | 目标平台、条件编译、模板和样式转换、分包策略。使用 CLI 工程时通常对应 `pluginOptions.mpx.plugin`。 |
| `options.rnConfig` | 编译期 | RN 根组件注册、异步分包、基础组件替换。修改后需重新构建。 |
| `Mpx.config` | 运行时 | 响应式策略、错误与警告处理、事件代理等全局行为。 |
| `Mpx.config.rnConfig` | 运行时 | 初始路由、宿主能力回调、布局默认值、异步包加载等 RN 扩展。 |

**编译期 `rnConfig` 与运行时 `Mpx.config.rnConfig` 是两个独立入口，不会自动整体同步。** 例如 `supportSubpackage` 必须在编译插件中配置，`loadChunkAsync` 必须在运行时代码中注册；仅修改运行时对象无法改变已生成的分包或基础组件映射。

---

## 编译配置

### 配置方式

直接使用 webpack 时，将配置传给 `@mpxjs/webpack-plugin` 的构造函数。下面为插件配置片段，入口、loader 与 RN 打包链沿用工程现有设置：

```js
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

module.exports = {
  plugins: [
    new MpxWebpackPlugin({
      mode: 'ios',
      srcMode: 'wx',
      rnConfig: {
        projectName: 'MyMpxApp',
        supportSubpackage: true
      }
    })
  ]
}
```

使用 Mpx CLI 工程时，以上插件选项通常写在 `mpx.config.js` 的 `pluginOptions.mpx.plugin` 中。已有多端构建配置时，沿用工程的目标选择方式；RN 的 `mode` 为 `ios` / `android` / `harmony`，不要写成 `react`。

### 平台与条件编译

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `mode` | `'wx'` | 输出目标，注入 `__mpx_mode__`，输出 RN 时选择 `'ios'`、`'android'` 或 `'harmony'`。 |
| `srcMode` | 同 `mode` | 源码方言，注入 `__mpx_src_mode__`，输出 RN 要求为 `'wx'`，使用微信小程序语法编写源码。 |
| `env` | `''` | 自定义环境标识，注入 `__mpx_env__`，参与文件与区块条件编译。 |
| `defs` | `{}` | 自定义环境变量，参与条件编译表达式解析，不要与框架内置的 `__mpx_mode__`、`__mpx_src_mode__`、`__mpx_env__`、`__mpx_perf__` 重名。 |
| `srcModeRules` | `{}` | 按源码方言配置资源匹配规则，用于指定部分资源的方言；与目标平台筛选分开。`modeRules` 为历史兼容别名，两者不能同时配置。 |
| `fileConditionRules` | 全部匹配 | 控制哪些资源参与文件维度条件编译；自定义时使用 `include` / `exclude`。 |

文件后缀、区块 `mode` / `src-mode` 与属性 `@mode` 的具体写法见 [条件编译](./conditional-compile.md)。

### 模板与样式

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `externalClasses` | `['custom-class', 'i-class']` | 声明跨端编译需要识别的外部样式类名。业务新增名称时，组件的 `externalClasses` 声明与此处需保持一致。 |
| `autoVirtualHostRules` | `{}` | 命中的组件不生成实体 `:host` 包裹节点。优先通过本项控制跨端虚拟节点，避免仅依赖微信的 `options.virtualHost`。 |
| `customTextRules` | `{}` | 将命中的自定义组件作为文本元素处理，编译生成 `isCustomText` 标记，用于自定义文本组件的内联嵌套等场景。 |
| `transRpxRules` | `null` | `px` 转 `rpx` 规则，可为对象或数组。规则包含 `include` / `exclude`、`mode`（`none` / `only` / `all`）、`designWidth`（默认 `750`）与 `comment`；`only` 仅转换注释指定部分，`all` 转换非豁免部分。 |
| `i18n` | `null` | 国际化配置，常用字段为 `locale`、`messages`、`messagesPath`，供 RN 模板与脚本中的翻译能力使用。详见 [模板能力参考 · i18n 国际化](./rn-template-reference.md#i18n-国际化)。 |

`transRpxRules` 控制编译期样式单位批量转换；运行时 `rpx` / `vw` / `vh` 的换算基于窗口（`window`）尺寸，见 [布局与基础组件](#布局与基础组件)。

### 规则匹配

`autoVirtualHostRules`、`customTextRules` 等使用以下匹配结构：

```ts
type Condition = string | RegExp | ((resourcePath: string) => boolean)

interface Rules {
  include?: Condition | Condition[]
  exclude?: Condition | Condition[]
}
```

- `include` 命中且 `exclude` 未命中时生效，数组中任意条件命中即可。
- 字符串按资源路径包含关系匹配，不是 glob；需要更精确的范围时使用正则或函数。
- 空规则 `{}` 不匹配任何资源。对于未提供默认 `include` 的规则，若希望全量匹配，应显式传入 `include: () => true`，不能只写 `exclude`。

```js
// MpxWebpackPlugin 配置片段
new MpxWebpackPlugin({
  autoVirtualHostRules: {
    include: /src\/components\/virtual-/
  },
  customTextRules: {
    include: /src\/components\/inline-text\.mpx$/
  }
})
```

### 编译期 rnConfig

以下字段配置在 **`MpxWebpackPlugin` 的 `rnConfig`** 中：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `projectName` | 未设置 | RN 根组件注册名称。设置后入口生成 `AppRegistry.registerComponent(projectName, () => app)`；未设置时入口默认导出 App，交给宿主注册。 |
| `supportSubpackage` | `true` | 是否启用 RN 页面与组件的异步分包，以及框架的 `require.async` 支持。设为 `false` 时，页面与组件映射使用同步引用。 |
| `asyncCommonSubpackage` | `true` | 多个异步分包的公共模块默认抽取为 `async-common/index.js`；设为 `false` 时合并进 App 主入口 chunk。 |
| `transSubpackageRules` | 未设置 | RN 专用的分包资源转移规则，格式为 `[{ from: ['sub1'], to: 'common' }]`，作用于页面、组件及 `require.async` 引用的模块；`to: ''` 表示转移到主包。 |
| `asyncChunk.loading` | 未设置 | 异步**页面**加载中的组件路径；不配置时使用内置 loading。 |
| `asyncChunk.fallback` | 未设置 | 异步**页面**加载失败的组件路径；不配置时使用内置失败页。自定义组件通过 `bindreload`（Mpx）或 `onReload`（React）触发重试。 |
| `customBuiltInComponents` | 未设置 | `Record<string, string>`，替换或扩展 RN 基础标签实现；主模板及 import 引入的子模板均生效。 |

**基础组件替换约定：** key 使用模板中的微信基础标签名，例如 `view` / `text` / `scroll-view`，不要使用 `mpx-*`；value 使用绝对路径或 npm 包模块路径，不使用 `./`、`../`、`~` 前缀。替换后由自定义实现负责对齐属性、事件、子节点等行为。

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

### 分包与异步加载

下列字段是 **`MpxWebpackPlugin` 顶层选项**，与 `rnConfig` 同级：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `asyncSubpackageRules` | `[]` | 按资源规则指定组件或 `require.async` 引用模块的异步分包，规则包含 `include` / `exclude`、`root`，组件场景可指定 `placeholder`。引用路径的 `?root` 与已声明的 `componentPlaceholder` 优先。 |
| `retryRequireAsync` | `false` | 异步加载失败重试配置；`true` 等价于 `{ times: 1, interval: 0 }`，也可显式设置重试次数与间隔。 |
| `disableRequireAsync` | `false` | 关闭框架对 `require.async` 的处理；与 `rnConfig.supportSubpackage` 的页面 / 组件异步映射开关区分。 |

编译配置只负责生成分包与加载调用，实际下载和执行需要宿主提供 [运行时异步分包加载与预下载](#异步分包加载与预下载)。应用的 `subPackages`、`preloadRule` 与组件占位声明见 [JSON 配置参考](./rn-json-reference.md)。

---

## 运行时配置

### 初始化方式

`Mpx` 为 `@mpxjs/core` 默认导出。全局配置应在 `createApp`、页面 / 组件脚本执行前完成初始化；仅修改需要的字段，保留框架默认值与工程中已有的配置。

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

在 `app.mpx` 的脚本中先 `import './config'`，再调用 `createApp(...)`。静态 `import` 会先于当前模块主体执行，因此初始化模块也应先于依赖这些配置的业务模块引入。

### Mpx.config

以下为全局配置字段，默认值以 `@mpxjs/core` 的初始化配置为准。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `useStrictDiff` | `false` | 在数据 diff 渲染链路中将变化细化为子路径；主要用于小程序 `setData` 优化，不应作为 RN 渲染优化开关使用。 |
| `ignoreWarning` | `false` | 过滤框架警告。支持布尔值、字符串（包含匹配）、正则或 `(msg, location, e) => boolean`，匹配或返回 `true` 时忽略警告。 |
| `ignoreProxyWhiteList` | `['id', 'dataset', 'data']` | 不代理到实例上的字段名列表；不要通过修改此项绕过 RN 的保留字段约束。 |
| `observeClassInstance` | `false` | 是否将 class 实例纳入响应式处理，也可传构造函数数组限定范围。RN 原生对象或大型外部实例通常无需响应式化。 |
| `errorHandler` | `null` | `(msg, location, e) => void`，接管框架统一错误处理。 |
| `warnHandler` | `null` | `(msg, location, e) => void`，接管未被 `ignoreWarning` 过滤的框架警告。 |
| `proxyEventHandler` | `null` | `(event, instance) => void`，事件代理处理钩子，可用于统一观察事件。 |
| `setDataHandler` | `null` | `(data, instance) => void`，数据渲染链路调用底层 `__render` 前触发；RN 的 VNode 渲染链路不经过此钩子，不用于监听所有 RN 更新。 |
| `forceFlushSync` | `false` | 强制同步执行更新调度，改变默认批量异步更新行为，按需启用。 |
| `webConfig` | `{}` | Web 通用配置，不用于 RN。 |
| `rnConfig` | 见下文 | RN 运行时扩展配置，初始包含 `defaultBoxSizing: 'content-box'` 与 `disablePageTransition: false`。 |

### Mpx.config.rnConfig

以下字段均配置在 **运行时 `Mpx.config.rnConfig`** 中。“未设置”表示框架没有预置该回调或值；表内同时注明消费端的默认行为。

#### 应用与导航

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `parseAppProps` | 未设置 | `(props) => { initialRouteName?, initialParams? }`，解析宿主传给 RN 根组件的参数。`initialRouteName` 使用已注册页面路径；不指定时使用应用首页。 |
| `onStateChange` | 未设置 | `(state) => void`，初始导航就绪及后续导航状态变化时回调。 |
| `disablePageTransition` | `false` | 为 `true` 时禁用 RN 页面转场动画，内部映射为 `animation: 'none'`。 |
| `disableAppStateListener` | 未设置 | 为 `true` 时跳过框架对 `AppState` 变化的处理，适合由宿主接管前后台状态的场景；监听仍会注册，不等同于移除应用卸载逻辑。 |
| `onAppBack` | 未设置 | `(delta) => boolean`，`navigateBack` 请求越过当前页面栈时触发，入参为超出栈的返回层数。返回 `true` 表示已由宿主接管，框架报告成功且不再执行内部 `pop`；退出宿主页面的操作需自行实现。 |
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
| `setSwipeBackEnabled` | 未设置 | `(enabled) => void`，DRN 等混合容器用于设置宿主页面侧滑返回状态；`page-container` 展示时传入 `false`，关闭或销毁时传入 `true`。 |
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

页面 `onShareAppMessage` 可返回 `promise` 提供异步分享数据；框架会与约 3 秒的等待上限竞争，超时使用同步返回的信息。

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

#### 权限与 WebView

| 配置项 | 说明 |
| --- | --- |
| `bluetoothPermission` | `() => Promise<boolean>`，在 `openBluetoothAdapter` 中替代默认蓝牙权限检查，返回 `true` 表示通过。 |
| `wifiPermission` | `() => Promise<boolean>`，在 `startWifi` 中替代默认 Wi-Fi 权限检查，返回 `true` 表示通过。 |
| `cameraPermission` | `() => Promise<boolean>`，配置后 Camera 等待结果严格为 `true` 才渲染；未配置时框架不通过此回调阻塞渲染。 |
| `webviewConfig.hostWhitelists` | WebView 主机白名单，元素为字符串，使用主机名后缀匹配；未配置或为空数组时不限制主机。 |
| `webviewConfig.apiImplementations` | WebView 桥接 API 的自定义实现映射。内置 API 分支未处理的调用按名称查找函数，将桥接参数逐项传入，并通过 Promise 回传结果。 |

权限回调与环境 API 的 RN 支持范围见 [环境 API 参考](./rn-api-reference.md)；WebView 使用方式见 [模板能力参考](./rn-template-reference.md)。

---

## 注意事项

- 编译配置修改后需要重新构建；运行时配置为普通对象，不是响应式配置中心，不保证在页面挂载后修改仍能生效。
- RN 专属运行时初始化应通过条件编译限制在 `ios` / `android` / `harmony`，宿主原生依赖的引入也需隔离，具体见 [条件编译](./conditional-compile.md)。
