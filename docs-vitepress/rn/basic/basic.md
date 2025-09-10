# React Native 跨端基础

Mpx 支持将小程序项目编译到 React Native 平台，让开发者能够使用统一的小程序开发模式来构建原生移动应用。通过 Mpx 的跨端能力，可以实现小程序、Web 和 React Native 的代码复用。

## 特性概览

### 核心能力
- **统一开发体验** - 使用小程序的开发模式开发 React Native 应用
- **代码复用** - 小程序代码可以直接编译到 React Native 平台
- **组件映射** - 小程序组件自动映射为 React Native 组件
- **API 适配** - 小程序 API 自动适配为 React Native API
- **样式转换** - 小程序样式自动转换为 React Native 样式
- **原生性能** - 享受 React Native 的原生性能优势

### 支持程度
- ✅ 基础组件（view、text、image等）
- ✅ 表单组件（input、button、picker等）
- ✅ 滚动组件（scroll-view、swiper等）
- ✅ 媒体组件（audio、video等）
- ⚠️ 地图组件（需要额外配置）
- ⚠️ 画布组件（需要第三方库）
- ❌ 小程序特有组件（不支持）

## 环境准备

### 1. 安装依赖

```bash
# 安装 React Native CLI
npm install -g @react-native-community/cli

# 安装 Mpx React Native 相关依赖
npm install @mpxjs/webpack-plugin @mpxjs/core @mpxjs/api-proxy-rn
```

### 2. 平台环境

**iOS 开发环境：**
- Xcode 12.0 或更高版本
- iOS 11.0 或更高版本
- CocoaPods

**Android 开发环境：**
- Android Studio
- Android SDK (API 21 或更高)
- Java Development Kit (JDK 8 或更高)

### 3. 项目配置

在现有的小程序项目中添加 React Native 编译配置：

```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    mpx: {
      srcMode: 'wx', // 源码模式
      plugin: {
        hackResolveBuildDependencies: ({ files, resolveDependencies }) => {
          const path = require('path')
          const packageJSONPath = path.resolve('package.json')
          if (files.has(packageJSONPath)) {
            resolveDependencies()
          }
        }
      },
      loader: {
        // React Native 平台特殊配置
      }
    }
  }
}
```

## 快速开始

### 1. 创建 React Native 项目

```bash
# 使用 Mpx CLI 创建支持 RN 的项目
npx @mpxjs/cli@latest create my-rn-app

# 选择包含 React Native 支持的模板
```

### 2. 项目结构

```
my-rn-app/
├── src/                    # 源码目录
│   ├── pages/             # 页面目录
│   ├── components/        # 组件目录
│   ├── utils/            # 工具函数
│   ├── store/            # 状态管理
│   ├── app.mpx           # 应用入口
│   └── app.json          # 应用配置
├── platforms/             # 平台特定代码
│   └── react-native/     # React Native 平台
│       ├── android/      # Android 项目
│       ├── ios/          # iOS 项目
│       ├── index.js      # RN 入口文件
│       └── package.json  # RN 依赖
├── dist/                  # 编译输出
│   └── react-native/     # RN 编译结果
└── vue.config.js         # 构建配置
```

### 3. 构建命令

```bash
# 编译到 React Native
npm run build:rn

# 启动 React Native 开发服务器
npm run serve:rn

# 运行 iOS 应用
npm run ios

# 运行 Android 应用
npm run android
```

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
## 模版指令

### 支持范围

在 React Native 环境下，Mpx 目前支持以下模板指令。详细的指令使用方法请参考 [模板指令 API 文档](/api/directives.html)。

#### 基础模板指令

