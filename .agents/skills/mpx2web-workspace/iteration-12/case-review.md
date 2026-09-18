> [!WARNING]
> 本文基于旧评分规则和旧断言编号，仅保留用于追溯。iteration-12 已更新评分口径，需重新评分后再生成结论。

# Mpx2Web iteration-12 Case、实现思路与源码对照

> Has = 使用 `mpx2web` Skill；No = 不使用 Skill。以下均为现有输出源码中的关键片段，未展示的部分为无关样式或原有业务代码。
>
> 当前结果：Has 适配主分 95.00%（22/23），No 适配主分 74.76%（17/23）。

## 总览

| Case | 题目 | Has | No |
| --- | --- | ---: | ---: |
| Case 1 | 组件样式布局与帮助卡片生成 | 10/10 | 10/10 |
| Case 2 | 事件绑定与实例方法 | 4/5 | 4/5 |
| Case 3 | 平台 API、分享与组件引用 | 6/6 | 2/6 |
| Case 4 | 路由配置与旧版 Store 详情页 SSR | 7/7 | 6/7 |

---

# Case 1：组件样式布局与帮助卡片生成

## 题目

对输入页面及组件进行 Web 跨端适配，并从零创建 `help-card.mpx` 和 `help-item.mpx`。同一套源码兼容 Web 和微信，保留原有布局、外观和交互。

核心要求：

- 图片保持 80×80、12px 圆角。
- 两个 fixed 入口保持视口定位。
- 红蓝卡片样式互不污染。
- 两个 `layout-cell` 平分 240px。
- `externalClasses` 的颜色和内边距真实传入。
- 生成帮助面板、展开/收起、WebView 跳转、CSS 变量及外部类链路。

## C1.1 图片尺寸与圆角

### Has 思路

给 `image` 增加稳定类名，避免 Web 内建 image 组件转换后后代标签选择器失效。

```html
<image class="preview-image" src="../../assets/sample.png" mode="aspectFill" />
```

```css
.preview-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
}
```

### No 思路

与 Has 相同，也改成直接类选择器。

```html
<image class="preview-image" src="../../assets/sample.png" mode="aspectFill" />
```

```css
.preview-image { width: 80px; height: 80px; border-radius: 12px; }
```

判定：Has 通过，No 通过。

## C1.2 fixed 悬浮入口

### Has 思路

把两个 fixed 节点移出 `scroll-view` 和 `movable-view`，避免祖先滚动或 transform 改变定位参照。

```html
<scroll-view class="feed" scroll-y="{{true}}">
  <row-group />
</scroll-view>
<view class="scroll-action" bindtap="recordTap">列表悬浮入口</view>

<movable-area class="move-area">
  <movable-view class="move-item" direction="all">
    <text>拖动此块</text>
  </movable-view>
</movable-area>
<view class="move-action" bindtap="recordTap">移动区悬浮入口</view>
```

### No 思路

与 Has 相同，移动节点并保留原点击方法。

```css
.scroll-action { position: fixed; right: 16px; bottom: 24px; }
.move-action { position: fixed; left: 16px; bottom: 24px; }
```

判定：Has 通过，No 通过。

## C1.4 红蓝卡片样式隔离

### Has 思路

两个组件都使用 scoped。

```html
<style scoped>
.card { padding: 12px; background: #fff0f0; }
.title { color: #c62828; font-size: 18px; }
</style>
```

### No 思路

同样使用 scoped。

```html
<style scoped>
.card { padding: 12px; background: #eef4ff; }
.title { color: #1565c0; font-size: 14px; }
</style>
```

判定：Has 通过，No 通过。

## C1.5 两格均分

### Has 思路

让实际 `layout-cell` 根节点成为 flex 子项，并通过精确路径配置 Web virtualHost。

```js
const componentPath = name => path.resolve(__dirname, 'src/components', name)

autoVirtualHostRules: {
  include: [
    componentPath('layout-cell.mpx'),
    componentPath('row-group.mpx'),
    componentPath('row-list.mpx')
  ]
}
```

```css
.layout-cell {
  box-sizing: border-box;
  flex: 0 0 50%;
  width: 50%;
  min-width: 0;
}
```

### No 思路

只给 `layout-cell` 配置 virtualHost，采用 `flex: 1 1 0 + width: 0` 均分。

```js
autoVirtualHostRules: {
  include: /src[\\/]components[\\/]layout-cell\.mpx$/
}
```

```css
.layout-cell {
  box-sizing: border-box;
  flex: 1 1 0;
  width: 0;
  min-width: 0;
}
```

判定：Has 通过，No 通过。No 的配置范围更小。

