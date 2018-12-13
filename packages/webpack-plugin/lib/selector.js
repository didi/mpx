const path = require('path')
const parse = require('./parser')
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  this.cacheable()
  if (!this._compilation.__mpx__) {
    return content
  }
  const pagesMap = this._compilation.__mpx__.pagesMap
  const componentsMap = this._compilation.__mpx__.componentsMap
  const query = loaderUtils.getOptions(this) || {}
  const filename = path.basename(this.resourcePath)
  const parts = parse(content, filename, this.sourceMap)
  let part = parts[query.type]
  if (Array.isArray(part)) {
    part = part[query.index]
  }
  // json自动补全
  if (query.type === 'json') {
    let jsonObj = {}
    if (part && part.content) {
      jsonObj = JSON.parse(part.content)
    }

    if (pagesMap[this.resource]) {
      // page
      if (!jsonObj.usingComponents) {
        jsonObj.usingComponents = {}
      }
    } else if (componentsMap[this.resource]) {
      // component
      if (jsonObj.component !== true) {
        jsonObj.component = true
      }
    }
    part = {
      content: JSON.stringify(jsonObj, null, 2)
    }
  }
  this.callback(null, part.content, part.map)
}
