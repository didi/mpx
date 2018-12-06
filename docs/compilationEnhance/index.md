# 构建配置

`mpx`利用`webpack`进行构建打包。通过webpack插件进行能力扩展

## 自动配置
如果你并不熟悉webpack，可以通过脚手架进行[快速配置](../start.md)。

## 手动配置
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
### MpxWebpackPlugin.loader

`mpx-webpack-plugin`暴露了一个静态方法`MpxWebpackPlugin.loader`作为`.mpx`文件的loader
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

  - 类型: `Boolean`

    是否开启转换rpx
- **comment**

  - 类型: `String`

### @mpxjs/url-loader
`@mpxjs/url-loader`基于[小程序对图片资源的支持](resource.md)，在编译阶段提供了增强。

在mpx工程源码中通过路径引用的图片资源，会被进行合适的处理，打包成符合小程序标准的格式。

受限于小程序无法在`style`中引用相对路径资源，所以样式中的图片会做强制base64。其他的资源则根据limit进行打包配置

```js
// 安装
npm install @mpxjs/url-loader
```

```js
// 配置
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

仅对非`<style>`中的资源生效，因为`<style>`里的资源会强制做base64

- **limit**

  - 类型: `Number`

    单位为byte，小于limit的资源会被base64，反之会被打包成资源
- **name**

  - 类型: `String`

    设置图片被打包后的路径


### MpxWebpackPlugin
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

  - 类型: `String`

    `wx`代表编译微信小程序 
    `ali`代表编译支付宝程序 

### output.filename
小程序限定[描述页面的文件具有相同的路径和文件名](https://developers.weixin.qq.com/miniprogram/dev/framework/structure.html)，仅以后缀名进行区分。

因此`output.filename`中必须写为 **`[name].js`**，基于chunk id或者hash name的filename都会导致编译后的文件无法被小程序识别

```js
webpackconfig = {
  output: {
    filename: '[name].js', // 正确 
    filename: '[id].js', // 错误。chunk id name
    filename: '[name].[chunkhash].js' // 错误。hash name
  }
}
```

### optimization
为了减少打包后app/page/component目录中的js文件体积。mpx提供了`抽取公共依赖`的能力。将共用的依赖进行统一抽取

通过`optimization.runtimeChunk`和`optimization.splitChunks`进行设置

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
