# 跨平台编译
自 2.0 版本开始，Mpx 开始支持跨小程序平台编译，不同于常规跨平台框架重新定义一套 DSL 的方式，Mpx 支持基于现有平台的源码编译为其他已支持平台的目标代码。跨平台编译能力依赖于 Mpx 的多平台支持，目前 Mpx 已经支持将微信小程序跨平台编译为支付宝、百度、qq和头条小程序。

## 使用方法

如果你是使用`mpx init xxx`新生成的项目，package.json里script部分有`npm run build:cross`，直接执行`npm run build:cross`（watch同理），如果仅需构建某几个平台的，可以修改该script，按已有的格式删除或增添某些某些平台

如果你是自行搭建的mpx项目，你只需要进行简单的配置修改，打开项目的webpack配置，找到@mpxjs/webpack-plugin的声明位置，传入mode和srcMode参数即可，示例如下

```js
// 下面的示例配置能够将mpx微信小程序源码编译为支付宝小程序
new MpxwebpackPlugin({
  // mode为mpx编译的目标平台，可选值有(wx|ali|swan|qq|tt)
  mode: 'ali',
  // srcMode为mpx编译的源码平台，目前仅支持wx   
  srcMode: 'wx'
})
```

## 跨平台差异抹平

为了实现小程序的跨平台编译，我们在编译和运行时做了很多工作来抹平小程序开发中各个方面的跨平台差异

#### 模板语法差异抹平

对于通用指令/事件处理的差异，Mpx 提供了统一的编译转换抹平操作；而对于平台组件和组件属性的差异，我们也在力所能及的范围内进行了转换抹平，对于平台差异性过大无法转换的部分会在编译阶段报错指出。

#### 组件/页面对象差异抹平

不同平台间组件/页面对象的差异主要体现在生命周期上，我们在支持多平台能力时已经将不同平台的生命周期映射到 Mpx 框架的一套内部生命周期中，基于这个统一的映射，不同平台的生命周期差异也得到了抹平。

此外，我们还进行了一系列运行时增强来模拟微信平台中提供而其他平台中未提供的能力，例如：
* 在支付宝组件实例中提供了 this.triggerEvent 方法模拟微信中的自定义组件事件；
* 提供了 this.selectComponent/this.selectAllComponents 方法模拟微信中获取子组件实例的能力；
* 重写了 createSelectorQuery 方法抹平了微信/支付宝平台间的使用差异；
* 转换抹平了微信/支付宝中 properties 定义的差异；
* 利用 Mpx 本身的数据响应能力模拟了微信中的 observers/property observer 能力等;
* 提供了 this.getRelationNodes 方法并支持了微信中组件间关系 relations 的能力

对于原生小程序组件的转换，还会进行一些额外的抹平，以及兼容一些已有的原生组件库，例如：
* 将支付宝组件中的 props 数据挂载到 this.data 中以模拟微信平台中的表现；
* 利用 Mpx 本身的 mixins 能力模拟微信中的 behaviors 能力。

对于一些无法进行模拟的跨平台差异，会在运行时进行检测并报错指出，例如微信转支付宝时使用 moved 生命周期等。

#### json配置差异抹平

类似于模板语法，会在编译阶段进行转换抹平，无法转换的部分会在编译阶段报错指出。

#### api调用差异抹平

对于 api 调用，Mpx 提供了一个 api 调用代理插件来抹平跨平台 api 调用的差异，使用时需要在项目中安装使用 `@mpxjs/api-proxy` ，并且在调用小程序 api 时统一使用 Mpx 对象进行调用，示例如下：

```js
// 请在 app.mpx 中安装 Mpx 插件
import mpx, { createApp } from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, {
  // 开启 api promisify
  usePromise: true
})

createApp({
  onLaunch() {
    // 调用小程序 api 时使用 mpx.xxx ，而不要使用 wx.xxx 或者 my.xxx
    mpx.request({url: 'xxx'})
  }
})
```

对于无法转换抹平的api调用会在运行时阶段报错指出。

#### webview bridge差异抹平

