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
Mpx 内部会对通过 script src 引入的 json 文件，在解析的时候加上 `__component` 标识，同时设置 `type` 为 `javascript/auto` 以防止走 webpack 内建的 json 解析。

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
- **类型**：`string`

- **默认值**：`'wx'`。

- **详细**：

mode 为 Mpx 编译的目标平台， 目前支持的有微信小程序(wx)\支付宝小程序(ali)\百度小程序(swan)\头条小程序(tt)\ QQ 小程序(qq)\ H5 页面(web)

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

- **详细**：Mpx会在项目编译构建过程中对运行时进行代码注入，以实现部分增强能力，包括 `refs`、`i18n` 和 `setData` 性能优化等。在不需要这些增强能力时，可配置 `forceDisableInject` 为 true，以消除编译时注入，来进一步减少包体积，但是这部分增强能力也就不再可用。

### forceDisableProxyCtor

- **类型**：`Boolean`

- **默认值**： `false`

- **详细**： 用于控制在跨平台输出时对实例构造函数（`App` | `Page` | `Component` | `Behavior`）进行代理替换以抹平平台差异。当配置 `forceDisableProxyCtor` 为 true 时，会强行取消平台差异抹平逻辑，开发时需针对输出到不同平台进行条件判断。

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

使用的时候：

```js
const env = __env__;
```

> 注意：这里定义之后使用的时候是按照全局变量来使用，而非按照`process.env.KEY`这样的形式

### attributes

- **类型**：`[key: string]`

- **默认值**：`['image:src', 'audio:src', 'video:src', 'cover-image:src', 'import:src', 'include:src']`

- **详细**：`Mpx` 提供了可以给自定义标签设置资源的功能，配置该属性后，即可在目标标签中使用 `:src` 加载相应资源文件

- **示例**：
```js
new MpxWebpackPlugin({
  attributes: ['customTag:src']
})
```
```html
<customTag :src="'https://www....../avator.png'"></customTag>
```
:::tip
该属性可通过 `MpxWebpackPlugin` 配置，也可以通过配置 `WxmlLoader`，后者优先级高。
:::

### externals

- **类型**：`Array<string>`

- **详细**：

  目前仅支持微信小程序 weui 组件库通过 useExtendedLib 扩展库的方式引入，这种方式引入的组件将不会计入代码包大小。配置 externals 选项，Mpx 将不会解析 weui 组件的路径并打包。

- **示例**：

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

- **参考**：<a href="https://developers.weixin.qq.com/miniprogram/dev/extended/weui/quickstart.html" target="_blank">weui组件库</a>

### miniNpmPackage

- **类型**：`Array<string>`

- **默认值**: `[]`

