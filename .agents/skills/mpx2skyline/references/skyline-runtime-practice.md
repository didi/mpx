# Skyline 运行时与性能适配实践

本文汇总 WebView 迁移 Skyline 时的运行时改造，包括渲染模式判断、页面滚动、常见报错和性能优化。

## 目录

- [常见问题](#常见问题)
  - [判断当前渲染模式](#判断当前渲染模式)
  - [页面滚动替代方案](#页面滚动替代方案)
  - [[必须] Skyline 不支持的动画方法](#必须-skyline-不支持的动画方法)
  - [[推荐] 用 this.createSelectorQuery 替代 wx.createSelectorQuery](#推荐-用-thiscreateselectorquery-替代-wxcreateselectorquery)
  - [[必须] ScrollViewContext：开启 enhanced 属性](#必须-scrollviewcontext开启-enhanced-属性)
  - [[必须] 确保 wx:for 数据始终为 Array 或 Object](#必须-确保-wxfor-数据始终为-array-或-object)
  - [[必须] properties 声明类型与实际值保持一致](#必须-properties-声明类型与实际值保持一致)
  - [WXS 跨包引用错误](#wxs-跨包引用错误typeerror-rwxsstringify4ccc0480-is-not-a-function)
- [性能优化](#性能优化)
  - [列表用 list / custom 模式按需渲染](#列表用-list--custom-模式按需渲染)
  - [cache-extent 预渲染（按需启用）](#cache-extent-预渲染按需启用)
  - [预加载 Skyline 环境](#预加载-skyline-环境)

---

## 常见问题

### 判断当前渲染模式

在页面或组件实例上可读取 `renderer` 成员，取值为 `webview` 或 `skyline`。Mpx 模板中可直接使用 `renderer === 'skyline'` 判断，无需额外声明布尔变量。选项式脚本使用 `this.renderer`；`<script setup>` 从 `getCurrentInstance().proxy` 读取 `renderer`，供模板使用时通过 `defineExpose` 暴露。

```js
// 选项式 API
import { createComponent } from '@mpxjs/core'

createComponent({
  attached() {
    if (this.renderer === 'skyline') {
      // 执行 Skyline 专属逻辑
    }
  }
})
```

```js
// <script setup>
import { getCurrentInstance } from '@mpxjs/core'

const { renderer } = getCurrentInstance().proxy

defineExpose({ renderer })
```

> 注意事项：
>
> 1. Skyline 与 WebView 只能通过运行时变量区分。编译时只能判断微信平台，无法判断具体渲染模式。
> 2. 组合式语法需要供模板使用时通过 `defineExpose` 暴露。

### 页面滚动替代方案

Skyline 不支持页面滚动，`onPullDownRefresh` / `onReachBottom` / `onPageScroll` 不会触发。需要滚动的页面必须使用 `scroll-view` 替代页面滚动，页面 JSON 同时声明 `disableScroll: true`。

```html
<!-- 普通长列表 type="list" -->
<scroll-view type="list" style="height:100%" show-scrollbar="{{false}}" scroll-y="true">
  <!-- 页面内容 -->
</scroll-view>
```

原页面生命周期要改为 `scroll-view` 对应事件。不能只删除生命周期，否则下拉刷新、触底加载和滚动监听会静默失效。

| 原页面生命周期 | scroll-view 事件 | 备注 |
| --- | --- | --- |
| `onPullDownRefresh` | `bindrefresherrefresh` | 需同时开 `refresher-enabled` |
| `onReachBottom` | `bindscrolltolower` | 可配合 `lower-threshold` 调阈值 |
| `onPageScroll(e.scrollTop)` | `bindscroll(e.detail.scrollTop)` | 高频事件，按需节流 |

WebView 也改用同一组 `scroll-view` 事件，避免维护两套逻辑。

```html
<!-- 普通长列表 type="list" -->
<scroll-view
  type="list"
  scroll-y="true"
  enhanced="true"
  refresher-enabled="{{true}}"
  bindrefresherrefresh="onRefresh"
  bindscrolltolower="onLoadMore"
  bindscroll="onScroll"
>
  <view>11</view>
  <view>22</view>
  <!-- 页面内容 -->
</scroll-view>
```

```js
createPage({
  onRefresh() {
    // 原 onPullDownRefresh 的逻辑
  },
  onLoadMore() {
    // 原 onReachBottom 的逻辑
  },
  onScroll(e) {
    const scrollTop = e.detail.scrollTop  // 原 onPageScroll 的 e.scrollTop
  }
})
```

### [必须] Skyline 不支持的动画方法

Skyline 下暂不支持以下动画方法，调用后静默不生效，需改用 CSS transition / animation 或 Worklet 动画替代：

- `animate`
- `applyAnimation`
- `clearAnimation`
- `setInitialRenderingCache`
- `wx.createAnimation`

### [推荐] 用 this.createSelectorQuery 替代 wx.createSelectorQuery

glass-easel 下 `wx.createSelectorQuery` 性能不如 `this.createSelectorQuery`，推荐使用后者（exparser 同样支持）。

```js
// ❌ Bad
wx.createSelectorQuery().in(this).select('#el').exec(res => {})

// ✅ Good
this.createSelectorQuery().select('#el').exec(res => {})
```

### [必须] ScrollViewContext：开启 enhanced 属性

通过 `NodesRef.node()` 获取 `ScrollViewContext` 时，`scroll-view` 必须开启 `enhanced` 属性，否则返回的不是 ScrollViewContext 实例，调用 `scrollTo` 等方法会报错。

```html
<!-- ❌ Bad — 未开启 enhanced，node() 返回的不是 ScrollViewContext -->
<scroll-view type="list" scroll-y="true" id="sv">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>

<!-- ✅ Good — 开启 enhanced，才能获取 ScrollViewContext 实例 -->
<scroll-view type="list" scroll-y="true" enhanced="true" id="sv">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>
```

```js
createPage({
  onReady() {
    this.createSelectorQuery().select('#sv').node()
      .exec(res => {
        const ctx = res[0].node  // 只有开启 enhanced 才是 ScrollViewContext
        ctx.scrollTo({ top: 200, animated: true })
      })
  }
})
```

### [必须] 确保 wx:for 数据始终为 Array 或 Object

`wx:for` 在任意渲染阶段收到非 Array/Object 值时，都会触发 `"The for-list data is neither Array nor Object"` 错误。常见来源包括 properties 默认值缺失、异步数据未返回、computed 分支未返回值或上游传入 `null` 等；computed 初始化未完成只是其中一种情况。

```js
// ❌ Bad — 初始化阶段 computed 未完成，wx:for 收到 undefined 导致崩溃
createComponent({
  properties: {
    compData: {
      type: Object,
      value: {
        data: {}
      }
    }
  },
  computed: {
    list() {
      return this.compData?.data.recommend_info
    }
  }
})

// ✅ Good — initData 保护初始化阶段，computed 保护后续更新
createComponent({
  properties: {
    compData: {
      type: Object,
      value: {
        data: {}
      }
    }
  },
  initData: {
    list: []
  },
  computed: {
    list() {
      return this.compData?.data.recommend_info || []
    }
  }
})
```

`initData` 只能提供初始化阶段的值，不能替代 computed 返回值保护。适配时需检查 `wx:for` 数据源的所有赋值和返回路径，确保始终为 Array 或 Object。

### [必须] properties 声明类型与实际值保持一致

glass-easel 会校验 properties 的声明类型；实际传入值或默认值与 `type` 不匹配时会报 `"the type of property "xxx" is illegal"` 类型校验错误，按以下优先级处理：

1. 优先修正调用侧传值和默认值，使其匹配真实类型；
2. 业务确实允许联合类型时使用 `optionalTypes`；
3. 只有类型确实不可知时才使用 `type: null` 跳过校验。

```js
// ❌ Bad — type 不支持使用数组声明多个类型
createComponent({
  properties: {
    moreIconStyle: {
      type: [Object, String],
      value: ''
    }
  }
})

// ✅ Good — 通过 optionalTypes 补充定义其他类型（更推荐）
createComponent({
  properties: {
    config: {
      type: String,
      optionalTypes: [Object],
      value: ''
    }
  }
})

// ✅ Good — 仅在无法确定类型时，将 type 设为 null 跳过校验
createComponent({
  properties: {
    config: {
      type: null,
      value: () => ({})
    }
  }
})
```

> properties 中 value 可选；type 必写，基础库 2.17.2 及以上允许设置为 null 跳过校验（低于 2.17.2 的基础库不支持，这里暂不考虑低版本）。

### WXS 跨包引用错误：TypeError: R.wxs/stringify4ccc0480 is not a function

当分包中的 glass-easel 页面或组件引用主包 WXS，而主包内没有任何 glass-easel 页面或组件引用同一 WXS 时，会出现该错误。

处理方式：在主包任意一个 glass-easel 页面或组件模板中引用该 WXS；如果主包没有此类页面或组件，可创建一个空组件完成引用。

## 性能优化

### 列表用 list / custom 模式按需渲染

`scroll-view` 不指定 `type` 时会退化为 WebView 渲染路径，并一次性渲染整个列表。Skyline 下需要明确声明 `type`：

- `type="list"`：列表模式，根据**直接子节点**是否在屏按需渲染。
- `type="custom"`：自定义模式，子节点可用 `sticky-section` / `list-view` / `grid-view` 等。

```html
<!-- ❌ Bad — 未声明 type，退化为全量渲染 -->
<scroll-view scroll-y>
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>

<!-- ✅ Good — list 模式，只渲染在屏节点 -->
<scroll-view type="list" scroll-y>
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>
```

> 注意：`list` 模式下列表项必须是 `scroll-view` 的**直接子节点**；若只有一个直接子节点（例如外面又包了一层 `view`），按需渲染会退化为全量渲染。

`list-item` 适合结构和样式一致、差异仅来自数据的列表项。卡片结构差异较大时不要统一添加，否则样式共享失败，反而会增加运行时判断开销。

### cache-extent 预渲染（按需启用）

`cache-extent` 用于指定预渲染范围。增大该值可以减少快速滚动或切换时的白屏，但也会增加内存占用并拖慢首屏，因此只在确有需要时开启。

`scroll-view`（单位 px）：

```html
<!-- 预渲染视口上下各约 500px 的内容 -->
<scroll-view type="list" scroll-y cache-extent="{{500}}">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</scroll-view>
```

`swiper`（单位「屏」，默认 `1`，即前后各预渲染一屏）：

```html
<!-- 预渲染相邻 1 页（默认值），重内容场景不建议盲目调大 -->
<swiper cache-extent="{{1}}">
  <swiper-item wx:for="{{banners}}" wx:key="id">...</swiper-item>
</swiper>
```

- 首屏敏感的页面：首屏不设或设小值，渲染完成后再调大。
- 仅在出现明显白屏 / 掉帧时按需加，并以真机表现为准。

### 预加载 Skyline 环境

微信客户端默认不预加载 Skyline 环境（以 WebView 为主），首次进入 Skyline 页面会有冷启动开销。在可能跳转到 Skyline 页面的前置页面手动预加载，可显著缩短首屏：

```js
createPage({
  onShow() {
    // 延迟调用，避免阻塞当前页面渲染
    setTimeout(() => {
      wx.preloadSkylineView()
    }, 500)
  }
})
```

- 放在 `onShow` 而非 `onLoad`：用户从 Skyline 页面返回时，前置页 `onShow` 会再次触发，保证下次跳转仍是热环境。
- 延迟约 500ms 触发，避开当前页首帧高峰。
