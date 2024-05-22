const { getOptimizedComponentInfo } = require('@mpxjs/template-engine/dist/optimizer')
const mpxConfig = require('../config')

function makeAttrsMap (attrKeys = []) {
  return attrKeys.reduce((preVal, curVal) => Object.assign(preVal, { [curVal]: '' }), {})
}

module.exports = function setBaseWxml (el, options, meta) {
  const tag = el.tag
  // 属性收集
  const modeConfig = mpxConfig[options.mode]
  const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
  const { baseComponents, customComponents } = meta.runtimeInfo

  if (!options.isCustomComponent) {
    const optimizedInfo = getOptimizedComponentInfo(
      {
        nodeType: el.tag,
        attrs: el.attrsMap
      },
      options.mode
    )
    if (optimizedInfo) {
      el.tag = optimizedInfo.nodeType
    }
    if (!baseComponents[tag]) {
      baseComponents[tag] = {}
    }
    Object.assign(baseComponents[tag], makeAttrsMap(attrKeys))
  } else {
    if (!customComponents[tag]) {
      customComponents[tag] = {}
    }
    Object.assign(customComponents[tag], makeAttrsMap(attrKeys))
  }
}