## C1.6 theme-card 外部类

### Has 思路

在 Web 编译配置登记实际使用的外部类，组件内部同时消费颜色和间距类。

```js
externalClasses: ['custom-class', 'i-class', 'tone-class', 'item-class']
```

```html
<view class="theme-label tone-class custom-class">{{label}}</view>
```

```js
createComponent({
  externalClasses: ['tone-class', 'custom-class']
})
```

### No 思路

实现与 Has 基本相同。

判定：Has 通过，No 通过。

## C1.7 帮助面板父子结构

### Has 思路

`help-card` 接收数据并真实引用 `help-item`；展开状态由子组件管理。

```html
<view class="help-card">
  <text class="help-card__title">{{title}}</text>
  <help-item
    description="{{description}}"
    help-url="{{helpUrl}}"
    item-class="item-class"
  />
</view>
```

```js
createComponent({
  properties: {
    title: String,
    description: String,
    helpUrl: String
  },
  externalClasses: ['item-class']
})
```

```js
createComponent({
  data: { expanded: false },
  methods: {
    toggleDescription () {
      this.expanded = !this.expanded
    }
  }
})
```

### No 思路

同样生成真实父子组件，区别主要是按钮和说明区域布局。

```html
<view class="help-item__content item-class">
  <text wx:if="{{expanded}}">{{description}}</text>
  <text bindtap="toggleDescription">
    {{expanded ? '收起说明' : '展开说明'}}
  </text>
  <button bindtap="openHelp">查看完整帮助</button>
</view>
```

判定：Has 通过，No 通过。

## C1.8 WebView 跳转

### Has 思路

URL 只编码一次后传给已有 WebView。

```js
openFullHelp () {
  if (!this.helpUrl) return
  navigateTo({
    url: `/pages/common/webview?url=${encodeURIComponent(this.helpUrl)}`
  })
}
```

### No 思路

相同逻辑，方法名为 `openHelp`。

```js
openHelp () {
  if (!this.helpUrl) return
  navigateTo({
    url: `/pages/common/webview?url=${encodeURIComponent(this.helpUrl)}`
  })
}
```

判定：Has 通过，No 通过。

## C1.9 CSS 变量主题

### Has

```css
.help-item__full-help {
  background: var(--btn_wrapper_bg, #2A2F3F);
}
```

### No

```css
.help-item__link {
  background: var(--btn_wrapper_bg, #2A2F3F);
}
```

判定：Has 通过，No 通过。

## C1.10 新组件样式隔离

### Has / No 思路

均使用 scoped 和局部 BEM 类名，不定义宿主已有的 `.title/.action`。

```html
<style scoped>
.help-card__title { /* ... */ }
.help-item__content { /* ... */ }
.help-item__toggle { /* ... */ }
</style>
```

判定：Has 通过，No 通过。

## C1.11 item-class 外部类链

### Has / No 思路

宿主传给面板，面板继续传给帮助项，帮助项在内部内容节点消费。

```html
<help-item item-class="item-class" />
```

```js
externalClasses: ['item-class']
```

```html
<view class="help-item__content item-class">...</view>
```

判定：Has 通过，No 通过。

---

# Case 2：事件绑定与实例方法

## 题目

适配 WXS 事件、跨组件事件传播、Composition API 当前实例、组件查询和 relations 顺序摘要；同一套源码兼容 Web 与微信。

## C2.1 WXS 点击和触摸事件

### Has 思路

微信保留 WXS，Web 增加普通实例方法。

```html
<view bindtap@wx="{{tool.onTap}}" @tap@web="onTap">点击</view>
<view bindtouchend@wx="{{tool.onTouchEnd}}" @touchend@web="onTouchEnd">触摸后松开</view>
```

```js
methods: {
  onTap () { this.recordAction('点击') },
  onTouchEnd () { this.recordAction('触摸结束') },
  recordAction (action) {
    this.triggerEvent('change', { action })
  }
}
```

### No 思路

删除 WXS，两端都调用组件方法。

```html
<view bindtap="onTap">点击</view>
<view bindtouchend="onTouchEnd">触摸后松开</view>
```

判定：Has 通过，No 通过。

## C2.2 notice 传播

### Has 思路

微信保留原 `bubbles/composed`；Web 由 wrapper 显式转发。

```js
this.triggerEvent('notice', { message: '来自内层组件' }, {
  bubbles: true,
  composed: true
})
```

```html
<notice-leaf @notice@web="forwardNotice" />
```

```js
forwardNotice (event) {
  this.triggerEvent('notice', event.detail)
}
```

