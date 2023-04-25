const path = require('path')

function resolvePackages (subPath) {
  return path.resolve(__dirname, 'packages', subPath)
}

module.exports = {
  resolve: {
    alias: {
      '@mpxjs/utils': resolvePackages('utils'),
      '@mpxjs/store': resolvePackages('store')
    }
  }
}
