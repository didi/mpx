# 介绍

## Mpx是什么？

Mpx是一款致力于提高小程序开发体验和开发效率的增强型小程序框架，通过Mpx，我们能够高效优雅地开发出具有极致性能的优质小程序应用，并将其输出到各大小程序平台和web平台中运行。

Mpx的核心设计理念在于增强，这意味着Mpx是对小程序原生开发标准的补强和扩充，同时也兼容了原生开发标准。Mpx的一个设计理念在于尽可能地依赖小程序原生的自有能力，如路由系统，自定义组件，事件系统和slot等能力，因此用户在使用Mpx开发小程序时，需要对原生小程序开发有一定程度的掌握。所幸小程序开发本身并不困难，我们也会在本文档中对必要的原生小程序开发知识进行一定程度地说明。

微信小程序作为小程序的开山鼻祖，具有最完善的生态和最全面的特性支持，后来的所有小程序平台在技术方案和代码语法上都与微信小程序高度相似，Mpx目前完善支持了以微信小程序增强语法为base的跨平台输出能力，本文档在介绍原生小程序开发相关的部分时也会以微信小程序为例。

最后，Mpx是一个开发框架，不是组件库，这一点经常会有开发者搞混。Mpx兼容业内已有的小程序组件库，如vant/iview等，我们之后也会开源内部基于Mpx开发的跨端组件库。


## Mpx提供了哪些能力？

### 单文件开发(SFC)

Mpx使用类似Vue的单文件开发模式，小程序原本的template/js/style/json都可以写在单个的.mpx文件中，清晰便捷。

### 数据响应

数据响应是Mpx提供的核心增强能力，该能力主要受Vue的启发，主要包含数据赋值响应，watch api和computed计算属性等能力，关于该能力更详细的介绍可以查看[这里](./reactive.md)

### 增强的模板语法

同样受到Vue的启发，Mpx提供了很多增强模板语法便于开发者方便快捷地进行视图开发，主要包含以下：

