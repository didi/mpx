const { wx } = require('../config')
const { componentConfig } = require('./utils')

const directives = new Set(Object.keys(wx.directive).map(key => wx.directive[key]))

module.exports = {
  // 自定义组件节点（运行）收集
  setCustomEle (el) {
    const tag = el.aliasTag || el.tag
    const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
    const collection = el.isRuntimeComponent ? componentConfig.runtimeComponents : componentConfig.thirdPartyComponents
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
    componentConfig.includes.add(tag)

    // 基础节点属性收集
    const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
    if (tag && !componentConfig.internalComponents[tag]) {
      componentConfig.internalComponents[tag] = {}
      if (el.aliasTag) {
        componentConfig.internalComponents[tag]['rawTag'] = el.tag
      }
    }
    attrKeys.map(key => {
      const eventObj = wx.event.parseEvent(key)
      if (eventObj) {
        key = `${eventObj.prefix}:${eventObj.eventName}`
      }
      componentConfig.internalComponents[tag][key] = ''
    })
  }
}
