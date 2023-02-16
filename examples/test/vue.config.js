const webxJsWebpackPlugin = require('@didi/webx-js-webpack-plugin')

const path = require('path')

function resolve (dir) {
  return path.join(__dirname, '.', dir)
}
console.log('-----------', process.env.NODE_ENV)
module.exports = {
  pluginOptions: {
    mpx: {
      srcMode: 'wx',
      plugin: {
        defs: {
          // 供 @didi/mpx-ui 使用，因为 @didi/mpx-login 依赖的这个组件库，这个组件库的使用需要提供这样一个全局变量
          __application_name__: 'wyc'
        }
      },
      loader: {}
    }
  },
  crossorigin: process.env.NODE_ENV !== 'production' ? undefined : 'anonymous',
  productionSourceMap: process.env.NODE_ENV !== 'production',
  chainWebpack: (config) => {
    if (process.env.MPX_CLI_MODE !== 'web' ) {
      config.resolve.alias.set('vue-exposure', resolve('src/empty-alias.js')).set('vue$', resolve('src/empty-alias.js'))
    }
  },
  configureWebpack: {
    resolve: {
      symlinks: false,
      alias: {
        '@didi/mpx': '@mpxjs/core',
        '@didi/enhance-url-loader': '@mpxjs/url-loader',
        '@': resolve('src'),
        src: resolve('src'),
        components: resolve('src/components'),
        pages: resolve('src/pages'),
        common: resolve('src/common'),
        api: resolve('src/api'),
        store: resolve('src/store')
      }
    },
    plugins: [
      process.env.MPX_CLI_MODE === 'web' 
        ? new webxJsWebpackPlugin({
          mode: 'web',
        })
        : new webxJsWebpackPlugin({
          mode: 'mini',
        })
    ]
  }
}
