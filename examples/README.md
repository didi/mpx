# mpx示例项目

此处提供了一系列mpx示例项目，帮助大家更好地了解学习mpx。

## 目录

1. todoMVC 通过本项目可以了解mpx的基本特性和store的使用
2. progressive 渐进接入mpx，适用于已有项目如何接入mpx
3. webview 展示@mpxjs/webview包在跨平台场景里H5中的使用
4. useuilib 在mpx中使用第三方组件库的示例
5. 未完待续，欢迎有问题的同学在issue中提出想了解的方面，合适我们将提供对应的demo

## 使用方式

> 此处为通用模式，部分项目有特殊的用法则会在项目里的readme中指明

- clone或下载本项目
- 进入对应的demo文件夹执行 `npm i` 安装依赖
- npm run build执行构建
- 使用小程序开发者工具打开项目目录

## 注意事项

支付宝小程序需要在支付宝开发者工具里打开右上角头像旁边的"详情"，勾选启用Component2编译。

执行npm script时不要加sudo，可能导致生成的文件属于root用户，部分平台的开发者工具可能打不开root用户的文件。
