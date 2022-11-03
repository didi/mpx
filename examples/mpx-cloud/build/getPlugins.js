let { mpxPluginConf } = require('../config/index')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const { resolve, resolveSrc, getConf, getRootPath } = require('./utils')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const webpack = require('webpack')

module.exports = function getPlugins (options) {
  const { mode, srcMode, env, subDir, production, needEslint } = options
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
    }, {
      from: resolve('functions'),
      to: resolve(`dist/${rootPath}/functions`)
    }]
  }))
  plugins.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: production ? '"production"' : '"development"'
    }
  }))

  return plugins
}