```html
<view bindnotice@wx="onNotice">
  <notice-wrapper @notice@web="onNotice" />
</view>
```

### No 思路

删除叶子事件的冒泡配置，wrapper 在两端显式接收和重发。

```js
this.triggerEvent('notice', { message: '来自内层组件' })
```

```html
<notice-leaf bindnotice="forwardNotice" />
<notice-wrapper bindnotice="onNotice" />
```

判定：当前 Case 中 Has 通过、No 通过。

风险：No 改变了微信原有公开事件传播契约；其他祖先如果依赖 bubbles/composed 将收不到事件。Has 更稳妥。

## C2.3 当前实例

### Has 思路

使用 MpxProxy 的 `proxy`，增加空值保护。

```js
export function useReadyNotice () {
  const current = getCurrentInstance()
  const component = current && current.proxy
  return () => component && component.recordReady()
}
```

### No 思路

直接使用 `current.proxy`。

```js
export function useReadyNotice () {
  const current = getCurrentInstance()
  return () => current.proxy.recordReady()
}
```

判定：Has 通过，No 通过。

## C2.5 selectComponent 查询

### Has

```js
selectFirst () {
  this.selectComponent('.choice').setSelected(true)
}
resetChoices () {
  this.selectAllComponents('.choice').forEach(item => item.setSelected(false))
}
```

### No

代码与 Has 相同。

判定：Has 失败，No 失败。

原因：Web 编译把组件 class 转成动态 `:class`，而当前 matcher 只读取 `staticClass`，所以 `.choice` 不能可靠匹配。应改为稳定 id、ref 或数据驱动。

## C2.6 relations 顺序摘要

### Has 思路

微信保留 Behavior/relations；Web 使用 `orderedItems` 数据计算摘要。

```js
const relations = __mpx_mode__ === 'wx'
  ? {
      items: {
        ...relationHooks,
        target: orderedItem,
        linkChanged () { this.syncOrder() }
      }
    }
  : {}
```

```js
computed: {
  orderText () {
    if (__mpx_mode__ === 'web') {
      return this.orderedItems.map(item => item.label).join('、')
    }
    return this.relationOrderText
  }
}
```

### No 思路

把 Behavior 改成普通对象/mixin，摘要完全数据驱动。

```js
export default {
  properties: { label: String },
  methods: {
    getLabel () { return this.label }
  }
}
```

```js
createComponent({
  mixins: [orderedItem]
})
```

```js
computed: {
  orderText () {
    return this.items.map(item => item.label).join('、')
  }
}
```

判定：Has 通过，No 通过。

注意：Behavior 本身支持，无需强制改成 mixin。Has 的 `...relationHooks` 违反仓库运行时代码禁止对象展开的约束，当前功能评分未扣。

---

# Case 3：平台 API、分享与组件引用

## 题目

适配分享、可编辑名称、扫码、video、位置和微信插件。Web 没有位置、扫码、分享业务协议，不能伪造结果；微信功能必须保留。

## C3.1 分享

### Has 思路

模板展示 Web 未接入状态，并显式登记 Web 移除分享钩子。

```html
<block wx:if="{{__mpx_mode__ === 'wx'}}">
  <button open-type="share">分享内容</button>
</block>
<block wx:else>
  <button disabled="{{true}}">分享内容</button>
  <text>Web 分享服务尚未接入</text>
</block>
```

```js
if (__mpx_mode__ === 'web') {
  implement('onShareAppMessage', {
    modes: ['web'],
    remove: true
  })
}
```

### No 思路

模板使用有效的属性平台指令，保留 `onShareAppMessage`，依靠框架 Web 转换器删除钩子。

```html
<button @wx open-type="share">分享内容</button>
<button @web disabled="{{true}}">分享内容</button>
<text @web>Web 分享服务未接入</text>
```

```js
onShareAppMessage () {
  return { title: this.title, path: '/pages/content/index' }
}
```

判定：Has 通过，No 通过。明确显示“未接入”即可，不强制出现字面量 TODO。

## C3.2 名称编辑

### Has 思路

Web 提供页面内输入、确认和取消；微信保留 `wx.showModal`，使用真实 JS 分支。

```js
rename () {
  if (__mpx_mode__ === 'web') {
    this.renameValue = this.displayName
    this.renameVisible = true
  } else {
    wx.showModal({
      title: '编辑名称',
      editable: true,
      content: this.displayName,
      success: result => {
        if (result.confirm) this.displayName = result.content
      }
    })
  }
}
```

### No 思路

Web 用 `window.prompt`、微信用 `wx.showModal`，但错误地用普通注释充当条件编译。

