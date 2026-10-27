# Skyline 运行时最佳实践

本页记录 Skyline 的 API、数据约束与性能实践，适用于新建、迁移和优化，双模式项目同时保留 WebView 行为。通用响应式、props、生命周期与 setup 见[脚本基准](../base/script-reference.md)。

引擎声明见 [JSON 配置](./skyline-json-reference.md)，编译与工具设置见[配置参考](./skyline-config-reference.md)，组件支持见[模板差异](./skyline-template-reference.md)，布局见[样式实践](./skyline-style-practice.md)，隔离原则及 Worklet / 手势 / 路由见[入口](./index.md)。

## 目录

- [运行时常见问题](#运行时常见问题)
  - [判断当前渲染模式](#判断当前渲染模式)
  - [页面滚动替代方案](#页面滚动替代方案)
  - [Skyline 不支持的动画方法](#skyline-不支持的动画方法)
  - [用 this.createSelectorQuery 替代 wx.createSelectorQuery](#用-thiscreateselectorquery-替代-wxcreateselectorquery)
  - [ScrollViewContext：开启 enhanced 属性](#scrollviewcontext开启-enhanced-属性)
  - [确保 wx:for 数据始终为 Array 或 Object](#确保-wxfor-数据始终为-array-或-object)
  - [properties 声明类型与实际值保持一致](#properties-声明类型与实际值保持一致)
  - [WXS 跨包引用错误](#wxs-跨包引用错误typeerror-rwxsstringify4ccc0480-is-not-a-function)
- [性能优化](#性能优化)
  - [列表用 list / custom 模式按需渲染](#列表用-list--custom-模式按需渲染)
  - [cache-extent 预渲染（按需启用）](#cache-extent-预渲染按需启用)
  - [预加载 Skyline 环境](#预加载-skyline-环境)

---

## 运行时常见问题

### 判断当前渲染模式

- 页面 / 组件实例的 `renderer` 为 `webview` 或 `skyline`；模板直接判断 `renderer === 'skyline'`，无需另设布尔值。
- 选项式脚本用 `this.renderer`；`<script setup>` 从实例读取，供模板使用时须 `defineExpose`。
- 两种模式共用微信编译目标，只能运行时区分，不能用条件编译判断渲染模式。

```js
// <script setup>
import { getCurrentInstance } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy
defineExpose({ renderer })
```

### 页面滚动替代方案

Skyline 不支持页面滚动。页面 JSON 设置 `disableScroll: true`，使用有明确高度的 `scroll-view`，并迁移原页面事件，不能只删除生命周期。WebView 共用同一组滚动事件。

| 原页面生命周期 | scroll-view 替代 | 配套处理 |
| --- | --- | --- |
| `onPullDownRefresh` | `bindrefresherrefresh` | 开启 `refresher-enabled` |
| `onReachBottom` | `bindscrolltolower` | 按需配置 `lower-threshold` |
| `onPageScroll` | `bindscroll` | 滚动位置从 `e.scrollTop` 改取 `e.detail.scrollTop`，高频处理按需节流 |

```html
<!-- 父容器须提供明确高度 -->
<scroll-view type="list" scroll-y="{{true}}" enhanced="{{true}}" style="height: 100%;"
  refresher-enabled="{{true}}" bindrefresherrefresh="onRefresh"
  bindscrolltolower="onLoadMore" bindscroll="onScroll">
  <view>页面内容</view>
</scroll-view>
```

### Skyline 不支持的动画方法

`animate`、`applyAnimation`、`clearAnimation`、`setInitialRenderingCache`、`wx.createAnimation` 在 Skyline 下不支持，调用后可能静默失效。改用 CSS transition / animation 或 Worklet，示例见[样式实践](./skyline-style-practice.md#animation-api-不支持--使用-css-transition)。

### 用 this.createSelectorQuery 替代 wx.createSelectorQuery

glass-easel 下优先用实例 `this.createSelectorQuery()`，性能优于 `wx.createSelectorQuery().in(this)`；exparser 同样支持。

```js
this.createSelectorQuery().select('#el').exec((res) => {})
```

### ScrollViewContext：开启 enhanced 属性

用 `NodesRef.node()` 获取 `ScrollViewContext` 前，须开启 `enhanced`；否则返回值不是该实例，调用 `scrollTo` 等方法会报错。节点查询放在渲染就绪后。

```html
<scroll-view id="sv" type="list" scroll-y="{{true}}" enhanced="{{true}}">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>
```

```js
createPage({
  onReady () {
    this.createSelectorQuery().select('#sv').node().exec((res) => {
      res[0].node.scrollTo({ top: 200, animated: true })
    })
  }
})
```

### 确保 wx:for 数据始终为 Array 或 Object

任意渲染阶段传入非 Array / Object 都会触发 `The for-list data is neither Array nor Object`。检查默认值、异步赋值、computed 所有返回分支及上游 `null` 等情况；`initData` 只保护初始化，后续更新仍需保证类型。

以下以数组列表为例，同时保护初始化和 computed 返回值：

```js
createComponent({
  properties: { compData: { type: Object, value: {} } },
  initData: { list: [] },
  computed: {
    list () {
      const list = this.compData?.data?.recommend_info
      return Array.isArray(list) ? list : []
    }
  }
})
```

### properties 声明类型与实际值保持一致

glass-easel 校验传入值和默认值，类型不符会报 `the type of property "xxx" is illegal`。按以下顺序处理：

1. 修正传值、默认值与声明，使其符合实际类型。
2. 确需联合类型时用 `optionalTypes`，不能写 `type: [Object, String]`。
3. 仅类型不可知时用 `type: null` 跳过校验，要求基础库 `>= 2.17.2`；`type` 必写，`value` 可选。

```js
createComponent({
  properties: {
    config: { type: String, optionalTypes: [Object], value: '' }
  }
})
```

### WXS 跨包引用错误：TypeError: R.wxs/stringify4ccc0480 is not a function

分包 glass-easel 页面 / 组件引用主包 WXS，而主包没有 glass-easel 页面 / 组件引用同一模块时，会触发此错误。让主包任一 glass-easel 页面 / 组件模板引用该 WXS；主包没有此类节点时，创建空组件完成引用。

## 性能优化

### 列表用 list / custom 模式按需渲染

- 显式声明 `type`，否则会退化为 WebView 渲染路径并全量渲染。
- `list` 按直接子节点是否在屏渲染；列表项须为直接子节点，整体再包一层 `view` 会退化为全量渲染。
- `custom` 用于 `sticky-section` / `list-view` / `grid-view` 等自定义结构。
- `list-item` 仅适合结构、样式一致而数据不同的项；差异较大的卡片不要统一添加，避免样式共享失败及额外判断开销。

```html
<scroll-view type="list" scroll-y>
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>
```

### cache-extent 预渲染（按需启用）

增大预渲染范围可减少快速滚动 / 切换时的白屏，但增加内存并拖慢首屏。仅出现明显白屏 / 掉帧时按真机表现调整；首屏敏感时不设或设小值，渲染完成后再增大。

| 组件 | 单位与含义 |
| --- | --- |
| `scroll-view` | px，如 `500` 表示视口上下各约 500px |
| `swiper` | 屏，默认 `1`，前后各预渲染一屏；重内容不盲目调大 |

```html
<scroll-view type="list" scroll-y cache-extent="{{500}}">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>
```

### 预加载 Skyline 环境

微信默认不预加载 Skyline，首次进入有冷启动开销。可在可能跳转到 Skyline 的前置页 `onShow` 中延迟约 500ms 调用，避开当前页首帧高峰；使用 `onShow` 而非 `onLoad`，返回前置页时可再次预加载。

```js
createPage({
  onShow () {
    setTimeout(() => wx.preloadSkylineView(), 500)
  }
})
```
