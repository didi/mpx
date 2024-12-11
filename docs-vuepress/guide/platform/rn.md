## 跨端输出RN
大致介绍

### 跨端样式定义

#### CSS选择器

#### 样式单位

#### 文本样式继承

#### 简写样式属性

#### 使用原子类

### 混合编写RN代码

#### 使用RN组件

#### 使用React hooks

### 能力支持范围

#### 模版语法

#### 基础组件
目前 Mpx 输出 React Native 仅支持以下组件，文档中未提及的组件属性即为不支持，具体使用范围可参考如下文档

##### view
视图容器。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| hover-class	             | string  |         | 指定按下去的样式类。 |
| hover-start-time   | number  |     50    | 按住后多久出现点击态，单位毫秒|
| hover-stay-time	  | number  |     400    | 手指松开后点击态保留时间，单位毫秒	 |
| enable-offset		  | Number  |     false    | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|

事件

| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| bindtap       |  点击的时候触发   |


##### scroll-view
可滚动视图区域。

属性

| 属性名                   | 类型     | 默认值     | 说明                                               |
| ----------------------- | ------- | --------- | -------------------------------------------------- |
| scroll-x                | Boolean | `false`   | 允许横向滚动动 |
| scroll-y                | Boolean | `false`   | 允许纵向滚动  |
| upper-threshold         | Number  | `50`      | 距顶部/左边多远时(单位 px),触发 scrolltoupper 事件      |
| lower-threshold         | Number  | `50`      | 距底部/右边多远时(单位 px),触发 scrolltolower 事件      |
| scroll-top              | Number  | `0`       | 设置纵向滚动条位置                                    |
| scroll-left             | Number  | `0`       | 设置横向滚动条位置                                    |
| scroll-with-animation   | Boolean | `false`   | 在设置滚动条位置时使用动画过渡                          |
| enable-back-to-top      | Boolean | `false`   | 点击状态栏的时候视图会滚动到顶部                        |
| enhanced                | Boolean | `false`   | scroll-view 组件功能增强                             |
| refresher-enabled       | Boolean | `false`   | 开启自定义下拉刷新                                    |
| scroll-anchoring        | Boolean | `false`   | 开启滚动区域滚动锚点                                   |
| refresher-default-style | String  | `'black'` | 设置下拉刷新默认样式,支持 `black`、`white`、`none`，仅安卓支持 |
| refresher-background    | String  | `'#fff'`  | 设置自定义下拉刷新背景颜色，仅安卓支持                         |
| refresher-triggered     | Boolean | `false`   | 设置当前下拉刷新状态,true 表示已触发               |
| paging-enabled          | Number  | `false`   | 分页滑动效果 (同时开启 enhanced 属性后生效)，当值为 true 时，滚动条会停在滚动视图的尺寸的整数倍位置  |
| show-scrollbar          | Number  | `true`   | 滚动条显隐控制 (同时开启 enhanced 属性后生效)|
| enable-offset          | Number  | `false`   | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|


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

1. 目前不支持自定义下拉刷新节点，使用 slot="refresher" 声明无效，在 React Native 环境中还是会被当作普通节点渲染出来


##### swiper
滑块视图容器。

属性

| 属性名                   | 类型     | 默认值              | 说明                                 |
| ----------------------- | ------- | ------------------  | ------------------------------------|
| indicator-dots          | Boolean | `false`             | 是否显示面板指示点                     |
| indicator-color         | color   | `rgba(0, 0, 0, .3)` | 指示点颜色                            |
| indicator-active-color  | color   | `#000000`           | 当前选中的指示点颜色                   |
| autoplay                | Boolean | `false`             | 是否自动切换                          |
| current                 | Number  | `0`                 | 当前所在滑块的 index                  |
| interval                | Number  | `5000`              | 自动切换时间间隔                       |
| duration                | Number  | `500`               | 滑动动画时长                          |
| circular                | Boolean | `false`             | 是否采用衔接滑动                       |
| vertical                | Boolean | `false`             | 滑动方向是否为纵向                      |
| previous-margin         | String  | `0`                 | 前边距，可用于露出前一项的一小部分，接受px |
| next-margin             | String  | `0`                 | 后边距，可用于露出后一项的一小部分，接受px |
| enable-offset          | Number  | `false`   | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|


