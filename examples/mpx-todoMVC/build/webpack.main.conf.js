var path = require('path')
var merge = require('webpack-merge')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var baseWebpackConfig = require('./webpack.base.conf')
var mainSubDir = ''

function resolveSrc (file) {
  return path.resolve(__dirname, '../src', mainSubDir, file || '')
}

function resolveDist (file) {
  return path.resolve(__dirname, '../dist', mainSubDir, file || '')
}

module.exports = merge(baseWebpackConfig, {
  // entry point of our application
  entry: {
    app: resolveSrc('app.mpx')
  },
  output: {
    path: resolveDist()
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static/project.config.json'),
        to: path.resolve(__dirname, '../dist/project.config.json')
      }
    ])
  ],
  resolve: {
    modules: [resolveSrc()]
  }
})