- **详细**: 微信小程序官方提供了[发布小程序 npm 包的约束](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)。
部分小程序npm包，如[vant组件库](https://vant-contrib.gitee.io/vant-weapp/#/quickstart)官方文档使用说明，引用资源并不会包含miniprogram所指定的目录
如 "@vant/weapp/button/index"，导致 `Mpx` 解析路径失败。
`Mpx`为解决这个问题，提供miniNpmPackage字段供用户配置需要解析的小程序npm包。miniNpmPackage对应的数组值为npm包对应的package.json中的name字段。
`Mpx`解析规则如下:
  1. 如package.json中有miniprogram字段，则会默认拼接miniprogram对应的值到资源路径中
  2. 如package.json中无miniprogram字段，但配置了miniNpmPackage，则默认会拼接miniprogram_dist目录


- **示例**:
```js
new MpxWebpackPlugin({
  miniNpmPackage: ['@vant/weapp']
})
```

### forceUsePageCtor

- **类型**: `Boolean`

- **默认值**: `false`

- **详细**: 在非支付宝小程序环境下，`Mpx` 会强行将 `Page` 转为 `Conponent` 处理；将该值设置为 `true` 时，`Page` 将不被转换。

- **示例**:
```js
new MpxWebpackPlugin({
  forceUsePageCtor: true
})
```

:::tip
// TODO 可以深入讲解下，为什么会被强转
:::

### postcssInlineConfig

### transRpxRules

- **类型**：`Array<Object> | Object`
  - `option.mode` 可选值有 none/only/all，分别是不启用/只对注释内容启用/只对非注释内容启用
  - `option.designWidth` 设计稿宽度，默认值就是750，可根据需要修改
  - `option.include` 同webpack的include规则
  - `option.exclude` 同webpack的exclude规则
  - `option.comment` rpx注释，建议使用 'use px'/'use rpx'，当 mode 为 all 时默认值为 use px，mode 为 only 时默认值为 'use rpx'

- **详细**：为了处理某些IDE中不支持`rpx`单位的问题，Mpx 提供了一个将 px 转换为 rpx 的功能。支持通过注释控制行级、块级的是否转换，支持局部使用，支持不同依赖分别使用不用的转换规则等灵活的能力。`transRpxRules`可以是一个对象，也可以是多个这种对象组成的数组。

- **示例**：

```js
const path = require('path')

new MpxWebpackPlugin({
  transRpxRules: [
    {
      mode: 'only', // 只对注释为'use rpx'的块儿启用转换rpx
      comment: 'use rpx', // mode为'only'时，默认值为'use rpx'
      include: path.resolve('src'),
      exclude: path.resolve('lib'),
      designWidth: 750
    },
    {
      mode: 'all', // 所有样式都启用转换rpx，除了注释为'use px'的样式不转换
      comment: 'use px', // mode为'all'时，默认值为'use px'
      include: path.resolve('node_modules/@didi/mpx-sec-guard')
    }
  ]
})
```

#### 应用场景及相应配置

接下来我们来看下一些应用场景及如何配置。如果是用脚手架生成的项目，在`mpx.plugin.conf.js`里找到`transRpxRules`，应该已经有预设的`transRpxRules`选项，按例修改即可。

三种场景分别是 [普通使用](#场景一) ， [只对某些特殊样式转换](#场景二) ， [不同路径分别配置规则](#场景三)

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
mpx的rpx注释能帮助你仅为部分类或者部分样式启用rpx转换，细节请看下方附录。

#### 场景三
使用了第三方组件，它的设计宽度和主项目不一致，期望能设置不同的转换规则

```js
const path = require('path')

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
      include: path.resolve('node_modules/iview-weapp')
    }
  ]
})

```

> 注意事项：转换规则是不可以对一个文件做多次转换的，会出错，所以一旦被一个规则命中后就不会再次命中另一个规则，include 和 exclude 的编写需要注意先后顺序，就比如上面这个配置，如果第一个规则 include 的是 '/' 即整个项目，iview-weapp 里的样式就无法命中第二条规则了。

#### transRpxRules附录

- **designWidth**

设计稿宽度，单位为`px`。默认值为`750px`。

`mpx`会基于小程序标准的屏幕宽度`baseWidth 750rpx`，与`option.designWidth`计算出一个转换比例`transRatio`。

转换比例的计算方式为`transRatio = (baseWidth / designWidth)`，精度为小数点后2位四舍五入。

所有生效的`rpx注释样式`中的px会乘上`transRatio`得出最终的 rpx 值。

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

- **comment: rpx 注释样式**

根据`rpx注释`的位置，`mpx`会将`一段css规则`或者`一条css声明`视为`rpx注释样式`。

开发者可以声明一段 rpx 注释样式，提示编译器是否转换这段 css 中的 px。

例如：
```html
<style lang="css">
  /* use rpx */
  .not-translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .not-translate-b {
    /* use rpx */
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

> `transRpx = only`模式下，只有两部分`rpx注释样式`会转rpx。

- **类型**： `{options? : PostcssOptions, plugins? : PostcssPlugin[], ignoreConfigFile : Boolean}`

- **详细**：使用类似于 postcss.config.js 的语法书写 postcss 的配置文件。用于定义 Mpx 对于组件/页面样式进行 postcss 处理时的配置， ignoreConfigFile 传递为 true 时会忽略项目中的 postcss 配置文件 。

- **示例**：

```js
new MpxWebpackPlugin {
  postcssInlineConfig: {
    plugins: {
      // 'postcss-import': {},
      // 'postcss-preset-env': {},
      // 'cssnano': {},
      // 'autoprefixer': {}
    }
  }
}
```

### decodeHTMLText

- **类型**：`boolean`

- **默认**：`false`

- **详细**：

设置为 true 时在模板编译时对模板中的 text 内容进行 decode

### nativeOptions

- **类型**：`object`

- **详细**：为原生多文件写法添加css预处理语言支持，用于优先搜索预编译器后缀的文件，按声明顺序查找。默认按照 css , less , stylus ,  scss , sass 的顺序

- **例子**

```js
  nativeOptions: {
    cssLangs: ['css', 'less', 'stylus', 'scss', 'sass']
  }
```


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

- **详细**：Mpx 支持国际化，底层实现依赖类`wxs`能力，通过指定语言标识和语言包，可实现多语言之间的动态切换。可配置项包括locale、messages、messagesPath。

#### i18n.locale   `String`

通过配置 locale 属性，可指定语言标识，默认值为 'zh-CN'

#### i18n.messages   `Object`

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

#### i18n.messagesPath   `String`

为便于开发，Mpx 还支持配置语言包资源路径 messagesPath 来代替 messages 属性，Mpx 会从该路径下的 js 文件导出语言包对象。如果同时配置 messages 和 messagesPath 属性，Mpx 会优先设定 messages 为 i18n 语言包资源。

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

### subpackageModulesRules

- **类型**：`Object`

- **详细**：是否将多分包共用的模块分别输出到各自分包中，匹配规则为include匹配到且未被exclude匹配到的资源

- **背景**：依据微信小程序的分包策略，多个分包使用到的 js 模块会打入主包当中，但在大型分包较多的项目中，该策略极易将大量的模块打入主包，从而使主包体积大小超出2M限制，该配置项提供给开发者自主抉择，可将部分模块冗余输出至多个分包，从而控制主包体积不超限

- **示例**：

```js
new MpxWebpackPlugin({
  subpackageModulesRules: {
    include: ['@someNpm/name/src/api/*.js'],
    exclude: ['@someNpm/name/src/api/module.js']
  }
})
```
> tips: 该功能是将模块分别放入多个分包，模块状态不可复用，使用前要依据模块功能做好评估，例如全局store就不适用该功能

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

### autoVirtualHostRules

- **类型**：[`Rules`](#rules)
- **详细**：批量配置是否虚拟化组件节点，对应微信中[`VirtualHost`](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html) 。默认不开启，开启后也将抹平支付宝小程序中的表现差异。提供 include 和 exclude 以精确控制对哪些文件开启VirtualHost，哪些不开启。和webpack的rules规则相同。
- **背景**：默认情况下，自定义组件本身的那个节点是一个“普通”的节点，使用时可以在这个节点上设置 `class` 、`style` 、动画、 flex 布局等，就如同普通的 view 组件节点一样。但有些时候，自定义组件并不希望这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定。这种情况下，可以将这个自定义组件设置为“虚拟的”。
- **示例**：

```js
new MpxWebpackPlugin({
  autoVirtualHostRules: {
    include: [resolve('../src')],
    exclude: [resolve('../components/other')] 
  }
})
```
## 

## MpxWebpackPlugin static methods

`MpxWebpackPlugin` 通过静态方法暴露了以下五个内置 loader，详情如下：

### MpxWebpackPlugin.loader

`MpxWebpackPlugin` 所提供的最主要 loader，用于处理 `.mpx` 文件，根据不同的[模式(mode)](/api/compile.html#mode)将 `.mpx` 文件输出为不同的结果。

> \* 在微信环境下 `todo.mpx` 被loader处理后的文件为：`todo.wxml`、`todo.wxss`、`todo.js`、`todo.json`

**webpack.conf.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader(options)
      }
    ]
  }
};
```

#### Options

##### Options.transRpx `{Array<Object> | Object}`

用于统一转换 px 或者 rpx 单位，默认值为`{}`，详见 [transRpxRules](/api/compile.html#transrpxrules)

:::warning
`transRpx` 即将在`v2.6.0`版本中**移除**，请在统一配置文件 `build/mpx.plugin.conf.js` 中使用 `transRpxRules` 属性进行配置。
:::

##### Options.loaders `{Object}`

可用于对某些资源文件的默认 loader 做覆盖或新增处理，以下例子演示了对 [less-loader](https://webpack.docschina.org/loaders/less-loader/) 做额外配置。

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader({
          loaders: { // loaders选项
            less: [ // 针对less做loader配置
              'css-loader',
              {
                loader: 'less-loader',
                options: { // 为less-loader添加额外配置
                  lessOptions: {
                    strictMath: true
                  }
                }
              }
            ]
          }
        })
      }
    ]
  }
};
```

##### Options.templateOption `{Object}`

针对使用其他模板引擎(如 [pug](https://www.pugjs.cn/api/getting-started.html))来编写 template 的情景下，可通过 `options.templateOption` 来传入引擎渲染时的额外参数。等同于：

```js
const pug = require('pug')