事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange| current 改变时会触发 change 事件，event.detail = {current, source}|

##### swiper-item
1. 仅可放置在swiper组件中，宽高自动设置为100%。

属性

| 属性名                   | 类型     | 默认值              | 说明                                 |
| ----------------------- | ------- | ------------------  | ------------------------------------|
| item-id                 | string  | `无`             | 该 swiper-item 的标识符                  |

##### movable-area
movable-view的可移动区域。

注意事项

1. movable-area不支持设置 scale-area，缩放手势生效区域仅在 movable-view 内

##### movable-view
可移动的视图容器，在页面中可以拖拽滑动。movable-view 必须在 movable-area 组件中，并且必须是直接子节点，否则不能移动。


属性

| 属性名 | 类型             | 默认值 | 说明                                                                                                  |
| ------ | ---------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| direction   | String           |   none     | 目前支持 all、vertical、horizontal、none｜
| x   | Number |      | 定义x轴方向的偏移  |
| y  | Number  |        | 定义y轴方向的偏移 |
|friction  | Number  |    7    | 摩擦系数 |
|disabled  | boolean  |    false    | 是否禁用 |
|scale  | boolean  |   false   | 是否支持双指缩放 |
|scale-min  | Number  |    0.1    | 定义缩放倍数最小值 |
|scale-max  | Number  |    10    | 定义缩放倍数最大值 |
|scale-value | Number  |    1    | 定义缩放倍数，取值范围为 0.1 - 10 |

事件

| 事件名               | 说明                                       |
| -------------------- | ------------------------------------------ |
| bindchange        | 拖动过程中触发的事件，event.detail = {x, y, source} |
| bindscale         | 缩放过程中触发的事件，event.detail = {x, y, scale}    |
| htouchmove          | 初次手指触摸后移动为横向的移动时触发 |
| vtouchmove    | 初次手指触摸后移动为纵向的移动时触发                      |

##### root-portal
使整个子树从页面中脱离出来，类似于在 CSS 中使用 fixed position 的效果。主要用于制作弹窗、弹出层等。
属性

| 属性名 | 类型             | 默认值 | 说明                                                                                                  |
| ------ | ---------------- | ------ | ----------------------------------------------------------------------------------------------------- |

| enable   | boolean           |   true	     | 是否从页面中脱离出来	｜


##### cover-view
视图容器。
功能同 view 组件

##### cover-image
视图容器。
功能同 image 组件

##### icon
图标组件


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| type      | String  |               | icon 的类型，有效值：success、success_no_circle、info、warn、waiting、cancel、download、search、clear |
| size      | String \| Number  |     23    | icon 的大小 |
| color		  | String  |         | icon 的颜色，同 css 的 color |


##### text
文本。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| user-select             | boolean  | `false`       | 文本是否可选。 |
| disable-default-style             | boolean  | `false`       |  会内置默认样式，比如fontSize为16。设置`true`可以禁止默认的内置样式。 |
| enable-offset		  | Number  |     false    | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|


事件


| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| bindtap       |  点击的时候触发         |

注意事项
1. 未包裹 text 标签的文本，会自动包裹 text 标签。
2. text 组件开启 enable-offset 后，offsetLeft、offsetWidth 获取时机仅为组件首次渲染阶段


##### button
按钮。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                      |
| ----------------------- | ------- | ------------- | --------------------------------------------------------- |
| size                    | String  | `default`     | 按钮的大小                                                  |
| type                    | String  | `default`     | 按钮的样式类型                                               |
| plain                   | Boolean | `false`       | 按钮是否镂空，背景色透明                                       |
| disabled                | Boolean | `false`       | 是否禁用                                                    |
| loading                 | Boolean | `false`       | 名称前是否带 loading 图标                                     |
| open-type               | String  |               | 微信开放能力，当前仅支持 `share`                               |
| hover-class             | String  |               | 指定按钮按下去的样式类。当 hover-class="none" 时，没有点击态效果  |
| hover-start-time        | Number  |  `20`         | 按住后多久出现点击态，单位毫秒                                  |
| hover-stay-time         | Number  |  `70`         | 手指松开后点击态保留时间，单位毫秒                               |
| enable-offset          | Number  | `false`   | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|


##### label
用来改进表单组件的可用性


注意事项

