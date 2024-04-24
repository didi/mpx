const { getOptimizedComponentInfo } = require('@mpxjs/template-engine/dist/optimizer')
const mpxConfig = require('../config')
const hash = require('hash-sum')

// todo 节点优化
// const OPTIMIZE_NODES = []

let hashIndex = 0

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
  let aliasTag = ''
  let usingHashTag = false
  const renderAttrsMap = {}
  const rawTag = el.tag

  // 属性收集
  const modeConfig = mpxConfig[options.mode]
  const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

  // todo: 这部分的逻辑应该收到 template-engine?
  attrKeys.forEach(key => {
    const eventObj = modeConfig.event.parseEvent(key)
    if (eventObj) { // 事件的格式化
      key = `${eventObj.prefix}:${eventObj.eventName}`
      // 使用了特殊事件的节点，单独生成一个 hashTag
      if (['catch', 'capture-bind', 'capture-catch'].includes(eventObj.prefix)) {
        usingHashTag = true
      }
    }
    renderAttrsMap[key] = ''
  })

  const { nodeType } = getOptimizedComponentInfo({
    nodeType: el.tag,
    attrs: el.attrsMap
  })

  aliasTag = nodeType === el.tag ? undefined : nodeType

  if (usingHashTag) {
    aliasTag = 'd' + hash(`${rawTag}${++hashIndex}`)
  }

  const tag = aliasTag || rawTag

  if (aliasTag) {
    renderAttrsMap.rawTag = rawTag
    el.aliasTag = aliasTag
  }

  if (!meta.runtimeInfo.baseComponents[tag]) {
    meta.runtimeInfo.baseComponents[tag] = {}
  }

  Object.assign(meta.runtimeInfo.baseComponents[tag], renderAttrsMap)
}

module.exports = function setBaseWxml (el, options, meta) {
  const set = options.isCustomComponent ? setCustomEle : setBaseEle
  set(el, options, meta)
}
