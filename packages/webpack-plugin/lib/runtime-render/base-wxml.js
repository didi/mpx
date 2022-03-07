const { wx } = require('../config')
const { hasExtractAttr } = require('./utils')
const hash = require('hash-sum')

const directives = new Set([...Object.keys(wx.directive).map(key => wx.directive[key]), 'slot'])

const OPTIMIZE_NODES = ['view', 'text', 'image']

let hashIndex = 0

function makeAttrsMap (attrKeys = []) {
  return attrKeys.reduce((preVal, curVal) => Object.assign(preVal, { [curVal]: '' }), {})
}

function setCustomEle (el, meta) {
  const tag = el.aliasTag || el.tag
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

  const eleAttrsMap = el.isRuntimeComponent ? meta.runtimeInfo.runtimeComponents : meta.runtimeInfo.normalComponents
  if (tag && !eleAttrsMap[tag]) {
    eleAttrsMap[tag] = {}
    if (el.isRuntimeComponent) {
      attrKeys.push('slots', 'mpxAttrs')
    }
  }
  Object.assign(eleAttrsMap[tag], makeAttrsMap(attrKeys))
}

function setBaseEle (el, meta) {
  let aliasTag = ''
  let hasEvents = false
  let usingHashTag = false
  const renderAttrsMap = {}
  const rawTag = el.tag

  // 属性收集
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))

  attrKeys.map(key => {
    const eventObj = wx.event.parseEvent(key)
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
    renderAttrsMap['rawTag'] = rawTag
    el.aliasTag = aliasTag
  }

  if (!meta.runtimeInfo.internalComponents[tag]) {
    meta.runtimeInfo.internalComponents[tag] = {}
  }

  Object.assign(meta.runtimeInfo.internalComponents[tag], renderAttrsMap)
}

module.exports = function setBaseWxml (el, isCustomComponent, meta) {
  const set = isCustomComponent ? setCustomEle : setBaseEle
  set(el, meta)
}
