# 渐进接入

可参考此demo：[mpx渐进接入demo](https://github.com/didi/mpx/tree/master/examples/mpx-progressive)

mpx并不一定要求用户一定要一次性用上框架的所有东西。

若是 **已有项目** 期望接入mpx，**`不需要对原有代码做全局重写`**。

可以保持原有代码不变，新的组件、页面期望使用mpx的某些特性才引入mpx。

甚至我们允许用户用mpx框架编写新的页面/组件再局部导出相应的页面/组件反用到现有的小程序项目中。见[导出原生](#导出原生)一节。（当然还是建议大家优先考虑老项目渐进改为mpx，而不是这种反过来的模式）

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

## 导出原生

通过导出原生能力，你可以将一个mpx项目融回到原生项目中。有两种做法：一是局部导出部分页面/组件，二是完整导出一个mpx项目。

### 导出部分页面/组件

使用mpx开发的页面/组件也可以局部导出为纯粹的普通的原生小程序页面/组件，整合到已有的原生小程序中。

仅需修改webpack config中entry一项，将app改为对应的页面/组件即可。

请参考下面的例子，`注意resolve时候最后的query不可以省略，一定要按正确的类型声明这是一个组件or页面。`

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
    'pages/dindex': resolveSrc('./pages/index.mpx?page'),
    'components/dlist': resolveSrc('./components/list.mpx?component')
  }
})
```

拷贝dist里所有文件到原生微信小程序项目根目录即可正常工作。

### 完整导出

我们也可以使用mpx完成一整个项目的开发，这个项目可能包含多个页面，这些页面将合作完成某一项完整的功能，一般可能是公共需求，比如登录/用户中心等公共模块。

如果接入方也是Mpx框架开发的项目，那么皆大欢喜，会非常easy。但若对方是原生开发的，这时我们就希望能将整个项目完整导出成原生，并让接入方顺利使用。

其实观察下mpx项目的打包结构，结构是非常简单的，页面/组件都很规矩地放在对应文件夹里的，所以删掉app.json/app.js/app.wxss/project.config.json几个文件后直接整个拷贝即可。

所以完整导出整个项目的做法可以是这样：

1. 确认页面路径不要冲突，一般这种公共模块项目，路径上就不要占据`/pages/index/index`，页面路径Mpx是不会修改的，所以定一个`/pages/{模块名}/{页面名}`就好。

2. app.*的内容都要删掉的，所以全局样式都应该写在独立的文件中（wxss），全局配置有什么特殊的要告知接入方（json），因为App.js会被舍弃，所以入口js要抽出来(js)。

3. 如果有要导出的入口文件，需要给output增加配置：
```js
// webpack.conf
module.exports = {
  entry: {
    app: resolveSrc('app.mpx'),
    index: resolveSrc('index.js') // 导出的入口文件，若没有可不写
  },
  output: {
    libraryTarget: 'commonjs2',
    libraryExport: 'default' // 若export default导出需要写这个,module.exports可省略
  },
  // ... 略
}
```

4. 整个复制进接入方的项目里，然后就可以正常使用了！
