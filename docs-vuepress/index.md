---
home: true
heroImage: /logo.png
heroText: null
tagline: An enhanced miniprogram framework with data reactivity and deep optimizition.
actionText: 快速上手 →
actionLink: /guide/start
features:
- title: 高效稳定
  details: 以增强的方式将Vue中大量优良特性引入到小程序开发中，配合灵活强大的编译构建，大大提升了小程序开发体验和效率，同时提供了媲美原生开发的稳定性。
- title: 高性能
  details: 框架自带深度的运行时性能优化及包体积优化，让开发者在大多数场景下只需专注于业务开发，就能生产出媲美原生的高性能小程序应用。
- title: 跨平台
  details: 一份源码，多端运行，Mpx专注解决小程序跨端问题，以静态编译为主要手段，将业务源码输出到微信/支付宝/百度/头条/QQ小程序平台和web环境下运行。
---

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
* 极致的性能：得益于增强的设计思路，Mpx框架在运行时不需要做太多封装抹平转换的工作，框架的运行时部分极为轻量简洁，压缩+gzip后仅占用14KB；配合编译构建进行的包体积优化和基于模板渲染函数进行的数据依赖跟踪，Mpx框架在性能方面做到了业内最优([小程序框架运行时性能评测报告](https://github.com/hiyuki/mp-framework-benchmark/blob/master/README.md))；
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

微信小程序

|<img src="https://user-images.githubusercontent.com/6292668/75111787-a30fb000-5678-11ea-9ef1-78b18973ee75.jpg" width="100" title="滴滴出行"/>|<img src="https://user-images.githubusercontent.com/6292668/75132678-db63cc80-5712-11ea-93ba-0b9f3201dbe3.jpg" width="100" title="滴滴出行营销小程序"/>|<img src="https://user-images.githubusercontent.com/6292668/75133566-44007880-5716-11ea-9090-6e8acb0d77f1.jpg" width="100" title="滴滴动态公交"/>|<img src="https://user-images.githubusercontent.com/18554963/75134630-d8b8a580-5719-11ea-86fb-c3fdb8fbc144.png" width="100" title="滴滴金融"/>|<img src="https://user-images.githubusercontent.com/6292668/75148361-67d5b580-573a-11ea-873b-dd4dcf438bec.png" width="100" title="滴滴外卖"/>|<img src="https://user-images.githubusercontent.com/9695264/75208528-ecfeb000-57b6-11ea-8c24-e9403df2a8a8.jpg" width="100" title="司机招募"/>|<img src="https://user-images.githubusercontent.com/6810697/75212655-87b0bc00-57c2-11ea-9e44-e1f62861feb8.png" width="100" title="小桔加油"/>|
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
|滴滴出行|出行广场|滴滴公交|滴滴金融|滴滴外卖|司机招募|小桔加油|
|<img src="https://user-images.githubusercontent.com/7993339/75113972-5387af00-568d-11ea-96c9-fe8122ce1032.jpg" width="100" title="彗星英语"/>|<img src="https://user-images.githubusercontent.com/18588816/75115186-322bc080-5697-11ea-9036-46066a19b65b.jpg" width="100" title="番薯借阅"/>|<img src="https://user-images.githubusercontent.com/16451550/75129100-6c7e7780-5702-11ea-87c0-dd3faf7a7538.jpg" width="100" title="疫查查应用"/>|<img src="https://user-images.githubusercontent.com/6810697/75212604-69e35700-57c2-11ea-9190-d8a6cb77ba9d.jpg" width="100" title="小桔养车"/>|<img src="https://user-images.githubusercontent.com/6810697/75530109-a2976080-5a4e-11ea-97fa-01a433538ece.jpeg" width="100" title="学而思网校免费直播课"/>|<img src="https://user-images.githubusercontent.com/6810697/75531887-26514d00-5a4f-11ea-81c8-3df632531178.jpeg" width="100" title="小猴启蒙课"/>|<img src="https://user-images.githubusercontent.com/10382462/76416594-547f4700-63d6-11ea-9e9f-390a64e6b9c5.png" width="100" title="科创书店"/>|
|彗星英语|番薯借阅|疫查查应用|小桔养车|学而思直播课|小猴启蒙课|科创书店|
|<img src="https://user-images.githubusercontent.com/14816052/76678054-9fd06a00-660f-11ea-8631-be93fe3dc2c2.jpg" width="100" title="在武院"/>|<img src="https://user-images.githubusercontent.com/17399581/77496337-b7b4b300-6e85-11ea-99b8-0ce90844ec67.jpg" width="100" title="三股绳Lite - 群打卡"/>|<img src="https://user-images.githubusercontent.com/6810697/75530379-b80c8a80-5a4e-11ea-9962-add87d56a320.jpeg" width="100" title="学而思网校优选课"/>|<img src="https://camo.githubusercontent.com/8874e8affe1a73de24a94de7072df0d0ccaf2f99/68747470733a2f2f73686978682e636f6d2f73686571752f696d672f7172636f64655f322e37343664373562342e706e67" width="100" title="食享会"/>|<img src="https://user-images.githubusercontent.com/7945757/75128784-c4b47a00-5700-11ea-9a45-4ac0ccdad7ed.png" width="100" title="青铜安全医生"/>|<img src="https://user-images.githubusercontent.com/7945757/75128831-f9283600-5700-11ea-8f6b-50b0abb669fd.png" width="100" title="青铜安全培训"/>|<img src="https://user-images.githubusercontent.com/7945757/77252487-0ba97700-6c8f-11ea-9a0c-377aae60e49e.png" width="100" title="视穹云机械"/>|
|在武院|三股绳Lite|学而思优选课|食享会|青铜安全医生|青铜安全培训|视穹云机械|

其他平台小程序：

|<img src="https://user-images.githubusercontent.com/6292668/75112173-2bdc1b00-567c-11ea-8c20-aee5472cd4eb.png" width="120" title="滴滴出行(支付宝)"/>|<img src="https://user-images.githubusercontent.com/6810697/75212688-a31bc700-57c2-11ea-9d75-57430cb32c8f.png" width="120" title="小桔充电(支付宝)"/>|<img src="https://user-images.githubusercontent.com/916567/75526665-27817a80-5a4d-11ea-9fec-05005f4ad99c.png" width="120" title="唯品会QQ"/>|<img src="https://user-images.githubusercontent.com/22525904/75538291-539ffa00-5a53-11ea-961d-23e7d849e5a1.png" width="120" title="口袋证件照"/>|<img src="https://user-images.githubusercontent.com/916567/75525961-cad19000-5a4b-11ea-90b2-9f284ce9e680.png" width="120" title="唯品会字节"/>|
|:---:|:---:|:---:|:---:|:---:|
|滴滴出行(支付宝)|小桔充电(支付宝)|唯品会(QQ)|口袋证件照(百度)|唯品会(百度)|

[更多案例](https://github.com/didi/mpx/issues/385)，若你也在使用Mpx框架开发小程序，并想分享给大家，请填在此issue中。

## 交流

提供 微信群 / QQ群 两种交流方式

#### 添加MPX入群客服等待受邀入群

<img alt="Mpx-wx客服" src="https://dpubstatic.udache.com/static/dpubimg/3c2048fd-350d-406f-8a84-a3a7b8b9dcf3.jpg" width="300">

#### 扫码进入QQ群

<img alt="Mpx-QQ群" src="https://dpubstatic.udache.com/static/dpubimg/ArcgC_eEr/temp_qrcode_share_374632411.png" width="300">

图片因github网络问题导致不可见的朋友可以点击该链接：https://s.didi.cn/rod
