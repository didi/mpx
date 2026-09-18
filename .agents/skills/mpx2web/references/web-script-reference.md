# Mpx2Web 脚本差异参考

本文档只记录 `<script>` 中 Web-only 运行时差异。构造选项、组合式 API、响应式 API、实例基础方法和通用生命周期沿用输入项目与仓库内 Mpx 文档，不从其它输出端 Skill 推导。

## 目录

- [Web 路由与页面状态](#web-路由与页面状态)
- [`getCurrentInstance()` 返回结构](#getcurrentinstance-返回结构)
- [与微信小程序的实例方法差异](#与微信小程序的实例方法差异)
  - [`triggerEvent` 的传播选项](#triggerevent-的传播选项)
  - [`$forceUpdate` 与 setup `forceUpdate`](#forceupdate-与-setup-forceupdate)
  - [关系能力](#关系能力)
- [与微信小程序的全局能力差异](#与微信小程序的全局能力差异)
- [浏览器环境](#浏览器环境)
- [Web 缺失的宿主能力](#web-缺失的宿主能力)
- [Web 运行时配置入口](#web-运行时配置入口)
- [Web 状态管理与 SSR](#web-状态管理与-ssr)

---

## Web 路由与页面状态

Web 页面栈由 Mpx Web 运行时映射到浏览器路由。路由、部署路径、页面切换动画、tabBar 和页面配置统一见 [Web JSON 配置参考](./web-json-reference.md)；本节只记录这些配置对脚本生命周期的影响。

页面 show / hide 由 Web 路由激活态与浏览器可见性变化驱动。页面滚动相关行为受浏览器滚动容器和页面 JSON 中 `disableScroll` 影响：

| 场景 | Web 侧说明 |
| --- | --- |
| 页面激活 / 失活 | 由 Web 路由状态和浏览器可见性共同驱动。 |
| 页面滚动 | 默认使用浏览器滚动。 |
| 禁用页面滚动 | 页面滚动相关逻辑不再按默认页面容器触发。 |

业务代码不要绕过 Mpx Web 运行时直接接管路由实例，除非是在 Web-only 架构层明确处理路由集成。

---

## `getCurrentInstance()` 返回结构

跨端代码统一通过 `.proxy` 获取当前组件实例：

```js
import { getCurrentInstance } from '@mpxjs/core'

const instance = getCurrentInstance()
const component = instance && instance.proxy
```

不要依赖 `instance` 顶层字段或 `instance.proxy` 上的内部字段。优先使用 Composition API、生命周期 API 和 `setup(props, context)` 提供的公共能力；确需访问路由、DOM 或小程序宿主字段时，将逻辑限制在对应平台。

`getCurrentInstance()` 只能在 `setup()` 或生命周期钩子的同步执行阶段调用；异步回调中重新调用可能得到 `null`。该 API 面向高阶封装，不应作为 Composition API 中通用获取 `this` 的方式。

---

## 与微信小程序的实例方法差异

同名实例能力在 Web 与小程序上的使用边界如下：

- `selectComponent` / `selectAllComponents`：只使用简单 selector，不使用包含空格或 `>` 的关系选择器。
- `createSelectorQuery` / `createIntersectionObserver`：仅在客户端挂载后调用，SSR 阶段不可用；观察结果受 Web 页面布局和滚动容器影响。
- `getOpenerEventChannel`：Web 同时提供页面实例方法和 setup context 入口，已有任一正确写法都可保留。

### `triggerEvent` 的传播选项

使用 `this.triggerEvent('notice', detail)` 发送自定义事件，父组件在子组件标签上通过 `bindnotice` 监听，从 `event.detail` 读取数据。

- Web 不支持 `bubbles`、`composed`、`capturePhase` 传播选项，不依赖它们实现跨层通知。
- 需要跨层通知时，在 Web 侧显式监听并转发，或使用项目已有通信方案；保留原有数据，避免与微信传播链重复通知。
- 接收关系明确时补全通知；缺少接收方或接入协议时才标注 TODO，不能只删除参数或用空回调代替。

### `$forceUpdate` 与 setup `forceUpdate`

Web 中 `this.$forceUpdate()` 和 setup context 的 `forceUpdate()` 都只用于无参强制刷新，不支持微信小程序侧的数据、选项和完成回调参数。

- 更新数据时，直接修改已声明的响应式状态；setup 中修改对应的 `ref` / `reactive`。通常不需要额外强制刷新。
- 需要在 Web 视图更新后执行操作时，先更新状态，再调用实例 `$nextTick(callback)`，不要把回调传给 `$forceUpdate` 或用 `await $forceUpdate()` 等待。
- setup 中需要等待视图更新时，在 setup 同步阶段通过 `getCurrentInstance().proxy` 取得实例，再使用其 `$nextTick(callback)`。

例如，`label` 已在 `data` 中声明时，可保留小程序原有调用，仅调整 Web 分支：

```js
updateLabel (label) {
  if (__mpx_mode__ === 'web') {
    this.label = label
    this.$nextTick(() => this.afterLabelUpdated())
  } else {
    this.$forceUpdate({ label }, () => this.afterLabelUpdated())
  }
}
```

已有正确的响应式更新逻辑无需额外增加平台分支。

### 关系能力

Web 已支持 `relations` 的父子/祖先后代匹配、`linked`、`unlinked` 和 `getRelationNodes()`，这些能力无需整体重写。当前 Web 实现未消费关系配置中的 `target`，也不会调用 `linkChanged`；业务实际依赖这两个字段时再补 Web 等效处理或明确待接入边界，不要把整个 `relations` 判为不支持。

---

## 与微信小程序的全局能力差异

Web 下不要依赖以下小程序语义：

- `onLaunch`：不要依赖冷启动/热启动区别，也不要依赖真实 `scene`、`shareTicket` 等宿主参数。
- App `onShow` / `onHide`：不要把它们当作小程序前后台事件，也不要依赖完整进入参数。
- App `onError` / `onUnhandledRejection`：不要假设错误参数结构与小程序一致，也不要假设所有运行时错误都会进入 App 回调。
- App `onPageNotFound`：不要把它当作所有 Web 路由失败的统一兜底。
- Page `onLoad`：Web 只传路由 query，不要依赖小程序侧额外参数。
- Page/组件 `onShow` / `onHide`：触发受 Web 路由缓存和页面可见性影响，不要按小程序页面栈时机推断。
- `onResize`：只依赖窗口尺寸和方向，不读取小程序宿主专有字段。
- `onPageScroll` / `onReachBottom`：`disableScroll` 会阻止默认页面滚动监听的注册；自定义滚动容器的事件需按其实现接入。
- `onPullDownRefresh`：由 `enablePullDownRefresh` 独立启用，`disableScroll` 不会直接取消其注册；手势触发仍需结合实际容器验证。
- `onTabItemTap`：内建 Web tabBar 点击时会调用当前页面引用上的 `onTabItemTap(item)`；具体时机和参数以 Web 实现为准，自定义 tabBar 需自行处理。
- `getApp()`：只访问业务定义的数据和方法，不读取小程序宿主字段。
- `getCurrentPages()`：不要假设每一项都是完整页面实例；调用页面方法前先检查该方法是否存在。

---

## 浏览器环境

DOM、浏览器对象、第三方 H5 SDK 与 Vue 组件接入统一见 [H5 生态混合开发](./web-hybrid-dev.md)；服务端执行限制统一见 [SSR 专项参考](./ssr-reference.md)。脚本层只需先判断逻辑是否属于客户端 Web-only，再进入对应专项流程。

---

## Web 缺失的宿主能力

以下事件依赖小程序宿主语义，即使出现在 Web 生命周期允许列表中，也不代表运行时会触发。按业务需求接入对应的 Web 能力；需要排除仅适用于小程序的选项时，使用实际有效的转换或平台条件处理，不因钩子不触发就机械删除所有声明：

| 生命周期 | Web 侧处理 |
| --- | --- |
| `onShareAppMessage` / `onShareTimeline` | Web 分享需单独接入业务方案；移除原宿主生命周期的方式见下例。 |
| `onAddToFavorites` | 使用 Web 收藏、关注或业务用户体系。 |
| `onSaveExitState` | 使用 Web Storage、服务端状态或业务恢复方案。 |
| `onThemeChange` | 使用 Web 媒体查询或业务主题系统。 |

`implement` 是能力登记入口，`remove: true` 不是通用的生命周期删除开关。当前 `packages/core/src/convertor/wxToWeb.js` 只对 `moved`、`definitionFilter`、`onShareAppMessage` 读取该标记并删除选项，`onShareTimeline` 不在此列表。`onShareAppMessage` 可在页面构造前登记移除；其它需隔离的钩子使用平台条件 options，例如：

```js
import { createPage, implement } from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  implement('onShareAppMessage', {
    modes: ['web'],
    remove: true
  })
}

const pageOptions = {
  // 原有分享生命周期继续服务小程序输出
  onShareAppMessage () {
    return { title: '分享标题', path: '/pages/detail/index' }
  },
  methods: {
    shareOnWeb () {
      // TODO: 接入业务指定的 Web 分享 SDK
    }
  }
}

if (__mpx_mode__ === 'wx') {
  pageOptions.onShareTimeline = function () {
    return { title: '分享标题' }
  }
}

createPage(pageOptions)
```

上述示例保留微信分享声明，并在 Web 中通过有效的登记或条件选项排除它们；已有有效的平台条件 options 无需机械改写。Web 分享优先沿用项目已有方案；尚未确定方案时标明待接入，不把复制链接等行为自行当作等价分享。

---

## Web 运行时配置入口

配置键及默认行为统一由 [Web JSON 配置参考](./web-json-reference.md#web-运行配置) 维护，本文件不重复列举。应用脚本需要读取或设置**运行时**配置时使用 `mpx.config.webConfig`；它不是 `mpx.config.js` 的导出对象，构建期 `webConfig` 仍位于 `pluginOptions.mpx.plugin`。

---

## Web 状态管理与 SSR

Web 端推荐使用 `@mpxjs/pinia` 承载新状态域。普通 CSR 可创建全局 Pinia 实例；SSR 必须为每次请求创建独立状态实例，避免请求间状态污染。

SSR 数据预取、`onAppInit`、`serverPrefetch`、`onSSRAppCreated` 与状态注水统一见 [SSR 专项参考](./ssr-reference.md)。