```js
rename () {
  /* @mpx-if (__mpx_mode__ === 'web') */
  const nextName = window.prompt('编辑名称', this.displayName)
  if (nextName !== null) this.displayName = nextName
  /* @mpx-else */
  wx.showModal({ /* ... */ })
  /* @mpx-endif */
}
```

判定：Has 通过，No 失败。两段代码实际都会执行。

## C3.3 扫码组件

### Has 思路

模板隐藏 Web 扫码，同时通过动态 JSON 真正移除 Web 的 `native-scanner` 构建依赖。

```html
<block wx:if="{{__mpx_mode__ === 'wx'}}">
  <button bindtap="start">开始扫码</button>
  <native-scanner wx:if="{{scanning}}" bindresult="onCode" bindfailure="onCameraError" />
</block>
<block wx:else>
  <button disabled="{{true}}">开始扫码</button>
  <text>Web 扫码服务尚未接入</text>
</block>
```

```html
<script name="json">
const componentConfig = { component: true }
if (__mpx_mode__ === 'wx') {
  componentConfig.usingComponents = {
    'native-scanner': '../vendor/native-scanner/index.mpx'
  }
}
module.exports = componentConfig
</script>
```

### No 思路

模板使用 `@wx/@web`，但 JSON 使用无效条件注释。

```html
<native-scanner @wx wx:if="{{scanning}}" bindresult="onCode" />
<button @web disabled="{{true}}">开始扫码</button>
```

```json5
{
  "component": true
  /* @mpx-if (__mpx_mode__ === 'wx') */
  ,
  "usingComponents": {
    "native-scanner": "../vendor/native-scanner/index.mpx"
  }
  /* @mpx-endif */
}
```

JSON5 实际解析为：

```json
{
  "component": true,
  "usingComponents": {
    "native-scanner": "../vendor/native-scanner/index.mpx"
  }
}
```

判定：Has 通过，No 失败。模板隐藏不能解除 Web 构建对包含 `camera` 的原生扫码组件依赖。

## C3.4 video

### Has 思路

微信保留进度和元数据事件；Web 保留播放，明确降级辅助展示。

```html
<video
  wx:if="{{src}}"
  src="{{src}}"
  controls="{{true}}"
  bindtimeupdate@wx="onTimeUpdate"
  bindloadedmetadata@wx="onMetadata"
/>
```

```html
<block wx:else>
  <text>Web 端保留视频播放，进度和尺寸辅助信息暂不可用</text>
</block>
```

### No 思路

优先读取微信 `event.detail`，Web 缺字段时读取框架透传的原生 video target。

```js
function readNumber (detail, target, detailKey, targetKey) {
  const detailValue = detail && detail[detailKey]
  const targetValue = target && target[targetKey]
  const value = typeof detailValue === 'number' ? detailValue : Number(targetValue)
  return Number.isFinite(value) ? value : 0
}
```

```js
onTimeUpdate (event) {
  const detail = event.detail || {}
  const target = event.target || {}
  this.currentTime = readNumber(detail, target, 'currentTime', 'currentTime')
  this.duration = readNumber(detail, target, 'duration', 'duration')
}
```

判定：Has 通过，No 通过。

## C3.5 位置能力

### Has 思路

模板提示未接入，方法内部也使用真实控制流隔离。

```js
choosePlace () {
  if (__mpx_mode__ !== 'wx') return
  wx.chooseLocation({
    success: result => {
      this.placeName = result.name
    }
  })
}
```

### No 思路

错误使用 JS 条件注释。

```js
choosePlace () {
  /* @mpx-if (__mpx_mode__ === 'wx') */
  wx.chooseLocation({ /* ... */ })
  /* @mpx-else */
  this.placeName = 'Web 位置选择服务未接入'
  /* @mpx-endif */
}
```

判定：Has 通过，No 失败。微信也会执行 Web 兜底，Web 调用方法仍会到达 `wx.chooseLocation`。

## C3.6 微信插件

### Has 思路

app/page 都使用动态 JSON，只在微信加入插件声明和 `plugin://` 组件。

```html
<script name="json">
const appConfig = {
  pages: ['./pages/content/index.mpx']
}
if (__mpx_mode__ === 'wx') {
  appConfig.plugins = {
    foo: { version: '1.0.0', provider: 'wx123' }
  }
  appConfig.permission = {
    'scope.userLocation': { desc: '用于选择附近位置' }
  }
  appConfig.requiredPrivateInfos = ['chooseLocation']
}
module.exports = appConfig
</script>
```

```js
if (__mpx_mode__ === 'wx') {
  pageConfig.usingComponents['foo-card'] = 'plugin://foo/component'
}
```

