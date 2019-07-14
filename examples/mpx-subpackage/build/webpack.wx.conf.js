const path = require('path')
const merge = require('webpack-merge')
const mainWebpackConfig = require('./webpack.main.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const configOutputPath = process.env.npm_config_wx ? '../dist/wx/project.config.json' : '../dist/project.config.json'

module.exports = merge(mainWebpackConfig, {
  name: 'wechat-compiler',
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../project.config.json'),
        to: path.resolve(__dirname, configOutputPath)
      }
    ])
  ]
})
