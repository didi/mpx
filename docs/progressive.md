# 渐进接入

可参考此demo：[mpx渐进接入demo](https://github.com/didi/mpx/tree/master/examples/mpx-progressive)

mpx并不一定要求用户一定要一次性用上框架的所有东西。

若是 **已有项目** 期望接入mpx，**`不需要对原有代码做全局重写`**。

可以保持原有代码不变，新的组件、页面期望使用mpx的某些特性才引入mpx。

甚至我们允许用户用mpx框架编写新的页面/组件再局部导出相应的页面/组件反用到现有的小程序项目中。见[局部导出](#局部导出)一节。（当然还是建议大家优先考虑老项目渐进改为mpx，而不是这种反过来的模式）

## 原生自定义组件支持

有些时候，我们需要在`mpx`工程中使用原生小程序组件:

- 通过`npm`引用安装第三包
- 将第三方包源码拷贝到本地`src`目录下

> 注：mpx并不限制第三方包的格式。开发者可以自己参考小程序官方的[开发第三方自定义组件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/trdparty.html)

### 原理

根据`unsingComponents`中设定的路径，`mpx`会去查找包的入口js文件。然后提取入口文件所在的**目录**中的`js` `json` `wxss` `wxml`进行编译

编译带来的好处是，常规的拷贝操作，会造成组件内部的依赖缺失，以及冗余代码被打包。而执行了编译，使得`mpx`可以精确的收集依赖，这表现在：

- `js`文件中的依赖也会被打包，没有被加载的依赖库不会打包，减小体积
- `json`文件的`usingComponents`会被解析，因此原生组件内部可以再引用其他原生组件，甚至是mpx组件
- `wxss`中引用外部样式
- `wxml`中的图片资源会被打包

> 例如使用第三方组件库时，很多组件可能并未使用，如果按照组件库官方给出的使用方式，其实会将整个组件库放进你的项目。  
而采用mpx这种方式则只会引入你使用了的组件，所以如果你喜欢vant的按钮，iview的输入框，ColorUI的布局，欢迎尝试mpx。  
（本段内容具有时效性，未来微信可能会有优化，毕竟一开始微信连npm都不支持）

### 例子 

**文件目录**
  ```
  node_modules
  |-- npm-a-wx-component // npm安装
  |   --package.json
  |   --src
  |     --index.js
  |     --index.json
  |     --index.wxss
  |     --index.wxml
  |-- npm-b-wx-component // npm安装
  |   --package.json
  |   --src
  |     --index.js
  |     --index.json
  |     --index.wxss
  |     --index.wxml
  component
  │-- container.mpx 
  │-- com-a.mpx 
  |-- src-wx-component // 手动拷贝
  |  --index.js
  |  --index.json
  |  --index.wxss
  |  --index.wxml

  ```

**container.mpx**
```html
<template>
  <view>
    <!-- mpx组件 -->
    <com-a></com-a>
    <!-- npm安装的原生组件 -->
    <npm-a-wx-component></npm-a-wx-component>
    <!-- 手动拷贝到工程的原生组件 -->
    <src-wx-component></src-wx-component>
  </view>
</template>

<script type="application/json">
  "usingComponents": {
    "com-a": "./com-a",
    "npm-a-wx-component": "npm-a-wx-component",
    "src-wx-component": "./src-wx-component"
  }
</script>
```

**node_modules/npm-a-wx-component/src/index.wxml**
```html
<template>
  <view>
    <view>this is a native component</view>
    <!-- 原生组件内部使用原生组件 -->
    <npm-b-wx-component></npm-b-wx-component>
  </view>
</template>
```

**node_modules/npm-a-wx-component/src/index.json**
```json
{
  "usingComponents": {
    "npm-b-wx-component": "npm-b-wx-component"
  }
}
```

## 原生page支持

原生自定义组件的支持已经基本能保证第三方UI库和mpx的完美结合，但如果是用户存在已经开发好的小程序，在后续的迭代中发现了mpx想使用，就需要用户手工将4个文件变成mpx文件，这不够友好。

于是我们提供了对原生页面的支持，允许项目中存在原生小程序文件（wxml,js,json,wxss）和mpx文件，两者可以混合使用，通过webpack的构建将两者完美混合在一起生成最终的dist。

使用方式和组件相似。

## 局部导出

使用mpx开发的页面/组件也可以局部导出为纯粹的普通的原生小程序页面/组件，整合到已有的原生小程序中。

仅需修改webpack config中entry一项，将app改为对应的页面/组件即可

例子：

```js
// 
module.exports = merge(baseWebpackConfig, {
  name: 'main-compile',
  // entry point of our application
  entry: {
    // 此处以mpx脚手架生成的项目为例
    
    // before
    // app: resolveSrc('app.mpx')
    
    // after
    index: resolveSrc('./pages/index.mpx?page'),
    list: resolveSrc('./components/list.mpx?component')
  }
})
```
