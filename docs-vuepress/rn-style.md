# Mpx转RN样式使用指南

React Native的样式的支持基本为web样式的一个子集，同时还有一些属性并未与Web对齐，因此跨平台输出RN时，为了保障多端输出样式一致，可参考本文针对样式在RN上的支持情况来进行样式编写。

## 布局说明
### flex布局
在React Native中，可以通过Flexbox规则来布局组件元素。基于yoga布局引擎实现，可查看[文档](https://github.com/facebook/yoga)。

注：RN中View标签的主轴是column，和css不一致，使用mpx开发会进行抹平，默认的主轴方向是row。

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
Mpx框架为了尽可能的将小程序/Web上编写的样式转换为适配RN的样式，进行了一系列的样式转换。同时RN在很多样式属性的默认值上与Web并未对齐，因此框架也支持了部分属性的默认值与Web对齐的工作。

### 转换规则
mpx 主要处理了以下几种样式转换规则：
1. 属性名称由中划线-转为驼峰
2. rpx 单位的转换
3. css 简写的转换
4. 不支持的属性过滤（会被 mpx 编译处理时丢弃，有编译 error提示）
    
    | 描述             | 不支持的属性                                                                          |
    | -------------- | ------------------------------------------------------------------------------------------|
    | 双端都不支持    | box-sizing/white-space/text-overflow/animation/transition|                            |
    | ios 不支持     | vertical-align                                                                         |
    | android 不支持 | text-decoration-style/text-decoration-color/shadow-offset/shadow-opacity/shadow-radius |
        
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
- text-decoration <br/>
仅支持 text-decoration-line text-decoration-style text-decoration-color 这种顺序，值以空格分隔按顺序赋值
```css
text-decoration: underline dotted red;
```
- margin|padding <br/>
支持 margin: 0/margin: 0 auto/margin: 0 auto 10px/margin: 0 10px 10px 20px/这四种格式
```css
/* 单个值：上下左右 */
margin: 10px;
/* 两个值：上下 左右 */
margin: 0 10px;
/* 三个值：上 左右 下 */
margin: 0 10px 0;
/* 四个值：上 右 下 左 */
margin: 0 10px 0 10px;
```
- text-shadow <br/>
仅支持 offset-x | offset-y | blur-radius | color 排序，值以空格分隔按顺序赋值
```css
text-shadow: 1rpx 3rpx 0 #2E0C02;
```
- border <br/>
仅支持 width | style | color 这种排序，值以空格分隔按顺序赋值
```css
border: 1px;
border: 1px solid;
border: 1px double pink;
```
- box-shadow <br/>
仅支持 offset-x | offset-y | blur-radius | color 排序，值以空格分隔按顺序赋值
```css
box-shadow: 0 1px 3px rgba(139,0,0,0.32);
```
- flex <br/>
仅支持 flex-grow | flex-shrink | flex-basis 这种顺序，值以空格分隔按顺序赋值
```css
flex: 0 1 1;
flex: 1;
flex: 1 0;
```
- flex-flow <br/>
仅支持 flex-flow: flex-direction flex-wrap 这种顺序，值以空格分隔按顺序赋值
```css
flex-flow: row;
flex-flow: row no-wrap;
```
- border-radius <br/>
仅支持 border-radius 0px/border-radius 0px 0px 0px 0px（值以空格分隔按顺序赋值）
```css
border-radius: 10px;
border-radius: 0 0 0 10px;
```

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

#### display

设置元素的布局方式。

**值支持类型**

    enum: px rpx %

**语法**

``` css

// 默认
display:flex
// 隐藏
display:none
```



#### align-content

设置多根轴线的对齐方式。

**值支持类型**

    enum:flex-end, center, stretch, space-between, space-around


**语法**

``` css

align-content: center

```

#### align-items

设置单根轴线上的子元素的对齐方式。默认会是交叉轴上的。

**值支持类型**

    enum:flex-end, center, stretch, space-between, space-around


**语法**

``` css

align-content: center

```

#### align-self

设置单个子元素在单根轴线上的对齐方式

**值支持类型**

    enum: auto, flex-start, flex-end, center, stretch, baseline

**语法**

``` css

align-self: center

```

#### flex

是 flex-grow、flex-shrink 和 flex-basis 的简写属性。用于设置弹性盒子元素的扩展、收缩和初始尺寸。

**值支持类型**

    flex: number number px/rpx

**语法**

``` css

flex 1

```

#### flex-grow

设置子盒子的放大比例

**值支持类型**

    numner

**语法**

```css

flex-grow: 1;
```

#### flex-shrink

设置子盒子的缩放比例。

**值支持类型**

    flex-shrink: number

**语法**

```css

flex-shrink: 1;

```

#### flex-basis

设置在分配多余空间之前，子盒子的初始主轴尺寸。

**值支持类型**

    flex-shrink: px/rpx

**语法**

``` css

flex-shrink: 10px;

```

#### flex-direction

设置主轴的方向。

**值支持类型**

    enum: row, row-reverse, column, column-reverse

**语法**

``` css

flex-direction: column;

```

#### flex-wrap

设置元素是否换行。

**值支持类型**

    enum: wrap, nowrap, wrap-reverse

**语法**

``` css

flex-wrap: wrap;

```

### position布局 群峰



#### position

设置元素的定位样式

**值支持类型**

    enum: absolute, relative， 默认relative。

**语法**

``` css

position: absolute;

```

#### top/right/left/bottom/

设置元素的不同方向的偏移量。

**值支持类型**

    enum: px,rpx,%

**语法**

``` css

top: 10px

```

#### z-index

控制着元素的堆叠覆盖顺序。

**值支持类型**

    numner

**语法**

``` css

z-index: 2;

```

### 图片背景
在 view 组件上可以定义一下 background 相关属性：

|属性|支持的value|
| --- | --- |
|background-image|仅支持 <url()>|
|background-color|支持的颜色值类型参见【单位支持】的 color 部分|
|background-size|支持一个值:这个值指定图片的宽度，图片的高度隐式的为 auto；支持两个值:第一个值指定图片的宽度，第二个值指定图片的高度；值类型支持枚举值 cover contain auto 以及number类型单位 rpx px %；不支持逗号分隔的多个值：设置多重背景!!!|
|background-repeat|仅支持 no-repeat|
|background|该简写属性仅支持以上属性，需要注意的是在 background 简写中仅支持 background-size 的枚举值 contain、cover、auto，rpx、px、% number类型值不支持|

```css
/* 支持 */
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink contain no-repeat;
background: #000;
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink;
background-size: 50%;
background-size: 50% 25%;
background-size: contain;
background-size: cover;
background-size: auto;
background-size: 20px auto;
background-repeat: no-repeat;
background-color: pink;
background-image: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg");
/* 不支持 */
background: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
background-size: 50%, 25%, 25%;
background-repeat: repeat; 
```
### 阴影

#### box-shadow 
此属性是阴影颜色、阴影的偏移量，阴影模糊半径的缩写
**值支持类型**

    number: px rpx

**语法**
```css
/* offset-x | offset-y | blur-radius | color */
box-shadow: 0 1px 3px rgba(139,0,0,0.32);
```
**语法**
``` css
/* all */
border-radius: 2px;
/* top-left | top-right | bottom-right | bottom-left */
border-radius: 10px 10px 10px 0;

### 文本相关 群峰


#### color

margin是margin-top、margin-right、margin-left、margin-bottom的缩写模式, 目前仅支持四种缩写模式。

**值支持类型**

  color: 参考[Color](https://reactnative.dev/docs/colors)

**语法**

``` css

color: orange;

color: #fff;
```

#### font-family
可设置系统字体，引入字体文件，暂时不支持。

**值支持类型**

  string

**语法**

``` css

font-family: "PingFangSC-Regular"
```

#### font-size
可设置字体的大小

**值支持类型**

  px,rpx

**语法**

``` css

font-size: 12px;
```


#### font-style
设置文本的字体样式。

**值支持类型**

    enum: normal，italic

**语法**

``` css

font-style: italic;
```

#### font-weight
设置文字的权重。

**值支持类型**

    enum: 100，200，300，400，500，600，800，900

**语法**

``` css

font-weight: 500;
```


#### font-variant
设置文本的字体变体

**值支持类型**

    enum: small-caps, oldstyle-nums, lining-nums, tabular-nums, proportional-nums

**语法**

``` css

font-variant: lining-nums;
```

#### letter-spacing
定义字符之间的间距

**值支持类型**

    px,rpx

**语法**

``` css

letter-spacing: 2px;
```

#### line-height

设置行高。

**值支持类型**

  px,rpx,%

**语法**

``` css

line-height: 16px

```

#### text-align

设置文本的水平对齐方式。

**值支持类型**

  enum: auto, left, right, center, justify

**语法**

``` css

text-align: center;

```


#### text-decoration-line

设置文本的装饰线样式。

**值支持类型**

  enum: none, underline, line-through, underline line-through

**语法**

``` css

text-decoration-line: underline;

```


#### text-transform

设置文本的大小写转换。

**值支持类型**

  enum: none, uppercase, lowercase, capitalize

**语法**

``` css

text-transform: uppercase;

```

### 边距与border

#### margin
margin是margin-top、margin-right、margin-left、margin-bottom的缩写模式, 目前仅支持四种缩写模式。

**值支持类型**

    string: 'auto'
    number: rpx，px, %

**语法**

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
#### margin-top/margin-bottom/margin-right/margin-left
**值支持类型**

    number: rpx，px, %

**语法**
``` css
margin-top: 2px;
margin-top: 2rpx;
margin-top: 10%;
```

#### padding
padding是padding-left、padding-right、padding-left、padding-bottom的缩写模式, 目前仅支持四种缩写模式。

**值支持类型**

    string: 'auto'
    number: rpx，px, %

**语法**

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
#### padding-top/padding-bottom/padding-left/padding-right
**值支持类型**

    number: rpx，px, %

**语法**
``` css
padding-top: 2px;
padding-top: 2rpx;
padding-top: 10%;
```

#### border
border是border-width、border-style、border-color的缩写模式, 目前仅支持一种缩写模式。

``` css
/* width | style | color */
border: 1px solid red;
```
#### border-color
设置边框的颜色, 目前只支持统一设置，不支持缩写。

**值支持类型**

color: 参考[Color](https://reactnative.dev/docs/colors)

**语法**
``` css
/* all border */
border-color: red;
```

#### border-style
设置边框的样式, 目前只支持统一设置，不支持缩写。

**值支持类型**

  string: 'solid', 'dotted', 'dashed'

**语法**

``` css
/* all border */
border-color: 'solid';
```
#### border-width
设置边框的宽度，目前只支持统一设置，不支持缩写。

**值支持类型**

    number: px rpx %

**语法**

``` css
/* all border */
border-width: 2px;
```
#### border-top-color/border-bottom-color/border-left-color/border-right-color
设置各边框的颜色

**值支持类型**

color: 参考[Color](https://reactnative.dev/docs/colors)

**语法**
``` css
border-top-color: red;
```
#### border-top-width/border-bottom-width/border-left-width/border-right-width
设置各边框的宽度

**值支持类型**

    number: px rpx

**语法**
``` css
border-top-width: 2px;
```
#### border-radius
设置border的圆角格式，支持一种缩写方式
**值支持类型**

    number: px rpx

**语法**
``` css
/* all */
border-radius: 2px;
/* top-left | top-right | bottom-right | bottom-left */
border-radius: 10px 10px 10px 0;
```
#### border-bottom-left-radius/border-bottom-right-radius/border-top-left-radius/border-top-right-radius
**值支持类型**

    number: px rpx

**语法**
``` css
border-bottom-left-radius: 2px;
```
