# mpx-cli v2 迁移到 v3

## 升级`@mpxjs/cli`

```
npm install @mpxjs/cli@3.x -g
```

## 配置迁移

> v3 兼容了 v2 的所有配置，如果没有特殊修改，则不需要进行配置迁移。

- `config/devServer.js`迁移到`vue.config.js`下的`devServer`
- `config/mpxPlugin.conf.js`迁移到`vue.config.js`下的`pluginOptions.mpx.plugin`
- `config/mpxLoader.conf.js`迁移到`vue.config.js`下的`pluginOptions.mpx.loader`

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      srcMode: 'wx',
      plugin: {
        // 这里等同于`@mpxjs/webpack-plugin`的参数
      },
      loader: {
        // 这里等同于`mpx-loader`参数
      }
    }
  },
  devServer: {
    // dev服务配置
  }
})
```

## 新增自定义配置/修改已有配置参数

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  chainWebpack(config) {
    config.plugin('newPlugin').use(newPlugin, [params])
    // 使用mpx inspect 可以根据注释来查看插件命名
    config.plugin('mpx-webpack-plugin').tap(args => newArgs)
  },
  // 或者也可以通过configureWebpack配置,这里返回的配置会通过webpack-merge合并到内部配置中
  configureWebpack() {
    return {
      plugins: [new Plugin()]
    }
  }
})
```

- [webpack-chain](https://github.com/neutrinojs/webpack-chain)
- [webpack-merge](https://github.com/survivejs/webpack-merge)

## 编译后钩子

由于 webpack 配置都内置到了插件里，所以编译后的钩子无法像 2.x 一样直接在`webpack`脚本里添加。

这里有两个方案来解决上述问题

1. `webpack`插件
2. 新建一个`mpx-cli`插件

例如我们新建一个`vue-cli-plugin-mpx-build-upload`插件,用来在构建完成后上传图片到`cdn`。

```js
// index.js
module.exports = function (api, options) {
  function runServiceCommand(api, command, ...args){
    const { fn } = api.service.commands[command]
    return fn && fn(...args)
  }
  // 注册一个新的命令
  api.registerCommand('build:upload', function deploy(...args) {
    // 运行原有的build命令，build会返回一个promise来表示构建完成
    return runServiceCommand(api, 'build', ...args).then(() =>
      // do something
      uploadFile()
    )
  })
}
```

然后在我们的项目里安装该插件并运行`npx mpx-cli-service build:upload`即可。

## 项目结构变化

![项目结构变化](https://gift-static.hongyibo.com.cn/static/kfpub/3547/filetree.jpg)

v3 版本相对于 v2 版本的目录结构更加清晰。

- 移除了`config/build`的配置目录，将其统一到了插件配置当中，可以通过`vue.config.js`修改。
- `index.html`移动到`public`目录下。
- 增加`jsconfig.json`,让类型提示更加友好。

## More

v3 版本相对于 v2 版本的整体架构相差较大，v3 版本主要基于`vue-cli`架构，主要有以下优势。

### 1. 插件化

v3 版本的配置依靠插件化，将 v2 版本的文件配置整合到了各个自定义插件中。

- vue-cli-plugin-mpx-eslint eslint 配置
- vue-cli-plugin-mpx-mp 小程序构建配置以及命令
- vue-cli-plugin-mpx-plugin-mode 插件配置
- vue-cli-plugin-mpx-typescript ts 配置
- vue-cli-plugin-mpx-web web 构建配置以及命令

除此之外，也可以使用统一的`vue.config.js`来自定义配置，或者将配置抽离到插件当中，来进行统一的管理。

### 2. 模板

v3 版本的模板也可以通过插件进行自定义生成，同时不依赖于 github，在国内网络下不会有生成模板时网络错误的问题。

### 3. 调试

v3 版本可以通过`mpx inspect:mp/web`来直接调试相关配置，可以更直观的发现配置错误。

### 4. 插件管理

使用`mpx invoke`/`mpx add`/`mpx upgrade`来管理插件，可以更细粒度的控制相关配置的更新。
