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

---

## 通用特性

| 特性 | 支持情况 |
| --- | --- |
| 无障碍访问 | 暂只支持 `aria-role` / `label` / `hidden` / `disabled` |
| DarkMode | 支持 |
| 原生组件 | 均支持同层渲染 |
| WeUI v2 | 支持 |

## 组件支持详情

| 组件 | 支持情况 | 差异备注/替代方案                                                                        |
| --- | --- |----------------------------------------------------------------------------------|
| text | 基本支持 | 内联文本只能用 text 组件；可通过 span 组件与 text / image 内联                                     |
| view / cover-view | 完全支持 | 涉及文本节点见 text 组件                                                                  |
| image / cover-image | 基本支持 | SVG 支持度已完善；部分低频 mode 未支持；                     |
| button | 完全支持 |                                                                                  |
| scroll-view | 完全支持 | **需显式指定 `type="list"`**；部分属性无需对齐；额外支持大量新特性                                       |
| swiper / swiper-item | 完全支持 | 增强大量特性；单项无限循环可能异常；                                                               |
| input / textarea | 完全支持 | 光标选区、菜单略有不同；键盘收起/恢复行为与 WebView 有差异，可能导致布局跳动                                      |
| navigator | 完全支持 | 只能嵌套 text 组件或文本节点；可通过 span 组件与 text/image 内联                                     |
| map | 完全支持 | 开发者工具暂未支持调试，请使用真机预览； |
| canvas | 完全支持 | 开发者工具暂未支持调试，请使用真机预览                                                              |
| radio / radio-group | 完全支持 |                                                                                  |
| label | 完全支持 |                                                                                  |
| video | 基本支持 | 全屏已支持，投屏暂未支持，开发者工具暂未支持调试                                                         |
| checkbox / checkbox-group | 完全支持 |                                                                                  |
| picker | 完全支持 |                                                                                  |
| camera | 完全支持 | 开发者工具暂未支持调试                                                                      |
| root-portal | 完全支持 |                                                                                  |
| form | 完全支持 |                                                                                  |
| ad | 完全支持 |                                                                                  |
| official-account | 完全支持 |                                                                                  |
| live-player / live-pusher | 完全支持 |                                                                                  |
| picker-view | 基本支持 | `indicator-style` 仅支持 `height`、`border`、`background-color`， `indicator-class` / `mask-style` 属性暂未支持； |
| voip-room | 完全支持 |                                                                                  |
| rich-text | 完全支持 | 渲染结果可能略为不同；`mode=web` 时则完全对齐 webview                                             |
| match-media | 待考虑 | 用 `wx.createMediaQueryObserver()` 监听媒体条件,或 `getWindowInfo()` 取屏幕尺寸配合条件渲染实现响应式布局  |
| keyboard-accessory | 待考虑 | 可通过 input 的 `worklet:onkeyboardheightchange` 回调实现                                |
| page-meta | 基本支持 | 与全局滚动相关的属性不支持                                                                    |
| editor | 暂不考虑 | 纯文本编辑用 `textarea`;富文本编辑场景将承载页面单独配置 `"renderer": "webview"`,或用 `rich-text` 只读展示   |
| web-view | 暂不考虑 | 承载 web-view 的页面单独配置 `"renderer": "webview"`                                      |
| movable-area / movable-view | 暂不考虑 | 必须用手势组件 + worklet 动画方案替代                                                         |
| page-container | 基本支持 |                                                                                  |
| share-element | 完全支持 | 与 WebView 使用方式有异，特性有所增强                                                          |
| icon | 完全支持 |                                                                                  |
| progress | 暂不考虑 | 用 `view` 嵌套(外层底色 + 内层动态 `width` 百分比)自行实现进度条,动画进度可配合 worklet 驱动                   |
| slider | 完全支持 |                                                                                  |
| switch | 完全支持 |                                                                                  |
| xr-frame | 暂未支持 | 将承载 3D/XR 内容的页面单独配置 `"renderer": "webview"`;或用 `canvas`(WebGL)自行渲染               |
| navigation-bar | 不考虑 | Skyline 只能用自定义导航                                                                 |
| open-data | 完全支持 | 已废弃特性不支持                                                                         |

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
| scroll-into-view | string | — | 滚动到指定子节点 id（id 不能以数字开头） |
| scroll-into-view-offset | number | 0 | 跳转到 scroll-into-view 目标时的额外偏移（Skyline 3.1.0+，WebView 3.6.0+） |
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
| scroll-into-view-alignment | string | start | scroll-into-view 对齐方式：start / center / end / nearest |
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
| bind:refresherwillrefresh | 即将触发刷新（拖动超过阈值） | — |
| bind:refresherstatuschange | 下拉刷新状态变化 | status, dy |

