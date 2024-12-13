# Mpx转RN样式使用指南
RN 的样式的支持基本为 web 样式的一个子集，同时还有一些属性并未与 web 对齐，因此跨平台输出 RN 时，为了保障多端输出样式一致，可参考本文针对样式在RN上的支持情况来进行样式编写。

## 样式编写限制

### 选择器
RN 环境下仅支持以下类名选择器，不支持逗号之外的组合选择器。
``` css
/* 支持 */
.classname {
  color: red
}
.classA, .classB {
    color: red
}
```

### 布局
在 RN 中布局方式有限制，像 block inline inline-block 和 fixed 等都不支持，支持的布局方式如下：
#### flex
在RN中，常规的组件元素可以用过 flex 布局来实现，[参考文档](https://reactnative.dev/docs/layout-props#flex)。

**注**：RN中view标签的主轴是column，和css不一致，使用mpx开发设置`dispay:flex`时，会默认的主轴方向是row。

#### relative/absolute
在 RN 中 position 仅支持 relative（默认）和 absolute，可[参考文档](https://reactnative.dev/docs/layout-props#position)。

### 样式单位
#### number 类型值
RN 环境中，number 数值型单位支持 px rpx % 三种，web 下的 vw em rem 等不支持。
#### color 类型值
RN 环境支持大部分 css 中 color 定义方式，仅少量不支持，详情参考 RN 文档 https://reactnative.dev/docs/colors

## 组件样式规则
在web和RN下组件的渲染会存在一些差异的地方，比如默认样式不一致、继承的关系不一致等。框架针对这些不一致进行了抹平工作，但是仍旧存在一些使用限制，具体参考以下组件节点的介绍。

### text
RN中，文本节点需要通过Text组件来创建文本节点。文本节点需要给Text组件来设定[属性](https://reactnative.dev/docs/text-style-props)来调整文本的外观。

Web/小程序中，文本节点可以通过div/view节点进行直接包裹，在div/view标签上设定对应文本样式即可。不需单独包裹text节点。

框架抹平了此部分的差异，但仍因受限于RN内text的样式[继承原则的限制](https://reactnative.dev/docs/text#limited-style-inheritance)，通过在祖先节点来设置文本节点的样式仍旧无法生效。具体例子说明如下

``` html
<view class="wrapper">
    <view class="content">我是文本</view>
</view>

.wrapper {
    font-size: 20px;
}
.content {
    text-align: right;
}
/** 以上例子中
web渲染效果: 字体的大小为20px，文字居右 
转RN之后渲染效果: 字体大小为默认大小，文字居右
*/

```
**限制与使用说明**
1. 无法通过设置祖先节点的样式来修改文本节点的样式，只可通过修改直接包裹文本的节点来修改文本的样式。
2. 框架处理将文本节点样式的默认值与web进行了对齐，如果需要按照RN的默认值来进行渲染，可设置`disable-default-style`为`true`

### view

background、background-image、background-size、background-repeat仅在view标签下支持，background-color在其他标签上也支持。

**各属性支持的类型**

* background - 仅支持 background-image | background-color | background-size | background-repeat，每个属性支持情况，可参考下面的介绍。
* background-image - 仅支持 <url()>。
* background-size - 支持px|rpx|%，也支持枚举值 contain|cover|auto； 不支持两个以上的值进行设置。
* backgroundno-repeat - 仅支持值为no-repeat。
* backfround-color - 参考[Color](https://reactnative.dev/docs/colors)


**支持的语法**

``` css

/** 1. background **/
/* 支持 */
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink contain no-repeat;
background: #000;
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink;

/* 不支持 */
background: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));


/** 2. background-image **/
/* 支持 */
background-image: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg");
/* 不支持 */
background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));


/** 3. background-size **/
/* 支持 */
background-size: 50%;
background-size: 50% 25%;
background-size: contain;
background-size: cover;
background-size: auto;
background-size: 20px auto;

/ * 不支持 * /
background-size: 50%, 25%, 25%;


/** 4. background-repeat **/
/* 支持 */
background-repeat: no-repeat;

/* 不支持 */
background-repeat: repeat;


/** 5. background-color **/
background-repeat: red;
```

## 样式参考
### Layout Style
#### position
设置元素的定位样式
**值支持类型**
enum: absolute, relative， 默认relative。
##### 语法
``` css
position: absolute;
position: relative;

```
#### top|right|left|bottom
设置元素的不同方向的偏移量
##### 值支持类型
number: px,rpx,%
##### 语法
``` css
top: 10px;
top: 10rpx;
top: 10%;
```
#### z-index
控制着元素的堆叠覆盖顺序。
##### 值支持类型
number
##### 语法
``` css
z-index: 1;
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
enum: flex-start, flex-end, center, stretch, space-between, space-around, space-evenly
##### 语法
``` css
/** 支持 **/
align-content: flex-start;
align-content: flex-end;
align-content: center;
align-content: stretch;
align-content: space-between;
align-content: space-around;
align-content: space-evenly;

/** 不支持 **/
align-content: safe center;
align-content: unsafe center;
```
#### align-items
设置单根轴线上的子元素的对齐方式。默认会是交叉轴上的。
##### 值支持类型
enum: flex-start, flex-end, center, stretch, baseline
##### 语法
``` css
/** 支持 **/
align-items: flex-start;
align-items: flex-end;
align-items: center;
align-items: stretch;
align-items: baseline;

/** 不支持 **/
align-items: first baseline;
align-items: last baseline;
```
#### align-self
设置单个子元素在单根轴线上的对齐方式
##### 值支持类型
enum: auto, flex-start, flex-end, center, stretch, baseline
##### 语法
``` css
/** 支持 **/
align-self: auto;
align-self: flex-start;
align-self: flex-end;
align-self: center;
align-self: stretch;
align-self: baseline;

/** 不支持 **/
align-self: first baseline;
align-self: last baseline;
```
#### flex
仅支持 flex-grow | flex-shrink | flex-basis 这种顺序，值以空格分隔按顺序赋值
##### 值支持类型
flex: number number px/rpx
##### 语法
``` css
/** 简写 **/
flex: 1;
/* flex-grow | flex-shrink | flex-basis */
flex: 0 1 1;
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
flex-shrink: 10rpx;
flex-shrink: 20%;
```
#### flex-direction
设置主轴的方向。
##### 值支持类型
enum: row, row-reverse, column, column-reverse
##### 语法
``` css
flex-direction: row;
flex-direction: row-reverse;
flex-direction: column;
flex-direction: column-reverse;

```
#### flex-wrap
设置元素是否换行。当值为wrap时，alignItems：center不生效。 
##### 值支持类型
enum: wrap, nowrap, wrap-reverse
##### 语法
``` css
flex-wrap: wrap;
flex-wrap: nowrap;
flex-wrap: wrap-reverse;
```
#### flex-flow
是flex-direction flex-wrap 缩写，仅支持 flex-flow: flex-direction flex-wrap 这种顺序，值以空格分隔按顺序赋值
```css
/* flex-direction */
flex-flow: row;
/* flex-direction|  flex-wrap*/
flex-flow: row nowrap;
```

### View Style
#### margin
margin 是 margin-top|margin-right|margin-left|margin-bottom 的缩写模式, 目前仅支持四种缩写模式。
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
padding: 5% 10%;

/* top | left and right | bottom */
padding: 1rpx 0 2rpx;

/* top | right | bottom | left */
padding: 1rpx 2rpx 2rpx ;
```
#### padding-top|padding-bottom|padding-left|padding-right
##### 值支持类型
number: rpx，px, %
##### 语法
``` css
/** padding-top **/
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
/** 支持 **/
border-color: red;
```
#### border-style
设置边框的样式, 目前只支持统一设置，不支持缩写。
##### 值支持类型
enum: solid|dotted|dashed
##### 语法
``` css
/** 支持 **/
/* all border */
border-color: 'solid';
border-color: 'dotted';
border-color: 'dashed';

/** 不支持 **/
border-style: double;
border-style: groove;
border-style: ridge;
border-style: dotted solid;
border-style: hidden double dashed;
border-style: none solid dotted dashed;
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

### Text Style
#### color
##### 值支持类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 语法
``` css
color: orange;
color: #fff;
color: #fafafa;
color: rgb(255, 255, 255);
color: rgba(255, 99, 71, 0.2)
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
font-size: 12rpx;
```
#### font-style
设置文本的字体样式。
##### 值支持类型
enum: normal，italic
##### 语法
``` css
font-style: italic;
font-style: normal;
```
#### font-weight
设置文字的权重。
##### 值支持类型
enum: 100，200，300，400，500，600，800，900,normal,bold
##### 语法
``` css
font-weight: 100;
font-weight: 200;
font-weight: 300;
font-weight: 400;
font-weight: 500;
font-weight: 600;
font-weight: 700;
font-weight: 800;
font-weight: 900;

font-weight: normal;
font-weight: bold;
```
#### font-variant
设置文本的字体变体
##### 值支持类型
enum: small-caps, oldstyle-nums, lining-nums, tabular-nums, proportional-nums
##### 语法
``` css
font-variant: small-caps;
font-variant: oldstyle-nums;
font-variant: lining-nums;
font-variant: tabular-nums;
font-variant: lining-nums;
font-variant: proportional-nums;
```
#### letter-spacing
定义字符之间的间距
##### 值支持类型
px,rpx
##### 语法
``` css
letter-spacing: 2px;
letter-spacing: 2rpx;
```
#### line-height
设置行高。
##### 值支持类型
px,rpx,%
##### 语法
``` css
line-height: 16px
line-height: 16rpx
line-height: 100%
line-height: 1
```
#### text-align
设置文本的水平对齐方式。
##### 值支持类型
enum: left, right, center, justify
##### 语法
``` css
/** 支持 **/
text-align: left;
text-align: right;
text-align: center;
text-align: justify;

/** 不支持 **/
text-align: match-parent;
text-align: auto;
text-align: justify-all;
```
#### text-decoration-line
设置文本的装饰线样式。
##### 值支持类型
enum: none, underline, line-through, underline line-through
##### 语法
``` css
/** 支持 **/
text-decoration-line: none;
text-decoration-line: underline;
text-decoration-line: line-through;
text-decoration-line: underline line-through;

/** 不支持 **/
text-decoration-line: overline;
```
#### text-transform
设置文本的大小写转换。
##### 值支持类型
 enum: none, uppercase, lowercase, capitalize
##### 语法
``` css
/** 支持 **/
text-transform: none;
text-transform: uppercase;
text-transform: lowercase;
text-transform: capitalize;

/** 不支持 **/
text-transform: none;
text-transform: uppercase;
text-transform: lowercase;
text-transform: capitalize;
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
表示背景色，可以在任何标签上使用。
##### 值支持类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 语法
``` css
/* all border */
background-color: red;
```
#### background-image
表示背景图，只能在view上使用
##### 值支持类型
仅支持 <url()>
##### 语法
``` css
background-image: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg");

/* 不支持 */
background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
```
#### background-size
表示背景大小，只能在view上使用
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
表示背景图是否重复，只能在view上使用
##### 值支持类型
enum: no-repeat
##### 语法
``` css
background-repeat: no-repeat;

/* 不支持 */
background-repeat: repeat; 
```
#### background
表示背景的组合属性，只能在view上使用
##### 值支持类型
仅支持 background-image | background-color | background-size | background-repeat，具体每个属性的支持情况参见上面具体属性支持的文档
##### 语法
```css
/* 支持 */
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink no-repeat;
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
|background|仅支持 background-image  background-color background-repeat|顺序不固定，具体每个属性的支持情况参见上面具体属性支持的文档；
