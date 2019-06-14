# 多平台支持

目前mpx支持了微信、支付宝、百度、qq、头条小程序平台。

## template增强特性

不同平台上的模板增强指令按照平台的指令风格进行设计，文档和代码示例为了方便统一采用微信小程序下的书写方式。

模板增强指令对应表：

增强指令|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
双向绑定|wx:model|a:model|s-model|qq:model|tt:model
双向绑定辅助属性|wx:model-prop|a:model-prop|s-model-prop|qq:model-prop|tt:model-prop
双向绑定辅助属性|wx:model-event|a:model-event|s-model-event|qq:model-event|tt:model-event
双向绑定辅助属性|wx:model-value-path|a:model-value-path|s-model-value-path|qq:model-value-path|tt:model-value-path
动态样式绑定|wx:class|a:class|s-class|暂不支持|暂不支持
动态样式绑定|wx:style|a:style|s-style|暂不支持|暂不支持
获取节点/组件实例|wx:ref|a:ref|s-ref|qq:ref|tt:ref
显示/隐藏|wx:show|a:show|s-show|qq:show|tt:show

## script增强特性

增强字段|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
computed|支持|支持|支持|支持|部分支持，无法作为props传递(待头条修复生命周期执行顺序可完整支持)
watch|支持|支持|支持|支持|支持
mixins|支持|支持|支持|支持|支持

## style增强特性

无平台差异

## json增强特性

增强字段|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
packages|支持|部分支持，无法分包|支持|支持|部分支持，无法分包


# 跨平台编译

自2.0版本开始，mpx开始支持跨小程序平台编译，不同于常规跨平台框架重新定义一套DSL的方式，mpx支持基于现有平台的源码编译为其他已支持平台的目标代码。跨平台编译能力依赖于mpx的多平台支持，目前mpx已经支持将微信小程序跨平台编译为支付宝、百度、qq和头条小程序。

## 使用方法

如果你是使用`mpx init xxx`新生成的项目，package.json里script部分有`npm run build:cross`，直接执行`npm run build:cross`（watch/prod同理），如果仅需构建某几个平台的，可以修改该script，按已有的格式删除或增添某些某些平台

如果你是自行搭建的mpx项目，你只需要进行简单的配置修改，打开项目的webpack配置，找到@mpxjs/webpack-plugin的声明位置，传入mode和srcMode参数即可，示例如下

```js
// 下面的示例配置能够将mpx微信小程序源码编译为支付宝小程序
new MpxWebpackPlugin({
  // mode为mpx编译的目标平台，可选值有(wx|ali|swan|qq|tt)
  mode: 'ali',
  // srcMode为mpx编译的源码平台，目前仅支持wx   
  srcMode: 'wx' 
})
```

## 跨平台差异抹平

为了实现小程序的跨平台编译，我们在编译和运行时做了很多工作以抹平小程序开发中各个方面的跨平台差异

### 模板语法差异抹平

对于通用指令/事件处理的差异，mpx提供了统一的编译转换抹平操作；而对于平台组件和组件属性的差异，我们也在力所能及的范围内进行了转换抹平，对于平台差异性过大无法转换的部分会在编译阶段报错指出。

### 组件/页面对象差异抹平

不同平台间组件/页面对象的差异主要体现在生命周期上，我们在支持多平台能力时已经将不同平台的生命周期映射到mpx框架的一套内部生命周期中，基于这个统一的映射，不同平台的生命周期差异也得到了抹平。

此外，我们还进行了一系列运行时增强来模拟微信平台中提供而其他平台中未提供的能力，例如：
* 在支付宝组件实例中提供了this.triggerEvent方法模拟微信中的自定义组件事件；
* 提供了this.selectComponent/this.selectAllComponents方法模拟微信中获取子组件实例的能力；
* 重写了createSelectorQuery方法抹平了微信/支付宝平台间的使用差异；
* 转换抹平了微信/支付宝中properties定义的差异；
* 利用mpx本身的数据响应能力模拟了微信中的observers/property observer能力等;
* 提供了this.getRelationNodes方法并支持了微信中组件间关系relations的能力

对于原生小程序组件的转换，还会进行一些额外的抹平，已兼容一些已有的原生组件库，例如：
* 将支付宝组件中的props数据挂载到this.data中以模拟微信平台中的表现；
* 利用mpx本身的mixins能力模拟微信中的behaviors能力。

对于一些无法进行模拟的跨平台差异，会在运行时进行检测并报错指出，例如微信转支付宝时使用moved生命周期等。

### json配置差异抹平

类似于模板语法，会在编译阶段进行转换抹平，无法转换的部分会在编译阶段报错指出。

