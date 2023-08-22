const parseRequest = require('../utils/parse-request')
const config = require('../config')
const { unRecursiveTemplate } = require('./wx-template')
const normalize = require('../utils/normalize')
const selector = normalize.lib('selector')
const loaderUtils = require('loader-utils')
const addQuery = require('../utils/add-query')
const resolveMpxCustomElementPath = require('../utils/resolve-mpx-custom-element-path')
const { BLOCK_TEMPLATE, BLOCK_STYLES, BLOCK_JSON } = require('../utils/const')

// 获取分包名，动态注入 template / style / json 配置
module.exports = function (rawContent) {
  this.cacheable(false)
  const mpx = this.getMpx()
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const mode = mpx.mode
  const type = queryObj.type
  const moduleId = queryObj.moduleId
  const currentPackageRoot = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const componentsMap = mpx.componentsMap[currentPackageRoot]
  const typeExtMap = config[mode].typeExtMap
  const file = componentsMap[resourcePath] + typeExtMap[type]

  if (!mpx) {
    return rawContent
  }

  let content = ''
  if (type === BLOCK_TEMPLATE) {
    content = '<template is="tmpl_0_container" wx:if="{{r && r.nodeType}}" data="{{ i: r }}"></template>\n' + unRecursiveTemplate.buildTemplate(mpx.runtimeInfo[currentPackageRoot])
  } else if (type === BLOCK_STYLES) {
    content = mpx.getPackageInjectedWxss(currentPackageRoot)
  } else if (type === BLOCK_JSON) {
    const jsonBlock = {
      component: true,
      usingComponents: {
        // 一期暂时不支持自定义组件
        // ...mpx.getPackageInjectedComponentsMap(currentPackageRoot),
        element: resolveMpxCustomElementPath(currentPackageRoot)
      }
    }
    content = JSON.stringify(jsonBlock, null, 2)
  }

  this.emitFile(file, '', undefined, {
    skipEmit: true,
    extractedInfo: {
      content,
      index: 0
    }
  })

  if (type === BLOCK_JSON && mpx.moduleTemplate[moduleId]) {
    const templateQuery = {
      type: BLOCK_TEMPLATE,
      mpx: true,
      mpxCustomElement: true,
      packageRoot: currentPackageRoot
    }
    const request = loaderUtils.stringifyRequest(this, `${this.resourcePath}.wxml!=!${selector}!${addQuery(resourcePath, { ...queryObj, ...templateQuery })}`)
    return `require(${request})`
  } else {
    return ''
  }
}