1. 当前不支持使用 for 属性找到对应 id，仅支持将控件放在该标签内，目前可以绑定的空间有：checkbox、radio、switch。
   

##### checkbox
多选项目


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value	    | String   |              | checkbox 标识，选中时触发 checkbox-group 的 change 事件，并携带 checkbox 的 value |
| disabled  | Boolean  |     false    | 是否禁用 |
| checked	  | Boolean  |     false    | 当前是否选中，可用来设置默认选中 |
| color		  | String   |     #09BB07  | checkbox的颜色，同css的color |


##### checkbox-group
多项选择器，内部由多个checkbox组成。


事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange      | checkbox-group 中选中项发生改变时触发 change 事件，detail = { value: [ 选中的 checkbox 的 value 的数组 ] } |


##### radio
单选项目


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value	    | String  |               | radio 标识，当该 radio 选中时，radio-group 的 change 事件会携带 radio 的 value |
| disabled  | Boolean  |     false    | 是否禁用 |
| checked	  | Boolean  |     false    | 当前是否选中，可用来设置默认选中 |
| color		  | String   |     #09BB07  | checkbox 的颜色，同 css 的 color |


##### radio-group
单项选择器，内部由多个 radio 组成


事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange      | radio-group 中选中项发生改变时触发 change 事件，detail = { value: [ 选中的 radio 的 value 的数组 ] } |


##### form
表单。将组件内的用户输入的switch input checkbox slider radio picker 提交。

当点击 form 表单中 form-type 为 submit 的 button 组件时，会将表单组件中的 value 值进行提交，需要在表单组件中加上 name 来作为 key。

事件

| 事件名     | 说明                                                |
| ---------- | --------------------------------------------------- |
| bindsubmit | 携带 form 中的数据触发 submit 事件，event.detail = {value : {'name': 'value'} } |
| bindreset  | 表单重置时会触发 reset 事件 |


##### input
输入框。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value                   | String  |               | 输入框的初始内容                                              |
| type                    | String  | `text`        | input 的类型，不支持 `safe-password`、`nickname`              |
| password                | Boolean | `false`       | 是否是密码类型                                               |
| placeholder             | String  |               | 输入框为空时占位符                                            |
| placeholder-class       | String  |               | 指定 placeholder 的样式类，仅支持 color 属性                   |
| placeholder-style       | String  |               | 指定 placeholder 的样式，仅支持 color 属性                    |
| disabled                | Boolean | `false`       | 是否禁用                                                    |
| maxlength               | Number  | `140`         | 最大输入长度，设置为 -1 的时候不限制最大长度                     |
| auto-focus              | Boolean | `false`       | (即将废弃，请直接使用 focus )自动聚焦，拉起键盘                  |
| focus                   | Boolean | `false`       | 获取焦点                                                    |
| confirm-type            | String  | `done`        | 设置键盘右下角按钮的文字，仅在 type='text' 时生效               |
| confirm-hold            | Boolean | `false`       | 点击键盘右下角按钮时是否保持键盘不收起                           |
| cursor                  | Number  |               | 指定 focus 时的光标位置                                      |
| cursor-color            | String  |               | 光标颜色                                                    |
| selection-start         | Number  | `-1`          | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用         |
| selection-end           | Number  | `-1`          | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用       |
| enable-offset          | Number  | `false`   | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|

事件

| 事件名                | 说明                                                                               |
| ---------------------| ---------------------------------------------------------------------------------- |
| bindinput            | 键盘输入时触发，event.detail = { value, cursor }，不支持 `keyCode`                     |
| bindfocus            | 输入框聚焦时触发，event.detail = { value }，不支持 `height`                            |
| bindblur             | 输入框失去焦点时触发，event.detail = { value }，不支持 `encryptedValue`、`encryptError` |
| bindconfirm          | 点击完成按钮时触发，event.detail = { value }                                          |
| bind:selectionchange | 选区改变事件, event.detail = { selectionStart, selectionEnd }                        |

方法

可通过 `ref` 方式调用以下组件实例方法

| 方法名                | 说明                                 |
| ---------------------| ----------------------------------- |
| focus                | 使输入框得到焦点                       |
| blur                 | 使输入框失去焦点                       |
| clear                | 清空输入框的内容                       |
| isFocused            | 返回值表明当前输入框是否获得了焦点        |


