const path = require('path')

module.exports = {
  publicPath: '/shop/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx'
      }
    }
  },
  configureWebpack: {
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
  },
  devServer: {
    historyApiFallback: {
      index: '/shop/'
    }
  }
}
