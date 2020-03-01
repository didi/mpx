# 构建配置

mpx深度定制开发了一个webpack插件`@mpxjs/webpack-plugin`，基于该插件使用webpack进行小程序的编译构建工作。

## 自动配置
如果你不熟悉webpack，可以通过脚手架进行[快速配置](../start.md)。

----

## 手动配置

**webpack.config.js**
```js
var MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

var webpackConfig = {
  module: {
    rules: [
      // mpx文件必须设置正确的loader，参考下文详细的loader设置options
      // 注意，在最新的脚手架生成的模板中，这个loader的配置在build/build.js中
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          transRpx: [
            // 可以是对象也可以是数组，数组可以通过include/exclude对不同资源配置不同的转换
            {
              // `only`模式下，样式前加上注释/* use rpx */可将该段样式中所有的px转换为rpx
              mode: 'only',
              comment: 'use rpx',
              include: resolve('src')
            },
            {
              // 对某些第三方组件库另设转换规则
              mode: 'all',
              designWidth: 375,
              include: resolve('node_modules/vant-weapp')
            }
          ]
        })
      },
      // 对本地图片资源提供增强，编译成小程序支持的格式 
      // 参考下文详细的设置
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: MpxWebpackPlugin.urlLoader({
          name: 'img/[name][hash].[ext]'
        })
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
    // 在脚手架生成的项目中，mpx-webpack-plugin是在在build/build.js里插入的，但是配置项可以在build/mpx.plugin.conf.js中填写，有简单的注释说明
    new MpxWebpackPlugin(options)
  ],
}
```
#### options

- **mode** `String` 目前支持的有微信小程序(wx)\支付宝小程序(ali)\百度小程序(swan)\头条小程序(tt)\QQ小程序(qq)\H5页面(web)
- **srcMode** `String` 跨平台编译场景下使用，详情请看 [跨平台编译](../platform.md#跨平台编译) 一节
- **resolveMode** `String` 默认值为webpack，可选值有webpack/native，这是解析依赖路径时为了解决小程序特色绝对路径所添加的，推荐使用webpack模式，更舒服一些，json中的pages/usingComponents等需要写相对路径，但是可以直接写npm包路径。如果希望使用类似小程序原始那种"绝对路径"，就可以声明为native，但是npm路径就需要在前面加一个~，类似webpack的样式引入规范，同时必须配合projectRoot参数提供项目根目录地址。
- **projectRoot** `String` 如果指定resolveMode为native，则必须提供此项配置为项目根目录地址。
- **writeMode** `String` 小程序开发者工具检测到文件'变化'就会重新编译，并不会关系文件内容是否真正变化，而webpack每次输出都是全量的，会导致项目大了后每次重编译都较慢，为了解决这个问题，在输出前在内存中对比一次剔除未变化的文件，仅输出变化的文件以提升小程序开发者工具的编译速度。建议开启。
- **modeRules** `Object` mpx在应用条件编译时，可能会遇到这种场景，假设同时开发微信/支付宝两个平台，用户是以微信小程序为基准来编写代码的，但是又有一个平台差异较大的地方，在支付宝平台上期望用一份支付宝原生代码来实现，这份支付宝原生代码可能在一个npm包内或者在某个文件夹下，依照mpx默认的识别方式，需要对这些文件都加中缀.ali才可以正确识别，而通过modeRules我们可以直接声明某个路径下的文件全是某种mode。
- **enableAutoScope** `Boolean` 支付宝小程序没有微信小程序类似的组件样式隔离机制，如果遇到样式问题，将本选项置为true将自动为支付宝添加scope，会带来略微的体积上涨
- **defs** `Object` 给模板和json中定义一些全局环境变量，区别于webpack.DefinePlugin的是仅支持普通扁平对象，但支持小程序的4个文件。这样根据平台注入全局变量时能为4个文件都注入，而不仅仅是JS，以此来实现编译时去除多余的其他平台的代码。
- **i18n** `Object` 多语言能力，提供多语言包，在编译时生成对应的wxs方法，以完善小程序的国际化能力。

示例：

```js
new MpxWebpackPlugin({
  mode: 'ali', // 可选值 wx/ali/swan/qq/tt/web
  srcMode: 'wx', // 暂时只支持微信为源mode做跨平台，为其他时mode必须和srcMode一致
  writeMode: 'changed', // 可选值changed / full，不建议修改
  resolveMode: 'webpack', // 可选值 native / webpack
  projectRoot: resolve('src'), // 若resolveMode为native才需要传这个以指定项目的“绝对路径”绝对于谁的
  enableAutoScope: false, // 是否开启支付宝样式scope，会带来略微的体积上涨
  defs: {
    // 常量 仅支持扁平对象，内嵌的环境变量有__mpx_mode__和__mpx_src_mode__
    apiHost: 'apitest.com' // 可以准备多个对象，在build.js里根据参数决定塞哪个以实现开发时用某一套，上线时用哪一套
  },
  i18n: {}, // 多语言 参考 https://didi.github.io/mpx/i18n.html
  modeRules: {
     // 批量指定文件mode，和webpack的rules相同
    ali: {
      include: [resolve('vant-aliapp')]
    }
   }
})
```

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
        use: MpxWebpackPlugin.loader({
          transRpx: {}
        })
      }
    ]
  }
}
```

- **transRpx**  
  `Object | Array | boolean | string`
    - `false`关闭转换rpx
    - `'all'`普通样式中的px全部转换为rpx，`rpx注释样式`不转换
    - `'only'`普通样式中的px全部**不转换**为rpx，`rpx注释样式`转换
    - Object包含属性：mode/comment/designWidth/include/exclude
        > include/exclude属性的用法和webpack对module.rules里的规则是一样的，参考[webpack文档-exclude](https://webpack.js.org/configuration/module/#rule-exclude)

该loader用于处理.mpx单文件，并可以通过options控制mpx框架提供的rpx转换能力。详情见 [rpx转换](/single/style-enhance.md#rpx转换)

### @mpxjs/url-loader

已废弃，功能全部收集到 @mpxjs/webpack-plugin 中。

> 想深入的了解mpx框架对小程序对图片资源的支持，查看[mpx图像资源处理](/understanding/resource.md)了解更多细节

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
