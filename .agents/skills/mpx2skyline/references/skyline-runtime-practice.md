# Skyline 运行时与性能适配实践

本文记录 WebView 迁移 Skyline 时偏运行时、框架行为、滚动上下文、glass-easel、常见报错与性能优化的可复制改造方案。

## 目录

- [判断当前渲染模式](#判断当前渲染模式)
- [组件与滚动上下文适配](#组件与滚动上下文适配)
  - [嵌套滚动适配](#嵌套滚动适配)
- [glass-easel 变更点适配](#glass-easel-变更点适配)
  - [[必须] 模板中数据绑定外的转义改为标准 XML 转义](#必须-模板中数据绑定外的转义改为标准-xml-转义)
  - [[必须] 不再支持 wx-if / wx-for，仅支持 wx:if / wx:for](#必须-不再支持-wx-if--wx-for仅支持-wxif--wxfor)
  - [[必须] wx:for 内嵌 include 时改为 template](#必须-wxfor-内嵌-include-时改为-template)
  - [[必须] SelectorQuery 选择器不再支持以数字开头](#必须-selectorquery-选择器不再支持以数字开头)
  - [[必须] Skyline Worklet 回调函数名称变更](#必须-skyline-worklet-回调函数名称变更)
  - [[必须] Skyline 不支持的组件实例方法](#必须-skyline-不支持的组件实例方法)
  - [[推荐] 用 this.createSelectorQuery 替代 wx.createSelectorQuery](#推荐-用-thiscreateselectorquery-替代-wxcreateselectorquery)
- [常见问题与踩坑记录](#常见问题与踩坑记录)
  - [ScrollViewContext：必须开启 enhanced 属性](#scrollviewcontext必须开启-enhanced-属性)
  - [properties 默认值必须使用 value 而非 default](#properties-默认值必须使用-value-而非-default)
  - [The for-list data is neither Array nor Object 报错](#the-for-list-data-is-neither-array-nor-object-报错)
  - [properties type 校验报错](#properties-type-校验报错)
  - [animation API 不支持 → 使用 CSS transition](#animation-api-不支持--使用-css-transition)
  - [wxs 跨包引用错误](#wxs-跨包引用错误typeerror-rwxsstringify4ccc0480-is-not-a-function)
- [性能优化](#性能优化)
  - [列表用 list / custom 模式按需渲染](#列表用-list--custom-模式按需渲染)
  - [cache-extent 预渲染（按需启用）](#cache-extent-预渲染按需启用)
  - [预加载 Skyline 环境](#预加载-skyline-环境)

---

## 判断当前渲染模式

在页面或组件实例上可读取 `renderer` 成员，取值为 `webview` 或 `skyline`。如果在模板中要判断，可以拿到值后设置到 data 上。

在生命周期（如 `onLoad`）中赋值到 data，供模板使用：

```js
// 选项式 API
createPage({
  data: {
    isSkyline: this.renderer === 'skyline'
  }
})
```

```js
// setup script
import { getCurrentInstance, onMounted } from '@mpxjs/core'

const instance = getCurrentInstance()
const renderer = instance.proxy.renderer

onMounted(() => {
  console.log('当前 renderer:', renderer)
})
```

> 注意事项：Skyline & Webview 只能通过运行时的变量区分，在编译时仅能区分微信平台，无法区分是否是 Skyline 渲染

## 组件与滚动上下文适配

### 嵌套滚动适配

父子 `scroll-view` 嵌套时，外层必须使用 `type="nested"` 配合 `nested-scroll-header` 和 `nested-scroll-body`，内层设置 `associative-container="nested-scroll-view"`。直接嵌套两个 `scroll-view` 会导致滚动联动失效。

**重要：嵌套场景下每一层 `scroll-view` 都必须显式声明 `type`**——外层 `type="nested"`、内层 `type="list"` / `"custom"`。遗漏内层 `type` 会让内层退化为 WebView 渲染路径，性能与手势均异常。`list-view` / `grid-view` 仅在 `type="custom"` 或 `sticky-section` 的直接子节点位置生效，放在 `type="list"` 或裸 scroll-view 内不会生效。

```html
<!-- ❌ Bad — 直接嵌套 scroll-view 导致滚动联动失效 -->
<scroll-view scroll-y="true">
  <view>顶部区域</view>
  <scroll-view scroll-y="true">
    <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
  </scroll-view>
</scroll-view>

<!-- ❌ Bad — 内层 scroll-view 缺 type -->
<scroll-view type="nested" scroll-y="true">
  <nested-scroll-body>
    <scroll-view scroll-y="true" associative-container="nested-scroll-view">...</scroll-view>
  </nested-scroll-body>
</scroll-view>

<!-- ✅ Good — 使用 type="nested" + nested-scroll-header/body，且每层都显式 type -->
<scroll-view type="nested" scroll-y="true">
  <nested-scroll-header>
    <view>顶部固定区域</view>
  </nested-scroll-header>
  <nested-scroll-body>
    <scroll-view
      type="list"
      scroll-y="true"
      associative-container="nested-scroll-view"
    >
      <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
    </scroll-view>
  </nested-scroll-body>
</scroll-view>
```

## glass-easel 变更点适配

glass-easel 在设计上兼容绝大多数旧版组件框架 exparser 的接口，仅有少数地方需要适配。以下变更点来自[官方适配指引](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/glass-easel/migration.html)。

### [必须] 模板中数据绑定外的转义改为标准 XML 转义

数据绑定**外**的引号须改用 XML 实体转义；数据绑定**内**无需再转义。

```html
<!-- ❌ Bad — 旧写法：反斜杠转义 -->
<view prop-a="\"test\"" prop-b="{{ test === \"test\" }}" />

<!-- ✅ Good — 新写法：XML 实体转义（外）、不转义（内） -->
<view prop-a="&quot;test&quot;" prop-b="{{ test === "test" }}" />
```

### [必须] 不再支持 wx-if / wx-for，仅支持 wx:if / wx:for

`wx-if` / `wx-for`（短横线写法）已废弃，仅支持 `wx:if` / `wx:for`（冒号写法）。exparser 同样支持冒号写法，可直接变更。

```html
<!-- ❌ Bad -->
<view wx-if="{{ arr }}" />

<!-- ✅ Good -->
<view wx:if="{{ arr }}" />
```

### [必须] wx:for 内嵌 &lt;include&gt; 时改为 &lt;template&gt;

在 `wx:for` 中使用 `<include>` 时，被引入的模板中的 `item` / `index` 变量不再有效，需改为 `<template>` + `<import>` 方案。

```html
<!-- ❌ Bad -->
<block wx:for="{{ arr }}">
  <include src="inc.wxml" />
</block>

<!-- inc.wxml -->
<view>{{ index }}. {{ item }}</view>
```

```html
<!-- ✅ Good -->
<import src="inc.wxml" />
<block wx:for="{{ arr }}">
  <template is="wx-for-content" data="{{ index, item }}" />
</block>

<!-- inc.wxml -->
<template name="wx-for-content">
  <view>{{ index }}. {{ item }}</view>
</template>
```

### [必须] SelectorQuery 选择器不再支持以数字开头

`#1` 等以数字开头的 id 选择器在 glass-easel 下不合法（与 CSS 选择器规范保持一致），需重命名。

```js
// ❌ Bad
this.createSelectorQuery().select('#1').exec(res => {})

// ✅ Good
this.createSelectorQuery().select('#element-1').exec(res => {})
```

### [必须] Skyline Worklet 回调函数名称变更

Skyline 渲染后端上的 Worklet 事件名已更新，旧版本基础库同样支持新事件名，可直接变更。

| 组件 | 旧 Worklet 事件名 | 新 Worklet 事件名 |
| --- | --- | --- |
| `pan-gesture-handler` | `on-gesture-event` | `worklet:ongesture` |
| `pan-gesture-handler` | `should-response-on-move` | `worklet:should-response-on-move` |
| `pan-gesture-handler` | `should-accept-gesture` | `worklet:should-accept-gesture` |
| `scroll-view` | `bind:scroll-start` | `worklet:onscrollstart` |
| `scroll-view` | `bind:scroll` | `worklet:onscrollupdate` |
| `scroll-view` | `bind:scroll-end` | `worklet:onscrollend` |
| `scroll-view` | `adjust-deceleration-velocity` | `worklet:adjust-deceleration-velocity` |
| `swiper` | `bind:transition` | `worklet:onscrollstart` / `worklet:onscrollupdate` |
| `swiper` | `bind:animationfinish` | `worklet:onscrollend` |
| `share-element` | `on-frame` | `worklet:onframe` |

```html
<!-- ❌ Bad -->
<scroll-view bindscroll="onScrollWorklet" />
<swiper bind:transition="onTransitionWorklet" />

<!-- ✅ Good -->
<scroll-view worklet:onscrollupdate="onScrollWorklet" />
<swiper
  worklet:onscrollstart="onTransitionWorklet"
  worklet:onscrollupdate="onTransitionWorklet"
  worklet:onscrollend="onTransitionWorklet"
/>
```

### [必须] Skyline 不支持的组件实例方法

Skyline 下以下组件实例方法暂不支持，调用后静默不生效，需改用 CSS transition 或 Worklet 动画替代：

- `animate`
- `applyAnimation`
- `clearAnimation`
- `setInitialRenderingCache`

### [推荐] 用 this.createSelectorQuery 替代 wx.createSelectorQuery

glass-easel 下 `wx.createSelectorQuery` 性能不如 `this.createSelectorQuery`，推荐使用后者（exparser 同样支持）。

```js
// ❌ Bad
wx.createSelectorQuery().in(this).select('#el').exec(res => {})

// ✅ Good
this.createSelectorQuery().select('#el').exec(res => {})
```

## 常见问题与踩坑记录

### ScrollViewContext：必须开启 enhanced 属性

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

### properties 默认值必须使用 `value` 而非 `default`

glass-easel 要求组件 properties 的默认值通过 `value` 字段声明，使用 `default` 字段会被忽略，导致属性值为 `undefined`。

```js
// ❌ Bad — glass-easel 下 default 字段无效，属性值为 undefined
createComponent({
  properties: {
    title: {
      type: String,
      default: ''
    }
  }
})

// ✅ Good — 使用 value 字段声明默认值
createComponent({
  properties: {
    title: {
      type: String,
      value: ''
    }
  }
})
```

### The for-list data is neither Array nor Object 报错

当 `wx:for` 绑定的数据是 computed 计算属性时，组件初始化阶段 computed 尚未计算完成，`wx:for` 会收到 `undefined`，触发 `"The for-list data is neither Array nor Object"` 错误。

```js
// ❌ Bad — 初始化阶段 computed 未完成，wx:for 收到 undefined 导致崩溃
createComponent({
  properties: {
    compData: {
      type: Object,
      value: () => ({
        data: {}
      })
    }
  },
  computed: {
    list() {
      return this.compData?.data.recommend_info
    }
  }
})

// ✅ Good — 通过 initData 提供初始值防护
createComponent({
  properties: {
    compData: {
      type: Object,
      value: () => ({
        data: {}
      })
    }
  },
  initData: {
    list: []
  },
  computed: {
    list() {
      return this.compData?.data.recommend_info
    }
  }
})
```

### properties type 校验报错

在 glass-easel 下，如果 properties 的 type 声明与实际传入值不匹配，会触发 `"the tyle of property "xxx" is not illegal"` 类型校验错误。两种解决方式：


方式一：initData 提供正确类型（更推荐）

```js
createComponent({
  properties: {
    config: {
      // 通过 optionalTypes 补充定义其他类型
      type: Object,
      optionalTypes: [Array],
      value: () => {}
    }
  }
})
```

方式二：type 设为 null 跳过校验

> 2.17.2 及以上的基础库增加了对未填写的兼容（未填写时兼容为填写 null），更低版本的基础库无法处理未填写的情况

```js
createComponent({
  properties: {
    config: {
      // 跳过类型校验
      type: null,
      value: {}
    }
  }
})
```

### animation API 不支持 → 使用 CSS transition

Skyline 不支持 `wx.createAnimation` API（`animation` 属性赋值方式），需要改用 CSS `transition` 或 worklet 动画。

```js
// ❌ Bad — wx.createAnimation 在 Skyline 下无效
const animation = wx.createAnimation({
  duration: 300,
  timingFunction: 'ease'
})
const animationData = ref(animation.opacity(0).step().export())
```

```css
/* ✅ Good — 使用 CSS transition 替代 */
.fade-element {
  transition: opacity 0.3s ease;
}
.fade-element.hidden {
  opacity: 0;
}
```

### wxs 跨包引用错误：TypeError: R.wxs/stringify4ccc0480 is not a function

触发条件：当主包的 wxs 在分包中被 "componentFramework" 为 "glass-easel" 的组件/页面的使用，且在主包没有使用 "componentFramework" 为 "glass-easel" 的组件/页面的时会出现

规避方案：在主包的任意一个 "componentFramework" 为 "glass-easel" 的组件/页面的 wxml 中引用一下这个 wxs 即可，如果没有可以创建一个空组件来引用。

## 性能优化

### 列表用 list / custom 模式按需渲染

`scroll-view` 不指定 `type` 会退化为 WebView 渲染路径，整个列表一次性全量渲染。Skyline 下务必声明 `type`，让滚动容器只渲染在屏节点：

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

适用前提:列表项结构、样式一致(差异仅由数据驱动)。结构差异较大的卡片混排不要无脑标注 `list-item`,否则共享失败反而增加判定成本。

### cache-extent 预渲染（按需启用）

`cache-extent` 指定预渲染范围，默认视口外节点不渲染。设置后可减少快速滚动 / 切换时的白屏、提升流畅度，但**会提高内存占用并拖慢首屏**——属于用内存换流畅的权衡，不要无脑全开。

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

微信客户端默认不预加载 Skyline 环境(WebView 为主),首次进入 Skyline 页面会有冷启动开销。在可能跳转到 Skyline 页面的前置页面手动预加载,可显著缩短首屏:

```js
createPage({
  onShow() {
    // 延迟调用,避免阻塞当前页面渲染
    setTimeout(() => {
      wx.preloadSkylineView()
    }, 500)
  }
})
```

- 放在 `onShow` 而非 `onLoad`:用户从 Skyline 页面返回时,前置页 `onShow` 会再次触发,保证下次跳转仍是热环境。
- 延迟约 500ms 触发,避开当前页首帧高峰。
