const parseComponent = require('./parser')
const loaderUtils = require('loader-utils')
const getMainCompilation = require('./utils/get-main-compilation')

module.exports = function (content) {
  this.cacheable()
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  if (!mpx) {
    return content
  }
  const mode = mpx.mode
  const defs = mpx.defs
  const query = loaderUtils.getOptions(this) || {}
  const filePath = this.resourcePath
  const parts = parseComponent(content, filePath, this.sourceMap, mode, defs)
  let part = parts[query.type] || {}
  if (Array.isArray(part)) {
    part = part[query.index]
  }
  this.callback(null, part.content, part.map)
}
