const isEmptyObject = require('./utils/is-empty-object')
const { wx } = require('./config')

const customComponentWxssSet = new Set()
const injectedPath = new Set()
let _templateNodes = {}
let pathAndAliasTagMap = {}

let baseWxmlModule = null

function genNotRuntimeCustomComponentSlots() {
  return `
    <block wx:for="{{r.children}}" wx:key="nodeId">
      <block wx:if="{{item['slot']}}">
        <view slot="{{item['slot']}}">
          <element r="{{item}}"></element>
          <!-- <template is="element" data="{{r: item}}" /> -->
        </view>
      </block>
      <block wx:else>
        <block wx:if="{{item.nodeId}}">
          <element r="{{item}}"></element>
          <!-- <template is="element" data="{{r: item}}" /> -->
        </block>
        <block wx:else>
          <block>{{item.content}}</block>
        </block>
      </block>
    </block>
  `
}

// TODO：合并节点属性的方法目前仅处理了 attrsList 里面的内容，其他属性的合并也需要处理
function composeNodeAttrs(oldNode, newNode) {
  newNode.attrsList.forEach((attr) => {
    if (
      oldNode.attrsList &&
      !oldNode.attrsList.find((item) => item.name === attr.name)
    ) {
      oldNode.attrsList.push(attr)
    }
  })
  return oldNode
}

module.exports = {
  collectInjectedPath(path) {
    injectedPath.add(path)
  },
  getInjectedPath() {
    return injectedPath
  },
  getInjectedComponentMap() {
    const res = {}
    injectedPath.forEach((path) => {
      const { aliasTag, componentPath } = pathAndAliasTagMap[path]
      res[aliasTag] = componentPath
    })

    return res
  },
  collectAliasComponentPath(path, componentPath) {
    if (!pathAndAliasTagMap[path]) {
      pathAndAliasTagMap[path] = {
        componentPath
      }
    } else {
      pathAndAliasTagMap[path]['componentPath'] = componentPath
    }
  },
  collectAliasTag(path, aliasTag) {
    if (!pathAndAliasTagMap[path]) {
      pathAndAliasTagMap[path] = {
        aliasTag
      }
    } else {
      pathAndAliasTagMap[path]['aliasTag'] = aliasTag
    }
  },
  getAliasTag() {
    return pathAndAliasTagMap
  },
  getTemplateNodes() {
    return _templateNodes
  },
  setTemplateNodes(node) {
    let tag = node.aliasTag || node.tag
    if (!_templateNodes[tag]) {
      _templateNodes[tag] = node
    } else {
      composeNodeAttrs(_templateNodes[tag], node)
    }
  },
  clearTemplateNodes() {
    _templateNodes = {}
  },
  setBaseWxmlModule(module) {
    baseWxmlModule = module
  },
  getBaseWxmlModule() {
    return baseWxmlModule
  },
  collectCustomComponentWxss(path) {
    customComponentWxssSet.add(path)
  },
  addCustomComponentWxss() {
    let res = ''
    customComponentWxssSet.forEach((wxss) => {
      res += `@import '${wxss}';\n`
    })
    return res
  },
  /**
   * 被注入到 base.wxml 里面的自定义组件模板生成器，生成的模板主要分为2种类型：
   *
   * 1. 非运行组件，属性需要枚举
   * 2. 运行时组件，属性统一使用 at 进行透传
   */
  genRuntimeTemplate(nodesMap) {
    let res = '\n'
    Object.keys(nodesMap).map((tag) => {
      const node = nodesMap[tag]
      const templateName = node.aliasTag || node.tag
      const nodeTag = node.isCustomComponent ? node.aliasTag : node.tag
      // console.log('the node attrsList is:', node.aliasTag || node.tag, node.attrsList)
      res += `<template name="${templateName}">`
      res += `<${nodeTag}`
      if (node.class || node.staticClass) {
        res += ' ' + 'class="{{ r.class }}"'
      }
      if (node.style || node.staticStyle || node.showStyle) {
        res += ' ' + 'style="{{ r.style }}"'
      }
      if (node.hidden) {
        res += ' ' + 'hidden="{{ r.hidden }}"'
      }
      // 事件统一代理至 __eh 方法上，通过 data-eventconfigs 获取真实的事件信息
      if (node.events) {
        // console.log('the node.events is:', node.events)
        Object.keys(node.events).map((name) => {
          res += ' ' + `${name}="__eh"`
        })
      }
      // 如果是运行时组件，统一使用 at 进行传参
      // if (node.isRuntimeCompileWrapper) {
      //   res += ' ' + `at="{{ r.at }}"`
      // }
      if (node.runtimeCompile) {
        res += ' ' + `at="{{ r.at }}"`
      }
      if (node.mpxPageStatus) {
        res += ' ' + 'mpxPageStatus="{{ r.mpxPageStatus || \'\' }}"'
      }
      res += ' ' + 'mpxShow="{{ r.mpxShow === undefined ? true : r.mpxShow }}"'
      res += ' ' + 'data-eventconfigs="{{ r.eventconfigs }}"'
      res += ' ' + 'data-private-node-id="{{ r.nodeId }}"'
      // 运行时组件通过 slots 属性传递插槽的 render 函数
      if (node.isRuntimeCompileWrapper) {
        res += ' ' + 'slots="{{ r.slots }}"'
      }
      node.attrsList.forEach((attr) => {
        // 事件统一走 _eh 代理
        if (wx.event.parseEvent(attr.name)) {
          console.log('the event attr is:', attr.name)
          return
        }
        if (attr.name === 'data-eventconfigs') {
          return
        }
        if (attr.name === 'mpxShow') {
          return
        }

        res += ' ' + attr.name
        let value = attr.value
        if (value != null) {
          // res += '=' + stringifyAttr(value)
          // 带有连字符的属性（是否统一使用驼峰）
          if (attr.name.includes('-')) {
            res += `="{{ r['${attr.name}'] }}"`
          } else {
            res += `="{{ r.${attr.name} }}"`
          }
        }
      })
      if (node.unary) {
        res += '/>'
      } else {
        if (node.normalNodeInRuntimeCompile) {
          res += `>${genNotRuntimeCustomComponentSlots()}</${templateName}>`
        } else {
          res += `><template is="children" data="{{r: r.children}}" /></${nodeTag}>`
        }
      }
      res += '</template>\n'
    })

    return res
  },
  genSlots(astNodes = [], genElement) {
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
  transformSlotsToString(slotsMap = {}) {
    let res = '{'
    if (!isEmptyObject(slotsMap)) {
      Object.keys(slotsMap).map((slotTarget) => {
        res += `${slotTarget}: [`
        const renderFns = slotsMap[slotTarget] || []
        renderFns.map((renderFn) => {
          res += `${renderFn},`
        })
        res += '],'
      })
    }
    res += '}'
    return res
  }
}
