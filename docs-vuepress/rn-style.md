# Mpx转RN样式使用指南

## 转RN样式介绍 胡曼
React Native的样式的支持基本为web样式的一个子集，同时还有一些属性并未与Web对齐，因此跨平台输出RN时，为了保障多端输出样式一致，可参考本文针对样式在RN上的支持情况来进行样式编写

## 布局说明 尚群峰
### flex布局
在React Native中，可以通过Flexbox规则来布局组件元素。基于yoga布局引擎实现，可查看[文档](https://github.com/facebook/yoga)。

注：RN中View标签的主轴是column，和css不一致，使用mpx开发会进行磨平，默认的主轴方向是row。

### position布局
在RN中position仅支持relative（默认）和 absolute。可[参考文档](https://reactnative.dev/docs/layout-props#position)。


## 选择器  胡曼

## 样式规则
这块做一个说明 （胡曼）

### 样式转换 华静文
编译转换
#### 单位支持
#### 缩写支持

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
#### view 尚群峰
图片
为实现和小程序类似的效果，我们会进行对View进行包裹，


## 各属性支持情况
balabala我是一波介绍

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


### 图片 华静文

### 阴影  胡曼

### 文本 群峰

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

### view 胡曼
#### margin
支持情况：完全支持
代码示例：
`css
 margin: 
#### margin-top
#### margin-left
#### margin-right
#### margin-bottom
#### padding
#### border
