# 图像资源处理

> Mpx在小程序开发中提供了很好的图像资源处理能力，让开发者可以愉快地在项目中使用图片。

## 图像资源引入有三种方式
1. Template 中通过 image src 指定图像资源
    - 直接指定图像的远程资源地址    
    - 资源为本地路径，若配置 publicPath，则 publicPath 与 webpack loader 中配置的 name 进行拼接
2. Style 中通过 src 指定图像资源
3. Style 中通过 class 指定图像资源

  Wxss文件中只能用 CDN 地址或 Base64, 针对第二、三种方式引入的资源，可以通过配置决定使用 CDN 还是 Base64，且 Mpx 中图像资源处理会优先检查 Base64，具体配置参数如下：
* publicPath：资源存放 CDN 地址，可选
* limit: 资源大小限制，可根据资源的大小判断走 Base64 还是 CDN， 可选
* publicPathScope: 限制输出 CDN 图像资源的范围，可选 styleOnly、all，默认为 styleOnly。（图像引用方式分两大类 Template, Style）
* outputPathCDN: 设置 CDN 图像对应的本地相对地址（相对于当前编译输出目录的地址，如 dist,或者 dist/wx），可写脚本将本地图像批量上传到 CDN

## Base64 图像资源
图像转 Base64的两种方式:
* 未配置 publicPath
* 配置了 publicPath，且用户未自定义图像处理 fallback query，且未配置 limit 或图像资源未超过 limit 的限制时
```js
// webpack.config.js 配置,未配置 publicPath 必走 Base64
const webpackConfig = {
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: MpxWebpackPlugin.urlLoader({
        name: 'img/[name][hash].[ext]'
      })
    }]
  }
}
```
::: tip @mpxjs/cli 3.x 版本配置如下
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      urlLoader: {
        name: 'img/[name][hash].[ext]'
      }
    }
  }
})
```
:::
```css
<style>
  .logo {
    background-image: url('~images/logo.png');
  }
</style>
```
## CDN 图像资源
```js
// webpack.config.js 配置
const webpackConfig = {
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: MpxWebpackPlugin.urlLoader({
        name: 'img/[name][hash].[ext]',
        // CDN 地址
        publicPath: 'http://a.com/',
        limit: '1024' // Base64 的最大长度，超过则走 CDN 
      })
    }]
  }
}
```

::: tip @mpxjs/cli 3.x 版本配置如下
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      urlLoader: {
        name: 'img/[name][hash].[ext]',
        // CDN 地址
        publicPath: 'http://a.com/',
        limit: '1024' // Base64 的最大长度，超过则走 CDN 
      }
    }
  }
})
```
:::

## CDN 图像资源输出本地目录，用户自行批量上传到CDN服务器
```js
// webpack.config.js 配置
const webpackConfig = {
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: MpxWebpackPlugin.urlLoader({
          name: 'img/[name][hash].[ext]',
          publicPath: 'http://a.com',
          limit: 100,
          publicPathScope: 'styleOnly',
          outputPathCDN: './cdnImages'
      })
    }]
  }
}
```

::: tip @mpxjs/cli 3.x 版本配置如下
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      urlLoader: {
        name: 'img/[name][hash].[ext]',
        publicPath: 'http://a.com',
        limit: 100,
        publicPathScope: 'styleOnly',
        outputPathCDN: './cdnImages'
      }
    }
  }
})
```
:::

> 备注:  
> 图像默认编译后会输出到 img 目录下, 当设置 outputPathCDN 后，输出的本地图像地址为 outputPathCDN + img/图像.png  
> CND 文件地址为 publicPath + img/图像.png，所以当使用脚本上传到 CDN 时，路径要带上 img  

## 用户自定义图像处理方式
```js
// webpack.config.js 配置
const webpackConfig = {
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: MpxWebpackPlugin.urlLoader({
        name: 'img/[name][hash].[ext]',
        // CDN 地址
        publicPath: 'http://a.com/',
        limit: '1024' // Base64 的最大长度，超过则走 CDN,
        fallback: 'file-loader' // 默认走 file-loader
      })
    }]
  }
}
```
::: tip @mpxjs/cli 3.x 版本配置如下
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      urlLoader: {
        name: 'img/[name][hash].[ext]',
        // CDN 地址
        publicPath: 'http://a.com/',
        limit: '1024' // Base64 的最大长度，超过则走 CDN,
        fallback: 'file-loader' // 默认走 file-loader
      }
    }
  }
})
```
:::
```css
/*不走 Base64 的情况下*/
<style>
  .logo2 {
    background-image: url('~images/logo.png?fallback=true');
  }
</style>
```
