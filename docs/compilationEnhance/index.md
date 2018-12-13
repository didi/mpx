# 构建配置

`mpx`利用`webpack`进行构建打包。通过`webpack插件`进行能力扩展

## 自动配置
如果你并不熟悉webpack，可以通过脚手架进行[快速配置](../start.md)。

----

## 手动配置

**webpack.config.js**
```js
var MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

var webpackConfig = {
  module: {
    rules: [
      // mpx文件必须设置正确的loader，参考下文详细的loader设置options
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          // `only`模式下，样式前加上注释/* use rpx */可将该段样式中所有的px转换为rpx
          transRpx: 'only',
          comment: 'use rpx'
        })
      },
      // 对本地图片资源提供增强，编译成小程序支持的格式 
      // <style>中的图片会被强制转为base64，
      // 其他地方引用的资源小于limit的会被转base64，否则会被打包到dist/img目录下通过小程序路径引用
      // 由于微信小程序中<cover-image>不支持传base64，可以在图像资源链接后加上`?fallback`查询字符串强制跳过转base64步骤
      // 参考下文详细的设置@mpxjs/url-loader的方法
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: '@mpxjs/url-loader',
        options: {
          limit: 10000,
          name: 'img/[name].[ext]'
        }
      }
    ]
  },
  // mpx主插件，必须设置，参考下文详细的插件设置options
  plugins: [
    new MpxWebpackPlugin({
    // 微信模式下设置为`wx`，支付宝模式下设置为`ali`
      mode: 'wx'
    })
  ],
  // sourceMap: 小程序不支持eval，因此不要设置为eval相关的sourceMap类型。
  // 注意：webpack4新增的mode属性设置为development的时候，会将devtool默认设置为eval，
  //      必须手动设置devtool为非eval相关类型来覆盖默认配置
  devtool: false,
  output: {
    // filename设置不能更改
    filename: '[name].js' 
  },
  // 通过webpack分包能力减少小程序体积，参考下文的详细介绍
  optimization: {
    runtimeChunk: {
      name: 'bundle'
    },
    splitChunks: {
      chunks: 'all',
      name: 'bundle',
      minChunks: 2
    }
  }
}
```
----
### @mpxjs/webpack-plugin

**webpack.config.js**
```js
var MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

webpackconfig = {
  plugins: [
    new MpxWebpackPlugin(options)
  ],
}
```
#### options

- **mode**

  `String`

    - `wx`代表编译微信小程序 

    - `ali`代表编译支付宝程序 
----
### MpxWebpackPlugin.loader

`@mpxjs/webpack-plugin`暴露了一个静态方法`MpxWebpackPlugin.loader`作为`.mpx`文件的loader

**webpack.config.js**
```js
var MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

webpackconfig = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader(options)
      }
    ]
  }
}
```
#### options

- **transRpx**

  `false | string `

    - `false`关闭转换rpx

    - `'all'`普通样式中的px全部转换为rpx，`rpx注释样式`不转换

    - `'only'`普通样式中的px全部**不转换**为rpx，`rpx注释样式`转换

- **comment**

  `String`
  
  `<style>`中的注释内容与`options.comment`一致时，会被识别为一个`rpx注释`

#### rpx注释样式
根据`rpx注释`的位置，`mpx`会将`一段css规则`或者`一条css声明`视为`rpx注释样式`

开发者可以声明一段rpx注释样式，提示编译器是否转换这段css中的px

#### 例子 

- 全局转换px至rpx，除了某些`rpx注释样式`之外

**webpack.config.js**
```js
webpackconfig = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          transRpx: 'all',
          comment: 'use px'
        })
      }
    ]
  }
}
```

**index.mpx**
```html
<style lang="css">
  /* use px */
  .not-translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .not-translate-b {
    /* use px */
    font-size: 100px;
    padding: 10px;
  }
  .translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .translate-b {
    font-size: 100px;
    padding: 10px;
  }
</style>
```
> 第一个注释位于一个`选择器`前，是一个`css规则注释`，整个规则都会被视为`rpx注释样式`

> 第二个注释位于一个`css声明`前，是一个`css声明注释`，只有`font-size: 100px`会被视为`rpx注释样式`

> `transRpx = all`模式下，除了这两条rpx注释样式之外，其他都会转rpx