#### 下拉刷新与下拉二级

自定义下拉刷新区域必须声明 `slot="refresher"`。下拉二级（二楼）是下拉刷新的扩展，需同时开启 `refresher-enabled` 和 `refresher-two-level-enabled`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| refresher-two-level-enabled | boolean | false | 开启下拉二级能力 |
| refresher-two-level-triggered | boolean | false | 打开/关闭二级 |
| refresher-two-level-threshold | number | 150 | 下拉二级阈值 |
| refresher-two-level-close-threshold | number | 80 | 滑动返回时关闭二级的阈值 |
| refresher-two-level-scroll-enabled | boolean | false | 二级状态时是否可滑动 |
| refresher-two-level-pinned | boolean | false | 即将打开二级时是否定住 |
| refresher-ballistic-refresh-enabled | boolean | false | 惯性滚动是否触发下拉刷新 |

`bind:refresherstatuschange` 的 `detail.status` 为 `RefreshStatus` 枚举：`Idle(0)` / `CanRefresh(1)` / `Refreshing(2)` / `Completed(3)` / `Failed(4)` / `CanTwoLevel(5)` / `TwoLevelOpening(6)` / `TwoLeveling(7)` / `TwoLevelClosing(8)`。

**ScrollViewContext 程序化控制**（需 `enhanced="true"`，通过 `createSelectorQuery().node()` 获取）：`triggerRefresh()` / `closeRefresh()` / `triggerTwoLevel()` / `closeTwoLevel()`，以及设置 `scrollEnabled = false` 程序化禁用滚动。

> 注意事项
>
> - Skyline 下**必须**显式设置 `type`（list / custom / nested），否则性能退化为 WebView 模式
> - list 模式下列表项必须是 scroll-view 的直接子节点；若只有一个直接子节点，按需渲染退化
> - nested 模式下，内层 scroll-view 需设置 `associative-container="nested-scroll-view"`
> - `scroll-into-view` 优先级高于 `scroll-top`
> - 在 scroll-view 内滚动会阻止页面回弹，无法触发页面级 `onPullDownRefresh`
> - 滚动条长度为预估值，直接子节点高度差异较大时可能不准确

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
| next-margin | string | 0px | 后边距，露出后一项（Skyline 3.5.1+ 支持） |
| easing-function | string | default | 切换缓动函数 |
| scroll-with-animation | boolean | true | 改变 current 时使用动画 |

#### Skyline 特有属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| layout-type | string | normal | 布局形态：normal / stackLeft / stackRight / tinder / transformer |
| transformer-type | string | scaleAndFade | layout-type=transformer 时的变换效果：scaleAndFade / accordion / threeD / zoomIn / zoomOut / deepthPage |
| indicator-type | string | normal | 指示器样式：normal / worm / wormThin / wormUnderground / wormThinUnderground / expand / jump / jumpWithOffset / scroll / scrollFixedCenter / slide / slideUnderground / scale / swap / swapYRotation / color |
| indicator-margin | number | 10 | 指示器外边距 |
| indicator-spacing | number | 4 | 指示器间距 |
| indicator-radius | number | 4 | 指示点圆角 |
| indicator-width | number | 8 | 指示点宽度 |
| indicator-height | number | 8 | 指示点高度 |
| indicator-alignment | string/Array | auto | 指示器对齐方式。auto：横滑居底中、纵滑居中右；数组 [x, y] 取值范围 [-1, 1]（底边中点为 [0, 1]） |
| indicator-offset | Array | [0,0] | 指示器偏移量 [x, y]（px） |
| cache-extent | number | 0 | 预渲染区域大小，值为 1 表示提前渲染上下各一屏 |
| direction | string | all | 可滑动方向：all / positive / negative（3.8.10+） |
| worklet:onscrollstart | worklet | — | 滑动开始回调（UI 线程） |
| worklet:onscrollupdate | worklet | — | 滑动过程回调（UI 线程） |
| worklet:onscrollend | worklet | — | 滑动结束回调（UI 线程） |

#### 事件

| 事件名 | 说明 | detail |
| --- | --- | --- |
| bindchange | 当前滑块变化 | current（索引）, source（autoplay / touch / ""） |

