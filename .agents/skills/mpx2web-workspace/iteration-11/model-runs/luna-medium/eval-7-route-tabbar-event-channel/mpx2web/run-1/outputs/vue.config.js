const path = require('path')

module.exports = {
  publicPath: '/shop/',
  pluginOptions: {
    mpx: {
      plugin: {
        webRouteConfig: {
          mode: 'history',
          base: '/shop/'
        },
        srcMode: 'wx'
      }
    }
  },
  configureWebpack: {
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
  }
}
