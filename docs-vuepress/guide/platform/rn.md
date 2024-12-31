# 跨端输出RN
大致介绍

## 跨端样式定义
RN 样式属性和 CSS 样式属性是相交关系，RN 有少部分样式属性（比如 tintColor、writingDirection 等） CSS 不支持，CSS 也有部分样式属性 RN 不支持（比如 clip-path、animation、transition 等）。

因此，一方面在我们进行跨平台开发时，跨平台代码需要尽量使用功能的交集；另一方面为了减少开发适配的成本，Mpx 内部也对 RN 的样式作了部分抹平。

具体工作分为两大类有：

**编译时的class类样式转化**
- 属性名转驼峰
- 单位的校验和对齐
- 过滤 RN 不支持的属性和属性值
- 简写转换
- 样式属性差异转换和拉齐

**运行时的style样式处理**
- 属性名转驼峰
- 单位的计算和处理
- 100% 计算
- css func 处理，包括 env()、calc()、var()

### CSS选择器
RN 环境下仅支持单个**类选择器**，不支持类名组合选择器，不过逗号组合的选择器本质上还是单类选择器，是可以支持的。
``` css
/* 支持 */
.classname {
  color: red
}
.classA, .classB {
  color: red
}
/* 不支持 */
view, text {
  color: red
}
.classA .classB {
  color: red
}
```
### 样式单位
#### number 类型值
RN 环境中，number 数值型单位支持 px rpx % 三种，web 下的 vw em rem 等不支持。
Todo: 支持的单位以及%分别是相对自己还是父级的某属性梳理补充
#### color 类型值
RN 环境支持大部分 css 中 color 定义方式，仅少量不支持，详情参考 RN 文档 https://reactnative.dev/docs/colors
Todo: 不支持的颜色形式补充
### 文本样式继承
Web/小程序中，文本节点可以通过 div/view 节点进行直接包裹，在 div/view 节点上也可以直接设定对应文本样式。
但是在RN中，必须通过 Text 来创建文本节点，[文本样式属性](https://reactnative.dev/docs/text-style-props)只有设置给 Text 节点才能生效。
Mpx 框架抹平了这部分的差异，在使用 Mpx 转 RN 时，我们可以使用 view 节点直接包裹文本，也可以在 view 节点上设置文本样式作用到直接子 text 节点上。
但仍因受限于[RN内 text 的样式继承原则的限制](https://reactnative.dev/docs/text#limited-style-inheritance)，只有 view 节点下的子 text 节点可以继承 view 节点上的文本样式，且 text 节点之间可以继承。
具体参考以下代码：
#### 示例代码
``` html
<!-- 示例1 -->
<view class="wrapper">
   文本1
   <text class="content">文本2</text>
   <text class="content"><text>文本3<text/></text>
   <view class="content">文本4</view>
   <view class="content"><view>文本5</view></view>
</view>

.wrapper {
    font-size: 20px;
}
.content {
    text-align: right;
}
<!-- 
小程序&web: 
- 文本1-6 均为字体大小20px，文字居右
RN: 
- 文本1 字体大小20px
- 文本2 字体大小20px，文字居右
- 文本3 字体大小20px，文字居右
- 文本4 文字居右
- 文本5 字体&居中未生效
-->
```
> 备注
> 1. 只有父级 view 节点的文本样式可以被子 text 节点继承；
> 2. view 节点直接包裹文本实际上等同于 view>text>文本，Mpx 框架在编译时若检测到 view 节点直接包裹文本会自动添加一层 text 节点；
> 3. 多级 text 节点可实现文本样式的继承，比如 text>text>文本 ；
> 4. 若不想使用 Mpx 内部实现的 view>text>文本 这种文本样式继承，可设置`disable-default-style=true` 来关闭该继承逻辑；
### 简写样式属性
在 Mpx 内对于通过 class 类来定义的样式会按照 RN 的样式规则在编译处理一遍，其中最重要的一部分就是将 RN 不支持简写属性按约定的规则转换成 RN 能支持多属性结构。

现已支持的简写属性如下:
- [text-shadow]()
- [text-decoration]()
- [border]()
- [border-left]()
- [border-right]()
- [border-top]()
- [border-bottom]()
- [border-radius]()
- [border-width]()
- [border-color]()
- [box-shadow]()
- [flex]()
- [flex-flow]()
- [margin]()
- [padding]()
- [background]()

> **注意事项**：
> 考虑到运行时转化的性能开销问题，简写能力只在编译处理时转化，所以 class 类上设置时简写属性会处理转化的，而在 style 属性上使用了对应的简写是不会转化的，若对应的简写属性 RN 不支持，则在 RN style 属性上不能使用，需直接使用多个属性组合来实现。

[//]: # (表格形式先注释)
[//]: # ()
[//]: # (|简写属性| 文档       |)

[//]: # (|---|----------|)

[//]: # (|text-shadow|链一下api文档|)

[//]: # (|text-decoration|          |)

[//]: # (|border|          |)

[//]: # (|border-left|          |)

[//]: # (|border-right|          |)

[//]: # (|border-top|          |)

[//]: # (|border-bottom|          |)

[//]: # (|flex|          |)

[//]: # (|flex-flow|          |)

[//]: # (|border-radius|          |)

[//]: # (|border-width|          |)

[//]: # (|border-color|          |)

[//]: # (|margin|          |)

[//]: # (|padding|          |)

[//]: # (|box-shadow|          |)
[//]: # (|background|          |)

### CSS函数
在介绍 CSS 函数前我们先来了解一下自定义属性的概念。
#### 自定义属性（CSS 变量）
**自定义属性**（有时候也被称作 **CSS 变量**或者**级联变量**），带有前缀 -- 的属性名，表示的是带有值的自定义属性，比如 --example--name。

通常与 var() 一起使用，由自定义属性标记设定值（带有前缀 -- 的属性名，比如： --main-color: black;），由 var() 函数来获取值（比如： color: var(--main-color);）
> 备注
> - 自定义属性受级联的约束，并从其父级继承其值
> - 自定义属性名区分大小写
#### var()
var() 函数可以插入一个自定义属性（有时也被称为“CSS 变量”）的值，用来代替属性值部分。

var(<custom-property-name> , <declaration-value>? )：函数的第一个参数是要替换的自定义属性的名称。函数的第二个参数是可选的，用作回退值。如果第一个参数引用的自定义属性无效，则该函数将使用第二个值。

> 备注
> - 自定义属性的回退值允许使用逗号。例如，var(--foo, red, blue) 将 red, blue 同时指定为回退值（在第一个逗号之后到函数结尾前的值都会被认为是回退值）
> - var() 函数不能作为属性名、选择器或者其他除了属性值之外的值
```vue
<!-- 代码示意 -->
<template>
  <view class="component">
    <view class="header">Header</view>
    <view class="content">Content</view>
  </view>
</template>

<style>
  .component {
    --content-color: #b58df1;
    --header-color: pink;
  }
  .component .header {
    background-color: var(--header-color, blue);
  }
  .component .text {
    background-color: var(--content-color, black);
  }
</style>
<!-- 实际效果 -->
<!-- Header 背景色是 #b58df1 -->
<!-- Content 背景色是 pink -->
```
#### calc()
calc() 函数允许在声明 CSS 属性值时执行一些计算。

calc() 函数用一个表达式作为它的参数，用这个表达式的结果作为值。

这个表达式采用标准操作符处理法则的简单表达式，支持加减乘除 ，乘法计算需要乘数中至少有一个是 number，除法计算要求除数（/右面的数）必须是 number。
> 备注
> - \+ 和 - 运算符的两边必须要有空白字符，\* 和 / 这两个运算符前后不需要空白字符，但如果考虑到统一性，仍然推荐加上空白符。
> - 能数值化的单位都支持 calc()
> - 百分比的计算逻辑：Todo 待补充
>  + width height top
>  + font-size
```css
/* 代码示意 */

/* property: calc(expression) */
.test {
    width: calc(100% - 80px);
}

/* 使用 CSS 变量嵌套使用 calc() */
.foo {
    --widthA: 100px;
    --widthB: calc(var(--widthA) / 2);
    --widthC: calc(var(--widthB) / 2);
    width: var(--widthC);
}

.demo {
    font-size: calc(1.5rem + 3vw);
}
```
#### env()
env() CSS 函数以类似于 var() 函数和 custom properties 的方式将用户代理定义的环境变量值插入 CSS 中。

区别在于，环境变量除了由用户代理定义而不是由用户定义外，还被全局作用在文档中，而自定义属性则限定在声明它们的元素中。

env() 的第二个可选参数，如果环境变量不可用，该参数可让你设置备用值。

**值**
- safe-area-inset-top
- safe-area-inset-right
- safe-area-inset-bottom
- safe-area-inset-left

safe-area-inset-*由四个定义了视口边缘内矩形的 top, right, bottom 和 left 的环境变量组成，这样可以安全地放入内容，而不会有被非矩形的显示切断的风险。

对于矩形视口，例如普通的笔记本电脑显示器，其值等于零。对于非矩形显示器（如圆形表盘，iPhoneX 屏幕），在用户代理设置的四个值形成的矩形内，所有内容均可见。

```css
/* 代码示意 */
.demo {
  padding: env(safe-area-inset-top, 20px) env(safe-area-inset-right, 20px) env(safe-area-inset-bottom, 20px) env(safe-area-inset-left, 20px);
}
```
> 注意事项
### 使用原子类

## 混合编写RN代码

### 使用RN组件

### 使用React hooks

## 能力支持范围

### 模版语法

### 基础组件

### 自定义组件

### 样式规则
Todo 补充细节
#### position
设置元素的定位样式
##### 值类型
enum: absolute, relative， 默认relative。
##### 代码示例
``` css
position: absolute;
position: relative;
```
#### top|right|left|bottom
设置元素的不同方向的偏移量
##### 值类型
number: px, rpx, %
##### 代码示例
``` css
top: 10px;
top: 10rpx;
top: 10%;
```
#### z-index
控制着元素的堆叠覆盖顺序。
##### 值类型
number
##### 代码示例
``` css
z-index: 1;
```
#### display
设置元素的布局方式。
##### 值类型
enum: flex, none
##### 代码示例
``` css
/* 默认 */ 
display:flex
/* 隐藏 */
display:none
```
#### align-content
设置多根轴线的对齐方式。
##### 值类型
enum: flex-start, flex-end, center, stretch, space-between, space-around, space-evenly
##### 代码示例
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
##### 值类型
enum: flex-start, flex-end, center, stretch, baseline
##### 代码示例
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
##### 值类型
enum: auto, flex-start, flex-end, center, stretch, baseline
##### 代码示例
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
#### flex-grow
设置子盒子的放大比例
##### 值类型
number: >= 0
##### 代码示例
```css
flex-grow: 1;
```
#### flex-shrink
设置子盒子的缩放比例。
##### 值类型
number: >= 0
##### 代码示例
```css
flex-shrink: 1;
```
#### flex-basis
设置在分配多余空间之前，子盒子的初始主轴尺寸。
##### 值类型
number px|rpx|%
##### 代码示例
``` css
flex-shrink: 10px;
flex-shrink: 10rpx;
flex-shrink: 20%;
```
#### flex
Todo 重要
flex-grow flex-shrink flex-basis 的缩写
##### 值类型
按顺序分别对应 flex-grow flex-shrink flex-basis 的值类型，flex: number >= 0 (flex-grow) number >= 0 (flex-shrink) px,rpx,% (flex-basis)
##### 注意事项
具体缩写规则参考 [CSS flex](https://developer.mozilla.org/en-US/docs/Web/CSS/flex)
##### 代码示例
``` css
/** 简写 **/
flex: 1;
/* flex-grow | flex-shrink | flex-basis */
flex: 0 1 1;
```
#### flex-direction
设置主轴的方向。
##### 值类型
enum: row, row-reverse, column, column-reverse
##### 代码示例
``` css
flex-direction: row;
flex-direction: row-reverse;
flex-direction: column;
flex-direction: column-reverse;
```
#### flex-wrap
设置元素是否换行。当值为wrap时，alignItems：center不生效。
##### 值类型
enum: wrap, nowrap, wrap-reverse
##### 代码示例
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
#### margin
margin 是 margin-top|margin-right|margin-left|margin-bottom 的缩写模式, 目前仅支持四种缩写模式。
##### 值类型
enum: auto
number: rpx，px, %
##### 代码示例
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
##### 值类型
number: rpx，px, %
##### 代码示例
``` css
margin-top: 2px;
margin-top: 2rpx;
margin-top: 10%;
```
#### padding
padding 是 padding-left|padding-right|padding-left|padding-bottom 的缩写模式, 目前仅支持四种缩写模式。
##### 值类型
number: rpx, px, %
##### 代码示例
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
##### 值类型
number: rpx，px, %
##### 代码示例
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
设置边框的颜色, 是 borderTopColor|borderRightColor|borderBottomColor|borderLeftColor 的缩写
##### 值类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 代码示例
``` css
/* all border */
/** 支持 **/
border-color: red;
```
#### border-style
设置边框的样式, 不支持缩写。
##### 值类型
enum: solid|dotted|dashed
##### 代码示例
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
设置边框的宽度，是 borderTopWidth|borderRightWidth|borderBottomWidth|borderLeftWidth 的缩写
##### 值类型
number: px, rpx, %
##### 代码示例
``` css
/* all border */
border-width: 2px;
```
#### border-top-color|border-bottom-color|border-left-color|border-right-color
设置各边框的颜色
##### 值类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 代码示例
``` css
border-top-color: red;
```
#### border-top-width|border-bottom-width|border-left-width|border-right-width
设置各边框的宽度
##### 值类型
number: px, rpx, %
##### 代码示例
``` css
border-top-width: 2px;
```
#### border-radius
设置 border 的圆角格式
##### 值类型
number: px, rpx, %
##### 代码示例
``` css
/* all */
border-radius: 2px;
/* top-left | top-right | bottom-right | bottom-left */
border-radius: 10px 10px 10px 0;
```
#### border-bottom-left-radius|border-bottom-right-radius|border-top-left-radius|border-top-right-radius
##### 值类型
number: px, rpx, %
##### 代码示例
``` css
border-bottom-left-radius: 2px;
```
#### background-color
设置背景色
##### 值类型
color: 参考[Color](https://reactnative.dev/docs/colors)
##### 代码示例
``` css
/* all border */
background-color: red;
```
#### background-image
设置背景图
##### 值类型
仅支持 <url()>
##### 注意事项
仅支持 view 节点
##### 代码示例
``` css
background-image: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg");

/* 不支持 */
background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
```
#### background-size
设置背景图大小
##### 值类型
number 支持 px|rpx|%，枚举值支持 contain|cover|auto；
支持一个值:这个值指定图片的宽度，图片的高度隐式的为 auto；
支持两个值:第一个值指定图片的宽度，第二个值指定图片的高度；
不支持逗号分隔的多个值：设置多重背景!!!
##### 注意事项
仅支持 view 节点
##### 代码示例
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
设置是否重复背景图
##### 值类型
enum: no-repeat
##### 注意事项
仅支持 view 节点
##### 代码示例
``` css
background-repeat: no-repeat;

/* 不支持 */
background-repeat: repeat; 
```
#### background
表示背景的组合属性，只能在view上使用
##### 值类型
仅支持 background-image|background-color|background-size|background-repeat|background-position，具体每个属性的支持情况参见上面具体属性支持的文档
##### 注意事项
仅支持 view 节点
##### 代码示例
```css
/* 支持 */
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink no-repeat;
background: #000;
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink;
/* 不支持 */
background: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
```
#### box-shadow
设置阴影颜色、阴影偏移量、阴影模糊半径
##### 值类型
仅支持 offset-x|offset-y|blur-radius|color 排序，值以空格分隔按顺序赋值
##### 代码示例
```css
/* offset-x | offset-y | blur-radius | color */
box-shadow: 0 1px 3px rgba(139,0,0,0.32);
```
> 注意事项
> - android 不支持
> - ios 也只支持 offset-x | offset-y | blur-radius | color, 不支持 spread-radius
> - react@0.76 支持了 box-shadow
#### backface-visibility
指定当 <image> 背面朝向观察者时是否可见，仅 <image> 支持
##### 值类型
enum: visible, hidden
##### 注意事项
仅支持 image 节点
##### 代码示例
```css
backface-visibility: visible;
```
#### object-fit
确定当元素 <image>与原始图像尺寸不匹配时如何调整图像大小
##### 值类型
enum: cover, contain, fill, scale-down
##### 注意事项
仅支持 image 节点
##### 代码示例
```css
object-fit: contain;
```
#### transform
设置旋转、缩放、倾斜或平移
##### 值类型
- array of objects (only rn): [{matrix: number[]}, {perspective: number}, {rotate: string}, {rotateX: string}, {rotateY: string}, {rotateZ: string}, {scale: number}, {scaleX: number}, {scaleY: number}, {translateX: number}, {translateY: number}, {skewX: string}, {skewY: string}]
- string
##### 代码示例
```css
/* rn & css */
transform: 'rotateX(45deg) rotateZ(0.785398rad)',
/* 仅rn支持 */
transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}]
```
#### transformOrigin
设置视图变换的原点，默认情况下，变换的原点是中心。
##### 值类型
- 单值时，该值必须是 px、百分比或关键字 left、center、right、top 和 bottom 之一； 
- 双值时，第一个值代表 X 偏移， 必须是 px、百分比或关键字 left、center 和 right 之一， 第二个值代表 Y 偏移，必须是 px、百分比或关键字 top、center 和 bottom 之一；
- 三值时，前两个值与双值语法相同，第三个值代表 Z 偏移，必须是 px。
##### 代码示例
```css
transform-origin: bottom;
transform-origin: 10px 2px;
transform-origin: right bottom 20px;
```
#### color
##### 值类型
color 参考 [Color](https://reactnative.dev/docs/colors)
##### 注意事项
仅支持 text 节点，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
``` css
color: orange;
color: #fff;
color: #fafafa;
color: rgb(255, 255, 255);
color: rgba(255, 99, 71, 0.2)
```
#### font-family
可设置系统字体，引入字体文件，暂时不支持。
##### 值类型
string
##### 注意事项
仅支持 text 节点，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
``` css
font-family: "PingFangSC-Regular"
```
#### font-size
可设置字体的大小
##### 值类型
number: px,rpx
##### 注意事项
仅支持 text 节点，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
``` css
font-size: 12px;
font-size: 12rpx;
```
#### font-style
设置文本的字体样式。
##### 值类型
enum: normal，italic
##### 注意事项
仅支持 text 节点，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
``` css
font-style: italic;
font-style: normal;
```
#### font-weight
设置文字的权重。
##### 值类型
enum: 100，200，300，400，500，600，800，900,normal,bold
##### 注意事项
仅支持 text 节点，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
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
##### 值类型
enum: small-caps, oldstyle-nums, lining-nums, tabular-nums, proportional-nums
##### 注意事项
仅支持 text 节点，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
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
##### 值类型
px,rpx
##### 注意事项
仅支持 text 节点，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
``` css
letter-spacing: 2px;
letter-spacing: 2rpx;
```
#### line-height
设置行高。
##### 值类型
##### 注意事项
仅支持 text 节点上，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
``` css
line-height: 16px
line-height: 16rpx
line-height: 100%
line-height: 1
```
#### text-align
设置文本的水平对齐方式。
##### 值类型
enum: left, right, center, justify
##### 注意事项
仅支持 text 节点上，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
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
##### 值类型
enum: none, underline, line-through, underline line-through
##### 注意事项
仅支持 text 节点上，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
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
##### 值类型
enum: none, uppercase, lowercase, capitalize
##### 注意事项
仅支持 text 节点上，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
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
##### 值类型
仅支持 offset-x | offset-y | blur-radius | color 排序，值以空格分隔按顺序赋值
##### 注意事项
仅支持 text 节点上，若定义在 view 节点上，则会继承到第一级 text 子节点上
##### 代码示例
```css
text-shadow: 1rpx 3rpx 0 #2E0C02;
```

### 应用能力

### 环境API

### Webview API

### 其他使用注意事项