> 注意事项
>
> - Skyline 下单项循环（circular + 仅一项）可能表现异常
> - swiper-item 自定义宽度建议通过内部子节点控制，直接设置可能不生效
> - layout-type 为 stackLeft / stackRight / tinder 时，仅支持 indicator-type=normal
> - indicator-type 为 scrollFixedCenter / swap / swapYRotation 时，不支持 circular
> - Skyline 的 `previous-margin`、`display-multiple-items`、`vertical` 与 WebView 表现略有不同
> - 当 `next-margin > 0` 时，Skyline 会将上述属性（`previous-margin` / `display-multiple-items` / `vertical`）对齐 WebView 实现
> - swiper 自身无禁用拖拽属性；如需屏蔽用户拖拽，外层套 `horizontal-drag-gesture-handler` + `native-view="swiper"`，并在 `worklet:should-accept-gesture` 返回 false

---

### view

最基础的容器组件，Skyline 下布局能力与 WebView 基本一致，但有若干差异。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| hover-class | string | none | 点击时附加的样式类 |
| hover-start-time | number | 50 | 按下后出现 hover 的等待时间（ms） |
| hover-stay-time | number | 400 | 松开后 hover 保留时间（ms） |

#### Skyline 特有文本截断属性

`view` 可直接承载文本超长打点能力，无需仅为省略效果额外包一层 `text`。

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| overflow | string | visible | 文本溢出处理：visible / clip / fade / ellipsis |
| max-lines | number | — | 最大显示行数 |

> 注意事项
>
> - z-index 不支持 Web 标准的层叠上下文，只在同层级节点间有效
> - 不支持 inline 布局（display: inline / inline-block）
> - 块级文本省略可在 `view` 上直接使用 `max-lines` / `overflow`；内联文本、文本嵌套、可选中文本仍优先使用 `text`

---

### text

文本组件，Skyline 下扩展了溢出处理和行数限制能力。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| user-select | boolean | false | 是否可选中文本（设置后节点显示变为 inline-block） |

#### Skyline 特有属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| overflow | string | visible | 文本溢出处理：visible / clip / fade / ellipsis |
| max-lines | number | — | 最大显示行数 |

#### WebView 特有属性

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| space | string | 连续空格处理方式：ensp / emsp / nbsp |
| decode | boolean | 是否解码 HTML 实体，可识别 `&nbsp;` `&lt;` `&gt;` `&amp;` `&apos;` `&ensp;` `&emsp;` |

> 注意事项
>
> - Skyline 中内联文本只能用 `text` 组件，`view` 不支持 inline 布局
> - `text` 内只能嵌套 `text`，不能嵌套其他类型组件
> - 块级文本超长打点也可直接在 `view` 上使用 `max-lines` / `overflow`
> - 图文混排使用 Skyline 专属的 `span` 组件；WebView 下用 `display: flex` 的 view 替代
> - `space`、`decode` 属性仅 WebView 支持，Skyline 忽略
> - 仅文本节点可长按选中，其他节点无法选中

---

### image

图片组件，Skyline 下默认开启懒加载，并新增渐显效果。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | string | — | 图片资源地址（支持网络地址、本地路径及云文件 ID） |
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
| webp | boolean | 是否解析 WebP 格式（默认 false） |
| lazy-load | boolean | 是否懒加载，进入三屏内才加载（默认 false；Skyline 默认懒加载无需设置） |
| forceHttps | boolean | 是否强制使用 HTTPS（默认 false） |

> 注意事项
>
> - 默认尺寸为 320 × 240 px，必须显式指定宽高
> - Skyline 默认懒加载，WebView 需手动设置 `lazy-load`
> - top / bottom / center 等裁剪 mode 仅 WebView 支持，需在运行时判断渲染器后兼容
> - SVG 不支持百分比单位和 `<style>` 元素；`mode=scaleToFill` 时 WebView 居中（除非加 `preserveAspectRatio="none"`），Skyline 撑满
> - 缩放后宽高可能含小数，不同内核渲染时可能抹去小数

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
| type | string | text | 键盘类型：text / number / idcard / digit / nickname（nickname 需 2.21.2+） |
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
| cursor-color | string | — | 光标颜色（Skyline 下无限制，支持任意颜色值） |
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

