# 跨端输出RN
RN 样式属性和 Web/小程序中 CSS 样式属性是相交关系，RN 有一小部分样式属性（比如 tintColor、writingDirection 等） CSS 不支持，CSS 也有少部分样式属性 RN 不支持（比如 clip-path、animation、transition 等）。

因此，一方面，在我们进行跨平台开发时，跨平台样式属性声明要尽量使用两边样式属性的交集；另一方面为了减少开发适配的成本，Mpx 内部也对 RN 的样式作了部分抹平。

Mpx 框架在样式处理部分的具体工作主要分为两大类有：

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
## 跨端样式定义
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
Mpx转RN, 支持以下单位，部分单位在部分情况下存在使用限制
#### 数值类型单位说明
| 单位 | 支持情况 | 特殊说明 |
| ---- | ---- | ---- |
| % | 支持 | 百分比单位参考下面说明|
| px | 支持 | 无 |
| rpx | 支持 | rpx会根据屏幕宽度动态计算成实际的px |
| vh | 支持 | 屏幕的高度，在使用非自定义导航时，页面初次渲染计算出来的vh是屏幕高度，后续更新渲染使用实际可视区域高度，推荐使用此单位的页面使用自定义导航 |
| vw | 支持 | 无 |
#### 百分比单位说明
RN很多原生较多属性不支持百分比，比如font-size、translate等，但是这些属性在编写web、小程序代码的过程中使用较多，框架进行了抹平支持。以下这些属性在Mpx输出RN时专门进行了百分比单位的适配，部分属性存在编写的时候的特殊适配。
##### 特殊的百分比计算规则
###### font-size

font-size 百分比计算依赖开发者传入的 parent-font-size 属性，框架将根据开发者传入 parent-font-size 的值来计算 font-size 的百分比大小
> 备注：当 font-size 设置为百分比，未设置 parent-font-size 属性或者 parent-font-size 属性值非数值，会报错提示开发者且框架不计算 font-size 直接返回 

###### line-height

和 Web/小程序类似，当设置 line-height: 1.2; line-height: 120%; 这种 number 或百分比值时，实际都是按百分比来计算。line-height 的百分比计算基准是 font-size 的大小，所以在设置 line-height 为 number 或者百分比值时，要保证同时有设置 font-size 大小。 

> 备注：设置 line-height 注意区分有无单位，line-height: 12 会按照 line-height: 1200% 来计算处理，line-height: 12px 会按照正常单位计算。
##### 根据自身宽高计算百分比
translateX/translateY/border-radius 的百分比都是根据自身宽高的来计算的。
> 注意事项
> - RN 0.76 版本 translateX/translateY 支持百分比
> - translateX/border-radius 都是根据节点的 width 来计算百分比，而 translateY 是根据节点的 height 来计算的百分比
> - border-radius-*(top/right/bottom/left) 百分比计算逻辑和 border-radius 一致
> - 根据自身宽高计算百分比需要在完成渲染后在 onLayout 获取自身宽高计算并设置，故这些属性设置生效都在第一次 onLayout 后
> - 因动画执行不会触发 onLayout，所以最好不要在动画中使用这些属性的百分比
##### 根据父节点宽高计算百分比
除了上述两中规则外，属性 width/left/right/height/top/bottom/margin/padding 等设置百分比时的计算基准都是父节点的宽高，且 RN 支持设置百分比，无需框架额外处理。

有一种情况例外，则是在上述属性值中设置为 calc 函数且表达式使用百分比，如 width: calc(100% - 10px)。

###### calc() 函数内的百分比使用方式

如有在 calc 函数表达式内使用百分比的场景，则需要开发者设置 parent-width 或 parent-height 属性，传入百分比计算的基准值。

以父节点高度为基准值计算百分比的属性如 height/top/bottom 则需要传入 parent-height 属性；以父节点宽度为基准值计算百分比的属性如 width/left/right 则需要传入 parent-width 属性。