Mpx 支持小程序跨平台后，多个平台的小程序里都有 webview 组件，webview 打开的页面和小程序可以通过 API 来通信以及调用一些小程序能力，但是各方 webview 提供的API是不一样的。

比如微信是用 wx.miniProgram.navigateTo 来跳转到别的小程序页面，而支付宝里是 my.navigateTo ，那么我们开发 H5 时候为了让 H5 能适应各家小程序平台就需要写多份对应逻辑。

为解决这个问题，Mpx 提供了用于运行在小程序的 webview 里的 H5 抹平平台差异的 bridge 库：@mpxjs/webview-bridge

使用方式很简单，支持 script 标签和 npm 包两种形式引入，标签引入的话，全局实例是mpx。不过注意这个库是给 H5 用的，不是给小程序用的，仅可在 H5 项目中引入。

[使用示例](https://github.com/didi/mpx/tree/master/examples/mpx-webview)

```html
<!-- script 方式引入-->
<script src="./webviewbridge.min.js"></script>
<script>
  function back () {
    mpx.navigateBack()
  }

  function navigateToBack () {
    mpx.navigateTo({
      url: '/pages/index'
    })
  }

  function redirectToBack () {
    mpx.redirectTo({
      url: '/pages/index'
    })
  }
  
</script>
```
```js
// npm 模块推荐使用以下方式引用，使用就例如 mpx.navigateTo ，能保持整个项目风格完全一致。
import mpx from '@mpxjs/webview-birdge'
function postMessageHandle () {
    mpx.postMessage({
      data: '这是来自h5的消息'
    })
    mpx.navigateBack()
}
```

目前提供的API如下：`navigateTo, navigateBack, switchTab, reLaunch, redirectTo, getEnv, postMessage, getLoadError` 
 
## 跨平台条件编译
Mpx 跨平台编译的原则在于，`能转则转，转不了则报错提示`，对于无法抹平差异的部分，我们提供了完善的跨平台条件编译机制便于用户处理因平台差异而无法相互转换的内容，同时也可以实现具有平台差异性的业务逻辑。

Mpx 中我们支持了四种维度的条件编译，分别是文件维度，区块维度，代码维度以及属性维度。其中，文件维度和区块维度主要用于处理一些大块的平台差异性逻辑，而代码维度主要用于处理一些局部简单的平台差异。

#### 文件维度条件编译

文件维度条件编译简单的来说就是以文件为维度进行跨平台差异代码的编写，例如在微信->支付宝的项目中存在一个业务地图组件 map.mpx ，由于微信和支付宝中的原生地图组件标准差异非常大，无法通过框架转译方式直接进行跨平台输出，这时你可以在相同的位置新建一个 map.ali.mpx ，在其中使用支付宝的技术标准进行开发，编译系统会根据当前编译的 mode 来加载对应模块，当 mode 为 ali 时，会优先加载 map.ali.mpx ，反之则会加载 map.mpx 。

文件维度条件编译能够与 webpack alias 结合使用，对于 npm 包的文件我们并不方便在原本的文件位置创建 .ali 的条件编译文件，但我们可以通过 webpack alias 在相同位置创建一个`虚拟的`.ali文件，并将其指向项目中的其他文件位置。

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

#### 区块维度条件编译

在 .mpx 单文件中一般存在 template、js、stlye、json 四个区块，mpx 的编译系统支持以区块为维度进行条件编译，只需在区块标签中添加 `mode` 属性定义该区块的目标平台即可，示例如下：

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

#### 代码维度条件编译

如果只有局部的代码存在跨平台差异，mpx 同样支持在代码内使用 if/else 进行局部条件编译，用户可以在 js 代码和 template 插值中访问 `__mpx_mode__` 获取当前编译 mode ，进行平台差异逻辑编写，js代码中使用示例如下。

除了 `__mpx_mode__` 这个默认插值以外，如果需要其它环境变量，可以在 mpx.plugin.conf.js 里通过 defs 进行配置。

```js
if(__mpx_mode__ === 'ali') {
  // 执行支付宝环境相关逻辑
} else {
  // 执行其他环境相关逻辑
}
```
template 代码中使用示例如下

```html
<!--此处的__mpx_mode__不需要在组件中声明数据，编译时会基于当前编译mode进行替换-->
<view wx:if="{{__mpx_mode__ === 'ali'}}">支付宝环境</view>
<view wx:else>其他环境</view>
```

JSON中的条件编译
```html
<script name="json">
const pages = __mpx_mode__ === 'wx' ? [
  'main/xxx',
  'sub/xxx'
] : [
  'test/xxx'
] // 可以为不同环境动态书写配置
module.exports = {
  usingComponents: {
    aComponents: '../xxxxx' // 可以打注释 xxx组件
  }
}
</script>
```
:::warning 注意
这个依赖 JSON 的动态方案，得通过 name="json" 这种方式来编写，其实写的是 js 代码，最终通过 module.exports 导出一个可 json 化的对象即可
:::

样式的条件编译：
```css
/*
  @mpx-if (
      __mpx_mode__ === 'wx' ||
      __mpx_mode__ === 'qq'
  )
*/
  /* @mpx-if (__mpx_mode__ === 'wx') */
  wx {
    background: green;
  }
  /*
    @mpx-elif (__mpx_mode__ === 'qq')
  */
  qq {
    background: black;
  }
  /* @mpx-endif */

  /* @mpx-if (__mpx_mode__ === 'swan') */
  swan {
    background: cyan;
  }
  /* @mpx-endif */
  always {
    background: white;
  }
/*
  @mpx-else
*/
other {
  /* @mpx-if (__mpx_mode__ === 'swan') */
  background: blue;
  /* @mpx-else */
  background: red;
  /* @mpx-endif */
}
/*
  @mpx-endif
*/
```

#### 属性维度条件编译

属性维度条件编译允许用户在组件上使用 `@` 和 `|` 符号来指定某个节点或属性只在某些平台下有效。

对于同一个 button 组件，微信小程序支持 `open-type="getUserInfo"`，但是支付宝小程序支持 `open-type="getAuthorize" `。如果不使用任何维度的条件编译，则在编译的时候会有警告和报错信息。

比如业务中需要通过 button 按钮获取用户信息，虽然可以使用代码维度条件编译来解决，但是增加了很多代码量：

```html
<button 
  wx:if="{{__mpx_mode__ === 'wx' || __mpx_mode__ === 'swan'}}" 
  open-type="getUserInfo" 
  bindgetuserinfo="getUserInfo">
  获取用户信息
</button>

<button 
  wx:elif="{{__mpx_mode__ === 'ali'}}" 
  open-type="getAuthorize" 
  scope="userInfo"
  onTap="onTap">
  获取用户信息
</button>
```

而用属性维度的编译则方便很多：

```html
<button 
  open-type@wx|swan="getUserInfo" 
  bindgetuserinfo@wx|swan="getUserInfo"
  open-type@ali="getAuthorize" 
  scope@ali="userInfo"
  onTap@ali="onTap">
  获取用户信息
</button>
```

属性维度的编译也可以对整个节点进行条件编译，例如只想在百度小程序中输出某个节点：

```html
<view @swan>this is view</view>
```

有时候我们不仅需要对节点属性进行条件编译，可能还需要对节点标签进行条件编译。

为此，我们支持了一个特殊属性 `mpxTagName`，如果节点存在这个属性，我们会在最终输出时将节点标签修改为该属性的值，配合属性维度条件编译，即可实现对节点标签进行条件编译，例如在百度环境下希望将某个 view 标签替换为 cover-view，我们可以这样写：

```html
<view mpxTagName@swan="cover-view">will be cover-view in swan</view>
```

### 通过 env 实现自定义目标环境的条件编译

Mpx 支持在以上四种条件编译的基础上，通过自定义 env 的形式实现在不同环境下编译产出不同的代码。

实例化 MpxWebpackPlugin 的时候，传入配置 env。

```javascript
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
new MpxWebpackPlugin({
  // mode为mpx编译的目标平台，可选值有(wx|ali|swan|qq|tt)
  mode: 'ali',
  // srcMode为mpx编译的源码平台，目前仅支持wx   
  srcMode: 'wx',
  // env为mpx编译的目标环境，需自定义
  env: 'didi'
})
```

#### 文件维度条件编译

还是以微信->支付宝的项目中存在一个业务地图组件 map.mpx 为例，可以在相同的位置新建一个 map.ali.didi.mpx 或 map.ali.qingju.mpx，在其中使用支付宝的技术标准进行开发，编译系统会根据当前编译的 mode 和 env 来加载对应模块，当 mode 为 ali，env 为 didi 时，会优先加载 map.ali.didi.mpx、map.ali.mpx，如果没有定义 env，则会优先加载 map.ali.mpx，反之则会加载 map.mpx。

#### 区块维度条件编译

只需在区块标签中添加 `env` 属性定义该区块的目标平台即可，示例如下：

```html
<!--编译mode为ali且env为didi时使用如下区块，优先级最高是4-->
<template mode="ali" env="didi">
  <view>该区块中的所有代码需采用支付宝的技术标准进行编写</view>
</template>

<!--编译mode为ali时使用如下区块，优先级是3-->
<template mode="ali">
  <view>该区块中的所有代码需采用支付宝的技术标准进行编写</view>
</template>

<!--编译env为didi时使用如下区块，优先级是2-->
<template env="didi">
  <view>该区块中的所有代码需采用支付宝的技术标准进行编写</view>
</template>

<!--其他环境，优先级是1-->
<template>
  <view>该区块中的所有代码需采用支付宝的技术标准进行编写</view>
</template>
```

注意，如果多个相同的区块写相同的 mode 和 env，默认会用最后一个，如：

```html
<template mode="ali">
  <view>该区块会被忽略</view>
</template>

<template mode="ali">
  <view>默认会用这个区块</view>
</template>
```

#### 代码维度条件编译

如果在 MpxWebpackPlugin 插件初始化时自定义了 env，你可以访问 `__mpx_env__` 获取当前编译 env ，进行环境差异逻辑编写。使用方法与 `__mpx_mode__` 相同。

#### 属性维度条件编译

env 属性维度条件编译与 mode 的用法大致相同，使用 `:` 符号与 mode 和其他 env 进行串联，与 mode 组合使用格式形如 `attr@mode:env:env|mode:env`，为了不与 mode 混淆，当条件编译中仅存在 env 条件时，也需要添加 `:` 前缀，形如 `attr@:env`。

对于同一个 button 组件，微信小程序支持 `open-type="getUserInfo"`，但是支付宝小程序支持 `open-type="getAuthorize" `。如果不使用任何维度的条件编译，则在编译的时候会有警告和报错信息。

如果当前编译的目标平台是 wx，以下写法 open-type 属性将被忽略

```html
<button open-type@swan:didi="getUserInfo">获取用户信息</button>
```

如果当前 env 不是 didi，以下写法 open-type 属性也会被忽略
```html
<button open-type@:didi="getUserInfo">获取用户信息</button>
```

如果只想在 mode 为 wx 且 env 为 didi 或 qingju 的环境下使用 open-type 属性，则可以这样写：
```html
<button open-type@wx:didi:qingju="getUserInfo">获取用户信息</button>
```

env 属性维度的编译同样支持对整个节点或者节点标签名进行条件编译：

```html
<view @:didi>this is a  view component</view>
<view mpxTagName@:didi="cover-view">this is a  view component</view>
```
### 其他注意事项

* 当目标平台为支付宝时，需要启用支付宝最新的component2编译才能保障框架正常工作，关于component2[点此查看详情](https://docs.alipay.com/mini/framework/custom-component-overview)；
* 跨平台源码中自定义组件的标签名不能使用驼峰形式`myComponent`，请使用横杠形式`my-component`来书写；
* 生成的目标代码中文件名和文件夹名不能带有`@`符号，目前媒体文件和原生自定义组件在编译时不会修改文件名，需要重点关注。