const template = `view(class='gray') 这是一段pug模板`

pug.render(template, options.templateOption)
```

##### Options.excludedPreLoaders `{RegExp}`

在构建过程中忽略特定 `pre-loader` 对文件的处理，仅支持正则表达式，默认值为 `/eslint-loader/`。

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

加载并解析 `wxs` 脚本文件，并针对不同平台，做了差异化处理；同时可支持处理内联`wxs`。

- **用法**：

```js
  module.exports = {
    module: {
      rules: [
        {
            test: /\.(wxs|qs|sjs|filter\.js)$/,
            loader: MpxWebpackPlugin.wxsPreLoader(),
            enforce: 'pre'
          }
      ]
    }
  }
```

### MpxWebpackPlugin.fileLoader

提供图像资源的处理，生成对应图像文件，输出到输出目录并返回 public URL。如果是分包资源，则会输出到相应的分包资源文件目录中。

- **用法**：

```js
  module.exports = {
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          loader: MpxWebpackPlugin.fileLoader({
            name: 'img/[name][hash].[ext]'
          })
        }
      ]
    }
  }
```

- **选项**：

  - `name` : 自定义输出文件名模板

### MpxWebpackPlugin.urlLoader

微信小程序对于图像资源存在一些限制，`MpxWebpackPlugin.urlLoader` 针对这些差异做了相关处理，开发者可以使用web应用开发的方式进行图像资源的引入，`MpxWebpackPlugin.urlLoader` 可根据图像资源的不同引入方式，支持 CDN 或者 Base64 的方式进行处理。更多细节请查阅[图像资源处理](../guide/advance/image-process.md)。

- **用法**:

```js
  module.exports = {
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          loader: MpxWebpackPlugin.urlLoader({
            name: 'img/[name][hash].[ext]',
            limit: 2048,
          })
        }
      ]
    }
  }
