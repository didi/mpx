const {
  getOptimizedComponentInfo
} = require('@mpxjs/template-engine/dist/optimizer')
const mpxConfig = require('../config')

function makeAttrsMap (attrKeys = []) {
  return attrKeys.reduce(
    (preVal, curVal) => Object.assign(preVal, { [curVal]: '' }),
    {}
  )
}

module.exports = function setBaseWxml (el, options, meta) {
  const tag = el.tag
  // 属性收集
  const modeConfig = mpxConfig[options.mode]
  const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

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
    Object.assign(meta.runtimeInfo.baseComponents, { [tag]: makeAttrsMap(attrKeys) })
  } else {
    Object.assign(meta.runtimeInfo.customComponents, { [tag]: makeAttrsMap(attrKeys) })
  }
}