| 指令 | 支持状态 | 说明 |
|------|---------|------|
| [wx:if](/api/directives.html#wx-if) | ✅ | 条件渲染 |
| [wx:else](/api/directives.html#wx-else) | ✅ | 条件渲染 |
| [wx:elif](/api/directives.html#wx-elif) | ✅ | 条件渲染 |
| [wx:show](/api/directives.html#wx-show) | ✅ | 显示/隐藏控制 |
| [wx:for](/api/directives.html#wx-for) | ✅ | 列表渲染 |
| [wx:for-item](/api/directives.html#wx-for-item) | ✅ | 指定循环项变量名 |
| [wx:for-index](/api/directives.html#wx-for-index) | ✅ | 指定循环索引变量名 |

#### 增强模板指令

| 指令 | 支持状态 | 说明 |
|------|---------|------|
| [wx:class](/api/directives.html#wx-class) | ✅ | 动态类名绑定 |
| [wx:style](/api/directives.html#wx-style) | ✅ | 动态样式绑定 |
| [wx:model](/api/directives.html#wx-model) | ✅ | 双向数据绑定 |
| [wx:model-prop](/api/directives.html#wx-model-prop) | ✅ | 双向绑定属性 |
| [wx:model-event](/api/directives.html#wx-model-event) | ✅ | 双向绑定事件 |
| [wx:model-value-path](/api/directives.html#wx-model-value-path) | ✅ | 双向绑定数据路径 |
| [wx:model-filter](/api/directives.html#wx-model-filter) | ✅ | 双向绑定过滤器 |
| [wx:ref](/api/directives.html#wx-ref) | ⚠️ | 获取基础组件节点或自定义组件实例，RN 环境选择器受限 |

#### 条件编译指令

| 指令 | 支持状态 | 说明 |
|------|---------|------|
| [@mode](/api/directives.html#mode) | ✅ | 平台条件编译 |
| [@_mode](/api/directives.html#mode-1) | ✅ | 平台条件编译（保留转换能力）|
| [@env](/api/directives.html#env) | ✅ | 自定义环境条件编译 |
| [mpxTagName](/api/directives.html#mpxtagname) | ✅ | 动态标签名 |

### 特殊说明

#### wx:ref 使用注意事项

在 RN 环境下使用 `wx:ref` 时需要注意选择器功能的限制：

* 选择器仅支持 id 选择器（`#id`）和 class 选择器（`.class`）

```html
<template>
  <!-- 基础组件 -->
  <view wx:ref="tref">123</view>
  <!-- 自定义组件 -->
  <test-component wx:ref="cref"></test-component>
</template>

<script>
import { createPage } from "@mpxjs/core"

createPage({
  ready() {
    // 基础节点 nodeRef 获取节点信息
    this.$refs.tref.fields({size: true}, function (res) {
      console.log(res)
    }).exec()
    
    // 获取自定义组件实例，调用组件方法
    this.$refs.cref.show()
  }
})
</script>
```

## 事件

在 React Native 环境下，Mpx 目前支持以下事件编写规范。

普通事件绑定
```js
<view bindtap="handleTap">
    Click here!
</view>
```

绑定并阻止事件冒泡
```js
<view catchtap="handleTap">
    Click here!
</view>
```

事件捕获

```js
<view capture-bind:touchstart="handleTap1">
  outer view
  <view capture-bind:touchstart="handleTap2">
    inner view
  </view>
</view>
```

中断捕获阶段和取消冒泡阶段

```js
<view capture-catch:touchstart="handleTap1">
  outer view
</view>

```

在此基础上也新增了事件处理内联传参的增强机制。

```html
<template>
 <!--Mpx增强语法，模板内联传参，方便简洁-->
 <view bindtap="handleTapInline('inline')">内联传参</view>
 </template>
 <script setup>
  // 直接通过参数获取数据，直观方便
  const handleTapInline = (params) => {
    console.log('params:', params)
  }
  // ...
</script>
```

除此之外，Mpx 也支持了动态事件绑定

```html
<template>
 <!--动态事件绑定-->
 <view wx:for="{{items}}" bindtap="handleTap_{{index}}">
  {{item}}
</view>
 </template>
 <script setup>
  import { ref } from '@mpxjs/core'

  const items = ref(['Item 1', 'Item 2', 'Item 3', 'Item 4'])
  const handleTap_0 = (event) => {
    console.log('Tapped on item 1');
  },

  const handleTap_1 = (event) => {
    console.log('Tapped on item 2');
  },

  const handleTap_2 = (event) => {
    console.log('Tapped on item 3');
  },

  const handleTap_3 = (event) => {
    console.log('Tapped on item 4');
  }
</script>
```

更多事件相关内容可以查看 [Mpx 事件处理](../basic/event.md)

注意事项

1. 当使用了事件委托想获取 e.target.dataset 时，只有点击到文本节点才能获取到，点击其他区域无效。建议直接将事件绑定到事件触发的元素上，使用 e.currentTarget 来获取 dataset 等数据。
2. 由于 tap 事件是由 touchend 事件模拟实现，所以在 RN 环境，如果子组件绑定了 catchtouchend，那么父组件的 tap 事件将不会响应。
3. 如果元素上设置了 opacity: 0 的样式，会导致 ios 事件无法响应。
   
## 生命周期
RN 环境支持 Mpx 除 SSR 外所有生命周期钩子，关于生命周期的完整说明和最佳实践，请参考 [**生命周期详细文档**](/guide/basic/lifecycle.html)。

## 应用能力

本节介绍在 React Native 环境下 Mpx 支持的各种应用能力，包括配置、状态管理、API适配等核心功能。

### 📋 目录概览

1. [配置能力](#配置能力) - App配置、页面配置、导航配置
2. [状态管理](#状态管理-1) - Pinia、Store、依赖注入
3. [国际化](#国际化) - i18n多语言支持
4. [API能力](#api能力) - 跨平台API、Webview通信
5. [rnConfig 相关内容](#rnconfig-相关内容) - 异步分包、分享、路由控制、屏幕适配


## 配置能力

### App 全局配置

对标参考 [微信 app 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)，以下为 RN 环境支持情况：

| 配置项 | 支持状态 | 说明 |
|--------|----------|------|
| ✅ entryPagePath | 完全支持 | 应用启动首页路径 |
| ✅ pages | 完全支持 | 页面路径列表 |
| ⚠️ window | 部分支持 | 详见下方 window 配置 |
| ❌ tabbar | 暂不支持 | 底部标签栏配置 |
| ✅ networkTimeout | 完全支持 | 网络超时设置 |
| ✅ subpackages | 完全支持 | 分包结构配置|
| ✅ usingComponents | 完全支持 | 全局自定义组件注册 |
| ✅ vw | 完全支持 | 视窗单位支持 |

### Window 导航配置

Window 配置控制应用导航栏外观，参考 [微信 window 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#window)：

| 配置项 | 支持状态 | 说明 |
|--------|----------|------|
| ✅ navigationBarBackgroundColor | 完全支持 | 导航栏背景颜色 |
| ✅ navigationBarTextStyle | 完全支持 | 导航栏文字颜色 |
| ✅ navigationStyle | 完全支持 | 导航栏样式 |
| ✅ backgroundColor | 完全支持 | 页面背景颜色 |

### 页面配置

页面级别配置，参考 [微信页面配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)：

| 配置项 | 支持状态 | 说明 |
|--------|----------|------|
| ✅ navigationBarBackgroundColor | 完全支持 | 页面导航栏背景色 |
| ✅ navigationBarTextStyle | 完全支持 | 页面导航栏文字颜色 |
| ✅ navigationStyle | 完全支持 | 页面导航栏样式 |
| ✅ backgroundColor | 完全支持 | 页面背景颜色 |
| ✅ usingComponents | 完全支持 | 页面组件注册 |
| ❌ disableScroll | 不支持 | RN 默认不支持页面滚动，需使用 scroll-view 组件 |


## 状态管理

### Pinia 状态管理

**支持状态：✅ 完全支持**

Mpx 在 RN 环境下完整支持 Pinia 状态管理方案，提供响应式状态管理能力。

```javascript
// 示例：使用 Pinia Store
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    isLogin: false
  }),
  actions: {
    setUserInfo(info) {
      this.userInfo = info
      this.isLogin = true
    }
  }
})
```

📖 **详细文档：** [Pinia 状态管理指南](/guide/advance/pinia.html)

### Store 状态管理

**支持状态：✅ 完全支持**

支持 Mpx 原生的 Store 状态管理方案，兼容小程序开发习惯。

📖 **详细文档：** [Store 状态管理指南](/guide/advance/store.html)

### 依赖注入

**支持状态：✅ 完全支持**

支持 Provide/Inject 依赖注入模式，便于组件间状态共享。

📖 **详细文档：** [依赖注入指南](/guide/advance/provide-inject.html#依赖注入-provide-inject)


## 国际化

**支持状态：✅ 完全支持**

Mpx 的 i18n 国际化功能在 RN 环境下保持完整支持。

📖 **详细文档：** [国际化 i18n 指南](/guide/advance/i18n.html)

## API 能力

### 跨平台 API 适配

通过 `@mpxjs/api-proxy` 提供跨平台的小程序 API 适配能力，在 RN 环境中保持与小程序一致的使用方式。部分 API 能力相比小程序有所限制，详细支持列表请[查看完整文档](/api/extend.html#api-proxy)。

#### 使用说明

#### 1. 安装和配置

**步骤1：引入 @mpxjs/api-proxy**

```javascript
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, { usePromise: true })
```

**步骤2：配置 Externals**

使用 mpx-cli 创建的项目已默认配置，无需手动设置。如需自定义，参考：

```javascript
// vue.config.js
externals: {
  '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage',
  '@react-native-clipboard/clipboard': '@react-native-clipboard/clipboard',
  '@react-native-community/netinfo': '@react-native-community/netinfo',
  'react-native-device-info': 'react-native-device-info',
  'react-native-safe-area-context': 'react-native-safe-area-context',
  'react-native-reanimated': 'react-native-reanimated',
  'react-native-get-location': 'react-native-get-location',
  'react-native-haptic-feedback': 'react-native-haptic-feedback'
}
```

#### 2. 依赖安装

根据使用的 API 选择性安装依赖：

| API 功能 | 相关方法 | 依赖包 |
|----------|----------|--------|
| **弹窗选择** | `showActionSheet` | `react-native-reanimated` |
| **网络状态** | `getNetworkType`、`onNetworkStatusChange` | `@react-native-community/netinfo` |
| **位置服务** | `getLocation`、`openLocation`、`chooseLocation` | `react-native-get-location` |
| **本地存储** | `setStorage`、`getStorage`、`removeStorage` | `@react-native-async-storage/async-storage` |
| **设备信息** | `getSystemInfo`、`getDeviceInfo` | `react-native-device-info` |
| **安全区域** | `getWindowInfo`、`getLaunchOptionsSync` | `react-native-safe-area-context` |
| **震动反馈** | `vibrateShort`、`vibrateLong` | `react-native-haptic-feedback` |

**按需安装示例：**

```bash
# 示例：只使用存储和设备信息API
npm install @react-native-async-storage/async-storage react-native-device-info

# 示例：使用位置服务
npm install react-native-get-location

# 示例：使用网络状态监听
npm install @react-native-community/netinfo

# iOS 项目需要执行（有原生依赖时）
cd ios && pod install
```

> 💡 **建议：** 根据实际使用的 API 选择安装对应依赖，避免不必要的包体积增加

#### 3. 平台特殊配置

**react-native-get-location**

Android 权限配置：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

**react-native-haptic-feedback**

Android 需要额外配置，参考 [官方文档](https://github.com/mkuczera/react-native-haptic-feedback)：

1. 在 `android/app/src/main/java/[...]/MainApplication.java` 顶部导入：

```java
import com.mkuczera.RNReactNativeHapticFeedbackPackage;
```

2. 在 `android/settings.gradle` 中添加：

```
include ':react-native-haptic-feedback'
project(':react-native-haptic-feedback').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-haptic-feedback/android')
```

**react-native-reanimated**

在 `babel.config.js` 中添加插件，参考 [官方文档](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)：

```javascript
module.exports = {
  presets: ['...'],
  plugins: [
    // 其他插件...
    'react-native-reanimated/plugin', // 必须放在最后
  ],
}
```

> ⚠️ **注意：** 确保 Mpx 项目和容器中的 `react-native-reanimated` 版本一致

### 跨平台 API 使用限制

#### createSelectorQuery

**上下文指定：** RN 环境下必须手动调用 `.in(this)` 指定组件上下文

```javascript
import { createComponent } from '@mpxjs/core'

createComponent({
  attached() {
    const query = wx.createSelectorQuery().in(this) // ⚠️ 必须指定组件实例
    query.select('#the-id').boundingClientRect((rect) => {
      console.log('rect', rect)
    })
    .exec()
  }
})
```

**选择器限制：** RN 环境仅支持以下选择器类型

| 选择器类型 | 格式 | 示例 |
|------------|------|------|
| ID 选择器 | `#id` | `#my-element` |
| Class 选择器 | `.class` | `.item` |
| 多 Class 选择器 | `.class1.class2` | `.item.active.selected` |

> ❌ **不支持：** 标签选择器、属性选择器、伪类选择器等

### Webview 通信

Mpx 提供 `@mpxjs/webview-bridge` 来实现 H5 页面与 RN 应用的双向通信。

#### 导航方法

| 方法 | 功能 | 说明 |
|------|------|------|
| `navigateTo` | 页面跳转 | 保留当前页面，跳转到 RN 页面 |
| `navigateBack` | 页面返回 | 关闭当前页面，返回上一页 |
| `redirectTo` | 页面重定向 | 关闭当前页面，跳转到 RN 页面 |
| `switchTab` | Tab 切换 | 跳转到 RN TabBar 页面 |
| `reLaunch` | 应用重启 | 关闭所有页面，打开指定页面 |

**使用示例：**

```javascript
import webviewBridge from '@mpxjs/webview-bridge'

// 页面跳转
webviewBridge.navigateTo({
  url: '/pages/detail/detail?id=123',
  success: () => console.log('跳转成功')
})
```

#### 消息通信

| 方法 | 功能 | 说明 |
|------|------|------|
| `postMessage` | 发送消息 | 向 RN 发送实时消息 |
| `getEnv` | 环境检测 | 获取当前运行环境 |
| `invoke` | 方法调用 | 调用 RN 注册的自定义方法 |

#### 自定义方法调用

**1. RN 端注册方法**

```javascript
import mpx from '@mpxjs/core'

mpx.config.webviewConfig = {
  apiImplementations: {
    // 同步方法
    getUserInfo: (options = {}) => {
      return {
        name: '张三',
        avatar: 'https://example.com/avatar.jpg'
      }
    },
    
    // 异步方法
    uploadFile: (options = {}) => {
      return new Promise((resolve, reject) => {
        const { filePath } = options.params || {}
        if (filePath) {
          // 执行上传逻辑
          resolve({ url: 'https://example.com/uploaded.jpg' })
        } else {
          reject(new Error('文件路径不能为空'))
        }
      })
    }
  }
}
```

**2. H5 端调用方法**

```javascript
import webviewBridge from '@mpxjs/webview-bridge'

// 调用同步方法
webviewBridge.invoke('getUserInfo', {
  success: (result) => {
    console.log('用户信息:', result)
  },
  fail: (error) => {
    console.error('获取失败:', error)
  }
})

// 调用异步方法
webviewBridge.invoke('uploadFile', {
  params: { filePath: '/path/to/file.jpg' },
  success: (result) => {
    console.log('上传成功:', result.url)
  },
  fail: (error) => {
    console.error('上传失败:', error.message)
  }
})
```

## 高级特性

`rnConfig` 是 Mpx 框架专为 React Native 环境提供的配置对象，用于定制 RN 平台特有的行为和功能。通过 `mpx.config.rnConfig` 可以配置异步分包、分享、路由控制、屏幕适配等高级特性。
  
### 异步分包

Mpx 在 RN 环境下实现了与微信小程序同等的异步分包功能，支持按需加载分包内容。基础使用可参考 [异步分包指南](https://www.mpxjs.cn/guide/advance/async-subpackage.html)

在异步分包的能力实现当中我们借助了 RN 容器提供的分包下载执行/分包拉取的 api，因此在你的应用开始使用异步分包的功能之前需要在运行时代码提前部署好 RN 容器提供的相关 api 以供 Mpx 应用使用：

```javascript
import mpx from '@mpxjs/core'

// 配置分包加载器
mpx.config.rnConfig.loadChunkAsync = function (config) {
  // 分包下载并执行 api
  return drnLoadChunkAsync(config.package)
}

mpx.config.rnConfig.downloadChunkAsync = function (packages) {
  if (packages && packages.length) {
    // 分包拉取 api
    drnDownloadChunkAsync(packages)
  }
}
```

#### 构建配置

在 `mpx.config.js` 中配置异步分包选项：

```javascript
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        asyncChunk: {
          timeout: 5000, // 加载超时时间(ms)
          loading: path.resolve(__dirname, 'src/components/loading.mpx'),    // 加载页面
          fallback: path.resolve(__dirname, 'src/components/fallback.mpx')   // 兜底页面
        }
      }
    }
  }
})
```

#### 错误处理

**组件加载失败监听**：微信小程序提供了 wx.onLazyLoadError 的全局 api 来监听异步组件加载失败，这个 api 同样在 Mpx 转 RN 场景下生效；



```javascript
mpx.onLazyLoadError((error) => {
  console.error('异步组件加载失败:', error)
})
```

**页面加载失败监听**：微信小程序未提供相关的监听异常的 api，Mpx 转 RN 提供了一个额外的全局监听函数


```javascript
// RN 环境特有
mpx.config.rnConfig.onLazyLoadPageError = (error) => {
  console.error('异步页面加载失败:', {
    subpackage: error.subpackage, // 分包名
    errType: error.errType        // 'timeout' | 'fail'
  })
}
```

#### 自定义兜底页面

对于异步分包页面加载失败的情况会展示默认兜底页面，用户可以点击兜底页面底部的重试按钮重新加载异步分包页面。那么对于开发者提供的自定义的 fallback 兜底页面，框架会自动给自定义页面注入一个 `onReload` 方法以供开发者做页面重试的操作，具体见下方示例：

```html
<template>
  <view class="fallback-container">
    <view class="error-message">页面加载失败</view>
    <view class="retry-btn" bindtap="handleRetry">点击重试</view>
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  props: {
    onReload: Function // 框架自动注入
  },
  methods: {
    handleRetry() {
      this.onReload?.() // 触发重新加载
    }
  }
})
</script>

<style>
.fallback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.retry-btn {
  margin-top: 20rpx;
  padding: 10rpx 20rpx;
  background-color: #007aff;
  color: white;
  border-radius: 4rpx;
}
</style>
```

### 分享

#### mpx.config.rnConfig.openTypeHandler.onShareAppMessage

当使用 [button 组件](./rn.html#button) 并指定 `open-type="share"` 时，将触发分享。在 RN 中是分享实现需由容器实现，可在 onShareAppMessage 中完成分享逻辑实现。

其参数为当前页面的 onShareAppMessage 钩子返回内容，如果返回返回内容中包含 promise，将会在 fulfilled 后将其结果合并再触发 onShareAppMessage

```typescript
(shareInfo: { title: string, path: string, imageUrl?: string }) => void
```

### 路由

#### mpx.config.rnConfig.parseAppProps

```typescript
(props: Record<string, any>) => ({ initialRouteName: string, initialParams: Record<string, any> }| void)
```

用于获取初始路由配置的函数，参数为RN根组件接收到的参数

- initialRouteName: 首页路径，例如 pages/index
- initialParams: 首页onLoad参数，例如 \{ a: 1 \}

#### mpx.config.rnConfig.onStateChange

```typescript
(state: Record<string, any>) => void
```

当导航状态发生变化时触发，例如页面跳转、返回等。可在此回调中将 ReactNative 路径栈同步到容器中。

#### mpx.config.rnConfig.onAppBack

```typescript
() => boolean
```

页面栈长度为 1（即根页面）且用户尝试退出 App 时触发。

- true：允许退出应用
- false：阻止退出应用

#### mpx.config.rnConfig.onStackTopBack

控制首页回退按钮是否展示，并监听点击事件。

如果绑定该函数，则首页显示返回按钮，点击后调用该函数作为回调，如果未绑定该函数，则首页不会展示返回按钮。

如需实现点击返回，请在函数内部手动调用 back。

### 折叠屏适配

#### mpx.config.rnConfig.customDimensions

```typescript
(dimensions: { window: ScaledSize; screen: ScaledSize }) => { window: ScaledSize; screen: ScaledSize } | void
```

在某些情况下，我们可能不希望当前 ReactNative 全屏展示，Mpx 内部基于 ScreenWidth 与 ScreenHeight 作为 rpx、vh、vw、媒体查询、onResize等特性的依赖内容，此时可在 `mpx.config.rnConfig.customDimensions` 中自定义 screen 信息来得到想要的渲染效果。

可在此方法中返回修改后的 dimensions，如果无返回或返回undefined，则以入参作为返回值

例如在折叠屏中我们期望只在其中一半屏上展示，可在customDimensions中判断当前是否为折叠屏展开状态，如果是则将 ScreenWidth 设置为原来的一半。

## 样式 

## API 适配

### 网络请求

```javascript
// 使用统一的网络请求 API
import { request } from '@mpxjs/api-proxy-rn'

// 发起网络请求
request({
  url: 'https://api.example.com/data',
  method: 'GET',
  data: {
    id: 123
  }
}).then(res => {
  console.log('请求成功', res.data)
}).catch(err => {
  console.error('请求失败', err)
})

// 上传文件
import { uploadFile } from '@mpxjs/api-proxy-rn'

uploadFile({
  url: 'https://api.example.com/upload',
  filePath: 'file://path/to/image.jpg',
  name: 'file',
  formData: {
    user: 'test'
  }
}).then(res => {
  console.log('上传成功', res)
})
```

### 存储 API

```javascript
// 使用统一的存储 API
import { 
  setStorageSync, 
  getStorageSync, 
  removeStorageSync,
  clearStorageSync
} from '@mpxjs/api-proxy-rn'

// 设置存储
setStorageSync('userInfo', {
  name: '张三',
  age: 25
})

// 获取存储
const userInfo = getStorageSync('userInfo')
console.log('用户信息', userInfo)

// 删除存储
removeStorageSync('userInfo')

// 清空存储
clearStorageSync()
```

### 系统信息

```javascript
// 获取系统信息
import { getSystemInfoSync } from '@mpxjs/api-proxy-rn'

const systemInfo = getSystemInfoSync()
console.log('系统信息', {
  platform: systemInfo.platform, // 'ios' 或 'android'
  version: systemInfo.version,
  screenWidth: systemInfo.screenWidth,
  screenHeight: systemInfo.screenHeight,
  statusBarHeight: systemInfo.statusBarHeight
})
```

### 导航 API

```javascript
// 页面导航
import { 
  navigateTo, 
  redirectTo, 
  navigateBack,
  switchTab,
  reLaunch
} from '@mpxjs/api-proxy-rn'

// 跳转到新页面
navigateTo({
  url: '/pages/detail/detail?id=123'
})

// 重定向
redirectTo({
  url: '/pages/login/login'
})

// 返回上一页
navigateBack({
  delta: 1
})

// 切换 Tab
switchTab({
  url: '/pages/index/index'
})

// 重新启动
reLaunch({
  url: '/pages/index/index'
})
```

### 设备 API

```javascript
// 震动
import { vibrateShort, vibrateLong } from '@mpxjs/api-proxy-rn'

// 短震动
vibrateShort()

// 长震动
vibrateLong()

// 获取位置信息
import { getLocation } from '@mpxjs/api-proxy-rn'

getLocation({
  type: 'gcj02'
}).then(res => {
  console.log('位置信息', {
    latitude: res.latitude,
    longitude: res.longitude,
    accuracy: res.accuracy
  })
})

// 选择图片
import { chooseImage } from '@mpxjs/api-proxy-rn'

chooseImage({
  count: 1,
  sizeType: ['original', 'compressed'],
  sourceType: ['album', 'camera']
}).then(res => {
  console.log('选择的图片', res.tempFilePaths)
})
```

## 样式处理

### 样式转换

Mpx 会自动将小程序样式转换为 React Native 样式：

```css
/* 小程序样式 */
<style>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 750rpx;
  height: 400rpx;
  background-color: #ffffff;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 100rpx;
}
</style>
```

```javascript
// 转换后的 React Native 样式
const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // 750rpx 转换为 100%
    height: 200,   // 400rpx 转换为 200
    backgroundColor: '#ffffff',
    borderRadius: 5, // 10rpx 转换为 5
    // box-shadow 转换为 elevation (Android) 和 shadowXXX (iOS)
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  title: {
    fontSize: 16,      // 32rpx 转换为 16
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10   // 20rpx 转换为 10
  },
  image: {
    width: 100,        // 200rpx 转换为 100
    height: 100,       // 200rpx 转换为 100
    borderRadius: 50   // 100rpx 转换为 50
  }
})
```

### 单位转换规则

| 小程序单位 | React Native 转换 | 说明 |
|------------|-------------------|------|
| `rpx` | 按比例转换为数值 | 750rpx = 屏幕宽度 |
| `px` | 直接转换为数值 | 1px = 1 |
| `%` | 转换为字符串 | 保持百分比 |
| `em/rem` | 转换为数值 | 基于字体大小计算 |

### 样式限制

React Native 不支持的样式属性会被自动过滤：

```css
<style>
.element {
  /* 支持的属性 */
  width: 200rpx;
  height: 100rpx;
  backgroundColor: '#ff0000';
  borderRadius: 10rpx;
  margin: 20rpx;
  padding: 10rpx;
  
  /* 不支持的属性（会被过滤） */
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1); /* 转换为 elevation 和 shadow 属性 */
  background-image: url('image.png'); /* 不支持 */
  float: left; /* 不支持 */
  position: absolute; /* 部分支持 */
}
</style>
```

## 平台差异处理

### 条件编译

```html
<template>
  <view class="container">
    <!-- 通用内容 -->
    <text class="title">{{ title }}</text>
    
    <!-- React Native 特定内容 -->
    <!-- #ifdef rn -->
    <view class="rn-only">
      <text @tap="onRNAction">RN 专用功能</text>
    </view>
    <!-- #endif -->
    
    <!-- 小程序特定内容 -->
    <!-- #ifndef rn -->
    <button @tap="onMiniProgramAction">小程序专用功能</button>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      title: 'Hello React Native'
    }
  },
  methods: {
    // #ifdef rn
    onRNAction() {
      // React Native 平台特定逻辑
      import { Alert } from 'react-native'
      Alert.alert('提示', '这是 React Native 原生弹窗')
    },
    // #endif
    
    // #ifndef rn
    onMiniProgramAction() {
      // 小程序平台特定逻辑
      wx.showModal({
        title: '提示',
        content: '这是小程序弹窗'
      })
    }
    // #endif
  }
}
</script>

<style>
.container {
  padding: 20rpx;
}

/* #ifdef rn */
.rn-only {
  marginTop: 20;
  padding: 10;
  backgroundColor: '#f0f0f0';
}
/* #endif */
</style>
```

### 文件维度差异

对于差异较大的页面或组件，可以创建平台特定的文件：

```
pages/
├── camera/
│   ├── camera.mpx         # 小程序实现
│   └── camera.rn.mpx      # React Native 实现
└── map/
    ├── map.mpx            # 小程序实现
    └── map.rn.mpx         # React Native 实现
```

**React Native 特定实现示例：**

```html
<!-- camera.rn.mpx -->
<template>
  <view class="camera-container">
    <view class="camera-view" ref="cameraView">
      <!-- React Native 相机组件 -->
    </view>
    <view class="controls">
      <text @tap="takePicture" class="capture-btn">拍照</text>
    </view>
  </view>
</template>

<script>
export default {
  mounted() {
    this.initCamera()
  },
  methods: {
    initCamera() {
      // 初始化 React Native 相机
      // 使用 react-native-camera 或其他相机库
    },
    takePicture() {
      // 拍照逻辑
    }
  }
}
</script>

<style>
.camera-container {
  flex: 1;
  backgroundColor: '#000000';
}

.camera-view {
  flex: 1;
}

.controls {
  height: 100;
  justifyContent: 'center';
  alignItems: 'center';
  backgroundColor: 'rgba(0,0,0,0.5)';
}

.capture-btn {
  color: '#ffffff';
  fontSize: 18;
  fontWeight: 'bold';
}
</style>
```

## 原生模块集成

### 使用第三方库

```bash
# 安装常用的 React Native 库
npm install react-native-vector-icons
npm install react-native-maps
npm install react-native-camera
npm install @react-native-async-storage/async-storage

# iOS 需要执行 pod install
cd ios && pod install
```

### 地图组件示例

```html
<!-- map.rn.mpx -->
<template>
  <view class="map-container">
    <map-view
      :region="region"
      :markers="markers"
      @region-change="onRegionChange"
      @marker-press="onMarkerPress"
      class="map"
    />
  </view>
</template>

<script>
// #ifdef rn
import MapView, { Marker } from 'react-native-maps'
// #endif

export default {
  // #ifdef rn
  components: {
    MapView,
    Marker
  },
  // #endif
  
  data() {
    return {
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      },
      markers: [
        {
          id: 1,
          latitude: 37.78825,
          longitude: -122.4324,
          title: '标记点1'
        }
      ]
    }
  },
  
  methods: {
    onRegionChange(region) {
      this.region = region
    },
    
    onMarkerPress(marker) {
      console.log('点击标记', marker)
    }
  }
}
</script>

<style>
.map-container {
  flex: 1;
}

.map {
  flex: 1;
}
</style>
```

## 性能优化

### 列表优化

```html
<template>
  <view class="list-container">
    <!-- 使用 FlatList 优化长列表性能 -->
    <!-- #ifdef rn -->
    <flat-list
      :data="list"
      :render-item="renderItem"
      :key-extractor="keyExtractor"
      :get-item-layout="getItemLayout"
      :initial-num-to-render="10"
      :max-to-render-per-batch="5"
      :window-size="10"
    />
    <!-- #endif -->
    
    <!-- 小程序使用普通列表 -->
    <!-- #ifndef rn -->
    <scroll-view scroll-y class="scroll-list">
      <view v-for="item in list" :key="item.id" class="list-item">
        <text>{{ item.name }}</text>
      </view>
    </scroll-view>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      list: [] // 大量数据
    }
  },
  
  methods: {
    // #ifdef rn
    renderItem({ item }) {
      return (
        <View style={styles.listItem}>
          <Text>{item.name}</Text>
        </View>
      )
    },
    
    keyExtractor(item) {
      return item.id.toString()
    },
    
    getItemLayout(data, index) {
      return {
        length: 60, // 每个项目的高度
        offset: 60 * index,
        index
      }
    }
    // #endif
  }
}
</script>
```

### 图片优化

```html
<template>
  <view class="image-container">
    <!-- React Native 图片优化 -->
    <!-- #ifdef rn -->
    <image
      :source="{ uri: imageUrl }"
      :resize-mode="'cover'"
      :cache="'force-cache'"
      :loading-indicator-source="loadingImage"
      class="optimized-image"
      @load="onImageLoad"
      @error="onImageError"
    />
    <!-- #endif -->
    
    <!-- 小程序图片 -->
    <!-- #ifndef rn -->
    <image
      :src="imageUrl"
      :mode="'aspectFill'"
      :lazy-load="true"
      class="normal-image"
    />
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      imageUrl: 'https://example.com/image.jpg',
      loadingImage: require('@/assets/loading.png')
    }
  },
  
  methods: {
    onImageLoad() {
      console.log('图片加载完成')
    },
    
    onImageError(error) {
      console.error('图片加载失败', error)
    }
  }
}
</script>
```

## 调试和测试

### 开发调试

```bash
# 启动 Metro 服务器
npm run serve:rn

# 在另一个终端运行应用
npm run ios     # 运行 iOS 应用
npm run android # 运行 Android 应用
```

### 真机调试

```bash
# iOS 真机调试
npm run ios -- --device

# Android 真机调试
npm run android -- --variant=release
```

### 性能监控

```javascript
// 性能监控
import { Performance } from 'react-native'

// 监控页面加载时间
const startTime = Performance.now()

// 页面加载完成后
const endTime = Performance.now()
console.log(`页面加载时间: ${endTime - startTime}ms`)

// 内存使用监控
import { DeviceInfo } from 'react-native'

DeviceInfo.getUsedMemory().then(usedMemory => {
  console.log(`已使用内存: ${usedMemory}MB`)
})
```

## 打包发布

### iOS 打包

```bash
# 生成 iOS 发布包
cd ios
xcodebuild -workspace MyApp.xcworkspace -scheme MyApp -configuration Release -archivePath MyApp.xcarchive archive

# 导出 IPA
xcodebuild -exportArchive -archivePath MyApp.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist
```

### Android 打包

```bash
# 生成 Android 发布包
cd android
./gradlew assembleRelease

# 生成的 APK 位于
# android/app/build/outputs/apk/release/app-release.apk
```

### 自动化打包

```javascript
// package.json
{
  "scripts": {
    "build:rn": "mpx-cli-service build --target=rn",
    "build:ios": "npm run build:rn && cd ios && xcodebuild -workspace MyApp.xcworkspace -scheme MyApp -configuration Release archive",
    "build:android": "npm run build:rn && cd android && ./gradlew assembleRelease"
  }
}
```

## 最佳实践

### 1. 代码组织

- 合理使用条件编译，避免过度使用
- 将平台特定代码抽离到单独文件
- 建立统一的组件库和工具库

### 2. 性能优化

- 使用 FlatList 优化长列表
- 合理使用图片缓存和懒加载
- 避免在 render 中进行复杂计算

### 3. 用户体验

- 保持与原生应用一致的交互体验
- 合理使用原生组件和动画
- 做好错误处理和加载状态

### 4. 开发效率

- 建立完善的开发和调试流程
- 使用热重载提高开发效率
- 建立自动化测试和打包流程

## 下一步

- [React Native 平台差异处理](./differences.md)
- [React Native 性能优化](./optimization.md)
- [React Native 原生模块开发](./native-modules.md)