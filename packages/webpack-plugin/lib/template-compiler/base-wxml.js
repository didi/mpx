const { wx } = require('../config')

const baseWxmlMap = {}

const directives = new Set(Object.keys(wx.directive).map(key => wx.directive[key]))

module.exports = {
  set (el) {
    const tag = el.tag
    const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
    if (tag && !baseWxmlMap[tag]) {
      baseWxmlMap[tag] = {
        attrKeys: new Set(attrKeys)
      }
    } else {
      attrKeys.map(key => baseWxmlMap[tag].attrKeys.add(key))
    }
  },
  get () {
    return baseWxmlMap
  },
  generate () {
    let res = ''
    Object.keys(baseWxmlMap).map(tag => {
      const { attrKeys } = baseWxmlMap[tag]
      let eventCache = new Set()
      res += `<template name="${tag}"><${tag} `
      attrKeys.forEach(key => {
        const eventConfig = wx.event.parseEvent(key)
        if (eventConfig) { // 如果是事件
          const eventName = eventConfig.eventName
          if (!eventCache.has(eventName)) {
            eventCache.add(eventName)
            res += `${key}="__invoke" `
          }
        } else if (key === 'data-eventconfigs') {
          res += `${key}="{{ r.data.eventconfigs }}"`
        } else {
          res += `${key}="{{ r.data['${key}'] }}" `
        }

        // res += '\n'
      })
      res += `><template is="children" data="{{r: r.children}}" /></${tag}></template>`
    })
    return res
  }
}
