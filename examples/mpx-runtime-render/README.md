# mpx-runtime-render

## 开发构建

```javascript
// development
npm run watch:mp // 小程序本地开发构建

// production
npm run build:mp // 小程序生产环境构建
```

## 项目配置

统一在 `vue.config.js` 文件当中管理。

```javascript
module.exports = {
  pluginOptions: {
    mpx: {
      srcMode: 'wx',
      // 传入 @mpxjs/webpack-plugin 当中的配置信息
      // 具体可参考文档：https://www.mpxjs.cn/api/compile.html#mpxwebpackplugin-options
      plugin: {},
      // 传入 @mpxjs/webpack-plugin loader 当中的配置信息
      // 具体可参考文档：https://www.mpxjs.cn/api/compile.html#mpxwebpackplugin-loader
      loader: {}
    }
  },
  // 修改 webpack 相关的配置
  // 具体可参阅 @vue/cli 文档：https://cli.vuejs.org/config/#chainwebpack
  chainWebpack: config => {
    if (process.env.MPX_CLI_MODE === 'mp') {
      // do something
    }

    if (process.env.MPX_CLI_MODE === 'web' && process.env.NODE_ENV === 'development') {
      // do something
    }
  }
}
```
