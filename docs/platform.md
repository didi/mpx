# 跨平台编译

自2.0版本开始，mpx开始支持跨小程序平台编译，不同于常规跨平台框架重新定义一套DSL的方式，mpx支持基于现有平台的源码编译为其他已支持平台的目标代码，例如，你可以将当前已有的mpx微信小程序项目直接编译为支付宝小程序在支付宝中运行。

## 使用方法

为了使用上述跨平台编译特性，你只需要进行简单的配置修改，打开项目的webpack配置，找到@mpxjs/webpack-plugin的声明位置，传入mode和srcMode参数即可，示例如下

```js
// 下面的示例配置能够将mpx微信小程序源码编译为支付宝小程序
new MpxWebpackPlugin({
  // mode为mpx编译的目标平台，可选值有(wx|ali|swan|qq)
  mode: 'ali',
  // srcMode为mpx编译的源码平台，目前仅支持wx   
  srcMode: 'wx' 
})
```

## 跨平台条件编译

mpx跨平台的编译的原则在于，`能转则转，转不了则报错提示`，对于报错的部分，我们提供了完善的跨平台条件编译机制便于用户处理因平台差异而无法相互转换的部分，也能够用于实现具有平台差异性的业务逻辑。

mpx中我们支持了三种维度的条件编译，分别是文件维度，区块维度和代码维度，其中，文件维度和区块维度主要用于处理一些大块的平台差异性逻辑，而代码维度主要用于处理一些局部简单的平台差异。

### 文件维度条件编译

文件维度条件编译简单的来说就是文件为维度进行跨平台差异代码的编写，例如在微信->支付宝的项目中存在一个业务地图组件map.mpx，由于微信和支付宝中的原生地图组件标准差异非常大，无法通过框架转译方式直接进行跨平台输出，这时你可以在相同的位置新建一个map.ali.mpx，在其中使用支付宝的技术标准进行开发，编译系统会根据当前编译的mode来加载对应模块，当mode为ali时，会优先加载map.ali.mpx，反之则会加载map.mpx。

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

## Api转换

对于小程序api的调用，mpx提供了一个api调用代理插件来抹平跨平台api差异，使用时需要在项目中安装使用`@mpxjs/api-proxy`，并且在调用小程序api时统一使用mpx对象进行调用，示例如下：

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

## 其他跨平台差异

### 获取节点/组件实例

支付宝和微信等其他平台中获取节点/组件实例的方式并不对齐，我们在模板增强中提供了统一的refs封装，具有跨平台能力，在编写跨平台代码时请通过refs获取节点/组件实例，具体使用方法参考[获取节点](single/template-enhance.md#refs)

### 样式/类名绑定

mpx中的样式/类名绑定使用类wxs的渲染层脚本进行实现，由于qq小程序暂未开放类wxs支持，qq小程序中暂时无法使用样式/类名绑定能力

## 已支持的跨平台编译能力

目前mpx已经支持了微信->支付宝/百度/qq的跨平台编译，未来我们会将跨平台编译的转换规则开发进行完善的文档说明并开放出来，便于社区贡献更多的跨平台编译能力

## 已支持的小程序平台

目前mpx支持了微信、支付宝、百度、qq小程序平台，头条小程序因生命周期问题暂未开放支持。

不同平台上的增强指令按照平台的指令风格进行设计，文档和代码示例为了方便统一采用微信小程序下的书写方式。

模板增强指令对应表：

指令|微信|支付宝|百度|qq
----|----|----|----|----
双向绑定|wx:model|a:model|s-model|qq:model
双向绑定辅助属性|wx:model-prop|a:model-prop|s-model-prop|qq:model-prop
双向绑定辅助属性|wx:model-event|a:model-event|s-model-event|qq:model-event
双向绑定辅助属性|wx:model-value-path|a:model-value-path|s-model-value-path|qq:model-value-path
动态样式绑定|wx:class|a:class|s-class|暂未支持
动态样式绑定|wx:style|a:style|s-style|暂未支持
获取节点/组件实例|wx:ref|a:ref|s-ref|qq:ref
显示/隐藏|wx:show|a:show|s-show|qq:show
