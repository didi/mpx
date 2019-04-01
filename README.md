<p align="center">
  <a href="https://didi.github.io/mpx/">
    <img alt="babel" src="https://dpubstatic.udache.com/static/dpubimg/34b5079c-0399-406d-8d2e-b8624678f7ff.png" width="546">
  </a>
</p>

<p align="center">
    An enhanced miniprogram framework with data reactivity and deep optimizition.
</p>

[![Build Status](https://travis-ci.org/didi/mpx.svg?branch=master)](https://travis-ci.org/didi/mpx)

## 简介

Mpx是一款致力于提高小程序开发体验的增强型小程序框架，通过Mpx，我们能够以最先进的web开发体验(Vue + Webpack)来开发生产性能深度优化的小程序，Mpx具有以下一些优秀特性：
* 数据响应特性(watch/computed)
* 增强的模板语法(动态组件/样式绑定/类名绑定/内联事件函数/双向绑定等)
* 深度性能优化(原生自定义组件/基于依赖收集和数据变化的setData)
* Webpack编译(npm/循环依赖/Babel/ESLint/css预编译/代码优化等)
* 单文件组件开发
* 原生组件支持
* 状态管理(Vuex规范/多实例/可合并)
* 跨团队合作(packages)
* 逻辑复用能力(mixins)
* 脚手架支持
* 小程序自身规范的完全支持
* 支付宝小程序的支持

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
|@mpxjs/promisify|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fpromisify.svg)](https://badge.fury.io/js/%40mpxjs%2Fpromisify)|将小程序的api转为promise|
|@mpxjs/url-loader|[![npm version](https://badge.fury.io/js/%40mpxjs%2Furl-loader.svg)](https://badge.fury.io/js/%40mpxjs%2Furl-loader)|处理wxss中图像资源只能用base64引用|
|@mpxjs/transform-api|[![npm version](https://badge.fury.io/js/%40mpxjs%2transform-api.svg)](https://badge.fury.io/js/%40mpxjs%2transform-api)|将各个平台的小程序 api 进行转换|

## 交流

打开链接扫码进入微信群或QQ群：https://s.didi.cn/rod
