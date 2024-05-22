const mpxConfig = require('../config')

function makeAttrsMap (attrKeys = []) {
  return attrKeys.reduce((preVal, curVal) => Object.assign(preVal, { [curVal]: '' }), {})
}

function setCustomEle (el, options, meta) {
  const modeConfig = mpxConfig[options.mode]
  const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  const tag = el.tag
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

  const eleAttrsMap = meta.runtimeInfo.customComponents
  if (tag && !eleAttrsMap[tag]) {
    eleAttrsMap[tag] = {}
  }
  Object.assign(eleAttrsMap[tag], makeAttrsMap(attrKeys))
}

function setBaseEle (el, options, meta) {
  const renderAttrsMap = {}
  const rawTag = el.tag

  // 属性收集
  const modeConfig = mpxConfig[options.mode]
  const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

  attrKeys.forEach(key => {
    renderAttrsMap[key] = ''
  })

  if (!meta.runtimeInfo.baseComponents[rawTag]) {
    meta.runtimeInfo.baseComponents[rawTag] = {}
  }

  Object.assign(meta.runtimeInfo.baseComponents[rawTag], renderAttrsMap)
}

module.exports = function setBaseWxml (el, options, meta) {
  const set = options.isCustomComponent ? setCustomEle : setBaseEle
  set(el, options, meta)

  // const modeConfig = mpxConfig[options.mode]
  // const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  // const tag = el.tag
  // const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
  // const componentType = options.isCustomComponent ? 'customComponents' : 'baseComponents'
  // if (!meta.rInfo[componentType][tag]) {
  //   meta.rInfo[componentType][tag] = {}
  // }
  // Object.assign(meta.rInfo[componentType][tag], makeAttrsMap(attrKeys))
}
