# 脚本基础

本页以 Mpx 核心脚本能力为基准，描述构造、响应式、实例方法与生命周期；能力收录不以全端支持为前提。RN/Web 的可用范围与差异见对应端脚本参考；微信 Skyline 的 renderer、滚动事件、节点查询及类型校验差异见 [运行时最佳实践](../skyline/skyline-runtime-practice.md)。

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
  - [数据响应使用要求](#数据响应使用要求)
  - [视图更新与 watch 回调](#视图更新与-watch-回调)
  - [强制更新](#强制更新)
- [组合式 API](#组合式-api)
- [script setup](#script-setup)
- [运行时导出与全局方法](#运行时导出与全局方法)
  - [运行时导出](#运行时导出)
  - [全局方法](#全局方法)

## 构造选项

从 `@mpxjs/core` 导入 `createApp`、`createPage`、`createComponent`。App 用于全局字段及应用生命周期；页面和组件支持响应式与组合式能力。

### App 构造选项

```js
import { createApp } from '@mpxjs/core'

createApp({
  globalData: { version: '1.0.0' },
  onLaunch (options) { console.log(options) }
})
```

| 选项 | 基准语义 |
| --- | --- |
| `globalData` 及自定义字段 | 声明应用级共享字段，不自动成为响应式状态。 |
| 自定义方法 / `methods` | 声明应用级业务方法；`methods` 中的方法会展开到 App 实例。 |
| `onLaunch` / `onShow` / `onHide` 等 | 应用生命周期与事件回调，具体支持范围由目标端确定。 |
| `provide` | 应用级依赖提供，支持对象或返回对象的工厂函数，供页面和组件注入。 |
| `mixins` | 合并公共 App 构造选项。 |

App 不支持 `data/computed/watch/inject/setup` 构造能力。

### 页面与组件构造选项

通过 `createPage(options)` 注册页面，通过 `createComponent(options)` 注册组件。下表“适用”列区分页面、组件与通用能力；“通用”表示页面和组件均适用，具体支持范围仍需结合构造方式及目标端判断。

| 选项 | 适用 | 基准语义 |
| --- | --- | --- |
| `properties` / `props` | 组件 | 声明只读的响应式输入，两者合并并参与数据响应，见 [数据响应](#数据响应)。 |
| `data` / `computed` / `watch` | 通用 | 状态、派生数据与副作用，见 [数据响应](#数据响应)。 |
| `methods` | 通用 | 实例业务方法与模板事件处理器。 |
| `provide` / `inject` | 通用 | 向后代提供依赖或接收上层依赖；provide 为对象或工厂函数，inject 为数组或对象。 |
| `setup` | 通用 | 组合式入口，返回模板需要的数据和方法。 |
| `mixins` | 通用 | 合并公共构造选项；沿用已有工程的合并策略。 |
| `relations` | 组件 | 声明组件间的父子 / 祖先后代关系，监听关系建立和解除，见 [关系能力](#关系能力)。 |
| `externalClasses` | 通用 | 声明外部样式类；跨端还需核对编译配置与目标端样式规则，页面可用性取决于其构造方式及目标端。 |
| `options` | 通用 | 宿主选项，支持范围由实例构造方式及目标端确定。 |
| `onLoad` / `onShow` / `onReady` / `onUnload` 等 | 页面 | 页面生命周期，阶段对应关系见 [统一生命周期](#统一生命周期)。 |
| `created` / `attached` / `ready` / `detached` 等 | 组件 | 组件生命周期，阶段对应关系见 [统一生命周期](#统一生命周期)。 |
| `onPageScroll` | 页面 | 页面滚动时触发，接收滚动位置等信息。 |
| `onReachBottom` | 页面 | 页面滚动至底部触发区域时调用，触发距离由页面配置决定。 |
| `onPullDownRefresh` | 页面 | 开启页面下拉刷新后，在触发刷新时调用。 |
| `onShareAppMessage` | 页面 | 用户触发页面分享时调用，返回分享标题、路径等配置。 |
| `pageLifetimes` | 组件 | 包含 `show()`、`hide()`、`resize(size)`，分别在组件所在页面显示、隐藏、尺寸变化时触发。 |

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
| `ONLOAD` | `onLoad(rawQuery, decodedQuery)` | 页面加载时，接收页面参数。 |
| `ONSHOW` / `ONHIDE` / `ONRESIZE` | `onShow` / `onHide` / `onResize` | 页面显示 / 隐藏 / 尺寸变化时；组件对应所在页面的 `pageLifetimes` 回调。 |

表中是 Mpx 生命周期的基准阶段对应关系，不承诺各端回调时序完全一致；DOM、RN 挂载与小程序原生通知应按目标端参考判断。`onLoad` 第二参数 `decodedQuery` 为 Mpx 抹平后的解码结果；不要再次重复解码。refs/布局查询放在挂载及之后，清理定时器和订阅放在卸载阶段。

`onReactHooksExec/REACTHOOKSEXEC` 只用于 RN 混编；`onServerPrefetch/SERVERPREFETCH` 只用于 Web SSR。

### 关系能力

`relations` 用于关联组件实例，双方需要声明配对的 `parent` / `child` 或 `ancestor` / `descendant` 关系。前一组表达直接父子关系，后一组表达祖先与后代关系；组件还需满足实际节点树中的嵌套关系，仅声明配置不会建立关联。

通常以目标组件路径作为关系键。Mpx 可通过 `import childPath from './child.mpx?resolve'` 获取构建后的组件路径，并使用 `relations: { [childPath]: { type: 'child' } }` 声明；查询时使用同一个关系键。

| 配置项 | 基准语义 |
| --- | --- |
| `type` | 必填，取值为 `parent`、`child`、`ancestor`、`descendant`。 |
| `linked(target)` | 关系建立时调用，`target` 为关联组件实例。 |
| `unlinked(target)` | 关系解除时调用，`target` 为解除关联的组件实例。 |
| `target` | 指定目标节点应具有的 behavior，以关联具有该 behavior 的组件。 |

通过 `this.getRelationNodes(relationKey)` 获取对应关系的关联实例数组，没有关联节点时返回空数组。应在关系建立后使用，或在 `linked` / `unlinked` 回调中直接使用传入的 `target`；跨端的匹配范围与支持限制见 RN / Web 脚本参考。

### 通过 implement 适配构造选项

部分 App、页面或组件构造选项在目标端没有内建实现。对于被跨端转换列为未支持的选项，框架默认移除声明，并在开发环境报错提示。业务需要复用这些声明时，可通过 `implement` 登记适配，再由业务适配层提供实际行为。

从 `@mpxjs/core` 导入 `implement`，在相关 App/页面/组件构造之前调用 `implement(name, { modes, processor, remove })`：

- `name`：需要适配的构造选项名，例如 `onShareAppMessage`；不是实例方法名或环境 API 名。
- `modes`：适配生效的输出端列表，例如 `['web']` 或 `['ios', 'android', 'harmony']`。当前输出端不在列表中时，不执行登记或 `processor`。
- `processor`：可选的适配初始化函数，在每次有效登记时同步执行，不接收实例或构造选项，也不会自动去重。可在其中注入 mixin，将依赖实例的逻辑放入生命周期或方法。
- `remove`：默认 `false`，使已登记的选项通过未支持检查并保留声明；设为 `true` 时仍移除该选项，适用于由适配层接管行为、无需保留原声明的情况。

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
| `$watch/$set/$delete/$nextTick` | 通用 | 动态侦听、响应式增删键与等待视图更新。 |
| `triggerEvent(name, detail, options)` | 组件 | 组件向外派发自定义事件，传递 detail；小程序传播选项可表达冒泡、跨组件边界和捕获。 |
| `selectComponent/selectAllComponents` | 通用 | 根据 selector 获取当前页面或组件内一个或多个子组件实例。 |
| `getRelationNodes(relationKey)` | 组件 | 获取 `relations` 中指定关系对应的关联组件实例数组；参数为关系声明中的键，不是 selector。 |
| `getOpenerEventChannel()` | 页面 | 获取与打开当前页面的页面之间的事件通道，用于页面间通信；页面 setup context 也提供此方法。 |
| `getTabBar()` | 通用 | 获取当前页面的自定义 tabBar 组件实例；需配置自定义 tabBar，跨端及组件内调用支持由目标端确定。 |
| `getPageId()` | 通用 | 获取当前实例所在页面的标识，可用于判断多个组件是否属于同一页面；不是路由路径。 |
| `createSelectorQuery()` | 通用 | 创建节点查询对象，查询当前页面或组件内节点的信息。 |
| `createIntersectionObserver(options?)` | 通用 | 创建相交状态观察对象，观察当前页面或组件内节点与参照区域的相交状态。 |
| `setData` | 通用 | 兼容小程序的显式数据更新方式，不作为常规更新方式推荐。 |
| `$forceUpdate` | 通用 | 强制视图更新；基准用法可传数据对象和更新完成回调，也可通过数据路径指定更新字段。 |

页面与组件实例上的 `id`、`dataset`、`data` 是保留字段。不要在 props、data、computed、methods、setup 返回值、inject 或 mixin 合并字段中使用这些名称。

上述页面/组件实例能力的基准定义不等于各端都具备相同实现。例如 Web 不提供 `setData`，`$forceUpdate` 仅支持无参刷新；RN 的 selector 查询依赖节点查询。具体参数、选择器及事件传播限制见 [RN 脚本](../rn/rn-script-reference.md) / [Web 脚本](../web/web-script-reference.md)。

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

- `properties` / `props` 声明响应式输入，两者合并；支持 `title: String` 或 `{ type: String, value: '', observer() {} }`。通过 `this.propName` 读取，可被 `computed`、`watch` 和模板依赖；输入变化时相应依赖会更新，不在当前实例中直接修改 props。
- `data` 使用对象或返回对象的函数；避免与 props 重名。
- `computed` 基于依赖缓存，支持函数以及 `get/set` 形式；展示派生值优先用 computed。
- `watch` 处理副作用，支持路径字符串、函数/handler 配置、`deep`、`immediate`、`flush`；Mpx 选项式支持以逗号分隔多个路径。
- 实例 `$watch` 动态创建侦听器，返回停止函数；监听外部对象或长生命周期资源时注意清理。

### 组合式数据响应 API

用于在 `setup` 中组织响应式状态、派生数据与副作用，并抽取可复用的状态逻辑，使用方式见下方 [组合式 API](#组合式-api)。从 `@mpxjs/core` 导入运行时 API，避免直接引入 Vue 的响应系统形成两套状态链。

| API | 用途 |
| --- | --- |
| `ref`、`shallowRef`、`triggerRef` | 标量或对象包装、浅层包装与手动触发浅层更新；脚本通过 `.value` 访问。 |
| `reactive`、`shallowReactive`、`markRaw` | 深层/浅层观测与跳过观测。 |
| `toRef`、`toRefs`、`unref`、`isRef`、`isReactive` | 保持字段响应式、解包与判定。 |
| `customRef` | 自定义依赖跟踪与触发。 |
| `computed` | 计算 ref，可只读或提供 getter/setter。 |
| `watch`、`watchEffect` | 显式数据源或自动跟踪依赖的副作用。 |
| `watchPostEffect`、`watchSyncEffect` | 更新后/同步执行副作用。 |
| `effectScope`、`getCurrentScope`、`onScopeDispose` | 成组管理副作用与释放资源。 |

```js
import { ref, computed, toRefs } from '@mpxjs/core'

// 位于组件的 setup(props) 内
const count = ref(0)
const doubled = computed(() => count.value * 2)
// const { title } = toRefs(props) // 解构 props 时保留响应式
```

直接解构 `props` 会丢失字段响应式；使用 `toRefs(props)` 或 `toRef(props, 'title')`。Pinia 解构 state/getter 使用 `storeToRefs`，见 [状态管理](./store-reference.md)。

### 数据响应使用要求

- 对象属性增删与数组变更需使用可被响应系统检测的方式，才能保证视图更新：
  - 对象新增/删除键使用 `this.$set(obj, key, value)` / `this.$delete(obj, key)`，组合式使用命名导出 `set` / `del`。
  - 数组用 `push/splice` 等可观测变更方法；按索引赋值或修改 `length` 不能直接假定可被检测，可用 `set(list, index, value)` 或 `splice`。
- props 为只读输入；需要本地编辑态时创建独立状态，通过事件通知父层更新。
- 不把大量无 UI 数据、宿主对象或外部 class 实例无差别挂入响应式状态；按需使用 `markRaw` / `shallowRef`。

### 视图更新与 watch 回调

响应式状态赋值立即生效，视图更新默认异步批量调度；同一 tick 内重复触发的更新任务会合并，赋值后立即查询布局可能仍得到旧视图。小程序中，框架执行更新任务后通过 `setData` 提交数据，宿主视图渲染完成还需等待其回调。

选项式 `watch`、实例 `$watch` 与组合式 `watch/watchEffect` 的后续回调由 `flush` 控制，当前默认是 `pre`：

| `flush` | 依赖变更后的回调时机 |
| --- | --- |
| `'pre'`（默认） | 异步入队并去重；关联页面/组件实例时，在该实例的更新任务前执行。 |
| `'post'` | 异步入队并去重，在本轮框架更新队列执行后触发；小程序中不等待 `setData` 渲染完成回调。 |
| `'sync'` | 依赖触发时同步执行，不经过队列批处理；避免用于高频变更或批量修改的数据。 |

首次执行与后续调度需分开理解：`watch` 默认只收集依赖，不立即调用回调；设置 `immediate: true` 时，注册阶段同步调用一次，即使配置了 `flush: 'post'`。`watchEffect` 默认立即执行一次以收集依赖，配置 `flush: 'post'` 时首次也进入后置队列。`watchPostEffect` / `watchSyncEffect` 分别是指定 `post` / `sync` 的 `watchEffect`。

数据赋值后，使用实例 `$nextTick(callback)` 或命名导出 `nextTick(callback)` 在视图更新后执行回调，也可通过 `await nextTick()` 等待视图更新后继续操作。

### 强制更新

普通响应式赋值即可驱动视图更新；需要强制刷新时，使用实例 `this.$forceUpdate` 或组合式 `context.forceUpdate`。

| 调用形式 | 基准语义 |
| --- | --- |
| `$forceUpdate()` / `$forceUpdate(callback)` | 强制刷新当前实例，可只传回调。 |
| `$forceUpdate(data, callback?)` | 将数据对象同步写回实例，再请求刷新；键支持 `'info.name'`、`'list[0]'` 等路径。 |
| `$forceUpdate(data, { sync: true }, callback?)` | 立即发起更新；省略 `sync` 时更新默认入队。 |

传入数据会修改实例状态，不是仅用于本次显示的临时数据，不应借此修改 props。回调等待本次视图更新完成，方法返回 `undefined`，不能通过 `await $forceUpdate()` 等待更新。

Web 的参数支持差异见 [Web 更新差异](../web/web-script-reference.md#强制更新)。

## 组合式 API

`setup(props, context)` 的 props 为只读响应式输入；解构使用 `toRefs` / `toRef`。context 提供 `triggerEvent`、`refs`、`nextTick`、`forceUpdate`、组件查询与布局查询等实例能力，具体可用范围以目标端为准。使用具名 refs 时在模板写 `wx:ref="panel"`，挂载后访问 `context.refs.panel`。

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

| 宏 | 用途与约束 |
| --- | --- |
| `defineProps` | 运行时属性声明或 TS 类型声明；运行时默认值用 `value`。 |
| `defineExpose` | 声明模板访问的数据与方法。 |
| `defineOptions` | 提升页面/组件构造选项。 |
| `useContext` | 取得 setup context，具体端限制与实例 API 相同。 |
| `withDefaults` | 配合 TS 类型版 `defineProps` 设置默认值；observer 等能力用运行时声明。 |

宏无需 import；`ref/computed`、生命周期等运行时 API 仍从 `@mpxjs/core` 导入。`defineProps` 的运行时参数及 `defineOptions` 不能引用 setup 局部变量，可引用 import 绑定。`<script setup>` 不支持 `src` 属性，也不支持通过 import 快捷注册 Mpx 子组件，使用 JSON `usingComponents`。RN 原生组件、Web Vue 组件按各端混合开发规则注册并隔离依赖。

## 运行时导出与全局方法

### 运行时导出

`@mpxjs/core` 提供以下默认导出与命名导出。

| 名称 | 使用入口 | 用途与说明 |
| --- | --- | --- |
| `Mpx` | core 默认导出 | 框架命名空间，静态方法与配置见 [Mpx 运行时对象](#mpx-运行时对象)。 |
| `ref` / `reactive` / `computed` / `watch` 等 | core 命名导出 | 响应式状态、派生数据与副作用，完整列表见 [数据响应](#数据响应)。 |
| `nextTick` | core 命名导出 | 等待视图更新，支持回调或 Promise 用法。 |
| `getCurrentInstance` | core 命名导出 | 获取当前页面/组件的内部实例，通过返回值的 `.proxy` 访问页面/组件实例；应在 `setup` 等有效实例上下文中调用，避免依赖其他内部字段。 |
| `provide` / `inject` | core 命名导出 | 在 `setup` 中同步提供或注入依赖。 |
| `useI18n` | core 命名导出 | 在 `setup` 中获取国际化能力。 |
| `getMixin` | core 命名导出 | 处理 mixin 定义。 |
| `toPureObject` | core 命名导出 | 转换为纯对象。 |

#### Mpx 运行时对象

`@mpxjs/core` 默认导出 `Mpx`，作为框架运行时全局对象，包含以下静态方法和属性。

| 名称 | 使用入口 | 用途与说明 |
| --- | --- | --- |
| `Mpx.mixin` / `Mpx.injectMixins` | Mpx 静态方法 | 注入公共 mixin。 |
| `Mpx.observable` | Mpx 静态方法 | 对应命名导出 `reactive`。 |
| `Mpx.watch/set/delete/isReactive/isRef` | Mpx 静态方法 | 对应同源响应式方法；其中 `Mpx.delete` 对应命名导出 `del`。 |
| `Mpx.use(plugin, options)` | Mpx 静态方法 | 安装插件；支持用 `prefix/postfix` 处理挂载 API 命名冲突。 |
| `Mpx.config` | Mpx 静态属性 | 运行时配置，见 [配置基准](./config-reference.md)。 |

### 全局方法

`getApp()`、`getCurrentPages()` 为全局入口，无需从 core 导入。

| 名称 | 使用入口 | 用途与说明 |
| --- | --- | --- |
| `getApp()` | 全局方法 | 获取应用对象，具体行为见目标端参考。 |
| `getCurrentPages()` | 全局方法 | 获取当前页面栈；不能通过修改返回的页面栈来导航，宿主栈细节见目标端参考。 |
