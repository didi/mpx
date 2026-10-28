'use strict'

const path = require('path')

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@mpxjs/core': path.resolve(__dirname, 'iteration-8/runtime-core')
      }
    }
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
