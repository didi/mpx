const path = require('path')

const RUNTIME_EXT = '.runtime.mpx'

module.exports = function checkIsRuntimeMode (resource) {
  return path.basename(resource).includes(RUNTIME_EXT)
}
