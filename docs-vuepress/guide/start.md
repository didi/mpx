# 开始

使用脚手架`mpx-cli`，快速开始开发mpx小程序
## 安装mpx-cli
```shell
npm i -g @mpxjs/cli
```

## 创建工程

* 在已有文件夹内创建mpx工程：

```shell
# 当前文件夹名就是你的项目名
mpx init .
```

* 在当前目录中创建工程目录

```shell
mpx init <project-name>
```

`插件项目`由于微信限制必须填写插件的`AppID`，`普通项目`无强制要求。

## mpx编译

启动服务，mpx会将源码编译成小程序识别的代码，并监听文件变化进行重编译

```shell
npm install
npm run watch
```

## 预览调试小程序
mpx编译完成后，会将小程序代码放置在dist目录

打开小程序开发者工具，打开生成的dist目录，进行小程序的预览和调试

## 创建App/Page/Component

我们通过createApp、createPage、createComponent（分别对应小程序原生的App、Page、Component方法）来创建小程序、页面、组件。

我们按照上面的步骤创建项目后，进入src/app.mpx，我们可以看到里面的结构和vue文件非常类似，三个区块分别对应了小程序中的js/wxss/json文件。

其中js中createApp用于注册小程序，传入配置可以参考小程序开发文档，一般还在这里进行mpx插件的安装。


```html
<script>
  import mpx, { createApp } from '@mpxjs/core'
  import apiProxy from '@mpxjs/api-proxy'

  mpx.use(apiProxy, {
    usePromise: true
  })
  
  createApp({
    onLaunch () {

    }
  })
</script>

<style lang="stylus">
  .red
    color red
</style>

<script type="application/json">
  {
    "pages": [
      "./pages/index"
    ]
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
