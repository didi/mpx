# 单文件开发 {#single-file-development}

小程序规范中每个页面和组件都是由四个文件描述组成的，wxml/js/wxss/json，分别描述了组件/页面的视图模板，执行逻辑，样式和配置，由于这四个部分彼此之间存在相关性，比如模板中的组件需要在 json 中注册，数据需要在 js 中定义，这种离散的文件结构在实际开发的时候体验并不理想；受 Vue 单文件开发的启发，Mpx 也提供了类似的单文件开发模式，拓展名为.mpx。

Mpx 单文件组件（SFC）格式 `.mpx` 是一种将组件的视图模板、组件逻辑、组件样式和组件配置封装在一个文件中的开发模式。每个 `.mpx` 文件都包含了以下几个部分：

- template 区块：定义组件的视图结构，基于微信小程序的基础模板语法，结合 Mpx 拓展支持的类 Vue 模版指令，如 `wx:style`、`wx:class`、`wx:model`、`wx:ref` 等，对应微信小程序的 `.wxml` 部分
- script 区块：定义组件的逻辑，基于微信小程序的基础组件语法，结合 Mpx 拓展支持的类 Vue 组件语法，如 数据响应、组合式 API 等，对应微信小程序的 `.js` 部分
- style 区块：定义组件的样式，支持 CSS 预处理（如 Stylus、Sass、Less 等），跨端输出 RN 时存在较强约束限制，对应微信小程序的 `.wxss` 部分
- json 区块：定义组件的配置，支持微信小程序的组件配置选项，对应微信小程序的 `.json` 部分

简单示例如下：

```html
<!--对应.wxml文件-->
<template>
  <list></list>
</template>
<!--对应.js文件-->
<script>
  import { createPage } from "@mpxjs/core"

  createPage({
    onLoad() {},
    onReady() {}
  })
</script>
<!--对应.wxss文件-->
<style lang="stylus"></style>
<!--对应.json文件-->
<script type="application/json">
  {
    "usingComponents": {
      "list": "../components/list"
    }
  }
</script>
```