### No 思路

模板隐藏卡片，但 JSON 使用无效注释。

```html
<foo-card @wx />
<text @web>服务卡片仅支持微信小程序，Web 服务未接入</text>
```

```json5
{
  "usingComponents": {
    "scan-entry": "../../components/scan-entry.mpx",
    "video-info": "../../components/video-info.mpx"
    /* @mpx-if (__mpx_mode__ === 'wx') */
    ,
    "foo-card": "plugin://foo/component"
    /* @mpx-endif */
  }
}
```

判定：Has 通过，No 失败。Web JSON 仍包含插件声明和 `plugin://` 组件。

---

# Case 4：路由配置与旧版 Store 详情页 SSR

## 题目

将 Web 部署到 `/help-demo/`，使用 history 路由；固定 rpx 换算；文章详情页支持 SSR 首屏正文、Pinia 注水、客户端复用、服务端请求隔离和客户端并发保护，同时保留微信功能。

## C4.2 Web 导航头

### Has 思路

只有微信读取胶囊尺寸。

```js
onLoad () {
  if (__mpx_mode__ === 'wx') {
    const capsule = wx.getMenuButtonBoundingClientRect()
    this.topInset = capsule.top
    this.headerHeight = capsule.height
  }
}
```

### No 思路

Web 直接返回。

```js
onLoad () {
  if (__mpx_mode__ === 'web') return
  const capsule = wx.getMenuButtonBoundingClientRect()
  this.topInset = capsule.top
  this.headerHeight = capsule.height
}
```

判定：Has 通过，No 通过。

## C4.3 `/help-demo/` 路由

### Has 思路

构建配置设置资源前缀，app 运行时配置 history/base。

```js
module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        webConfig: { useSSR: true }
      }
    }
  }
}
```

```js
if (__mpx_mode__ === 'web') {
  mpx.config.webConfig = Object.assign({}, mpx.config.webConfig, {
    routeConfig: {
      mode: 'history',
      base: '/help-demo/'
    }
  })
}
```

### No 思路

将 routeConfig 一并放进被框架消费的 `webConfig`。

```js
webConfig: {
  useSSR: true,
  routeConfig: {
    mode: 'history',
    base: '/help-demo/'
  }
}
```

判定：Has 通过，No 通过。

## C4.4 rpx 换算

### Has

```js
transRpxFn: function (_match, value) {
  const size = Number(value)
  return size === 0 ? '0' : `${size / 2}px`
}
```

### No

```js
function transWebRpx (match, value) {
  if (value === '0') return '0'
  return `${Number(value) / 2}px`
}
```

判定：Has 通过，No 通过。两者都得到 `200rpx→100px`、`28rpx→14px`。

## C4.5 SSR 预取

### Has 思路

`onLoad` 记录 id 并调用 action；`serverPrefetch` 返回相同 id 的 Promise，store 对同 id 去重。

```js
onLoad (query) {
  const id = query.id || 'a'
  this.requestedArticleId = id
  return this.loadArticle(id)
}
```

```js
pageOptions.serverPrefetch = function () {
  return this.loadArticle(this.requestedArticleId)
}
```

### No 思路

服务端 `onLoad` 只记录路由参数，由 `serverPrefetch` 统一加载。

```js
onLoad (query) {
  this.articleId = query.id || 'a'
  if (__mpx_mode__ === 'web' && typeof window === 'undefined') return
  return this.ensureArticle(this.articleId)
}
```

```js
serverPrefetch () {
  if (__mpx_mode__ !== 'web') return
  const route = this.$root.$options.router.currentRoute
  const id = (route.query && route.query.id) || this.articleId || 'a'
  this.articleId = id
  return this.ensureArticle(id)
}
```

判定：Has 通过，No 通过。

## C4.6 Pinia 注水和客户端复用

### Has 思路

每次 app 初始化创建 Pinia，页面使用官方 map helper；框架负责序列化和恢复 `pinia.state.value`。

```js
createApp({
  onAppInit () {
    return { pinia: createPinia() }
  }
})
```

```js
computed: Object.assign({}, mapState(useArticleStore, [
  'article', 'loading', 'errorText'
]))
methods: Object.assign({}, mapActions(useArticleStore, ['loadArticle']), {
  toggleExtra () { this.expanded = !this.expanded }
})
```

### No 思路

初始化方式相同，使用 `loadedId` 判断注水后的文章是否已加载。

```js
ensureArticle (id) {
  if (this.loadedId === id && !this.loading) {
    return Promise.resolve(this.article)
  }
  return this.loadArticle(id)
}
```

判定：Has 通过，No 通过。Store→Pinia 的结构迁移两组都正确。

