'use strict'

const path = require('path')
const base = require('../mpx2rn-workspace/mpx.config')
const plugin = Object.assign({}, base.pluginOptions.mpx.plugin)
delete plugin.rnConfig

// Reuse the RN source-mode configuration; only the target runtime differs.
module.exports = {
  chainWebpack (config) {
    config.resolve.modules.add(path.resolve(__dirname, 'node_modules'))
  },
  pluginOptions: {
    mpx: {
      plugin,
      loader: Object.assign({}, base.pluginOptions.mpx.loader)
    }
  }
}
