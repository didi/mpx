---
sidebarDepth: 2
---

# 编译构建

## webpack配置
下图是采用 Mpx 开发小程序时，一个简短的 webpack 配置。配置说明可参考图中注释以及子项说明。
```js
module.exports = {
  entry: {
    app: resolveSrc('app.mpx')
  },
  output: {
    // 和 webpack 配置一致,编译后文件输出的路径
    path: resolveDist(),
    publicPath: '/',
    filename: '[name].js'
  },
  node: {
    global: true
  },
  module: {
    rules: [
      {
        test: /\.mpx$/,
        // 以 .mpx 结尾的文件需要使用 Mpx 提供的 loader 进行解析，处理 .mpx 文件包含的template，script, style, json等各个部分
        use: MpxWebpackPlugin.loader({
          // 自定义 loaders
          loaders: {
            scss: [
              {loader: 'css-loader'},
              {loader: 'sass-loader', options: {sassOptions: {outputStyle: 'nested'}}}
            ]
          }
        })
      },
      {
        test: /\.js$/,
        // js 文件走正常的 babel 解析
        loader: 'babel-loader',
        // include 和 exclude 定义哪些 .js 文件走 babel 编译，哪些不走 babel 编译，配置include、exclude 可以提高查找效率
        include: [resolve('src'), resolve('test'), resolve('node_modules/@mpxjs')],
        exclude: [resolve('node_modules/**/src/third_party/')]
      },
      {
        // 适用于<script type="application/json" src="../common.json">，Mpx内部会添加上__component，设置 type 以防止走 webpack 内建的 json 解析
        // webpack json解析，抽取内容的占位内容必须为合法 json，否则会在 parse 阶段报错
        test: /\.json$/,
        resourceQuery: /__component/,
        type: 'javascript/auto'
      },
      {
        // 各小程序平台自有脚本的差异抹平
        test: /\.(wxs|qs|sjs|filter\.js)$/,
        loader: MpxWebpackPlugin.wxsPreLoader(),
        enforce: 'pre'
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        // Mpx 提供图像资源处理，支持 CDN 和 Base64 两种
        loader: MpxWebpackPlugin.urlLoader({
          name: 'img/[name][hash].[ext]'
        })
      }
    ]
  },
  mode: 'production',
  resolve: {
    extensions: ['.mpx', '.js']
  },
  plugins: [
    new MpxWebpackPlugin({
      mode: 'wx', // 可选值 wx/ali/swan/qq/tt/web
      srcMode: 'ali' // 暂时只支持微信为源mode做跨平台，为其他时mode必须和srcMode一致
    })
  ]
}
```
- 下面是对 webpack 自带的配置，在 Mpx 中特殊配置的具体说明。
### output.publicPath

由于 Mpx 内部框架实现的原因(如分包路径)，publicPath 必须设置为'/'，默认为'/'。
如是图像或文件需要设置 publicPath，可配置在 loader options 中。

### output.filename