##### textarea
多行输入框。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value                   | String  |               | 输入框内容                                                   |
| type                    | String  | `text`        | input 的类型，不支持 `safe-password`、`nickname`              |
| placeholder             | String  |               | 输入框为空时占位符                                            |
| placeholder-class       | String  |               | 指定 placeholder 的样式类，仅支持 color 属性                   |
| placeholder-style       | String  |               | 指定 placeholder 的样式，仅支持 color 属性                    |
| disabled                | Boolean | `false`       | 是否禁用                                                    |
| maxlength               | Number  | `140`         | 最大输入长度，设置为 -1 的时候不限制最大长度                     |
| auto-focus              | Boolean | `false`       | (即将废弃，请直接使用 focus )自动聚焦，拉起键盘                  |
| focus                   | Boolean | `false`       | 获取焦点                                                    |
| auto-height             | Boolean | `false`       | 是否自动增高，设置 auto-height 时，style.height不生效          |
| confirm-type            | String  | `done`        | 设置键盘右下角按钮的文字，不支持 `return`                       |
| confirm-hold            | Boolean | `false`       | 点击键盘右下角按钮时是否保持键盘不收起                           |
| cursor                  | Number  |               | 指定 focus 时的光标位置                                      |
| cursor-color            | String  |               | 光标颜色                                                    |
| selection-start         | Number  | `-1`          | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用         |
| selection-end           | Number  | `-1`          | 光标结束位置，自动聚集时有效，需与 selection-start 搭配使用       |
| enable-offset          | Number  | `false`   | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|

事件

| 事件名                | 说明                                                                               |
| ---------------------| ---------------------------------------------------------------------------------- |
| bindinput            | 键盘输入时触发，event.detail = { value, cursor }，不支持 `keyCode`                     |
| bindfocus            | 输入框聚焦时触发，event.detail = { value }，不支持 `height`                            |
| bindblur             | 输入框失去焦点时触发，event.detail = { value }，不支持 `encryptedValue`、`encryptError` |
| bindconfirm          | 点击完成按钮时触发，event.detail = { value }                                          |
| bindlinechange       | 输入框行数变化时调用，event.detail = { height: 0, lineCount: 0 }，不支持 `heightRpx`    |
| bind:selectionchange | 选区改变事件, {selectionStart, selectionEnd}                                         |

方法

可通过 `ref` 方式调用以下组件实例方法

| 方法名                | 说明                                 |
| ---------------------| ----------------------------------- |
| focus                | 使输入框得到焦点                       |
| blur                 | 使输入框失去焦点                       |
| clear                | 清空输入框的内容                       |
| isFocused            | 返回值表明当前输入框是否获得了焦点        |


##### picker-view
嵌入页面的滚动选择器。其中只可放置 picker-view-column组件，其它节点不会显示

属性

| 属性名                   | 类型               | 默认值              | 说明                                 |
| ----------------------- | ------------------| ------------------ | ------------------------------------|
| value                   | Array[number]      | `false`           | 数组中的数字依次表示 picker-view 内的 picker-view-column 选择的第几项（下标从 0 开始），数字大于 picker-view-column 可选项长度时，选择最后一项。                    |


事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindchange      | checkbox-group 中选中项发生改变时触发 change 事件，detail = { value: [ 选中的 checkbox 的 value 的数组 ] } |

##### picker-view-column
滚动选择器子项。仅可放置于picker-view中，其孩子节点的高度会自动设置成与picker-view的选中框的高度一致


##### picker
从底部弹起的滚动选择器。

属性

| 属性名                  | 类型         | 默认值             | 说明                           |
| -----------------------| ------------| ------------------ | -----------------------------|
| mode                   | string      | `selector`         | 选择器类型                     |
| disabled               | boolean     | `false`            | 是否禁用                       |

公共事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| bindcancel      | 取消选择时触发       |
| bindchange      | 滚动选择时触发change事件，event.detail = {value}；value为数组，表示 picker-view 内的 picker-view-column 当前选择的是第几项（下标从 0 开始）|

##### 普通选择器：mode = selector

属性

