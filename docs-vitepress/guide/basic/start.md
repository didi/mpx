# 快速开始

## 安装脚手架

::: code-group

```sh [npm]
npm i -g @mpxjs/cli
```

```sh [pnpm]
pnpm add -g @mpxjs/cli
```

```sh [yarn]
yarn global add @mpxjs/cli
```

:::

> @mpxjs/cli 文档 https://github.com/mpx-ecology/mpx-cli

## 创建项目安装依赖

在当前目录下创建 mpx 项目。

```shell
mpx create mpx-project
```

也可以使用 npx 在不全局安装脚手架情况下创建项目。

```shell
npx @mpxjs/cli create mpx-project
```

执行命令后会弹出一系列问题进行项目初始配置，根据自身需求进行选择，完成后进入项目目录进行依赖安装。

```shell
npm install
```

> 创建`插件项目`由于微信限制必须填写插件的`AppID`，创建`普通项目`无强制要求。

补充提示：

- 推荐的 IDE 配置是 [VS Code](https://code.visualstudio.com) + [Mpx (Official)](https://marketplace.visualstudio.com/items?itemName=mpxjs.mpx-official) 扩展。如果使用其他编辑器，参考 [IDE 支持章节](/guide/basic/ide.html)。

## 编译构建

相关命令

```json
{
  "serve": "mpx-cli-service serve", // 开发模式
  "build": "mpx-cli-service build" // 构建模式
}
```

使用 npm script 执行 mpx 的编译构建，在开发模式下我们执行 serve 命令，将项目源码构建输出到`dist/${平台目录}`下，并且监听源码的改动进行重新编译。

```shell
npm run serve
```

### CLI 命令

#### build

```sh
用法：mpx-cli-service build [options]

选项:

  --targets    编译目标(默认值: wx)
  --mode       指定环境模式 development | production (默认值：production)
  --env        自定义 __mpx_env__
  --watch      监听文件变化
  --report     生成包分析报告
```

```sh
# 构建小程序，默认微信
mpx-cli-service build --targets=wx,ali
```

**目前支持的平台**

| 平台   | target  |
| ------ | ------- |
| 微信   | wx      |
| 阿里   | ali     |
| 百度   | swan    |
| QQ     | qq      |
| 头条   | tt      |
| 浏览器 | web     |
| 安卓   | android |
| iOS    | ios     |
| 鸿蒙   | harmony |

#### serve

```sh
用法：mpx-cli-service serve [options]

选项:

  --targets    编译到小程序目标(默认值: wx)
  --mode       指定环境模式 (默认值：production)
  --env        自定义 __mpx_env__
```

## 预览调试

使用小程序开发者工具打开 dist 下对应平台的目录，对你的小程序进行预览、调试，详情可参考[小程序开发指南](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/getstart.html)

> 开启小程序开发者工具的 watch 选项，配合 mpx 本身的 watch，能够得到很好的开发调试体验。

## 开始 code

在 Mpx 中，我们使用`@mpxjs/core`提供的 createApp、createPage 和 createComponent 函数（分别对应原生小程序中的 App、Page 和 Component）来创建 App、页面和组件，我们下面根据脚手架创建出的初始项目目录，进行简单的介绍。

进入 src/app.mpx，我们可以看到里面的结构和.vue 文件非常类似，三个区块分别对应了小程序中的 js/wxss/json 文件。

js 区块中调用 createApp 用于注册小程序，传入的配置可以参考[小程序 App 构造器](https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html)，由于 app.js 是小程序全局最早执行的 js 模块，一般 mpx 插件安装等初始化操作也在这里进行。

style 区块对应 app.wxss 定义了全局样式，可以自由使用 sass/less/stylus 等 css 预编译语言。

json 区块完全支持小程序原生的[app.json 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)，还额外支持了[packages 多人合作](../advance/subpackage.md#packages)等增强特性。

```html
<script>
  import mpx, { createApp } from "@mpxjs/core"
  import apiProxy from "@mpxjs/api-proxy"

  mpx.use(apiProxy, {
    usePromise: true,
  })

  createApp({
    onLaunch() {},
  })
</script>

<style lang="stylus">
  .bold
    font-weight bold
</style>

<script type="application/json">
  {
    "pages": ["./pages/index"]
  }
</script>
```

进入 src/pages/index.mpx，可以看到同样是.vue 风格的单文件结构，比起上面的 app.mpx 多了一个 template 区块，用于定义页面模板，除了支持小程序本身的全部模块语法和指令外，mpx 还参考 vue 提供了大量[模板增强指令](../../api/directives.md)，便于用户更快速高效地进行界面开发。

在 js 中调用 createPage 创建页面时，除了支持原本小程序支持的[Page 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)外，我们还支持以[数据响应](./reactive.md)为核心的一系列增强能力。

在 json 中，我们同样支持原生的[页面 json 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)，此外，我们能够直接在`usingComponents`中填写 npm 地址引用 npm 包中的组件，mpx 组件和原生小程序组件均可引用，无需调用开发者工具 npm 编译，且能够通过依赖收集按需进行打包。

> 为了保障增强能力的完整性，在支持的平台中 Mpx 优先使用 Component 构造器创建页面，支持全部 Component 生命周期；在某些特殊情况下，你可以在[@mpxjs/webpack-plugin](../../api/compile.md#forceusepagector)中传入 forceUsePageCtor:true 配置来禁用掉这个行为。

```html
<template>
  <list></list>
</template>

<script>
  import { createPage } from "@mpxjs/core"

  createPage({
    onLoad() {},
    onReady() {},
  })
</script>

<style lang="stylus"></style>

<script type="application/json">
  {
    "usingComponents": {
      "list": "../components/list"
    }
  }
</script>
```

最后，我们进入 src/components/list.mpx 文件，可以看到其构成与页面文件十分相似，对于组件，Mpx 提供了和页面完全一致的增强能力

```html
<template>
  <view class="list">
    <view wx:for="{{listData}}" wx:key="index">{{item}}</view>
  </view>
</template>

<script>
  import { createComponent } from "@mpxjs/core"

  createComponent({
    data: {
      listData: ["手机", "电视", "电脑"],
    },
  })
</script>

<style lang="stylus">
  .list
    background-color red
</style>

<script type="application/json">
  {
    "component": true
  }
</script>
```

更多用法可以查看我们的官方实例：[https://github.com/didi/mpx/tree/master/examples/](https://github.com/didi/mpx/tree/master/examples/)

## 跨平台输出

如果你选择的 base 平台为微信，mpx 提供了强大的跨平台输出能力，能够将你的小程序源码输出到目前业内的全部小程序平台(微信/支付宝/百度/头条/QQ)中和 web 平台中运行。

执行以下命令进行跨平台输出

```shell
npm run build:cross
```

关于跨平台能力的更多详情请查看[这里](../advance/platform.md)
