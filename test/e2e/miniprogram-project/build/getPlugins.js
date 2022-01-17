let { mpxPluginConf, dllConf, supportedModes } = require('../config/index')
const { resolve, resolveSrc } = require('./utils')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const VueLoaderPlugin = require('vue-loader').VueLoaderPlugin
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const webpack = require('webpack')
const path = require('path')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')


module.exports = function getPlugins (options) {
  const { mode, env, srcMode, subDir, production, report } = options
  const plugins = []
  const copyIgnoreArr = supportedModes.map((item) => {
    return `**/${item}/**`
  })

  let currentMpxPluginConf
  if (typeof mpxPluginConf === 'function') {
    currentMpxPluginConf = mpxPluginConf(options)
  } else {
    currentMpxPluginConf = mpxPluginConf
  }
  plugins.push(new MpxWebpackPlugin(Object.assign({}, currentMpxPluginConf, {
    mode,
    srcMode
  }, env && { env })))

  const copyList = [
    {
      context: resolve(`static/${mode}`),
      from: '**/*',
      to: subDir ? '..' : ''
    },
    {
      context: resolve(`static`),
      from: '**/*',
      to: subDir ? '..' : '',
      globOptions: {
        ignore: copyIgnoreArr
      }
    }
  ]

  if (options.cloudFunc) {
    copyList.push({
      context: resolve(`src/functions`),
      from: '**/*',
      to: '../functions/'
    })
  }

  if (options.needDll) {
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
  plugins.push(new CopyWebpackPlugin(copyList))

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

  plugins.push(new ProgressBarPlugin())

  if (report) {
    plugins.push(new BundleAnalyzerPlugin())
  }

  return plugins
}