> 注意事项
>
> - input / textarea 是原生组件，字体固定为系统字体，无法设置 font-family
> - 自定义组件中的 input 需使用 `wx://form-field` behavior 才能被外层 form 组件获取值
> - 聚焦期间避免使用 CSS 动画，可能导致光标/选区异常
> - 键盘高度变化事件可能多次触发，应忽略相同高度值以避免重复布局
> - `placeholder-class`、`safe-password-*`（安全键盘）等属性仅 WebView 生效

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

> 注意事项
>
> - 同 input，字体固定为系统字体，无法设置 font-family

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

> 注意事项
>
> - Skyline 下 navigator 内只能嵌套 `text` 组件或纯文本节点，不能嵌套 image 或 view

---

## Skyline 新增组件

### span

Skyline 专属内联容器，用于实现 text、image 的图文混排。

> 注意事项
>
> - Skyline 专属，WebView 不识别此组件
> - Mpx 中通过 `mpxTagName@wx="span"` 条件渲染；WebView 下用 `display: flex` 的 view 替代
> - 内部可嵌套 text、image

---

### snapshot

截图组件，可将组件内容渲染为图片，Skyline 专属。

#### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| mode | string | view | view：与普通 view 无差别，样式变化实时体现；picture：对子节点截图为纹理，后续样式变化不反映到界面，适合 scale/rotate 动画优化（3.1.0+） |

**takeSnapshot 方法**（通过 `createSelectorQuery` 获取节点后调用）：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | string | file | 输出类型：file / arraybuffer |
| format | string | png | 图片格式：png / jpg |
| quality | number | 1.0 | 压缩质量（0~1，仅 jpg 有效） |

另含 `success` / `fail` 回调；返回值：data（文件路径或 ArrayBuffer）、width、height。

> 注意事项
>
> - Skyline 专属
> - 截图前需确保组件内图片已加载完成，否则结果可能缺图
> - 大尺寸截图耗时较长，建议显示加载态
> - 需隐藏截图源区域时，用 `position: fixed; left: -9999px;` 移出屏幕而非 display:none

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

> 注意事项
>
> - 必须在 `scroll-view type="custom"` 中使用
> - sticky-header 必须是 sticky-section 的第一个子节点
> - 每个 sticky-section 只能有一个 sticky-header
> - sticky-header 背景必须显式设置，否则会透出下层内容
> - 建议为 sticky-header 显式设置 `z-index`（如 10），确保吸顶时位于上层

---

### nested-scroll-header / nested-scroll-body

嵌套滚动布局组件，实现外层 `scroll-view type="nested"` 与内层 scroll-view 的无缝联动。

#### nested-scroll-body 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| offset-top | number | 0 | 外层滚动时此组件逐渐撑开，直到顶部与视窗顶部距离达到该值才切换为内层滚动（3.6.2+） |

> 注意事项
>
> - nested-scroll-header 和 nested-scroll-body 均只渲染第一个子节点，其余子节点不渲染
> - 一个 `type="nested"` 的 scroll-view 只能包含一个 nested-scroll-body
> - 可以有多个 nested-scroll-header，每个只包裹一个元素
> - nested-scroll-header 只能渲染在 nested-scroll-body 上方，禁止放在其下方
> - 内层 scroll-view 需设置 `associative-container="nested-scroll-view"`
> - 下拉刷新的 `slot="refresher"` 与 header / body 平级
> - 联动策略：向下滚动先滚外层再滚内层；向上滚动先滚内层再滚外层

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
| type | string | aligned | 网格类型：aligned（每行高度由该行最高子节点决定）/ masonry（瀑布流，可不等高） |
| cross-axis-count | number | 2 | 交叉轴（列）数量 |
| cross-axis-gap | number | 0 | 列间距（px） |
| main-axis-gap | number | 0 | 行间距（px） |
| padding | Array | [0,0,0,0] | 内边距 [top, right, bottom, left]（px），3.0.0+ |
| max-cross-axis-extent | number | 0 | 交叉轴方向单元格最大尺寸 |

> 注意事项
>
> - 必须作为 `scroll-view type="custom"` 或 `sticky-section` 的直接子节点
> - grid-view 基础库 2.29.0 起支持，2.30.4 起提供 WebView 兼容实现；WebView 下 masonry 子元素需有可见宽高
> - Skyline 专属

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

#### grid-builder 属性

