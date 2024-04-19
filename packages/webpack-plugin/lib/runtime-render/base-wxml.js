const mpxConfig = require('../config')
const { hasExtractAttr } = require('./utils')
const hash = require('hash-sum')

// todo 节点优化
const OPTIMIZE_NODES = ['view', 'text', 'image']
// const OPTIMIZE_NODES = []

let hashIndex = 0

function makeAttrsMap (attrKeys = []) {
  return attrKeys.reduce((preVal, curVal) => Object.assign(preVal, { [curVal]: '' }), {})
}

function setCustomEle (el, options, meta) {
  // 动态组件不需要被收集
  // if (el.dynamic) return
  const modeConfig = mpxConfig[options.mode]
  const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  // const tag = el.aliasTag || el.tag
  const tag = el.tag
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

  // const eleAttrsMap = el.dynamic ? meta.runtimeInfo.runtimeComponents : meta.runtimeInfo.normalComponents
  const eleAttrsMap = meta.runtimeInfo.customComponents
  // const eleAttrsMap = meta.runtimeInfo.normalComponents
  if (tag && !eleAttrsMap[tag]) {
    eleAttrsMap[tag] = {}
    // if (el.dynamic) {
    //   attrKeys.push('slots')
    // }
  }
  Object.assign(eleAttrsMap[tag], makeAttrsMap(attrKeys))
}

function setBaseEle (el, options, meta) {
  let aliasTag = ''
  let hasEvents = false
  let usingHashTag = false
  const renderAttrsMap = {}
  const rawTag = el.tag

  // 属性收集
  const modeConfig = mpxConfig[options.mode]
  const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

  attrKeys.forEach(key => {
    const eventObj = modeConfig.event.parseEvent(key)
    if (eventObj) { // 事件的格式化
      key = `${eventObj.prefix}:${eventObj.eventName}`
      hasEvents = true
      // 使用了特殊事件的节点，单独生成一个 hashTag
      if (['catch', 'capture-bind', 'capture-catch'].includes(eventObj.prefix)) {
        usingHashTag = true
      }
    }
    renderAttrsMap[key] = ''
  })

  // 节点类型的优化
  if (OPTIMIZE_NODES.includes(el.tag) && !hasEvents) {
    aliasTag = `static-${rawTag}`
    if (rawTag === 'view' && !hasExtractAttr(el)) {
      aliasTag = 'pure-view'
    }
  }

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
