[![mpx-logo](https://dpubstatic.udache.com/static/dpubimg/41413d7a-8249-46e6-bf68-709dc511fce2.png)](https://mpxjs.cn)

[Mpx](https://mpxjs.cn), 一款具有优秀开发体验和深度性能优化的增强型跨端小程序框架。

![test-status](https://github.com/didi/mpx/workflows/test/badge.svg)
![docs-status](https://github.com/didi/mpx/workflows/docs/badge.svg)

## 官网及文档

欢迎访问[https://mpxjs.cn](https://mpxjs.cn)，跟随我们提供的文档指南使用Mpx进行跨端小程序开发。

## 近期更新
基于 Mpx 的移动端基础组件库 [mpx-cube-ui](https://www.mpxjs.cn/mpx-cube-ui/guide/intro.html) 已经开源，更多详情查看[这里](https://mpxjs.cn/articles/mpx-cube-ui.html)。

Mpx 2.9 版本正式发布，支持原子类、SSR和构建产物体积优化，更多详情查看[这里](https://mpxjs.cn/articles/2.9-release.html)，迁移指南查看[这里](https://mpxjs.cn/guide/migrate/2.9.html)，相关指南及 API 参考文档已更新。

## 简介

Mpx是一款致力于提升小程序开发体验和用户体验的增强型小程序跨端框架，通过Mpx，我们能够以类Vue的开发体验高效优雅地构筑出高性能跨端小程序应用，在所有开放的小程序平台及web平台中运行。

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
* 运行时渲染方案
* 跨端输出RN（即将到来）

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

## 使用示例

```html
<template>
  <!--动态样式-->
  <view class="container" wx:style="{{dynamicStyle}}">
    <!--数据绑定-->
    <view class="title">{{title}}</view>
    <!--计算属性数据绑定-->
    <view class="title">{{reversedTitle}}</view>
    <view class="list">
      <!--循环渲染，动态类名，事件处理内联传参-->
      <view wx:for="{{list}}" wx:key="id" class="list-item" wx:class="{{ {active:item.active} }}"
            bindtap="handleTap(index)">
        <view>{{item.content}}</view>
        <!--循环内部双向数据绑定-->
        <input type="text" wx:model="{{list[index].content}}"/>
      </view>
    </view>
    <!--自定义组件获取实例，双向绑定，自定义双向绑定属性及事件-->
    <custom-input wx:ref="ci" wx:model="{{customInfo}}" wx:model-prop="info" wx:model-event="change"/>
    <!--动态组件，is传入组件名字符串，可使用的组件需要在json中注册，全局注册也生效-->
    <component is="{{current}}"></component>
    <!--显示/隐藏dom-->
    <view class="bottom" wx:show="{{showBottom}}">
      <!--模板条件编译，__mpx_mode__为框架注入的环境变量，条件判断为false的模板不会生成到dist-->
      <view wx:if="{{__mpx_mode__ === 'wx'}}">wx env</view>
      <view wx:if="{{__mpx_mode__ === 'ali'}}">ali env</view>
    </view>
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      // 动态样式和类名也可以使用computed返回
      dynamicStyle: {
        fontSize: '16px',
        color: 'red'
      },
      title: 'hello world',
      list: [
        {
          content: '全军出击',
          id: 0,
          active: false
        },
        {
          content: '猥琐发育，别浪',
          id: 1,
          active: false
        }
      ],
      customInfo: {
        title: 'test',
        content: 'test content'
      },
      current: 'com-a',
      showBottom: false
    },
    computed: {
      reversedTitle () {
        return this.title.split('').reverse().join('')
      }
    },
    watch: {
      title: {
        handler (val, oldVal) {
          console.log(val, oldVal)
        },
        immediate: true
      }
    },
    handleTap (index) {
      // 处理函数直接通过参数获取当前点击的index，清晰简洁.
      this.list[index].active = !this.list[index].active
    },
    onReady () {
      setTimeout(() => {
        // 更新数据，同时关联的计算属性reversedTitle也会更新
        this.title = '你好，世界'
        // 此时动态组件会从com-a切换为com-b
        this.current = 'com-b'
      }, 1000)
    }
  })
</script>

<script type="application/json">
  {
    "usingComponents": {
      "custom-input": "../components/custom-input",
      "com-a": "../components/com-a",
      "com-b": "../components/com-b"
    }
  }
</script>

<style lang="stylus">
  .container
    position absolute
    width 100%
</style>
```

更多示例请查看[官方示例项目](https://github.com/didi/mpx/tree/master/examples)

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
|@mpxjs/api-proxy|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fapi-proxy.svg)](https://badge.fury.io/js/%40mpxjs%2Fapi-proxy)|将各个平台的 api 进行转换，也可以将 api 转为 promise 格式|
|@mpxjs/store|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fstore.svg)](https://badge.fury.io/js/%40mpxjs%2Fstore)|类vuex store|
|@mpxjs/pinia|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fpinia.svg)](https://badge.fury.io/js/%40mpxjs%2Fpinia)|mpx pinia store|
|@mpxjs/fetch|[![npm version](https://badge.fury.io/js/%40mpxjs%2Ffetch.svg)](https://badge.fury.io/js/%40mpxjs%2Ffetch)|mpx网络请求库，处理wx并发请求限制|
|@mpxjs/unocss-plugin|[![npm version](https://badge.fury.io/js/@mpxjs%2Funocss-plugin.svg)](https://badge.fury.io/js/@mpxjs%2Funocss-plugin)|mpx unocss插件，支持使用unocss原子类|
|@mpxjs/unocss-base|[![npm version](https://badge.fury.io/js/@mpxjs%2Funocss-base.svg)](https://badge.fury.io/js/@mpxjs%2Funocss-base)|mpx unocss预设|
|@mpxjs/cli|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fcli.svg)](https://badge.fury.io/js/%40mpxjs%2Fcli)|mpx脚手架命令行工具|
|@mpxjs/webview-bridge|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fwebview-bridge.svg)](https://badge.fury.io/js/%40mpxjs%2Fwebview-bridge)|为跨小程序平台的H5项目提供通用的webview-bridge|
|@mpxjs/utils|[![npm version](https://badge.fury.io/js/%40mpxjs%2Futils.svg)](https://badge.fury.io/js/%40mpxjs%2Futils)|mpx运行时工具库|
|@mpxjs/babel-plugin-inject-page-events|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fbabel-plugin-inject-page-events.svg)](https://badge.fury.io/js/%40mpxjs%2Fbabel-plugin-inject-page-events)|组合式API页面事件处理插件|
|@mpxjs/mpx-cube-ui|[![npm version](https://badge.fury.io/js/%40mpxjs%2Fmpx-cube-ui.svg)](https://badge.fury.io/js/%40mpxjs%2Fmpx-cube-ui)|基于 Mpx 的移动端基础组件库|

## 开发团队

核心团队: [hiyuki](https://github.com/hiyuki), [Blackgan3](https://github.com/Blackgan3), [anotherso1a](https://github.com/anotherso1a), [CommanderXL](https://github.com/CommanderXL), [yandadaFreedom](https://github.com/yandadaFreedom), [wangxiaokou](https://github.com/wangxiaokou), [OnlyProbie](https://github.com/OnlyProbie), [pagnkelly](https://github.com/pagnkelly), [thuman](https://github.com/thuman), [theniceangel](https://github.com/theniceangel), [dolymood](https://github.com/dolymood)

外部贡献者：[sky-admin](https://github.com/sky-admin), [pkingwa](https://github.com/pkingwa), [httpsxiao](https://github.com/httpsxiao), [lsycxyj](https://github.com/lsycxyj), [okxiaoliang4](https://github.com/okxiaoliang4), [tangminFE](https://github.com/tangminFE), [codepan](https://github.com/codepan), [zqjimlove](https://github.com/zqjimlove), [xuehebinglan](https://github.com/xuehebinglan), [zhaoyiming0803](https://github.com/zhaoyiming0803), [ctxrr](https://github.com/ctxrr), [JanssenZhang](https://github.com/JanssenZhang), [heiye9](https://github.com/heiye9), [lj0812](https://github.com/lj0812), [SuperHuangXu](https://github.com/SuperHuangXu), [twtylkmrh](https://github.com/twtylkmrh), [NineSwordsMonster](https://github.com/NineSwordsMonster)

## 成功案例

微信小程序

![滴滴出行](https://dpubstatic.udache.com/static/dpubimg/bcca3d10-01b7-4c08-951a-22418b2443d6.jpg)|  ![出行广场](https://dpubstatic.udache.com/static/dpubimg/708d5579-81f0-480e-96b3-5f49e8022273.jpg)   |  ![滴滴公交](https://dpubstatic.udache.com/static/dpubimg/69a08787-d3a1-4c51-b182-0fcb96960b56.jpg)   |                                     ![滴滴金融](https://dpubstatic.udache.com/static/dpubimg/8c25bec8-938e-452d-96f9-5e524092a8ee.png)                                     |  ![滴滴外卖](https://dpubstatic.udache.com/static/dpubimg/8fdd04ed-a74b-4b87-be6e-652550fb843f.png)   |![司机招募](https://dpubstatic.udache.com/static/dpubimg/d3b62a33-7dbd-45ea-a4aa-f30ad61965f2.jpg)|![小桔加油](https://dpubstatic.udache.com/static/dpubimg/988099b3-9930-4c54-abd7-75e70134d649.png)|
|:---:|:-------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------:|:---:|:---:|
|滴滴出行|出行广场|滴滴公交|滴滴金融|滴滴外卖|司机招募|小桔加油|
|![彗星英语](https://dpubstatic.udache.com/static/dpubimg/d8ff5697-17f2-4177-9d8b-269e1af6c04a.jpg)|  ![番薯借阅](https://dpubstatic.udache.com/static/dpubimg/79573ef6-2a66-462e-8cc7-63eb983168f8.jpg)   |  ![疫查查应用](https://dpubstatic.udache.com/static/dpubimg/8932c3c2-b6da-4da2-8661-5554fe2bd4a3.jpg)  |                                     ![小桔养车](https://dpubstatic.udache.com/static/dpubimg/b6507fca-1e1f-4922-9240-d0f172bea6de.jpg)                                     | ![学而思直播课](https://dpubstatic.udache.com/static/dpubimg/40fd646b-10d0-4383-a576-e1d425a8c05d.jpeg) |![小猴启蒙课](https://dpubstatic.udache.com/static/dpubimg/6833dbdb-1dc8-4929-bd41-6d71069b0714.jpeg)|![科创书店](https://dpubstatic.udache.com/static/dpubimg/8627f48d-cf64-4511-8b2f-ede8e54186a7.png)|
|彗星英语|番薯借阅|疫查查应用|                                                                                  小桔养车                                                                                  |                                              学而思直播课                                               |小猴启蒙课|科创书店|
|![在武院](https://dpubstatic.udache.com/static/dpubimg/421bf49b-a9cb-4d54-90d7-e21b80ab21b3.jpg)| ![三股绳Lite](https://dpubstatic.udache.com/static/dpubimg/46ee136b-0791-4069-98b0-35566d5ef394.jpg) | ![学而思优选课](https://dpubstatic.udache.com/static/dpubimg/eab48487-5ca2-4368-9080-a6b843097e67.jpeg) | ![食享会](https://dpubstatic.udache.com/static/dpubimg/lY7eYSppkW/68747470733a2f2f73686978682e636f6d2f73686571752f696d672f7172636f64655f322e37343664373562342e706e67.png) | ![青铜安全医生](https://dpubstatic.udache.com/static/dpubimg/58cdbcc5-1f00-4da9-89c6-e638b2f77b19.png)  |![青铜安全培训](https://dpubstatic.udache.com/static/dpubimg/a9d60600-40c0-4b66-934e-3bb176d3f07a.png)|![视穹云机械](https://dpubstatic.udache.com/static/dpubimg/0a816842-dda4-4e30-8c14-e951fb1a8131.jpeg)|
|在武院|三股绳Lite|学而思优选课|                                                                                  食享会                                                                                   |                                              青铜安全医生                                               |青铜安全培训|视穹云机械|
|![店有生意通](https://dpubstatic.udache.com/static/dpubimg/7f1b5f22-d765-4142-862a-999c1ed9d10f.png)|            ![花小猪打车](https://dpubstatic.udache.com/static/dpubimg/JzHnEyu8VT/aaa.jpeg)             |  ![橙心优选](https://dpubstatic.udache.com/static/dpubimg/37222642-c508-4a67-8cbc-036a66985bfc.jpeg)  |                                           ![小二押镖](https://dpubstatic.udache.com/static/dpubimg/nB6-p3WzIQ/xiaoeryabiao.png)                                            |          ![顺鑫官方微商城](https://dpubstatic.udache.com/static/dpubimg/nY2bg3A1L_/shunxin.jpg)          |![嘀嗒出行](https://dpubstatic.udache.com/static/dpubimg/DO3m0Iflq1/didachuxing.jpeg)|![汉行通Pro](https://dpubstatic.udache.com/static/dpubimg/86cd89be-de29-48ad-8cb0-72c432446e7b.jpg)|
|店有生意通|花小猪打车|橙心优选|                                                                                  小二押镖                                                                                  |                                              顺鑫官方微商城                                              |嘀嗒出行|汉行通Pro|
|![交圈](https://dpubstatic.udache.com/static/dpubimg/eaf24702-6d49-4853-9cab-cce7240dda85.png)|  ![青桔单车](https://dpubstatic.udache.com/static/dpubimg/pIM3h2vyj2/qingju.jpg)   |  ![滴滴顺风车](https://dpubstatic.udache.com/static/dpubimg/neOI_G6deQ/shunfengche.png)  |![滴滴代驾](https://dpubstatic.udache.com/static/dpubimg/cn2A4-zw30i8YB8lb75X5.jpg)|          ![新桔代驾](https://dpubstatic.udache.com/static/dpubimg/vVBnrKlgI4OGe3bdpTbbD.jpg)|![标贝知音](https://dpubstatic.udache.com/static/dpubimg/k2rTzT4frRgsHghUNgdtq_136727190-f481d792-fb9d-4198-b95d-a4e151c65dde.jpg)||
|交圈|青桔单车|滴滴顺风车|滴滴代驾|新桔代驾|标贝知音||

其他平台小程序：

|![滴滴出行(支付宝)](https://dpubstatic.udache.com/static/dpubimg/47fe83e5-c41a-4245-b910-60ed6493d87e.png)|![小桔充电(支付宝)](https://dpubstatic.udache.com/static/dpubimg/fa1a524b-da97-4df3-9412-8c988f50b6ae.png)|![唯品会QQ](https://dpubstatic.udache.com/static/dpubimg/2a150b0a-e23d-4e91-98fe-e862410be911.jpeg)|![口袋证件照(百度)](https://dpubstatic.udache.com/static/dpubimg/a71aa963-0245-41a1-a008-f684e0bf24dc.png)|![唯品会(百度)](https://dpubstatic.udache.com/static/dpubimg/56273723-ba98-4ceb-9672-075a5ab9f2da.png)|![唯品会(字节)](https://dpubstatic.udache.com/static/dpubimg/88f898a0-2f3b-44c5-b7ce-c1a8aec25299.jpeg)|
|:---:|:---:|:---:|:---:|:---:|:---:|
|滴滴出行(支付宝)|小桔充电(支付宝)|唯品会(QQ)|口袋证件照(百度)|唯品会(百度)|唯品会(字节)|

[更多案例](https://github.com/didi/mpx/issues/385)，若你也在使用Mpx框架开发小程序，并想分享给大家，请填在此issue中。

## 交流

提供 微信群 / QQ群 两种交流方式.

#### 添加MPX入群小助手等待受邀入群

![微信](https://dpubstatic.udache.com/static/dpubimg/6DN0ebkbjgI2P9QjJr8jr_WechatIMG3.jpeg)


#### 扫码进入QQ群

![QQ](https://dpubstatic.udache.com/static/dpubimg/etX-gKWeUb/temp_qrcode_share_374632411.png)

图片因github网络问题导致不可见的朋友可以点击该链接：https://s.didi.cn/rod
