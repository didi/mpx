# Mpx转RN样式使用指南

## 转RN样式介绍 胡曼
React Native的样式的支持基本为web样式的一个子集，同时还有一些属性并未与Web对齐，因此跨平台输出RN时，为了保障多端输出样式一致，可参考本文针对样式在RN上的支持情况来进行样式编写

## 布局说明 尚群峰
### flex布局
### position布局

## 选择器  胡曼

## 样式规则
这块做一个说明 （胡曼）

### 样式转换规则
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
#### 单位支持
- number
  - 大小宽高类数值型单位支持 px rpx % 三种
- color
  - 支持的 color 值的类型参考rn文档 https://reactnative.dev/docs/colors
#### 缩写支持
- text-decoration
  - 仅支持 text-decoration-line text-decoration-style text-decoration-color 这种顺序，值以空格分隔按顺序赋值
- margin|padding
  - 支持 margin 0; margin 0 auto; margin 0 auto 10px; margin 0 10px 10px 20px;这四种格式
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
  - 仅支持 border-radius 0px or border-radius 0px 0px 0px 0px（值以空格分隔按顺序赋值）

### 样式增强
#### text  尚群峰
##### 文本节点说明 
##### 文本节点text与样式继承
##### view标签内的文本添加text包裹
##### view内设定的文本类样式会下沉设置到text标签内
#### 图片
为了对齐rn和web的展示效果，我们给 Image 组件增加了以下默认样式：
```css

```
#### button
为了对齐rn和web的展示效果，我们给 button 组件增加了以下默认样式：
```css

```
#### view 尚群峰
背景图片


## 各属性支持情况
balabala我是一波介绍

### flex布局 群峰
#### flex
支持情况：部分支持，只支持xxx
代码示例：

#### align-items
#### justify-content
#### 

### position布局 群峰
#### position 
#### top
#### right
#### z-index

### 背景相关 群峰


### 阴影  胡曼

### 文本相关 群峰

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
