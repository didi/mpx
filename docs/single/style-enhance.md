# style增强特性

## css预处理器
 
`mpx`支持所有主流的`css预编译处理`，只需要在`<style>`的`lang`中设置使用的预编译语言`（stylus/less/sass等）`并且安装对应的`webpack-loader`即可正常使用。
 
 示例：
 ```vue
<template>
  <view class="container">
    <text class="item">123</text>
  </view>
</template>

<style lang="stylus">
.container
 padding 10px
 .item
     text-align center
</style>
 ```
 
## 样式引用

两种方式引用：
- style内使用@import语法引入
- 在style标签上通过src引入

前者会被内联打入 组件/页面 对应的wxss文件，后者则是会将src对应的文件收集到wxss文件夹里，再在 组件/页面 对应的wxss文件中通过@import引入。

在一个mpx文件中，两者可以同时使用，例如：

```vue
<!--src/components/test.mpx-->
<!--省略template\script\json部分-->

<!--这个部分的样式会被收集进wxss文件夹再被test.wxss引入-->
<style src="../common/index.css"></style>

<style>
/*这个部分的代码会被内联打入test.wxss*/
.test {
  background-color: red;
}
</style>

<!--也可以使用样式预处理语言比如sass、stylus、less等等-->
<style lang="scss" src="../style/test.scss"></style>
```

**建议对于多个 页面/组件 公用的样式，使用src形式引入，避免一份样式被内联打成多份。**

## rpx转换

为了处理某些ide中不支持`rpx`单位的问题，`mpx`提供了一个将px转换为rpx的功能

详情请查看[mpx-loader选项](/compilationEnhance/index.md#mpxwebpackpluginloader)