在 list-builder 基础上增加网格布局参数（用法与不定高列表类似）：

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | string | aligned | 网格类型：aligned / masonry |
| cross-axis-count | number | — | 交叉轴（列）数量 |
| cross-axis-gap | number | 0 | 列间距（px） |
| main-axis-gap | number | 0 | 行间距（px） |
| max-cross-axis-extent | number | 0 | 交叉轴单元格最大尺寸 |
| padding | Array | [0,0,0,0] | 内边距 [top, right, bottom, left]（px） |

#### 事件

| 事件名 | 说明 | detail |
| --- | --- | --- |
| bind:itembuild | 列表项被创建 | index |
| bind:itemdispose | 列表项被回收 | index |

列表项通过具名插槽 `slot:item slot:index` 渲染，例如 `<view slot:item slot:index>{{index}}</view>`。

> 注意事项
>
> - 必须在 `scroll-view type="custom"` 中使用
> - 目前仅支持纵向滚动列表
> - 不定高（dynamic）模式因无法预知未创建项高度，存在滚动条跳动问题
> - 不支持 `scroll-into-view`
> - grid-builder 已知 Bug：列表项进屏后再滚出屏幕会被判定为需重新布局，进而自动滚回顶部
> - Skyline 专属

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

> 注意事项
>
> - Skyline 专属
> - 内部 scroll-view 必须设置 `associative-container="draggable-sheet"`
> - 所有尺寸属性均为相对父容器高度的比例（0~1），非像素值
> - 联动策略：向上拖先展开面板到最大，再滚动内部内容；向下拖先将内容滚到顶，再收起面板
> - snap-sizes 与 min/max 合并后取最近吸附点（如 min 0.2、max 0.9、snap-sizes [0.3,0.5,0.7] → 吸附点 [0.2,0.3,0.5,0.7,0.9]）

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
| rect-tween-type | string | materialRectArc | 动画轨迹：materialRectArc / materialRectCenterArc / linear / elasticIn / elasticOut / elasticInOut / bounceIn / bounceOut / bounceInOut，或自定义 `cubic-bezier(x1,y1,x2,y2)` |
| worklet:onframe | worklet | — | 动画帧回调（UI 线程），参数含 progress（0~1） |

> 注意事项
>
> - 源页面和目标页面的 key 必须完全匹配，两端均需设置 `transform="{{true}}"` 才触发动画
> - 共享元素内容不宜过于复杂，否则影响动画性能
> - 源与目标元素内容不同时，动画会在两者之间过渡
> - 手势返回动画、worklet 帧回调、飞跃物选择（shuttle-on-push/pop）均为 Skyline 增强，WebView 不支持
> - 可配合 `page-container` 实现同页模态转场，用 `transform="{{currentId === item.id}}"` 条件触发

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

**手势状态**（回调参数 `evt.state`，常量挂在 `GestureState` 命名空间，如 `evt.state === GestureState.ACTIVE`）：

| 值 | 常量名 | 含义 |
| --- | --- | --- |
| 0 | POSSIBLE | 待识别 |
| 1 | BEGIN | 手势开始 |
| 2 | ACTIVE | 手势进行中 |
| 3 | END | 手势结束 |
| 4 | CANCELLED | 手势取消 |

**额外回调参数**：

- pan / horizontal-drag / vertical-drag：absoluteX/Y（屏幕坐标）、deltaX/Y（相对上次位移）、velocityX/Y（px/s，手指离开时）
- long-press：translationX/Y（相对初始触摸点偏移）
- scale：scale（累计缩放比）、rotation（弧度）、focalX/Y（缩放中心）、focalDeltaX/Y（中心点相对上次移动）、pointerCount
- force-press：pressure（0~1 压力值）

#### 手势协商

- `native-view` 仅支持 `scroll-view` 和 `swiper` 两个值
- `simultaneous-handlers` 需双向声明：两个手势各自把对方的 tag 写入列表，声明后两者回调都会触发
- `worklet:should-accept-gesture` 在手势开始时仅调用一次；`worklet:should-response-on-move` 每次手指移动都调用（避免在其中做复杂计算）
- 默认嵌套行为：内层手势优先，内层激活后外层失效

> 注意事项
>
> - Skyline 专属，WebView 下使用 bind:touchstart / touchmove / touchend + WXS 替代
> - 回调函数必须在函数体顶部声明 `'worklet'` 指令
> - 每个手势组件只能有一个直接子节点
> - 必须处理 CANCELLED 状态，避免状态残留
> - 手势不冒泡（与普通 touch 事件不同）
> - 需使用最新 Nightly 工具调试

手势协商（多手势并存）见 [手势系统参考](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/gesture.html)。
