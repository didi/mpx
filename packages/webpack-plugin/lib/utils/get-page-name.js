const path = require('path')
const hash = require('hash-sum')
module.exports = function getPageName (resourcePath, ext) {
  const baseName = path.basename(resourcePath, ext)
  return path.join('pages', baseName + hash(resourcePath), baseName)
}
