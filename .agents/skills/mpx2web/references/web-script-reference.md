# Mpx2Web 脚本差异参考

本文档只记录 `<script>` 中 Web-only 运行时差异。构造选项、组合式 API、响应式 API、实例基础方法、通用生命周期等能力当前先参考 `../mpx2rn` 公共部分，未来替换为 mpx base skill。

## 目录

- [Web 路由与页面状态](#web-路由与页面状态)
- [`getCurrentInstance()` 返回结构](#getcurrentinstance-返回结构)
- [与微信小程序的实例方法差异](#与微信小程序的实例方法差异)
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
- `getOpenerEventChannel`：Web 的 setup context 不提供该能力；需要时从页面实例调用。

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
- `onPageScroll` / `onReachBottom` / `onPullDownRefresh`：不要在禁用页面滚动或改用自定义滚动容器后继续依赖默认页面事件。
- `getApp()`：只访问业务定义的数据和方法，不读取小程序宿主字段。
- `getCurrentPages()`：不要假设每一项都是完整页面实例；调用页面方法前先检查该方法是否存在。

---

## 浏览器环境

DOM、浏览器对象、第三方 H5 SDK 与 Vue 组件接入统一见 [H5 生态混合开发](./web-hybrid-dev.md)；服务端执行限制统一见 [SSR 专项参考](./ssr-reference.md)。脚本层只需先判断逻辑是否属于客户端 Web-only，再进入对应专项流程。

---

## Web 缺失的宿主能力

以下事件依赖小程序宿主语义，即使出现在 Web 生命周期允许列表中，也不代表运行时会触发。先在 Web 输出中移除不成立的宿主生命周期，再按业务需求接入对应的 Web 能力：

| 生命周期 | Web 侧处理 |
| --- | --- |
| `onShareAppMessage` | 用 `implement(remove: true)` 移除 Web 生命周期，再由业务接入 Web 分享方案。未指定 SDK 或分享协议时只预留 TODO，不猜测实现。 |
| `onShareTimeline` | 用 `implement(remove: true)` 移除 Web 生命周期，再由业务接入分享方案。未指定方案时只预留 TODO。 |
| `onAddToFavorites` | 使用 Web 收藏、关注或业务用户体系。 |
| `onTabItemTap` | Web 有 tabBar 路由切换，但没有对应宿主回调。 |
| `onSaveExitState` | 使用 Web Storage、服务端状态或业务恢复方案。 |
| `onThemeChange` | 使用 Web 媒体查询或业务主题系统。 |

对于“原平台保留、Web 直接移除”的构造能力，使用 `@mpxjs/core` 的 `implement`
登记取消，不要在每个 Page/Component 调用点手工拼装条件 options：

```js
import { createPage, implement } from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  implement('onShareAppMessage', {
    modes: ['web'],
    remove: true,
    processor: () => {}
  })
}

createPage({
  // 原有 onShareAppMessage 继续服务小程序输出
  onShareAppMessage () {
    return { title: '分享标题', path: '/pages/detail/index' }
  },
  methods: {
    shareOnWeb () {
      // TODO: 接入业务指定的 Web 分享 SDK
    }
  }
})
```

`remove: true` 会让 Web 转换/选项合并流程移除该能力；页面原有
`onShareAppMessage` 可继续服务小程序输出。Web 分享按钮按平台绑定到单独的实例方法；若需求没有明确指定 H5 SDK、宿主 bridge 或分享协议，该方法只保留清晰的 TODO 接入位。不要擅自选择 `navigator.share`、clipboard、复制链接或其它降级行为，因为这些方案的可用环境、授权、埋点和产品语义均属于业务约束。

---

## Web 运行时配置入口

配置键及默认行为统一由 [Web JSON 配置参考](./web-json-reference.md#web-运行配置) 维护，本文件不重复列举。脚本需要读取配置时使用 `mpx.config.webConfig`，不要再引入新的平行配置入口。

---

## Web 状态管理与 SSR

Web 端推荐使用 `@mpxjs/pinia` 承载新状态域。普通 CSR 可创建全局 Pinia 实例；SSR 必须为每次请求创建独立状态实例，避免请求间状态污染。

SSR 数据预取、`onAppInit`、`serverPrefetch`、`onSSRAppCreated` 与状态注水统一见 [SSR 专项参考](./ssr-reference.md)。
