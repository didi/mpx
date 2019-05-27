const path = require('path')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')

function resolveSrc (file) {
  return path.resolve(__dirname, '../src', file || '')
}

function resolveDist (file) {
  return path.resolve(__dirname, '../dist', file || '')
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
