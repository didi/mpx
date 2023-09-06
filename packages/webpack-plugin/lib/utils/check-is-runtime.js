const path = require('path')

const RUNTIME_EXT_REG = /\.runtime(\.mpx)?/

module.exports = function checkIsRuntimeMode (resource = '') {
  return RUNTIME_EXT_REG.test(path.basename(resource))
}
