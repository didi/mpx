# 跨平台
## 多平台支持

Mpx支持在多个小程序平台中进行增强，目前支持的小程序平台包括微信，支付宝，百度，qq和头条，不过自2.0版本后，Mpx支持了以微信增强语法为base的跨平台输出，实现了一套业务源码在多端输出运行的能力，大大提升了多小程序平台业务的开发效率，详情可以查看[跨平台编译](#跨平台编译)

### template增强特性

不同平台上的模板增强指令按照平台的指令风格进行设计，文档和代码示例为了方便统一采用微信小程序下的书写方式。

模板增强指令对应表：

增强指令|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
双向绑定|wx:model|a:model|s-model|qq:model|tt:model
双向绑定辅助属性|wx:model-prop|a:model-prop|s-model-prop|qq:model-prop|tt:model-prop
双向绑定辅助属性|wx:model-event|a:model-event|s-model-event|qq:model-event|tt:model-event
双向绑定辅助属性|wx:model-value-path|a:model-value-path|s-model-value-path|qq:model-value-path|tt:model-value-path
双向绑定辅助属性|wx:model-filter|a:model-filter|s-model-filter|qq:model-filter|tt:model-filter
动态样式绑定|wx:class|a:class|s-class|qq:class|暂不支持
动态样式绑定|wx:style|a:style|s-style|qq:style|暂不支持
获取节点/组件实例|wx:ref|a:ref|s-ref|qq:ref|tt:ref
显示/隐藏|wx:show|a:show|s-show|qq:show|tt:show

### script增强特性

增强字段|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
computed|支持|支持|支持|支持|部分支持，无法作为props传递(待头条修复生命周期执行顺序可完整支持)
watch|支持|支持|支持|支持|支持
mixins|支持|支持|支持|支持|支持

### style增强特性

无平台差异

### json增强特性

增强字段|微信|支付宝|百度|qq|头条
----|----|----|----|----|----
packages|支持|支持|支持|支持|部分支持，无法分包


## 跨平台输出小程序

自2.0版本开始，mpx开始支持跨小程序平台编译，不同于常规跨平台框架重新定义一套DSL的方式，mpx支持基于现有平台的源码编译为其他已支持平台的目标代码。跨平台编译能力依赖于mpx的多平台支持，目前mpx已经支持将微信小程序跨平台编译为支付宝、百度、qq和头条小程序。

### 使用方法

如果你是使用`mpx init xxx`新生成的项目，package.json里script部分有`npm run build:cross`，直接执行`npm run build:cross`（watch同理），如果仅需构建某几个平台的，可以修改该script，按已有的格式删除或增添某些某些平台

如果你是自行搭建的mpx项目，你只需要进行简单的配置修改，打开项目的webpack配置，找到@mpxjs/webpack-plugin的声明位置，传入mode和srcMode参数即可，示例如下

```javascript
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      srcMode: 'wx' // srcMode为mpx编译的源码平台，目前仅支持wx
    }
  }
})
```

通过在 `npm script` 当中定义 `targets` 来设置mpx编译的目标平台

```javascript
// 项目 package.json
{
  "script": {
    "build:cross": "mpx-cli-service build:mp --targets=wx,ali"
  }
}
```

> 在 @mpxjs/cli@3.x 之前，通过 --modes 来设置mpx编译的目标平台

### 跨平台差异抹平

为了实现小程序的跨平台编译，我们在编译和运行时做了很多工作以抹平小程序开发中各个方面的跨平台差异

#### 模板语法差异抹平

对于通用指令/事件处理的差异，mpx提供了统一的编译转换抹平操作；而对于平台组件和组件属性的差异，我们也在力所能及的范围内进行了转换抹平，对于平台差异性过大无法转换的部分会在编译阶段报错指出。

#### 组件/页面对象差异抹平

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

#### json配置差异抹平

类似于模板语法，会在编译阶段进行转换抹平，无法转换的部分会在编译阶段报错指出。

#### api调用差异抹平

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

#### webview bridge差异抹平

Mpx支持小程序跨平台后，多个平台的小程序里都有webview组件，webview打开的页面和小程序可以通过API来通信以及调用一些小程序能力，但是各方webview提供的API是不一样的。

比如微信是用 wx.miniProgram.navigateTo 来跳转到别的小程序页面，而支付宝里是 my.navigateTo ，那么我们开发H5时候为了让H5能适应各家小程序平台就需要写多份对应逻辑。

为解决这个问题，Mpx提供了用于运行在小程序的webview里的H5抹平平台差异的bridge库：@mpxjs/webview-bridge

使用方式很简单，不过注意这个库是给H5用的，不是给小程序用的。在H5项目中引入。

[使用示例](https://github.com/didi/mpx/tree/master/examples/mpx-webview)

支持script标签引入和npm引入，标签引入的话，全局实例是mpx（npm模块使用下也鼓励import mpx from '@mpxjs/webview-birdge'），使用就例如 mpx.navigateTo ，能保持整个项目风格完全一致。

提供的API如下：`navigateTo, navigateBack, switchTab, reLaunch, redirectTo, getEnv, postMessage, getLoadError`

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
  // vue.config.js
  module.exports = defineConfig({
    configureWebpack() {
      return {
        resolve: {
          alias: {
            'somePackage/lib/index.ali': 'projectRoot/somePackage/lib/index'
          }
        }
      }
    }
  })
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

如果只有局部的代码存在跨平台差异，mpx同样支持在代码内使用if/else进行局部条件编译，用户可以在js代码和template插值中访问`__mpx_mode__`获取当前编译mode，进行平台差异逻辑编写，js代码中使用示例如下。

除了 `__mpx_mode__` 这个默认插值以外，有别的环境变量需要的话可以在mpx.plugin.conf.js里通过defs进行配置。

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

JSON中的条件编译（注意，这个依赖JSON的动态方案，得通过name="json"这种方式来编写，其实写的是js代码，最终module.exports导出一个可json化的对象即可）：
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

样式的条件编译：
```css
/*
  @mpx-if (__mpx_env__ === 'someEvn')
*/
  /* @mpx-if (__mpx_mode__ === 'wx') */
  .backColor {
    background: green;
  }
  /*
    @mpx-elif (__mpx_mode__ === 'qq')
  */
  .backColor {
    background: black;
  }
  /* @mpx-endif */

  /* @mpx-if (__mpx_mode__ === 'swan') */
  .backColor {
    background: cyan;
  }
  /* @mpx-endif */
  .textSize {
    font-size: 18px;
  }
/*
  @mpx-else
*/
.backColor {
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

### 属性维度条件编译

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

属性维度的编译也可以对整个节点进行条件编译，例如只想在支付宝小程序中输出某个节点：

```html
<view @ali>this is view</view>
```
需要注意使用上述用法时，节点自身在构建时框架不会对节点属性进行平台语法转换，但对于其子节点，框架并不会继承父级节点 mode，会进行正常跨平台语法转换。
```html
<!--错误示例-->
<view @ali bindtap="otherClick">
    <view bindtap="someClick">tap click</view>
</view>
// srcMode 为 wx 跨端输出 ali 结果为
<view @ali bindtap="otherClick">
    <view onTap="someClick">tap click</view>
</view>
```
上述示例为错误写法，假如srcMode为微信小程序，用上述写法构建输出支付宝小程序时，父节点 bindtap 不会被转为 onTap，在支付宝平台执行时事件会无响应。

正确写法如下：
```html
<!--正确示例-->
<view @ali onTap="otherClick">
    <view bindtap="someClick">tap click</view>
</view>
// 输出 ali 产物
<view @ali onTap="otherClick">
    <view onTap="someClick">tap click</view>
</view>
```
有时开发者期望使用 @ali 这种方式仅控制节点的展示，保留节点属性的平台转换能力，为此 Mpx 实现了一个隐式属性条件编译能力
```html
<!--srcMode为 wx，输出 ali 时，bindtap 会被正常转换为 onTap-->
<view @_ali bindtap="someClick">test</view>
```
在对应的平台前加一个_，例如@_ali、@_swan、@_tt等，使用该隐式规则仅有条件编译能力，节点属性语法转换能力依旧。

有时候我们不仅需要对节点属性进行条件编译，可能还需要对节点标签进行条件编译。

为此，我们支持了一个特殊属性 `mpxTagName`，如果节点存在这个属性，我们会在最终输出时将节点标签修改为该属性的值，配合属性维度条件编译，即可实现对节点标签进行条件编译，例如在百度环境下希望将某个 view 标签替换为 cover-view，我们可以这样写：

```html
<view mpxTagName@swan="cover-view">will be cover-view in swan</view>
```

### 通过 env 实现自定义目标环境的条件编译 {#use-env}

Mpx 支持在以上四种条件编译的基础上，通过自定义 env 的形式实现在不同环境下编译产出不同的代码。

实例化 MpxWebpackPlugin 的时候，传入配置 env。

```javascript
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      srcMode: 'wx' // srcMode为mpx编译的源码平台，目前仅支持wx
      plugin: {
        env: "didi" // env为mpx编译的目标环境，需自定义
      }
    }
  }
})
```

#### 文件维度条件编译

微信转支付宝的项目中存在一个业务地图组件map.mpx，由于微信和支付宝中的原生地图组件标准差异非常大，无法通过框架转译方式直接进行跨平台输出，而且这个地图组件在不同的目标环境中也有很大的差异，这时你可以在相同的位置新建一个 map.ali.didi.mpx 或 map.ali.qingju.mpx，在其中使用支付宝的技术标准进行开发，编译系统会根据当前编译的 mode 和 env 来加载对应模块，当 mode 为 ali，env 为 didi 时，会优先加载 map.ali.didi.mpx、map.ali.mpx，如果没有定义 env，则会优先加载 map.ali.mpx，反之则会加载 map.mpx。

#### 区块维度条件编译

在.mpx单文件中一般存在template、js、stlye、json四个区块，mpx的编译系统支持以区块为维度进行条件编译，只需在区块标签中添加`mode`或`env`属性定义该区块的目标平台即可，示例如下：

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

如果在 MpxWebpackPlugin 插件初始化时自定义了 env，你可以访问`__mpx_env__`获取当前编译env，进行环境差异逻辑编写。使用方法与`__mpx_mode__`相同。

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
如果只声明了 env，没有声明 mode，跨平台输出时框架对于节点属性默认会进行转换：
```html
<!--srcMode为wx，跨平台输出ali时，bindtap会被转为onTap-->
<view @:didi bindtap="someClick">this is a  view component</view>
<view bindtap@:didi ="someClick">this is a  view component</view>
```

### 其他注意事项

* 当目标平台为支付宝时，需要启用支付宝最新的component2编译才能保障框架正常工作，关于component2[点此查看详情](https://docs.alipay.com/mini/framework/custom-component-overview)；
* 跨平台源码中自定义组件的标签名不能使用驼峰形式`myComponent`，请使用横杠形式`my-component`来书写；
* 生成的目标代码中文件名和文件夹名不能带有`@`符号，目前媒体文件和原生自定义组件在编译时不会修改文件名，需要重点关注。

## 跨平台输出web

从2.3.0版本开始，Mpx开始支持将已有项目跨平台输出web平台中运行的能力，目前输出web能力完备，能够支持直接转换大型复杂项目，我们会持续对输出web的能力进行优化，不断的建全更全面的适用范围和开发体验。

### 技术实现

与小程序平台间的差异相比，web平台和小程序平台间的差异要大很多，小程序相当于是基于web技术的上层封装，所以不同于我们跨平台输出其他小程序平台时以编译转换为主的思路，在输出web时，我们更多地采用了封装的方式来抹平组件/Api和底层环境的差异，与当前大部分的跨平台框架相仿。但与当前大部分跨平台框架以web MVVM框架为base输出到小程序上运行的思路不同，我们是以Mpx小程序增强语法为基础输出到web中运行，前面说过小程序本身是基于web技术进行的实现，小程序->web的转换在可行性和兼容性上会好一些。

在具体实现上，Mpx项目输出到web中运行时在组件化和路由层面都是基于Vue生态实现，所以可以将Mpx的跨端输出产物整合到既有的Vue项目中，或者在条件编译中直接使用Vue语法进行web端的实现。

### 使用方法

使用@mpxjs/cli创建新项目时选择跨平台并选择输出web后，即可生成可输出web的示例项目，运行`npm run build:web`，就会在dist/web下输出构建后的web项目，并启动静态服务预览运行。

### 支持范围
目前对输出web的通用能力支持已经非常完备，下列表格中显示了当前版本中已支持的能力范围

#### 模板指令
指令名称|是否支持
:----|----
Mustache数据绑定|是
wx:for|是
wx:for-item|是
wx:for-index|是
wx:key|是
wx:if|是
wx:elif|是
wx:else|是
wx:model|是
wx:model-prop|是
wx:model-event|是
wx:model-value-path|是
wx:model-filter|是
wx:class|是
wx:style|是
wx:ref|是
wx:show|是

#### 事件绑定方式

绑定方式|是否支持
:----|----
bind|是
catch|是
capture-bind|是
capture-catch|是

#### 事件名称

事件名称|是否支持
:----|----
tap|是
longpress|是
longtap|是

web同名事件默认全部支持，已支持组件的特殊事件默认为支持，不支持的情况下会在编译时抛出异常

#### 基础组件

组件名称|是否支持|说明
:----|---- |----
audio|是
block|是
button|是
canvas|是
checkbox|是
checkbox-group|是
cover-view|是
form|是
image|是
input|是
movable-area|是
movable-view|是
navigator|是
picker|是
picker-view|是
progress|是
radio|是
radio-group|是
rich-text|是
scroll-view|是|scroll-view 输出 web 底层滚动依赖 [BetterScroll](https://better-scroll.github.io/docs/zh-CN/guide/base-scroll-options.html) 实现，支持额外传入以下属性： <br/><br/>`scroll-options`: object <br/>可重写 BetterScroll 初始化基本配置<br/>若出现无法滚动，可尝试手动传入 `{ observeDOM: true }` <br/><br/> `update-refresh`: boolean <br/>Vue updated 钩子函数触发时，可用于重新计算 BetterScroll<br/><br/>tips: 当使用下拉刷新相关属性时，由于 Vue 数据响应机制的限制，在 web 侧可能出现下拉组件状态无法复原的问题，可尝试在 `refresherrefresh` 事件中，手动将 refresher-triggered 属性值设置为 true
swiper|是|swiper 输出 web 底层滚动依赖 [BetterScroll](https://better-scroll.github.io/docs/zh-CN/guide/base-scroll-options.html) 实现，支持额外传入以下属性： <br/><br/>`scroll-options`: object <br/>可重写 BetterScroll 初始化基本配置<br/>当滑动方向为横向滚动，希望在另一方向保留原生的滚动时，scroll-options 可尝试传入 `{ eventPassthrough: vertical }`，反之可将 eventPassthrough 设置为 `horizontal`
swiper-item|是
switch|是
slider|是
text|是
textarea|是
video|是
view|是
web-view|是
在项目的app.json 中配置 "style": "v2"启用新版的组件样式，涉及的组件有 button icon radio checkbox switch slider在输出web时也与小程序保持了一致

#### 生命周期

生命周期名称|是否支持
:----|----
onLaunch|是
onLoad|是
onReady|是
onShow|是
onHide|是
onUnload|是
onError|是
onServerPrefetch｜是
created|是
attached|是
ready|是
detached|是
updated|是
serverPrefetch|是

#### 应用级事件

应用级事件名称|是否支持
:----|----
onPageNotFound|是
onPageScroll|是
onPullDownRefresh|是
onReachBottom|是
onResize|是
onTabItemTap|是

#### 组件配置


配置项|支持度
:----|----
properties|部分支持，observer不支持，请使用watch代替
data|支持
watch|支持
computed|支持
relations|支持
methods|支持
mixins|支持
pageLifetimes|支持
observers|不支持，请使用watch代替
behaviors|不支持，请使用mixins代替

#### 组件API

api名称|支持度
:----|----
triggerEvent|支持
$nextTick|支持
createSelectorQuery/selectComponent|支持


#### 全局API

api名称|支持度
:----|----
navigateTo|支持
navigateBack|支持
redirectTo|支持
request|支持
connectSocket|支持
SocketTask|支持
EventChannel|支持
createSelectorQuery|支持
base64ToArrayBuffer|支持
arrayBufferToBase64|支持
nextTick|支持
set|支持
setNavigationBarTitle|支持
setNavigationBarColor|支持
setStorage|支持
setStorageSync|支持
getStorage|支持
getStorageSync|支持
getStorageInfo|支持
getStorageInfoSync|支持
removeStorage|支持
removeStorageSync|支持
clearStorage|支持
clearStorageSync|支持
getSystemInfo|支持
getSystemInfoSync|支持
showModal|支持
showToast|支持
hideToast|支持
showLoading|支持
hideLoading|支持
onWindowResize|支持
offWindowResize|支持
createAnimation|支持

#### JSON配置
配置项|是否支持
:----|----
backgroundColor|是
backgroundTextStyle|是
disableScroll|是
enablePullDownRefresh|是
onReachBottomDistance|是
packages|是
pages|是
navigationBarBackgroundColor|是
navigationBarTextStyle|是
navigationBarTitleText|是
networkTimeout|是
subpackages|是
tabBar|是
usingComponents|是

#### 拓展能力
能力|是否支持
:---|---
fetch|是
i18n|是

#### 小程序其他原生能力
能力|支持度
:---|---
wxs|支持
animation|支持组件的animation属性，支持所有animation对象方法(export、step、width、height、rotate、scale、skew、translate等等)