> 备注：属性通过父节点宽度还是高度来计算基准，一般遵循纵向以高度为基准，横向以宽度为基准的大原则
#### 色值 color 类型支持的值格式说明
- hex-color(十六进制)
- rgb/rgba
- hsl/hsla
- hwb
- named color，具体参考[颜色枚举值](https://reactnative.dev/docs/colors#named-colors)
- Color ints(仅 RN 支持，如 0xff00ff00 )

```css
/* <named-color> 值 */
color: red;
color: orange;
color: tan;
color: rebeccapurple;

/* <hex-color> 值 */
color: #090;
color: #009900;
color: #090a;
color: #009900aa;

/* <rgb()> 值 */
color: rgb(34, 12, 64, 0.6);
color: rgba(34, 12, 64, 0.6);
color: rgb(34 12 64 / 0.6);
color: rgba(34 12 64 / 0.3);
color: rgb(34 12 64 / 60%);
color: rgba(34.6 12 64 / 30%);

/* <hsl()> 值 */
color: hsl(30, 100%, 50%, 0.6);
color: hsla(30, 100%, 50%, 0.6);
color: hsl(30 100% 50% / 0.6);
color: hsla(30 100% 50% / 0.6);
color: hsl(30 100% 50% / 60%);
color: hsla(30.2 100% 50% / 60%);

/* <hwb()> 值 */
color: hwb(90 10% 10%);
color: hwb(90 10% 10% / 0.5);
color: hwb(90deg 10% 10%);
color: hwb(1.5708rad 60% 0%);
color: hwb(0.25turn 0% 40% / 50%);
```

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
- [text-shadow](#text-shadow)
- [text-decoration](#text-decoration)
- [flex](#flex)
- [flex-flow](#flex-flow)
- [margin](#margin)
- [padding](#padding)
- [background](#background)
- [box-shadow](#box-shadow)
- [border-radius](#border-radius)
- [border-width](#border-width)
- [border-color](#border-color)
- [border](#border)
- [border-top|border-right|border-bottom|border-left](#border-topborder-rightborder-bottomborder-left)

> **注意事项**
> 
> - 考虑到运行时转化的性能开销问题，简写能力只在编译处理时转化，所以 class 类上设置时简写属性会处理转化的，而在 style 属性上使用了对应的简写是不会转化的，若对应的简写属性 RN 不支持，则在 RN style 属性上不能使用，需直接使用多个属性组合来实现。
> - 简写属性不支持 单个 var() 函数，所以简写属性传入单个 var() 编译时会有错误提示，并且原样返回，这可能会导致 RN 运行时错误。
> - 若是多个 var() 函数则会按顺序赋给各个属性

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
    <view class="footer">Footer</view>
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
  .component .footer {
    background-color: var(--footer-color, black);
  }
</style>
<!-- 实际效果 -->
<!-- Header 背景色是 #b58df1 -->
<!-- Content 背景色是 pink -->
<!-- Footer 背景色是 black（--footer-color 未定义，回退值生效） -->
```
#### calc()
calc() 函数允许在声明 CSS 属性值时执行一些计算。

calc() 函数用一个表达式作为它的参数，用这个表达式的结果作为值。

这个表达式采用标准操作符处理法则的简单表达式，支持加减乘除 ，乘法计算需要乘数中至少有一个是 number，除法计算要求除数（/右面的数）必须是 number。
> 备注
> - \+ 和 - 运算符的两边必须要有空白字符，\* 和 / 这两个运算符前后不需要空白字符，但如果考虑到统一性，仍然推荐加上空白符。
> - 能数值化的单位都支持 calc() 函数
> - 百分比的计算逻辑详见样式单位部分的[百分比单位说明](#百分比单位说明)
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
env() 用于将定义的环境变量的值插入到 CSS 中。

第一个参数为系统环境变量，具体可选值有 safe-area-inset-top、safe-area-inset-right、safe-area-inset-bottom、safe-area-inset-left，分别定义了视口上右下左各边缘的安全距离。

第二个可选参数是环境变量不可用时的回退值。

env() 函数通过和 var() 函数类似形式， 区别在于：一是环境变量是系统定义的，而 var() 函数是开发者自定义；二是环境变量是全局生效，而 var() 函数的自定义属性不能在声明之外使用。

```css
/* 代码示意 */
.demo {
  padding: env(safe-area-inset-top, 20px) env(safe-area-inset-right, 20px) env(safe-area-inset-bottom, 20px) env(safe-area-inset-left, 20px);
}
```
> 注意事项
### 使用原子类

## 混合编写RN代码
在编写Mpx组件时，在特定情况下（处于性能考虑等因素），可能会涉及到混合开发(在Mpx项目内编写RN组件)

### 使用RN组件
在Mpx组件内引用RN组件, 需在components属性下进行引用注册。在模板中进行引用，对应组件的属性参考RN，赋值的方式按照Mpx语法进行双括号包裹，组件使用的变量与属性需要通过 REACTHOOKSEXEC方法的返回值的方式进行申明
```javascript
<template>
    <view>
        <!-- 事件的value需要使用双括号包裹 -->
        <ScrollView onScroll="{{scrollAction}}">
        </ScrollView>
    </view>
</template>
<script>
    import { createComponent, REACTHOOKSEXEC } from '@mpxjs/core'
    import { ScrollView } from 'react-native-gesture-handler'
    createComponent({
        components: {
            ScrollView
        }
        [REACTHOOKSEXEC](){
            return {}
        }
    })
</script>
```
### 使用React hooks
Mpx提供了hooks的执行机制，通过在Mpx组件内注册REACTHOOKSEXEC方法，保障RN组件的初始化执行

```javascript
<template>
    <view>
        <ScrollView onScroll="{{onScroll}}">
            <View>
                <Text>{{count}}</Text>
            </View>
        </ScrollView>
    </view>
</template>
<script>
import { createComponent, REACTHOOKSEXEC } from '@mpxjs/core'
import { ScrollView } from 'react-native-gesture-handler'
import { View, Text} from 'react-native'
import { useState } from 'react'
createComponent({
    components: {
        ScrollView,View, Text
    },
    [REACTHOOKSEXEC](prop) {
        // 所有使用hooks的部分在此处进行注册与执行
        const [count, setCount] = useState(0);
        const onScroll = () => {
            setCount(count + 1)
        }
        // 返回值用于可用于模板上
        return {
            count,
            onScroll
        }
    }
})
</script>
```

## 能力支持范围

### 模版语法

### 基础组件

### 自定义组件

### 样式规则
#### position
设置元素的定位样式
##### 值类型
enum: absolute, relative， 默认relative。
> 备注：RN 不支持 fixed 定位
##### 代码示例
``` css
position: absolute;
top: 10px
```
#### top|right|left|bottom
设置元素的不同方向的偏移量
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
position: relative;
top: 10%;
```
#### z-index
控制元素的堆叠覆盖顺序。
##### 值类型
number，纯数值，无单位
##### 代码示例
``` css
position: absolute;
top: 0;
z-index: 1;
```
#### display
设置元素的布局方式。
##### 值类型
enum: flex, none
> 备注
> - RN display 仅支持 flex 布局，其他在 Web/小程序常用的布局如 block、inline-block、inline、inline-flex、grid、table 等 RN 不支持，为了保证代码有更好的跨端适配，最好使用 flex 布局。
> - 和 Web/小程序一致，RN 下 Text 节点默认为行内 inline 布局
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
设置 flex 元素的增长系数，默认值为0，不支持放大
##### 值类型
number，纯数值无单位，>= 0
##### 代码示例
```css
flex-grow: 3;
```
#### flex-shrink
设置 flex 元素的收缩规则。

flex 元素仅在默认宽度之和大于容器的时候才会发生收缩，其收缩的大小是依据 flex-shrink 的值，flex-shrink 默认为0，不支持收缩
##### 值类型
number，纯数值无单位，>= 0
##### 代码示例
```css
flex-shrink: 2;
```
#### flex-basis
设置指定了 flex 元素在主轴方向上的初始大小，默认值 auto。
##### 值类型
enum: auto

number，单位参考[数值类型单位说明](#数值类型单位说明)
> 备注
> 
> 当一个元素同时被设置了 flex-basis (除值为 auto 外) 和 width (或者在 flex-direction: column 情况下设置了height) , flex-basis 具有更高的优先级。
##### 代码示例
``` css
flex-basis: 10px;
flex-basis: 10rpx;
flex-basis: 20%;
flex-basis: auto;
flex-basis: 0;
```
#### flex
flex-grow flex-shrink flex-basis 的简写，和所有简写属性一致，仅支持定义在类上
##### 简写规则
可以使用一个，两个或三个值来指定 flex 属性。

**单值语法**，值必须是以下之一：
- 一个 <flex-grow> 的有效值：此时简写会扩展为 flex: <flex-grow> 1 0。
- 一个 <flex-basis> 的有效值：此时简写会扩展为 flex: 1 1 <flex-basis>。
- 关键字 none/initial 。

**双值语法**，第一个值必须是一个 flex-grow 的有效值，第二个值必须是以下之一：
- 一个 flex-shrink 的有效值：此时简写会扩展为 flex: <flex-grow> <flex-shrink> 0。
- 一个 flex-basis 的有效值：此时简写会扩展为 flex: <flex-grow> 1 <flex-basis>。

**三值语法**，值必须按照以下顺序指定：
- 一个 flex-grow 的有效值。
- 一个 flex-shrink 的有效值。
- 一个 flex-basis 的有效值。

**几种情况**：
- initial 相当于将属性设置为 flex: 0 1 auto
- auto 相当于将属性设置为 flex: 1 1 auto
- none 相当于将属性设置为 flex: 0 0 auto
- flex-grow/flex-shrink 负值无效，省略时默认值为 1；flex-basis 若值为0，则必须加上单位，省略时默认值为 0
##### 代码示例
``` css
/** 单值，flex-grow 有效值 **/
flex: 1;
/* 等同于 */
flex: 0 1 1;

/** 单值，flex-basis 有效值 **/
flex 30px
/* 等同于 */
flex: 1 1 30px

/* 双值：flex-grow + flex-basis 有效值 */
flex: 1 30px
/* 等同于 */
flex: 1 1 30px

/* 双值：flex-grow + flex-shrink 有效值 */
flex: 2 2
/* 等同于 */
flex: 2 2 0
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
flex-direction flex-wrap 的简写形式，值按固定顺序分别赋值给 flex-direction flex-wrap，若值个数不够则后置位属性不设置；和所有简写属性一致，仅支持定义在类上
##### 代码示例
```css
/* flex-direction flex-wrap 缺省则不设置 */
flex-flow: row;
/* flex-direction |  flex-wrap */
flex-flow: row nowrap;
```
#### margin-top|margin-bottom|margin-right|margin-left
上下左右外边距
##### 值类型
enum: auto

number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
margin-top: 2px;
margin-top: 2rpx;
margin-top: 10%;
```
#### margin
设置外边距

RN margin 属性仅支持单值的，设置多值时是由框架按简写逻辑在编译时处理的，和所有简写属性一致，多值的简写形式仅在class类上支持。
##### 值类型
enum: auto

number，单位参考[数值类型单位说明](#数值类型单位说明)
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
#### padding-top|padding-bottom|padding-left|padding-right
上下左右内边距
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
/** padding-top **/
padding-top: 2px;
padding-top: 2rpx;
padding-top: 10%;
```
#### padding
设置内边距

RN padding 属性仅支持单值的，设置多值时是由框架按简写逻辑在编译时处理的，和所有简写属性一致，多值的简写形式仅在class类上支持。
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
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
#### border-top-width|border-bottom-width|border-left-width|border-right-width
设置上下左右各边框的宽度
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
border-top-width: 2px;
```
#### border-width
设置边框的宽度

RN border-width 属性仅支持单值的，设置多值时是由框架按简写逻辑在编译时处理的，和所有简写属性一致，多值的简写形式仅在class类上支持。
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
/* all border */
border-width: 2px;

/* 顶部和底部 | 左侧和右侧 */
border-width: 2px 1.5em;

/* 顶部 | 左侧和右侧 | 底部 */
border-width: 1px 2em 1.5cm;

/* 顶部 | 右侧 | 底部 | 左侧 */
border-width: 1px 2em 0 4rem;
```
#### border-top-color|border-bottom-color|border-left-color|border-right-color
设置上下左右各边框的颜色
##### 值类型
color: 参考[Color](#色值-color-类型支持的值格式说明)
##### 代码示例
``` css
border-top-color: red;
```
#### border-color
设置边框的颜色

RN border-color 属性仅支持单值的，设置多值时是由框架按简写逻辑在编译时处理的，和所有简写属性一致，多值的简写形式仅在class类上支持。
##### 值类型
color: 参考[Color](#色值-color-类型支持的值格式说明)
##### 代码示例
``` css
/* border-color: color; 单值语法 */
border-color: red;

/* border-color: vertical horizontal; 双值语法*/
border-color: red #f015ca;

/* border-color: top horizontal bottom; 三值语法 */
border-color: red yellow green;

/* border-color: top right bottom left; 四值语法 */
border-color: red yellow green blue;
```
#### border-style
设置边框的样式
##### 值类型
enum: solid|dotted|dashed
> 注意事项：RN 不支持分开设置各边框线的形态，所以 RN 上 border-style 不支持简写形式
##### 代码示例
``` css
/** 支持 **/
/* all border */
border-color: solid;
border-color: dotted;
border-color: dashed;

/** 不支持 **/
border-style: double;
border-style: groove;
border-style: ridge;
border-style: dotted solid;
border-style: hidden double dashed;
border-style: none solid dotted dashed;

/** 不支持 **/
/* horizontal | vertical */
border-style: dotted solid;
/* top | horizontal | bottom */
border-style: hidden double dashed;
/* top | right | bottom | left */
border-style: none solid dotted dashed;
```
#### border
border-width border-style border-color 的简写模式, 值按固定顺序分别赋值给 border-width border-style border-color，若值个数不够则后置位属性不设置；和所有简写属性一致，仅支持定义在类上
##### 代码示例
```css
/* border-width | border-style | border-color */
border: 1px solid red;
/* border-width */
border: 1px;
/* border-width | border-style */
border: 1px solid;
/* border-width | border-style | border-color */
border: 1px double pink;
```
#### border-top|border-right|border-bottom|border-left
border-(top|right|bottom|left)-width border-(top|right|bottom|left)-style border-(top|right|bottom|left)-color 的简写模式, 值按固定顺序分别赋值给 border-*-width border-*-style border-*-color，若值个数不够则后置位属性不设置；和所有简写属性一致，仅支持定义在类上
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
```css
border-top: 1px;
border-top: 2px dotted;
border-top: medium dashed green;
```
#### border-bottom-left-radius|border-bottom-right-radius|border-top-left-radius|border-top-right-radius
上下左圆角大小
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
border-bottom-left-radius: 2px;
```
#### border-radius
圆角大小

RN border-radius 属性仅支持单值的，设置多值时是由框架按简写逻辑在编译时处理的，和所有简写属性一致，多值的简写形式仅在class类上支持。
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
/* all */
border-radius: 2px;
/* top-left | top-right | bottom-right | bottom-left */
border-radius: 10px 10px 10px 0;
```
#### background-color
设置背景色
##### 值类型
color: 参考[Color](#色值-color-类型支持的值格式说明)
##### 代码示例
``` css
background-color: red;
```
#### background-image
设置背景图

@qunfeng 补充一下背景图和渐变背景的细节
##### 值类型
string: image | linear-gradient
> 注意事项 
> - 背景图和背景色仅支持 view 节点
> - 开发者可通过 enable-background 属性来控制是否开启背景图片和渐变色的支持
##### 代码示例
``` css
background-image: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg");
background-image linear-gradient(270deg, rgba(255,255,255,0.40), rgba(255,255,255,0.00))
```
#### background-size
设置背景图大小
##### 值类型
enum: contain|cover|auto

number，单位参考[数值类型单位说明](#数值类型单位说明)
> 注意事项
> - 仅支持 view 节点
> - 支持一个值，这个值指定图片的宽度，图片的高度隐式的为 auto；支持两个值，第一个值指定图片的宽度，第二个值指定图片的高度；不支持逗号分隔的多个值
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
> 备注：仅支持 view 节点
##### 代码示例
``` css
background-repeat: no-repeat;

/* 不支持 */
background-repeat: repeat; 
```
#### background
背景的简写属性，只能在view上使用
##### 值类型
仅支持 background-image|background-color|background-size|background-repeat|background-position，具体每个属性的支持情况详见各属性的介绍文档
> 备注：仅支持 view 节点
##### 代码示例
```css
/* 支持 */
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink no-repeat;
background: #000;
background: url("https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg") pink;
background: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5));
```
#### box-shadow
设置阴影颜色、阴影偏移量、阴影模糊半径，因 RN 不支持 box-shadow 属性，实际是由 mpx 按 RN 支持的 shadowOffset: { width?: number, height?: number }; shadowRadius: number; shadowColor: number; 属性和顺序转换成对应的属性。
##### 值类型
offset-x|offset-y|blur-radius 值为 number，单位参考[数值类型单位说明](#数值类型单位说明)，shadow-color 为 color 类型，参考[Color](#色值-color-类型支持的值格式说明)
##### 简写规则
- 按 offset-x|offset-y|blur-radius|spread-radius|color 顺序赋值
- 赋值过程中，如遇到不支持的属性会忽略该属性；若属性值校验不合法，则忽略该值，继续校验下一个值是否合法，合法则赋值，不合法则继续校验下一个值
- android 下仅支持 shadowColor，故框架在 android 模式下不会添加 shadowOffset/shadowRadius
- 在设置 box-shadow 有效值的情况下，ios 下会新增 shadowOpacity: 1 来展示阴影
##### 代码示例
```css
/* offset-x | offset-y | blur-radius | color */
box-shadow: 0 1px 3px rgba(139,0,0,0.32);
/* x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影扩散半径 | 阴影颜色 */
/* 因第四个值 spread-radius 阴影扩散半径 不支持，故 1px 在框架处理时会被忽略 */
box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
```
> 注意事项
> - android 仅支持 shadowColor，ios 也支持 shadowOffset/shadowRadius/shadowColor/shadowOpacity, 不支持设置 spread-radius 阴影扩散半径
> - 在节点有设置 overflow:hidden; 同时设置 box-shadow，Web/小程序能正常展示阴影，RN 不能正常展示阴影，需单独新增一级节点来添加阴影
> - RN 0.76 新架构支持 [boxShadow 属性](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture#box-shadow-and-filter-style-props)
#### backface-visibility
指定当 image 背面朝向观察者时是否可见，仅 image 支持
##### 值类型
enum: visible, hidden
> 备注：仅支持 view 节点
##### 代码示例
```css
backface-visibility: visible;
```
#### object-fit
确定当元素 image 与原始图像尺寸不匹配时如何调整图像大小
##### 值类型
enum: cover, contain, fill, scale-down
> 备注：仅支持 view 节点
##### 代码示例
```css
object-fit: contain;
```
#### transform
设置旋转、缩放、倾斜或平移
##### 值类型
array of objects (only rn): [{matrix: number[]}, {perspective: number}, {rotate: string}, {rotateX: string}, {rotateY: string}, {rotateZ: string}, {scale: number}, {scaleX: number}, {scaleY: number}, {translateX: number}, {translateY: number}, {skewX: string}, {skewY: string}]

string
##### 代码示例
```css
/* rn & css */
transform: 'rotateX(45deg) rotateZ(0.785398rad)';
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
#### opacity
设置节点的不透明度
##### 值类型
number
- 0	元素完全透明 (即元素不可见).
- 任何一个位于 0.0-1.0 之间的 <number>	元素半透明 (即元素后面的背景可见).
- 1	元素完全不透明 (即元素后面的背景不可见).
> 注意事项：在 RN 上设置节点 opacity: 0; 时该节点不会触发事件响应 
##### 代码示例
``` css
/* 完全不透明 */
opacity: 1;

/* 半透明 */
opacity: 0.6;

/* 完全透明 */
opacity: 0;
```
#### pointer-events
控制视图是否可以成为触摸事件的目标
##### 值类型
enum
- auto/none
- box-none 仅 RN 支持，表示当前视图不会成为触摸事件的目标，但其子视图可以
- box-only 仅 RN 支持，表示当前视图可以成为触摸事件的目标，但其子视图不能
##### 代码示例
``` css
pointer-events: auto;
pointer-events: none;
```
#### pointer-events
控制视图是否可以成为触摸事件的目标
##### 值类型
enum
- auto/none
- box-none 仅 RN 支持，表示当前视图不会成为触摸事件的目标，但其子视图可以
- box-only 仅 RN 支持，表示当前视图可以成为触摸事件的目标，但其子视图不能
##### 代码示例
``` css
pointer-events: auto;
pointer-events: none;
```
#### overflow
控制元素溢出时所需的行为
##### 值类型
enum: visible/hidden/scroll
##### 代码示例
``` css
/* 支持 */
overflow: visible;
overflow: hidden;
overflow: scroll;

/* 不支持 */
overflow: clip;
overflow: auto;
overflow: hidden visible;
```
#### aspect-ratio
规定盒子首选纵横比
##### 值类型
number, string
##### 代码示例
``` css
/* 支持 */
aspect-ratio: 1 / 1;
aspect-ratio: 1;
aspect-ratio: 0.5;
aspect-ratio: auto;
```
#### column-gap
用来设置元素列之间的间隔大小
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
##### 代码示例
``` css
/* 支持 */
aspect-ratio: 1 / 1;
aspect-ratio: 1;
aspect-ratio: 0.5;
aspect-ratio: auto;
```
#### color
##### 值类型
color 参考 [Color](https://reactnative.dev/docs/colors)
> 备注：[文本样式继承规则](#文本样式继承)
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
> 注意事项
> - [文本样式继承规则](#文本样式继承)
> - 仅支持设置一种字体
##### 代码示例
``` css
/* 支持 */
font-family: PingFangSC-Regular

/* 不支持 */
font-family: "Gill Sans", sans-serif;
```
#### font-size
可设置字体的大小
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
> 备注：
> - [文本样式继承规则](#文本样式继承)
> - [font-size 的百分比计算](#特殊的百分比计算规则)
##### 代码示例
``` css
font-size: 12px;
font-size: 12rpx;
```
#### font-style
设置文本的字体样式。
##### 值类型
enum: normal，italic
> 备注：[文本样式继承规则](#文本样式继承)
##### 代码示例
``` css
font-style: italic;
font-style: normal;
```
#### font-weight
设置文字的权重。
##### 值类型
enum: 100，200，300，400，500，600，800，900,normal,bold
> 备注：
> - [文本样式继承规则](#文本样式继承)
> - 若在自定义字体图标上加 font-weight，可能会导致在某些安卓上不展示图标或者图标展示异常
> - 100，200，300，400，500，600，800，900 在 RN 上是字符串类型而非数值类型，非字符串类型可能会导致某些安卓机型异常
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
enum: small-caps/oldstyle-nums/lining-nums/tabular-nums/proportional-nums
> 备注：[文本样式继承规则](#文本样式继承)
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
number，单位参考[数值类型单位说明](#数值类型单位说明)
> 备注：[文本样式继承规则](#文本样式继承)
##### 代码示例
``` css
letter-spacing: 2px;
letter-spacing: 2rpx;
```
#### line-height
设置行高。
##### 值类型
number，单位参考[数值类型单位说明](#数值类型单位说明)
> 备注：
> - [文本样式继承规则](#文本样式继承)
> - [font-size 的百分比计算](#特殊的百分比计算规则)
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
> 备注：[文本样式继承规则](#文本样式继承)
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
> 备注：[文本样式继承规则](#文本样式继承)
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
#### text-decoration-style
设置文本的装饰线样式
##### 值类型
enum: solid/double/dotted/dashed
> 备注
> - [文本样式继承规则](#文本样式继承)
> - 仅 ios 支持
##### 代码示例
``` css
text-decoration-style: double;
```
#### text-decoration-color
设置文本的装饰线颜色
##### 值类型
color 参考 [Color](https://reactnative.dev/docs/colors)
> 备注
> - [文本样式继承规则](#文本样式继承)
> - 仅 ios 支持
##### 代码示例
``` css
text-decoration-color: #21ff21;
```
#### text-decoration
text-decoration-line text-decoration-style text-decoration-color 的简写格式
##### 简写规则
- 按 text-decoration-line text-decoration-style text-decoration-color 顺序赋值
- 赋值过程中，如遇到不支持的属性会忽略该属性；若属性值校验不合法，则忽略该值，继续校验下一个值是否合法，合法则赋值，不合法则继续校验下一个值
- android 下仅转换 text-decoration-line，text-decoration-style/text-decoration-color 因不支持不会添加
> 备注：[文本样式继承规则](#文本样式继承)
##### 代码示例
``` css
text-decoration: underline;
text-decoration: underline dotted;
text-decoration: underline dotted red;

```
#### text-transform
设置文本的大小写转换。
##### 值类型
enum: none, uppercase, lowercase, capitalize
> 备注：[文本样式继承规则](#文本样式继承)
##### 代码示例
``` css
/** 支持 **/
text-transform: none;
text-transform: uppercase;
text-transform: lowercase;
text-transform: capitalize;

/** 不支持 **/
text-transform: full-width;
text-transform: full-size-kana;
text-transform: math-auto;
```
#### vertical-align
用来指定行内文本的对齐方式
##### 值类型
enum: auto/top/bottom/middle
> 备注
> - [文本样式继承规则](#文本样式继承)
> - 仅 android 支持
##### 代码示例
```css
/* 支持 */
vertical-align: auto;
vertical-align: middle;
vertical-align: top;
vertical-align: bottom;

/* 不支持 */
vertical-align: baseline;
vertical-align: sub;
vertical-align: super;
vertical-align: text-top;
vertical-align: text-bottom;
```
#### user-select
用于控制用户是否可以选择文本
##### 值类型
enum: auto/text/none/contain/all
> 备注: [文本样式继承规则](#文本样式继承)
##### 代码示例
```css
/* 关键字值 */
user-select: none;
user-select: auto;
user-select: text;
user-select: contain;
user-select: all;
```
#### text-shadow
设置文本阴影，因 RN 不支持 text-shadow 属性，实际是由 mpx 按 RN 支持的 textShadowOffset: { width?: number, height?: number }; textShadowRadius: number; textShadowColor: number; 属性和顺序转换成对应的属性。
##### 值类型
offset-x|offset-y|blur-radius 值为 number，单位参考[数值类型单位说明](#数值类型单位说明)，textShadowColor 为 color 类型，参考[Color](#色值-color-类型支持的值格式说明)
##### 简写规则
- 按 offset-x|offset-y|blur-radius|color 顺序赋值
- 赋值过程中，如遇到不支持的属性会忽略该属性；若属性值校验不合法，则忽略该值，继续校验下一个值是否合法，合法则赋值，不合法则继续校验下一个值
> 备注：[文本样式继承规则](#文本样式继承)
##### 代码示例
```css
/* offset-x | offset-y | blur-radius | color */
text-shadow: 1rpx 3rpx 0 #2E0C02;

/* offset-x | offset-y */
text-shadow: 5px 10px;

/* offset-x | offset-y | color */
/* 因为第三个值是 color 类型，赋值给 textShadowRadius 检验不合法，继续赋值给下一个属性 textShadowColor 校验合法 */
text-shadow: 5px 5px #558abb;
```
### 应用能力
#### app配置
对标参考[微信app配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html), 以下仅标注支持项或者特殊关注项，未标注的均未支持
| 配置项 | 支持情况 | 特殊说明 |
| ---- | ---- | ---- |
| entryPagePath | 支持 | 无|
| pages | 支持 | 无 |
| window | 子属性部分支持 | 参考下面window配置部分 |
| tabbar | 暂未支持 | 无 |
| networkTimeout | 支持 | 无 |
| subpackages | 支持 | 分包在RN下暂未进行拆包处理，仅能正常打包在一起，分包能力待后续支持 |
| usingComponents | 支持 |  |
| vw | 支持 | 无 |

##### window配置
app里面的window配置，参考[微信内window配置说明](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#window)
| 配置项 | 支持情况 | 特殊说明 |
| ---- | ---- | ---- |
| navigationBarBackgroundColor | 支持 | 无|
| navigationBarTextStyle | 支持 | 无 |
| navigationStyle | 支持 | 无 |
| backgroundColor | 支持 | 无 |

#### 页面配置
页面配置内可配置页面级别的属性，参考[微信页面配置说明](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)
| 配置项 | 支持情况 | 特殊说明 |
| ---- | ---- | ---- |
| navigationBarBackgroundColor | 支持 | 无|
| navigationBarTextStyle | 支持 | 无 |
| navigationStyle | 支持 | 无 |
| backgroundColor | 支持 | 无 |
| usingComponents | 支持 | 无 |
| disableScroll | 不支持 | RN下默认页面不支持滚动，如需滚动需要使用可滚动的元素包裹 |

#### 状态管理
##### pinia 
暂未支持
##### store 
已支持
#### i18n
支持
#### 原子类能力
开发中，暂未支持
#### 依赖注入（Provide/Inject）
开发中，暂未支持

### 环境API

### Webview API

### 其他使用注意事项
