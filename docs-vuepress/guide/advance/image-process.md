# 图像资源处理

## 图像资源引入有三种方式
1. Template中通过image src指定图像资源
    - 直接指定图像的远程资源地址    
    - 资源为本地路径，若配置 publicPath，则 publicPath 与 webpack loader 中配置的 name 进行拼接
2. Style中通过 src 指定图像资源
3. Style中通过 class 指定图像资源

  Wxss文件中只能用 cdn 地址或 base64, 针对第二、三种方式引入的资源，可以通过配置决定使用 cdn 还是 base64，且mpx中图像资源处理会优先检查base64，具体配置参数如下：
* publicPath：资源存放 cdn 地址，可选
* limit: 资源大小限制，可根据资源的大小判断走base64还是cdn， 可选

## base64图像资源
图像转base64的两种方式:
* 未配置 publicPath
* 配置了 publicPath，且用户未自定义图像处理 fallback query，且未配置 limit 或图像资源未超过 limit 的限制时
```js
// webpack.config.js配置,未配置publicPath必走base64
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
```css
<style>
  .logo {
    background-image: url('~images/logo.png');
  }
</style>
```
## cdn图像资源
```js
// webpack.config.js配置
const webpackConfig = {
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: MpxWebpackPlugin.urlLoader({
        name: 'img/[name][hash].[ext]',
        // cdn地址
        publicPath: 'http://a.com/',
        limit: '1024' // base64的最大长度，超过则走cdn, 
      })
    }]
  }
}
```

## 用户自定义图像处理方式
```js
// webpack.config.js配置
const webpackConfig = {
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: MpxWebpackPlugin.urlLoader({
        name: 'img/[name][hash].[ext]',
        // cdn地址
        publicPath: 'http://a.com/',
        limit: '1024' // base64的最大长度，超过则走cdn,
        fallback: 'file-loader' // 默认走file-loader
      })
    }]
  }
}
```
```css
/*不走base64的情况下*/
<style>
  .logo2 {
    background-image: url('~images/logo.png?fallback=true');
  }
</style>
```