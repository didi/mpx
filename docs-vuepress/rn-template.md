# Mpx转RN模版使用指南

## 模版指令规范



## 事件编写方式（bind，内联传参，动态事件绑定）



## 基础组件

目前 Mpx 输出RN仅支持以下组件，具体使用范围可参考如下文档

### view

#### 属性
#### 事件
#### 注意事项

### text

#### 属性
#### 事件
#### 注意事项

### image

#### 属性
#### 事件
#### 注意事项


### textarea

#### 属性
#### 事件
#### 注意事项

### input

#### 属性
#### 事件
#### 注意事项

### button

#### 属性
#### 事件
#### 注意事项


### scroll-view
可滚动视图区域

#### 属性

| 属性名                   | 类型     | 默认值     | 说明                                               |
| ----------------------- | ------- | --------- | -------------------------------------------------- |
| scroll-x                | Boolean | `false`   | 控制当前滚动方向，默认纵向滚动                          |
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
| show-scrollbar          | Number  | `false`   | 滚动条显隐控制 (同时开启 enhanced 属性后生效)|


#### 事件

| 事件名           | 说明                |
| ----------------| ------------------ |
| binddragstart| 滑动开始事件，同时开启 enhanced 属性后生效|
| binddragging| 滑动事件，同时开启 enhanced 属性后生效 |
| binddragend| 滑动结束事件，同时开启 enhanced 属性后生效 |
| bindscrolltoupper   | 滚动到顶部/左边触发 | 
| bindscrolltolower   | 滚动到底部/右边触发 | 
| bindscroll          | 滚动时触发         | 
| bindrefresherrefresh| 自定义下拉刷新被触发 |  

#### 注意事项