## C4.7 SSR 隔离和客户端并发

### Has 思路

`state` 使用工厂；每次 SSR 请求有独立 Pinia。模块级 WeakMap 仅记录以 store 实例为 key 的在途请求，并用请求身份阻止迟到写入。

```js
const requests = new WeakMap()

const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    loading: true,
    errorText: '',
    requestedId: ''
  }),
  actions: {
    loadArticle (id) {
      const pending = requests.get(this)
      if (pending && pending.id === id) return pending.promise
      if (!pending && this.requestedId === id && !this.loading) {
        return Promise.resolve(this.article || undefined)
      }

      this.article = null
      this.loading = true
      this.errorText = ''
      this.requestedId = id

      const request = { id, promise: null }
      request.promise = fetchArticle(id)
        .then(article => {
          if (requests.get(this) === request) this.article = article
          return article
        })
        .catch(error => {
          if (requests.get(this) === request) this.errorText = error.message
        })
        .finally(() => {
          if (requests.get(this) === request) {
            this.loading = false
            requests.delete(this)
          }
        })

      requests.set(this, request)
      return request.promise
    }
  }
})
```

### No 思路

正确迁移为 Pinia，但没有请求身份保护。

```js
export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    loading: true,
    errorText: '',
    loadedId: ''
  }),
  actions: {
    async loadArticle (id) {
      this.article = null
      this.loading = true
      this.errorText = ''
      this.loadedId = ''
      try {
        const article = await fetchArticle(id)
        this.article = article
        return article
      } catch (error) {
        this.errorText = error.message
      } finally {
        this.loadedId = id
        this.loading = false
      }
    }
  }
})
```

固定延迟下：a=40ms、b=10ms。No 中 b 先写入，迟到的 a 又覆盖 b。

判定：Has 通过，No 失败。

## C4.8 SSR 环境安全

### Has 思路

微信 API 使用真实平台分支；服务端代码不访问 `window/document`。

```js
if (__mpx_mode__ === 'wx') {
  wx.getMenuButtonBoundingClientRect()
}
```

### No 思路

Web 隔离微信 API，并通过 `typeof window` 区分服务端。

```js
if (__mpx_mode__ === 'web') return
```

```js
if (__mpx_mode__ === 'web' && typeof window === 'undefined') return
```

判定：Has 通过，No 通过。

---

# 不计主分的交付检查

| 检查 | Has | No |
| --- | --- | --- |
| D3.1 权限/隐私声明说明 | 失败 | 失败 |
| D4.1 Web 导航尺寸说明 | 不适用 | 失败 |
| D4.2 `/help-demo/` 服务端 rewrite 说明 | 通过 | 通过 |
| D4.3 workers 的 Web 边界说明 | 通过 | 失败 |
| D4.4 independent 分包边界说明 | 通过 | 通过 |
| D4.5 preloadRule 的 Web 边界说明 | 通过 | 失败 |

# 最终失败项

- Has：`C2.5`
- No：`C2.5、C3.2、C3.3、C3.5、C3.6、C4.7`

# 当前需要特别确认的实现差异

1. No 的 notice 显式转发能满足当前页面，但改变了微信 `bubbles/composed` 的公开传播契约；Has 更稳妥。
2. Behavior 本身受支持，No 将其改成 mixin 并非必需。
3. Has 的 relations 写法使用对象展开，违反仓库运行时代码约束，建议改为 `Object.assign`。
4. Has/No 的 Store→Pinia 迁移结构都正确；No 只在客户端并发迟到写入上失败。
5. JSON 的 `/* @mpx-if */` 只允许用于 style 条件编译；放在 JS/JSON 中都不能形成隔离。

---

# 完整评分规则

## 1. 评分项与分桶

总共 28 个布尔评分项，每项只有“通过/不通过”：

- Case 1：10 项。
- Case 2：5 项。
- Case 3：6 项。
- Case 4：7 项。

其中分为：

### 适配主分：23 项

- Web 样式与已有组件：`C1.1、C1.2、C1.4、C1.5、C1.6`。
- 事件与实例：`C2.1、C2.2、C2.3、C2.5、C2.6`。
- API 与组件引用：`C3.1～C3.6`。
- 路由与 SSR：`C4.2～C4.8`。

### Web 分桶：19 项

- Case 1 的 5 个已有源码适配项。
- Case 2 的 5 项。
- Case 3 的 6 项。
- Case 4 的 `C4.2、C4.3、C4.4`。

### SSR 分桶：4 项

- `C4.5、C4.6、C4.7、C4.8`。

### 从零生成：5 项

