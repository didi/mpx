# MPX

[![Build Status](https://travis-ci.org/didi/mpx.svg?branch=master)](https://travis-ci.org/didi/mpx)

## 简介

Mpx是一款致力于提高小程序开发体验的增强型小程序框架，通过Mpx，我们可以在小程序开发中享受到最先进的web开发体验(Vue + Webpack)，Mpx具有以下一些优秀特性：
* 单文件组件
* 数据响应特性(watch/computed)
* 增强的模板语法(动态组件/样式绑定/类名绑定/内联事件函数/双向绑定等)
* 状态管理(Vuex规范/多实例/可合并)
* 逻辑复用能力(mixins)
* Webpack编译(npm/循环依赖/Babel/ESLint/css预编译/代码优化等)
* 跨团队合作(packages)
* 深度性能优化(setData优化)
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

打开微信开发者工具打开项目目录下的dist文件夹即可预览效果。

## 文档

https://didi.github.io/mpx

## 生态周边

|包名|版本|描述|
|-----|----|----|
|@mpxjs/core|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fcore.svg)](https://badge.fury.io/js/%40mpxjs%2Fcore)|mpx微信运行时核心|
|@mpxjs/core-ant|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fcore-ant.svg)](https://badge.fury.io/js/%40mpxjs%2Fcore-ant)|mpx支付宝运行时核心|
|@mpxjs/webpack-plugin|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fwebpack-plugin.svg)](https://badge.fury.io/js/%40mpxjs%2Fwebpack-plugin)|mpx编译核心|
|@mpxjs/fetch|[![npm version](https://badge.fury.io/js/%40mpxjs%2Ffetch.svg)](https://badge.fury.io/js/%40mpxjs%2Ffetch)|mpx网络请求库，处理wx并发请求限制|
|@mpxjs/promisify|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fpromisify.svg)](https://badge.fury.io/js/%40mpxjs%2Fpromisify)|将小程序的api转为promise|
|@mpxjs/url-loader|[![npm version](https://badge.fury.io/js/%40mpxjs%2Furl-loader.svg)](https://badge.fury.io/js/%40mpxjs%2Furl-loader)|处理wxss中图像资源只能用base64引用|
