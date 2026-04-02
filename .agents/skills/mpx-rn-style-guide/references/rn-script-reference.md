# 跨端输出 RN 逻辑能力参考

本文档详细描述了 Mpx 跨端输出 RN 的逻辑能力支持情况，包括 `<script>` 中可用的构造选项、实例 API、数据响应与组合式 API 等。

## 目录

- [构造选项](#构造选项)
  - [App 构造选项](#app-构造选项)
  - [页面 / 组件构造选项](#页面--组件构造选项)
  - [页面 / 组件实例方法与属性](#页面--组件实例方法与属性)
- [数据响应](#数据响应)
- [组合式 API](#组合式-api)
- [全局 API](#全局-api)
- [Mpx.config.rnConfig](#mpxconfigrnConfig)

---

## 构造选项

### App 构造选项

`createApp(options)` 用于注册应用级逻辑与全局字段。**App 不支持数据响应式构造选项**（无 `data` / `computed` / `watch` 等），**也不使用 `provide` / `inject` / `setup`**；全局状态请通过挂载在 `getApp()` 返回对象上的普通字段（如 `globalData`）或业务层单例维护。

页面或其它模块中读取全局数据：`const version = getApp().globalData.version`。

```html
<!-- app.mpx：应用级生命周期与 globalData -->
<script>
  import { createApp } from "@mpxjs/core"

  createApp({
    globalData: { version: "1.0.0" },
    onLaunch(options) {
      console.log("onLaunch", options.path, options.query, options.isLaunch)
    },
    onShow(options) {
      console.log("onShow", options)
    },
    onHide(payload) {
      console.log("onHide", payload.reason)
    },
    onError(err) {
      console.error(err)
    },
    onUnhandledRejection(evt) {
      console.warn(evt.reason)
    }
  })
</script>
```

| 选项 | 说明 |
| --- | --- |
| `onLaunch` | 冷启动后导航就绪时触发，入参含 `path`（路由名）、`query`（navigation params）、`scene`、`shareTicket`、`referrerInfo`、`isLaunch`（首次为 true）。 |
| `onShow` | 应用进入前台（`AppState` → active），入参同小程序风格的路由信息对象，取不到当前路由时可能为空对象。 |
| `onHide` | 应用进入后台，入参 `{ reason }`，`0` 表示退出类场景，`3` 表示其他，为对小程序语义的有限模拟。 |
| `onError` | 全局 JS 错误，RN 通过 `ErrorUtils.setGlobalHandler` 与已注册回调链式触发。 |
| `onUnhandledRejection` | 未处理的 Promise 拒绝（Hermes / `promise` rejection tracking 等）。 |
| `onPageNotFound` | 微信在要打开的页面不存在时回调，可写在 options 中，**RN 未接该宿主能力**，不会按微信语义触发。 |
| `onThemeChange` | 微信在系统深浅色等主题切换时回调，可写在 options 中，**RN 未接该宿主能力**，不会按微信语义触发。 |
| `onSSRAppCreated` | SSR 应用创建钩子，可写在 options 中，**RN 不使用 SSR**，不会触发。 |
| 其他顶层字段 | 非生命周期、非框架保留键会合并进 **`getApp()` 返回对象**，并与 `Mpx` 原型能力合并（如 `globalData`、自定义方法需自行挂到该对象或通过 `methods` 展开规则处理——以当前编译合并结果为准）。 |

---

### 页面 / 组件构造选项

页面使用 `createPage` 构造，组件使用 `createComponent` 构造，两者共享大部分能力选项。

```html
<!-- 页面与组件共用一套选项模型（data、methods、生命周期等） -->
<script>
  import { createPage } from "@mpxjs/core"

  createPage({
    data: { title: "首页" },
    onLoad(rawQuery, decodedQuery) {
      console.log(rawQuery, decodedQuery)
    },
    methods: {
      go() {
        /* ... */
      }
    }
  })
</script>
```

| 选项 | 适用 | 说明 |
| --- | --- | --- |
| `properties`（或 `props`） | 组件 | 对外属性声明，含 `type`、`value`、`observer` 等。 |
| `data` | 共用 | 实例状态，对象或返回对象的函数，RN 侧经响应式代理，可直接 `this.xxx = y` 更新视图。 |
| `computed` | 共用 | 计算属性，见「数据响应」节。 |
| `watch` | 共用 | 侦听器，支持 `deep` / `immediate` / `flush` 等。 |
| `methods` | 共用 | 实例方法，事件处理函数与业务方法建议写在此处。 |
| `provide` | 共用 | 对象或工厂函数。 |
| `inject` | 共用 | 数组或对象形式，解析父链 `provide` 与应用级注入（若存在）。 |
| `setup` | 共用 | 组合式入口，详情见[组合式 API](#组合式-api) 章节。 |
| `mixins` | 共用 | 选项合并，见 `docs-vitepress/guide/advance/mixin.md`。 |
| `components` | 共用 | `Record<string, React.ComponentType>`，可用于注册 RN 原生组件，跨平台输出时需添加条件编译包裹。 |
| `externalClasses` | 组件 | 外部样式类名，输出 RN 需在 `@mpxjs/webpack-plugin` 配置 `externalClasses` 才可生效。 |
| `options.disableMemo` | 组件 | 仅输出 RN 时有效，`true` 时禁用对组件渲染的 memo 行为，仅在异常情况下开启。 |
| `options.isCustomText` | 组件 | 仅输出 RN 时生效，通过 `@mpxjs/webpack-plugin` 配置 `customTextRules` 自动注入并生效，用于提示框架将命中的组件作为文本元素处理。 |
| `options.virtualHost` | 组件 | 输出 RN 时通过 `@mpxjs/webpack-plugin` 配置 `autoVirtualHostRules` 自动注入并生效，命中的组件不进行实体 `:host` 节点包裹。 |
| `options.multipleSlots` | 组件 | 输出 RN 时默认已支持 |
| `pageLifetimes.show` | 组件 | 所在页面展示或重新获得焦点时触发，与页面 `onShow` 时机对齐。 |
| `pageLifetimes.hide` | 组件 | 所在页面隐藏或失焦时触发，与页面 `onHide` 时机对齐。 |
| `pageLifetimes.resize` | 组件 | 所在页面可视区域尺寸变化时触发，与页面 `onResize` 时机对齐。 |
| `onLoad` | 页面 | 页面创建后调用，**两个参数** `(rawQuery, decodedQuery)`。 |
| `created` | 组件 | 组件实例刚创建，RN 由 `MpxProxy` 在实例建立阶段调度，此时不宜依赖完整视图。 |
| `attached` | 组件 | 组件进入节点树，RN 对齐为挂载流程中的对应阶段，详见 `docs-vitepress/guide/basic/lifecycle.md` 映射表。 |
| `ready` | 组件 | 组件布局完成、可与视图交互，RN 对应 React 挂载后的就绪时机，与页面 `onReady` 同属一套内置映射。 |
| `detached` | 组件 | 组件从节点树移除并销毁，RN 在 React 卸载时触发。 |
| `onReady` | 页面 | 页面初次渲染完成，**仅触发一次**，语义对齐组件 `ready`，由 `MpxProxy` 与 React 调度。 |
| `onUnload` | 页面 | 页面卸载（路由出栈或容器销毁），语义对齐组件 `detached`。 |
| `onShow` | 页面 | 页面展示或应用切回前台，组件侧用 `pageLifetimes.show` 或组合式 `onShow`。 |
| `onHide` | 页面 | 页面隐藏或应用切到后台，组件侧用 `pageLifetimes.hide` 或组合式 `onHide`。 |
| `onResize` | 页面 | 页面可视区域尺寸变化，入参含 `windowWidth` / `windowHeight` 等，组件侧用 `pageLifetimes.resize` 或组合式 `onResize`。 |
| `onPullDownRefresh` | 页面 | 输出 RN 时无效，输出 RN 时页面默认不可滚动，需自行使用 `scroll-view` 组件包裹，借助 `scroll-view` 中相关能力进行跨端兼容实现。 |
| `onReachBottom` | 页面 | 输出 RN 时无效，输出 RN 时页面默认不可滚动，需自行使用 `scroll-view` 组件包裹，借助 `scroll-view` 中相关能力进行跨端兼容实现。 |
| `onPageScroll` | 页面 | 输出 RN 时无效，输出 RN 时页面默认不可滚动，需自行使用 `scroll-view` 组件包裹，借助 `scroll-view` 中相关能力进行跨端兼容实现。 |
| `onShareAppMessage` | 页面 | 拉起分享时返回分享配置，输出 RN 时需注册 `Mpx.config.rnConfig.openTypeHandler.onShareAppMessage` 桥接系统分享能力进行实现。 |
| `onShareTimeline` | 页面 | 输出 RN 时无效。 |
| `onTabItemTap` | 页面 | 输出 RN 时无效，暂不支持。 |
| `onAddToFavorites` | 页面 | 输出 RN 时无效。 |
| `onSaveExitState` | 页面 | 输出 RN 时无效。 |

#### 注意事项

- 由于不同平台对 `onLoad` 中 `query` 参数的处理逻辑不同，有的进行了 `decodeURIComponent` 而有的没有，为了方便跨平台统一处理，Mpx 在 `onLoad` 生命周期中添加了第二个参数 `decodedQuery`，该参数能保证所有平台下获取到的结果都是经过 `decodeURIComponent` 处理的。

---

### 页面 / 组件实例方法与属性

```html
<template>
  <!-- RN：script 里传给 select* / SelectorQuery / IntersectionObserver 的 #id、.class 须在对应节点上写 wx:ref，编译期建 ref 并与 selector 映射 -->
  <view id="box" wx:ref="boxRef">内容</view>
</template>
<script>
  import { createPage } from "@mpxjs/core"

  createPage({
    ready() {
      this.createSelectorQuery()
        .select("#box")
        .boundingClientRect()
        .exec((res) => {
          console.log(res)
        })
    }
  })
</script>
```

| 名称 | 类型 | 适用 | 说明 |
| --- | --- | --- | --- |
| `route` | 属性 | 页面 | 当前路由名（screen name）。 |
| `getPageId()` | 方法 | 共用 | 返回当前实例所在页的 pageId 字符串。 |
| `getOpenerEventChannel()` | 方法 | 页面 | 打开当前页的 `EventChannel`，组件侧多为空实现占位。 |
| `triggerEvent(name, detail?)` | 方法 | 组件 | 向父节点派发自定义事件。 |
| `selectComponent(selector)` | 方法 | 共用 | 按选择器取第一个匹配实例。RN 不能像小程序一样按 selector 遍历视图树，须在模板目标节点上声明 **`wx:ref`**，由编译期创建 ref 并建立 **`#id` / `.class` 与节点**的映射后，本 API 才能按小程序写法解析。 |
| `selectAllComponents(selector)` | 方法 | 共用 | 取全部匹配实例数组，**RN 侧与 `selectComponent` 相同**：依赖模板 **`wx:ref`** 与编译期 selector 映射，仅支持 **`#id` / `.class`**。 |
| `createSelectorQuery()` | 方法 | 共用 | 在实例作用域内创建查询对象。后续 **`select(selector)`** 等链式调用在 RN 上同样依赖目标节点已写 **`wx:ref`**，通过编译映射将 `#id` / `.class` 落到真实视图，以兼容小程序用法。 |
| `createIntersectionObserver(options?)` | 方法 | 共用 | 在实例作用域内创建交叉观察。若相对某一节点观察且传入 **`#id` / `.class`**（如 `relativeTo` 等），RN 侧同样要求该节点模板已声明 **`wx:ref`** 并完成编译期映射，其余行为依赖 `@mpxjs/api-proxy` 的 RN 实现。 |
| `$refs` | 属性 | 共用 | 模板 `wx:ref` 对应的懒解析访问器集合，与上述基于 selector 的 API 共用同一套编译期 ref 信息。 |
| `$watch` | 方法 | 共用 | 动态创建对数据路径或表达式的侦听，返回用于停止侦听的函数，行为与选项式 `watch` 对齐。 |
| `$forceUpdate` | 方法 | 共用 | 强制触发视图更新，可传入数据对象参与本次刷新，RN 侧由 `MpxProxy` 与 React 更新调度配合完成。 |
| `$nextTick` | 方法 | 共用 | 在下一轮视图更新完成之后执行回调，用于在数据变更后读取更新后的视图状态。 |
| `$set` | 方法 | 共用 | 向响应式对象添加新属性并保证其为响应式且触发视图更新，等价于对「无法被自动侦测的新增属性」的补充。 |
| `$delete` | 方法 | 共用 | 删除响应式对象的属性并触发视图更新，用于需移除键且保持响应式一致性的场景。 |
| `setData` | 方法 | 共用 | 兼容 API，内部走强制更新。 |
| `__componentPath` | 属性 | 组件 | 编译注入的组件路径，供 relations 等内部逻辑使用。 |

#### 注意事项

- **RN 无原生 selector 视图查询**：`selectComponent`、`selectAllComponents`、`createSelectorQuery`（及其 `select` 等链式入参）、`createIntersectionObserver`（涉及相对节点的 selector 时）在小程序里依赖视图层按 selector 查找节点，**RN 底层不支持同等能力**。
- **须配合模板 `wx:ref`**：在**与 script 中 selector 对应**的节点上添加 **`wx:ref`**（指令名固定为 `wx:ref`，值为 ref 名，可与 `id` / `class` 并存），由 **Mpx 在编译期创建 ref**，并**建立 `#id` 与 `.class` 和 ref / 节点的映射**，从而在 RN 上**兼容**上述 API 在小程序中的写法。
- **选择器形态受限**：映射仅覆盖 **`#id` 与 `.class`**，不支持复合选择器、后代 / 子代等小程序其它选择器语法；未声明 `wx:ref` 的节点无法被这些 API 解析。
- **`createSelectorQuery` / `createIntersectionObserver` 的其余行为**（字段类型、布局测量、交叉比例等）仍以 `@mpxjs/api-proxy` 的 RN 实现为准，与真机布局、原生视图层级相关的能力请在设备上验证。

---

## 数据响应

Mpx 在页面与组件上对 `data` 做响应式处理：**直接赋值** `this.field = value` 即可驱动 RN 视图更新，无需 `setData`。`computed` 基于依赖缓存；`watch` 可控制 `flush`（如 `post` 默认在视图更新后）。

```js
import { createPage } from "@mpxjs/core"

createPage({
  data: { count: 0 },
  computed: {
    double() {
      return this.count * 2
    }
  },
  watch: {
    count() {
      console.log("count changed")
    }
  },
  methods: {
    inc() {
      this.count++
    }
  }
})
```

| 能力 | 适用 | 说明 |
| --- | --- | --- |
| `data` | 页面/组件 | 响应式状态根，避免与 `properties` 字段同名冲突。 |
| `computed` | 页面/组件 | 只读或可写计算属性。 |
| `watch` | 页面/组件 | 支持路径字符串、`handler` 对象形态、`deep` / `immediate`。 |
| `$set` | 页面/组件 | 为响应式对象新增键并保持响应式，触发视图更新。 |
| `$delete` | 页面/组件 | 删除响应式对象上的键并触发视图更新。 |

#### 注意事项

- App 级 **无** `data` / `computed` / `watch` 构造块；全局共享勿依赖 App 响应式。
- RN 与小程序一样需遵守「避免在响应式对象上存放过大、无需 UI 的裸数据」等通用性能建议，见 `reactive` 相关文档。

---

## 组合式 API

在 **`setup(props, context)`** 或 **`script setup`** 中使用：从 `@mpxjs/core` 导入响应式 API、生命周期钩子、`provide` / `inject` 等。钩子须在 **`setup` 执行期间同步注册**，依赖当前正在创建的实例上下文。

```js
import { createComponent, ref, computed, onMounted, provide } from "@mpxjs/core"

createComponent({
  setup(props, context) {
    const n = ref(0)
    const doubled = computed(() => n.value * 2)
    provide("token", "demo")
    onMounted(() => {
      console.log(n.value, context.refs)
    })
    return { n, doubled }
  }
})
```

| API | 参数 / 返回值概要 | RN 说明 |
| --- | --- | --- |
| `setup(props, context)` | 组合式入口，返回对象会合并到实例 | 与 `docs-vitepress/api/composition-api.md` 一致，`context` 各字段见下列各行。 |
| `context.triggerEvent` | `(name, detail?, options?) => void` | 语义同实例 `triggerEvent`，RN 上受 props 事件绑定方式约束。 |
| `context.refs` | 与选项式 `$refs` 对应 | RN 上依赖模板 `wx:ref` 与编译期映射，见「页面 / 组件实例方法与属性」注意事项。 |
| `context.asyncRefs` | Promise 形式 refs | 字节等场景为主，RN 侧以实际导出与类型为准。 |
| `context.nextTick` | `(fn) => void` | 同全局 `nextTick`，在视图更新后执行回调。 |
| `context.forceUpdate` | 可带参数与回调 | 同实例强制更新路径，RN 由 `MpxProxy` 调度。 |
| `context.selectComponent` | `(selector) => instance` | 同实例 `selectComponent`，RN 上 **selector 须由模板 `wx:ref` 参与编译映射**。 |
| `context.selectAllComponents` | `(selector) => instance[]` | 同实例 `selectAllComponents`，规则同上。 |
| `context.createSelectorQuery` | `() => SelectorQuery` | 同实例 `createSelectorQuery`，**`select` 等链式 selector** 在 RN 上同样依赖 **`wx:ref`** 映射。 |
| `context.createIntersectionObserver` | `(options?) => IntersectionObserver` | 同实例 `createIntersectionObserver`，涉及 **selector 相对节点** 时在 RN 上同样依赖 **`wx:ref`** 映射。 |
| `ref` | 基本引用容器 | 与 Vue 3 类似，可用于 `setup` 返回值驱动模板。 |
| `shallowRef` | 浅层 `ref` | 与 Vue 3 类似，深层属性变更不自动触发依赖。 |
| `unref` | 解包 `ref` | 与 Vue 3 类似。 |
| `toRef` | 从响应式对象取单键为 `ref` | 与 Vue 3 类似。 |
| `toRefs` | 对象各键转为 `ref` 集合 | 与 Vue 3 类似。 |
| `reactive` | 深层响应式对象 | 由 `@mpxjs/core` 导出，行为见响应式文档。 |
| `shallowReactive` | 浅层响应式对象 | 由 `@mpxjs/core` 导出。 |
| `computed` | getter 或 `{ get, set }` | 与 Vue 3 类似，可用于 `setup`。 |
| `watch` | 数据源 + 回调或选项对象 | 与 Vue 3 类似，支持 `flush` 等。 |
| `watchEffect` | 自动追踪依赖的副作用 | 由 `@mpxjs/core` 导出。 |
| `watchSyncEffect` | 同步 `flush` 的 `watchEffect` | 由 `@mpxjs/core` 导出。 |
| `watchPostEffect` | 视图更新后执行的 `watchEffect` | 由 `@mpxjs/core` 导出。 |
| `provide` | `provide(key, value)` | **仅在 `setup` 内** 调用，向子树提供依赖。 |
| `inject` | `inject(key, default?, treatDefaultAsFactory?)` | **仅在 `setup` 内** 调用，解析父组件 `provide`。App 构造选项不使用 `provide`，本文不展开应用级注入。 |
| `nextTick` | `(fn) => void` | 可在 `setup` 内外使用，与调度器一致。 |
| `getCurrentInstance` | 返回内部代理相关对象 | 高级用途，慎用。 |
| `onBeforeMount` | 布局完成前，refs 前置准备阶段 | RN 可用，语义对齐 Vue，与选项式映射见 `lifecycle.md`。 |
| `onMounted` | 布局完成、refs 可用 | RN 可用。 |
| `onBeforeUpdate` | 数据变更后、更新前 | RN 可用。 |
| `onUpdated` | 更新完成后 | RN 可用。 |
| `onBeforeUnmount` | 卸载前 | RN 可用。 |
| `onUnmounted` | 卸载后 | RN 可用。 |
| `onLoad` | 页面加载，可 `(rawQuery, decodedQuery)` | 仅页面 `setup`，RN 与选项式 `onLoad` 一致。 |
| `onShow` | 页面展示 | 仅页面 `setup`，RN 与选项式一致。 |
| `onHide` | 页面隐藏 | 仅页面 `setup`，RN 与选项式一致。 |
| `onResize` | 页面尺寸变化 | 仅页面 `setup`，RN 与选项式一致。 |
| `onPullDownRefresh` | 下拉刷新 | 与选项式相同，RN 无宿主自动触发，需自接 `scroll-view` 等能力。 |
| `onReachBottom` | 触底 | 与选项式相同，RN 无宿主自动触发。 |
| `onPageScroll` | 页面滚动 | 与选项式相同，RN 无宿主自动触发。 |
| `onShareAppMessage` | 分享配置 | 与选项式相同，RN 需配合 `Mpx.config.rnConfig.openTypeHandler.onShareAppMessage` 与 `button` 的 `open-type="share"`。 |
| `onShareTimeline` | 朋友圈分享 | 与选项式相同，RN 无效。 |
| `onTabItemTap` | Tab 项点击 | 与选项式相同，RN 无效。 |
| `onAddToFavorites` | 收藏 | 与选项式相同，RN 无效。 |
| `onSaveExitState` | 退出态保存 | 与选项式相同，RN 无效。 |
| `onServerPrefetch` | SSR 预取 | **RN 不使用**。 |
| `onReactHooksExec` | 与 RN 渲染协同 | 框架内部使用为主。 |
| `useI18n` | 见 i18n 文档 | 工程启用 i18n 时可用。 |

#### 注意事项

- 组合式生命周期 **禁止在异步回调里再注册**，否则会丢失当前实例上下文。
- `context.refs` 及 **`selectComponent` / `selectAllComponents` / `createSelectorQuery` / `createIntersectionObserver`** 在 RN 上与选项式相同：`refs` 在 `onMounted` 及之后更可靠，**凡传入 `#id` / `.class` 的用法均须在模板对应节点声明 `wx:ref`**，详见「页面 / 组件实例方法与属性」注意事项。

---

## 全局 API

Mpx 输出 RN 时模拟实现了微信小程序中常用的全局 API。

```js
const app = getApp()
console.log(app.globalData)

const stack = getCurrentPages()
console.log(stack.length)

// 宿主或测试场景下可手动触发应用前后台逻辑
setAppShow()
setAppHide()
```

| API | 说明 |
| --- | --- |
| `getApp()` | 返回应用全局对象（包含用户在 `createApp` 中声明的自定义字段），在页面/组件脚本执行前已可用。 |
| `getCurrentPages()` | 返回当前导航栈中已映射的页面实例列表（顺序与路由 state 相关）。 |
| `setAppShow()` | 手动触发应用「进入前台」逻辑，驱动已注册的 `onShow`。 |
| `setAppHide()` | 手动触发应用「进入后台」逻辑，驱动已注册的 `onHide`。 |

#### 注意事项

- 勿在 App 构造函数执行完成前依赖 `getApp()` 内业务字段已赋值完毕；与路由相关的初始化宜放在 `onLaunch` / `onShow`。
- `getCurrentPages()` 依赖 React Navigation 焦点与 `__mpxPagesMap`，与原生小程序栈细节不完全相同。

---

## mpx.config.rnConfig

运行时对象 **`Mpx.config.rnConfig`**（`Mpx` 为 `@mpxjs/core` 默认导出）用于扩展 RN 导航、分包、状态栏等行为。下列为脚本侧常见项（以源码为准，未列项可能随版本增加）。

```js
import Mpx from "@mpxjs/core"

// 须在 createApp 与页面脚本执行前完成赋值
Mpx.config.rnConfig = {
  parseAppProps(props) {
    return {
      initialRouteName: "pages/index",
      initialParams: props || {}
    }
  },
  onStateChange(state) {
    console.log("navigation state", state)
  },
  openTypeHandler: {
    onShareAppMessage(shareInfo) {
      console.log("share", shareInfo)
    },
    onUserInfo() {
      return { userInfo: { nickName: "RN" } }
    }
  }
}
```

| 配置项 | 说明 |
| --- | --- |
| `projectName` | 由构建注入到 RN 入口，与 `AppRegistry.registerComponent` 相关（偏构建侧）。 |
| `parseAppProps` | `(props) => { initialRouteName?, initialParams? }`，解析外层传入 App 根组件的初始路由。 |
| `onStateChange` | 导航 state 变化时回调。 |
| `disableAppStateListener` | 为 `true` 时不注册 `AppState` 监听（避免与宿主 App 重复）。 |
| `openTypeHandler` | 对象，注册 `button` 组件在 RN 上 `open-type` 的容器侧实现，未注册对应键时点击会告警。 |
| `openTypeHandler.onShareAppMessage` | 对应模板中 `open-type="share"`：框架会先取当前页 `onShareAppMessage` 的返回（含与默认 `title` / `path` 的合并及可选 `promise` 异步结果），再调用本回调，入参为 `{ title, path, imageUrl? }`，由宿主调起系统分享等能力。 |
| `openTypeHandler.onUserInfo` | 对应模板中 `open-type="getUserInfo"`：由宿主实现获取用户信息的逻辑，结果需满足按钮侧对 `bindgetuserinfo` 的约定（以 `@mpxjs/webpack-plugin` 中 `mpx-button` 运行时为准）。 |
| `statusBarTranslucent` | 影响 Stack `screenOptions` 中状态栏相关配置。 |
| `getBottomVirtualHeight` | Android 底部虚拟区域高度修正。 |
| `loadChunkAsync` | 异步分包加载实现。 |
| `downloadChunkAsync` | 分包下载实现，用于实现 preloadRule。 |
| `supportSubpackage` | 是否启用分包相关异步加载能力，与页面 `json` 中 `async` 等配合。 |
| `asyncChunk` | 异步页面的 `fallback`、`loading` 等组件路径配置，偏构建与运行时加载。 |

#### 注意事项

- `rnConfig` 为普通对象，应在 **任何页面 import 并执行 `createApp` 之前** 赋值，避免导航已初始化后配置未生效。
- 具体键名以 `packages/core/src/index.js` 注释、`createApp.ios.js`、`LoadAsyncChunkModule.js` 等处的读取逻辑为准。
