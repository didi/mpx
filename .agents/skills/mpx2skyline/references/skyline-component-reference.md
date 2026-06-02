# Skyline 基础组件支持与差异参考

## 目录

- [通用特性](#通用特性)
- [组件支持详情](#组件支持详情)
- [高频组件用法](#高频组件用法)
  - [scroll-view](#scroll-view)
  - [swiper](#swiper)
  - [view](#view)
  - [text](#text)
  - [image](#image)
  - [button](#button)
  - [input](#input)
  - [textarea](#textarea)
  - [navigator](#navigator)
- [Skyline 新增组件](#skyline-新增组件)
  - [span](#span)
  - [snapshot](#snapshot)
  - [sticky-header / sticky-section](#sticky-header--sticky-section)
  - [nested-scroll-header / nested-scroll-body](#nested-scroll-header--nested-scroll-body)
  - [list-view / grid-view](#list-view--grid-view)
  - [list-builder / grid-builder](#list-builder--grid-builder)
  - [draggable-sheet](#draggable-sheet)
  - [share-element](#share-element)
  - [手势组件族](#手势组件族)
- [组件使用注意事项](#组件使用注意事项)
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

## 高频组件用法

### scroll-view

可滚动视图区域，Skyline 下必须通过 `type` 属性声明滚动模式，否则性能会退化。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| scroll-x | boolean | false | 允许横向滚动 |
| scroll-y | boolean | false | 允许纵向滚动 |
| scroll-top | number/string | — | 设置竖向滚动条位置 |
| scroll-left | number/string | — | 设置横向滚动条位置 |
| scroll-into-view | string | — | 滚动到指定子节点 id |
| scroll-with-animation | boolean | false | 滚动时使用动画 |
| upper-threshold | number | 50 | 距顶部/左侧多远时触发 scrolltoupper |
| lower-threshold | number | 50 | 距底部/右侧多远时触发 scrolltolower |
| refresher-enabled | boolean | false | 开启自定义下拉刷新 |
| refresher-threshold | number | 45 | 下拉刷新触发阈值 |
| refresher-default-style | string | black | 刷新器默认样式（black/white/none） |
| refresher-background | string | #FFF | 刷新器背景色 |
| refresher-triggered | boolean | false | 刷新状态（true 为已触发） |

#### Skyline 特有属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | string | — | **必填**，滚动模式：list / custom / nested |
| cache-extent | number | — | 视口外预渲染距离（px） |
| reverse | boolean | false | 反向滚动 |
| clip | boolean | true | 是否裁剪溢出内容 |
| min-drag-distance | number | 18 | 触发滚动的最小拖动距离（px） |
| padding | Array | [0,0,0,0] | 内边距 [top, right, bottom, left]（px） |
| scroll-into-view-alignment | string | — | scroll-into-view 对齐方式：start / center / end / nearest |
| scroll-into-view-within-extent | boolean | false | 目标在预渲染区内时是否仍触发滚动 |
| associative-container | string | — | 关联的外层容器：draggable-sheet / nested-scroll-view / pop-gesture |
| worklet:onscrollstart | worklet | — | 滚动开始回调（UI 线程） |
| worklet:onscrollupdate | worklet | — | 滚动过程回调（UI 线程） |
| worklet:onscrollend | worklet | — | 滚动结束回调（UI 线程） |
| worklet:adjust-deceleration-velocity | worklet | — | 调整惯性滚动初速度 |

#### 事件

| 事件名 | 说明 | detail |
| --- | --- | --- |
| bindscrolltoupper | 滚动到顶部/左侧 | — |
| bindscrolltolower | 滚动到底部/右侧 | — |
| bindscroll | 滚动时持续触发 | scrollLeft, scrollTop, scrollHeight, scrollWidth, deltaX, deltaY |
| bindrefresherrefresh | 下拉刷新触发 | — |
| bindrefresherpulling | 下拉过程 | — |
| bindrefresherrestore | 刷新复位 | — |
| bindrefresherabort | 下拉中止 | — |

#### 注意事项

- Skyline 下**必须**显式设置 `type`（list / custom / nested），否则性能退化为 WebView 模式
- 横向滚动（scroll-x）需同时设置 `enable-flex`，否则子节点不会横向排列
- list 模式下列表项必须是 scroll-view 的直接子节点；若只有一个直接子节点，按需渲染退化
- nested 模式下，内层 scroll-view 需设置 `associative-container="nested-scroll-view"`

---

### swiper

滑块视图容器，Skyline 下支持多种布局形态和指示器样式。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| indicator-dots | boolean | false | 是否显示面板指示点 |
| indicator-color | string | rgba(0,0,0,.3) | 指示点颜色 |
| indicator-active-color | string | #000 | 当前指示点颜色 |
| autoplay | boolean | false | 自动切换 |
| current | number | 0 | 当前所在滑块索引 |
| interval | number | 5000 | 自动切换时间间隔（ms） |
| duration | number | 500 | 滑动动画时长（ms） |
| circular | boolean | false | 衔接滑动（循环） |
| vertical | boolean | false | 竖向滑动 |
| display-multiple-items | number | 1 | 同时显示的滑块数量 |
| previous-margin | string | 0px | 前边距，露出前一项 |
| next-margin | string | 0px | 后边距，露出后一项 |
| easing-function | string | default | 切换缓动函数 |
| scroll-with-animation | boolean | false | 改变 current 时使用动画 |

#### Skyline 特有属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| layout-type | string | normal | 布局形态：normal / stackLeft / stackRight / tinder / transformer |
| transformer-type | string | scaleAndFade | layout-type=transformer 时的变换效果：scaleAndFade / accordion / threeD / zoomIn / zoomOut / deepthPage |
| indicator-type | string | normal | 指示器样式：normal / worm / wormThin / expand / jump / scroll / slide / scale / swap 等 |
| indicator-margin | number | 10 | 指示器外边距 |
| indicator-spacing | number | 4 | 指示器间距 |
| indicator-radius | number | 4 | 指示点圆角 |
| indicator-width | number | 8 | 指示点宽度 |
| indicator-height | number | 8 | 指示点高度 |
| indicator-alignment | string | auto | 指示器对齐方式 |
| indicator-offset | Array | [0,0] | 指示器偏移量 [x, y] |
| cache-extent | number | 1 | 预渲染区域（1 表示上下各一屏） |
| direction | string | all | 可滑动方向：all / positive / negative（3.8.10+） |
| worklet:onscrollstart | worklet | — | 滑动开始回调（UI 线程） |
| worklet:onscrollupdate | worklet | — | 滑动过程回调（UI 线程） |
| worklet:onscrollend | worklet | — | 滑动结束回调（UI 线程） |

#### 事件

| 事件名 | 说明 | detail |
| --- | --- | --- |
| bindchange | 当前滑块变化 | current（索引）, source（autoplay / touch / ""） |

#### 注意事项

- Skyline 下单项循环（circular + 仅一项）可能表现异常
- swiper-item 自定义宽度建议通过内部子节点控制，直接设置可能不生效
- layout-type 为 stackLeft / stackRight / tinder 时，仅支持 indicator-type=normal
- indicator-type 为 scrollFixedCenter / swap / swapYRotation 时，不支持 circular

---

### view

最基础的容器组件，Skyline 下布局能力与 WebView 基本一致，但有若干差异。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| hover-class | string | none | 点击时附加的样式类 |
| hover-start-time | number | 50 | 按下后出现 hover 的等待时间（ms） |
| hover-stay-time | number | 400 | 松开后 hover 保留时间（ms） |

#### 注意事项

- z-index 仅在兄弟节点间生效，不支持跨层叠上下文
- 不支持 inline 布局（display: inline / inline-block）

---

### text

文本组件，Skyline 下扩展了溢出处理和行数限制能力。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| user-select | boolean | false | 是否可选中文本 |

#### Skyline 特有属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| overflow | string | visible | 文本溢出处理：visible / clip / fade / ellipsis |
| max-lines | number | — | 最大显示行数 |

#### WebView 特有属性

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| space | string | 连续空格处理方式：ensp / emsp / nbsp |
| decode | boolean | 是否解码 HTML 实体（&amp; &lt; 等） |

#### 注意事项

- Skyline 中内联文本只能用 `text` 组件，`view` 不支持 inline 布局
- `text` 内只能嵌套 `text`，不能嵌套其他类型组件
- 图文混排使用 Skyline 专属的 `span` 组件；WebView 下用 `display: flex` 的 view 替代
- `space`、`decode` 属性仅 WebView 支持，Skyline 忽略

---

### image

图片组件，Skyline 下默认开启懒加载，并新增渐显效果。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string | — | 图片资源地址 |
| mode | string | scaleToFill | 裁剪/缩放模式（见下表） |
| show-menu-by-longpress | boolean | false | 长按显示菜单 |
| binderror | eventhandler | — | 加载失败回调 |
| bindload | eventhandler | — | 加载成功回调，detail: { width, height } |

**通用 mode 值**（两端均支持）：scaleToFill / aspectFit / aspectFill / widthFix / heightFix

**WebView-only mode 值**：top / bottom / center / left / right / top left / top right / bottom left / bottom right

#### Skyline 特有属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| fade-in | boolean | false | 图片加载完成后是否渐显 |

#### WebView 特有属性

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| webp | boolean | 是否解析 WebP 格式 |
| lazy-load | boolean | 是否懒加载（Skyline 默认懒加载，无需设置） |
| forceHttps | boolean | 是否强制使用 HTTPS |

#### 注意事项

- 默认尺寸为 320 × 240 px，必须显式指定宽高
- 在 image 上直接设置 border / padding 会导致尺寸计算异常，建议用外层 view 包裹
- Skyline 默认懒加载，WebView 需手动设置 `lazy-load`
- top / bottom / center 等裁剪 mode 仅 WebView 支持，需在运行时判断渲染器后兼容

---

### button

按钮组件，Skyline 下与 WebView 行为一致，无差异。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| size | string | default | 大小：default / mini |
| type | string | default | 样式类型：default / primary / warn |
| plain | boolean | false | 是否镂空 |
| disabled | boolean | false | 是否禁用 |
| loading | boolean | false | 是否显示 loading 状态 |
| form-type | string | — | 触发 form 的 submit / reset |
| open-type | string | — | 微信开放能力 |

---

### input

单行输入框，原生组件，字体固定为系统字体。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string | — | 输入内容 |
| type | string | text | 键盘类型：text / number / idcard / digit / nickname |
| password | boolean | false | 是否密码类型 |
| placeholder | string | — | 占位文本 |
| placeholder-style | string | — | 占位文本样式 |
| disabled | boolean | false | 是否禁用 |
| maxlength | number | 140 | 最大输入长度，-1 为不限制 |
| cursor-spacing | number | 0 | 光标与键盘的距离（px） |
| focus | boolean | false | 是否自动聚焦 |
| confirm-type | string | done | 键盘右下角按钮文字：send / search / next / go / done |
| confirm-hold | boolean | false | 点击确认时是否保持键盘 |
| cursor | number | — | 指定光标位置 |
| cursor-color | string | — | 光标颜色 |
| selection-start | number | -1 | 选区起始位置，-1 为不设置 |
| selection-end | number | -1 | 选区结束位置 |
| adjust-position | boolean | true | 键盘弹起时是否上推页面 |
| hold-keyboard | boolean | false | focus 时是否不收起键盘 |

#### Skyline 特有属性

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| bind:selectionchange | eventhandler | 选区改变，detail: { selectionStart, selectionEnd } |
| bind:keyboardcompositionstart | eventhandler | 输入法组合开始 |
| bind:keyboardcompositionupdate | eventhandler | 输入法组合更新 |
| bind:keyboardcompositionend | eventhandler | 输入法组合结束 |
| worklet:onkeyboardheightchange | worklet | 键盘高度变化（UI 线程），detail: { height, pageBottomPadding } |

#### 事件

| 事件名 | 说明 | detail |
| --- | --- | --- |
| bindinput | 输入时触发 | value, cursor, keyCode |
| bindchange | 失焦时触发 | value |
| bindfocus | 聚焦时触发 | value, height |
| bindblur | 失焦时触发 | value |
| bindconfirm | 点击确认时触发 | value |
| bindkeyboardheightchange | 键盘高度变化 | height, duration |

#### 注意事项

- input / textarea 是原生组件，字体固定为系统字体，无法设置 font-family
- Skyline 下键盘收起/恢复行为与 WebView 有差异，可能引起布局跳动
- 自定义组件中的 input 需使用 `wx://form-field` behavior 才能被外层 form 组件获取值

---

### textarea

多行输入框，属性基本与 input 一致，以下列出特有属性。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| auto-height | boolean | false | 是否自动增高 |
| fixed | boolean | false | 在 position:fixed 区域内时是否固定（WebView 兼容用） |
| show-confirm-bar | boolean | true | 是否显示键盘上方的完成工具栏 |

> 其余通用属性（value、placeholder、disabled、maxlength、cursor-spacing、focus 等）与 input 相同。

#### 注意事项

- 同 input，字体固定为系统字体，无法设置 font-family

---

### navigator

页面链接组件，Skyline 下内容嵌套有限制。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| url | string | — | 跳转页面路径 |
| open-type | string | navigate | 跳转方式：navigate / redirect / switchTab / reLaunch / navigateBack / exit |
| delta | number | 1 | navigateBack 时回退层数 |
| hover-class | string | navigator-hover | 点击时附加的样式类 |
| hover-start-time | number | 50 | 按下后出现 hover 的等待时间（ms） |
| hover-stay-time | number | 600 | 松开后 hover 保留时间（ms） |

#### 注意事项

- Skyline 下 navigator 内只能嵌套 `text` 组件或纯文本节点，不能嵌套 image 或 view
- 如需图文混排链接，Skyline 下使用 `span` 包裹；WebView 下用外层 flex view 替代

---

## Skyline 新增组件

### span

Skyline 专属内联容器，用于实现 text、image、navigator 的图文混排。

#### 注意事项

- Skyline 专属，WebView 不识别此组件
- Mpx 中通过 `mpxTagName@wx="span"` 条件渲染；WebView 下用 `display: flex` 的 view 替代
- 内部可嵌套 text、image、navigator

---

### snapshot

截图组件，可将组件内容渲染为图片，Skyline 专属。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| mode | string | view | view：与普通 view 无差别，样式变化实时体现；picture：对子节点截图为纹理，后续样式变化不反映到界面，适合 scale/rotate 动画优化 |

**takeSnapshot 方法**（通过 `createSelectorQuery` 获取节点后调用）：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| type | string | 输出类型：file / arraybuffer |
| format | string | 图片格式：png / jpg |
| quality | number | 压缩质量（0~1，仅 jpg 有效） |

返回值：data（文件路径或 ArrayBuffer）、width、height。

#### 注意事项

- Skyline 专属

---

### sticky-header / sticky-section

吸顶布局组件，实现分组列表的吸顶效果，必须在 `scroll-view type="custom"` 中使用。

#### sticky-section 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| push-pinned-header | boolean | true | 新 header 吸顶时是否推动之前已吸顶的 header |

#### sticky-header 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| padding | Array | [0,0,0,0] | 内边距 [top, right, bottom, left] |
| offset-top | number | 0 | 吸顶时与视窗顶部的距离（px），3.0.0+ |
| allow-overlapping | boolean | false | 是否允许与前一个 sticky-header 重叠，3.7.11+ |

#### 事件

| 事件名 | 说明 | detail |
| --- | --- | --- |
| bind:stickontopchange | 吸顶状态变化，3.6.2+ | isStickOnTop |

#### 注意事项

- 必须在 `scroll-view type="custom"` 中使用
- sticky-header 必须是 sticky-section 的第一个子节点
- 每个 sticky-section 只能有一个 sticky-header
- sticky-header 背景必须显式设置，否则会透出下层内容

---

### nested-scroll-header / nested-scroll-body

嵌套滚动布局组件，实现外层 `scroll-view type="nested"` 与内层 scroll-view 的无缝联动。

#### nested-scroll-body 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| offset-top | number | 0 | 外层滚动时此组件逐渐撑开，直到顶部与视窗顶部距离达到该值才切换为内层滚动（3.6.2+） |

#### 注意事项

- nested-scroll-header 和 nested-scroll-body 均只渲染第一个子节点，其余子节点不渲染
- 一个 `type="nested"` 的 scroll-view 只能包含一个 nested-scroll-body
- 可以有多个 nested-scroll-header，每个只包裹一个元素
- 内层 scroll-view 需设置 `associative-container="nested-scroll-view"`

---

### list-view / grid-view

列表/网格布局容器，必须作为 `scroll-view type="custom"` 或 `sticky-section` 的直接子节点，Skyline 专属。

#### list-view 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| padding | Array | [0,0,0,0] | 内边距 [top, right, bottom, left]（px） |

#### grid-view 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | string | aligned | 网格类型：aligned（等高网格）/ masonry（瀑布流，可不等高） |
| cross-axis-count | number | — | 列数（必填） |
| cross-axis-gap | number | 0 | 列间距（px） |
| main-axis-gap | number | 0 | 行间距（px） |
| padding | Array | [0,0,0,0] | 内边距 [top, right, bottom, left]（px） |
| max-cross-axis-extent | number | — | 交叉轴方向单元格最大尺寸 |

#### 注意事项

- 必须作为 `scroll-view type="custom"` 或 `sticky-section` 的直接子节点
- Skyline 专属

---

### list-builder / grid-builder

虚拟列表/网格组件，仅渲染视口内元素，适合超长列表（1000+ 项），Skyline 专属。

#### list-builder 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | string | static | 高度模式：static（定高）/ dynamic（不定高） |
| list | Array | — | 数据列表 |
| child-count | number | — | 列表项数量 |
| child-height | number | — | 列表项高度（定高模式必填，px） |
| padding | Array | [0,0,0,0] | 内边距 [top, right, bottom, left]（px） |
| initial-child-count | number | 0 | 首次渲染数量（3.7.12+） |

#### 事件

| 事件名 | 说明 | detail |
| --- | --- | --- |
| bind:itembuild | 列表项被创建 | index |
| bind:itemdispose | 列表项被回收 | index |

#### 注意事项

- 必须在 `scroll-view type="custom"` 中使用
- 目前仅支持纵向滚动列表
- grid-builder 存在已知 Bug：滚动出屏幕后返回可能自动滚回顶部
- Skyline 专属

---

### draggable-sheet

半屏可拖拽面板，实现从底部弹出的半屏交互（类似地图 App 底部面板），Skyline 专属。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| initial-child-size | number | 0.5 | 初始高度比例（相对父容器，0~1） |
| min-child-size | number | 0.25 | 最小高度比例 |
| max-child-size | number | 1.0 | 最大高度比例 |
| snap | boolean | false | 松手后是否自动吸附到关键点 |
| snap-sizes | Array | [] | 吸附关键点列表（不含 min/max，会自动包含） |
| worklet:onsizeupdate | worklet | — | UI 线程尺寸变化回调，参数 { pixels, size } |

**DraggableSheetContext.scrollTo 参数**（通过 `createSelectorQuery` 获取节点后调用）：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| size | number | 目标高度比例（0~1） |
| animated | boolean | 是否启用动画 |
| duration | number | 动画时长（ms） |
| easingFunction | string | 缓动函数：ease / ease-in / ease-out / ease-in-out / linear |

#### 注意事项

- Skyline 专属
- 内部 scroll-view 必须设置 `associative-container="draggable-sheet"`
- 所有尺寸属性均为相对父容器高度的比例（0~1），非像素值

---

### share-element

共享元素动画组件，实现页面间元素过渡动画（类似 Flutter Hero），双端支持，Skyline 下能力增强。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| key | string | — | **必填**，页面内唯一标识，源页面与目标页面必须相同 |
| transform | boolean | false | 是否启用动画（两端均需设置为 true） |
| duration | number | 300 | 动画时长（ms） |
| easing-function | string | ease-out | 缓动函数 |

#### Skyline 特有属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| transition-on-gesture | boolean | false | 手势返回时触发动画 |
| shuttle-on-push | string | to | push 阶段飞跃物：from / to |
| shuttle-on-pop | string | to | pop 阶段飞跃物：from / to |
| rect-tween-type | string | materialRectArc | 动画轨迹：materialRectArc / materialRectCenterArc / linear / elasticIn / elasticOut 等 |
| worklet:onframe | worklet | — | 动画帧回调（UI 线程），参数含 progress（0~1） |

#### 注意事项

- 源页面和目标页面的 key 必须完全匹配，两端均需设置 `transform="{{true}}"` 才触发动画
- 共享元素内容不宜过于复杂，否则影响动画性能

---

### 手势组件族

Skyline 专属，在 UI 线程直接响应手势，避免跨线程延迟。手势组件是"虚组件"，不参与布局，**只能有一个直接子节点**。

**组件列表**：

| 组件 | 触发条件 | 典型用途 |
| --- | --- | --- |
| tap-gesture-handler | 点击 | 按钮点击 |
| double-tap-gesture-handler | 双击 | 点赞、图片放大 |
| long-press-gesture-handler | 长按 | 菜单弹出 |
| pan-gesture-handler | 拖动（横向/纵向） | 拖拽排序 |
| horizontal-drag-gesture-handler | 横向滑动 | 左滑删除 |
| vertical-drag-gesture-handler | 纵向滑动 | 下拉刷新 |
| scale-gesture-handler | 多指缩放 | 图片缩放 |
| force-press-gesture-handler | iPhone 重按 | 3D Touch |

#### 通用属性

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| tag | string | 手势协商标识 |
| worklet:ongesture | worklet | 手势回调（必须为 worklet 函数） |
| simultaneous-handlers | Array\<string\> | 可同时触发的手势 tag 列表 |
| worklet:should-response-on-move | worklet | 移动过程中是否响应 |
| worklet:should-accept-gesture | worklet | 手势是否应被识别 |
| native-view | string | 代理的原生节点类型（如 scroll-view） |

**手势状态**（回调参数 `evt.state`）：

| 值 | 常量名 | 含义 |
| --- | --- | --- |
| 0 | POSSIBLE | 待识别 |
| 1 | BEGIN | 手势开始 |
| 2 | ACTIVE | 手势进行中 |
| 3 | END | 手势结束 |
| 4 | CANCELLED | 手势取消 |

**pan / horizontal-drag / vertical-drag 额外回调参数**：absoluteX/Y（屏幕坐标）、deltaX/Y（相对上次位移）、velocityX/Y（px/s，手指离开时）

**scale 额外回调参数**：scale（累计缩放比）、rotation（弧度）、focalX/Y（缩放中心）、pointerCount

#### 注意事项

- Skyline 专属，WebView 下使用 bind:touchstart / touchmove / touchend + WXS 替代
- 回调函数必须在函数体顶部声明 `'worklet'` 指令
- 每个手势组件只能有一个直接子节点
- 必须处理 CANCELLED 状态，避免状态残留

手势协商（多手势并存）见 [skyline-worklet-animation.md](./skyline-worklet-animation.md#手势协商)。

## 组件使用注意事项

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

Todo 待补充

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
