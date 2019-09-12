const path = require('path')
const parse = require('./parser')
const loaderUtils = require('loader-utils')
const getResourcePath = require('./utils/get-resource-path')

module.exports = function (content) {
  this.cacheable()
  const mpx = this._compilation.__mpx__
  if (!mpx) {
    return content
  }
  const packageName = mpx.processingSubPackageRoot || 'main'
  const pagesMap = mpx.pagesMap[packageName]
  const componentsMap = mpx.componentsMap[packageName]
  const mode = mpx.mode
  const resourcePath = getResourcePath(this.resource)
  const query = loaderUtils.getOptions(this) || {}
  const filePath = this.resourcePath
  const parts = parse(content, filePath, this.sourceMap, mode)
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
