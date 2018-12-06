# 单文件

介绍单文件编译开发特性，包括单文件中有哪些部分以及如何进行ide配置等

## 介绍

按照小程序的文件规范，app & page & component 的组成部分都是四个文件，js, wxss, wxml, json; 多文件的形式在开发上体验并不是特别友好，使用过`vue`的同学都知道，单文件的开发模式更内聚，更可维护。因此mpx也提供了单文件开发模式，文件扩展名为 `.mpx`

通过 `webpack` 构建工具和 `mpx-loader` 可以将文件扩展名为 .mpx 的 `single file component` 转换成小程序所需要的四个文件。

这四个文件对应于单文件中的四个区域

### 基础例子

```html
<!--对应wxml文件-->
<template>
  <view>hello mpx</view>
</template>
<!--对应js文件-->
<script>
</script>
<!--对应wxss文件-->
<style lang="stylus">
</style>
<!--对应json文件-->
<script type="application/json">
</script>
```

## 编辑器/IDE高亮、提示

- [IntelliJ](what-is-single-file.md#IntelliJ)
- [vscode](what-is-single-file.md#vscode)

#### IntelliJ

如果使用IntelliJ系IDE开发，可将mpx后缀文件关联到vue类型，按vue解析。  
![关联文件类型](../images/start-tips2.png)  
但会报一个warning提示有重复的script标签，关闭该警告即可。  
![关闭警告](../images/start-tips1.png)


#### vscode

`.mpx`采用类似于`.vue`的单文件语法风格，在Visual Studio Marketplace中获取[vue语法高亮插件](https://marketplace.visualstudio.com/items?itemName=liuji-jim.vue)
然后通过[配置vscode扩展语言](https://code.visualstudio.com/docs/languages/overview#_adding-a-file-extension-to-a-language)
，将`.mpx`绑定到`.vue`语法的支持
