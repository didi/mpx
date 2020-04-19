# 快速开始

## 全局安装脚手架工具
```shell
npm i -g @mpxjs/cli
```

## 创建项目并安装依赖

在当前目录下创建mpx项目。

```shell
mpx init mpx-project
```

也可以使用npx在不全局安装脚手架情况下创建项目。

```shell
npx @mpxjs/cli init mpx-project
```

执行命令后会弹出一系列问题进行项目初始配置，根据自身需求进行选择，完成后进入项目目录进行依赖安装。

```shell
npm install
```

> 创建`插件项目`由于微信限制必须填写插件的`AppID`，创建`普通项目`无强制要求。

## 编译构建

使用npm script执行mpx的编译构建，在开发模式下我们执行dev命令，将项目源码构建输出到`dist/${平台目录}`下，并且监听源码的改动进行重新编译。

```shell
npm run dev
```

## 在小程序开发者工具中预览调试
使用小程序开发者工具打开dist下对应平台的目录，参考小程序官方的[开发指南](https://developers.weixin.qq.com/miniprogram/dev/)进行预览、调试。

> 开启小程序开发者工具的watch选项，配合mpx本身的watch，能够得到很好的开发调试体验。

## 开始code

在Mpx中，我们使用`@mpxjs/core`提供的createApp、createPage和createComponent函数（分别对应原生小程序中的App、Page和Component）来创建App、页面和组件。

下面看一个例子：

## 例子

开始一个demo项目的流程。

初始化项目：
![安装项目](../assets/images/start-install.png)

接下来：
```bash
# 进入project
cd mpx-demo

# 安装依赖
npm i

# 进行开发
npm run watch
```

![开启服务](../assets/images/start-start.png)

用微信开发者工具打开目录 `~/testproject/mpx-test/dist`

在src/app.mpx创建一个App

```html
<script>
  import { createApp } from '@mpxjs/core'
  createApp({
    onShow(options) {
      console.log(options)
    }
  })
</script>

<style lang="stylus">
  page
    font-family: PingFangSC-Regular, PingFang SC, STHeitiSC-Light, Helvetica-Light, arial, sans-serif
</style>

<script type="application/json">
  {
    "pages": [
      "./pages/index/index"
    ],
    "window": {
      "backgroundTextStyle": "light",
      "navigationBarBackgroundColor": "#fff",
      "navigationBarTitleText": "WeChat",
      "navigationBarTextStyle": "black"
    }
  }
</script>

```

在src/pages创建Page

```html
<template>
  <view class="page-container">
    <list></list>
  </view>
</template>

<script>
  import {createPage} from '@mpxjs/core'

  createPage({
    onLoad () {
    }
  })
</script>

<style lang="stylus">
  .page-container
    font: 14px 'Helvetica Neue', Helvetica, Arial, sans-serif
</style>


<script type="application/json">
  {
    "usingComponents": {
      "list": "../../components/list/list"
    }
  }
</script>

```

修改src/component/list/list.mpx的代码：

```html
<template xmlns="">
  <view class="list">
    <!--增强指令 wx:style-->
    <view wx:style="{{listStyle}}" wx:for="{{listData}}">{{item}}</view>
    <!--增强指令 wx:class-->
    <view wx:class="{{isViewClass ? viewClass : ''}}">{{testData}}</view>
    <!--watch question改变answer-->
    <view>{{question}}</view>
    <view>{{answer}}</view>
    <!--增强指令 wx:model，用于双向绑定-->
    <input wx:model="{{model}}"/>
    <input wx:model="{{testModel.model}}"/>
    <input wx:model="{{testModel['model']}}"/>
    <!--动态组件，此处的componentName为json中注册的usingComponents的key值-->
    <component is="{{componentName}}"></component>
  </view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  import mixin from './mixin'
  createComponent({
    mixins: [mixin],
    data: {
      model: '我是测试model双向绑定',
      testModel: {
        model: '我是测试model双向绑定'
      },
      listData: {
        'phone': '手机',
        'tv': '电视',
        'computer': '电脑'
      },
      isViewClass: true,
      viewClass: 'white-color',
      listStyle: {
        color: '#fff'
      },
      question: '我是测试watch用的',
      answer: '我也是测试watch用的!',
      componentName: 'testA'
    },
    ready () {
      // mixinTestData来自mixin
      console.log('component ready:', this.mixinTestData.tv)
      setTimeout(() => {
        this.changeData()
        // 可以看到data可直接修改，实现了computed功能。
        this.listData.phone = '110'
        this.componentName = 'testB'
      }, 2000)
    },
    computed: {
      testData () {
        return JSON.stringify(this.listData)
      }
    },
    pageShow () {
      // 所在页面显示之后就会执行一次
      console.log('page show')
    },
    pageHide () {
      // 页面切入后台执行
      console.log('page hide')
    },
    watch: {
      question(newval, oldval) {
        this.answer = '我是测试观察属性watch'
      }
    },
    methods: {
      changeData() {
        this.question = '我是测试观察属性watch'
      }
    }
  })
</script>

<style lang="stylus">
  .list
    background-color red
  .white-color
    color #fff
</style>

<script type="application/json">
  {
    "component": true,
    "usingComponents": {
      "testA": "./testA",
      "testB": "./testB"
    }
  }
</script>

```

更多用法可以看这个todoMVC示例：https://github.com/didi/mpx/tree/master/examples/mpx-todoMVC

