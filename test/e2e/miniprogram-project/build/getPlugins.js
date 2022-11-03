let { mpxPluginConf, dllConf, supportedModes } = require('../config/index')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const { resolve, resolveSrc, getConf } = require('./utils')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const VueLoaderPlugin = require('vue-loader').VueLoaderPlugin
const webpack = require('webpack')
const path = require('path')

module.exports = function getPlugins (options) {
  const { mode, srcMode, env, subDir, production, report, cloudFunc, needDll, needEslint } = options
  const plugins = []
  const copyIgnoreArr = supportedModes.map((item) => {
    return `**/${item}/**`
  })

  const currentMpxPluginConf = getConf(mpxPluginConf, options)

  plugins.push(new MpxWebpackPlugin(Object.assign({}, currentMpxPluginConf, {
    mode,
    srcMode
  }, env && { env })))

  const copyList = [
    {
      context: resolve(`static/${mode}`),
      from: '**/*',
      to: subDir ? '..' : '',
      noErrorOnMissing: true
    },
    {
      context: resolve('static'),
      from: '**/*',
      to: subDir ? '..' : '',
      globOptions: {
        ignore: copyIgnoreArr
      },
      noErrorOnMissing: true
    }
  ]

  if (cloudFunc) {
    copyList.push({
      context: resolve('src/functions'),
      from: '**/*',
      to: '../functions/'
    })
  }

  if (needDll) {
    const getDllManifests = require('./getDllManifests')
    const dllManifests = getDllManifests(production)
    const localDllManifests = dllManifests.filter((manifest) => {
      return manifest.mode === mode || !manifest.mode
    })

    localDllManifests.forEach((manifest) => {
      plugins.push(new webpack.DllReferencePlugin({
        context: dllConf.context,
        manifest: manifest.content
      }))
      copyList.push({
        context: path.join(dllConf.path, 'lib'),
        from: manifest.content.name,
        to: manifest.content.name
      })
    })
  }

  if (needEslint) {
    plugins.push(new ESLintPlugin({
      context: resolve(),
      exclude: [resolve('node_modules')],
      extensions: ['js', 'ts', 'mpx']
    }))
  }

  plugins.push(new CopyWebpackPlugin({
    patterns: copyList
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

  plugins.push(new webpack.ProgressPlugin())

  if (report) {
    plugins.push(new BundleAnalyzerPlugin())
  }

  return plugins
}
