const path = require('path')

module.exports = {
  publicPath: '/',
  pluginOptions: {
    mpx: {
      plugin: {
        webRouteConfig: {
          mode: 'hash',
          base: '/'
        },
        srcMode: 'wx'
      }
    }
  },
  configureWebpack: {
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
  }
}