* [wx:style动态样式](./class-style-binding.md#样式绑定)
* [wx:class动态类名](./class-style-binding.md#类名绑定)
* [wx:model双向绑定](./two-way-binding.md)
* [wx:model-prop双向绑定属性](./two-way-binding.md#更改双向绑定的监听事件及数据属性)
* [wx:model-event双向绑定事件](./two-way-binding.md#更改双向绑定的监听事件及数据属性)
* [wx:model-value-path双向绑定数据路径](./two-way-binding.md#更改双向绑定事件数据路径)
* [wx:model-filter双向绑定过滤器](./two-way-binding.md#双向绑定过滤器)
* [wx:ref获取实例](./refs.md)
* [wx:show隐藏显示](./conditional-render.md)
* [component动态组件](./component.md#动态组件)
* [事件处理内联传参](./event.md)
* [模板条件编译](./template.md)

### 极致性能

Mpx在性能上做到了极致，我们在框架中通过模板数据依赖收集进行了深度的setData优化，做到了程序上的最优，让用户能够专注于业务开发；

其次，Mpx的编译构建完全基于依赖收集，支持按需进行的npm构建，能够自动根据用户的分包配置抽离共用模块，确保用户最终产出项目的包体积最优；

最后，Mpx的运行时框架部分仅占用51KB；

Mpx和业内其他框架的运行时性能对比可以参考[这篇文章](https://github.com/hiyuki/mp-framework-benchmark/blob/master/README.md)

### 状态管理

Mpx借鉴Vuex的设计实现一套与框架搭配使用的状态管理(store)工具，除了支持Vuex中已有的特性外，我们还创新地提出了一种多实例store的跨团队状态管理模式，我们在业务中实际使用后普遍认为该设计比原有的modules更加灵活方便，更多详情可以[查看这里](../advance/store.md)

### 编译构建

Mpx的编译构建以webpack为基础，针对小程序项目结构深度定制开发了一个webpack插件和一系列loaders，整个构建过程完全基于依赖收集按需打包，兼容大部分webpack自身能力及生态，此外Mpx的编译构建还支持以下能力：

* [npm构建](../advance/npm.md)
* [分包构建](../advance/subpackage.md#分包)
* [包体积优化](../advance/subpackage.md)
* [原生组件支持](../advance/progressive.md#原生接入)
* [原生能力兼容(custom-tab-bar/workers/云开发等)](../advance/ability-compatible.md)
* [小程序插件](../advance/plugin.md)
* [模板预编译](./template.md#模板预编译)
* [css预编译](./css.md)
* [静态资源处理](../advance/image-process.md)


### 跨平台能力

Mpx支持全部小程序平台(微信，支付宝，百度，头条，qq)的增强开发，同时支持将一份基于微信增强的业务源码输出到全部的小程序平台和web平台中运行，也即将支持输出快应用的能力，更多详情请[查看这里](../advance/platform.md)

### 完善的周边能力

除了上述的核心能力外，Mpx还提供了丰富的周边能力支持，主要包括以下能力：

* [网络请求](../extend/fetch.md)
* [数据mock](../extend/mock.md)
* [api增强抹平](../extend/api-proxy.md)
* [webview抹平](../../api/extend.md#webview-bridge)
* [Typescript支持](../tool/ts.md)
* [I18n国际化](../advance/i18n.md)
* [单元测试](../tool/unit-test.md)
* [E2E测试](../tool/e2e-test.md)


Mpx具有以下功能特性：
* 数据响应 (赋值响应 / [watch](./reactive.md) / [computed](./reactive.md))
* 增强模板语法 ([动态组件](./component.md#动态组件) / [样式绑定 / 类名绑定 ](./class-style-binding.md) / [内联事件函数](./event.md) / [双向绑定](./two-way-binding.md) / [refs](./refs.md))
* 极致性能 ([运行时性能优化](../understand/runtime.md) / [包体积优化](../advance/subpackage.md#分包) / 框架运行时体积14KB)
* [高效强大的编译构建](../understand/compile.md) (基于webpack / 兼容webpack生态 / 兼容原生小程序 / 完善支持npm场景下的分包输出 / 高效调试)
* [单文件组件开发](./single-file.md)
* [渐进接入 / 原生组件支持](../advance/progressive.md)
* [状态管理](../advance/store.md) (Vuex规范 / 支持多实例Store)
* 跨团队开发 ([packages](../advance/subpackage.md#packages))
* 逻辑复用 ([mixins](../advance/mixin.md))
* [周边能力支持](../extend/) (fetch / api增强 / mock / webview-bridge)
* 脚手架支持
* [多平台增强](../advance/platform.md#多平台支持) (支持在微信、支付宝、百度、qq、头条小程序平台中进行增强开发)
* [跨平台编译](../advance/platform.md#跨平台编译) (支持以微信为base，将一套代码转换输出到支付宝、百度、qq、头条小程序平台和[web平台](../advance/platform.md#跨平台输出web)中运行)
* [TypeScript支持](../tool/ts.md) (基于ThisType实现了完善的类型推导)
* [I18n国际化](../tool/i18n.md)
* 单元测试支持 (即将到来)
* 快应用输出 (即将到来)

## 对比其他小程序框架

目前业内的小程序框架主要分为两类，一类是以uniapp，taro2为代表的静态编译型框架，这类框架以静态编译为主要手段，将React和Vue开发的业务源码转换到小程序环境中进行适配运行。这类框架的主要优点在于web项目迁移方便，跨端能力较强。但是由于React/Vue等web框架的DSL与小程序本身存在较大差距，无法完善支持原web框架的全部能力，开发的时候容易踩坑。

另一类是以kbone，taro3为代表的运行时框架，这类框架利用小程序本身提供的动态渲染能力，在小程序中模拟出web的运行时环境，让React/Vue等框架直接在上层运行。这类框架的优点在于web项目迁移方便，且在web框架语法能力的支持上比静态编译型的框架要强很多，开发时遇到的坑也会少很多。但是由于模拟的web运行时环境带来了巨大的性能开销，这类框架并不适合用于大型复杂的小程序开发。

不同于上面两类框架，Mpx以小程序本身的DSL为基础，通过编译和运行时手段结合对其进行了一系列拓展增强，没有复杂庞大的转译和环境抹平，在提升用户开发体验和效率的同时，既能保障开发的稳定和可预期性，又能保障接近原生的良好性能，非常适合开发大型复杂的小程序应用。

在跨端方面，Mpx重点保障跨小程序平台的跨端能力，由于各家小程序标准具有很强的相似性，Mpx在进行跨端输出时，以静态编译为主要手段，辅以灵活便捷的条件编译，保障了跨端输出的性能和可用性。




