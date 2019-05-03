var path = require('path')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
var mainSubDir = ''

function resolveSrc (file) {
  return path.resolve(__dirname, '../src', mainSubDir, file || '')
}

function resolveDist (file) {
  return path.resolve(__dirname, '../dist', mainSubDir, file || '')
}

module.exports = merge(baseWebpackConfig, {
  name: 'main-compile',
  // entry point of our application
  entry: {
    app: resolveSrc('app.mpx')
  },
  output: {
    path: resolveDist()
  },
  resolve: {
    modules: [resolveSrc()]
  }
})