- `C1.7、C1.8、C1.9、C1.10、C1.11`。
- 单列展示，不混入 23 项适配主分。

## 2. 百分比计算方式

报告采用“Case/run 等权”，不是直接把所有断言混在一起计算。

每个 Case 先计算自身通过率，再对包含该分桶评分项的 Case 求平均：

```text
总分 = Σ（每个 Case 的通过项 / 该 Case 的评分项）÷ Case 数量
```

例如 No 的适配主分：

```text
Case 1：5/5   = 1.0000
Case 2：4/5   = 0.8000
Case 3：2/6   = 0.3333
Case 4：6/7   = 0.8571

平均：(1 + 0.8 + 0.3333 + 0.8571) / 4
     = 74.76%
```

因此报告同时展示：

```text
74.76%（17/23）
```

`17/23` 是通过项数量；`74.76%` 是 Case 等权分数。两者口径不同。

Has 的适配分同理：

```text
Case 1：5/5 = 1.0
Case 2：4/5 = 0.8
Case 3：6/6 = 1.0
Case 4：7/7 = 1.0

平均 = 95.00%
通过数 = 22/23
```

## 3. 通用静态评审规则

1. 只读取 `input/`、`outputs/`、`fixtures/` 和 `delivery-notes.txt`。
2. 只做源码、配置和调用链审查。
3. 不执行 Web 构建、浏览器、SSR renderer、E2E 或微信真机验收。
4. 源码链路明确正确即可通过；不能因为“没有实际运行”而扣分。
5. 源码明确有缺陷则失败。
6. 源码不足以判断时设置 `review_status="pending"`，并按未通过处理。
7. 不根据关键词、注释数量、文件名或固定实现方案打分。
8. 接受功能等价方案，不强制使用 `.web.mpx`、`ref@web` 或平台副本。
9. `wx.xxx` 和 `mpx.xxx` 都按当前框架真实支持情况判断。
10. 保留合法的 `event.detail`、`bindscroll`、`open-type="navigate"` 不应被机械扣分。
11. JS/JSON/HTML 中的伪条件注释不能作为平台隔离。
12. `/* @mpx-if */` 条件注释仅在 style 条件编译中有效。
13. 同一个缺陷只在它确实影响多个独立目标时分别扣分；明确规定不重复计分的项不能跨项重复扣。
14. Has 与 No 使用完全相同的题目、输入、框架证据和评分规则。
15. 独立评分模型不知道候选来自 Has 或 No，不因使用 Skill 而奖励。

## 4. Case 1 专项评分规则

1. 图片尺寸必须追踪到 Web 实际根节点，不能只看到 `.image-row image` 就判通过。
2. fixed 必须保持相对视口定位，移动节点后还要保留点击、列表、滚动和拖动内容。
3. scoped、项目配置或等价局部命名都可以实现样式隔离。
4. `virtualHost` 必须追踪到 Web 编译配置的实际消费者；只在组件 options 中声明不自动算通过。
5. flex 必须落到实际布局子项。
6. `externalClasses` 必须从调用方一路追踪到组件内部消费节点。
7. CSS 变量必须允许外部覆盖，并有 `#2A2F3F` 回退。
8. `C1.1～C1.6` 只评已有源码。
9. `C1.7～C1.11` 只评新建 `help-card/help-item`。
10. 已有源码缺陷与生成组件缺陷不跨区域重复扣分。

## 5. Case 2 专项评分规则

1. 分别追踪 WXS 点击、触摸结束、notice 传播、当前实例、组件查询和顺序摘要。
2. 当前 Web 的 `triggerEvent` 第三个传播参数未被消费；允许 Web 显式转发。
3. 通知必须保留 `event.detail.message`，且每次只累计一次。
4. `getCurrentInstance()` 返回 MpxProxy，所有平台的 `proxy` 指向当前组件 target。
5. 有效的 `getCurrentInstance().proxy.recordReady()` 不需要额外 `current.target` 回退。
6. `selectComponent/selectAllComponents` 使用 class 时，必须结合 `processWebClass` 和 `matchSelector` 判断。
7. 当前 matcher 只读取 `staticClass`；编译成动态 `:class` 的组件类不能作为可靠查询依据。
8. 普通 Behavior 已支持，不要求改成 mixin。
9. relations 摘要可使用数据驱动方案，不强制实现完整 Web relations 引擎。

### 窄范围确定性纠正规则

模型评分之后还有两个源码规则：

- 若 `getCurrentInstance().proxy → recordReady` 调用链完整，强制将 `C2.3` 修正为通过，避免模型误判。
- 若 `selectComponent/selectAllComponents` 仍使用 class 选择器，强制将 `C2.5` 修正为失败。

