#### 文件维度条件编译

文件维度条件编译让用户能够以文件为维度进行跨平台差异代码的编写，例如在微信转支付宝的项目中存在框架无法转换的组件map.mpx，用户可以在相同的目录下创建map.ali.mpx文件作为patch，在该文件中使用支付宝的技术标准来源组件map.mpx中必要的功能，在项目mode为ali时Mpx会加载map.ali.mpx来代替原有map.mpx文件。

文件维度条件编译能够与webpack alias结合使用，对于npm包中的无法转换的文件，我们不方便在包目录中创建patch文件(npm i等操作会重写整个包目录)，此时我们可以通过webpack alias在包目录中创建一个`虚拟的`patch文件，并将其指向项目的源码目录中。

```js
  // 对于npm包中的文件依赖
  import map from 'npmPackage/lib/map'
  
  // 配置以下alias后，当mode为ali时，会加载项目目录中的projectRoot/src/patch/map文件以代替原有的npmPackage/lib/map文件
  const webpackConf = {
    resolve: {
      alias: {
        'npmPackage/lib/map.ali': 'projectRoot/src/patch/map'
      }
    }
  }
```

#### 区块维度条件编译

在.mpx单文件中一般存在template、js、style、json四个区块，Mpx支持以区块为维度进行条件编译，只需在区块标签中添加`mode`属性定义该区块的平台属性即可，其余规则与文件维度条件编译一致，可以将区块理解为.mpx单文件中的局部文件。

```html
<!--编译mode为ali时加载如下区块-->
<template mode="ali">
<!--该区块中的代码需采用支付宝的技术标准进行编写-->
  <view>支付宝环境</view>
</template>

<!--其他编译mode时加载如下区块-->
<template>
  <view>其他环境</view>
</template>
```

#### 代码维度条件编译

对于局部平台差异，mpx支持在template插值和js代码中访问`__mpx_mode__`获取当前项目的目标平台，结合条件语句if/else进行局部条件编译，如果条件表达式结果可在编译中推断得出，例如`__mpx_mode__ === 'ali'`，框架会在优化阶段删除不可到达的无用代码。

js代码中使用
```js
if(__mpx_mode__ === 'ali') {
  // 执行支付宝环境相关逻辑
} else {
  // 执行其他环境相关逻辑
}
```
template插值中使用
```html
<!--此处的__mpx_mode__不需要在组件中数据中声明-->
<view wx:if="{{__mpx_mode__ === 'ali'}}">支付宝环境</view>
<view wx:else>其他环境</view>
```
