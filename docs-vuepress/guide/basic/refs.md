# 获取组件实例/节点信息

微信小程序中原生提供了`selectComponent/SelectorQuery.select`方法获取自定义组件实例和wxml节点信息，但是该api使用起来不太方便，并且不具备平台无关性，我们提供了增强指令`wx:ref`用于获取组件实例及节点信息，该指令的使用方式同vue中的ref类似，在模板中声明了`wx:ref`后，在组件ready后用户可以通过`this.$refs`获取对应的组件实例或节点查询对象(NodeRefs)，调用响应的组件方法或者获取视图节点信息。

> `wx:ref`其实也是模板编译和运行时注入结合实现的语法糖，本质还是通过原生小程序平台提供的能力进行获取，其实现的主要意义在于抹平跨平台差异以及提升用户的使用体验。

简单的使用示例如下：

todo 组件和节点的简单示例，包含template和script

## 在列表渲染中使用`wx:ref`

在列表渲染中定义的`wx:ref`存在多个实例/节点，Mpx会在模板编译中判断某个`wx:ref`是否存在于列表渲染`wx:for`中，是的情况下在注入`this.$refs`时会通过`selectAllComponents/SelectQuery.selectAll`方法获取组件实例数组或数组节点查询对象，确保开发者能拿到列表渲染中所有的组件实例/节点信息。

使用示例如下：

todo wx:for中的组件和节点的简单示例，包含template和script
