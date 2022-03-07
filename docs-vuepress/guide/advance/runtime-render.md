# 运行时渲染（实验特性）

### 介绍

页面/组件基于[小程序 template 模板](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/template.html)渲染。

开启了运行时渲染的页面/组件，在编译环节生成了描述模板的 `vdom tree`，这部分的数据最终会驱动基础模板完成页面/组件的渲染。

对于开启了运行时渲染的组件，提供了增强的 `wx:bind` 指令，该指令的特性是接收聚合 `props` 对象透传至子组件，即子组件接收属性的方式可以更加简化，特别适用于嵌套组件参数透传的场景。

### 基本使用

约定：使用 `.runtime.mpx` 作为后缀名的页面/组件开启运行时渲染。

```html
<!-- 普通组件 -->
<btn-group inline bolder text="按钮组" open-type="getUserInfo"></btn-group>

<!-- 运行时组件 -->
<btn-group wx:bind="{{ btnGroupProps }}"></btn-group>
```

### 注意事项

* 目前仅支持**微信**小程序平台，其他平台暂不支持；
* 目前仅支持**主包项目**当中使用运行时页面/组件的特性；
* 运行时页面/组件暂不支持 `<component is="xxx"></component>` 动态组件；