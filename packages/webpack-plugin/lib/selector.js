const parseComponent = require('./parser')
const loaderUtils = require('loader-utils')
const parseRequest = require('./utils/parse-request')

module.exports = function (content) {
  this.cacheable()
  const mpx = this._compilation.__mpx__
  if (!mpx) {
    return content
  }
  const packageName = mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const mode = mpx.mode
  const defs = mpx.defs
  const resourcePath = parseRequest(this.resource).resourcePath
  const query = loaderUtils.getOptions(this) || {}
  const filePath = this.resourcePath
  const parts = parseComponent(content, filePath, this.sourceMap, mode, defs)
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

    if (pagesMap[resourcePath]) {
      // page
      if (!jsonObj.usingComponents) {
        jsonObj.usingComponents = {}
      }
      if (!jsonObj.component && mode === 'swan') {
        jsonObj.component = true
      }
    } else if (componentsMap[resourcePath]) {
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
