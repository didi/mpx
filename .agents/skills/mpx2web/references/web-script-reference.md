# Mpx2Web 脚本差异参考

本文档只记录 `<script>` 中 Web-only 运行时差异。构造选项、组合式 API、响应式 API、实例基础方法和通用生命周期沿用输入项目与仓库内 Mpx 文档，不从其它输出端 Skill 推导。

## 目录

- [`getCurrentInstance()` 差异](#getcurrentinstance-差异)
- [与微信小程序的实例方法差异](#与微信小程序的实例方法差异)
  - [`setData`](#setdata)
  - [微信原生实例方法](#微信原生实例方法)
  - [组件实例查询](#组件实例查询)
  - [`triggerEvent` 的传播选项](#triggerevent-的传播选项)
  - [`$forceUpdate` 与 setup `forceUpdate`](#forceupdate-与-setup-forceupdate)
  - [关系能力](#关系能力)
- [组件选项的跨端转换](#组件选项的跨端转换)
- [与微信小程序的全局能力差异](#与微信小程序的全局能力差异)
- [Web 缺失的宿主能力](#web-缺失的宿主能力)

---

## `getCurrentInstance()` 差异

Web 返回 Vue 内部实例，小程序返回 MpxProxy，顶层结构不同。跨端统一在 `setup()` 或生命周期的同步阶段保存 `getCurrentInstance().proxy` 作为组件实例，不要在异步回调中重新获取。

---

## 与微信小程序的实例方法差异

### `setData`

微信小程序实例提供 `this.setData(data, callback)`；Mpx Web 实例不提供 `this.setData`，setup context 中也没有 `setData`。转换已有小程序代码时，将状态更新改为 Mpx 响应式赋值，并保留原小程序和 Web 都能执行的同一份业务逻辑：

- 已声明的顶层或深层字段直接赋值，例如 `this.count = 1`、`this.user.name = name`。
- 给对象新增响应式字段时使用 `this.$set(object, key, value)`；按索引替换数组项时使用 `this.$set(array, index, value)` 或 `splice`。
- `setData` 的路径 key 需要改为真实的属性访问。例如 `{ "user.name": name, "list[0].checked": true }` 改为 `this.user.name = name` 和 `this.list[0].checked = true`；动态路径应根据数据结构显式更新，不能继续调用 `setData`。
- 原 `setData` 回调依赖视图更新完成时，状态赋值后使用 `this.$nextTick(callback)`；不依赖更新后视图时直接执行后续业务逻辑。
- 不要改用带参数的 `this.$forceUpdate(data, callback)`：Web 的 `$forceUpdate()` 不消费这些参数。

```js
// 转换前：仅小程序实例提供 setData
this.setData({
  count: this.count + 1,
  "user.name": name
}, () => {
  this.measureLayout()
})

// 转换后：Mpx 小程序与 Web 可共用
this.count += 1
this.user.name = name
this.$nextTick(() => {
  this.measureLayout()
})
```

### 微信原生实例方法

Mpx Web 实例不提供下列方法。仅在源码直接调用时处理，不能增加同名空方法让代码表面通过：

| 方法 | 转换规则 |
| --- | --- |
| `hasBehavior` | 分支依赖 Behavior 注入的方法时检查该方法；确实判断 Behavior 身份时由 Behavior 混入显式布尔标记。不要在 Web 固定返回 `false`。 |
| `groupSetData` | 删除分组外壳，执行原 callback 中的业务更新，并按上一节把内部 `setData` 改为响应式赋值；更新后逻辑只保留一次 `$nextTick`。 |
| `selectOwnerComponent` | 发送动作或数据时使用事件，读取 owner 数据时使用 prop，已有固定 `relations` 时使用 `getRelationNodes()`，跨层或插槽场景使用 provide/inject。不要替换成 `$parent`。 |

### 组件实例查询

小程序可以通过 id 或 class 查询自定义组件。Web 中 class 可能在编译后变成动态绑定，导致 `selectComponent('.item')` 或 `selectAllComponents('.item')` 找不到组件。

- 查询单个组件时，优先添加稳定的 id 并使用 `selectComponent('#id')`，也可以使用 `wx:ref`。
- 查询列表组件时，可以在 `wx:for` 中使用同名 `wx:ref` 获取实例数组；如果只是修改列表数据，直接由父组件状态驱动。

`createSelectorQuery` 用于查询节点位置和尺寸，不能替代 `selectComponent` 获取组件实例。

### `triggerEvent` 的传播选项

- Web 不支持 `bubbles`、`composed`、`capturePhase` 传播选项，不依赖它们实现跨层通知。
- 需要跨层通知时，在 Web 侧显式监听并转发，或使用项目已有通信方案；保留原有数据，避免与微信传播链重复通知。接收关系不明确时不能只删除传播参数或用空回调代替。

### `$forceUpdate` 与 setup `forceUpdate`

Web 中 `this.$forceUpdate()` 和 setup context 的 `forceUpdate()` 只能无参强制刷新，传入的数据、选项和回调都会被忽略。适配带参调用时沿用原有响应式数据更新；只有原回调依赖更新后的 DOM 时，才调用实例 `$nextTick(callback)`。setup 中先同步保存 `getCurrentInstance().proxy`，再通过该实例调用 `$nextTick`。

### 关系能力

Web 已支持 `relations` 的父子/祖先后代匹配、`linked`、`unlinked` 和 `getRelationNodes()`，这些能力无需整体重写。当前 Web 实现未消费关系配置中的 `target`，也不会调用 `linkChanged`；业务实际依赖这两个字段时再补 Web 等效处理或明确待接入边界，不要把整个 `relations` 判为不支持。

---

## 组件选项的跨端转换

默认跨端构建会将普通 `Behavior({...})` 作为 mixin 合并，并将 `properties` 中的 `observer` 和组件 `observers` 转为 `watch`。先保留原写法；只有业务依赖回调参数或触发时机且 Web 表现不符时才调整。微信内置的 `wx://` behavior 不能按普通 Behavior 推断；设置 `forceDisableProxyCtor: true` 时，`Behavior()` 的构造器代理不生效。

---

## 与微信小程序的全局能力差异

### App 生命周期

- `onLaunch`：Web 的 `path`、`query` 来自当前路由；`scene` 固定为 `0`，`shareTicket` 为空字符串，`referrerInfo` 为空对象。业务依赖真实小程序启动信息时，微信逻辑保留，Web 改从路由或业务数据获取所需信息。

### 页面加载

- `onLoad`：Web 只传当前路由的 `query`，不会提供小程序侧的第二个 `decodedQuery` 参数。依赖第二参数的逻辑在 Web 侧自行处理 query 值。

### 页面栈

只有业务通过 `getCurrentPages()` 读取历史页的 `data` 或调用其方法时才需处理：Web 刷新后，历史页可能只剩 `{ route }`；刷新后仍要使用的数据改由路由参数或持久化状态承载。

---

## Web 缺失的宿主能力

以下事件依赖小程序宿主语义，即使出现在 Web 生命周期允许列表中，也不代表运行时会触发。按业务需求接入对应的 Web 能力；需要排除仅适用于小程序的选项时，使用实际有效的转换或平台条件处理，不因钩子不触发就机械删除所有声明：

| 生命周期 | Web 侧处理 |
| --- | --- |
| `onShareAppMessage` / `onShareTimeline` | Web 分享需单独接入业务方案；移除原宿主生命周期的方式见下例。 |
| `onAddToFavorites` | 使用 Web 收藏、关注或业务用户体系。 |
| `onSaveExitState` | 使用 Web Storage、服务端状态或业务恢复方案。 |
| `onThemeChange` | 使用 Web 媒体查询或业务主题系统。 |

`implement` 是能力登记入口，`remove: true` 不是通用的生命周期删除开关。当前 `packages/core/src/convertor/wxToWeb.js` 只对 `moved`、`definitionFilter`、`onShareAppMessage` 读取该标记并删除选项，`onShareTimeline` 不在此列表。`onShareAppMessage` 可在页面构造前登记移除，同时保持页面选项直接写在 `createPage` 中：

```js
import { createPage, implement } from '@mpxjs/core'

if (__mpx_mode__ === 'web') {
  implement('onShareAppMessage', {
    modes: ['web'],
    remove: true
  })
}

createPage({
  // 原有分享生命周期继续服务小程序输出
  onShareAppMessage () {
    return { title: '分享标题', path: '/pages/detail/index' }
  },
  methods: {
    shareOnWeb () {
      // TODO(web): 接入业务指定的 Web 分享 SDK。
    }
  }
})
```

上述示例保留微信分享声明，并在 Web 转换前登记移除。`onShareTimeline` 没有对应的 `implement(remove)` 转换；Web 运行时不会触发且没有其它消费者时保留原声明即可，确认会被其它代码消费时再使用最小平台条件隔离，不要为单个钩子把整个页面改写成可变 options。复制链接只有在业务协议明确采用该行为时才属于 Web 分享方案。
