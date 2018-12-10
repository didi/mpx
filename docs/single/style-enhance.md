# style域扩展

## 自动检测loader
 
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

## rpx转换

为了处理某些ide中不支持`rpx`单位的问题，`mpx`提供了一个将px转换为rpx的功能

详情请查看[mpx-loader选项](/compilationEnhance/index.md#mpxwebpackpluginloader)