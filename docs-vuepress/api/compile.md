---
sidebarDepth: 2
---

# 编译构建

## webpack配置

```js
// todo 分项说明配置意义
module.exports = {
  entry: {
    app: resolveSrc('app.mpx')
  },
  output: {
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
        use: MpxWebpackPlugin.loader()
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
      {
        test: /\.(wxs|qs|sjs|filter\.js)$/,
        loader: MpxWebpackPlugin.wxsPreLoader(),
        enforce: 'pre'
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
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
      mode: 'wx',
      srcMode: 'ali'
    })
  ]
}

```

## MpxWebpackPlugin options

MpxWebpackPlugin支持传入以下配置：

> 若是通过官方脚手架生成的项目，可在 `build/mpx.plugin.conf.js` 中对这些项进行配置。

### mode

### srcMode

### modeRules

- **类型**：`{ [key: string]: any }`

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

- **类型**：`{ [key: string]: any }`

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

- **类型**：`Boolean, 默认为false`

- **详细**：是否禁止在项目编译构建过程中loader处理模块时注入逻辑，以实现基于原生规范（微信小程序开发规范）的能力增强，如 refs、i18n 等。当配置 forceDisableInject 为 true 时，不会注入增强能力，相应包体积会减少一些，但是开发者需严格基于原生规范进行开发。
### forceDisableProxyCtor

- **类型**：`Boolean, 默认为false`

- **详细**：跨平台开发时，是否禁止在项目编译构建过程中从源平台代码转换为目标平台代码时对实例构造函数（App | Page | Component ）进行代理，结合 transMpxRules 特性使用。如果目标平台是微信小程序，则全局替换 wx 为 Mpx 对象，否则替换目标平台全局对象为 createFactory。由于支付宝小程序不支持 Behavior，会将 Behavior 代理到 Mpx 对象下的 Bahavior 构造函数。当配置forceDisableProxyCtor 为 true 时，不会进行代理，用户在项目开发时需要条件针对输出到不同平台进行条件判断。

### transMpxRules

- **类型**：`{ [key: string]: any }`

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

### forceUsePageCtor

### postcssInlineConfig

### transRpxRules

### decodeHTMLText

### nativeOptions

### i18n

- **类型**：`Object`

- **详细**：Mpx支持国际化，底层实现依赖类wxs能力。可配置项包括 messages | messagesPath、dateTimeFormats | dateTimeFormatsPath、numberFormats | numberFormatsPath。其中 messages 既可以通过对象字面量传入，也可以通过 messagesPath 指定一个 js 模块路径，在该模块中定义配置并导出（dateTimeFormats | dateTimeFormatsPath 和 numberFormats | numberFormatsPath同理）。提供包括 t | tc | te | d | n 等方法供调用，由于wxs执行环境的限制，页面模板中仅支持调用 t | tc | te 方法，详细介绍及使用见[工具-国际化i18n](../guide/tool/i18n.md)一节。

- **示例**：

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

MpxWebpackPlugin通过静态方法暴露了以下五个内置loader，详情如下：

### MpxWebpackPlugin.loader

### MpxWebpackPlugin.pluginLoader

### MpxWebpackPlugin.wxsPreLoader

### MpxWebpackPlugin.urlLoader

### MpxWebpackPlugin.fileLoader

## Request query

Mpx中允许用户在request中传递特定query执行特定逻辑，目前已支持的query如下：

### ?resolve

### packageName

- **类型**: `String`

- **详细**: 指定当前 Page 或 Component 中引用的某个非 JS 静态资源被打包到对应的主包或分包目录下。

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
  // packageName=main 当前资源会被打包到主包目录下
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
module.exports = {
  packages: [
    '@packageName/src/app.mpx?root=test',
  ]
}
```

### ?fallback
