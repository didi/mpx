# RN 脚本差异

本页按 [脚本基础](../base/script-reference.md) 的主题顺序组织，只描述 RN 相对基准在支持范围、参数、触发时机、使用要求上的差异及专属扩展，不重复一致的用法，也不展开内部实现差异。状态管理见 [状态管理基准](../base/store-reference.md)。

## 目录

- [构造选项](#构造选项)
  - [App 构造选项](#app-构造选项)
  - [页面与组件构造选项](#页面与组件构造选项)
  - [统一生命周期](#统一生命周期)
  - [关系能力](#关系能力)
  - [通过 implement 适配构造选项](#通过-implement-适配构造选项)
- [实例属性与方法](#实例属性与方法)
  - [页面与组件实例属性与方法](#页面与组件实例属性与方法)
  - [selector 查询要求](#selector-查询要求)
- [数据响应](#数据响应)
- [组合式 API](#组合式-api)
- [script setup](#script-setup)
- [运行时导出与全局方法](#运行时导出与全局方法)
  - [全局方法](#全局方法)

## 构造选项

### App 构造选项

下表只列出 RN 的生命周期差异。

| 选项 | RN 差异 |
| --- | --- |
| `onThemeChange` | 不支持。 |
| `onSSRAppCreated` | RN 不支持 SSR，不会触发。 |

### 页面与组件构造选项

RN 的专属选项、配置要求及页面事件支持差异如下。

| 选项 | 适用 | RN 差异 |
| --- | --- | --- |
| `components` | 通用 | `Record<string, React.ComponentType>`，可用于注册 RN 原生组件，跨平台输出时需添加条件编译包裹。 |
| `relations` | 组件 | 部分支持，按组件路径匹配配对关系并触发 `linked`、`unlinked`；不支持 `target`。 |
| `externalClasses` | 组件 | 外部样式类名须被 `@mpxjs/webpack-plugin` 的 `externalClasses` 配置覆盖；默认包含 `custom-class`、`i-class`，其他类名需显式配置，仅在脚本中声明不足以生效。 |
| `options.disableMemo` | 通用 | RN 专属；模板依赖 React Hooks 返回值并需随其变化更新时，设为 `true`，见 [混合开发](./rn-hybrid-dev.md#hooks-返回值更新模板)。 |
| `options.isCustomText` | 组件 | RN 专属；通过编译插件的 `customTextRules` 标记文本组件，并使非 virtualHost 组件使用文本 host；仅在脚本中设置该选项不会改变编译生成的 host 类型。 |
| `options.virtualHost` | 组件 | 是否生成实体 host 由编译插件的 `autoVirtualHostRules` 决定；命中的组件没有实体 `:host` 外层节点，仅在脚本中设置该选项不会移除 host。 |
| `options.multipleSlots` | 组件 | RN 默认支持多插槽，无需设置为 `true`。 |
| `onPullDownRefresh` | 页面 | 不支持页面级钩子。改用开启 `scroll-y` 和 `refresher-enabled` 的 `scroll-view`，通过 `bindrefresherrefresh` 处理刷新，用 `refresher-triggered` 控制刷新状态，完成后置为 `false`，见[页面滚动替代示例](#页面滚动替代示例)。 |
| `onReachBottom` | 页面 | 不支持页面级钩子。改用开启 `scroll-y` 的 `scroll-view` 的 `bindscrolltolower` 处理触底，通过 `lower-threshold` 设置触发距离，见[页面滚动替代示例](#页面滚动替代示例)。 |
| `onPageScroll` | 页面 | 不支持页面级钩子。改用 `scroll-view` 的 `bindscroll` 监听滚动，见[页面滚动替代示例](#页面滚动替代示例)。 |
| `onShareAppMessage` | 页面 | 支持声明，实际触发由分享入口驱动。使用 `button open-type="share"` 时，需配置 `Mpx.config.rnConfig.openTypeHandler.onShareAppMessage` 接入系统分享能力。 |
| `onShareTimeline` | 页面 | 不支持。 |
| `onTabItemTap` | 页面 | 不支持。 |
| `onAddToFavorites` | 页面 | 不支持。 |
| `onSaveExitState` | 页面 | 不支持。 |
| `onRouteDone` | 页面 | 不支持。 |
| `definitionFilter` | 组件 / Behavior | 不支持。 |
| `export` | 组件 | 不支持。 |

生命周期的支持范围与 RN 专属扩展见 [统一生命周期](#统一生命周期)。

#### 页面滚动替代示例

将上述页面滚动钩子迁移为 `scroll-view` 事件；页面 JSON 设置 `disableScroll: true`，样式设置 `page { height: 100%; }`。示例占满页面，有导航栏等其他占位时按剩余空间约束滚动容器高度。

```html
<scroll-view scroll-y="{{true}}" style="height: 100%;"
  refresher-enabled="{{true}}" refresher-triggered="{{refreshing}}" bindrefresherrefresh="onRefresh"
  bindscrolltolower="loadMore" bindscroll="onScroll">
  <view>页面内容</view>
</scroll-view>
```

```js
// createPage 的选项片段；refreshData / loadMore 为已有业务方法
// refreshData 返回 Promise，完成后通过 refreshing 结束刷新
data: { refreshing: false, scrollTop: 0 },
methods: {
  onRefresh () {
    this.refreshing = true
    this.refreshData().finally(() => { this.refreshing = false })
  },
  onScroll (e) {
    this.scrollTop = e.detail.scrollTop
  }
}
```

滚动位置从页面事件的 `e.scrollTop` 改取 `e.detail.scrollTop`（px）；高频处理按需节流。事件字段见 [scroll-view 基准](../base/template-reference.md#scroll-view)，RN 限制见 [scroll-view 差异](./rn-template-reference.md#scroll-view)。

### 统一生命周期

生命周期的基准阶段对应关系见 [统一生命周期基准](../base/script-reference.md#统一生命周期)。RN 的支持范围差异与专属扩展如下。

| 生命周期 / 钩子 | RN 差异 |
| --- | --- |
| `moved` / `error` | 不支持。 |
| `onReactHooksExec` / `REACTHOOKSEXEC` | RN 混编专属，用于执行 React Hooks，见 [混合开发](./rn-hybrid-dev.md)。 |
| `onServerPrefetch` / `SERVERPREFETCH` | RN 不支持 SSR，不会执行。 |

### 关系能力

- 仅支持按组件路径关联，不支持通过 `target` 按 behavior 匹配。关系键须与目标组件的构建路径一致，可用 `?resolve` 导入路径；双方仍须声明配对关系。

### 通过 implement 适配构造选项

业务需适配被 RN 转换列为未支持的构造选项时，按 [implement 基准用法](../base/script-reference.md#通过-implement-适配构造选项) 登记，RN 的 `modes` 使用实际输出目标 `ios` / `android` / `harmony`。登记不会自动实现能力或触发回调，仍需业务适配层接入宿主事件与实际行为。

## 实例属性与方法

### 页面与组件实例属性与方法

| 名称 | 类型 | 适用 | RN 差异 |
| --- | --- | --- | --- |
| `triggerEvent(name, detail, options)` | 方法 | 组件 | 仅调用当前组件节点上匹配的事件处理器，不处理第三个参数中的 `bubbles`、`composed`、`capturePhase`，不实现自定义事件沿祖先节点冒泡或捕获。 |
| `getTabBar()` | 方法 | 通用 | RN 不提供该方法，也不支持 JSON `tabBar` 配置。 |
| `selectComponent(selector)` / `selectAllComponents(selector)` | 方法 | 通用 | 目标自定义组件须声明 `wx:ref`，空值或具名均可；不返回基础组件节点。无匹配时分别返回 `undefined` / `[]`。selector 范围见 [selector 查询要求](#selector-查询要求)。 |
| `createSelectorQuery()` | 方法 | 通用 | `select` / `selectAll` 的目标节点须声明 `wx:ref`；命中非 virtualHost 自定义组件时，查询其实体 host 节点。virtualHost 组件没有实体 host 节点，不支持按组件节点测量；不支持 `selectViewport()`。 |
| `createIntersectionObserver(options?)` | 方法 | 通用 | 使用实例方法可接入页面滚动时的相交检测；`relativeTo` / `observe` 传入 selector 时，仅匹配声明了 `wx:ref` 的内建节点，不解析自定义组件的 host。不支持 `nativeMode` 参数；额外支持 `throttleTime`，默认 `100` 毫秒。 |

### selector 查询要求

- 上述查询仅支持 `#id`、`.class` 及 `.a.b` 这样的连续类选择器（匹配同时具有多个类名的节点），不支持后代、子代、兄弟或逗号分组选择器。
- 对应节点须声明 `wx:ref`，空值或具名均会登记节点的 `id`、`class`；未声明则无法按 selector 查询。空 `wx:ref` 不会注册具名 ref，`wx:ref="name"` 则同时支持具名访问和 selector 查询。
- 相交观察的 `relativeTo` 还可接收内建节点的 `$refs` 查询对象，`observe` 可接收该对象或对象数组；观察多个节点时设置 `observeAll: true`。

相交观察的 RN 扩展签名为 `relativeTo(target, margins?): observer`、`observe(target, callback): void`：前者的 target 为 selector 字符串或单个内建节点查询对象，后者还接受此类查询对象数组；`margins` 的 `top/right/bottom/left` 均为可选 number，默认 `0`。callback 接收 [基准相交结果](../base/api-reference.md#createintersectionobserver)，返回值不被消费。`options.throttleTime?: number` 控制检测节流，默认 `100` 毫秒。目标未匹配时不开始观察；不要用 observe 的返回值判断是否命中。

**使用示例：**

```html
<template>
  <!-- card 须在 JSON usingComponents 中注册；wx:ref 可为空或具名 -->
  <card id="chip" class="card" wx:ref />
  <card class="card" wx:ref />
  <view id="box" wx:ref="box">
    <view class="cell" wx:ref>单元 1</view>
    <view class="cell" wx:ref>单元 2</view>
  </view>
</template>
<script>
  import { createPage } from "@mpxjs/core"

  createPage({
    onReady() {
      this.selectComponent("#chip")
      this.selectAllComponents(".card")
      this.createSelectorQuery()
        .select("#chip")
        .boundingClientRect()
        .exec((res) => {
          console.log(res)
        })
      this.createIntersectionObserver({ observeAll: true })
        .relativeTo("#box")
        .observe(".cell", (res) => {
          console.log(res)
        })
    }
  })
</script>
```

## 数据响应

响应式状态、watch 调度与强制更新的基准用法见 [数据响应](../base/script-reference.md#数据响应)。模板依赖 React Hooks 返回值时，还需按 [混合开发](./rn-hybrid-dev.md#hooks-返回值更新模板) 配置 `options.disableMemo`。

## 组合式 API

- `setup` context 中的 selector 查询同样遵循 [selector 查询要求](#selector-查询要求) 中的 `wx:ref` 要求与选择器限制。
- RN 混编通过专属钩子 `onReactHooksExec` 接入 React Hooks，具体用法见 [混合开发](./rn-hybrid-dev.md)。
- 不支持 `onPullDownRefresh` / `onReachBottom` / `onPageScroll` 等页面钩子；改用 `scroll-view` 对应事件，具体替代方式见 [页面滚动替代示例](#页面滚动替代示例)。

## script setup

`defineOptions({ components: { NativeView } })` 可注册 RN 原生组件；跨平台输出时需隔离 RN 依赖，见 [混合开发](./rn-hybrid-dev.md)。`useContext()` 取得的 context 同样遵循上述 [组合式 API](#组合式-api) 的 RN 限制。

## 运行时导出与全局方法

### 全局方法

RN 提供以下全局方法，无需从 core 导入，供宿主接入或测试场景手动切换应用前后台状态；重复设置同一状态不会再次触发回调。

| 名称 | 使用入口 | RN 差异 |
| --- | --- | --- |
| `setAppShow(): void` | 全局方法 | 无参数；将应用切换为显示状态，并同步当前聚焦页面的显示状态，驱动对应的显示回调。 |
| `setAppHide(): void` | 全局方法 | 无参数；将应用切换为隐藏状态，并同步当前聚焦页面的隐藏状态，驱动对应的隐藏回调。 |
