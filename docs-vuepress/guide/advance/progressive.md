# 原生渐进迁移

 Mpx 支持渐进式接入，若 **已有项目** 期望接入 Mpx，可根据项目或人力情况选择如何迁移
- 项目初始期：可以考虑一次性转为 Mpx，此时迁移成本比较低
- 项目成熟期：若人力有限，可选择逐步将原生小程序转为 Mpx，而且 **`不需要对原有代码做全局重写`**。可参考 [Mpx渐进接入demo](https://github.com/didi/mpx/tree/master/examples/mpx-progressive)。
    - 渐进式接入可以保持原有代码不变，新的页面/组件期望使用 Mpx 某些特性时才引入 Mpx。（推荐新模块引 Mpx，老模块逐步迁移 Mpx）
    - 用 Mpx 编写新的页面/组件，再局部导出对应的页面/组件，可反向应用到现有的原生小程序项目中，详细内容见[原生导出](#原生导出)一节。(建议优先考虑老项目渐进改为 Mpx，而不是反向 Mpx 输出原生小程序的模式)

## 原生接入

有些时候，我们需要在`Mpx`工程中使用原生小程序组件:

- 通过`npm`引用安装第三包
- 将第三方包源码拷贝到本地`src`目录下

> 注：Mpx并不限制第三方包的格式。开发者可以自己参考小程序官方的[开发第三方自定义组件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/trdparty.html)

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

### 原理

根据`unsingComponents`中设定的路径，`Mpx`会去查找包入口的js文件。然后提取入口文件所在的**目录**中的`js` `json` `wxss` `wxml`进行编译

编译带来的好处是，常规的拷贝操作，会造成组件内部的依赖缺失，以及冗余代码被打包。而执行了编译，使得`Mpx`可以精确的收集依赖，这表现在：

- `js`文件中的依赖也会被打包，没有被加载的依赖库不会打包，减小体积
- `json`文件的`usingComponents`会被解析，因此原生组件内部可以再引用其他原生组件，甚至是mpx组件
- `wxss`中引用外部样式
- `wxml`中的图片资源会被打包

> 例如:使用第三方组件库时，很多组件可能并未使用，如果按照官方给出的组件库使用方式，会将整个组件库放进项目。  
而采用Mpx这种方式则只会引入使用了的组件，所以如果你喜欢vant的按钮，iview的输入框，ColorUI的布局，欢迎尝试mpx。  
（本段内容具有时效性，未来微信可能会有优化，毕竟一开始微信连npm都不支持）

## 原生导出

通过导出原生能力，你可以将一个 Mpx 项目融回到原生小程序项目中。有以下两种做法
  - 一是局部导出部分页面/组件
  - 二是完整导出一个 Mpx 项目

### 导出部分页面/组件

使用 Mpx 开发的页面/组件可以局部导出为纯粹的普通的原生小程序页面/组件，导出后可整合到已有的原生小程序中。

导出步骤如下：

 1. 修改 webpack config 中 entry 配置，将 app 改为对应的页面/组件；
 
通过在路径后追加 ?isPage 来声明独立页面构建，构建产物为该页面的独立原生代码

通过在路径后追加 ?isComponent 来声明独立组件构建，构建产物为该组件的独立原生代码

具体配置可参考下面例子，**注意 resolve 时候最后的 query 不可以省略，一定要按正确的类型声明这是一个组件 or 页面。**


```js
// webpack config 文件
module.exports = merge(baseWebpackConfig, {
  name: 'main-compile',
  // entry point of our application
  entry: {
    // 此处以mpx脚手架生成的项目为例
    
    // before
    // app: resolveSrc('app.mpx')
    
    // after，这里"pages/dindex"代表将原页面导出到output目录下的pages目录，文件名改为dindex.*
    'pages/dindex': resolveSrc('./pages/index.mpx?isPage'), // ?后标识导出类型
    'components/dlist': resolveSrc('./components/list.mpx?isComponent')
  }
})
```
  2. 执行 webpack 打包命令；
  3. 拷贝打包后 dist 里所有文件到原生小程序项目根目录即可正常工作；

### 完整导出

举例：假如我们使用 Mpx 开发了一个完整的项目，这个项目可能包含多个页面，这些页面组合完成一个完整的功能。一般可能是公共需求，比如登录/用户中心等公共模块

如果其它接入方想复用这一公共模块，考虑有以下两种情形
  - 接入方也是 Mpx 框架开发的项目，直接迁移
  - 接入方是原生开发，这时我们希望能将整个项目完整导出成原生，并让接入方顺利使用

> 其实观察下 Mpx 项目的打包结构，结构是非常简单的，页面/组件都很规矩地放在对应文件夹里的，所以删掉app.json/app.js/app.wxss/project.config.json几个文件后直接整个拷贝即可。

完整导出整个项目的做法可以是这样：

1. 确认页面路径不要冲突，一般这种公共模块项目，路径上就不要占据`/pages/index/index`，页面路径 Mpx 是不会修改的，所以定一个`/pages/{模块名}/{页面名}`就好。

2. app.*的内容都要删掉的，所以全局样式都应该写在独立的 wxss 文件中，全局配置有什么特殊的要告知接入方配置在 json 文件中，因为App.js会被舍弃，所以入口js要抽出来提供给接入方引用。

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

4. 整个复制进**接入方**的项目里，注册对应的页面，然后就可以正常使用了！

