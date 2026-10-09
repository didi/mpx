# Mpx2Web 脚本差异参考

本文档只记录 `<script>` 中 Web-only 运行时差异。构造选项、组合式 API、响应式 API、实例基础方法和通用生命周期沿用输入项目与仓库内 Mpx 文档，不从其它输出端 Skill 推导。

## 目录

- [与微信小程序的实例方法差异](#与微信小程序的实例方法差异)
  - [`setData` 与视图更新](#setdata-与视图更新)
  - [组件实例查询](#组件实例查询)
  - [`triggerEvent` 的传播选项](#triggerevent-的传播选项)
  - [`$forceUpdate` 与 setup `forceUpdate`](#forceupdate-与-setup-forceupdate)
- [与微信小程序的能力差异](#与微信小程序的能力差异)
  - [小程序内置 behavior](#小程序内置-behavior)
  - [关系能力](#关系能力)
- [通过 `implement` 抹平小程序能力差异](#通过-implement-抹平小程序能力差异)
  - [分享能力适配示例](#分享能力适配示例)

---

## 与微信小程序的实例方法差异

### `setData` 与视图更新

输出 Web 时无法使用 `this.setData()`，只能通过数据响应机制更新视图。应直接修改响应式数据，由框架自动更新视图。

### 组件实例查询

Web 的 `selectComponent` / `selectAllComponents` 仅支持 id、class 及其组合、逗号分组，不支持后代或子代等关系选择器。

匹配依据是调用方写在组件标签上的 id/class，支持静态 class 和字符串、对象、嵌套数组形式的动态 class。即使多个组件共享根 DOM，也分别按各自调用标签匹配；组件内部根 DOM 的属性及直接修改 DOM 添加的 id/class 不参与匹配。动态绑定更新后，在 `nextTick` 后查询更新结果。

### `triggerEvent` 的传播选项

- Web 不支持 `bubbles`、`composed`、`capturePhase` 传播选项，不依赖它们实现跨层通知。
- 需要跨层通知时，在 Web 侧显式监听并转发，或使用项目已有通信方案；保留原有数据，避免与微信传播链重复通知。接收关系不明确时不能只删除传播参数或用空回调代替。

### `$forceUpdate` 与 setup `forceUpdate`

Web 中 `this.$forceUpdate()` 和 setup context 的 `forceUpdate()` 只能无参强制刷新，传入的数据、选项和回调都会被忽略。适配带参调用时沿用原有响应式数据更新；只有原回调依赖更新后的 DOM 时，才调用实例 `$nextTick(callback)`。setup 中先同步保存 `getCurrentInstance().proxy`，再通过该实例调用 `$nextTick`。

---

## 与微信小程序的能力差异

### 小程序内置 behavior

Web 不支持小程序内置 behavior。

### 关系能力

Web 已支持 `relations` 的父子/祖先后代匹配、`linked`、`unlinked` 和 `getRelationNodes()`，这些能力无需整体重写。当前 Web 实现未消费关系配置中的 `target`，也不会调用 `linkChanged`；业务实际依赖这两个字段时再补 Web 等效处理或明确待接入边界，不要把整个 `relations` 判为不支持。

### App 生命周期

- `onLaunch`：Web 的 `path`、`query` 来自当前路由；`scene` 固定为 `0`，`shareTicket` 为空字符串，`referrerInfo` 为空对象。业务依赖真实小程序启动信息时，微信逻辑保留，Web 改从路由或业务数据获取所需信息。

### 页面加载

- `onLoad`：Web 只传当前路由的 `query`，不会提供小程序侧的第二个 `decodedQuery` 参数。依赖第二参数的逻辑在 Web 侧自行处理 query 值。

### 页面栈

只有业务通过 `getCurrentPages()` 读取历史页的 `data` 或调用其方法时才需处理：Web 刷新后，历史页可能只剩 `{ route }`；刷新后仍要使用的数据改由路由参数或持久化状态承载。

---

## 通过 `implement` 抹平小程序能力差异

对于 Web 尚未实现的小程序能力，可以通过 `implement` 登记适配，并结合全局 mixin、Web SDK 或业务逻辑复用原有的小程序选项与生命周期。例如，分享、收藏、退出状态保存、路由动画完成通知等能力，都需要由适配层提供实际实现。

在 App、页面或组件构造前调用 `implement`，指定 `modes: ['web']`，并在 `processor` 中初始化适配逻辑。`processor` 在每次登记时执行，不接收页面实例；需要访问实例的逻辑应放在 mixin 的生命周期或方法中。

登记后默认保留原声明，设置 `remove: true` 则移除。需要调用原有钩子时应保留声明。`implement` 本身不会实现能力或自动触发回调，触发时机、参数和返回值处理均由适配层负责。

### 分享能力适配示例

以 `onShareAppMessage` 为例，在 Web 页面显示时读取原有分享钩子返回的信息，交给业务分享适配层配置 Web 分享入口。

```js
// 在应用入口中先加载此适配模块，再构造页面
import mpx, { implement } from '@mpxjs/core'
import { setWebShareInfo } from './web-share'

implement('onShareAppMessage', {
  modes: ['web'],
  processor () {
    mpx.mixin({
      onShow () {
        if (this.onShareAppMessage) {
          const shareInfo = this.onShareAppMessage({ from: 'menu' })
          setWebShareInfo(shareInfo)
        } else {
          setWebShareInfo()
        }
      }
    }, { types: 'page' })
  }
})
```

页面继续使用小程序的分享声明：

```js
import { createPage } from '@mpxjs/core'

createPage({
  onShareAppMessage () {
    return {
      title: '商品详情',
      path: '/pages/detail?id=123',
      imageUrl: 'https://example.com/share.png'
    }
  }
})
```

示例中的 `setWebShareInfo` 是业务自行实现的分享适配函数，不是 Mpx API。它需要将小程序 `path` 转换为当前 Web 项目可访问的完整 URL，并将 `title`、`imageUrl` 等信息映射到所接入分享 SDK 的配置；无参调用时重置为默认分享配置，避免沿用上一页的信息。SDK 初始化及实际分享入口也由该适配层处理。

此例在每次页面显示时配置分享信息，`from: 'menu'` 表示适配的菜单分享场景。若分享信息依赖异步数据、钩子的 `promise` 返回值或按钮事件，应在业务数据更新或分享入口触发时重新读取，并补齐对应参数与异步处理。
