# 跨端输出 RN 逻辑能力参考

本文档详细描述了 Mpx 跨端输出 RN 的逻辑能力支持情况，包括 `<script>` 中可用的构造选项、实例 API、数据响应与组合式 API 等。

## 目录

- [构造选项](#构造选项)
  - [App 构造选项](#app-构造选项)
  - [页面 / 组件构造选项](#页面--组件构造选项)
  - [页面 / 组件实例方法与属性](#页面--组件实例方法与属性)
- [数据响应](#数据响应)
- [组合式 API](#组合式-api)
  - [`setup` 的第一个参数 `props`](#setup-的第一个参数-props)
  - [`setup` 的第二个参数 `context`](#setup-的第二个参数-context)
- [Mpx 运行时导出](#mpx-运行时导出)
  - [默认导出](#默认导出)
  - [命名导出](#命名导出)
- [全局 API](#全局-api)
- [Mpx.config.rnConfig](#mpxconfigrnConfig)
- [环境 API](#环境-api)
- [网络请求](#网络请求)
  - [拦截器](#拦截器)
  - [取消请求](#取消请求)
- [状态管理](#状态管理)

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

| 名称 | 类型 | 适用 | 说明 |
| --- | --- | --- | --- |
| `route` | 属性 | 页面 | 当前路由名（screen name）。 |
| `getPageId()` | 方法 | 共用 | 返回当前实例所在页的 pageId 字符串。 |
| `getOpenerEventChannel()` | 方法 | 页面 | 打开当前页的 `EventChannel`，组件侧多为空实现占位。 |
| `triggerEvent(name, detail?)` | 方法 | 组件 | 向父节点派发自定义事件。 |
| `selectComponent(selector)` | 方法 | 共用 | 按选择器取第一个匹配实例。RN 不能像小程序一样按 selector 遍历视图树，须在模板目标节点声明 **空 wx:ref**，由编译期建立 **`#id` / `.class` 与节点**的映射后，本 API 才能按小程序写法解析。 |
| `selectAllComponents(selector)` | 方法 | 共用 | 取全部匹配实例数组，**RN 侧与 `selectComponent` 相同**：依赖模板 **空 wx:ref** 与编译期 selector 映射，仅支持 **`#id` / `.class`**。 |
| `createSelectorQuery()` | 方法 | 共用 | 在实例作用域内创建查询对象。后续 **`select(selector)`** 等链式调用在 RN 上同样依赖目标节点 **空 wx:ref**，通过编译映射将 `#id` / `.class` 落到真实视图，以兼容小程序用法。 |
| `createIntersectionObserver(options?)` | 方法 | 共用 | 在实例作用域内创建交叉观察。若相对某一节点观察且传入 **`#id` / `.class`**（如 `relativeTo` 等），RN 侧同样要求该节点模板已声明 **空 wx:ref** 并完成编译期映射，其余行为依赖 `@mpxjs/api-proxy` 的 RN 实现。 |
| `$refs` | 属性 | 共用 | 模板 **`wx:ref="refName"`** 对应的懒解析访问器（如 `this.$refs.refName`）；**空 wx:ref 不会注册具名 ref**，但与 selector 映射可并存——需按名取子实例时再写 **`wx:ref="refName"`**。 |
| `$watch` | 方法 | 共用 | 动态创建对数据路径或表达式的侦听，返回用于停止侦听的函数，行为与选项式 `watch` 对齐。 |
| `$forceUpdate` | 方法 | 共用 | 强制触发视图更新，可传入数据对象参与本次刷新，RN 侧由 `MpxProxy` 与 React 更新调度配合完成。 |
| `$nextTick` | 方法 | 共用 | 在下一轮视图更新完成之后执行回调，用于在数据变更后读取更新后的视图状态。 |
| `$set` | 方法 | 共用 | 向响应式对象添加新属性并保证其为响应式且触发视图更新，等价于对「无法被自动侦测的新增属性」的补充。 |
| `$delete` | 方法 | 共用 | 删除响应式对象的属性并触发视图更新，用于需移除键且保持响应式一致性的场景。 |
| `$t` | 方法 | 共用 | 文案翻译（占位符、命名参数等与 vue-i18n 相近），依赖工程 **`MpxWebpackPlugin` 的 `i18n` 配置**，用法可参考 [rn-template-reference - i18n 国际化](./rn-template-reference.md#i18n-国际化)。 |
| `$tc` | 方法 | 共用 | 复数/数量相关翻译（`$tc(key, choice, ...)`）。 |
| `$te` | 方法 | 共用 | 判断文案 key 在当前语言下是否存在。 |
| `$tm` | 方法 | 共用 | 返回 key 在当前语言下的消息对象。 |
| `setData` | 方法 | 共用 | 小程序原生兼容 API，内部通过 `$forceUpdate` 进行实现。 |

#### 注意事项

- **`selectComponent`、`selectAllComponents`、`createSelectorQuery`（含 `select` 等链式入参）、`createIntersectionObserver`（`relativeTo` / `observe` 等涉及 selector 时）**在小程序中依赖视图层按 selector 查找节点，**RN 无同等原生能力**；须在**与 script 中 selector 对应**的节点上声明 **空 wx:ref**，可与 `id`、`class` 并存，由 **Mpx 编译期**根据 **`#id` / `.class` 建立映射**。若需 **`$refs` / `context.refs`** 按名访问，再使用 **`wx:ref="refName"`**。映射**仅支持 `#id` 与 `.class`**，不支持复合、后代等选择器；**未写 `wx:ref` 则无法解析**。`createSelectorQuery` / `createIntersectionObserver` 的测量与交叉等行为仍以 `@mpxjs/api-proxy` 的 RN 实现为准。

**使用示例：**

```html
<template>
  <!-- selector 相关 API：目标节点声明空 wx:ref；自定义组件须在 json 中注册后方可 selectComponent -->
  <card id="chip" wx:ref />
  <view id="box" class="block" wx:ref>内容</view>
  <view class="cell" wx:ref>单元 1</view>
  <view class="cell" wx:ref>单元 2</view>
</template>
<script>
  import { createPage } from "@mpxjs/core"

  createPage({
    ready() {
      this.selectComponent("#chip")
      this.selectAllComponents(".cell")
      this.createSelectorQuery()
        .select("#box")
        .boundingClientRect()
        .exec((res) => {
          console.log(res)
        })
      this.createIntersectionObserver()
        .relativeTo("#box")
        .observe(".cell", (res) => {
          console.log(res)
        })
    }
  })
</script>
```

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

在 **`setup(props, context)`** 或 **`script setup`** 中编写逻辑时，需从 **`@mpxjs/core` 命名导出** 引入 `ref`、`computed`、生命周期钩子、`provide` / `inject` 等（**完整清单与 RN 侧要点**见 **[Mpx 运行时导出 — 命名导出](#命名导出)** 表内 **说明** 列）。组合式生命周期钩子 **须在 `setup` 执行期间同步注册**，否则会丢失当前实例上下文。

```js
import { createComponent, ref, computed, onMounted, provide, toRefs } from "@mpxjs/core"

createComponent({
  properties: {
    title: String
  },
  setup(props, context) {
    const { title } = toRefs(props)
    const n = ref(0)
    const doubled = computed(() => n.value * 2)
    provide("token", "demo")
    onMounted(() => {
      console.log(n.value, title.value, context.refs)
    })
    return { n, doubled, title }
  }
})
```

### `setup` 的第一个参数 `props`

与选项式 **`properties`** 对应：为**只读**对象，字段与组件 / 页面在 `json` 或 `props` 选项中声明一致。不要在子组件内对 `props` 根对象整体赋值；需要可写副本时在 `setup` 内用 `ref` / `reactive` 承接。

若要在 `setup` 内**按字段解构**使用，请对 **`toRefs(props)`**（或单个字段 **`toRef(props, 'key')`**）再解构，这样各字段仍是 **ref**，父组件传入变化时子侧会更新。不要写 **`const { foo } = props`**，也不要把形参写成 **`setup({ foo }, context)`**：`props` 在运行时是响应式代理，直接解构会丢掉响应式，与 Vue 3 行为一致。

### `setup` 的第二个参数 `context`

与选项式实例上暴露的部分能力等价，便于在纯函数 `setup` 内调用。**输出 RN** 时与 `select` / `refs` 相关的规则与选项式相同，下表仅强调 RN 侧注意点。

| 字段 | 参数 / 返回值概要 | RN 说明 |
| --- | --- | --- |
| `triggerEvent` | `(name, detail?, options?) => void` | 语义同实例 `triggerEvent`，RN 上受 props 事件绑定方式约束。 |
| `refs` | 与选项式 `$refs` 对应 | 仅 **`wx:ref="refName"`** 会出现在 `refs` 上；**空 wx:ref** 只服务 selector 映射。详见「页面 / 组件实例方法与属性」注意事项。 |
| `asyncRefs` | Promise 形式 refs | 字节等场景为主，RN 侧以实际导出与类型为准。 |
| `nextTick` | `(fn) => void` | 同全局 `nextTick`，在视图更新后执行回调。 |
| `forceUpdate` | 可带参数与回调 | 同实例强制更新路径，RN 由 `MpxProxy` 调度。 |
| `selectComponent` | `(selector) => instance` | 同实例 `selectComponent`，RN 上 **selector 须由模板 `wx:ref` 参与编译映射**。 |
| `selectAllComponents` | `(selector) => instance[]` | 同实例 `selectAllComponents`，规则同上。 |
| `createSelectorQuery` | `() => SelectorQuery` | 同实例 `createSelectorQuery`，**`select` 等链式 selector** 在 RN 上同样依赖 **`wx:ref`** 映射。 |
| `createIntersectionObserver` | `(options?) => IntersectionObserver` | 同实例 `createIntersectionObserver`，涉及 **selector 相对节点** 时在 RN 上同样依赖 **`wx:ref`** 映射。 |

#### 注意事项

- 组合式生命周期 **禁止在异步回调里注册**，否则会丢失当前实例上下文。
- `context.refs` 及 **`selectComponent` / `selectAllComponents` / `createSelectorQuery` / `createIntersectionObserver`** 在 RN 上与选项式相同：`refs` 在 `onMounted` 及之后更可靠，**凡传入 `#id` / `.class` 的用法均须在模板对应节点声明空 wx:ref**（具名访问用 `wx:ref="refName"`），详见「页面 / 组件实例方法与属性」注意事项。

---

## Mpx 运行时导出

依据 **`packages/core/src/index.js`** 及其 **`export *`**（**`platform/export/index.js`**，以及可能对 **`@mpxjs/store`** 的再导出）整理；与版本不一致时以包内源码与类型声明为准。全局状态方案选型见 **[状态管理](#状态管理)**。

### 默认导出

`@mpxjs/core` 的**默认导出**为构造函数 **`Mpx`**。业务中通常写作 **`import Mpx from '@mpxjs/core'`**，并把它当作**命名空间对象**使用，而不是 `new Mpx()`。框架在初始化时会把平台 API 合并到 **`Mpx` 的静态属性**以及 **`Mpx.prototype`** 上，因此选项式页面 / 组件实例上的 `$wx`、`setData` 等能力，与这里的原型挂载一一对应。

全局运行时配置集中在 **`Mpx.config`**（在 **`packages/core/src/index.js`** 里创建默认值，可按需改写）。其中 **`rnConfig`** 与输出 RN 关系最大，逐项说明见下文 **[Mpx.config.rnConfig](#mpxconfigrnconfig)**。

#### `Mpx.config` 各字段

| 属性 | 说明 |
| --- | --- |
| `useStrictDiff` | 是否启用更严格的 diff 策略（默认 `false`，以源码为准）。 |
| `ignoreWarning` | 为 `true` 时忽略框架部分警告。 |
| `ignoreProxyWhiteList` | 字符串数组，列出的路径不做响应式代理（默认含 `id`、`dataset`、`data`）。 |
| `observeClassInstance` | 是否尝试将 class 实例变为响应式（默认 `false`，慎用）。 |
| `errorHandler` | 全局错误处理函数，可为 `null`。 |
| `warnHandler` | 全局警告处理函数，可为 `null`。 |
| `proxyEventHandler` | 事件代理链路中的钩子，高级用途。 |
| `setDataHandler` | `setData` 调用前后的钩子，高级用途。 |
| `forceFlushSync` | 是否强制同步 flush 更新（默认 `false`）。 |
| `webRouteConfig` | 输出 Web 时的路由相关配置对象。 |
| `webConfig` | 输出 Web 时的通用配置对象。 |
| `webviewConfig` | WebView 场景配置（如域名白名单、`apiImplementations` 等，见源码注释）。 |
| `rnConfig` | 输出 React Native 时的扩展配置（导航、分包、`open-type` 容器实现、状态栏等），详见 [Mpx.config.rnConfig](#mpxconfigrnconfig)。 |

#### `Mpx` 静态属性与方法

| 符号 | 说明 |
| --- | --- |
| `injectMixins` | 注入 mixin，与 `mixin` 等价。 |
| `mixin` | 同 `injectMixins`。 |
| `observable` | `reactive` 的别名。 |
| `watch` | 与命名导出 `watch` 同源。 |
| `set` | 与命名导出 `set` 同源（响应式设值）。 |
| `delete` | 与命名导出 `del` 同源（响应式删键）。 |
| `isReactive` | 与命名导出 `isReactive` 同源。 |
| `isRef` | 与命名导出 `isRef` 同源。 |
| `use` | 安装插件：`Mpx.use(plugin, options?)`；`options.prefix` / `postfix` 可避免与已有 API 命名冲突。 |

#### `Mpx.prototype` 实例方法

| 符号 | 说明 |
| --- | --- |
| `$set` | 选项式实例上设值，语义与命名导出 `set` 一致。 |
| `$delete` | 选项式实例上删键，语义与命名导出 `del` 一致。 |

### 命名导出

| 导出名 | 说明 |
| --- | --- |
| `createApp` | **构造API**，创建应用实例。 |
| `createPage` | **构造API**，创建页面。 |
| `createComponent` | **构造API**，创建自定义组件。 |
| `ref` | **组合式API：数据响应**，创建 ref。 |
| `shallowRef` | **组合式API：数据响应**，创建浅层 ref。 |
| `unref` | **组合式API：数据响应**，解包 ref。 |
| `toRef` | **组合式API：数据响应**，自响应式对象取单键 ref。 |
| `toRefs` | **组合式API：数据响应**，对象各键转 ref。 |
| `isRef` | **组合式API：数据响应**，是否为 ref。 |
| `customRef` | **组合式API：数据响应**，自定义 ref。 |
| `triggerRef` | **组合式API：数据响应**，触发 shallowRef 更新。 |
| `reactive` | **组合式API：数据响应**，深层响应式对象。 |
| `shallowReactive` | **组合式API：数据响应**，浅层响应式对象。 |
| `isReactive` | **组合式API：数据响应**，是否为 reactive。 |
| `set` | **组合式API：数据响应**，响应式设键。 |
| `del` | **组合式API：数据响应**，响应式删键；`Mpx` 静态为 `delete`。 |
| `markRaw` | **组合式API：数据响应**，标记非响应式。 |
| `computed` | **组合式API：数据响应**，计算属性。 |
| `watch` | **组合式API：数据响应**，侦听数据源。 |
| `watchEffect` | **组合式API：数据响应**，自动追踪依赖的副作用。 |
| `watchSyncEffect` | **组合式API：数据响应**，同步 flush 的 `watchEffect`。 |
| `watchPostEffect` | **组合式API：数据响应**，视图更新后的 `watchEffect`。 |
| `effectScope` | **组合式API：数据响应**，创建 effect 作用域。 |
| `getCurrentScope` | **组合式API：数据响应**，获取当前作用域。 |
| `onScopeDispose` | **组合式API：数据响应**，作用域销毁回调。 |
| `nextTick` | **组合式API：工具方法**，下一轮视图更新后执行。 |
| `getCurrentInstance` | **组合式API：工具方法**，当前实例代理；慎用。 |
| `provide` | **组合式API：工具方法**，向子树提供依赖；仅 `setup` 内同步调用，App 不支持 `provide`。 |
| `inject` | **组合式API：工具方法**，解析父级 `provide`；仅 `setup` 内同步调用。 |
| `useI18n` | **组合式API：工具方法**，国际化实例；依赖 `MpxWebpackPlugin` 的 `i18n`，模板见 [模版参考 · i18n](./rn-template-reference.md#i18n-国际化)。 |
| `getMixin` | **选项式API**，mixin / `mergeOptions` 相关。 |
| `BEFORECREATE` | **选项式API：内建生命周期常量**，组件初始化前，无组合式 API 对应钩子。 |
| `CREATED` | **选项式API：内建生命周期常量**，组件初始化后，无组合式 API 对应钩子。 |
| `BEFOREMOUNT` | **选项式API：内建生命周期常量**，组件挂载前，对应组合式 API `onBeforeMount`。 |
| `MOUNTED` | **选项式API：内建生命周期常量**，组件挂载后，对应组合式 API `onMounted`（页面等价 `onReady`）。 |
| `BEFOREUPDATE` | **选项式API：内建生命周期常量**，数据变更后视图更新前，对应组合式 API `onBeforeUpdate`。 |
| `UPDATED` | **选项式API：内建生命周期常量**，视图更新后，对应组合式 API `onUpdated`。 |
| `BEFOREUNMOUNT` | **选项式API：内建生命周期常量**，卸载前，对应组合式 API `onBeforeUnmount`。 |
| `UNMOUNTED` | **选项式API：内建生命周期常量**，卸载后，对应组合式 API `onUnmounted`。 |
| `ONLOAD` | **选项式API：内建生命周期常量**，页面 onLoad，对应组合式 API `onLoad`。 |
| `ONSHOW` | **选项式API：内建生命周期常量**，页面 onShow，对应组合式 API `onShow`。 |
| `ONHIDE` | **选项式API：内建生命周期常量**，页面 onHide，对应组合式 API `onHide`。 |
| `ONRESIZE` | **选项式API：内建生命周期常量**，页面 onResize，对应组合式 API `onResize`。 |
| `SERVERPREFETCH` | **选项式API：内建生命周期常量**，SSR 预取钩子名，对应组合式 API `onServerPrefetch`。 |
| `REACTHOOKSEXEC` | **选项式API：内建生命周期常量**，RN 混编时执行 React hooks 使用，对应组合式 API `onReactHooksExec`。 |
| `onBeforeMount` | **组合式API：生命周期钩子**，挂载前。 |
| `onMounted` | **组合式API：生命周期钩子**，挂载后（页面等价 `onReady`）。 |
| `onBeforeUpdate` | **组合式API：生命周期钩子**，更新前。 |
| `onUpdated` | **组合式API：生命周期钩子**，更新后。 |
| `onBeforeUnmount` | **组合式API：生命周期钩子**，卸载前。 |
| `onUnmounted` | **组合式API：生命周期钩子**，卸载后。 |
| `onLoad` | **组合式API：生命周期钩子**，页面 onLoad；可 `(rawQuery, decodedQuery)`。 |
| `onShow` | **组合式API：生命周期钩子**，页面 onShow。 |
| `onHide` | **组合式API：生命周期钩子**，页面 onHide。 |
| `onResize` | **组合式API：生命周期钩子**，页面 onResize。 |
| `onPullDownRefresh` | **组合式API：生命周期钩子**，下拉刷新；RN 无宿主自动触发，宜 `scroll-view` 等。 |
| `onReachBottom` | **组合式API：生命周期钩子**，触底；RN 同上。 |
| `onShareAppMessage` | **组合式API：生命周期钩子**，分享；RN 需 `rnConfig.openTypeHandler.onShareAppMessage` 与 `open-type="share"`。 |
| `onShareTimeline` | **组合式API：生命周期钩子**，朋友圈；输出 RN 无效。 |
| `onAddToFavorites` | **组合式API：生命周期钩子**，收藏；输出 RN 无效。 |
| `onPageScroll` | **组合式API：生命周期钩子**，页滚动；输出 RN 无效，使用 `scroll-view` 替代方案。 |
| `onTabItemTap` | **组合式API：生命周期钩子**，Tab 点击；输出 RN 无效。 |
| `onSaveExitState` | **组合式API：生命周期钩子**，退出态；输出 RN 无效。 |
| `onServerPrefetch` | **组合式API：生命周期钩子**，SSR 预取；输出 RN 不使用。 |
| `onReactHooksExec` | **组合式API：生命周期钩子**，RN 混编时执行 React hooks 使用。 |
| `implement` | **扩展API**，按 mode 注册或移除实现。 |
| `toPureObject` | **工具API**，深拷贝为纯对象。 |

#### 注意事项

- **`Mpx.use`** 安装的插件会合并到 **`Mpx` 静态对象**与 **`Mpx.prototype`**，若与业务自定义全局名冲突，可为插件传入 **`prefix` / `postfix`** 选项。

## Mpx.config.rnConfig

运行时对象 **`Mpx.config.rnConfig`**（`Mpx` 为 `@mpxjs/core` 默认导出）用于扩展 RN 导航、分包、状态栏等行为。下列为常见配置项（以源码为准，未列项可能随版本增加）。

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

## 环境 API

Mpx 中通过 `@mpxjs/api-proxy` 提供了跨多端一致的环境 API 能力，详情查看[跨端输出 RN 环境 API 参考](./rn-api-reference.md) 

## 网络请求

跨端输出 RN 时，逻辑层使用 **`@mpxjs/fetch`** 与小程序 / Web 同一套 **`xfetch`** 能力：Promise 风格请求、请求/响应拦截器、取消凭证等；底层请求由 **`@mpxjs/api-proxy`** 按平台适配（RN 与 iOS 等走与 Web 相同的 axios 路径）。更完整的配置项见主站 **`docs-vitepress/api/extend.md`** 的 mpx-fetch 章节。

### 接入与调用方式

```js
import mpx from "@mpxjs/core"
import mpxFetch from "@mpxjs/fetch"

// 第二个参数会传给全局 XFetch 构造选项（如 useQueue、proxy 等，可选）
mpx.use(mpxFetch)

// 全局单例
mpx.xfetch.fetch({ url: "https://api.example.com/list" }).then((res) => {
  console.log(res.data) // 业务数据
  // res 上还有 statusCode、header 等小程序风格字段，以及本次请求的 requestConfig
})

// 选项式：页面 / 组件内
// this.$xfetch.fetch({ url: "..." })
// App 构造上通常没有 this.$xfetch，请在页面/组件或模块中通过 mpx.xfetch / useFetch 调用
```

组合式里使用 **`useFetch`**（`@mpxjs/fetch` 命名导出）：**不传参**时返回已 **`mpx.use(mpxFetch)`** 注册好的全局实例（须先安装插件，否则会报错）；**传入构造选项**时返回**新的独立** `XFetch` 实例（独立拦截器与预请求缓存等，不与全局共享）。

### `fetch(config)` 常用配置（从简）

发起请求前会做配置正规化（例如 **`method` 转大写**、**`header` / `headers` 合并为 `header`**）。除下表外，还可传各平台 `request` 支持的字段（由 api-proxy 透传）。部分模式（如 QQ 小程序开启请求队列）下 **`fetch` 还支持第二参数表示优先级**，以对应端说明为准。

| 字段 | 说明 |
| --- | --- |
| `url` | **必填**；缺失会在正规化时 **`throw new Error('no url')`**。 |
| `method` | 默认 **`GET`**。 |
| `params` | 对象，序列化后作为 **URL 查询参数**。 |
| `data` | **`GET` / `DELETE` / `HEAD`**：会与 **`params` 合并**，整体按查询参数处理（不再单独携带 body 形式的 `data`）。**`POST` / `PUT`**：按 `Content-Type` 序列化——常见为 **`application/json`**（对象会序列化为 JSON 字符串）或 **`application/x-www-form-urlencoded`**（对象会序列化为表单字符串）。 |
| `header` | 请求头。未显式指定 `Content-Type` 时，对带 JSON 体的 **`POST`/`PUT`** 一般按 **`application/json`** 发送。`Referer` 等限制以各端 `request` 为准。`header` 与 `headers` 会合并为一套请求头（后者先合并、前者覆盖同名键）。 |
| `timeout` | 毫秒。RN（当前请求走 Web 适配）**未传**时一般为 **`global.__networkTimeout`，若仍无则默认 60s**；小程序等端是否同步 `app.json` 网络超时以工程注入为准。 |
| `emulateJSON` | 仅 **`POST` / `PUT`**：在**尚未**设置 `content-type` / `Content-Type` 时，将类型设为 **`application/x-www-form-urlencoded`**（便于表单提交）。 |
| `usePre` | **预请求 / 结果复用**。传 **`true`** 等价于 `{ enable: true }`；需要自定义时传**对象**，常用字段：`enable`、`cacheInvalidationTime`（默认 **3000** ms）、`ignorePreParamKeys`（**字符串数组**，或**英文逗号分隔**的单个字符串）、`equals`（自定义是否命中缓存）、`onUpdate`（命中缓存时仍会发真实请求，并在最新响应到达时回调；`then` 得到的结果可能带 **`isCache`**）、`mode`（**`auto`（默认）** / **`consumer`** 仅消费缓存 / **`producer`** 仅写入缓存等）。 |
| `cancelToken` | 传入 **`CancelToken` 实例的 `.token`**（`Promise`）；`exec(msg)` 后请求失败回调里可带 **`__CANCEL__`**，可用实例方法 **`mpx.xfetch.isCancel(err)`** 判断。 |

### 拦截器

`mpx.xfetch.interceptors.request` / **`response`** 的 **`use(fulfilled[, rejected])`** 与常见 axios 风格类似：**`fulfilled` 必须返回最终下发的 `config` 或 `Promise<config>`**；**`response` 的 `fulfilled` 须返回 `res` 或 `Promise<res>`**。第二个参数 **`rejected`** 可选，用于该拦截器链上的错误分支。

**`use` 的返回值是一个卸载函数**，调用后移除本次注册的一对 fulfilled / rejected。

```js
import mpx from "@mpxjs/core"

// 请求发出前：统一附加鉴权头、打日志等
const ejectReq = mpx.xfetch.interceptors.request.use(
  (config) => {
    const token = "" /* 从 storage / store 读取 accessToken */
    if (!token) return config
    const header = Object.assign({}, config.header, {
      Authorization: "Bearer " + token
    })
    return Object.assign({}, config, { header })
  },
  (err) => Promise.reject(err)
)

// 响应回到业务 then 之前：统一处理错误码、解包 data 等（按团队约定）
const ejectRes = mpx.xfetch.interceptors.response.use(
  (res) => {
    // res.data、res.statusCode、res.header、res.requestConfig …
    if (res.data && res.data.code !== 0) {
      return Promise.reject(new Error(res.data.message || "业务错误"))
    }
    return res
  },
  (err) => {
    // 网络失败、取消、或上面主动 reject 都会进入这里
    return Promise.reject(err)
  }
)

// 不再需要时（例如退出登录后撤掉全局头）
// ejectReq()
// ejectRes()
```

### 取消请求

1. **`new CancelToken()`**（或 **`new mpx.xfetch.CancelToken()`**）得到实例 **`cancelToken`**。  
2. 发起请求时在配置里传入 **`cancelToken: cancelToken.token`**（`token` 为一个 **Promise**，取消时会被 resolve）。  
3. 在合适时机调用 **`cancelToken.exec(可选原因字符串)`**，本次请求会走 **fail / `catch`**；可通过 **`mpx.xfetch.isCancel(err)`** 判断是否为取消，避免与普通网络错误混用。

```js
import mpx from "@mpxjs/core"
import { CancelToken } from "@mpxjs/fetch"

/** 封装：同时拿到 promise 与 cancel，便于在 onUnload、防抖替换等场景调用 */
function fetchWithCancel (config) {
  const cancelToken = new CancelToken()
  const promise = mpx.xfetch
    .fetch(Object.assign({}, config, { cancelToken: cancelToken.token }))
    .catch((err) => {
      if (mpx.xfetch.isCancel(err)) {
        console.warn("请求已取消:", err.errMsg)
        return null // 按业务决定是否改为 Promise.reject(err)
      }
      return Promise.reject(err)
    })

  return {
    promise,
    cancel (reason = "canceled") {
      cancelToken.exec(reason)
    }
  }
}

// 发起请求
const { promise, cancel } = fetchWithCancel({
  url: "https://api.example.com/user",
  method: "GET",
  params: { id: "10001" }
})

// 需要中断时调用，例如页面 onUnload、搜索框输入防抖取消上一次请求
// cancel("leave-page")

promise.then((res) => {
  if (res === null) return // 已取消分支
  console.log(res.data)
})
```

## 状态管理

跨端输出 RN 时，逻辑层可使用与小程序、Web 对齐的全局状态方案。**`@mpxjs/pinia`（Pinia 风格）为当前优先推荐**；新功能、新模块及与组合式 API 混编时，宜采用 Pinia 范式。若工程已深度使用 **`@mpxjs/store`（Vuex 风格）**，可继续维护，无需为 RN 单独换栈；同一业务域避免用两套方案重复建模。

### `@mpxjs/pinia`（Pinia 风格，推荐）

概念与 API 与 Pinia 对齐，与 Vuex 式 store 的主要差异包括：

1. 无 **`mutations`**，同步与异步状态变更都通过 **`actions`** 完成。  
2. 运行时通过 **`useXxxStore()`** 动态获取 store 实例。  
3. **扁平**结构，无 `modules` 嵌套；多个 store 之间可组合使用。

#### 创建 pinia

在入口调用 **`createPinia()`** 即可：内部会注册**全局 active pinia**（`setActivePinia`），**无需再执行 `Mpx.use(pinia)`**；若需注册插件，在得到的实例上执行 **`pinia.use(plugin)`**。

```js
// app.mpx（节选）
import { createPinia } from '@mpxjs/pinia'

const pinia = createPinia()
```

**定义 store：`defineStore(id, setupFn | options)`**

Setup Store 与组合式 **`setup`** 类似：`ref` 视为 state，`computed` 视为 getter，普通函数视为 action。

```js
// stores/setup.js
import { defineStore } from '@mpxjs/pinia'
import { ref, computed } from '@mpxjs/core'

export const useSetupStore = defineStore('setup', () => {
  const count = ref(0)
  const name = ref('pinia')
  const myName = computed(() => name.value)
  function increment () {
    count.value += 1
  }
  return { count, name, myName, increment }
})
```

Options Store 示例：

```js
// stores/options.js
import { defineStore } from '@mpxjs/pinia'

export const useOptionsStore = defineStore('options', {
  state: () => ({
    count: 0,
    name: 'pinia'
  }),
  getters: {
    myName (state) {
      return state.name
    }
  },
  actions: {
    increment () {
      this.count += 1
    }
  }
})
```

#### 使用 store（选项式 API）

在 Pinia 中，**getter 同样通过 `mapState` 映射**（`mapGetters` 与 `mapState` 等价别名）。options / setup 两种 store 在选项式组件中的用法相同。

```js
import { createComponent } from '@mpxjs/core'
import { mapState, mapActions } from '@mpxjs/pinia'
import { useSetupStore } from '../stores/setup'

createComponent({
  computed: Object.assign(
    {},
    mapState(useSetupStore, ['name', 'count']),
    mapState(useSetupStore, {
      otherName: 'name',
      double: (store) => store.count * 2,
      magicValue () {
        return this.count + this.double
      }
    }),
    mapState(useSetupStore, ['myName'])
  ),
  methods: Object.assign(
    {},
    mapActions(useSetupStore, ['increment']),
    mapActions(useSetupStore, {
      setupIncrement: 'increment'
    })
  )
})
```

#### 使用 store（组合式 API）

直接解构 store 会丢失响应式，需用 **`storeToRefs`**；**`storeToRefs` 仅包含 state 与 getter**。

```js
import { createComponent } from '@mpxjs/core'
import { storeToRefs } from '@mpxjs/pinia'
import { useSetupStore } from '../stores/setup'

createComponent({
  setup (props, context) {
    const setupStore = useSetupStore()
    function onIncrementClick () {
      setupStore.increment()
    }
    return Object.assign(
      { onIncrementClick },
      storeToRefs(setupStore)
    )
  }
})
```

**插件**：在 **`createPinia()`** 得到实例后执行 **`pinia.use(plugin)`**；例如通过 **`store.$onAction`** 订阅 action 前后钩子。

#### API 参考



### `@mpxjs/store`（Vuex 风格）

参考 Vuex：**`state` / `getters` / `mutations` / `actions`**。与随意挂到全局的普通对象相比：① store 内状态是 **响应式** 的；② **不能直接改 `state`**，须通过 **`commit` mutation** 变更，便于追溯。异步与组合逻辑放在 **`actions`** 中 **`dispatch`**。与「单一状态树 + `this.$store`」不同，Mpx 支持 **多实例 store**，组件内需 **显式引入** 实例，再用计算属性或 **`mapState` / `mapGetters` 等** 注入。

#### 创建 store

从 **`@mpxjs/core`** 引入（由 core 再导出 **`@mpxjs/store`**，与直接依赖 **`@mpxjs/store`** 等价）。

**优先使用 `createStoreWithThis`**：getter / mutation / action 内通过 **`this.state`**、**`this.commit`** 等访问，与 **`createStateWithThis` / `createGettersWithThis` / `createMutationsWithThis` / `createActionsWithThis`** 等辅助声明配合时，**TypeScript 类型推导更完整**。**`createStore`** 仍为合法写法：getter、mutation 以 **`(state, …)`**、action 以 **`(context, …)`** 接收参数，在 TS 下推导通常弱于 **`createStoreWithThis`**。

```js
// store.js
import { createStoreWithThis } from '@mpxjs/core'

const store = createStoreWithThis({
  state: {
    count: 0
  },
  getters: {
    doubled () {
      return this.state.count * 2
    }
  },
  mutations: {
    increment () {
      this.state.count += 1
    },
    subCount () {
      this.state.count -= 1
    }
  },
  actions: {
    increment () {
      this.commit('increment')
    }
  }
})

export default store
```

#### 多实例 store

多个 store 可并列创建、并通过 **`deps`** 进行组合，`deps` 里的 **key** 即命名空间，依赖方的 **`state` / `mutations` 等** 会挂到当前 store 的 **`state[key]`**、**`commit('key.mutationName')`** 等路径下。

```js
import { createComponent, createStoreWithThis } from '@mpxjs/core'

// 子模块：普通多实例之一，可被多个上层 store 复用
const childStore = createStoreWithThis({
  state: { n: 0 },
  mutations: {
    addN () {
      this.state.n += 1
    }
  }
})

// 根模块：deps 写在 options 根；childStore 挂到 state.child（命名空间 = 键名 child）
const rootStore = createStoreWithThis({
  state: { local: 0 },
  getters: {
    sum () {
      // this.state.child 与 childStore.state 同源，改任一侧都会联动
      return this.state.local + this.state.child.n
    }
  },
  mutations: {
    addLocal () {
      this.state.local += 1
    },
    // 触发依赖 store 的 mutation：'命名空间.mutation 名'
    proxyAddChild () {
      this.commit('child.addN')
    }
  },
  deps: {
    child: childStore
  }
})

createComponent({
  computed: Object.assign(
    {},
    // 第一个参数为 deps 里的命名空间，第二个为子 state 上的字段名
    rootStore.mapState('child', ['n']),
    rootStore.mapState(['local']),
    rootStore.mapGetters(['sum'])
  ),
  methods: Object.assign(
    {},
    rootStore.mapMutations(['addLocal', 'proxyAddChild']),
    // 也可把依赖 mutation 映射成本地方法名
    rootStore.mapMutations({ addNFromChild: 'child.addN' })
  )
})
```

#### 使用 store（选项式 API）

`mapState` 只映射 **`state` 路径**；派生状态用 **`mapGetters`**。

```js
import { createComponent } from '@mpxjs/core'
import store from '../store'

createComponent({
  computed: Object.assign(
    {},
    store.mapState(['count']),
    store.mapGetters(['doubled'])
  ),
  methods: Object.assign(
    {},
    store.mapMutations(['increment']),
    store.mapActions(['increment'])
  )
})
```

#### 使用 store（组合式 API）

组合式场景下更推荐 **`@mpxjs/pinia`**；沿用 Vuex 式 store 时，可用 **`mapStateToRefs` / `mapGettersToRefs`** 在 `setup` 里拿到 **state、getters 的 ref**。**`mutations` / `actions`** 可直接 **`store.commit` / `store.dispatch`**，也可继续用 **`mapMutations` / `mapActions`** 映射成函数。**`createStore`** 与 **`createStoreWithThis`** 得到的实例均具备上述 **`map*ToRefs`** 与 **`map*`** 方法。

```js
import { createComponent, watchEffect } from '@mpxjs/core'
import store from '../store'

createComponent({
  setup () {
    const { count } = store.mapStateToRefs(['count'])
    const { doubled } = store.mapGettersToRefs(['doubled'])
    const { increment } = store.mapMutations(['increment'])

    watchEffect(() => {
      console.log(count.value, doubled.value)
    })

    return {
      count,
      doubled,
      increment,
      subCount () {
        store.commit('subCount')
      }
    }
  }
})
```

上例中 **`increment`** 来自 **`mapMutations`**，**`subCount`** 直接 **`store.commit`**，演示两种提交 mutation 的方式。

#### 注意事项

- **`action` 的返回值会被包装为 `Promise`**，便于 `then` / `async` 组合。  
- 虽支持 **`modules`**，更推荐 **多实例 store + `deps` 组合** 做模块划分，灵活度更高。

### 选型建议

- **优先 `@mpxjs/pinia`**：新项目、新状态域、与 **`setup` / `script setup`** 协同、希望与 Pinia 生态一致时选用。  
- **保留 `@mpxjs/store`**：已有 Vuex 式仓库、`mutations` 可追溯链路或团队规范仍以 Vuex 为主时继续沿用，按需渐进迁移即可。
