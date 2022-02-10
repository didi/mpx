let { mpxPluginConf, dllConf, supportedModes } = require('../config/index')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const { resolve, resolveSrc, getConf, getRootPath } = require('./utils')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const VueLoaderPlugin = require('vue-loader').VueLoaderPlugin
const webpack = require('webpack')
const path = require('path')

module.exports = function getPlugins (options) {
  const { mode, srcMode, env, subDir, production, report, needEslint } = options
  const plugins = []
  const rootPath = getRootPath(mode, env)
  const currentMpxPluginConf = getConf(mpxPluginConf, options)

  plugins.push(new MpxWebpackPlugin(Object.assign({}, currentMpxPluginConf, {
    mode,
    srcMode
  }, env && { env })))

  if (needEslint) {
    plugins.push(new ESLintPlugin({
      context: resolve(),
      exclude: [resolve('node_modules')],
      extensions: ['js', 'ts', 'mpx']
    }))
  }
  plugins.push(new CopyWebpackPlugin({
    patterns: [{
      from: resolve('project.config.json'),
      to: resolve(`dist/${rootPath}/project.config.json`)
    }]
  }))
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

  return plugins
}
