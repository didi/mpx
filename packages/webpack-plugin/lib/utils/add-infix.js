const path = require('path')

module.exports = function (resourcePath, infix, extname) {
  extname = extname || path.extname(resourcePath)
  return resourcePath.substring(0, resourcePath.length - extname.length) + '.' + infix + extname
}
