# 组件使用与开发

本节提供 Mpx RN 环境下的组件支持说明，详细列出了支持的基础组件及其可用属性、方法，以及自定义组件的相关配置。

### 目录概览

- #### 基础组件
**容器组件**：[view](#view) · [scroll-view](#scroll-view) · [swiper](#swiper) · [swiper-item](#swiper-item) · [movable-area](#movable-area) · [movable-view](#movable-view) · [root-portal](#root-portal) · [sticky-section](#sticky-section) · [sticky-header](#sticky-header) · [cover-view](#cover-view)

**媒体组件**：[image](#image) · [video](#video) · [canvas](#canvas)

**表单组件**：[input](#input) · [textarea](#textarea) · [button](#button) · [checkbox](#checkbox) · [checkbox-group](#checkbox-group) · [radio](#radio) · [radio-group](#radio-group) · [switch](#switch) · [picker](#picker) · [picker-view](#picker-view) · [picker-view-column](#picker-view-column) · [form](#form) · [label](#label)

**基础组件**：[text](#text) · [icon](#icon) · [progress](#progress) · [navigator](#navigator) · [rich-text](#rich-text) · [cover-image](#cover-image)

**其他组件**：[web-view](#web-view)

- #### 自定义组件
[组件属性配置](#组件属性配置) · [生命周期钩子](#生命周期钩子) · [实例属性和方法](#实例属性和方法)

### 使用原则

> **⚠️ 重要说明**
>
> - **支持范围**：仅支持文档中明确列出的组件和属性
> - **平台特性**：某些属性和功能仅在 RN 环境下可用
> - **性能考量**：按需开启高级功能，避免不必要的性能开销

## 基础组件
目前 Mpx 输出 React Native 仅支持以下组件，文档中未提及的组件以及组件属性即为不支持，具体使用范围可参考如下文档

### 基础组件通用属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| enable-offset		  | boolean  |     `false`    | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|
| enable-var	  | boolean  |     `true`    | 默认支持使用 css variable，若想关闭该功能可设置为 false |
| parent-font-size		  | number |         | 父组件字体大小，主要用于百分比计算的场景，如 font-size: 100%|
| parent-width		  | number  |         | 父组件宽度，主要用于百分比计算的场景，如 width: calc(100% - 20px)，需要在外部传递父组件的宽度|
| parent-height		  | number  |         | 父组件高度，主要用于百分比计算的场景，如 height: calc(100% - 20px),需要在外部传递父组件的高度|

以上基础组件的通用属性仅在 React Native 环境中支持。在跨平台输出到小程序或 Web 时，这些属性将无法使用。

由于 view、text、scroll-view、image 和 input 组件都是基于 React Native 原生组件实现的，因此这些组件默认继承原生组件支持的属性。

### view
视图容器。
属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| hover-class	             | string  |         | 指定按下去的样式类。 |
| hover-start-time   | number  |     `50`    | 按住后多久出现点击态，单位毫秒|
| hover-stay-time	  | number  |     `400`    | 手指松开后点击态保留时间，单位毫秒	 |
| animation | object  |   | 传递动画的实例， 可配合mpx.createAnimation方法一起使用|
| enable-background		  | boolean  |     `false `   |  RN环境特有属性，是否要开启background-image、background-size和background-postion的相关计算或渲染，请根据实际情况开启 |
| enable-animation | boolean  | `false`  | RN环境特有属性，开启要开启动画渲染，请根据实际情况开启 |
| enable-fast-image | boolean  | `false`  | RN环境特有属性，开启后将使用 react-native-fast-image 进行图片渲染，请根据实际情况开启 |
| is-simple | -  | -  | RN环境特有标记，设置后将使用简单版本的 view 组件渲染，该组件不包含 css var、calc、ref 等拓展功能，但性能更优，请根据实际情况设置 |

注意事项

1. 未使用背景图、动图或动画，请不要开启`enable-background`、`enable-animation`或`enable-fast-image`属性，会有一定的性能消耗。
2. 若开启`enable-background`需要给当前 view 组件设置一个唯一 key。

### text
文本。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| user-select             | boolean  | `false`       | 文本是否可选。 |
| is-simple | -  | -  | RN环境特有标记，设置后将使用简单版本的 text 组件渲染，该组件不包含 css var、calc、ref 等拓展功能，但性能更优，请根据实际情况设置 |



注意事项

1. 未包裹 text 标签的文本，会自动包裹 text 标签。
2. text 组件开启 enable-offset 后，offsetLeft、offsetWidth 获取时机仅为组件首次渲染阶段

### scroll-view
可滚动视图区域。

属性

| 属性名                   | 类型     | 默认值     | 说明                                               |
| ----------------------- | ------- | --------- | -------------------------------------------------- |
| scroll-x                | boolean | `false`   | 允许横向滚动动 |
| scroll-y                | boolean | `false`   | 允许纵向滚动  |
| upper-threshold         | number  | `50`      | 距顶部/左边多远时(单位 px),触发 scrolltoupper 事件      |
| lower-threshold         | number  | `50`      | 距底部/右边多远时(单位 px),触发 scrolltolower 事件      |
| scroll-top              | number  | `0`       | 设置纵向滚动条位置                                    |
| scroll-left             | number  | `0`       | 设置横向滚动条位置                                    |
| scroll-with-animation   | boolean | `false`   | 在设置滚动条位置时使用动画过渡                          |
| enable-back-to-top      | boolean | `false`   | 点击状态栏的时候视图会滚动到顶部，仅 iOS环境支持                      |
| enhanced                | boolean | `false`   | scroll-view 组件功能增强                             |
| refresher-enabled       | boolean | `false`   | 开启自定义下拉刷新                                    |
| scroll-anchoring        | boolean | `false`   | 开启滚动区域滚动锚点                                   |
| scroll-into-view	        | boolean | `false` | 值应为某子元素id（id不能以数字开头）    |  
| scroll-into-view-offset	        | number | `0` | 跳转到 scroll-into-view 目标节点时的额外偏移                       |
| refresher-default-style | string  | `'black'` | 设置下拉刷新默认样式,支持 `black`、`white`、`none`，仅安卓支持 |
| refresher-background    | string  | `'#fff'`  | 设置自定义下拉刷新背景颜色，仅安卓支持                         |
| refresher-triggered     | boolean | `false`   | 设置当前下拉刷新状态,true 表示已触发               |
| paging-enabled          | number  | `false`   | 分页滑动效果 (同时开启 enhanced 属性后生效)，当值为 true 时，滚动条会停在滚动视图的尺寸的整数倍位置  |
| show-scrollbar          | number  | `true`   | 滚动条显隐控制 (同时开启 enhanced 属性后生效)|
| enable-trigger-intersection-observer  |  boolean   |  `false`    | RN环境特有属性，是否开启intersection-observer |
| simultaneous-handlers  | array\<object>  |    `[]`    | RN环境特有属性，主要用于组件嵌套场景，允许多个手势同时识别和处理并触发，这个属性可以指定一个或多个手势处理器，处理器支持使用 this.$refs.xxx 获取组件实例来作为数组参数传递给 scroll-view 组件 |
| wait-for  |  array\<object>  |  `[]`    | RN环境特有属性，主要用于组件嵌套场景，允许延迟激活处理某些手势，这个属性可以指定一个或多个手势处理器，处理器支持使用 this.$refs.xxx 获取组件实例来作为数组参数传递给 scroll-view 组件 |
| scroll-event-throttle  |  number   |  `0`   | RN环境特有属性，控制 scroll 事件触发频率 |
| enable-sticky  |  boolean   |  `false`   | RN环境特有属性，当使用 sticky 组件时，需要手动将此属性设置为 true |

事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| binddragstart| 滑动开始事件，同时开启 enhanced 属性后生效|
| binddragging| 滑动事件，同时开启 enhanced 属性后生效 |
| binddragend| 滑动结束事件，同时开启 enhanced 属性后生效 |
| bindscrolltoupper   | 滚动到顶部/左边触发 |
| bindscrolltolower   | 滚动到底部/右边触发 |
| bindscroll          | 滚动时触发         |
| bindrefresherrefresh| 自定义下拉刷新被触发 |

注意事项

1. 若使用 scroll-into-view 属性，需要 id 对应的组件节点添加 wx:ref 标记，否则无法正常滚动。另外组件节点需要是内置基础组件，自定义组件暂不支持。
2. simultaneous-handlers 为 RN 环境特有属性，具体含义可参考[react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/#simultaneouswithexternalgesture)
3. wait-for  为 RN 环境特有属性，具体含义可参考[react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/#requireexternalgesturetofail)
4. scroll-view 组件在滚动过程中，不会触发其自身或子组件的 touchend 事件响应，这是 RN 底层实现导致的问题，手势系统识别当前是 scroll-view 的滚动，就会取消掉 touchend 事件的响应。


### swiper
滑块视图容器。

属性

| 属性名                   | 类型     | 默认值              | 说明                                 |
| ----------------------- | ------- | ------------------  | ------------------------------------|
| indicator-dots          | boolean | `false`             | 是否显示面板指示点                     |
| indicator-color         | color   | `rgba(0, 0, 0, .3)` | 指示点颜色                            |
| indicator-active-color  | color   | `#000000`           | 当前选中的指示点颜色                   |
| autoplay                | boolean | `false`             | 是否自动切换                          |
| current                 | number  | `0`                 | 当前所在滑块的 index                  |
| interval                | number  | `5000`              | 自动切换时间间隔                       |
| duration                | number  | `500`               | 滑动动画时长                          |
| circular                | boolean | `false`             | 是否采用衔接滑动                       |
| vertical                | boolean | `false`             | 滑动方向是否为纵向                      |
| previous-margin         | string  | `0`                 | 前边距，可用于露出前一项的一小部分，接受px |
| next-margin             | string  | `0`                 | 后边距，可用于露出后一项的一小部分，接受px |
| scale                   | boolean  | `false`            | 滑动时是否开启前后元素缩小,默认是缩放0.7倍, 暂不支持自定义 |
| easing-function         | string  | `linear`      | 支持 linear、easeInCubic、easeOutCubic、easeInOutCubic|
| simultaneous-handlers              | array\<object>|   `[]`          | RN环境特有属性，主要用于组件嵌套场景，允许多个手势同时识别和处理并触发，这个属性可以指定一个或多个手势处理器，处理器支持使用 this.$refs.xxx 获取组件实例来作为数组参数传递给 swiper 组件|
| wait-for              | array\<object>|   `[]`          | RN环境特有属性，主要用于组件嵌套场景，允许延迟激活处理某些手势，这个属性可以指定一个或多个手势处理器，处理器支持使用 this.$refs.xxx 获取组件实例来作为数组参数传递给 swiper 组件|
| disableGesture              | boolean|   `false`       |  RN 环境特有属性，禁用 swiper 滑动手势。若开启用户无法通过手势滑动 swiper，只能通过开启 autoPlay 进行自动轮播|




事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange| current 改变时会触发 change 事件，`event.detail = {current, source}`|

### swiper-item
仅可放置在swiper组件中，宽高自动设置为100%。

属性

| 属性名                   | 类型     | 默认值              | 说明                                 |
| ----------------------- | ------- | ------------------  | ------------------------------------|
| item-id                 | string  |             | 该 swiper-item 的标识符                  |

### movable-area
movable-view的可移动区域。

### movable-view
可移动的视图容器，在页面中可以拖拽滑动。movable-view 必须在 movable-area 组件中，并且必须是直接子节点，否则不能移动。


属性

| 属性名 | 类型             | 默认值 | 说明                                                                                                  |
| ------ | ---------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| direction   | string           |   `none`     | 目前支持 all、vertical、horizontal、none  |
| inertia   | boolean          |   `false`     | movable-view是否带有惯性  |
| out-of-bounds   | boolean          |   `false`     | 超过可移动区域后，movable-view是否还可以移动  |
| x   | number |      | 定义x轴方向的偏移  |
| y  | number  |        | 定义y轴方向的偏移 |
| disabled  | boolean  |    `false`   | 是否禁用 |
| animation  | boolean  |    `true`   | 是否使用动画	 |
| simultaneous-handlers  | array\<object>  |   `[]`   | RN 环境特有属性，主要用于组件嵌套场景，允许多个手势同时识别和处理并触发，这个属性可以指定一个或多个手势处理器，处理器支持使用 this.$refs.xxx 获取组件实例来作为数组参数传递给 movable-view 组件 |
| wait-for  |  array\<object>  |  `[]`    |  RN 环境特有属性，主要用于组件嵌套场景，允许延迟激活处理某些手势，这个属性可以指定一个或多个手势处理器，处理器支持使用 this.$refs.xxx 获取组件实例来作为数组参数传递给 movable-view 组件 |
| disable-event-passthrough | boolean  |  `false`   | RN 环境特有属性，有时候我们希望movable-view 在水平方向滑动，并且竖直方向的手势也希望被 movable-view 组件消费掉，不被其他组件响应，可以将这个属性设置为true） |

事件

| 事件名               | 说明                                       |
| -------------------- | ------------------------------------------ |
| bindchange        | 拖动过程中触发的事件，`event.detail = {x, y, source}` |
| htouchmove          | 初次手指触摸后移动为横向的移动时触发 |
| vtouchmove    | 初次手指触摸后移动为纵向的移动时触发                      |


注意事项

1. simultaneous-handlers 为 RN 环境特有属性，具体含义可参考[react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/#simultaneouswithexternalgesture)
2. wait-for  为 RN 环境特有属性，具体含义可参考[react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/#requireexternalgesturetofail)
3. RN 环境 movable 相关组件暂不支持缩放能力

### image
图片。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| src                     | string  | `false`       | 图片资源地址及 base64 格式数据 |
| mode                    | string  | `scaleToFill` | 图片裁剪、缩放的模式，可选值为 `scaleToFill`、`aspectFit`、`aspectFill`、`widthFix`、`heightFix`、`top`、`bottom`、`center`、`left`、`right`、`top left`、`top right`、`bottom left`、`bottom right`             |
| enable-fast-image          | boolean  | `false`   | RN环境特有属性，开启后将使用 react-native-fast-image 进行图片渲染，请根据实际情况开启 |

事件

| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| binderror       | 当错误发生时触发，`event.detail = { errMsg }`            |
| bindload        | 当图片载入完毕时触发，`event.detail = { height, width }`  |

注意事项

1. image 组件默认宽度320px、高度240px
2. image 组件进行缩放时，计算出来的宽高可能带有小数，在不同 webview 内核下渲染可能会被抹去小数部分

### icon
图标组件


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| type      | string  |               | icon 的类型，有效值：success、success_no_circle、info、warn、waiting、cancel、download、search、clear |
| size      | string\|number  |     `23`    | icon 的大小 |
| color		  | string  |         | icon 的颜色，同 css 的 color |


### button
按钮。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                      |
| ----------------------- | ------- | ------------- | --------------------------------------------------------- |
| size                    | string  | `default`     | 按钮的大小，`default`：默认大小，`mini`：小尺寸                                                  |
| type                    | string  | `default`     | 按钮的样式类型，`primary`：绿色，`default`：白色，`warn`：红色                                               |
| plain                   | boolean | `false`       | 按钮是否镂空，背景色透明                                       |
| disabled                | boolean | `false`       | 是否禁用                                                    |
| loading                 | boolean | `false`       | 名称前是否带 loading 图标                                     |
| open-type               | string  |               | 微信开放能力，当前仅支持 `share` 和 `getUserInfo`                              |
| hover-class             | string  |               | 指定按钮按下去的样式类。当 hover-class="none" 时，没有点击态效果  |
| hover-start-time        | number  |  `20`         | 按住后多久出现点击态，单位毫秒                                  |
| hover-stay-time         | number  |  `70`         | 手指松开后点击态保留时间，单位毫秒                               |

注意事项
1. openType 需要在 `mpx.config.rnConfig` 中注册对应能力如 ` onShareAppMessage`，`onUserInfo` 来配合使用。
   
### label
用来改进表单组件的可用性


注意事项

1. 当前不支持使用 for 属性找到对应 id，仅支持将控件放在该标签内，目前可以绑定的空间有：checkbox、radio、switch。

### checkbox
多选项目


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value	    | string   |              | checkbox 标识，选中时触发 checkbox-group 的 change 事件，并携带 checkbox 的 value |
| disabled  | boolean  |     `false`    | 是否禁用 |
| checked	  | boolean  |     `false`    | 当前是否选中，可用来设置默认选中 |
| color		  | string   |     `#09BB07` | checkbox的颜色，同css的color |


### checkbox-group
多项选择器，内部由多个checkbox组成。


事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange      | checkbox-group 中选中项发生改变时触发 change 事件，`detail = { value: [ 选中的 checkbox 的 value 的数组 ] } `|


### radio
单选项目


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value	    | string  |               | radio 标识，当该 radio 选中时，radio-group 的 change 事件会携带 radio 的 value |
| disabled  | boolean  |     false    | 是否禁用 |
| checked	  | boolean  |     false    | 当前是否选中，可用来设置默认选中 |
| color		  | string   |     #09BB07  | checkbox 的颜色，同 css 的 color |


### radio-group
单项选择器，内部由多个 radio 组成


事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange      | radio-group 中选中项发生改变时触发 change 事件，`detail = { value: [ 选中的 radio 的 value 的数组 ] }` |


### form
表单。

当点击 form 表单中 form-type 为 submit 的 button 组件时，会将表单组件中的 value 值进行提交，需要在表单组件中加上 name 来作为 key。

事件

| 事件名     | 说明                                                |
| ---------- | --------------------------------------------------- |
| bindsubmit | 携带 form 中的数据触发 submit 事件，`event.detail = {value : {'name': 'value'} }` |
| bindreset  | 表单重置时会触发 reset 事件 |


### input
输入框。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value                   | string  |               | 输入框的初始内容                                              |
| type                    | string  | `text`        | input 的类型，可选值为 `text`、`number`、`idcard`、`digit`，不支持 `safe-password`、`nickname`              |
| password                | boolean | `false`       | 是否是密码类型                                               |
| placeholder             | string  |               | 输入框为空时占位符                                            |
| placeholder-class       | string  |               | 指定 placeholder 的样式类，仅支持 color 属性                   |
| placeholder-style       | string  |               | 指定 placeholder 的样式，仅支持 color 属性                    |
| disabled                | boolean | `false`       | 是否禁用                                                    |
| maxlength               | number  | `140`         | 最大输入长度，设置为 -1 的时候不限制最大长度                     |
| auto-focus              | boolean | `false`       | (即将废弃，请直接使用 focus )自动聚焦，拉起键盘                  |
| focus                   | boolean | `false`       | 获取焦点                                                    |
| confirm-type            | string  | `done`        | 设置键盘右下角按钮的文字，仅在 type='text' 时生效，可选值为 `send`、`search`、`next`、`go`、`done`              |
| confirm-hold            | boolean | `false`       | 点击键盘右下角按钮时是否保持键盘不收起                           |
| cursor                  | number  |               | 指定 focus 时的光标位置                                      |
| cursor-color            | string  |               | 光标颜色                                                    |
| selection-start         | number  | `-1`          | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用         |
| selection-end           | number  | `-1`          | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用       |

事件

| 事件名                | 说明                                                                               |
| ---------------------| ---------------------------------------------------------------------------------- |
| bindinput            | 键盘输入时触发，`event.detail = { value, cursor }`，不支持 `keyCode`                     |
| bindfocus            | 输入框聚焦时触发，`event.detail = { value }`，不支持 `height`                            |
| bindblur             | 输入框失去焦点时触发，`event.detail = { value }`，不支持 `encryptedValue`、`encryptError` |
| bindconfirm          | 点击完成按钮时触发，`event.detail = { value }`                                         |
| bind:selectionchange | 选区改变事件, `event.detail = { selectionStart, selectionEnd }`                      |


### textarea
多行输入框。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value                   | string  |               | 输入框内容                                                   |
| type                    | string  | `text`        | input 的类型，不支持 `safe-password`、`nickname`              |
| placeholder             | string  |               | 输入框为空时占位符                                            |
| placeholder-class       | string  |               | 指定 placeholder 的样式类，仅支持 color 属性                   |
| placeholder-style       | string  |               | 指定 placeholder 的样式，仅支持 color 属性                    |
| disabled                | boolean | `false`       | 是否禁用                                                    |
| maxlength               | number  | `140`         | 最大输入长度，设置为 -1 的时候不限制最大长度                     |
| auto-focus              | boolean | `false`       | (即将废弃，请直接使用 focus )自动聚焦，拉起键盘                  |
| focus                   | boolean | `false`       | 获取焦点                                                    |
| auto-height             | boolean | `false`       | 是否自动增高，设置 auto-height 时，style.height不生效          |
| confirm-type            | string  | `done`        | 设置键盘右下角按钮的文字，可选值为 `send`、`search`、`next`、`go`、`done`，不支持 `return`                       |
| confirm-hold            | boolean | `false`       | 点击键盘右下角按钮时是否保持键盘不收起                           |
| cursor                  | number  |               | 指定 focus 时的光标位置                                      |
| cursor-color            | string  |               | 光标颜色                                                    |
| selection-start         | number  | `-1`          | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用         |
| selection-end           | number  | `-1`          | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用       |

事件

| 事件名                | 说明                                                                               |
| ---------------------| ---------------------------------------------------------------------------------- |
| bindinput            | 键盘输入时触发，`event.detail = { value, cursor }`，不支持 `keyCode`                     |
| bindfocus            | 输入框聚焦时触发，`event.detail = { value }`，不支持 `height`                            |
| bindblur             | 输入框失去焦点时触发，`event.detail = { value }`，不支持 `encryptedValue`、`encryptError` |
| bindconfirm          | 点击完成按钮时触发，`event.detail = { value }`                                          |
| bindlinechange       | 输入框行数变化时调用，`event.detail = { height: 0, lineCount: 0 }`，不支持 `heightRpx`    |
| bind:selectionchange | 选区改变事件, `event.detail = {selectionStart, selectionEnd}`                                         |

### progress
进度条。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| percent                 | number  | `0`           | 百分比进度，范围0-100                                         |
| stroke-width            | number\|string | `6`   | 进度条线的宽度，单位px                                        |
| color                   | string  |               | 进度条颜色（已废弃，请使用 activeColor）                        |
| activeColor             | string  | `#09BB07`     | 已选择的进度条的颜色                                           |
| backgroundColor         | string  | `#EBEBEB`     | 未选择的进度条的颜色                                           |
| active                  | boolean | `false`       | 进度条从左往右的动画                                           |
| active-mode             | string  | `backwards`   | 动画播放模式，`backwards`: 从头开始播放；`forwards`: 从上次结束点接着播放 |
| duration                | number  | `30`          | 进度增加1%所需毫秒数                                          |

事件

| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| bindactiveend   | 动画完成时触发，`event.detail = { percent }`            |

注意事项

1. 不支持 `show-info` 属性，即不支持在进度条右侧显示百分比
2. 不支持 `border-radius` 属性自定义圆角大小
3. 不支持 `font-size` 属性设置右侧百分比字体大小

### picker-view

嵌入页面的滚动选择器。其中只可放置 [picker-view-column](#picker-view-column) 组件，其它节点不会显示

  属性

| 属性名                   | 类型              | 默认值              | 说明                                 |
| ----------------------- | ------------------| ------------------ | ------------------------------------|
| value                   | array\<number\>   | `[]`           | 数组中的数字依次表示 picker-view 内的 [picker-view-column](#picker-view-column) 选择的第几项（下标从 0 开始），数字大于 [picker-view-column](#picker-view-column) 可选项长度时，选择最后一项。|
| indicator-style         | string          |                | 设置选择器中间选中框的样式 |
| indicator-class         | string          |                | 设置选择器中间选中框的类名 |
| mask-style              | string          |                | 设置蒙层的样式           |
| mask-class              | string          |                | 设置蒙层的类名           |

事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange      | 滚动选择时触发 change 事件，`event.detail = {value}`，其中 `value` 为数组，表示 picker-view 内的 [picker-view-column](#picker-view-column) 当前选择的是第几项（下标从 0 开始） |

触感反馈回调方法

通过在全局注册 `mpx.config.rnConfig.onPickerVibrate` 方法，在每次滚动选择时会调用该方法。

| 注册触感方法名           | 类型          | 说明                |
| ----------------------| --------------| ------------------- |
| onPickerVibrate         | Function      | 注册自定义触感反馈方法。调用时机：在每次滚动选择时会调用该方法。可以在方法内自定义实现类似 iOS 端原生表盘的振动触感。    |

### picker-view-column

滚动选择器子项。仅可放置于 [picker-view](#picker-view) 中，其孩子节点的高度会自动设置成与 [picker-view](#picker-view) 的选中框的高度一致

### picker

从底部弹起的滚动选择器。

属性

| 属性名                  | 类型         | 默认值             | 说明                          |
| -----------------------| ------------| ------------------ | -----------------------------|
| mode                   | string      | `selector`         | 选择器类型，目前支持 `selector`、 `multiSelector`、 `time`、 `date`、  `region`   |
| disabled               | boolean     | `false`            | 是否禁用                       |

公共事件

| 事件名           | 说明                                                 |
| ----------------| ----------------------------------------------------|
| bindcancel      | 取消选择时触发                                         |
| bindchange      | value 改变时触发 change 事件，`event.detail = {value}` |

#### 普通选择器：mode = selector

属性

| 属性名                  | 类型                     | 默认值         | 说明                           |
| -----------------------| ------------------------| ------------- | -----------------------------|
| range                  | array[object]/array     | `[]`          | mode 为 selector 或 multiSelector 时，range 有效 |
| range-key              | string                  | `false`       | 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器显示内容 |
| value                  | number                  | 0             | 表示选择了 range 中的第几个（下标从 0 开始）|

#### 多列选择器：mode = multiSelector
属性与事件

| 属性名                  | 类型                     | 默认值         | 说明                           |
| -----------------------| ------------------------| ------------- | -----------------------------|
| range                  | array[object]/array     | `[]`          | mode 为 selector 或 multiSelector 时，range 有效 |
| range-key              | string                  | `false`       | 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器显示内容 |
| value                  | array                   | `[]`          | 表示选择了 range 中的第几个（下标从 0 开始）|
| bindcolumnchange       |        function                 |               | 列改变时触发|

#### 多列选择器：时间选择器：mode = time
属性

| 属性名                  | 类型                     | 默认值         | 说明                           |
| -----------------------| ------------------------| ------------- | -----------------------------|
| value                  | string                  | `[]`          | 表示选中的时间，格式为"hh:mm" |
| start                  | string                  | `false`       | 表示有效时间范围的开始，字符串格式为"hh:mm" |
| end                    | string                   | `[]`         | 表示有效时间范围的结束，字符串格式为"hh:mm"|

#### 多列选择器：时间选择器：mode = date
属性

| 属性名                  | 类型                     | 默认值         | 说明                                      |
| -----------------------| ------------------------| ------------- | ------------------------------------------|
| value                  | string                  | `当天`         | 表示选中的日期，格式为"YYYY-MM-DD"            |
| start                  | string                  | `false`       | 表示有效日期范围的开始，字符串格式为"YYYY-MM-DD" |
| end                    | string                   | `[]`         | 表示有效日期范围的结束，字符串格式为"YYYY-MM-DD" |
| fields                 | string                   | `day`        | 有效值 year,month,day，表示选择器的粒度        |

fields 有效值：
| 属性名                  | 说明                     |
| -----------------------| ------------------------ |
| year                   | 选择器粒度为年             |
| month                  | 选择器粒度为月份           |
| day                   | 选择器粒度为天              |

#### 省市区选择器：mode = region
属性

| 属性名                  | 类型                     | 默认值         | 说明                                      |
| -----------------------| ------------------------| ------------- | ------------------------------------------|
| value                  | array                   | `[]`          | 表示选中的省市区，默认选中每一列的第一个值       |
| custom-item            | string                  |               | 可为每一列的顶部添加一个自定义的项              |
| level                  | string                  | `region`      | 选择器层级                                  |

level 有效值：

| 属性名                  | 说明                     |
| -----------------------| ------------------------ |
| province               | 选省级选择器               |
| city                   | 市级选择器                 |
| region                 | 区级选择器                 |


### switch
开关选择器。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| checked		             | boolean  |   `false`     | 是否选中 |
| disabled   | boolean  |     `false`    | 是否禁用	|
| type	  | string  |     `switch`    | 样式，有效值：switch, checkbox		 |
| color		  | string  |     `#04BE02`    | switch 的颜色，同 css 的 color|


事件

| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| bindchange       |  点击导致 checked 改变时会触发 change 事件，`event.detail = { value }`   |

### navigator
页面链接。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| hover-class	             | string  |    `false`      | 指定按下去的样式类。 |
| hover-start-time   | number  |     `50`    | 按住后多久出现点击态，单位毫秒|
| hover-stay-time	  | number  |     `400`    | 手指松开后点击态保留时间，单位毫秒	 |
| open-type		  | string  |     `navigate`    | 可支持`navigateBack`、`redirect`、`switchTab`、`reLaunch`、`navigateTo`|
| url		  | string  |       |  跳转链接	|


### rich-text
富文本。


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| nodes			             | array\|string  |    []     | 节点列表 |


### canvas
画布。

事件

| 属性名                   | 说明                                                       |
| -----------------------| ---------------------------------------------------------- |
| bindtouchstart	  | 手指触摸动作开始		|
| bindtouchmove	   | 手指触摸后移动		|
| bindtouchend	  | 手指触摸动作结束	|
| bindtouchcancel	  | 手指触摸动作被打断	|
| bindlongpress    | 手指长按 350ms 之后触发	|
| binderror	    | 当发生错误时触发 error 事件， `detail = {errMsg}`	|

API

 方法名                     | 说明  |
| ----------------------- | ------- |
| createImage	     |  创建一个图片对象。 仅支持在 2D Canvas 中使用	|
| createImageData	      | 创建一个 ImageData 对象。仅支持在 2D Canvas 中使用		|
| getContext	      | 该方法返回 Canvas 的绘图上下文。仅支持在 2D Canvas 中使用	|
| toDataURL	      | 返回一个包含图片展示的 data URI	|

注意事项

1. canvas 组件目前仅支持 2D 类型，不支持 webgl
2. 通过 Canvas.getContext('2d') 接口可以获取 CanvasRenderingContext2D 对象，具体接口可以参考 [HTML Canvas 2D Context](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) 定义的属性、方法
3. canvas 的实现主要借助于 PostMessage 方式与 webview 容器通信进行绘制，所以对于严格依赖方法执行时机的场景，如调用 drawImage 绘图，再通过 getImageData 获取图片数据的场景，调用时需要使用 await 等方式来保证方法的执行时机
4. 通过 Canvas.createImage 画图，图片的链接不能有特殊字符，安卓手机可能会 load 失败

### video
视频


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| src	    | string  |               | 要播放视频的资源地址|
| controls	    | boolean  |     `true`         | 是否显示默认播放控件|
| autoplay	    | boolean  |   `false`  | 是否自动播放|
| loop	    | boolean  |       `false`        | 是否循环播放	|
| muted	    | boolean  |        `false`       | 是否静音播放|
| initial-time	    | number  |     `0`          | 指定视频初始播放位置|
| object-fit  | string  |      `contain`         | 当视频大小与 video 容器大小不一致时，视频的表现形式|
| poster	    | string  |               | 视频封面的图片地址|
| enable-auto-rotation	    | boolean  |         `false`      | 是否开启手机横屏时自动全屏，当系统设置开启自动旋转时生效，仅 ios 支持|
| preferred-peak-bit-rate	    | number  |        `0`      | 指定码率上界，单位为比特每秒|


事件

| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| bindplay       |  当开始/继续播放时触发play事件   |
| bindpause       |  当暂停播放时触发 pause 事件	   |
| bindended       |  当播放到末尾时触发 ended 事件   |
| bindtimeupdate       |  播放进度变化时触发，`event.detail = {currentTime, duration}`   |
| bindfullscreenchange       |  视频进入和退出全屏时触发，`event.detail = {fullScreen` }   |
| bindwaiting       |  视频出现缓冲时触发   |
| binderror       |  视频播放出错时触发	   |
| bindloadedmetadata       |  视频元数据加载完成时触发。`event.detail = {width, height, duration}`   |
| bindcontrolstoggle       |  切换 controls 显示隐藏时触发。`event.detail = {show}`	   |
| bindseekcomplete       |  seek 完成时触发    |

注意事项
1. 手动拖拽进度条场景，bindseekcomplete 事件，android 可以触发，ios 不支持
2. video 组件基于第三方库 `react-native-video` 来实现，需要容器中安装此依赖包


### web-view
承载网页的容器。会自动铺满整个 RN 页面


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| src	    | string  |               | webview 指向网页的链接，如果需要对跳转的URL设定白名单可跳转，需要在业务跳转之前处理该逻辑

事件

| 属性名                   | 说明                                                       |
| ---------------------| ---------------------------------------------------------- |
| bindmessage	   |  网页向RN通过 postMessage 传递数据
| bindload	    |  网页加载成功时候触发此事件
| binderror	     |  网页加载失败的时候触发此事件


注意事项

1. 被打开的 H5 页面需使用`@mpxjs/webview-bridge@2.9.68` 及以上版本与 RN 容器进行通信，具体通信方式参见[Webview API](#webview-api)

### root-portal
使整个子树从页面中脱离出来，类似于在 CSS 中使用 position: fixed 的效果。主要用于制作弹窗、弹出层等。
属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| enable   | boolean           |   `true`	     | 是否从页面中脱离出来

注意事项

1. style 样式不支持中使用百分比计算、css variable
   
### sticky-section
吸顶布局容器，仅支持作为 `<scroll-view>` 的直接子节点

注意事项
1. sticky-section 目前仅支持 RN 、web 以及微信小程序环境，其他环境暂不支持。微信小程序中使用需开启 skyline 渲染模式

### sticky-header
吸顶布局容器，仅支持作为 `<scroll-view>` 的直接子节点或 `sticky-section` 组件直接子节点

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| offset-top	    | number  |    `0`      | 吸顶时与顶部的距离 |
| padding	    | array  |     `[0, 0, 0, 0] `         | 长度为 4 的数组，按 top、right、bottom、left 顺序指定内边距 |

事件

| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| bindstickontopchange      |  吸顶状态变化事件, `event.detail = { isStickOnTop }`，当 sticky-header 吸顶时为 true，否则为 false   |

注意事项
1. sticky-header 目前仅支持 RN 、web 以及微信小程序环境，其他环境暂不支持。微信小程序中使用需开启 skyline 渲染模式
2. RN 环境的 sticky-header 更适用于内容稳定，状态不常变更的场景使用，目前如果 sticky 还在动画过程中就触发组件更新（如在bindstickontopchange 回调中立刻更新 state）、scroll-view 内容高度由多变少、通过修改 scroll-into-view、scroll-top 让 scroll-view 滚动，以上场景在安卓上都可能会导致闪烁或抖动

### cover-view
视图容器。
功能同 view 组件

### cover-image
视图容器。
功能同 image 组件


## 自定义组件

Mpx 完全支持自定义组件功能，组件创建、属性配置、生命周期、插槽使用等更多组件开发的详细指南和高级用法，请参考 [自定义组件基础文档](../basic/component.md)。

本节重点介绍在 RN 环境下的特殊注意事项和限制。

### 组件属性配置

| 属性 | 支持状态 | 说明 |
|------|---------|------|
| properties | ✅ 完全支持 | 组件外部属性声明 |
| data | ✅ 完全支持 | 组件内部数据 |
| computed | ✅ 完全支持 | 计算属性 |
| watch | ✅ 完全支持 | 数据监听 |
| observers | ✅ 完全支持 | 数据变化监听器 |
| methods | ✅ 完全支持 | 组件方法定义 |
| mixins | ✅ 完全支持 | 混入选项 |
| externalClasses | ⚠️ 需要配置 | 外部样式类，需配置[构建选项](/api/compile.html#externalclasses) |
| behaviors | ❌ 不支持 | 小程序 behaviors 机制 |
| options | ❌ 不支持 | 组件选项（multipleSlots、virtualHost 等）|
| relations | ❌ 不支持 | 组件关系定义 |

### 生命周期钩子

| 生命周期 | 支持状态 | 说明 |
|---------|---------|------|
| created | ✅ 完全支持 | 组件实例创建 |
| attached | ✅ 完全支持 | 组件挂载到页面 |
| ready | ✅ 完全支持 | 组件布局完成 |
| detached | ✅ 完全支持 | 组件从页面卸载 |
| lifetimes | ✅ 完全支持 | 生命周期声明对象 |
| pageLifetimes | ✅ 完全支持 | 页面生命周期（show、hide、resize）|

### 实例属性和方法

| 功能 | 支持状态 | 说明 |
|------|---------|------|
| id, dataset | ✅ 完全支持 | 节点基础属性 |
| setData | ✅ 完全支持 | 数据更新方法 |
| triggerEvent | ✅ 完全支持 | 事件触发 |
| selectComponent | ✅ 有限制 | 选择子组件，仅支持 id/class 选择器，需配合 `wx:ref` 使用 |
| selectAllComponents | ✅ 有限制 | 选择所有子组件，仅支持 id/class 选择器，需配合 `wx:ref` 使用 |
| $set, $watch, $delete | ✅ 完全支持 | 响应式数据操作 |
| $refs, $forceUpdate, $nextTick | ✅ 完全支持 | 组件实例方法 |
| $rawOptions | ✅ 完全支持 | 原始选项访问 |
| $i18n | ✅ 完全支持 | 国际化访问器 |
| is | ✅ 完全支持 | 动态组件 |
| createSelectorQuery | ❌ 不支持 | 节点查询 |

#### selectComponent / selectAllComponents 使用要点

在 RN 环境下使用 `selectComponent` 或 `selectAllComponents` 时
1. 必须在目标节点上标记 `wx:ref`
2. 选择器支持范围有限，仅支持以下方式
- id 选择器 `#id`
- class 选择器 `.class` 或连续指定 `.a-class.b-class.c-class`

```javascript
<template>
  <!-- 必须添加 wx:ref 标记 -->
  <list wx:ref class="list"></list>
</template>

<script>
    import { createComponent } from '@mpxjs/core'

  createComponent({
    ready() {
      // 获取组件实例
      const instance = this.selectComponent('.list')
      console.log('selectComponent', instance)
    }
  })
</script>
```