小程序限定[描述页面的文件具有相同的路径和文件名](https://developers.weixin.qq.com/miniprogram/dev/framework/structure.html)，仅以后缀名进行区分。

因此 output.filename 中必须写为 [name].js，基于 chunk id 或者 hash name 的 filename 都会导致编译后的文件无法被小程序识别。

### node.global
在 Node 环境中 global 标识全局对象，Mpx 中需要依赖 global 进行运行时注入。

### rule.resourceQuery
Mpx 内部会对通过 script src 引入的 json 文件，在解析的时候加上 __component 标识，同时设置 type 以防止走 webpack 内建的 json 解析。

因为 webpack json 解析时，抽取内容的占位内容必须为合法 json，否则会在 parse 阶段报错

### resolve.extensions
当通过 require, import 引 入不带后缀的文件时，webpack 将自动带上后缀后去尝试访问文件是否存在。



## 类型定义

为了便于对编译配置的数据类型进行准确地描述，我们在这里对一些常用的配置类型进行定义

### Rules
```ts
type Condition = string | ((resourcePath: string) => boolean) | RegExp

interface Rules {
  include?: Condition | Array<Condition>
  exclude?: Condition | Array<Condition>
}
```

## MpxWebpackPlugin options

MpxWebpackPlugin支持传入以下配置：

> 若是通过官方脚手架生成的项目，可在 `build/mpx.plugin.conf.js` 中对这些项进行配置。

### mode

### srcMode

- **类型**：`'wx'`

- **默认值**：默认和 [mode](#mode) 一致。

- **详细**：当 srcMode 和 mode 不一致时，会读取相应的配置对项目进行编译和运行时的转换。

- **示例**：

```js
// 微信转支付宝
new MpxWebpackPlugin({
  // 指定目标平台，可选值有 wx、ali、swan、qq、tt、web
  mode: 'ali',
  // 指定源码平台，默认值同目标平台一致 
  srcMode: 'wx' 
})
```

::: warning
暂时只支持微信为源 mode 做跨平台，为其他时，mode 必须和 srcMode 保持一致。
:::

### modeRules

- **类型**：`{ [key: string]: Rules }`

- **详细**：

批量指定文件mode，用于条件编译场景下使用某些单小程序平台的库时批量标记这些文件的mode为对应平台，而不再走转换规则。

- **示例**：

```js
new MpxWebpackPlugin({
  modeRules: {
    ali: {
      include: [resolve('node_modules/vant-aliapp')]
    }
  }
})
```

### externalClasses

- **类型**：`Array<string>`

- **详细**：定义若干个外部样式类，这些将会覆盖元素原有的样式。

- **示例**：

```js
new MpxWebpackPlugin({
  externalClasses: ['custom-class', 'i-class']
})
```

::: warning
抹平支付宝和微信之间的差异，微信转支付宝时可以使用该功能。
:::

### resolveMode

- **类型**：`'webpack' | 'native'`

- **默认值**：`webpack`

- **详细**：

指定resolveMode，默认webpack，更便于引入npm包中的页面/组件等资源。若想编写时和原生保持一致或兼容已有原生项目，可设为native，此时需要提供[projectRoot](#projectroot)以指定项目根目录，且使用npm资源时需在前面加`~`。

- **示例**：

```js
new MpxWebpackPlugin({
  resolveMode: 'webpack'
})
```

### projectRoot

- **类型**：`string`

- **详细**：当resolveMode为native时需通过该字段指定项目根目录。

- **示例**：

```js
new MpxWebpackPlugin({
  resolveMode: 'native',
  projectRoot: path.resolve(__dirname, '../src')
})
```

### writeMode

- **类型**：`'full' | 'change'`

- **默认值**： `'change'`

- **详细**：webpack 的输出默认是全量输出，而小程序开发者工具不关心文件是否真正发生了变化。设置为 change 时，Mpx 在 watch 模式下将内部 diff 一次，只会对内容发生变化的文件进行写入，以提升小程序开发者工具编译性能。

- **示例**：

```js
new MpxWebpackPlugin({
  writeMode: 'change'
})
```

### autoScopeRules

- **类型**：[`Rules`](#rules)

- **详细**：是否需要对样式加 scope ，目前只有支付宝小程序平台没有样式隔离，因此该部分内容也只对支付宝小程序平台生效。提供 include 和 exclude 以精确控制对哪些文件进行样式隔离，哪些不隔离，和webpack的rules规则相同。也可以通过在 style 代码块上声明 scoped 进行。

- **示例**：

```js
new MpxWebpackPlugin({
  autoScopeRules: {
    include: [resolve('../src')],
    exclude: [resolve('../node_modules/vant-aliapp')] // 比如一些组件库本来就是为支付宝小程序编写的，应该已经考虑过样式隔离，就不需要再添加
  }
})
```

### forceDisableInject

- **类型**：`Boolean`

- **默认值**： `false`

- **详细**：Mpx会在项目编译构建过程中对运行时进行代码注入，以实现部分增强能力，包括 refs、i18n 和 setData 性能优化等。在不需要这些增强能力时，可配置 forceDisableInject 为 true，以消除编译时注入，来进一步减少包体积，但是这部分增强能力也就不再可用。

### forceDisableProxyCtor

- **类型**：`Boolean`

- **默认值**： `false`

- **详细**： 用于控制在跨平台输出时对实例构造函数（App | Page | Component | Behavior）进行代理替换以抹平平台差异。当配置 forceDisableProxyCtor 为 true 时，会强行取消平台差异抹平逻辑，开发时需针对输出到不同平台进行条件判断。

### transMpxRules

- **类型**：`Rules`

- **详细**：是否转换 wx / my 等全局对象为 Mpx 对象，

- **示例**：

```js
new MpxWebpackPlugin({
  transMpxRules: {
      include: () => true,
      exclude: ['@mpxjs']
    },
})
```

### autoSplit

- **类型**：`boolean`

- **默认值**：Web平台为 false, 其它平台为 true

- **详细**：autoSplit 设置为 true 时，如果配置了 optimization，将采用 optimization 配置的 splitChunks 实现代码分离合并打包优化。设置为 false 将不走代码打包优化。

- **示例**：
```js
// webpack配置
{
  optimization: {
    runtimeChunk: {
      // 将复用的模块抽取到一个外部的bundle中
      name: 'bundle'
    },
    splitChunks: {
      cacheGroups: {
        main: {
          name: 'bundle',
          minChunks: 2,
          chunks: 'initial'
        }
      }
    }
  },
  plugins: [
    new MpxWebpackPlugin(Object.assign({
      mode: 'wx',
      srcMode:'wx',
      autoSpit: true
    })
  ]
}
```

### defs

- **类型**：`{ [key: string]: string }`

- **详细**：给模板、js、json中定义一些全局常量。一般用于区分平台/环境。

- **示例**：

```js
new MpxWebpackPlugin({
  defs: {
      __env__: 'mini'
    }
})
```

### attributes

### externals

- **类型**: `Array<string>`

- **详细**:

externals 目前仅支持微信小程序。

微信小程序的 weui 组件库 通过 useExtendedLib 扩展库的方式引入，这种方式引入的组件将不会计入代码包大小。配置 externals 选项，Mpx 将不会解析 weui 组件的路径并打包。

- **示例**:

在 Mpx 项目中使用 useExtendedLib 扩展库的方式如下：

``` javascript
// Mpx 配置文件中添加如下配置：
{
  externals: ['weui']
}
```

``` html
<script name="json">
  // app.mpx json部分
  module.exports = {
    "useExtendedLib": {
      "weui": true
    }
  }
</script>
```

``` html
<!-- 在 page 中使用 weui 组件 -->
<template>
  <view wx:if="{{__mpx_mode__ === 'wx'}}">
    <mp-icon icon="play" color="black" size="{{25}}" bindtap="showDialog"></mp-icon>
    <mp-dialog title="test" show="{{dialogShow}}" bindbuttontap="tapDialogButton" buttons="{{buttons}}">
      <view>test content</view>
    </mp-dialog>
  </view>
</template>

<script>
  import{ createPage } from '@mpxjs/core'

  createPage({
    data: {
      dialogShow: false,
      showOneButtonDialog: false,
      buttons: [{text: '取消'}, {text: '确定'}],
    },
    methods: {
      tapDialogButton () {
        this.dialogShow = false
        this.showOneButtonDialog = false
      },
      showDialog () {
        this.dialogShow = true
      }
    }
  })
</script>

<script name="json">
  const wxComponents = {
    "mp-icon": "weui-miniprogram/icon/icon",
    "mp-dialog": "weui-miniprogram/dialog/dialog"
  }
  module.exports = {
    "usingComponents": __mpx_mode__ === 'wx'
      ? Object.assign({}, wxComponents)
      : {}
  }
</script>
```

- **参考** [weui组件库](https://developers.weixin.qq.com/miniprogram/dev/extended/weui/quickstart.html)

### forceUsePageCtor

- **类型**: `Boolean`

- **默认值**: `false`

- **详情**: 一般小程序分为三层，`App`、`Page`、`Component`，`app` 用来描述整个应用，`page` 用来描述各个页面，`component` 用来描述各个组件。 但是支付宝小程序没有 `Component` 这一层，所以 `Mpx` 在框架层面抹平了这一差异；同时把 `Component` 强行转为 `Page` 的接口暴露出来，供开发者自由使用

- **示例**:
```
// TODO 用法演示

```


### postcssInlineConfig

### transRpxRules

- **类型**：`Array<object>`

- **详细**：为了处理某些IDE中不支持`rpx`单位的问题，`Mpx`提供了一个将px转换为rpx的功能。支持通过注释控制行级、块级的是否转换，支持局部使用，支持不同依赖分别使用不用的转换规则等灵活的能力。

- **示例**：

```js
new MpxWebpackPlugin({
  transRpxRules: [
    {
      mode: 'only', // 可选值有none/only/all，分别是不启用，只对注释内容启用，只对非注释内容启用
      comment: 'use rpx', // rpx注释，建议使用 'use px' / 'use rpx'，当mode为all时默认值为use px，mode为only时默认值为use rpx
      include: resolve('src'), // 同webpack的include规则
      exclude: resolve('lib'), // 同webpack的exclude规则
      designWidth: 750 // 设计稿宽度，默认值就是750，可根据需要修改
    },
    {
      mode: 'all',
      comment: 'use px',
      include: resolve('node_modules/@didi/mpx-sec-guard')
    }
  ]
})
```

#### 应用场景及相应配置

接下来我们来看下一些应用场景及如何配置。如果是用脚手架生成的项目，在`mpx.plugin.conf.js`里找到`transRpxRules`，应该已经有预设的`transRpxRules`选项，按例修改即可。

三种场景分别是 [普通使用，因设计稿是px的二倍/三倍图](#场景一) ， [只对某些特殊样式转换](#场景二) ， [不同路径分别配置规则](#场景三)

#### 场景一
设计师给的稿是2倍图，分辨率750px。或者更高倍图。

```js
new MpxWebpackPlugin({
  transRpxRules: [{
    mode: 'all',
    designWidth: 750 // 如果是其他倍，修改此值为设计稿的宽度即可
  }]
})
```

#### 场景二

大部分样式都用px下，某些元素期望用rpx。或者反过来。

```js
new MpxWebpackPlugin({
  transRpxRules: [{
    mode: 'only',
    comment: 'use rpx',
    designWidth: 750 // 设计稿宽度
  }]
})
```
mpx的rpx注释能帮助你仅为部分类或者部分样式启用rpx转换，细节请看下面附录。

#### 场景三
使用了第三方组件，它的设计宽度和主项目不一致，期望能设置不同的转换规则

```js
new MpxWebpackPlugin({
  transRpxRules: [
    {
      mode: 'only',
      designWidth: 750,
      comment: 'use rpx',
      include: resolve('src')
    },
    {
      mode: 'all',
      designWidth: 1280, // 对iview单独使用一个不同的designWidth
      include: resolve('node_modules/iview-weapp')
    }
  ]
})

```

> 注意事项：转换规则是不可以对一个文件做多次转换的，会出错，所以一旦被一个规则命中后就不会再次命中另一个规则，include和exclude的编写需要注意先后顺序，就比如上面这个配置，如果第一个规则include的是'/'即整个项目，iview-weapp里的样式就无法命中第二条规则了。

#### transRpxRules附录

- **designWidth**

设计稿宽度，单位为`px`。默认值为`750px`。

`mpx`会基于小程序标准的屏幕宽度`baseWidth 750rpx`，与`option.designWidth`计算出一个转换比例`transRatio`

转换比例的计算方式为`transRatio = (baseWidth / designWidth)`。精度为小数点后2位四舍五入

所有生效的`rpx注释样式`中的px会乘上`transRatio`得出最终的rpx值

例如：

```css
/* 转换前：designWidth = 1280 */
.btn {
  width: 200px;
  height: 100px;
}

/* 转换后: transRatio = 0.59 */
.btn {
  width: 118rpx;
  height: 59rpx;
}
```
---

- **comment: rpx注释样式**

根据`rpx注释`的位置，`mpx`会将`一段css规则`或者`一条css声明`视为`rpx注释样式`

开发者可以声明一段rpx注释样式，提示编译器是否转换这段css中的px

例如：
```html
<style lang="css">
  /* use px */
  .not-translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .not-translate-b {
    /* use px */
    font-size: 100px;
    padding: 10px;
  }
  .translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .translate-b {
    font-size: 100px;
    padding: 10px;
  }
</style>
```
> 第一个注释位于一个`选择器`前，是一个`css规则注释`，整个规则都会被视为`rpx注释样式`

> 第二个注释位于一个`css声明`前，是一个`css声明注释`，只有`font-size: 100px`会被视为`rpx注释样式`

> `transRpx = all`模式下，除了这两条rpx注释样式之外，其他都会转rpx


### decodeHTMLText

### nativeOptions

### i18n

```js
new MpxWebpackPlugin({
  i18n: {
    locale: 'en-US',
    messages: {
      'en-US': {
        message: {
          hello: '{msg} world'
        }
      },
      'zh-CN': {
        message: {
          hello: '{msg} 世界'
        }
      }
    },
    // messagesPath: path.resolve(__dirname, '../src/i18n.js')
  }
})
```

- **详细**：Mpx 支持国际化，底层实现依赖类wxs能力，通过指定语言标识和语言包，可实现多语言之间的动态切换。可配置项包括locale、messages、messagesPath。

#### i18n.locale

`String`

通过配置 locale 属性，可指定语言标识，默认值为 'zh-CN'

#### i18n.messages

`Object`

通过配置 messages 属性，可以指定项目语言包，Mpx 会依据语言包对象定义进行转换，示例如下：
```js
messages: {
  'en-US': {
    message: {
      'title': 'DiDi Chuxing',
      'subTitle': 'Make travel better'
    }
  },
  'zh-CN': {
    message: {
      'title': '滴滴出行',
      'subTitle': '让出行更美好'
    }
  }
}
```

#### i18n.messagesPath

`String`

为便于开发，Mpx 还支持配置语言包资源路径 messagesPath 来代替 messages 属性，Mpx 会从该路径下的 js 文件导出语言包对象。如果同时配置 messages 和 messagesPath 属性，优先取 messages 定义的语言包。

详细介绍及使用见[工具-国际化i18n](../guide/tool/i18n.md)一节。

### auditResource

- **类型**：`true | false | 'component'`

- **详细**：检查资源输出情况，如果置为true，则会提示有哪些资源被同时输出到了多个分包，可以检查是否应该放进主包以消减体积，设置为 `'component'` 的话，则只检查组件资源是否被输出到多个分包。

- **示例**：

```js
new MpxWebpackPlugin({
  auditResource: true
})
```

### generateBuildMap

- **类型**：`boolean`

- **详细**：是否生成构建结果与源码之间的映射文件。用于单元测试等场景。

- **示例**：

```js
new MpxWebpackPlugin({
  generateBuildMap: true
})
```

- **参考**：[单元测试](../guide/tool/unit-test.md)

## MpxWebpackPlugin static methods

MpxWebpackPlugin 通过静态方法暴露了以下五个内置 loader，详情如下：

### MpxWebpackPlugin.loader

MpxWebpackPlugin 所提供的最主要 loader，用于处理 `.mpx` 文件，根据不同的[模式(mode)](/api/compile.html#mode)将 `.mpx` 文件输出为不同的结果。

**webpack.conf.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader()
      }
    ]
  }
};
```

:::warning
旧版 loader 配置属性 `transRpx` **即将移除**，请在统一配置文件 `build/mpx.plugin.conf.js` 中使用 `transRpxRules` 属性进行配置。
:::

### MpxWebpackPlugin.pluginLoader

:::tip
该 loader 仅在开发**小程序插件**时使用，可在使用 Mpx 脚手架进行项目初始化时选择进行组件开发来生成对应的配置文件。
:::

`MpxWebpackPlugin.pluginLoader` 用于根据开发者编写的`plugin.json`文件内容，将特定的小程序组件、页面以及 js 文件进行构建，最终以小程序插件的形式输出。

**webpack.plugin.conf.js**

```js
module.exports = {
  module: {
    rules: [
      {
        resource: path.resolve('src/plugin/plugin.json'), // 小程序插件的plugin.json的绝对路径
        use: MpxWebpackPlugin.pluginLoader()
      }
    ]
  }
};
```

更多细节请查阅 [小程序插件开发](https://developers.weixin.qq.com/miniprogram/dev/framework/plugin/development.html)

### MpxWebpackPlugin.wxsPreLoader

### MpxWebpackPlugin.fileLoader

- **参数**:

  - `{ Object } options`

- **用法**:

  提供图像资源的处理，生成对应图像文件，输出到输出目录并返回 public URL。具体用法如下：
  ```js
    module.exports = {
      // 其它配置
      ...
      module: {
        rules: [
          test: /\.(png|jpe?g|gif|svg)$/,
          loader: MpxWebpackPlugin.fileLoader({
            name: 'img/[name][hash].[ext]'
          })
        ]
      },
      // 其它配置
      ...
    }
  ```

### MpxWebpackPlugin.urlLoader

- **参数**:

  - `{ Object } options`

- **用法**:

  功能同 [fileLoader](#mpxwebpackplugin-fileloader) 方法，支持 `CDN` 和 `Base64` 两种URL加载方式，具体用法如下所示：
  ```js
    module.exports = {
      // 其它配置
      ...
      module: {
        rules: [
          {
            test: /\.(png|jpe?g|gif|svg)$/,
            loader: MpxWebpackPlugin.urlLoader({
              name: 'img/[name][hash].[ext]',
              limit: 2048
            })
          }
        ]
      },
      // 其它配置
      ...
    }
  ```

## Request query

Mpx中允许用户在request中传递特定query执行特定逻辑，目前已支持的query如下：

### ?resolve

- **类型**: `String`

- **详细**: 在使用 import 引入包的时候在末尾加上 `?resolve`，编译时会被处理成正确的、完整的绝对路径。

- **示例**:

``` javascript
import subPackageIndexPage from '../subpackage/pages/index.mpx?resolve'
```

### packageName

- **类型**: `String`

- **详细**: 指定当前 Page 或 Component 中引用的某个非 JS 静态资源被打包到对应的主包或分包目录下。分包之间不能相互引用对方包中的资源（比如图片和 js 脚本等），分包可以引用主包和自己包内的资源。

- **示例**:

``` javascript
// 入口 app.mpx 的 json 配置部分
module.exports = {
  "pages": [
    "./pages/index",
    "./pages/list?root=list&name=listName"
  ],
  "packages": [
    "./packageA/packageA.mpx?root=packageA",
    "./packageB/packageB.mpx?root=packageB&name=packageSecond"
  ]
}
```

``` html
<!-- packageA/cat.mpx -->
<template>
  <view>
    <view>hello packageA cat.mpx</view>
    <image src="{{catAvatar}}"></image>
  </view>
</template>

<script>
  import{ createPage } from '@mpxjs/core'
  // 没有配置 packageName，默认打包到当前模块所在的分包目录下
  import catAvatar from 'static/images/cat.jpg'

  createPage({
    data: {
      catAvatar
    },
    onLoad () {}
  })
</script>
```

``` html
<!-- packageB/dog.mpx -->
<template>
  <view>
    <view>hello packageB dog.mpx</view>
    <image src="{{dogAvatar}}"></image>
  </view>
</template>

<script>
  import{ createPage } from '@mpxjs/core'
  // 指定 packageName=main 即使当前模块在分包 packageB 下，资源也会被打包到主包目录下
  // 当前分包是 packageB，所以不能指定 resourceName 为 packageA 或其他分包
  import dogAvatar from 'static/images/dog.jpg?packageName=main'

  createPage({
    data: {
      dogAvatar
    },
    onLoad () {}
  })
</script>
```

### ?root

- **类型**：`String`

- **详细**：指定分包别名，Mpx项目在编译构建后会输出该别名的分包，项目中可直接引用该分包路径进行开发。

- **示例**：

```js
// 可在项目app.mpx中进行配置
module.exports = {
  packages: [
    '@packageName/src/app.mpx?root=test',
  ]
}
```

### ?fallback

- **类型**：`String`

- **详细**：对于使用`MpxWebpackPlugin.urlLoader`的文件，如果配置`fallback=true`，则使用配置的自定义loader。

- **示例**：

```js
// webpack.config.js配置
const webpackConfig = {
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: MpxWebpackPlugin.urlLoader({
        name: 'img/[name][hash].[ext]',
        publicPath: 'http://a.com/',
        fallback: 'file-loader' // 自定义fallback为true时使用的loader
      })
    }]
  }
}
```
```css
/* png资源引入 */
<style>
  .logo2 {
    background-image: url('~images/logo.png?fallback=true'); /* 设置fallback=true，则使用如上方所配置的file-loader */
  }
</style>
```