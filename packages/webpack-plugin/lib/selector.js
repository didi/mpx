const parseComponent = require('./parser')
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  this.cacheable()
  const mpx = this._compilation.__mpx__
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