| 属性名                  | 类型                     | 默认值         | 说明                           |
| -----------------------| ------------------------| ------------- | -----------------------------|
| range                  | array[object]/array     | `[]`          | mode 为 selector 或 multiSelector 时，range 有效 |
| range-key              | string                  | `false`       | 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器显示内容 |
| value                  | number                  | 0             | 表示选择了 range 中的第几个（下标从 0 开始）|

##### 多列选择器：mode = multiSelector
属性

| 属性名                  | 类型                     | 默认值         | 说明                           |
| -----------------------| ------------------------| ------------- | -----------------------------|
| range                  | array[object]/array     | `[]`          | mode 为 selector 或 multiSelector 时，range 有效 |
| range-key              | string                  | `false`       | 当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值作为选择器显示内容 |
| value                  | array                   | `[]`          | 表示选择了 range 中的第几个（下标从 0 开始）|
| bindcolumnchange       |                         |               | 列改变时触发|

##### 多列选择器：时间选择器：mode = time
属性

| 属性名                  | 类型                     | 默认值         | 说明                           |
| -----------------------| ------------------------| ------------- | -----------------------------|
| value                  | string                  | `[]`          | 表示选中的时间，格式为"hh:mm" |
| start                  | string                  | `false`       | 表示有效时间范围的开始，字符串格式为"hh:mm" |
| end                    | string                   | `[]`         | 表示有效时间范围的结束，字符串格式为"hh:mm"|

##### 多列选择器：时间选择器：mode = date
属性

| 属性名                  | 类型                     | 默认值         | 说明                                      |
| -----------------------| ------------------------| ------------- | ------------------------------------------|
| value                  | string                  | `当天`         | 表示选中的日期，格式为"YYYY-MM-DD"            |
| start                  | string                  | `false`       | 表示有效日期范围的开始，字符串格式为"YYYY-MM-DD" |
| end                    | string                   | `[]`         | 表示有效日期范围的结束，字符串格式为"YYYY-MM-DD" |
| fields                 | string                   | `day`        | 有效值 year,month,day，表示选择器的粒度        |

##### fields 有效值：
| 属性名                  | 说明                     |
| -----------------------| ------------------------ | 
| year                   | 选择器粒度为年             | 
| month                  | 选择器粒度为月份           |
| day                   | 选择器粒度为天              |

##### 省市区选择器：mode = region
属性

| 属性名                  | 类型                     | 默认值         | 说明                                      |
| -----------------------| ------------------------| ------------- | ------------------------------------------|
| value                  | array                   | `[]`          | 表示选中的省市区，默认选中每一列的第一个值       |
| custom-item            | string                  |               | 可为每一列的顶部添加一个自定义的项              |
| level                  | string                  | `region`      | 选择器层级                                  |

##### level 有效值：
| 属性名                  | 说明                     |
| -----------------------| ------------------------ | 
| province               | 选省级选择器               | 
| city                   | 市级选择器                 |
| region                 | 区级选择器                 |

##### image
图片。

属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| src                     | String  | `false`       | 图片资源地址，支持本地图片资源及 base64 格式数据，暂不支持 svg 格式 |
| mode                    | String  | `scaleToFill` | 图片裁剪、缩放的模式，适配微信 image 所有 mode 格式              |
| enable-offset          | Number  | `false`   | 设置是否要获取组件的布局信息，若设置了该属性，会在 e.target 中返回组件的 offsetLeft、offsetWidth 信息|

事件

| 事件名           | 说明                                                 |
| ----------------| --------------------------------------------------- |
| binderror       | 当错误发生时触发，event.detail = { errMsg }            |
| bindload        | 当图片载入完毕时触发，event.detail = { height, width }  |

注意事项

1. image 组件默认宽度320px、高度240px
2. image 组件进行缩放时，计算出来的宽高可能带有小数，在不同webview内核下渲染可能会被抹去小数部分


##### canvas
画布


属性

| 属性名                   | 类型     | 默认值         | 说明                                                       |
| ----------------------- | ------- | ------------- | ---------------------------------------------------------- |
| value	    | String  |               | radio 标识，当该 radio 选中时，radio-group 的 change 事件会


注意事项

1. 仅支持 type 为 2D
1. image 组件进行缩放时，计算出来的宽高可能带有小数，在不同webview内核下渲染可能会被抹去小数部分

#### 自定义组件

#### 样式规则

#### 应用能力

#### 环境API

#### Webview API

#### 其他使用限制
如事件的target等





