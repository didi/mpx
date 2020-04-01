<p align="center">
  <a href="https://didi.github.io/mpx/">
    <img alt="MPX" src="https://dpubstatic.udache.com/static/dpubimg/34b5079c-0399-406d-8d2e-b8624678f7ff.png" width="546">
  </a>
</p>

<p align="center">
    一款具有优秀开发体验和深度性能优化的增强型小程序开发框架。
</p>

[![Build Status](https://travis-ci.org/didi/mpx.svg?branch=master)](https://travis-ci.org/didi/mpx)

## 简介

Mpx是一款致力于提高小程序开发体验和开发效率的增强型小程序框架，通过Mpx，我们能够高效优雅地开发出具有极致性能的优质小程序应用，并将其输出到各大小程序平台和web平台中运行。

Mpx具有以下功能特性：
* 数据响应 (赋值响应 / [watch](https://didi.github.io/mpx/single/script-enhance.html#watch) / [computed](https://didi.github.io/mpx/single/script-enhance.html#computed))
* 增强模板语法 ([动态组件](https://didi.github.io/mpx/single/template-enhance.html#%E5%8A%A8%E6%80%81%E7%BB%84%E4%BB%B6) / [样式绑定 / 类名绑定 ](https://didi.github.io/mpx/single/template-enhance.html#class%E4%B8%8Estyle%E7%BB%91%E5%AE%9A) / [内联事件函数](https://didi.github.io/mpx/single/template-enhance.html#%E5%86%85%E8%81%94%E4%BA%8B%E4%BB%B6%E7%BB%91%E5%AE%9A) / [双向绑定](https://didi.github.io/mpx/single/template-enhance.html#%E5%8F%8C%E5%90%91%E7%BB%91%E5%AE%9A) / [refs](https://didi.github.io/mpx/single/template-enhance.html#refs))
* 极致性能 ([运行时性能优化](https://didi.github.io/mpx/understanding/understanding.html#%E6%95%B0%E6%8D%AE%E5%93%8D%E5%BA%94%E4%B8%8E%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96) / [包体积优化](https://didi.github.io/mpx/understanding/understanding.html#%E5%88%86%E5%8C%85%E5%A4%84%E7%90%86%E7%BB%86%E8%8A%82) / 框架运行时体积14KB)
* [高效强大的编译构建](https://didi.github.io/mpx/understanding/understanding.html#%E7%BC%96%E8%AF%91%E6%9E%84%E5%BB%BA) (基于webpack / 兼容webpack生态 / 兼容原生小程序 / 完善支持npm场景下的分包输出 / 高效调试)
* [单文件组件开发](https://didi.github.io/mpx/single/what-is-single-file.html#%E5%8D%95%E6%96%87%E4%BB%B6)
* [渐进接入 / 原生组件支持](https://didi.github.io/mpx/progressive.html)
* [状态管理](https://didi.github.io/mpx/store/#%E5%A4%9A%E5%AE%9E%E4%BE%8B) (Vuex规范 / 支持多实例Store)
* 跨团队开发 ([packages](https://didi.github.io/mpx/single/json-enhance.html#packages))
* 逻辑复用 ([mixins](https://didi.github.io/mpx/single/script-enhance.html#mixins))
* [周边能力支持](https://didi.github.io/mpx/extend/) (fetch / api增强 / mock / webview-bridge)
* 脚手架支持
* [多平台增强](https://didi.github.io/mpx/platform.html#%E5%A4%9A%E5%B9%B3%E5%8F%B0%E6%94%AF%E6%8C%81) (支持在微信、支付宝、百度、qq、头条小程序平台中进行增强开发)
* [跨平台编译](https://didi.github.io/mpx/platform.html#%E8%B7%A8%E5%B9%B3%E5%8F%B0%E7%BC%96%E8%AF%91) (支持以微信为base，将一套代码转换输出到支付宝、百度、qq、头条小程序平台和[web平台](https://didi.github.io/mpx/platform.html#%E8%B7%A8%E5%B9%B3%E5%8F%B0%E8%BE%93%E5%87%BAweb)中运行)
* [TypeScript支持](https://didi.github.io/mpx/ts.html) (基于ThisType实现了完善的类型推导)
* [I18n国际化](https://didi.github.io/mpx/i18n.html)
* 单元测试支持 (即将到来)
* 快应用输出 (即将到来)

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
npm run build
```

使用小程序开发者工具打开项目文件夹下dist中对应平台的文件夹即可预览效果。

## 文档

https://didi.github.io/mpx

[官方示例项目](https://github.com/didi/mpx/tree/master/examples)

## 设计思路

Mpx的核心设计思路为增强，不同于业内大部分小程序框架将web MVVM框架迁移到小程序中运行的做法，Mpx以小程序原生的语法和技术能力为基础，借鉴参考了主流的web技术设计对其进行了扩展与增强，并在此技术上实现了以微信增强语法为base的同构跨平台输出，该设计带来的好处如下：
* 良好的开发体验：在方便使用框架提供的便捷特性的同时，也能享受到媲美原生开发的确定性和稳定性，完全没有`框架太多坑，不如用原生`的顾虑；不管是增强输出还是跨平台输出，最终的dist代码可读性极强，便于调试排查；
* 极致的性能：得益于增强的设计思路，Mpx框架在运行时不需要做太多封装抹平转换的工作，框架的运行时部分极为轻量简洁，压缩+gzip后仅占用14KB；配合编译构建进行的包体积优化和基于模板渲染函数进行的数据依赖跟踪，Mpx框架在性能方面做到了业内最优([小程序框架运行时性能评测报告]())；
* 完整的原生兼容：同样得益于增强的设计思路，Mpx框架能够完整地兼容小程序原生技术规范，并且做到实时跟进。在Mpx项目中开发者可以方便地使用业内已有的小程序生态，如组件库、统计工具等；原生开发者们可以方便地进行渐进迁移；甚至可以将框架的跨平台编译能力应用在微信的原生小程序组件当中进行跨平台输出。


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

## 成功案例

<div>
    <img src="https://user-images.githubusercontent.com/6292668/75111787-a30fb000-5678-11ea-9ef1-78b18973ee75.jpg" width="100" title="滴滴出行"/>
    <img src="https://user-images.githubusercontent.com/7993339/75113972-5387af00-568d-11ea-96c9-fe8122ce1032.jpg" width="100" title="彗星英语"/>
    <img src="https://user-images.githubusercontent.com/18588816/75115186-322bc080-5697-11ea-9036-46066a19b65b.jpg" width="100" title="番薯借阅"/>
    <img src="https://user-images.githubusercontent.com/16451550/75129100-6c7e7780-5702-11ea-87c0-dd3faf7a7538.jpg" width="100" title="疫查查应用"/>
    <img src="https://user-images.githubusercontent.com/18554963/75134630-d8b8a580-5719-11ea-86fb-c3fdb8fbc144.png" width="100" title="滴滴金融小程序"/>
    <img src="https://user-images.githubusercontent.com/6810697/75212604-69e35700-57c2-11ea-9190-d8a6cb77ba9d.jpg" width="100" title="小桔养车"/>
    <img src="https://user-images.githubusercontent.com/6810697/75530109-a2976080-5a4e-11ea-97fa-01a433538ece.jpeg" width="100" title="学而思网校免费直播课"/>
    <img src="https://user-images.githubusercontent.com/6810697/75531887-26514d00-5a4f-11ea-81c8-3df632531178.jpeg" width="100" title="小猴启蒙课"/>
    <img src="https://user-images.githubusercontent.com/10382462/76416594-547f4700-63d6-11ea-9e9f-390a64e6b9c5.png" width="100" title="科创书店"/>
    <img src="https://user-images.githubusercontent.com/14816052/76678054-9fd06a00-660f-11ea-8631-be93fe3dc2c2.jpg" width="100" title="在武院"/>
    <img src="https://user-images.githubusercontent.com/17399581/77496337-b7b4b300-6e85-11ea-99b8-0ce90844ec67.jpg" width="100" title="三股绳Lite - 群打卡"/>
</div>    

[更多案例](https://github.com/didi/mpx/issues/385)，若你也在使用Mpx框架开发小程序，并想分享给大家，请填在此issue中。

## 交流

提供 微信群 / QQ群 两种交流方式

#### 添加MPX入群客服等待受邀入群

<img alt="Mpx-wx客服" src="https://dpubstatic.udache.com/static/dpubimg/3c2048fd-350d-406f-8a84-a3a7b8b9dcf3.jpg" width="300">

#### 扫码进入QQ群

<img alt="Mpx-QQ群" src="https://dpubstatic.udache.com/static/dpubimg/ArcgC_eEr/temp_qrcode_share_374632411.png" width="300">

图片因github网络问题导致不可见的朋友可以点击该链接：https://s.didi.cn/rod
