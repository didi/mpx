# `mpx-url-loader`

> solve url in mpx

受限于小程序既有的能力，目前在小程序中加载本地图片资源会有诸多限制：
- `<style>`中的css属性值只能使用base64引用图片，无法用本地路径
- `<template>`中的`<cover-image>`组件的src属性只能通过本地路径，不能使用base64
- `<template>`中的其他组件，例如`<image>`的src属性既可以用本地路径，又可以用base64

`@mpxjs/url-loader`对这些限制提供了增强。开发者在源码中无需书写base64，通过统一的路径方式引入图片资源，最终编译成小程序支持的代码。


> 想深入的了解`@mpxjs/url-loader`对小程序对图片资源的支持，查看[mpx图像资源处理](/understanding/resource.md)了解更多细节

**安装**
```bash
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
