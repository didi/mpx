const isEmptyObject = require('./utils/is-empty-object')
const { wx } = require('./config')

const customComponentWxssSet = new Set()
const injectedPath = new Set()
const runtimeCompileMap = {}
let templateNodes = {}
let pathAndAliasTagMap = {}
let globalRuntimeComponent = {}

// mpx-render-base.wxml 里面的指令生成都需要被忽略掉
const filterKeys = [
  'wx:for',
  'wx:for-index',
  'wx:for-item',
  'wx:if',
  'is'
]

function genNotRuntimeCustomComponentSlots () {
  return `
    <block wx:for="{{r.children}}" wx:key="index">
      <block wx:if="{{item.data['slot']}}">
        <view slot="{{item.data['slot']}}">
          <element r="{{item}}"></element>
        </view>
      </block>
      <block wx:else>
        <block wx:if="{{item.nodeType}}">
          <element r="{{item}}"></element>
        </block>
        <block wx:else>
          <block>{{item.content}}</block>
        </block>
      </block>
    </block>
  `
}

module.exports = {
  getGlobalRuntimeComponent () {
    return globalRuntimeComponent
  },
  setGlobalRuntimeComponent (runtimeComponent = {}) {
    Object.assign(globalRuntimeComponent, runtimeComponent)
  },
  setRuntimeComponent (path, isRuntimeCompile) {
    runtimeCompileMap[path] = isRuntimeCompile
  },
  getRuntimeComponent () {
    return runtimeCompileMap
  },
  collectInjectedPath (path) {
    injectedPath.add(path)
  },
  getInjectedPath () {
    return injectedPath
  },
  getInjectedComponentMap () {
    const res = {}
    injectedPath.forEach((path) => {
      const { aliasTag, componentPath } = pathAndAliasTagMap[path]
      res[aliasTag] = componentPath
    })

    return res
  },
  collectAliasComponentPath (path, componentPath) {
    if (!pathAndAliasTagMap[path]) {
      pathAndAliasTagMap[path] = {
        componentPath
      }
    } else {
      pathAndAliasTagMap[path]['componentPath'] = componentPath
    }
  },
  collectAliasTag (path, aliasTag) {
    if (!pathAndAliasTagMap[path]) {
      pathAndAliasTagMap[path] = {
        aliasTag
      }
    } else {
      pathAndAliasTagMap[path]['aliasTag'] = aliasTag
    }
  },
  getAliasTag () {
    return pathAndAliasTagMap
  },
  getTemplateNodes () {
    return templateNodes
  },
  setTemplateNodes (node) {
    const tag = node.aliasTag || node.tag
    if (!templateNodes[tag]) {
      templateNodes[tag] = {
        node,
        allAttrs: new Set()
      }
    }
    if (node.attrsList.length > 0) {
      node.attrsList.map(attr => {
        templateNodes[tag].allAttrs.add(attr.name)
      })
    }
  },
  collectCustomComponentWxss (path) {
    customComponentWxssSet.add(path)
  },
  addCustomComponentWxss () {
    let res = ''
    customComponentWxssSet.forEach((wxss) => {
      res += `@import '${wxss}';\n`
    })
    return res
  },
  /**
   * 被注入到 mpx-render-base.wxml 里面的自定义组件模板生成器，生成的模板主要分为2种类型：
   *
   * 1. 非运行组件，属性需要枚举
   * 2. 运行时组件，属性统一使用 bigAttrs 进行透传
   */
  genRuntimeTemplate (nodesMap) {
    let res = '\n'
    Object.keys(nodesMap).map((tag) => {
      const { node, allAttrs } = nodesMap[tag]
      const templateName = node.aliasTag || node.tag
      const nodeTag = node.isLocalComponent ? node.aliasTag : node.tag
      res += `<template name="${templateName}">`
      res += `<${nodeTag}`

      allAttrs.forEach((attr) => {
        if (filterKeys.includes(attr)) {
          return
        }

        if (wx.event.parseEvent(attr)) {
          res += ` ${attr}="__invoke"`
          return
        }

        res += ' ' + attr
        let strVal = ''
        switch (attr) {
          case 'big-attrs':
            strVal = '"{{ r.data.bigAttrs }}"'
            break
          case 'mpxPageStatus':
            strVal = '"{{ r.data.mpxPageStatus || \'\' }}"'
            break
          case 'mpxShow':
            strVal = '"{{ r.data.mpxShow === undefined ? true : r.data.mpxShow }}"'
            break
          case 'data-eventconfigs':
            strVal = '"{{ r.data.eventconfigs }}"'
            break
          default:
            if (attr.includes('-')) {
              strVal = `"{{ r.data['${attr}'] }}"`
            } else {
              strVal = `"{{ r.data.${attr} }}"`
            }
            break
        }

        res += `=${strVal}`
      })
      if (node.unary) {
        res += '/>'
      } else {
        // 非运行时自定义组件在注入 mpx-render-base.wxml 模板都使用 slot 插槽
        if (node.isCustomComponent && !(node.filePath && runtimeCompileMap[node.filePath])) {
          res += `>${genNotRuntimeCustomComponentSlots()}</${templateName}>`
        } else {
          res += `><template is="children" data="{{r: r.children}}" /></${nodeTag}>`
        }
      }
      res += '</template>\n'
    })

    return res
  },
  genSlots (astNodes = [], genElement) {
    let slots = {}
    astNodes.map((node) => {
      const slotTarget = node.slotTarget
      if (slotTarget) {
        if (!slots[slotTarget]) {
          slots[slotTarget] = []
        }
        const rawRenderFn = genElement(node)
        slots[slotTarget].push(rawRenderFn)
      }
    })
    return slots
  },
  transformSlotsToString (slotsMap = {}) {
    let res = '{'
    if (!isEmptyObject(slotsMap)) {
      Object.keys(slotsMap).map((slotTarget) => {
        res += `${slotTarget}: [`
        const renderFns = slotsMap[slotTarget] || []
        renderFns.map((renderFn) => {
          if (renderFn) {
            res += `${renderFn},`
          }
        })
        res += '],'
      })
    }
    res += '}'
    return res
  }
}
