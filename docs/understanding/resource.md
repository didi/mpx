# 图像资源处理

小程序对于图片资源存在一些限制，使得习惯开发web应用的开发者面对小程序时无法理解差异性

mpx提供了[@mpxjs/url-loader](/compilationEnhance.md/#mpxjsurl-loader)对小程序中各种资源加载方式进行处理。

本文会从使用的角度出发，介绍小程序既有的对图像资源的限制，以及`@mpxjs/url-loader`是如何解决这些问题。

----
## 引用线上资源

小程序原生支持在`wxss`和`wxml`中使用线上资源，这点和开发web应用没有太多区别。

无需任何配置，就可以直接在`.mpx`中引用线上资源。

**webpack.config.js**
```js
webpackconfig = {
  // 不需要配置
}
```

**index.mpx**
```html
<template>
  <view>
    <image src='http://my.cdn.com/bg2.png'/>
    <view class="container"></view>
  <view>
</template>
<style lang="css">
  .container: {
    background-image: url('http://my.cdn.com/bg1.png');
  }
</style>
```

----
## 引用本地资源

* 在`<style>`中使用本地资源

  小程序不支持在`.wxss`的样式中使用本地资源，因此`@mpxjs/url-loader`会对`<style>`中的图片做强制base64
  
  **webpack.config.js**
  ```js
  webpackconfig = {
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: '@mpxjs/url-loader',
          options: /* 强制转换，所以options不做限制 */
        }
      ]
    }
  }
  ```

  **index.mpx**
  ```html
  <style lang="css">
    .container: {
      background-image: url('./bg-img.png');
    }
  </style>
  ```
  > 编译后变成base64

* `<image> / <cover-image>`组件src属性使用本地资源，@mpxjs/webpack-plugin提供了urlLoader来处理本地图片资源。
  
  **webpack.config.js**
  ```js
  webpackconfig = {
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: MpxWebpackPlugin.urlLoader({
            name: 'img/[name].[ext]'
          })
        }
      ]
    }
  }
  ```

   **index.mpx**
  ```html
  <template>
    <view>
      <image src='./bg2.png'/>
    <view>
  </template>
  ```

## 动态引用本地资源
利用`@mpxjs/url-loader`，配合mpx提供的`计算属性`，实现在运行阶段动态设置图片 

**文件目录**
  ```
  component
  │-- index.mpx 
  │-- dark.png    
  │-- light.png    
  ```

**webpack.config.js**
```js
webpackconfig = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: MpxWebpackPlugin.urlLoader({
          name: 'img/[name].[ext]'
        })
      }
    ]
  }
}
```

**index.mpx**
```html
<template>
  <view>
    <image src='{{dynamicSrc}}'/>
    <view class="container" style='{{dynamicStyle}}'>i have a background image</view>
    <button bindtap="clickHandler">click me to change</button>
  </view>
</template>

<script>
  import {createPage} from '@mpxjs/core'
  // 如果是有限张图片
  import dark from './dark.png'
  import light from './light.png'

  createPage({
    data: {
      count: 0,
      imageId: '1'
    },
    computed: {
      dynamicSrc() {
        return (this.count % 2 === 0) ? dark : light
      },
      dynamicStyle() {
        let url = (this.count % 2 !== 0) ? dark : light
        return `background-image: url(${url})`
      },
      background () {
        // 如果期望整个bgs文件夹里的图片都被纳入
        return require('./bgs/' + this.imageId + '.jpg')
      }
    },
    methods: {
      clickHandler() {
        this.count++
      }
    }
  })
</script>

<style lang="stylus">
  .container
    height: 150px
  </style>
```

> 通过点击button，两个元素的图片会动态变化 
