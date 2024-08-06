const { BaseTemplate } = require('@mpxjs/template-engine/dist/baseTemplate')
const diff = require('lodash/difference')

const templateEngine = new BaseTemplate()
let componentMap

const normalizeTemplateEngineAttrs = o => {
  return o.reduce((res, b) => {
    const nodeType = b.nodeType.replace(/pure-|static-/, '') // 合并pure，static的属性
    res[nodeType] = res[nodeType] || []
    res[nodeType] = [
      ...new Set([...res[nodeType], ...Object.keys(b.attrs || {})]) // 去重
    ]
    return res
  }, {})
}

module.exports.templateEngineRenderCheck = function templateEngineRenderCheck (el, options, config) {
  if (!componentMap) {
    templateEngine.normalizeInputOptions(options.dynamicTemplateEngineOptions)
    const { normalComponents = [], baseComponents = [] } = templateEngine.buildOptions
    componentMap = {
      ...normalizeTemplateEngineAttrs(normalComponents),
      ...normalizeTemplateEngineAttrs(baseComponents)
    }
  }
  const directives = new Set([...Object.values(config.directive), 'slot'])
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
  const templateEngineNodeAttr = componentMap[el.tag]
  if (templateEngineNodeAttr) {
    const notRenderKeys = diff(attrKeys, templateEngineNodeAttr)
    if (notRenderKeys.length) {
      // 无配置元素属性，元素属性不会生效
      options.warn(
        `template engine missing config, the following attributes of ${el.tag} will not take effect: ${notRenderKeys}`
      )
    }
  } else {
    // 无配置元素，该元素不会渲染
    options.warn(
      `template engine missing config, the element ${el.tag} will not be rendered`
    )
  }
}
