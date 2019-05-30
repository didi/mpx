const path = require('path')
const merge = require('webpack-merge')
const mainWebpackConfig = require('./webpack.main.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const mainSubDir = ''

function resolveSrc (file) {
  return path.resolve(__dirname, '../src', mainSubDir, file || '')
}

const distPath = process.env.npm_config_wx ? '../dist/wx' : '../dist'

function resolveDist (file) {
  return path.resolve(__dirname, distPath, mainSubDir, file || '')
}

const configOutputPath = process.env.npm_config_wx ? '../dist/wx/project.config.json' : '../dist/project.config.json'

module.exports = merge(mainWebpackConfig, {
  name: 'wx-compile',
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
        from: path.resolve(__dirname, '../project.config.json'),
        to: path.resolve(__dirname, configOutputPath)
      }
    ])
  ],
  resolve: {
    modules: [resolveSrc()]
  }
})
