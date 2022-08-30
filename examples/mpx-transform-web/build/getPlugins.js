let { mpxPluginConf } = require('../config/index')
const MpxWebpackPlugin = require('@mpxjs/web-plugin/webpack').default
const { resolveSrc, getConf } = require('./utils')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const VueLoaderPlugin = require('vue-loader').VueLoaderPlugin
const webpack = require('webpack')
module.exports = function getPlugins (options) {
  const { mode, srcMode, env, subDir, production, report } = options
  const plugins = []
  const currentMpxPluginConf = getConf(mpxPluginConf, options)

  plugins.push(new MpxWebpackPlugin(Object.assign({}, currentMpxPluginConf, {
    mode,
    srcMode,
    // webConfig: {
    //   routeMode: 'history'
    // },
    externalClasses: ['list-class'],
  }, env && { env })))

  plugins.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: production ? '"production"' : '"development"'
    }
  }))

  if (mode === 'web') {
    plugins.push(new VueLoaderPlugin())
    plugins.push(new HtmlWebpackPlugin({
      filename: 'index.html',
      template: resolveSrc('index.html', subDir),
      inject: true
    }))
  }

  plugins.push(new webpack.ProgressPlugin())

  if (report) {
    plugins.push(new BundleAnalyzerPlugin())
  }

  return plugins
}
