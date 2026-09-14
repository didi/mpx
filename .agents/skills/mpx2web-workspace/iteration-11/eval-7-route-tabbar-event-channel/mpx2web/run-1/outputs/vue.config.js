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
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/shop(?:\/.*)?$/, to: '/shop/index.html' }
      ]
    }
  },
  configureWebpack: {
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
  }
}
