# Skyline 基础组件支持与差异参考

## 目录

- [通用特性](#通用特性)
- [组件支持详情](#组件支持详情)
- [Skyline 新增组件](#skyline-新增组件)
  - [span — 内联混排](#span--内联混排)
  - [snapshot — 截图](#snapshot--截图)
  - [sticky-header / sticky-section — 吸顶布局](#sticky-header--sticky-section--吸顶布局)
  - [nested-scroll-header / nested-scroll-body — 嵌套滚动](#nested-scroll-header--nested-scroll-body--嵌套滚动)
  - [list-view — 列表布局](#list-view--列表布局)
  - [grid-view — 网格/瀑布流布局](#grid-view--网格瀑布流布局)
  - [draggable-sheet — 半屏可拖拽](#draggable-sheet--半屏可拖拽)
  - [手势组件族](#手势组件族)
- [组件使用注意事项](#组件使用注意事项)
  - [scroll-view 必须指定 type](#scroll-view-必须指定-type)
  - [text 是唯一内联文本组件](#text-是唯一内联文本组件)
  - [navigator 嵌套限制](#navigator-嵌套限制)
  - [share-element 使用方式差异](#share-element-使用方式差异)
  - [rich-text 渲染差异](#rich-text-渲染差异)
  - [自定义组件样式隔离](#自定义组件样式隔离)
  - [组件根节点行为](#组件根节点行为)
  - [glass-easel 组件框架差异](#glass-easel-组件框架差异)
  - [特定组件踩坑](#特定组件踩坑)

---

## 通用特性

| 特性 | 支持情况 |
| --- | --- |
| 无障碍访问 | 暂只支持 `aria-role` / `label` / `hidden` / `disabled` |
| DarkMode | 支持 |
| 原生组件 | 均支持同层渲染 |
| WeUI v2 | 支持 |

## 组件支持详情

| 组件 | 支持情况 | 差异备注 |
| --- | --- | --- |
| text | 基本支持 | 内联文本只能用 text 组件；可通过 span 组件与 text / image 内联 |
| view / cover-view | 完全支持 | 涉及文本节点见 text 组件 |
| image / cover-image | 基本支持 | SVG 支持度已完善；部分低频 mode 未支持；max-width 行为异常需用明确 width；border/padding 导致尺寸异常需外层 view 包裹 |
| button | 完全支持 | |
| scroll-view | 完全支持 | **需显式指定 `type="list"`**；部分属性无需对齐；额外支持大量新特性 |
| swiper / swiper-item | 完全支持 | 增强大量特性；单项无限循环可能异常；swiper-item 自定义宽度可能不生效 |
| input / textarea | 完全支持 | 光标选区、菜单略有不同；键盘收起/恢复行为与 WebView 有差异，可能导致布局跳动 |
| navigator | 完全支持 | 只能嵌套 text 组件或文本节点；可通过 span 组件与 text/image 内联 |
| map | 完全支持 | 开发者工具暂未支持调试，请使用真机预览；getScale API 可能无响应需用 bindregionchange 替代；Android 高度动态变化渲染异常；iOS backdrop-filter 不生效 |
| canvas | 完全支持 | 开发者工具暂未支持调试，请使用真机预览 |
| radio / radio-group | 完全支持 | |
| label | 完全支持 | |
| video | 基本支持 | 全屏在 3.3.0 已支持，投屏暂未支持，开发者工具暂未支持调试 |
| checkbox / checkbox-group | 完全支持 | |
| picker | 完全支持 | |
| camera | 完全支持 | 开发者工具暂未支持调试 |
| root-portal | 完全支持 | |
| form | 完全支持 | |
| ad | 完全支持 | |
| official-account | 完全支持 | |
| functional-page-navigator | 支持中 | |
| live-player / live-pusher | 完全支持 | |
| picker-view | 基本支持 | `indicator-class` / `mask-style` 属性暂未支持；双列同时滚动时索引可能错乱 |
| voip-room | 完全支持 | |
| rich-text | 完全支持 | 渲染结果可能略为不同；`mode=web` 时则完全对齐 webview |
| match-media | 待考虑 | |
| keyboard-accessory | 待考虑 | 可通过 input 的 `worklet:onkeyboardheightchange` 回调实现 |
| page-meta | 基本支持 | 与全局滚动相关的属性不支持 |
| editor | 暂不考虑 | |
| web-view | 暂不考虑 | 建议承载 web-view 的页面单独配置 `"renderer": "webview"` |
| movable-area / movable-view | 暂不考虑 | 必须用手势组件 + worklet 动画方案替代 |
| page-container | 基本支持 | |
| share-element | 完全支持 | 与 WebView 使用方式有异，特性有所增强 |
| icon | 完全支持 | |
| progress | 暂不考虑 | |
| slider | 完全支持 | |
| switch | 完全支持 | |
| xr-frame | 暂未支持 | |
| navigation-bar | 不考虑 | Skyline 只能用自定义导航 |
| open-data | 完全支持 | 已废弃特性不支持 |

## Skyline 新增组件

### span — 内联混排

用于支持内联文本和 image / navigator 的混排。在 Skyline 中，`view` 不支持 inline 布局，需要内联混排时使用 `span` 包裹 `text` 和 `image`。

```html
<span>
  <text>文本内容</text>
  <image src="icon.png" style="width:16px;height:16px;" />
  <text>更多文本</text>
</span>
```

在 Mpx 中使用 span 需要通过条件编译指定标签名：

```html
<view mpxTagName@wx="span">
  <view mpxTagName@wx="text">文本1</view>
  <view mpxTagName@wx="text">文本2</view>
</view>
```

### snapshot — 截图

截图组件，用于对指定区域进行截图操作。

### sticky-header / sticky-section — 吸顶布局

吸顶布局容器，替代 WebView 中的 `position: sticky` 方案。

- `sticky-section`：吸顶分组容器
- `sticky-header`：吸顶头部节点

### nested-scroll-header / nested-scroll-body — 嵌套滚动

嵌套 scroll-view 场景中使用的节点，仅支持作为 `<scroll-view type="nested">` 模式的直接子节点。

- `nested-scroll-header`：嵌套滚动的头部区域
- `nested-scroll-body`：嵌套滚动的主体区域

### list-view — 列表布局

列表布局容器，仅支持作为 `<scroll-view type="custom">` 模式的直接子节点或 `sticky-section` 组件直接子节点。用于替代长列表场景，具有更好的性能表现。

### grid-view — 网格/瀑布流布局

Skyline 下的网格布局容器和瀑布流布局容器。

### draggable-sheet — 半屏可拖拽

半屏可拖拽组件，用于实现从底部弹出的半屏面板。

### 手势组件族

Skyline 提供了 9 种手势组件，直接在 UI 线程响应，避免跨线程延迟：

| 组件 | 触发时机 |
| --- | --- |
| `tap-gesture-handler` | 点击时触发 |
| `double-tap-gesture-handler` | 双击时触发 |
| `force-press-gesture-handler` | iPhone 设备重按时触发 |
| `horizontal-drag-gesture-handler` | 横向滑动时触发 |
| `long-press-gesture-handler` | 长按时触发 |
| `pan-gesture-handler` | 拖动（横向/纵向）时触发 |
| `scale-gesture-handler` | 多指缩放时触发 |
| `vertical-drag-gesture-handler` | 纵向滑动时触发 |

手势组件的详细用法和事件参数见 [Worklet 动画与手势系统参考](./skyline-worklet-animation.md#手势系统)。

## 组件使用注意事项

### scroll-view 必须指定 type

Skyline 下 `scroll-view` 必须显式指定 `type` 属性：

```html
<!-- 列表滚动 -->
<scroll-view type="list" scroll-y style="height:100%">
  <!-- 列表内容 -->
</scroll-view>

<!-- 嵌套滚动 -->
<scroll-view type="nested">
  <nested-scroll-header>头部</nested-scroll-header>
  <nested-scroll-body>内容</nested-scroll-body>
</scroll-view>
```

### text 是唯一内联文本组件

Skyline 中 `view` 不支持 inline 布局，内联文本只能用 `text` 组件。可通过 `span` 组件实现 text / image 混排。

### navigator 嵌套限制

`navigator` 只能嵌套 `text` 组件或文本节点。如需与 image 内联，可通过 `span` 组件。

```html
<!-- 正确 -->
<navigator url="/page/detail">
  <text>链接文字</text>
</navigator>

<!-- 内联混排 -->
<span>
  <text>文字</text>
  <navigator url="/page/detail"><text>链接</text></navigator>
  <image src="icon.png" style="width:16px;height:16px;" />
</span>
```

### share-element 使用方式差异

`share-element` 在 Skyline 下使用方式与 WebView 有异，且特性有所增强。使用前需查阅微信官方文档确认 Skyline 下的用法。

### rich-text 渲染差异

`rich-text` 在 Skyline 下渲染结果可能略为不同（涉及样式支持度差异）。若需完全对齐 WebView 表现，可设置 `mode=web`。

### 自定义组件样式隔离

Skyline 下自定义组件的样式隔离机制与 WebView 存在差异：

- **tag / id 选择器**：不支持跨自定义组件匹配。
- **class 选择器**：遵循[组件样式隔离机制](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html#%E7%BB%84%E4%BB%B6%E6%A0%B7%E5%BC%8F%E9%9A%94%E7%A6%BB)。
- **宽高 100%**：Skyline 下设置了 `defaultDisplayBlock` 后，组件宽高 `100%` 可能失效，需手动设置宽高。
- **根节点**：不支持 inline 布局，组件节点独占一行，需手动兼容或设置。

可通过 `rendererOptions.skyline.tagNameStyleIsolation` 配置选择 `legacy`（对齐 WebView，tag 选择器不受样式隔离约束）或 `isolated`（遵循样式隔离机制）。详见 [配置参考](./skyline-configuration.md#rendereroptions-配置项)。

### 组件根节点行为

Skyline 下自定义组件根节点有以下默认行为，可能与 WebView 表现不同：

- 默认 `block` 布局 + `relative` 定位
- `position: relative` 会改变定位基准
- 根节点不支持 inline 布局

若根节点表现异常，可加 `skyline-root` 类进行兼容处理。详见 [适配最佳实践 · 组件适配](./skyline-migration-practice.md#组件适配)。

### glass-easel 组件框架差异

Skyline 使用 `glass-easel` 作为组件框架，与 WebView 下的旧组件框架存在关键行为差异：

| 差异项 | WebView（旧框架） | glass-easel | 适配方式 |
| --- | --- | --- | --- |
| properties 默认值 | `default` / `value` 均可 | **仅 `value` 生效** | 所有 properties 统一使用 `value` |
| properties 类型校验 | 宽松 | 严格，类型不匹配报错 | 使用 `type: null` 跳过校验或 `initData` 提供正确类型 |
| initData 机制 | 无 | 新增，用于声明初始化数据 | wx:for 绑定 computed 属性时需提供 initData 默认值 |
| 异步组件样式时序 | 正常 | 可能乱序 | 测试异步加载组件样式 |
| attached 时序 | 渲染后触发 | 可能渲染前触发 | 依赖 DOM 信息的逻辑移至 `ready` |

详细的适配示例见 [适配最佳实践 · glass-easel 适配注意](./skyline-migration-practice.md#glass-easel-适配注意)。

### 特定组件踩坑

#### image 组件

- **max-width 行为异常**：设置 `max-width` 后实际渲染宽度可能不符合预期，建议使用明确的 `width` 值
- **不支持 border/padding**：在 image 上直接设置 `border` 或 `padding` 会导致图片尺寸计算异常，需要边框或内边距效果时用 view 包裹

#### picker-view 组件

- **双列同时滚动**：Skyline 下双列同时滚动时可能出现索引错乱，日期选择器切换日期后索引可能越界
- `indicator-class` / `mask-style` 属性暂未支持

#### swiper 组件

- **单项无限循环**：Skyline 下单项无限循环可能表现异常
- **swiper-item 自定义宽度**：直接设置 `swiper-item` 宽度可能不生效，建议通过内部节点控制

#### map 组件

- **getScale API**：`map.getScale()` 在 Skyline 下可能无响应，需通过 `bindregionchange` 事件获取缩放级别
- **Android 高度动态变化**：高度动态变化时可能出现渲染异常，建议固定高度或通过 `wx:if` 重新创建
- **iOS backdrop-filter**：iOS 上 `backdrop-filter: blur()` 应用在 map 组件上不生效

#### input / textarea 组件

- **键盘收起/恢复**：Skyline 下键盘收起和恢复行为与 WebView 有差异，可能导致页面布局跳动

#### scroll-view 组件

- **scrollOffset 节点限制**：`scrollOffset` 相关字段（`scrollLeft` / `scrollTop`）仅在 `scroll-view` 和 `viewport` 节点上生效
