# 2.0迁移指南

mpx2.0是完全兼容1.0版本的，显著的区别是支持了跨小程序平台的支持，

新创建的项目不用关心迁移问题，直接开发即可，使用1.0时期的包等都不受影响。

需要注意的一点是对小程序提供的API调用，我们使用了@mpxjs/api-proxy来抹平差异，同时之前的promisify被整合到了这个包里，所以1.x升级2.x需要替换@mpxjs/promisify为@mpxjs/api-proxy，使用方式为 `mpx.use(apiProxy, {usePromise: true})` ，同时，所有的api调用应从wx.xxx变更为mpx.xxx，比如wx.navigateTo写为mpx.navigateTo，**参数保持和微信一致，平台差异方面api-proxy做了抹平**。

老项目可以有两种升级方式：

## 拷贝升级

如果你的项目是在1.0时期利用脚手架生成的，希望体验2.0的新特性，最简单的方式是升级cli工具后新创建一个项目，删掉src部分，复制老项目的src即可。

一个有所变化的地方在于，新项目的打开项目方式发生了一些变化，原本用微信开发者工具打开项目目录变为了用开发者工具打开构建结果目录（dist或dist/wx，取决于是否用跨平台构建），变化的原因详情见下方 [附录-文件结构区别](#文件结构区别) 部分。

## 手工升级

如果你的项目之前就是手工配置的或者被个性化再次修改过或者对webpack配置非常熟练了解，也可以按照以下内容参考自行手工升级。

### 依赖升级

* `@mpxjs/core`由1.x升级至2.0
* `@mpxjs/webpack-plugin`由1.x升级至2.0

### 依赖变更

* `@mpxjs/promisify`废弃，使用`@mpxjs/api-proxy`代替
* `@mpxjs/url-loader`废弃，合入到`@mpxjs/webpack-plugin`中维护

### webpack配置变更

在2.0版本中，为了更好地处理小程序中template和wxs的引用，我们重写了url-loader和file-loader，并且调整了原有的wxs-loader的工作机制，这会导致项目的build/webpack.base.conf.js中的module.rules配置发生一定的变化，调整规则如下：

```js
const webpackConf = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          transRpx: {
            mode: 'only',
            comment: 'use rpx',
            include: resolve('src')
          }
        })
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test'), resolve('node_modules/@mpxjs')]
      },
      {
        test: /\.json$/,
        resourceQuery: /__component/,
        type: 'javascript/auto'
      },
      // 1.x版本中的配置
      // {
      //   test: /(\.wxs|\.sjs|\.filter\.js)$/,
      //   use: MpxWebpackPlugin.wxsLoader(),
      //   type: 'javascript/auto',
      //   issuer: /(\.wxml|\.axml|\.swan|\.mpx|\.th)$/
      // },
      // {
      //   test: /\.(png|jpe?g|gif|svg)$/,
      //   loader: '@mpxjs/url-loader',
      //   options: {
      //     name: 'img/[name].[ext]',
      //     limit: 10000
      //   }
      // },
      
      // 2.0版本后的配置
      {
        test: /\.(wxs|sjs|filter\.js)$/,
        loader: MpxWebpackPlugin.wxsPreLoader(),
        enforce: 'pre'
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: MpxWebpackPlugin.urlLoader({
          name: 'img/[name].[ext]'
        })
      }
    ]
  }
}
```

## 附录

#### 文件结构区别

使用@mpxjs/cli脚手架生成的项目在1.0版本时期和2.0版本时期有些区别。

早先因社区同学的建议使用了在项目根目录下的project.config.json文件中通过指定miniprogramRoot字段为dist，好处是不用复制，在微信小程序开发工具里可以用编辑器直接修改保存project.config.json文件。但跨小程序平台支持下，我们可能会在dist文件夹下再深一个层级区分不同小程序比如会有/dist/wx，/dist/ali，/dist/swan这样，出于打开项目体验的一致性等方面考量，决定这个微信特有的文件还是复制进构建结果里，不通过miniprogramRoot指定。

因此对于微信小程序的开发，1.0时期项目直接拷贝src到迁移2.0生成的新项目需要注意打开方式由打开项目目录改为打开项目构建生成的dist目录，如果是要用到跨平台特性（npm run build:cross），则要打开/dist/wx目录。
