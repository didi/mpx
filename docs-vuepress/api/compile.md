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

### mode

### srcMode

### modeRules

### externalClasses

### resolveMode

### projectRoot

### writeMode

### autoScopeRules

### forceDisableInject

### forceDisableProxyCtor

### transMpxRules

### autoSplit

### defs

### attributes

### externals

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

### decodeHTMLText

### nativeOptions

### i18n

### auditResource

### generateBuildMap

## MpxWebpackPlugin static methods

MpxWebpackPlugin通过静态方法暴露了以下五个内置loader，详情如下：

### MpxWebpackPlugin.loader

### MpxWebpackPlugin.pluginLoader

### MpxWebpackPlugin.wxsPreLoader

用于加载 `wxs` 等资源文件 （注: 该loader的实现是 wxs-pre-loader.js 文件，看了源码，还是不能深入理解）

```js
const webpackConf = {
  module: {
    rules: [
      {
        test: /\.(wxs|sjs|filter\.js)$/,
        loader: MpxWebpackPlugin.wxsPreLoader(),
        enforce: 'pre'
      }
    ]
  }
}
```

### MpxWebpackPlugin.urlLoader

### MpxWebpackPlugin.fileLoader

## Request query

Mpx中允许用户在request中传递特定query执行特定逻辑，目前已支持的query如下：

### ?resolve

### ?packageName

### ?root

### ?fallback

### ?async
