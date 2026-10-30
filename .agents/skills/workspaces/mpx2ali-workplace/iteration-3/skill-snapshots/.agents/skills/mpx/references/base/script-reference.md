# 脚本基础

本页以 Mpx 核心脚本能力为基准，描述构造、响应式、实例方法与生命周期；能力收录不以全端支持为前提。RN/Web 的可用范围与差异见对应端脚本参考；微信 Skyline 的 renderer、滚动事件、节点查询及类型校验差异见 [运行时最佳实践](../skyline/skyline-runtime-practice.md)。

下文签名中的 `?` 表示可选参数，`T` 表示输入或计算结果的类型，`void` 表示没有可供业务消费的返回值；`Ref<T>` 通过 `.value` 读写。注册函数的返回值与所注册回调的返回值分别说明，不能混用。宿主方法以微信小程序为基准，跨端调用还需核对对应端参考。

## 目录

- [构造选项](#构造选项)
  - [App 构造选项](#app-构造选项)
  - [页面与组件构造选项](#页面与组件构造选项)
  - [统一生命周期](#统一生命周期)
  - [关系能力](#关系能力)
  - [通过 implement 适配构造选项](#通过-implement-适配构造选项)
- [实例属性与方法](#实例属性与方法)
  - [App 实例](#app-实例)
  - [页面与组件实例属性与方法](#页面与组件实例属性与方法)
- [数据响应](#数据响应)
  - [数据响应选项](#数据响应选项)
  - [组合式数据响应 API](#组合式数据响应-api)
  - [侦听器参数与清理](#侦听器参数与清理)
  - [视图更新与 watch 回调](#视图更新与-watch-回调)
  - [强制更新](#强制更新)
  - [数据响应使用要求](#数据响应使用要求)
- [组合式 API](#组合式-api)
- [script setup](#script-setup)
- [运行时导出与全局方法](#运行时导出与全局方法)
  - [运行时导出](#运行时导出)
  - [全局方法](#全局方法)

## 构造选项

从 `@mpxjs/core` 导入 `createApp`、`createPage`、`createComponent`。App 用于全局字段及应用生命周期；页面和组件支持响应式与组合式能力。

| 调用 | 参数 | 返回值与使用要求 |
| --- | --- | --- |
| `createApp(options)` | `options: object`，应用构造选项，见下表。 | 用于注册应用，不通过返回值获取 App 实例；运行阶段调用 `getApp()`。 |
| `createPage(options)` | `options: object`，页面构造选项。 | 用于注册页面，不通过返回值获取页面实例；生命周期和方法中使用 `this`。 |
| `createComponent(options)` | `options: object`，组件构造选项。 | 用于注册组件，不通过返回值获取组件实例；父层通过 refs 或组件查询获取实例。 |

以上入口不提供统一的跨端实例返回值，不使用 `new` 调用。还可传第二参数 `config?: { customCtor: Function }` 替换注册所用的构造器；普通业务省略。

### App 构造选项

```js
import { createApp } from '@mpxjs/core'

createApp({
  globalData: { version: '1.0.0' },
  onLaunch (options) { console.log(options) }
})
```

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `globalData` 及自定义字段 | `any` | — | 声明应用级共享字段，不自动成为响应式状态。 |
| 自定义方法 / `methods` | `Function / object` | — | 声明应用级业务方法；`methods` 中的方法会展开到 App 实例。 |
| `onLaunch` / `onShow` / `onHide` 等 | `Function` | — | 应用生命周期与事件回调，具体支持范围由目标端确定。 |
| `provide` | `object\|Function` | — | 应用级依赖提供，支持对象或返回对象的工厂函数，供页面和组件注入。 |
| `mixins` | `object[]` | — | 合并公共 App 构造选项。 |

App 不支持 `data/computed/watch/inject/setup` 构造能力。

### 页面与组件构造选项

通过 `createPage(options)` 注册页面，通过 `createComponent(options)` 注册组件。下表列出 `options` 的常用构造选项，“用途”中的适用范围区分页面、组件与通用能力；“通用”表示页面和组件均适用，具体支持范围仍需结合构造方式及目标端判断。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `properties` / `props` | `object / object\|string[]` | — | 适用：组件。声明只读的响应式输入，两者合并并参与数据响应，见 [数据响应](#数据响应)。 |
| `data` / `computed` / `watch` | `object\|Function / object / object` | — | 适用：通用。状态、派生数据与副作用，见 [数据响应](#数据响应)。 |
| `methods` | `object` | — | 适用：通用。实例业务方法与模板事件处理器。 |
| `provide` / `inject` | `object\|Function / object\|string[]` | — | 适用：通用。向后代提供依赖或接收上层依赖；provide 为对象或工厂函数，inject 为数组或对象。 |
| `setup` | `Function` | — | 适用：通用。组合式入口，返回模板需要的数据和方法。 |
| `mixins` | `object[]` | — | 适用：通用。合并公共构造选项；沿用已有工程的合并策略。 |
| `relations` | `object` | — | 适用：组件。声明组件间的父子 / 祖先后代关系，监听关系建立和解除，见 [关系能力](#关系能力)。 |
| `externalClasses` | `string[]` | — | 适用：通用。声明外部样式类；跨端还需核对编译配置与目标端样式规则，页面可用性取决于其构造方式及目标端。 |
| `options` | `object` | — | 适用：通用。宿主选项，支持范围由实例构造方式及目标端确定。 |
| `onLoad` / `onShow` / `onReady` / `onUnload` 等 | `Function` | — | 适用：页面。页面生命周期，阶段对应关系见 [统一生命周期](#统一生命周期)。 |
| `created` / `attached` / `ready` / `detached` 等 | `Function` | — | 适用：组件。组件生命周期，阶段对应关系见 [统一生命周期](#统一生命周期)。 |
| `onPageScroll` | `Function` | — | 适用：页面。页面滚动时触发，接收滚动位置等信息。 |
| `onReachBottom` | `Function` | — | 适用：页面。页面滚动至底部触发区域时调用，触发距离由页面配置决定。 |
| `onPullDownRefresh` | `Function` | — | 适用：页面。开启页面下拉刷新后，在触发刷新时调用。 |
| `onShareAppMessage` | `Function` | — | 适用：页面。用户触发页面分享时调用，返回分享标题、路径等配置。 |
| `pageLifetimes` | `object` | — | 适用：组件。包含 `show()`、`hide()`、`resize(size)`，分别在组件所在页面显示、隐藏、尺寸变化时触发。 |

上述页面事件也提供同名组合式钩子，在 `setup` 执行期间同步注册；收藏、退出状态等声明同样属于页面事件能力。实际触发取决于目标端驱动，例如 RN 页面滚动、触底和下拉刷新需按 [RN 脚本差异](../rn/rn-script-reference.md) 适配。

### 统一生命周期

不同小程序平台以及页面、组件的原生生命周期命名和触发阶段存在差异。Mpx 提供统一生命周期，将实例初始化、挂载、更新和卸载等阶段映射到各端，便于复用业务逻辑。

内建生命周期变量和组合式钩子均从 `@mpxjs/core` 导入。选项式通过 `[MOUNTED]() {}` 等计算属性名声明回调，也可沿用小程序原生生命周期；组合式在 `setup` 执行期间同步调用 `onMounted(callback)` 等钩子注册回调。

| 内建生命周期变量 | 组合式生命周期钩子 | 触发时机 |
| --- | --- | --- |
| `BEFORECREATE` / `CREATED` | 无 `onBeforeCreate/onCreated`，直接在 `setup` 中编写初始化逻辑。 | 实例初始化与数据观测阶段。 |
| `BEFOREMOUNT` / `MOUNTED` | `onBeforeMount` / `onMounted` | 首次挂载前 / 挂载完成后；`MOUNTED` 对应页面 `onReady`、组件 `ready` 阶段。 |
| `BEFOREUPDATE` / `UPDATED` | `onBeforeUpdate` / `onUpdated` | 视图更新前 / 更新后。 |
| `BEFOREUNMOUNT` / `UNMOUNTED` | `onBeforeUnmount` / `onUnmounted` | 实例卸载前 / 卸载后，对应页面 `onUnload`、组件 `detached` 的销毁阶段。 |
| `ONLOAD` | `onLoad(callback)` | 页面加载时调用 `callback(rawQuery, decodedQuery)`，接收页面参数。 |
| `ONSHOW` / `ONHIDE` / `ONRESIZE` | `onShow` / `onHide` / `onResize` | 页面显示 / 隐藏 / 尺寸变化时；组件对应所在页面的 `pageLifetimes` 回调。 |

上述组合式钩子均以 `onXxx(callback): void` 注册，`callback` 必须是函数；注册结果不是取消订阅函数。`onBeforeMount/onMounted/onBeforeUpdate/onUpdated/onBeforeUnmount/onUnmounted` 的回调无参数，返回值不用于控制生命周期。

| 选项式回调 / 组合式注册 | 回调参数 | 回调返回值 |
| --- | --- | --- |
| App `onLaunch(options)` / `onShow(options)` | `options` 为启动或进入前台的信息对象，常用字段有 `path: string`、`query: object`、`scene: number`、`referrerInfo: object`。 | 无需返回值；这里是 App 选项，不是页面的 `onShow` 注册函数。 |
| App `onHide()`；页面、组件的创建 / 挂载 / 卸载回调 | 无参数。 | 无需返回值。 |
| 页面 `onLoad(rawQuery, decodedQuery)` / `onLoad(callback)` | 回调接收两个页面参数对象；`rawQuery` 是宿主原始参数，`decodedQuery` 是 Mpx 解码后的参数。 | 无需返回值。 |
| 页面 `onShow()` / `onHide()`、组件 `pageLifetimes.show()` / `hide()`；`onShow(callback)` / `onHide(callback)` | 无参数。 | 无需返回值。 |
| 页面 `onResize(res)`、组件 `pageLifetimes.resize(res)`；`onResize(callback)` | `res` 含 `size: { windowWidth: number, windowHeight: number }`，页面还可含 `deviceOrientation`；目标端可能提供不同尺寸字段。 | 无需返回值。 |
| `onPageScroll(res)` / `onPageScroll(callback)` | `res: { scrollTop: number }`，滚动距离单位为 px。 | 无需返回值。 |
| `onReachBottom()` / `onReachBottom(callback)`；`onPullDownRefresh()` / `onPullDownRefresh(callback)` | 无参数。 | 无需返回值；结束下拉刷新需另行调用环境 API。 |
| `onShareAppMessage(res)` / `onShareAppMessage(callback)` | `res.from` 为 `'button'` 或 `'menu'`；按钮触发时可通过 `res.target` 取节点信息。 | 返回分享配置对象，常用字段为 `title?: string`、`path?: string`、`imageUrl?: string`；目标端需支持实际分享驱动。 |

例如 `onLoad((rawQuery, decodedQuery) => { console.log(decodedQuery.id) })`，不能写成 `onLoad(rawQuery, decodedQuery)` 来获取参数。选项式普通函数中的 `this` 为当前实例，组合式回调通过闭包访问状态与 context，不依赖 `this`。

表中是 Mpx 生命周期的基准阶段对应关系，不承诺各端回调时序完全一致；DOM、RN 挂载与小程序原生通知应按目标端参考判断。获取页面参数时，推荐使用 `onLoad` **回调**的第二参数 `decodedQuery`，它是 Mpx 抹平后的解码结果；不要再次重复解码。refs/布局查询放在挂载及之后，清理定时器和订阅放在卸载阶段。

`onReactHooksExec/REACTHOOKSEXEC` 只用于 RN 混编；`onServerPrefetch/SERVERPREFETCH` 只用于 Web SSR。

### 关系能力

`relations` 用于关联组件实例，双方需要声明配对的 `parent` / `child` 或 `ancestor` / `descendant` 关系。前一组表达直接父子关系，后一组表达祖先与后代关系；组件还需满足实际节点树中的嵌套关系，仅声明配置不会建立关联。

通常以目标组件路径作为关系键。Mpx 可通过 `import childPath from './child.mpx?resolve'` 获取构建后的组件路径，并使用 `relations: { [childPath]: { type: 'child' } }` 声明；查询时使用同一个关系键。

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `type` | `string` | — | 必填，取值为 `parent`、`child`、`ancestor`、`descendant`。 |
| `linked(target)` | `Function` | — | 关系建立时调用，`target` 为关联组件实例；无需返回值。 |
| `unlinked(target)` | `Function` | — | 关系解除时调用，`target` 为解除关联的组件实例；无需返回值。 |
| `target` | `Behavior` | — | 指定目标节点应具有的 behavior，以关联具有该 behavior 的组件。 |

通过 `this.getRelationNodes(relationKey)` 获取对应关系的关联实例数组，没有关联节点时返回空数组。应在关系建立后使用，或在 `linked` / `unlinked` 回调中直接使用传入的 `target`；跨端的匹配范围与支持限制见 RN / Web 脚本参考。

### 通过 implement 适配构造选项

部分 App、页面或组件构造选项在目标端没有内建实现。对于被跨端转换列为未支持的选项，框架默认移除声明，并在开发环境报错提示。业务需要复用这些声明时，可通过 `implement` 登记适配，再由业务适配层提供实际行为。

从 `@mpxjs/core` 导入 `implement`，在相关 App/页面/组件构造之前调用 `implement(name: string, options?: object): void`，配置对象为 `{ modes, processor, remove }`：

- `name`：需要适配的构造选项名，例如 `onShareAppMessage`；不是实例方法名或环境 API 名。
- `modes?: string[]`：默认 `[]`，适配生效的输出端列表，例如 `['web']` 或 `['ios', 'android', 'harmony']`。当前输出端不在列表中时，不执行登记或 `processor`。
- `processor?: () => void`：默认空函数，在每次有效登记时同步执行，不接收实例或构造选项，返回值不被消费，也不会自动去重。可在其中注入 mixin，将依赖实例的逻辑放入生命周期或方法。
- `remove?: boolean`：默认 `false`，使已登记的选项通过未支持检查并保留声明；设为 `true` 时仍移除该选项，适用于由适配层接管行为、无需保留原声明的情况。

登记本身不会实现构造选项，也不会自动触发其回调。适配层需要接入目标端事件或 SDK，负责回调时机、参数、返回值消费和销毁清理；同名组合式钩子也需要实际驱动。

需适配的构造选项及目标端示例见 [RN 脚本差异](../rn/rn-script-reference.md) / [Web 构造选项适配](../web/web-script-reference.md#通过-implement-适配构造选项)。

## 实例属性与方法

构造选项描述实例如何初始化；实例属性与方法在生命周期、业务方法等运行阶段通过 `this` 使用。组合式通过 setup context 访问相应能力，见 [组合式 API](#组合式-api)。

### App 实例

通过 `getApp()` 获取应用实例，也可在 App 生命周期与业务方法中通过 `this` 访问。

| 属性 / 方法 | 基准用途 |
| --- | --- |
| `globalData` 及自定义字段 | 访问应用级共享数据；`getApp().globalData` 是普通全局字段，不自动成为响应式状态。 |
| 自定义方法 | 通过 `getApp().method()` 调用应用级业务逻辑。 |

不在 App 构造完成前假定业务字段已就绪。App 不承载页面或组件视图，不使用下列页面/组件实例的视图查询与更新能力。

### 页面与组件实例属性与方法

在生命周期和业务方法中通过 `this` 访问当前页面或组件，常规视图更新优先使用响应式赋值。父层可通过 refs 或组件查询取得子组件实例；`getCurrentPages()` 提供页面栈入口，不能通过修改返回的页面栈来导航。

下表“适用”按页面、组件的使用场景区分，“通用”表示两者均适用，不代表所有目标端均支持。宿主字段和方法需结合页面构造方式及目标端判断。

| 属性 / 方法 | 适用 | 基准用途 |
| --- | --- | --- |
| 属性字段 / 状态字段 / 计算属性 / 业务方法 | 通用 | 通过 `this.count`、`this.doubled`、`this.increment()` 等直接访问；props 为只读输入，内部状态通过响应式赋值更新。 |
| `route` | 页面 | 当前页面的路由路径，如 `pages/detail/index`；查询参数单独获取，不通过修改此字段导航。 |
| `id` / `dataset` | 组件 | 组件实例的节点标识与自定义节点数据。 |
| `$refs` | 通用 | 按具名 `wx:ref` 访问当前页面或组件内部的节点、子组件实例。 |
| `$watch(source, callback, options?)` | 通用 | `source` 为实例字段路径字符串或 getter 函数；返回 `stop(): void`，详见 [侦听器参数与清理](#侦听器参数与清理)。 |
| `$set(target, key, value)` / `$delete(target, key)` | 通用 | `target` 为对象或数组，`key` 为字符串键或数字索引；`$set` 返回写入的 `value`，`$delete` 无返回值。详见 [组合式数据响应 API](#组合式数据响应-api)。 |
| `$nextTick(callback?)` | 通用 | `callback: () => T` 可选；当前小程序实现返回 Promise，无回调时可 `await this.$nextTick()`，回调形式的 Promise 接收回调结果。时序与跨端边界见 [视图更新与 watch 回调](#视图更新与-watch-回调)。 |
| `triggerEvent(name, detail?, options?)` | 组件 | `name: string` 为事件名，`detail` 为传给监听方 `event.detail` 的数据；`options` 的 `bubbles/composed/capturePhase` 均为可选 boolean、默认 `false`，分别控制冒泡、跨组件边界和捕获。返回 `void`。 |
| `selectComponent(selector)` | 通用 | `selector: string`，如 `'#panel'` 或 `'.panel'`；返回首个匹配子组件实例，无匹配时为空值，使用前判空。选择器范围及空值形式以目标端为准。 |
| `selectAllComponents(selector)` | 通用 | `selector: string`；返回所有匹配子组件的实例数组，无匹配时为 `[]`。 |
| `getRelationNodes(relationKey)` | 组件 | `relationKey: string` 为 `relations` 中的声明键，不是 selector；返回关联组件实例数组，无关联时为 `[]`。 |
| `getOpenerEventChannel()` | 页面 | 无参数，返回与打开当前页面的页面之间的 `EventChannel`，用于页面间通信；页面 setup context 也提供此方法。 |
| `getTabBar()` | 通用 | 无参数，返回当前页面的自定义 tabBar 组件实例；需配置自定义 tabBar，取得后判空，跨端及组件内调用支持由目标端确定。 |
| `getPageId()` | 通用 | 无参数，微信基准返回 `string` 类型的所在页面标识，可用于判断多个组件是否属于同一页面；不是路由路径，不依赖跨端统一的 ID 类型或格式。 |
| `createSelectorQuery()` | 通用 | 无参数，返回 `SelectorQuery`。通过 `select(selector)` 等选择节点、指定查询字段，再调用 `exec(callback?)` 执行；结果在回调中取得，不是创建方法的返回值。对象方法见 [节点查询](./api-reference.md#createselectorquery)。 |
| `createIntersectionObserver(options?)` | 通用 | 返回 `IntersectionObserver`；`options` 可含 `thresholds: number[]`（默认 `[0]`）、`initialRatio: number`（默认 `0`）、`observeAll: boolean`（默认 `false`）。先指定参照区域再 `observe(selector, callback)`，结束时 `disconnect()`；完整选项和对象方法见 [相交观察](./api-reference.md#createintersectionobserver)。实例方法不再传 component 参数。 |
| `setData(data, callback?)` | 通用 | `data: object` 为数据路径到值的映射，支持 `'info.name'`、`'list[0]'`；`callback: () => void` 在视图更新完成后调用。返回 `void`，不返回 Promise，不作为常规更新方式推荐。 |
| `$forceUpdate(data?, options?, callback?)` | 通用 | 返回 `void`；数据、选项及回调的重载形式见 [强制更新](#强制更新)。 |

页面与组件实例上的 `id`、`dataset`、`data` 是保留字段。不要在 props、data、computed、methods、setup 返回值、inject 或 mixin 合并字段中使用这些名称。

上述页面/组件实例能力的基准定义不等于各端都具备相同实现。例如 Web 不提供 `setData`，`$forceUpdate` 仅支持无参刷新；RN 的 selector 查询依赖节点查询。具体参数、选择器及事件传播限制见 [RN 脚本](../rn/rn-script-reference.md) / [Web 脚本](../web/web-script-reference.md)。

页面事件通道的 `emit(eventName: string, ...args)` 发送事件；`on(eventName: string, listener)` / `once(eventName: string, listener)` 持续 / 一次性监听，监听函数接收发送端的 `...args`；`off(eventName: string, listener?)` 移除指定监听，省略 listener 时移除该事件全部监听。以上方法均无可供业务消费的返回值；移除指定监听时需传入注册时的同一函数。

## 数据响应

数据响应是 Mpx 的核心能力：`properties/props` 提供只读的响应式输入，`data` 管理内部状态，`computed` 声明派生数据，`watch` 处理数据变化的副作用。props 的外部更新与内部状态的响应式赋值均可驱动视图，常规更新无需手动调用 `setData`。本节描述响应系统的基准用法，具体渲染调度与兼容 API 的差异见目标端参考。App 没有 `data/computed/watch/setup` 构造能力，全局响应式状态使用 [状态管理](./store-reference.md)。

### 数据响应选项

```js
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: { step: { type: Number, value: 1 } },
  data: { count: 0 },
  computed: {
    doubled () { return this.count * 2 }
  },
  watch: {
    count: {
      handler (value) { console.log(value) },
      immediate: true
    }
  },
  methods: {
    increment () { this.count += this.step }
  }
})
```

- `properties` / `props` 声明响应式输入，两者合并；支持 `title: String` 或 `{ type: String, value: '', observer(newValue, oldValue) {} }`。observer 接收属性新旧值、无需返回值，宿主额外参数以目标端为准。通过 `this.propName` 读取，可被 `computed`、`watch` 和模板依赖；输入变化时相应依赖会更新，不在当前实例中直接修改 props。
- `data` 使用对象或 `data(): object` 工厂函数；函数无参数，返回该实例的初始状态对象；避免与 props 重名。
- `computed` 基于依赖缓存，支持 `getter(): T` 以及 `{ get(): T, set(value: T): void }` 形式；getter 返回派生值，setter 接收赋值的新值。普通函数的 `this` 为当前实例；展示派生值优先用 computed。
- `watch` 处理副作用，支持路径字符串、函数/handler 配置、`deep`、`immediate`、`flush`；Mpx 选项式支持以逗号分隔多个路径。
- 实例 `$watch` 动态创建侦听器，返回停止函数；监听外部对象或长生命周期资源时注意清理。

### 组合式数据响应 API

用于在 `setup` 中组织响应式状态、派生数据与副作用，并抽取可复用的状态逻辑，使用方式见下方 [组合式 API](#组合式-api)。从 `@mpxjs/core` 导入运行时 API，避免直接引入 Vue 的响应系统形成两套状态链。

| 调用 | 参数及默认值 | 返回值与用途 |
| --- | --- | --- |
| `ref(value?)` | 任意初始值，省略时为 `undefined`。 | `Ref<T>`，对象值会被深层观测；传入 ref 时返回原 ref。 |
| `shallowRef(value?)` | 任意初始值，省略时为 `undefined`。 | 浅层 `Ref<T>`，仅 `.value` 的替换触发自身依赖；传入 ref 时返回原 ref。 |
| `triggerRef(value)` | 已有 ref，通常为 shallowRef。 | `void`；手动通知该 ref 的依赖，适用于浅层值内部变更后主动更新。 |
| `reactive(target)` | 普通对象或数组。 | 返回响应式对象；Mpx 小程序/RN 基准实现原地观测并返回同一对象，不创建普通数据副本。 |
| `shallowReactive(target)` | 普通对象或数组。 | 返回浅层响应式对象，只观测根层，不递归转换嵌套值。 |
| `markRaw(value)` | 要跳过观测的对象。 | 返回原对象，供后续响应式转换跳过；不是撤销已有观测。 |
| `toRef(object, key)` | 响应式对象及其属性键。 | 与该属性联动的 `Ref<T>`，读写 `.value` 对应原属性；基准实现只消费这两个参数。 |
| `toRefs(object)` | 响应式普通对象。 | 返回同名字段到 ref 的新对象，字段仍与原对象联动；只处理调用时已有的可枚举字段。 |
| `unref(value)` | 普通值或 ref。 | 若是 ref 返回 `.value`，否则返回输入本身；不递归解包。 |
| `isRef(value)` / `isReactive(value)` | 待判断的值。 | `boolean`，分别判断是否为 ref / 响应式对象。 |
| `customRef(factory)` | `factory(track, trigger)` 返回 `{ get(): T, set(value: T): void }`；`track`、`trigger` 均为无参函数。 | `Ref<T>`；在 getter 中调用 `track()` 收集依赖，在需要通知更新时调用 `trigger()`。 |
| `computed(getter)` | `getter: () => T`，无参数，返回派生值。 | 只读计算 ref，读取 `.value` 获取缓存的派生值。 |
| `computed({ get, set })` | `get: () => T`；`set: (value: T) => void`。 | 可写计算 ref；给 `.value` 赋值时调用 setter。 |
| `set(target, key, value)` | `target` 为对象或数组，`key` 为字符串键或数字索引，`value` 为新值。 | 返回写入的 `value`；向已响应式化的对象新增键时建立响应式，数组索引通过可观测变更更新。对应实例 `$set`。 |
| `del(target, key)` | 对象或数组，以及字符串键或数字索引。 | `void`；删除属性，数组按索引删除一个元素并前移后续元素。对应实例 `$delete`。 |
| `watch(source, callback, options?)` | 显式数据源、变化回调及配置，详见下节。 | `stop(): void`，调用后停止侦听并执行已登记的清理。 |
| `watchEffect(effect, options?)` | `effect(onCleanup)`；`options.flush` 默认 `'pre'`。 | `stop(): void`；自动收集 effect 同步执行期间读取的依赖。 |
| `watchPostEffect(effect)` / `watchSyncEffect(effect)` | effect 签名同 `watchEffect`，分别固定 `flush: 'post'` / `'sync'`。 | 基准运行时均返回停止函数；时序见 [视图更新与 watch 回调](#视图更新与-watch-回调)。 |
| `effectScope(detached?)` | `detached: boolean` 默认 `false`；`true` 时不随当前父作用域一起销毁。 | 返回作用域对象，使用 `run` 收集副作用、`stop` 统一清理，见下文。 |
| `getCurrentScope()` | 无参数。 | 当前活跃作用域；没有时为 `undefined`。 |
| `onScopeDispose(callback)` | 无参清理函数，须在活跃作用域内登记。 | `void`；作用域停止时调用回调，回调返回值不被消费。 |

作用域的 `scope.run(fn: () => T): T | undefined` 同步执行 fn 并返回其结果，已停止的作用域不执行 fn；`scope.stop(): void` 停止所收集的副作用并运行清理函数。基准还提供 `scope.pause(): void` 与 `scope.resume(ignoreDirty?: boolean): void`，后者默认 `false`，会补跑暂停期间变脏的副作用；传 `true` 跳过这次补跑。异步回调或 `await` 之后创建的副作用不自动归入此前的 `run`。

```js
import { ref, computed, toRefs } from '@mpxjs/core'

// 位于组件的 setup(props) 内
const count = ref(0)
const doubled = computed(() => count.value * 2)
// const { title } = toRefs(props) // 解构 props 时保留响应式
```

直接解构 `props` 会丢失字段响应式；使用 `toRefs(props)` 或 `toRef(props, 'title')`。Pinia 解构 state/getter 使用 `storeToRefs`，见 [状态管理](./store-reference.md)。

### 侦听器参数与清理

本节说明侦听器的数据源、回调参数与资源清理；`immediate`、`flush` 对首次执行、后续调度及视图更新的影响见 [视图更新与 watch 回调](#视图更新与-watch-回调)。`watch(source, callback, options?)` 与 `this.$watch(source, callback, options?)` 的数据源形式不同：

- 组合式 `watch` 接收 ref / computed ref、响应式对象、getter `() => value`，或这些数据源组成的数组。监听属性应写 `watch(() => state.count, callback)`，不要传已经求值的 `state.count`，也不直接传路径字符串。
- 实例 `$watch` 接收路径字符串（如 `'info.name'`、`'a,b'`）或 getter 函数；getter 的 `this` 指向实例。逗号分隔路径时，新旧值为按路径顺序排列的数组。
- 回调签名为 `(newValue, oldValue, onCleanup) => void`；多源组合式 watch 的新旧值为数组。`onCleanup(fn: () => void): void` 登记副作用清理，在下次回调执行前及停止侦听时调用；回调本身的返回值不作为清理函数。
- `options` 支持 `immediate?: boolean`（默认 `false`）、`deep?: boolean`（默认 `false`）、`flush?: 'pre' | 'post' | 'sync'`（默认 `'pre'`）。直接监听响应式对象会隐式启用深层侦听。深层变更时，新旧值可能是同一对象引用，不是变化前后的快照。
- `immediate: true` 的首次回调，单源 `oldValue` 为 `undefined`，基准组合式多源实现为 `[]`。实例 `$watch` 还支持把第二参数写成 `{ handler, immediate, deep, flush }`；选项式 `watch` 则将该对象作为所监听路径的配置值。
- `watchEffect` 的参数是 `(onCleanup) => void`；使用相同的清理登记方式，依赖只在同步执行期间收集，异步函数 `await` 之后读取的值不会因此成为依赖。

```js
import { ref, watch } from '@mpxjs/core'

const keyword = ref('')
const stop = watch(keyword, (value, oldValue, onCleanup) => {
  const timer = setTimeout(() => console.log(value), 300)
  onCleanup(() => clearTimeout(timer))
})
// 不再需要时调用 stop()；setup 同步创建的侦听器随实例卸载自动停止
```

停止函数没有参数和返回值，不把它当成 watcher 对象使用；暂停一组副作用使用 `effectScope`。选项式 `watch` 的 handler 参数和清理方式同上，但声明配置本身不返回停止函数。

### 视图更新与 watch 回调

响应式状态赋值立即生效，视图更新默认异步批量调度；同一 tick 内重复触发的更新任务会合并，赋值后立即查询布局可能仍得到旧视图。小程序中，框架执行更新任务后通过 `setData` 提交数据，宿主视图渲染完成还需等待其回调。

选项式 `watch`、实例 `$watch` 与组合式 `watch/watchEffect` 的后续回调由 `flush` 控制，当前默认是 `pre`；配置写法、回调参数与 `onCleanup` 用法见 [侦听器参数与清理](#侦听器参数与清理)：

| `flush` | 依赖变更后的回调时机 |
| --- | --- |
| `'pre'`（默认） | 异步入队并去重，在视图更新队列前执行。 |
| `'post'` | 异步入队并去重，在视图更新队列后执行；小程序中不等待 `setData` 渲染完成回调。 |
| `'sync'` | 依赖触发时同步执行，不经过队列批处理；避免用于高频变更或批量修改的数据。 |

首次执行与后续调度需分开理解：`watch` 默认只收集依赖，不立即调用回调；设置 `immediate: true` 时，注册阶段同步调用一次，即使配置了 `flush: 'post'`。`watchEffect` 默认立即执行一次以收集依赖，配置 `flush: 'post'` 时首次也进入后置队列。`watchPostEffect` / `watchSyncEffect` 分别是指定 `post` / `sync` 的 `watchEffect`。

`onCleanup` 登记的清理在下一次回调实际执行前运行，因此随该次回调的调度时机执行，并非数据赋值时立即清理；调用停止函数时则直接执行已登记的清理，不等待 `flush` 队列。

命名导出 `nextTick(callback?)` 的 callback 为无参函数 `() => T`；不传回调时返回 Promise，可 `await nextTick()`，传回调时返回的 Promise 接收回调结果。实例 `$nextTick` 的基准用法相同，普通函数回调的 `this` 指向实例。

小程序基准实现等待当前框架更新队列，不等待宿主 `setData` 的渲染完成回调。需要明确等待本次小程序视图更新完成时使用 `setData(data, callback)` 或 `$forceUpdate(data, callback)` 的完成回调；RN/Web 的调度与布局就绪条件见各端脚本参考。

### 强制更新

普通响应式赋值即可驱动视图更新；需要强制刷新时，使用实例 `this.$forceUpdate` 或组合式 `context.forceUpdate`。

| 调用形式 | 基准语义 |
| --- | --- |
| `$forceUpdate()` / `$forceUpdate(callback)` | 强制刷新当前实例，可只传回调。 |
| `$forceUpdate(data, callback?)` | 将数据对象同步写回实例，再请求刷新；键支持 `'info.name'`、`'list[0]'` 等路径。 |
| `$forceUpdate(data, { sync: true }, callback?)` | 立即发起更新；省略 `sync` 时更新默认入队。 |

`data` 为数据路径到值的对象；`options.sync?: boolean` 默认 `false`；`callback: () => void` 无参数，普通函数的 `this` 指向实例，返回值不被消费。传入数据会修改实例状态，不是仅用于本次显示的临时数据，不应借此修改 props。回调等待本次视图更新完成，方法返回 `undefined`，不能通过 `await $forceUpdate()` 等待更新。

Web 的参数支持差异见 [Web 更新差异](../web/web-script-reference.md#强制更新)。

### 数据响应使用要求

- 对象属性增删与数组变更需使用可被响应系统检测的方式，才能保证视图更新：
  - 对象新增/删除键使用 `this.$set(obj, key, value)` / `this.$delete(obj, key)`，组合式使用命名导出 `set` / `del`。
  - 数组用 `push/splice` 等可观测变更方法；按索引赋值或修改 `length` 不能直接假定可被检测，可用 `set(list, index, value)` 或 `splice`。
- props 为只读输入；需要本地编辑态时创建独立状态，通过事件通知父层更新。
- 不把大量无 UI 数据、宿主对象或外部 class 实例无差别挂入响应式状态；按需使用 `markRaw` / `shallowRef`。

## 组合式 API

`setup(props, context): object` 的 props 为只读响应式输入对象；解构使用 `toRefs` / `toRef`。context 为框架传入的能力对象，提供 `triggerEvent`、`refs`、`asyncRefs`、`forceUpdate`、`selectComponent/selectAllComponents`、`createSelectorQuery/createIntersectionObserver`、`getPageId/getOpenerEventChannel`，方法参数和返回值同对应实例方法；`refs` 为名称到节点 / 实例的映射，`asyncRefs` 为名称到对应 Promise 的映射，具体可用范围以目标端为准。`nextTick` 使用 core 命名导入，不通过 context 调用。使用具名 refs 时在模板写 `wx:ref="panel"`，挂载后访问 `context.refs.panel`。

setup 必须同步返回要提供给模板和实例的数据、方法对象；不使用 `async setup` 返回 Promise，也不返回渲染函数。setup 内不依赖 `this` 访问实例。

```js
import { createComponent, ref, computed, toRefs, onMounted } from '@mpxjs/core'

createComponent({
  properties: { title: String },
  setup (props, context) {
    const { title } = toRefs(props)
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    onMounted(() => { console.log(context.refs.panel) })
    function increment () { count.value++ }
    return { title, count, doubled, increment }
  }
})
```

生命周期、`provide/inject`、`useI18n` 等依赖当前实例的 API 在 setup 执行期同步调用；不能在 await 之后或 `Promise.then/setTimeout` 中首次注册。异步业务逻辑放在已同步注册的回调中。

| 调用 | 参数与默认值 | 返回值 |
| --- | --- | --- |
| `provide(key, value)` | `key: string` 或 `symbol`；`value` 为任意依赖值，可传 ref / 响应式对象以保持响应性。 | `void`，向后代提供依赖。 |
| `inject(key, defaultValue?, treatDefaultAsFactory?)` | key 类型同 provide；可选默认值为任意值；`treatDefaultAsFactory: boolean` 默认 `false`，设为 `true` 时仅在未找到依赖且默认值为函数时执行该无参工厂。 | 返回最近上层提供的值，未命中时尝试应用级 provide，再使用默认值；都没有时返回 `undefined`。注入 ref 时保留 ref，脚本仍用 `.value`。 |
| `getCurrentInstance()` | 无参数；在有效实例上下文中调用，通常在 setup 中取得。 | 当前实例的上下文对象，无有效实例时返回 `null`；通过 `.proxy` 访问页面 / 组件实例，不依赖其他内部字段。 |

选项式 `provide` 可为对象或 `provide(): object`，工厂无参数、`this` 为当前实例；`inject` 可为键名数组，或 `{ localName: { from: key, default: valueOrFactory } }`。选项式 default 为函数时按工厂调用；组合式如需注入函数本身作为默认值，应保持 `treatDefaultAsFactory: false`。

```js
import { provide, inject, ref } from '@mpxjs/core'

// 在上层 setup 内
provide('theme', ref('light'))
// 在后代 setup 内；未提供时创建默认 ref
const theme = inject('theme', () => ref('light'), true)
```

## script setup

`<script setup>` 顶层代码在每个页面/组件实例初始化时执行，绑定**不会自动暴露给模板**。`defineExpose()` 显式暴露模板所需字段，不暴露整份大型 store 或无 UI 对象。

```html
<template>
  <view>
    <text>{{title}}：{{count}}</text>
    <button bindtap="increment">增加</button>
  </view>
</template>
<script setup>
import { ref, toRefs } from '@mpxjs/core'
const props = defineProps({ title: { type: String, value: '计数' } })
const { title } = toRefs(props)
const count = ref(0)
function increment () { count.value++ }
defineExpose({ title, count, increment })
</script>
```

| 宏调用 | 参数 | 返回值与约束 |
| --- | --- | --- |
| `defineProps(propsOptions)` / `defineProps<Props>()` | 运行时属性声明对象，或 TS 类型参数 Props，二者不能同时传。 | 返回只读响应式 props 对象；运行时默认值用 `value`。 |
| `defineExpose(exposed)` | 要暴露的数据和方法对象，如 `{ count, increment }`。 | 无可消费返回值；声明模板及实例可访问的绑定，不作为取值表达式使用。无字段需暴露时传 `{}`。 |
| `defineOptions(options)` | 页面 / 组件构造选项的对象字面量。 | 无可消费返回值；提升为构造选项，不在每个实例中重新执行该声明。 |
| `useContext()` | 无参数。 | 返回 setup context 对象；字段、方法签名见 [组合式 API](#组合式-api)，具体端限制与实例 API 相同。 |
| `withDefaults(defineProps<Props>(), defaults)` | 第一参数必须为 TS 类型版 defineProps 调用，第二参数为默认值对象字面量。 | 返回带默认值的 props 对象；observer 等能力用运行时声明。 |

宏无需 import；`ref/computed`、生命周期等运行时 API 仍从 `@mpxjs/core` 导入。`defineProps` 的运行时参数及 `defineOptions` 不能引用 setup 局部变量，可引用 import 绑定。`<script setup>` 不支持 `src` 属性，也不支持通过 import 快捷注册 Mpx 子组件，使用 JSON `usingComponents`。RN 原生组件、Web Vue 组件按各端混合开发规则注册并隔离依赖。

## 运行时导出与全局方法

### 运行时导出

`@mpxjs/core` 提供以下默认导出与命名导出。

| 名称 | 使用入口 | 用途与说明 |
| --- | --- | --- |
| `Mpx` | core 默认导出 | 框架命名空间，静态方法与配置见 [Mpx 运行时对象](#mpx-运行时对象)。 |
| `ref` / `reactive` / `computed` / `watch` 等 | core 命名导出 | 响应式状态、派生数据与副作用，完整列表见 [数据响应](#数据响应)。 |
| `nextTick(callback?)` | core 命名导出 | 返回 Promise，回调参数、结果与调度边界见 [视图更新与 watch 回调](#视图更新与-watch-回调)。 |
| `getCurrentInstance()` | core 命名导出 | 返回当前实例上下文或 `null`，使用约束见 [组合式 API](#组合式-api)。 |
| `provide(key, value)` / `inject(key, defaultValue?, treatDefaultAsFactory?)` | core 命名导出 | 同步提供 / 注入依赖，参数与返回值见 [组合式 API](#组合式-api)。 |
| `useI18n(options?)` | core 命名导出 | 在 setup 中获取国际化能力，配置与返回对象见下文。 |
| `getMixin(options)` | core 命名导出 | 参数为 mixin 构造选项对象；原样返回该对象以辅助类型推导，不会注册、克隆或执行 mixin。将结果放入构造选项 `mixins` 或传给 `Mpx.mixin`。 |
| `toPureObject(object)` | core 命名导出 | 输入普通对象或数组，返回递归复制后的普通数据副本，不修改输入；Date、RegExp 等非普通对象保留引用，class 实例是否按普通对象处理受 `Mpx.config.observeClassInstance` 配置影响。不作为任意对象深克隆或 JSON 序列化工具。 |

`useI18n` 需先完成工程的 [i18n 配置](./template-reference.md#i18n-国际化)。无参数或传 `{}` 时取得全局国际化对象；传非空配置时创建或复用当前实例的局部国际化对象：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `messages` | `object` | 局部为空词条对象 | 按语言名分组的词条对象，例如 `{ 'zh-CN': { greeting: '你好' } }`。 |
| `locale` / `fallbackLocale` | `string` | 局部继承全局设置 | 当前语言 / 回退语言。 |
| `inheritLocale` | `boolean` | `true` | 指定独立的局部语言时设为 `false`。 |
| `fallbackRoot` | `boolean` | `true` | 局部翻译未命中时回退到全局词条。 |

基准返回对象含 `locale/fallbackLocale: Ref<string>`、`messages: ShallowRef<object>`、`isGlobal: boolean`、`inheritLocale/fallbackRoot: boolean`，以及下列方法；修改语言使用 `locale.value = 'zh-CN'`。Web 的返回字段与额外格式化能力以 Web 参考为准。

| 方法 | 参数 | 返回值 |
| --- | --- | --- |
| `t(key, values?)` / `t(key, choice, values?)` | `key: string` 为词条路径，`values` 为命名插值对象或位置插值数组，`choice: number` 为复数选择值。 | 翻译后的 `string`。 |
| `te(key)` | `key: string`，待检查的词条路径。 | `boolean`，是否存在该词条。 |
| `tm(key)` | `key: string`，词条路径。 | 对应词条资源，可为字符串、对象或数组；未命中时为 `undefined`。 |
| `getLocaleMessage(locale)` | `locale: string`。 | 该语言的词条对象；未设置时可能为 `undefined`。 |
| `setLocaleMessage(locale, messages)` / `mergeLocaleMessage(locale, messages)` | `locale: string`；`messages: object` 为该语言词条。 | `void`，分别替换 / 合并词条并通知更新。 |

#### Mpx 运行时对象

`@mpxjs/core` 默认导出 `Mpx`，作为框架运行时全局对象，包含以下静态方法和属性。

| 名称 | 使用入口 | 用途与说明 |
| --- | --- | --- |
| `Mpx.mixin(mixins, options?)` / `Mpx.injectMixins(mixins, options?)` | Mpx 静态方法 | mixins 为构造选项对象或对象数组；options 指定类型与顺序，见下文。返回 `Mpx`，可链式调用。 |
| `Mpx.observable(target)` | Mpx 静态方法 | 对应命名导出 `reactive(target)`，参数和返回值相同。 |
| `Mpx.watch(source, callback, options?)` | Mpx 静态方法 | 对应组合式 `watch`，不是实例 `$watch` 的路径字符串版本；返回停止函数。 |
| `Mpx.set(target, key, value)` / `Mpx.delete(target, key)` | Mpx 静态方法 | 分别对应命名导出 `set` / `del`，返回写入的 value / `void`。 |
| `Mpx.isReactive(value)` / `Mpx.isRef(value)` | Mpx 静态方法 | 对应同名命名导出，返回 `boolean`。 |
| `Mpx.use(plugin, options?)` | Mpx 静态方法 | plugin 为函数或带 install 方法的对象，options 默认为 `{}`；返回 `Mpx`，插件契约见下文。 |
| `Mpx.config` | Mpx 静态属性 | 运行时配置，见 [配置基准](./config-reference.md)。 |

`Mpx.mixin` 的 options 可直接传 `'app'/'page'/'component'` 或这些类型的数组，也可传 `{ types, stage }`：`types` 为字符串或数组，默认 `['page', 'component']`；`stage: number` 默认 `-1`，负数在局部 mixins 前合并，正数在其后，数值越小越靠前，`0` 按默认值处理。在相关构造调用之前注入；要影响 App 需显式指定 `'app'`。

`Mpx.use` 同步调用插件函数 `plugin(proxyMpx, options, Mpx)` 或对象的 `install(proxyMpx, options, Mpx)`；第一个参数用于挂载 API，第二个参数是配置，第三个是原始 Mpx 对象。插件返回值不被消费，同一插件对象或函数只安装一次。options 除插件自有字段外，还支持 `prefix?: string` / `postfix?: string`，将新增 API 改名为 `prefix_name` / `name_postfix`，两者同时提供时 prefix 优先。

### 全局方法

`getApp()`、`getCurrentPages()` 为全局入口，无需从 core 导入。

| 名称 | 使用入口 | 用途与说明 |
| --- | --- | --- |
| `getApp()` | 全局方法 | 无需参数，返回应用实例，可访问 globalData 和自定义方法；应在 App 注册完成后调用，宿主扩展参数及具体行为见目标端参考。 |
| `getCurrentPages()` | 全局方法 | 无参数，返回页面实例数组，顺序为栈底到栈顶，最后一项是当前页面；尚无页面时为空数组。不能通过修改该数组导航，宿主栈细节见目标端参考。 |
