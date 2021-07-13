const isEmptyObject = require('./utils/is-empty-object')
const { wx } = require('./config')

const customComponentWxssSet = new Set()
const injectedPath = new Set()
const runtimeCompileMap = {}
let templateNodes = {}
let pathAndAliasTagMap = {}

// mpx-render-base.wxml 里面的指令生成都需要被忽略掉
const filterKeys = [
  'wx:for',
  'wx:for-index',
  'wx:for-item',
  'wx:if',
  'is',
  'data-eventconfigs',
  'mpxShow',
  'big-attrs',
  'mpxPageStatus'
]

function genNotRuntimeCustomComponentSlots () {
  return `
    <block wx:for="{{r.children}}" wx:key="nodeId">
      <block wx:if="{{item['slot']}}">
        <view slot="{{item['slot']}}">
          <element r="{{item}}"></element>
        </view>
      </block>
      <block wx:else>
        <block wx:if="{{item.nodeId}}">
          <element r="{{item}}"></element>
        </block>
        <block wx:else>
          <block>{{item.content}}</block>
        </block>
      </block>
    </block>
  `
}

// TODO：合并节点属性的方法目前仅处理了 attrsList 里面的内容，其他属性的合并也需要处理
function composeNodeAttrs (oldNode, newNode) {
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
    let tag = node.aliasTag || node.tag
    if (!templateNodes[tag]) {
      templateNodes[tag] = node
    } else {
      composeNodeAttrs(templateNodes[tag], node)
    }
  },
  clearTemplateNodes () {
    templateNodes = {}
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
      const node = nodesMap[tag]
      const templateName = node.aliasTag || node.tag
      const nodeTag = node.isCustomComponent ? node.aliasTag : node.tag
      // console.log('the node attrsList is:', node.aliasTag || node.tag, node.attrsList)
      res += `<template name="${templateName}">`
      res += `<${nodeTag}`
      if (node.class || node.staticClass) {
        res += ' ' + 'class="{{ r.data.class }}"'
      }
      if (node.style || node.staticStyle || node.showStyle) {
        res += ' ' + 'style="{{ r.data.style }}"'
      }
      if (node.hidden) {
        res += ' ' + 'hidden="{{ r.data.hidden }}"'
      }
      // 事件统一代理至 __invoke 方法上，通过 data-eventconfigs 获取真实的事件信息
      if (node.events) {
        Object.keys(node.events).map((name) => {
          res += ' ' + `${name}="__invoke"`
        })
      }
      /**
       * 运行时组件：
       *
       * 1. 统一使用 bigAttrs 进行传参
       * 2. 统一使用 slots 属性传递插槽的 render 函数
       */
      if (node.isRuntimeComponent) {
        res += ' ' + `big-attrs="{{ r.data.bigAttrs }}"`
        res += ' ' + 'slots="{{ r.data.slots }}"'
      }
      if (node.mpxPageStatus) {
        res += ' ' + 'mpxPageStatus="{{ r.data.mpxPageStatus || \'\' }}"'
      }
      res += ' ' + 'mpxShow="{{ r.data.mpxShow === undefined ? true : r.data.mpxShow }}"'
      res += ' ' + 'data-eventconfigs="{{ r.data.eventconfigs }}"'
      res += ' ' + 'data-private-node-id="{{ r.nodeId }}"'
      node.attrsList.forEach((attr) => {
        // 事件统一走 __invoke 代理
        if (wx.event.parseEvent(attr.name) || filterKeys.includes(attr.name)) {
          return
        }

        res += ' ' + attr.name
        let value = attr.value
        if (value != null) {
          // res += '=' + stringifyAttr(value)
          // 带有连字符的属性（是否统一使用驼峰）
          if (attr.name.includes('-')) {
            res += `="{{ r.data['${attr.name}'] }}"`
          } else {
            res += `="{{ r.data.${attr.name} }}"`
          }
        }
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
