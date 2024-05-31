# Mpx转RN样式使用指南
RN 的样式的支持基本为 web 样式的一个子集，同时还有一些属性并未与 web 对齐，因此跨平台输出 RN 时，为了保障多端输出样式一致，可参考本文针对样式在RN上的支持情况来进行样式编写。

## 样式编写限制
### 选择器
RN仅支持以下类选择器，且不支持组合选择器。
``` css
/* 支持 */
.classname {
  color: red
}
.test1, .test2 {
    color: red
}
/* 不支持 */
.A-test .a-test{
    color: red
}
```

### 布局限制
在 RN 中布局方式有限制，像 block inline inline-block 和 fixed 等都不支持，支持的布局方式如下：
#### flex
在RN中，常规的组件元素可以用过 flex 布局来实现，参考文档 https://reactnative.dev/docs/layout-props#flex。
注：RN中 view 标签的主轴是 column，和 css 不一致，使用 mpx 开发会进行抹平，默认的主轴方向是 row。
#### relative/absolute
在 RN 中 position 仅支持 relative（默认）和 absolute，可[参考文档](https://reactnative.dev/docs/layout-props#position)。

### 样式单位限制
#### number 类型值
RN 环境中，number 数值型单位支持 px rpx % 三种，web 下的 vw em rem 等不支持。
#### color 类型值
RN 支持的 color 值的类型参考 RN 文档 https://reactnative.dev/docs/colors

## 组件样式规则
（特定组件我们添加的默认样式及样式增强，如 view/text/image 等）
### text @qunfeng
#### 文本节点说明
在RN中，文本节点通常用来显示文本内容，可以通过 <Text> 组件来创建文本节点。文本节点可以包含文字、数字等内容，并且支持一些样式属性来调整文本的外观。可通过`style`属性设置样式。文本的样式列表可[参考这里](https://reactnative.dev/docs/layout-props#position)

#### 文本节点text与样式继承
在RN中，文本会有继承性，父节点的样式可以继承到子节点。详情可参考[这里](https://medium.com/@fullsour/style-inheritance-of-react-native-eca1c974f02b).
在mpx中，在遵循上面的原则，如果要避免默认样式的影响，可把`disable-default-style`设置为`true`

#### view标签内的文本添加text包裹
在 RN 中，文本必须要 Text 节点包裹，否则会报错。mpx 会在编译时，为文本添加 Text 节点，可以看如下的例子:
```js
<view>Hello World!</view>
```
`编译后`
```js
<View><Text>Hello World!</Text></View>
```
#### view内设定的文本类样式会下沉设置到text标签内
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

### view @qunfeng
 为了对齐 RN 和 web 的展示效果，当`display`为`flex`时，会添加如下的默认属性:
 ```css
  flex-direction: 'row';
  flex-basis: 'auto';
  flex-shrink: 1;
  flex-wrap: 'nowrap';
 ```

### image
为了对齐 RN 和 web 的展示效果，我们给 image 组件增加了以下默认样式：
```css
width: 320px;
height: 240px;
```

### button
为了对齐 RN 和 web 的展示效果，我们给 button 组件增加了以下默认样式：
```css
width: 100%;
justifyContent: 'center';
alignItems: 'center';
height: 46;
borderRadius: 5;
backgroundColor: '#F8F8F8';
/* 按钮默认居中 */
marginHorizontal: 'auto';
```

## 样式参考
（css视角我们支持的所有样式属性的展开说明，支持的缩写形式也放在这部分里）
### Layout Style @qunfeng
#### position
设置元素的定位样式
**值支持类型**
enum: absolute, relative， 默认relative。
##### 语法
``` css
position: absolute;
```
#### top|right|left|bottom
设置元素的不同方向的偏移量
##### 值支持类型
number: px,rpx,%
##### 语法
``` css
top: 10px
```
#### z-index
控制着元素的堆叠覆盖顺序。
##### 值支持类型
number
##### 语法
``` css
z-index: 2;
```
#### display
设置元素的布局方式。
##### 值支持类型
flex/none
##### 语法
``` css
/* 默认 */ 
display:flex
/* 隐藏 */
display:none
```
#### align-content
设置多根轴线的对齐方式。
##### 值支持类型
enum:flex-end, center, stretch, space-between, space-around
##### 语法
``` css
align-content: center
```
#### align-items
设置单根轴线上的子元素的对齐方式。默认会是交叉轴上的。
##### 值支持类型
enum:flex-end, center, stretch, space-between, space-around
##### 语法
``` css
align-content: center
```
#### align-self
设置单个子元素在单根轴线上的对齐方式
##### 值支持类型
enum: auto, flex-start, flex-end, center, stretch, baseline
##### 语法
``` css
align-self: center
```
#### flex
仅支持 flex-grow | flex-shrink | flex-basis 这种顺序，值以空格分隔按顺序赋值
##### 值支持类型
flex: number number px/rpx
##### 语法
``` css
flex: 0 1 1;
flex: 1;
flex: 1 0;
```
#### flex-grow
设置子盒子的放大比例
##### 值支持类型
number
##### 语法
```css
flex-grow: 1;
```
#### flex-shrink
设置子盒子的缩放比例。
##### 值支持类型
number
##### 语法
```css
flex-shrink: 1;
```
#### flex-basis
设置在分配多余空间之前，子盒子的初始主轴尺寸。
##### 值支持类型
number px|rpx|%
##### 语法
``` css
flex-shrink: 10px;
```
#### flex-direction
设置主轴的方向。
##### 值支持类型
enum: row, row-reverse, column, column-reverse
##### 语法
``` css
flex-direction: column;
```
#### flex-wrap
设置元素是否换行。
##### 值支持类型
enum: wrap, nowrap, wrap-reverse
##### 语法
``` css
flex-wrap: wrap;
```
#### flex-flow
flex-direction flex-wrap 缩写，仅支持 flex-flow: flex-direction flex-wrap 这种顺序，值以空格分隔按顺序赋值
```css
flex-flow: row;
flex-flow: row no-wrap;
```

### View Style @qunfeng
#### margin
margin 是 margin-top|margin-right|margin-left|margin-bottom 的缩写模式, 目前仅支持四种缩写模式
##### 值支持类型
string: 'auto'
number: rpx，px, %
##### 语法
``` css
/* all */
margin: 2px;

/* top and bottom | left and right */
margin: 5% auto;

/* top | left and right | bottom */
margin: 1rpx auto 2rpx;

/* top | right | bottom | left */
margin: 1rpx 2rpx 2rpx ;
```
#### margin-top|margin-bottom|margin-right|margin-left
##### 值支持类型
number: rpx，px, %
##### 语法
``` css
margin-top: 2px;
margin-top: 2rpx;
margin-top: 10%;
```
#### padding
padding是padding-left、padding-right、padding-left、padding-bottom的缩写模式, 目前仅支持四种缩写模式。
##### 值支持类型
string: 'auto'
number: rpx，px, %
##### 语法
``` css
/* all */
padding: 2px;

/* top and bottom | left and right */
padding: 5% auto;

/* top | left and right | bottom */
padding: 1rpx auto 2rpx;

/* top | right | bottom | left */
padding: 1rpx 2rpx 2rpx ;
```
#### padding-top|padding-bottom|padding-left|padding-right
##### 值支持类型
number: rpx，px, %
##### 语法
``` css
padding-top: 2px;
padding-top: 2rpx;
padding-top: 10%;
```
#### border
border 是 border-width|border-style|border-color 的缩写模式, 目前仅支持 width | style | color 这种排序，值以空格分隔按顺序赋值
```css
/* width | style | color */
border: 1px solid red;
border: 1px;
border: 1px solid;
border: 1px double pink;
```
#### border-color
设置边框的颜色, 目前只支持统一设置，不支持缩写。
##### 值支持类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 语法
``` css
/* all border */
border-color: red;
```
#### border-style
设置边框的样式, 目前只支持统一设置，不支持缩写。
##### 值支持类型
enum: solid|dotted|dashed
##### 语法
``` css
/* all border */
border-color: 'solid';
```
#### border-width
设置边框的宽度，目前只支持统一设置，不支持缩写。
##### 值支持类型
number: px rpx %
##### 语法
``` css
/* all border */
border-width: 2px;
```
#### border-top-color|border-bottom-color|border-left-color|border-right-color
设置各边框的颜色
##### 值支持类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 语法
``` css
border-top-color: red;
```
#### border-top-width|border-bottom-width|border-left-width|border-right-width
设置各边框的宽度
##### 值支持类型
number: px rpx
##### 语法
``` css
border-top-width: 2px;
```
#### border-radius
设置border的圆角格式，支持一种缩写方式
##### 值支持类型
仅支持 border-radius 0px|border-radius 0px 0px 0px 0px（值以空格分隔按顺序赋值）
number: px rpx %
##### 语法
``` css
/* all */
border-radius: 2px;
/* top-left | top-right | bottom-right | bottom-left */
border-radius: 10px 10px 10px 0;
```
#### border-bottom-left-radius|border-bottom-right-radius|border-top-left-radius|border-top-right-radius
##### 值支持类型
number: px rpx %
##### 语法
``` css
border-bottom-left-radius: 2px;
```

### Text Style @qunfeng
#### color
##### 值支持类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 语法
``` css
color: orange;
color: #fff;
```
#### font-family
可设置系统字体，引入字体文件，暂时不支持。
##### 值支持类型
string
##### 语法
``` css
font-family: "PingFangSC-Regular"
```
#### font-size
可设置字体的大小
##### 值支持类型
number: px,rpx
##### 语法
``` css
font-size: 12px;
```
#### font-style
设置文本的字体样式。
##### 值支持类型
enum: normal，italic
##### 语法
``` css
font-style: italic;
```
#### font-weight
设置文字的权重。
##### 值支持类型
enum: 100，200，300，400，500，600，800，900,normal,bold
##### 语法
``` css
font-weight: 500;
```
#### font-variant
设置文本的字体变体
##### 值支持类型
enum: small-caps, oldstyle-nums, lining-nums, tabular-nums, proportional-nums
##### 语法
``` css
font-variant: lining-nums;
```
#### letter-spacing
定义字符之间的间距
##### 值支持类型
px,rpx,%
##### 语法
``` css
letter-spacing: 2px;
```
#### line-height
设置行高。
##### 值支持类型
px,rpx,%
##### 语法
``` css
line-height: 16px
```
#### text-align
设置文本的水平对齐方式。
##### 值支持类型
enum: auto, left, right, center, justify
##### 语法
``` css
text-align: center;
```
#### text-decoration-line
设置文本的装饰线样式。
##### 值支持类型
enum: none, underline, line-through, underline line-through
##### 语法
``` css
text-decoration-line: underline;
```
#### text-transform
设置文本的大小写转换。
##### 值支持类型
 enum: none, uppercase, lowercase, capitalize
##### 语法
``` css
text-transform: uppercase;
```
#### text-shadow
设置文本阴影
##### 值支持类型
仅支持 offset-x | offset-y | blur-radius | color 排序，值以空格分隔按顺序赋值
##### 语法
```css
text-shadow: 1rpx 3rpx 0 #2E0C02;
```

### Background Style
背景相关的属性
#### background-color
背景色
##### 值支持类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 语法
``` css
/* all border */
background-color: red;
```
#### background-image
背景图
##### 值支持类型
仅支持 <url()>
##### 语法
``` css
background-image: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg");

/* 不支持 */
background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
```
#### background-size
背景大小
##### 值支持类型
number 支持 px|rpx|%，枚举值支持 contain|cover|auto；
支持一个值:这个值指定图片的宽度，图片的高度隐式的为 auto；
支持两个值:第一个值指定图片的宽度，第二个值指定图片的高度；
不支持逗号分隔的多个值：设置多重背景!!!
##### 语法
``` css
/* 支持 */
background-size: 50%;
background-size: 50% 25%;
background-size: contain;
background-size: cover;
background-size: auto;
background-size: 20px auto;

/ * 不支持 * /
background-size: 50%, 25%, 25%;
```
#### background-repeat
背景图是否重复
##### 值支持类型
enum: no-repeat
##### 语法
``` css
background-repeat: no-repeat;

/* 不支持 */
background-repeat: repeat; 
```
#### background
背景
##### 值支持类型
仅支持 background-image | background-color | background-size | background-repeat，具体每个属性的支持情况参见上面具体属性支持的文档
##### 语法
```css
/* 支持 */
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink contain no-repeat;
background: #000;
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink;

/* 不支持 */
background: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
```

### Shadow Style
#### box-shadow
此属性是阴影颜色、阴影的偏移量
##### 值支持类型
仅支持 offset-x | offset-y | blur-radius | color 排序，值以空格分隔按顺序赋值
##### 语法
```css
/* offset-x | offset-y | blur-radius | color */
box-shadow: 0 1px 3px rgba(139,0,0,0.32);
```

## 附录
### RN 不支持的属性
若设置以下不支持的属性会被 mpx 编译处理时丢弃，有编译 error 提示
    
| 描述             | 不支持的属性                                                                          |
| -------------- | --------------------------------------------------------------------------------------|
| 双端都不支持    | box-sizing white-space text-overflow animation transition                              |
| ios 不支持     | vertical-align                                                                         |
| android 不支持 | text-decoration-style text-decoration-color shadow-offset shadow-opacity shadow-radius |
   
   
### RN 支持的枚举值
RN 支持的枚举值映射如下表，其他不支持的枚举值会被 mpx 编译处理时丢弃，设置无效

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

### 缩写支持
RN 仅支持部分常用的缩写形式，具体参加下表：

|缩写属性|支持的缩写格式|备注|
| --- | --- | --- |
|text-decoration|仅支持 text-decoration-line text-decoration-style text-decoration-color|顺序固定，值以空格分隔后按按顺序赋值|
|margin|margin: 0;margin: 0 auto;margin: 0 auto 10px;margin: 0 10px 10px 20px;|-|
|padding|padding: 0;padding: 0 auto;padding: 0 auto 10px;padding: 0 10px 10px 20px;|-|
|text-shadow|仅支持 offset-x offset-y blur-radius color 排序|顺序固定，值以空格分隔后按按顺序赋值|
|border|仅支持 border-width border-style border-color|顺序固定，值以空格分隔后按按顺序赋值|
|box-shadow|仅支持 offset-x offset-y blur-radius color|顺序固定，值以空格分隔后按按顺序赋值|
|flex|仅支持 flex-grow flex-shrink flex-basis|顺序固定，值以空格分隔后按按顺序赋值|
|flex-flow|仅支持 flex-direction flex-wrap|顺序固定，值以空格分隔后按按顺序赋值|
|border-radius|支持 border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius|顺序固定，值以空格分隔后按按顺序赋值；当设置 border-radius: 0 相当于同时设置了4个方向|
|background|仅支持 background-image  background-color background-size background-repeat|顺序不固定，具体每个属性的支持情况参见上面具体属性支持的文档；background-size 缩写仅支持枚举值不支持 number 值
