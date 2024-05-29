# Mpx转RN样式使用指南

React Native的样式的支持基本为web样式的一个子集，同时还有一些属性并未与Web对齐，因此跨平台输出RN时，为了保障多端输出样式一致，可参考本文针对样式在RN上的支持情况来进行样式编写。

## 布局说明 尚群峰
### flex布局
在React Native中，可以通过Flexbox规则来布局组件元素。基于yoga布局引擎实现，可查看[文档](https://github.com/facebook/yoga)。

注：RN中View标签的主轴是column，和css不一致，使用mpx开发会进行磨平，默认的主轴方向是row。

### position布局
在RN中position仅支持relative（默认）和 absolute。可[参考文档](https://reactnative.dev/docs/layout-props#position)。


## 选择器
RN仅支持以下类选择器，且不支持组合选择器。

``` css
// 只支持如下方式
.classname {
  color: red
}
```

## 样式规则
Mpx框架为了尽可能的将小程序/Web上编写的样式转换为适配RN的样式，进行了一系列的样式转换规则。同时RN在很多样式属性的默认值上与Web并未对齐，因此框架也支持了部分属性的默认值与Web对齐的工作。

### 转换规则
mpx 主要处理了以下几种样式转换规则：
1. 属性名称由中划线-转为驼峰
2. rpx 单位的转换
3. css 简写的转换
4. 不支持的属性过滤（会被 mpx 编译处理时丢弃，有编译 error提示）
    - 双端都不支持的 prop <br/>
    box-sizing|white-space|text-overflow|animation|transition|
    - ios 不支持的 prop <br/>
    vertical-align
    - android 不支持的 prop <br/>
    text-decoration-style|text-decoration-color|shadow-offset|shadow-opacity|shadow-radius
5. 属性不支持的枚举值过滤
rn支持的枚举值映射如下表，其他不支持的枚举值会被 mpx 编译处理时丢弃，设置无效

    |prop|value 枚举|
    | --- | --- |
    |overflow|visible hidden scroll|
    |border-style|solid dotted dashed|
    |display|flex none|
    |pointer-events|auto none|
    |position|relative absolute|
    |vertical-align|auto top bottom center|
    |font-variant|small-caps oldstyle-nums lining-nums tabular-nums proportional-nums
    |text-align|left right center justify|
    |font-style|normal italic|
    |font-weight|normal bold 100-900|
    |text-decoration-line|none underline line-through 'underline line-through'|
    |text-transform|none uppercase lowercase capitalize|
    |user-select|auto text none contain all|
    |align-content|flex-start flex-end none center stretch space-between space-around|
    |align-items|flex-start flex-end center stretch baseline|
    |align-self|auto flex-start flex-end center stretch baseline|
    |justify-content|flex-start flex-end center space-between space-around space-evenly none|
    |background-repeat|no-repeat|
#### 单位支持
- number
  - 大小宽高类数值型单位支持 px rpx % 三种
- color
  - 支持的 color 值的类型参考rn文档 https://reactnative.dev/docs/colors
#### 缩写支持
- text-decoration
  - 仅支持 text-decoration-line text-decoration-style text-decoration-color 这种顺序，值以空格分隔按顺序赋值
- margin|padding
  - 支持 margin: 0/margin: 0 auto/margin: 0 auto 10px/margin: 0 10px 10px 20px/这四种格式
- text-shadow
  - 仅支持 offset-x | offset-y | blur-radius | color 排序，值以空格分隔按顺序赋值
- border
  - 仅支持 width | style | color 这种排序，值以空格分隔按顺序赋值
- box-shadow
  - 仅支持 offset-x | offset-y | blur-radius | color 排序，值以空格分隔按顺序赋值
- flex
  - 仅支持 flex-grow | flex-shrink | flex-basis 这种顺序，值以空格分隔按顺序赋值
- flex-flow
  - 仅支持 flex-flow: flex-direction flex-wrap 这种顺序，值以空格分隔按顺序赋值
- border-radius
  - 仅支持 border-radius 0px/border-radius 0px 0px 0px 0px（值以空格分隔按顺序赋值）

### 样式增强
#### text  尚群峰
##### 文本节点说明

在RN中，文本节点通常用来显示文本内容，可以通过 <Text> 组件来创建文本节点。文本节点可以包含文字、数字等内容，并且支持一些样式属性来调整文本的外观。可通过`style`属性设置样式。文本的样式列表可[参考这里](https://reactnative.dev/docs/layout-props#position)
##### 文本节点text与样式继承

在RN中，文本会有继承性，父节点的样式可以继承到子节点。详情可参考[这里](https://medium.com/@fullsour/style-inheritance-of-react-native-eca1c974f02b).
在mpx中，在遵循上面的原则，如果要避免默认样式的影响，可把`disable-default-style`设置为`true`

##### view标签内的文本添加text包裹


在RN中，文本必须要Text节点包裹，否则会报错。mpx会在编译时，为文本添加Text节点，可以看如下的例子:


```js
<view>Hello World!</view>
```

`编译后`

```js
<View><Text>Hello World!</Text></View>
```

##### view内设定的文本类样式会下沉设置到text标签内


在小程序中，view的部分样式会被text组件继承，RN中是不会继承。为实现这个效果，会把文本样式传到Text组件上。如何实例：



```js
<view class="box">Hello World!</view>

.box {
  width: 100px
  height: 100px;
  font-size: 15px;
  font-weight: 700;
}
```

`编译后`

```js
<View style="{{width: 100, height: 100 }}">
  <Text style="{{ fontSize: 15, fontWeight: 700}}">Hello World!<Text>
</View>
```

#### 图片 华静文
#### button 华静文
#### 图片
为了对齐rn和web的展示效果，我们给 Image 组件增加了以下默认样式：
```javascript
{
    width: 320px,
    height: 240px
}
```
#### button
为了对齐rn和web的展示效果，我们给 button 组件增加了以下默认样式：
```javascript
{
    width: 100%,
    justifyContent: 'center',
    alignItems: 'center',
    height: 46,
    borderRadius: 5,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 'auto' // 按钮默认居中
}
```
#### view 尚群峰

 为了对齐rn和web的展示效果，当`display`为`flex`时，会添加如下的默认属性:
 ```js
  flexDirection: 'row',
  flexBasis: 'auto',
  flexShrink: 1,
  flexWrap: 'nowrap'
 ```


## 各属性支持情况
如下为Web Css的属性在转RN后的支持情况,不在此范围内的属性因受限于RN的现状情况也未做支持。

> tips:不支持转换的属性在编译输出阶段会进行warning提示

### flex布局 群峰
#### flex

|属性|支持的value|
| --- | --- | 
|display|仅支持 `none`, `flex`| 
|align-content|仅支持 `flex-end`, `center`, `stretch`, `space-between`, `space-around`| 
|align-items| 仅支持 `flex-start`, `flex-end`, `center`, `stretch`, `baseline`|
|align-self| 仅支持 `auto`, `flex-start`, `flex-end`, `center`, `stretch`, `baseline` | 
|flex |  支持`flex 1`; 也可 `flex 1 20 10px`，内部会进行转换为flexGrow,flexShrink,flexBasis  |
|flex-shrink| `number`  |
|flex-basis| 支持`px`，`rpx`单位 | 
|flex-direction| `row`, `row-reverse`, `column`, `column-reverse` | 
|flex-grow| `number` | 
|flex-wrap	| 仅支持`wrap`, `nowrap`, `wrap-reverse`, `注意`： wrap时，alignItems：center不生效。 |

### position布局 群峰

|属性|支持的value|
| --- | --- | 
|position|仅支持`absolute`, `relative`， 默认是relative| 
|top|number| 
|right|number| 
|bottom|number| 
|z-index|number| 

### 背景相关 群峰再补充一下
在 view 组件上可以定义一下 background 相关属性：

|属性|支持的value|
| --- | --- |
|background-image|仅支持 <url()>|
|background-color|支持的颜色值类型参见【单位支持】的 color 部分|
|background-size|支持一个值:这个值指定图片的宽度，图片的高度隐式的为 auto；支持两个值:第一个值指定图片的宽度，第二个值指定图片的高度；值类型支持枚举值 cover contain auto 以及number类型单位 rpx px %；不支持逗号分隔的多个值：设置多重背景!!!|
|background-repeat|仅支持 no-repeat|
|background|该简写属性仅支持以上属性，需要注意的是在 background 简写中仅支持 background-size 的枚举值 contain、cover、auto，rpx、px、% number类型值不支持|

### 阴影
|属性|支持的value|
| --- | --- |
|background-image|仅支持 <url()>|
|background-color|支持的颜色值类型参见【单位支持】的 color 部分|
|background-size|支持一个值:这个值指定图片的宽度，图片的高度隐式的为 auto；支持两个值:第一个值指定图片的宽度，第二个值指定图片的高度；值类型支持枚举值 cover contain auto 以及number类型单位 rpx px %；不支持逗号分隔的多个值：设置多重背景!!!|
|background-repeat|仅支持 no-repeat|
|background|该简写属性仅支持以上属性，需要注意的是在 background 简写中仅支持 background-size 的枚举值 contain、cover、auto，rpx、px、% number类型值不支持|

### 文本相关 群峰

|属性|支持的value|
| --- | --- | 
|color| 支持英文颜色，rgb，rgba等可参考[这里](https://reactnative.dev/docs/colors) |
|font-family| 可设置系统字体，引入字体文件，暂时不支持。| 
|font-size	| 支持`px`,`rpx` | 
|font-style	| 支持 `normal`，`italic` | 
|font-weight| 仅支持`100`, `200`, `300`, `400`, `500`, `600`, `800`, `900` | 
|font-variant	| 支持 `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | 
|letter-spacing	| `number` | 
|line-height	| 支持 `px`,`rpx`,`number`,`%` | 
|text-align	| 支持 `auto`, `left`, `right`, `center`, `justify` | 
|text-decoration-line	| 支持 `none`, `underline`, `line-through`, `underline line-through` | 
|text-transform	| `none`, `uppercase`, `lowercase`, `capitalize` | 


### 边距与border

|属性|支持的value|
| --- | --- | 
|margin| number,string |
|margin-top| 支持 | 
|margin-left|支持| 
|margin-bottom| 支持| 
|margin-right| 支持| 
|padding| 支持 |
|padding-top| 支持| 
|padding-left| 支持| 
|padding-bottom| 支持| 
|border-bottom-color| 支持| 
|border-bottom-width| 支持| 
|border-left-color|支持 | 
|border-left-width| 支持| 
|border-right-color|支持 | 
|border-right-width| 支持| 
|border-top-color|支持 | 
|border-top-width| 支持| 
|border-color |仅支持设置 color 不支持缩写|
|border-style |仅支持设置 'solid', 'dotted', 'dashed',不支持缩写|
|border-width |仅支持number，不支持缩写|
|border |支持 width style color的缩写模式 |
|border-radius| 支持width, 支持一个缩写模式|


#### margin
#### margin-top
#### margin-bottom
#### margin-left
#### margin-right
#### padding
#### padding-top
#### padding-bottom
#### padding-left
#### padding-right

#### border
border是border-width、border-style、border-color的缩写模式, 目前仅支持一种缩写模式

__语法__

``` css
/* width | style | color */
border: 1px solid red;
```

#### border
border是border-width、border-style、border-color的缩写模式, 目前仅支持一种缩写模式。

__语法__

``` css
/* width | style | color */
border: 1px solid red;
```