### api调用差异抹平

对于api调用，mpx提供了一个api调用代理插件来抹平跨平台api调用的差异，使用时需要在项目中安装使用`@mpxjs/api-proxy`，并且在调用小程序api时统一使用mpx对象进行调用，示例如下：

```js
// 请在app.mpx中安装mpx插件
import mpx, { createApp } from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  // 开启api promisify
  usePromise: true
})

createApp({
  onLaunch() {
    // 调用小程序api时使用mpx.xxx，而不要使用wx.xxx或者my.xxx
    mpx.request({url: 'xxx'})
  }
})
```

对于无法转换抹平的api调用会在运行时阶段报错指出。

### webview bridge差异抹平

对于不同平台中webview bridge的调用，我们封装了一个`@mpxjs/webview-bridge`包，用于抹平不同小程序平台中webview bridge的差异，简单使用示例如下：

```js
import mpx from '@mpxjs/webview-bridge'

mpx.navigateBack()
```

对于无法转换抹平的bridge调用会在运行时阶段报错指出，详细使用指南请查看[webview-bridge](#webview-bridge)

## 跨平台条件编译

Mpx跨平台编译的原则在于，`能转则转，转不了则报错提示`，对于无法抹平差异的部分，我们提供了完善的跨平台条件编译机制便于用户处理因平台差异而无法相互转换的部分，也能够用于实现具有平台差异性的业务逻辑。

mpx中我们支持了三种维度的条件编译，分别是文件维度，区块维度和代码维度，其中，文件维度和区块维度主要用于处理一些大块的平台差异性逻辑，而代码维度主要用于处理一些局部简单的平台差异。

### 文件维度条件编译

文件维度条件编译简单的来说就是文件为维度进行跨平台差异代码的编写，例如在微信->支付宝的项目中存在一个业务地图组件map.mpx，由于微信和支付宝中的原生地图组件标准差异非常大，无法通过框架转译方式直接进行跨平台输出，这时你可以在相同的位置新建一个map.ali.mpx，在其中使用支付宝的技术标准进行开发，编译系统会根据当前编译的mode来加载对应模块，当mode为ali时，会优先加载map.ali.mpx，反之则会加载map.mpx。

文件维度条件编译能够与webpack alias结合使用，对于npm包的文件我们并不方便在原本的文件位置创建.ali的条件编译文件，但我们可以通过webpack alias在相同位置创建一个`虚拟的`.ali文件，并将其指向项目中的其他文件位置。

```js
  // 对于npm包中的文件依赖
  import npmModule from 'somePackage/lib/index'
  
  // 配置以下alias后，当mode为ali时，会优先加载项目目录中定义的projectRoot/somePackage/lib/index文件
  const webpackConf = {
    resolve: {
      alias: {
        'somePackage/lib/index.ali': 'projectRoot/somePackage/lib/index'
      }
    }
  }
```

### 区块维度条件编译

在.mpx单文件中一般存在template、js、stlye、json四个区块，mpx的编译系统支持以区块为维度进行条件编译，只需在区块标签中添加`mode`属性定义该区块的目标平台即可，示例如下：

```html
<!--编译mode为ali时使用如下区块-->
<template mode="ali">
<!--该区块中的所有代码需采用支付宝的技术标准进行编写-->
  <view>支付宝环境</view>
</template>

<!--其他编译mode时使用如下区块-->
<template>
  <view>其他环境</view>
</template>
```

### 代码维度条件编译

如果只有局部的代码存在跨平台差异，mpx同样支持在代码内使用if/else进行局部条件编译，用户可以在js代码和template插值中访问`__mpx_mode__`获取当前编译mode，进行平台差异逻辑编写，js代码中使用示例如下

```js
if(__mpx_mode__ === 'ali') {
  // 执行支付宝环境相关逻辑
} else {
  // 执行其他环境相关逻辑
}
```
template代码中使用示例如下

```html
<!--此处的__mpx_mode__不需要在组件中声明数据，编译时会基于当前编译mode进行替换-->
<view wx:if="{{__mpx_mode__ === 'ali'}}">支付宝环境</view>
<view wx:else>其他环境</view>
```

## 其他注意事项

* 当目标平台为支付宝时，需要启用支付宝最新的component2编译才能保障框架正常工作，关于component2[点此查看详情](https://docs.alipay.com/mini/framework/custom-component-overview)；
* 跨平台源码中自定义组件的标签名不能使用驼峰形式`myComponent`，请使用横杠形式`my-component`来书写；
* 生成的目标代码中文件名和文件夹名不能带有`@`符号，目前媒体文件和原生自定义组件在编译时不会修改文件名，需要重点关注。