- 只对某些`rpx注释样式`进行转rpx，全局其他px不转

**webpack.config.js**
```js
webpackconfig = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          transRpx: 'only',
          comment: 'use rpx'
        })
      }
    ]
  }
}
```

**index.mpx**
```html
<style lang="css">
  .not-translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .not-translate-b {
    font-size: 100px;
    padding: 10px;
  }
  /* use rpx */
  .translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .translate-b {
    /* use rpx */
    font-size: 100px;
    padding: 10px;
  }
</style>
```
> 第一个注释位于一个`选择器`前，是一个`css规则注释`，整个规则都会被视为`rpx注释样式`

> 第二个注释位于一个`css声明`前，是一个`css声明注释`，只有`font-size: 100px`会被视为`rpx注释样式`

> `transRpx = only`模式下，只有这两条rpx注释样式会转rpx，其他都不转

----
### @mpxjs/url-loader

受限于小程序既有的能力，目前在小程序中加载本地图片资源会有诸多限制：
- `<style>`中的css属性值只能使用base64引用图片，无法用本地路径
- `<template>`中的`<cover-image>`组件的src属性只能通过本地路径，不能使用base64
- `<template>`中的其他组件，例如`<image>`的src属性既可以用本地路径，又可以用base64

`@mpxjs/url-loader`对这些限制提供了增强。开发者在源码中无需书写base64，通过统一的路径方式引入图片资源，最终编译成小程序支持的代码。


> 想深入的了解`@mpxjs/url-loader`对小程序对图片资源的支持，查看[mpx图像资源处理](/understanding/resource.md)了解更多细节

**安装**
```js
npm install @mpxjs/url-loader
```

**webpack.config.js**
```js
webpackconfig = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: '@mpxjs/url-loader',
        options: /* options */
      }
    ]
  }
}
```
#### options

> 仅对`<template>和<script>`中的资源生效，因为`<style>`里的资源会强制做base64

- **limit**

  `Number`

  单位为byte，小于limit的资源会被base64，反之会被打包成资源
- **name**

  `String`

  设置图片被打包后的路径: `'img/[name].[ext]'`

#### 内联资源query options

- **fallback**

  `Any`

  通过内联query options，可以对指定的资源**强制使用**资源打包。

  这对于`<cover-image>`组件引用图片资源非常有效，因为`<cover-image>`组件不能用base64

#### 例子

**文件目录**
  ```
  component
  │-- index.mpx 
  │-- bg-img1.png    
  │-- bg-img2.png    
  │-- bg-img3.png    
  ```

**webpack.config.js**
```js
webpackconfig = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: '@mpxjs/url-loader',
        otions: {
          limit: 10000,
          name: 'img/[name].[ext]'
        } 
      }
    ]
  }
}
```

**index.mpx**
```html
<template>
  <image src="./bg-img1.png"></image>
  <image src="./bg-img2.png"></image>
  <cover-image src="./bg-img3.png?fallback">
</template>
```
> `bg-img1.png`大于10KB，会被打包成资源

> `bg-img2.png`小于10KB，会被做base64

> `bg-img3.png`需要在路径后添加`fallback`强制打包资源


----
### output.filename
小程序限定[描述页面的文件具有相同的路径和文件名](https://developers.weixin.qq.com/miniprogram/dev/framework/structure.html)，仅以后缀名进行区分。

因此`output.filename`中必须写为 **`[name].js`**，基于chunk id或者hash name的filename都会导致编译后的文件无法被小程序识别

**webpack.config.js**
```js
webpackconfig = {
  output: {
    filename: '[name].js', // 正确 
    filename: '[id].js', // 错误。chunk id name
    filename: '[name].[chunkhash].js' // 错误。hash name
  }
}
```
----
### optimization
为了减少打包后app/page/component目录中的js文件体积。mpx提供了`抽取公共依赖`的能力。将共用的依赖进行统一抽取

通过`optimization.runtimeChunk`和`optimization.splitChunks`进行设置

**webpack.config.js**
```js
webpackConfig = {
  optimization: {
    runtimeChunk: {
      name: 'bundle'
    },
    splitChunks: {
      chunks: 'all',
      name: 'bundle',
      minChunks: 2
    }
  }
}
```
----