```

- **选项**:

  - `name` :  自定义输出文件名模板
  - `mimetype` : 指定文件的 MIME 类型
  - `limit` : 对内联文件作为数据 URL 的字节数限制
  - `publicPath` : 自定义 public 目录
  - `fallback` : 文件字节数大于限制时，为文件指定加载程序

## json增强
### 自定义 page 路径
- **背景**: 用户在进行分包或主包的 pages 配置时，如果引用的页面不存在于当前 app.mpx 所在的上下文中，例如存在于 npm 包中，为避免和本地声明的其他 page 路径冲突，Mpx 会对路径进行 hash 化处理。这样一来，用户就无法使用之前定义的路径；此外部分用户也希望可以对引入的页面路径进行自定义。

- **详细**: 在 json 中配置 pages 时，数组中支持放入 Object，对象中传入两个字段，src 字段表示页面地址，path 字段表示自定义页面路径

- **示例**:
```js
{
  // 主包中的声明
  "pages": [
    {
      "src": "@someGroup/someNpmPackage/pages/view/index.mpx",
      "path": "pages/somNpmPackage/index" // 注意保持 path 的唯一性
    }
  ],
  // 分包中的声明
  "subPackages": [
    {
      "root": "test",
      "pages": [
         {
           "src": "@someGroup/someNpmPackage/pages/view/test.mpx",
           "path": "pages/somNpmPackage/test" // 注意保持 path 的唯一性
         }
      ]
    }
  ]
}

// 使用
// 可以直接使用你自己声明的 path
mpx.navigateTo({
  url: '/pages/somNpmPackage/index'
})

mpx.navigateTo({
  url: '/test/pages/somNpmPackage/test'
})
```

## Request query

Mpx中允许用户在request中传递特定query执行特定逻辑，目前已支持的query如下：

### ?resolve

- **详细**: 

  获取资源最终被输出的正确路径。

- **背景**:

  Mpx 在处理页面路径时会把对应的分包名作为 root 加在路径前。处理组件路径时会添加 hash，防止路径名冲突。直接写资源相对路径可能与最终输出的资源路径不符。

  编写代码时使用 import 引入页面地址后加上 `?resolve`，这个地址在编译时会被处理成正确的绝对路径，即资源的最终输出位置。

- **示例**:

  ``` javascript
  import subPackageIndexPage from '../subpackage/pages/index.mpx?resolve'

  mpx.navigateTo({
    url: subPackageIndexPage
  })
  ```
### ?packageName

- **详细**：

  指定当前 Page 或 Component 中引用的某个非 JS 静态资源被打包到对应的主包或分包目录下。分包之间不能相互引用对方包中的资源（比如图片和 js 脚本等），分包可以引用主包和自己包内的资源。

- **示例**：

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

- **详细**：指定分包别名，Mpx 项目在编译构建后会输出该别名的分包，外部小程序或 H5 页面跳转时，可直接配置该分包别名下的资源路径。

- **示例**：

```js
// 可在项目app.mpx中进行配置
module.exports = {
  packages: [
    '@packagePath/src/app.mpx?root=test',
  ]
}

// 使用
wx.navigateTo({url : '/test/homepage/index'})

```

### ?fallback

- **类型**：`String`

- **详细**：对于使用`MpxWebpackPlugin.urlLoader`的文件，如果在引用资源的末尾加上`?fallback=true`，则使用配置的自定义loader。图片的引入和处理详见[图像资源处理](../guide/advance/image-process.html)。

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
