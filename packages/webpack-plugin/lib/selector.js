const path = require('path')
const parse = require('./parser')
const loaderUtils = require('loader-utils')
const stripExtension = require('./utils/strip-extention')

module.exports = function (content) {
  this.cacheable()
  if (!this._compilation.__mpx__) {
    return content
  }
  const pagesMap = this._compilation.__mpx__.pagesMap
  const componentsMap = this._compilation.__mpx__.componentsMap
  const mode = this._compilation.__mpx__.mode
  const resource = stripExtension(this.resource)
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

    if (pagesMap[resource]) {
      // page
      if (!jsonObj.usingComponents) {
        jsonObj.usingComponents = {}
      }
      if (!jsonObj.component && mode === 'swan') {
        jsonObj.component = true
      }
    } else if (componentsMap[resource]) {
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
