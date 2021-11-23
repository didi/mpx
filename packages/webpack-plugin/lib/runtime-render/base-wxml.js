const { wx } = require('../config')
const injectComponentConfig = require('./inject-component-config')

const directives = new Set(Object.keys(wx.directive).map(key => wx.directive[key]))

module.exports = {
  // 自定义组件节点（运行）收集
  setCustomEle (el) {
    const tag = el.aliasTag || el.tag
    const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
    const collection = el.isRuntimeComponent ? injectComponentConfig.runtimeComponents : injectComponentConfig.thirdPartyComponents
    if (tag && !collection.get(tag)) {
      collection.set(tag, new Set(attrKeys))
    } else {
      const attrs = collection.get(tag)
      attrKeys.map(key => attrs.add(key))
    }
  },
  // 基础节点收集
  setBaseEle (el) {
    // 使用了一些特殊事件类型的基础节点包含 aliasTag
    const tag = el.aliasTag ? el.aliasTag : el.tag
    injectComponentConfig.includes.add(tag)

    // 基础节点属性收集
    const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
    if (tag && !injectComponentConfig.internalComponents[tag]) {
      injectComponentConfig.internalComponents[tag] = {}
      if (el.aliasTag) {
        injectComponentConfig.internalComponents[tag]['rawTag'] = el.tag
      }
    }
    attrKeys.map(key => {
      const eventObj = wx.event.parseEvent(key)
      if (eventObj) {
        key = `${eventObj.prefix}:${eventObj.eventName}`
      }
      injectComponentConfig.internalComponents[tag][key] = ''
    })
  }
}
