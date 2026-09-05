'use strict'

const path = require('path')

module.exports = {
  chainWebpack (config) {
    config.resolve.alias
      .set(
        '@business/campaign-tracker-web',
        path.resolve(__dirname, 'compile-fixtures/campaign-tracker-web.js')
      )
      .set(
        '@business/product-exposure-web',
        path.resolve(__dirname, 'compile-fixtures/product-exposure-web.js')
      )
  },
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx'
      },
      loader: {}
    }
  }
}
