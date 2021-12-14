const path = require('path')

const RUNTIME_EXT = '.runtime.mpx'

module.exports = function checkIsRuntimeComponent (resource) {
  return path.basename(resource).includes(RUNTIME_EXT)
}
