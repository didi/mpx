const { wx } = require('../config')
const injectComponentConfig = require('./inject-component-config')
const hasExtractAttrs = require('./has-extract-attrs')
const hash = require('hash-sum')

const directives = new Set(Object.keys(wx.directive).map(key => wx.directive[key]))

const SPECIAL_NODES = ['view', 'text', 'image']

let hashIndex = 0

function setCustomEle (el) {
  const tag = el.aliasTag || el.tag
  const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
  const collection = el.isRuntimeComponent ? injectComponentConfig.runtimeComponents : injectComponentConfig.thirdPartyComponents
  if (tag && !collection.get(tag)) {
    collection.set(tag, new Set([...attrKeys, ...['slots', 'mpxAttrs']]))
  } else {
    const attrs = collection.get(tag)
    attrKeys.map(key => attrs.add(key))
  }
}

function setBaseEle (el) {
  // injectComponentConfig.includes.add(tag)
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
      // 使用了特殊事件的节点
      if (['catch', 'capture-bind', 'capture-catch'].includes(eventObj.prefix)) {
        usingHashTag = true
      }
    }
    renderAttrsMap[key] = ''
  })

  // 节点类型的优化
  if (SPECIAL_NODES.includes(el.tag) && !hasEvents) {
    aliasTag = `static-${rawTag}`
    if (rawTag === 'view' && !hasExtractAttrs(el)) {
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

  if (tag && !injectComponentConfig.internalComponents[tag]) {
    injectComponentConfig.internalComponents[tag] = {}
  }

  Object.assign(injectComponentConfig.internalComponents[tag], renderAttrsMap)
}

module.exports = function setBaseWxml (el, isCustomComponent) {
  const set = isCustomComponent ? setCustomEle : setBaseEle
  set(el)
}
