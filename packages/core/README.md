[Mpx](https://mpxjs.cn), 一款具有优秀开发体验和深度性能优化的增强型跨端小程序框架。
欢迎访问[https://mpxjs.cn](https://mpxjs.cn)，跟随我们提供的文档指南使用Mpx进行跨端小程序开发。

Mpx具有以下功能特性：
* [数据响应](https://www.mpxjs.cn/guide/basic/reactive.html) (赋值响应 / [watch](https://www.mpxjs.cn/api/global-api.html#watch) / computed)
* [组合式 API](https://mpxjs.cn/guide/composition-api/composition-api.html)
* 增强模板语法 ([动态组件](https://www.mpxjs.cn/guide/basic/component.html#%E5%8A%A8%E6%80%81%E7%BB%84%E4%BB%B6) / [样式绑定 / 类名绑定 ](https://www.mpxjs.cn/guide/basic/class-style-binding.html#%E7%B1%BB%E5%90%8D%E7%BB%91%E5%AE%9A) / [内联事件函数](https://www.mpxjs.cn/guide/basic/event.html) / [双向绑定](https://www.mpxjs.cn/guide/basic/two-way-binding.html) / [refs](https://www.mpxjs.cn/guide/basic/refs.html))
* 极致性能 ([运行时性能优化](https://www.mpxjs.cn/guide/understand/runtime.html) / [包体积优化](https://www.mpxjs.cn/guide/understand/compile.html#%E5%88%86%E5%8C%85%E5%A4%84%E7%90%86) / 框架运行时体积14KB)
* [高效强大的编译构建](https://www.mpxjs.cn/guide/understand/compile.html#%E5%88%86%E5%8C%85%E5%A4%84%E7%90%86) (基于webpack5 / 支持持久化缓存 / 兼容webpack生态 / 兼容原生小程序 / 完善支持npm场景下的分包输出 / 高效调试)
* [单文件组件开发](https://www.mpxjs.cn/guide/basic/single-file.html)
* [渐进接入 / 原生组件支持](https://www.mpxjs.cn/guide/advance/progressive.html)
* [状态管理](https://www.mpxjs.cn/guide/advance/store.html) (Vuex规范 / 支持多实例Store)
* 跨团队开发 ([packages](https://www.mpxjs.cn/guide/advance/subpackage.html))
* 逻辑复用 ([mixins](https://www.mpxjs.cn/guide/advance/mixin.html))
* [周边能力](https://www.mpxjs.cn/guide/extend/) (fetch / api增强 / mock / webview-bridge)
* 脚手架支持
* 多平台增强 (支持在微信、支付宝、百度、qq、头条小程序平台中进行增强开发)
* [跨平台编译](https://www.mpxjs.cn/guide/advance/platform.html) (一套代码跨端输出到微信、支付宝、百度、字节、QQ、京东、快应用(web) 和 [web平台](https://www.mpxjs.cn/guide/advance/platform.html#%E8%B7%A8%E5%B9%B3%E5%8F%B0%E8%BE%93%E5%87%BAweb) 中运行)
* [TypeScript支持](https://www.mpxjs.cn/guide/tool/ts.html) (基于ThisType实现了完善的类型推导)
* [I18n国际化](https://www.mpxjs.cn/guide/tool/i18n.html)
* [单元测试](https://www.mpxjs.cn/guide/tool/unit-test.html)
* [E2E测试](https://www.mpxjs.cn/guide/tool/e2e-test.html)
* [原子类](https://mpxjs.cn/guide/advance/utility-first-css.html)
* [SSR](https://mpxjs.cn/guide/advance/ssr.html)
* [组件维度运行时渲染方案](https://github.com/didi/mpx/pull/919) (即将到来)
## @mpxjs/core

Mpx 小程序框架运行时核心库。

## 快速开始

```bash
# 安装mpx脚手架工具
npm i -g @mpxjs/cli

# 初始化项目
mpx create mpx-project

# 进入项目目录
cd mpx-project

# 安装依赖
npm i

# development
npm run serve

# production
npm run build
```

使用小程序开发者工具打开项目文件夹下dist中对应平台的文件夹即可预览效果。
