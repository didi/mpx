---
home: true
heroImage: /logo.png
heroText: null
tagline: An enhanced miniprogram framework with data reactivity and deep optimizition.
actionText: 快速上手 →
actionLink: /guide/start
features:
- title: 数据响应特性
  details: watch / computed
- title: 增强的模板语法
  details: 动态组件 / 样式绑定 / 类名绑定 / 内联事件函数 / 双向绑定 等
- title: 深度性能优化
  details: 原生自定义组件/基于依赖收集和数据变化的setData
- title: 渐进接入
  details: 原生组件支持，小程序自身规范的完全支持
- title: 状态管理
  details: Vuex规范/多实例/可合并
- title: 逻辑复用能力
  details: mixins
- title: TypeScript支持
  details: 完善的类型推导
- title: Webpack编译
  details: npm/循环依赖/Babel/ESLint/css预编译/代码优化等
- title: 跨平台编译
  details: 支持将微信小程序转换为支付宝、百度、qq、头条小程序
footer: MIT Licensed
---

## 使用

``` shell
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