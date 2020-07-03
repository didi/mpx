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

### ?packageName

### ?root

### ?fallback

### ?async
