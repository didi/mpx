const { BaseTemplate } = require('@mpxjs/template-engine/dist/baseTemplate')
const diff = require('lodash/difference')

const templateEngine = new BaseTemplate()
let componentMap

const normalizeEventAttr = (config, attr) => {
  const eventParsed = config.event.parseEvent(attr)
  if (eventParsed) {
    return config.event.getEvent(eventParsed.eventName, eventParsed.prefix)
  }
  return attr
}

const normalizeTemplateEngineAttrs = (config, o) => {
  return o.reduce((res, b) => {
    const nodeType = b.nodeType
    const attrSet = new Set(Object.keys(b.attrs || {}))
    if (attrSet.has('class')) attrSet.add('style')
    res[nodeType] = [...attrSet].map(v => normalizeEventAttr(config, v))
    return res
  }, {})
}

const normalizeAttrsMap = (config, o) => {
  const directives = new Set([...Object.values(config.directive), 'slot'])
  return Object.keys(o)
    .filter(key => !directives.has(key))
    .map(v => normalizeEventAttr(config, v))
}

module.exports.templateEngineRenderCheck = function templateEngineRenderCheck (
  el,
  options,
  config,
  dynamicTemplateEngineOptions
) {
  if (!componentMap) {
    const baseComponents = templateEngine.normalizeInputComponentOptions(
      dynamicTemplateEngineOptions.baseComponents
    )
    const normalComponents = templateEngine.normalizeInputComponentOptions(
      dynamicTemplateEngineOptions.normalComponents
    )
    componentMap = {
      ...normalizeTemplateEngineAttrs(config, normalComponents),
      ...normalizeTemplateEngineAttrs(config, baseComponents)
    }
  }
  const attrKeys = normalizeAttrsMap(config, el.attrsMap)
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
