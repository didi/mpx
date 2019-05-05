var path = require('path')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
var mainSubDir = ''

function resolveSrc (file) {
  return path.resolve(__dirname, '../src', mainSubDir, file || '')
}

function resolveDist (file) {
  const distSrc = process.env.npm_config_ali ? '../alidist' : '../dist'
  return path.resolve(__dirname, distSrc, mainSubDir, file || '')
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
