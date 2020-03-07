<p align="center">
  <a href="https://didi.github.io/mpx/">
    <img alt="MPX" src="https://dpubstatic.udache.com/static/dpubimg/34b5079c-0399-406d-8d2e-b8624678f7ff.png" width="546">
  </a>
</p>

<p align="center">
    An enhanced miniprogram framework with data reactivity and deep optimizition.
</p>

[![Build Status](https://travis-ci.org/didi/mpx.svg?branch=master)](https://travis-ci.org/didi/mpx)

## 简介

Mpx是一款致力于提高小程序开发体验的增强型小程序框架，通过Mpx，我们能够以最先进的web开发体验来开发生产性能深度优化的小程序。Mpx具有以下一些优秀特性：
* 数据响应特性([watch](https://didi.github.io/mpx/single/script-enhance.html#watch) / [computed](https://didi.github.io/mpx/single/script-enhance.html#computed))
* 增强的模板语法([动态组件](https://didi.github.io/mpx/single/template-enhance.html#%E5%8A%A8%E6%80%81%E7%BB%84%E4%BB%B6) / [样式绑定 / 类名绑定 ](https://didi.github.io/mpx/single/template-enhance.html#class%E4%B8%8Estyle%E7%BB%91%E5%AE%9A) / [内联事件函数](https://didi.github.io/mpx/single/template-enhance.html#%E5%86%85%E8%81%94%E4%BA%8B%E4%BB%B6%E7%BB%91%E5%AE%9A) / [双向绑定](https://didi.github.io/mpx/single/template-enhance.html#%E5%8F%8C%E5%90%91%E7%BB%91%E5%AE%9A) 等)
* [深度性能优化](https://didi.github.io/mpx/understanding/understanding.html#%E6%95%B0%E6%8D%AE%E5%93%8D%E5%BA%94%E4%B8%8E%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96)(原生自定义组件/基于依赖收集和数据变化的setData)
* Webpack编译(npm/循环依赖/Babel/ESLint/css预编译/代码优化等)
* [单文件组件开发](https://didi.github.io/mpx/single/what-is-single-file.html#%E5%8D%95%E6%96%87%E4%BB%B6)
* [渐进接入 / 原生组件支持](https://didi.github.io/mpx/progressive.html)
* [状态管理](https://didi.github.io/mpx/store/#%E6%95%B0%E6%8D%AE%E7%AE%A1%E7%90%86)(Vuex规范/多实例/可合并)
* 跨团队合作([packages](https://didi.github.io/mpx/single/json-enhance.html#packages))
* 逻辑复用能力([mixins](https://didi.github.io/mpx/single/script-enhance.html#mixins))
* 脚手架支持
* 小程序自身规范的完全支持
* [多平台支持](https://didi.github.io/mpx/platform.html#%E5%A4%9A%E5%B9%B3%E5%8F%B0%E6%94%AF%E6%8C%81)(微信、支付宝、百度、qq、头条)
* [跨平台编译](https://didi.github.io/mpx/platform.html#%E8%B7%A8%E5%B9%B3%E5%8F%B0%E7%BC%96%E8%AF%91)(支持将微信小程序转换为支付宝、百度、qq、头条小程序)
* [TypeScript支持](https://didi.github.io/mpx/ts.html)(完善的类型推导)

Mpx2.0正式发布！支持目前业内全部小程序平台及跨小程序平台编译，[点此查看详情](https://github.com/didi/mpx/releases/tag/v2.0.0)，[点此查看迁移指南](https://didi.github.io/mpx/migrate.html)

## 使用

```bash
# 安装mpx命令行工具
npm i -g @mpxjs/cli

# 初始化项目
mpx init <project-name>

# 进入项目目录
cd <project-name>

# 安装依赖
npm i

# development
npm run watch

# production
npm run build -p
```

使用微信开发者工具打开项目文件夹即可预览效果。

## 文档

https://didi.github.io/mpx

[官方示例项目](https://github.com/didi/mpx/tree/master/examples)

## 设计思路

目前业界主流的小程序框架主要有WePY，mpvue和Taro，这三者都是将其他的语法规范转译为小程序语法规范，我们称其为转译型框架。不同于上述三者，Mpx是一款基于小程序语法规范的增强型框架，我们使用Vue中优秀的语法特性增强了小程序，而不是让用户直接使用vue语法来开发小程序，之所以采用这种设计主要是基于如下考虑：

- 转译型框架无法支持源框架的所有语法特性(如Vue模板中的动态特性或React中动态生成的jsx)，用户在使用源框架语法进行开发时可能会遇到不可预期的错误，具有不确定性
- 小程序本身的技术规范在不断地更新进步，许多新的技术规范在转译型框架中无法支持或需要很高的支持成本，而对于增强型框架来说只要新的技术规范不与增强特性冲突，就能够直接支持

## 生态周边

|包名|版本|描述|
|-----|----|----|
|@mpxjs/core|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fcore.svg)](https://badge.fury.io/js/%40mpxjs%2Fcore)|mpx运行时核心|
|@mpxjs/webpack-plugin|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fwebpack-plugin.svg)](https://badge.fury.io/js/%40mpxjs%2Fwebpack-plugin)|mpx编译核心|
|@mpxjs/cli|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fcli.svg)](https://badge.fury.io/js/%40mpxjs%2Fcli)|mpx脚手架命令行工具|
|@mpxjs/fetch|[![npm version](https://badge.fury.io/js/%40mpxjs%2Ffetch.svg)](https://badge.fury.io/js/%40mpxjs%2Ffetch)|mpx网络请求库，处理wx并发请求限制|
|@mpxjs/webview-bridge|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fwebview-bridge.svg)](https://badge.fury.io/js/%40mpxjs%2Fwebview-bridge)|为跨小程序平台的H5项目提供通用的webview-bridge|
|@mpxjs/api-proxy|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fapi-proxy.svg)](https://badge.fury.io/js/%40mpxjs%2Fapi-proxy)|将各个平台的 api 进行转换，也可以将 api 转为 promise 格式|
|@mpxjs/mock|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fmock.svg)](https://badge.fury.io/js/%40mpxjs%2Fmock)|结合mockjs提供数据mock能力|

## 交流

提供 微信群 / QQ群 两种交流方式

#### 添加MPX入群客服等待受邀入群

<img alt="Mpx-wx客服" src="https://dpubstatic.udache.com/static/dpubimg/3c2048fd-350d-406f-8a84-a3a7b8b9dcf3.jpg" width="300">

#### 扫码进入QQ群

<img alt="Mpx-QQ群" src="https://dpubstatic.udache.com/static/dpubimg/ArcgC_eEr/temp_qrcode_share_374632411.png" width="300">
