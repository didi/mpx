# 2.0迁移指南

## 依赖升级

* `@mpxjs/core`由1.x升级至2.0
* `@mpxjs/webpack-plugin`由1.x升级至2.0

## 依赖变更

* `@mpxjs/promisify`废弃，使用`@mpxjs/api-proxy`代替
* `@mpxjs/url-loader`废弃，合入到`@mpxjs/webpack-plugin`中维护

## webpack配置变更

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
          name: 'img/[name].[ext]',
          limit: 10000
        })
      }
    ]
  }
}
```