## 6. Case 3 专项评分规则

1. 区分“整个能力缺失”和“只有某些选项/字段缺失”。
2. 没有业务协议时不得伪造分享、扫码、位置或插件结果。
3. 明确展示“Web 服务未接入”即可构成真实边界，不强制出现字面量 TODO。
4. JS 中的 `/* @mpx-if */` 只是注释，不能隔离 `window.prompt`、`wx.showModal`、`wx.chooseLocation`。
5. JSON 中的 `/* @mpx-if */` 会被 JSON5 当普通注释删除，被包围的配置仍然存在。
6. C3.3 中，只隐藏模板 `native-scanner` 不够；Web JSON 若仍解析包含 `camera` 的原生组件，必须失败。
7. C3.6 中，只隐藏 `foo-card` 模板不够；Web JSON 必须真正移除 `plugin://foo/component` 和相关插件依赖。
8. video 首先保留微信 `event.detail` 语义。
9. 当前 Web `inheritEvent` 会透传原生事件 `target`；detail 缺字段时，从 target 读取真实数值并做有限值校验属于有效适配。
10. 不得仅因出现 `event.target` 就判 video 失败。
11. `src/vendor/native-scanner` 是只读文件；缺失或修改会强制导致 `C3.3` 失败。

## 7. Case 4 专项评分规则

1. 区分构建配置、运行时 `routeConfig` 和部署服务器 rewrite。
2. `publicPath`、history/base 必须追踪到框架实际消费者。
3. 服务器 rewrite 和真实刷新属于交付边界，不作为 C4.3 功能通过的运行证据，也不因未实测而扣功能分。
4. rpx 换算按源码公式静态推导，不启动浏览器测量。
5. `serverPrefetch` 必须返回加载 Promise；只调用 action、没有等待链则失败。
6. SSR 状态管理使用 `@mpxjs/pinia`；旧 `@mpxjs/store` 不属于当前官方 SSR 支持方案。
7. Pinia 必须在 `onAppInit` 中为每个 SSR 请求创建实例。
8. 框架负责把 `pinia.state.value` 写入 SSR state，并从 `window.__INITIAL_STATE__` 恢复；不要求候选重复实现注水协议。
9. 客户端接管同一文章时不得重新请求。
10. C4.7 同时检查服务端请求级隔离和同一客户端 store 的并发覆盖。
11. 固定测试语义：文章 a 延迟 40ms、文章 b 延迟 10ms。
12. a→b 重叠加载时，迟到的 a 不能覆盖已经完成的 b。
13. 允许请求身份、代际、取消或其他等价保护。
14. 只迁移 Pinia 语法、没有迟到结果保护时，C4.7 仍然失败。
15. 当前功能判分以“最终状态不能被迟到请求覆盖”为核心。Has 会在请求开始时清空旧 `article`，同时用请求身份阻止迟到结果覆盖，因此当前判为通过。
16. 现有 `evals.json` 的 C4.7 文字还写着“请求开始时清空共享状态……不通过”，与上述实际判分存在偏差；应将它收敛为“只清空共享状态、却没有迟到结果保护时不通过”。

## 8. Gate 与只读文件规则

### 公共 Gate

- 不修改框架源码。
- 不靠空方法、伪造数据或只写 TODO 冒充功能完成。
- 不用 JS/JSON/HTML 伪条件注释冒充真实平台隔离。
- 不要求不必要的平台副本或全局配置改造。

### Case 1 Gate

- `help-card` 与 `help-item` 必须从零创建。
- 必须真实形成父子组件关系。
- 不改写只读 WebView 和宿主 fixtures。

### Case 3 只读文件

```text
src/vendor/native-scanner/index.mpx
```

若候选删除或修改该文件，`C3.3` 强制失败。

## 9. 非计分交付检查

`D3.1、D4.1～D4.5` 只记录到 `delivery_review`，不进入功能分母：

- 权限和隐私声明边界。
- Web 导航尺寸依据。
- `/help-demo/` 部署 rewrite。
- workers 不会自动成为 Web Worker。
- independent 分包在 Web 不等价于微信独立运行环境。
- preloadRule 不会自动转换成浏览器预下载策略。

缺少这些说明会产生静态告警，但不会扣 23 项适配主分。

## 10. 当前评分模型配置

```text
生成模型：gpt-5.6-sol
生成 reasoning effort：xhigh
评分模型：gpt-5.6-sol
评分 reasoning effort：high
samples：1
```

当前只有一次样本，因此结果适合用于迭代开发对比，不能视为统计稳定的泛化结论。
