const { getOptimizedComponentInfo } = require('@mpxjs/template-engine/dist/optimizer')
const mpxConfig = require('../config')

function makeAttrsMap (attrKeys = []) {
  return attrKeys.reduce((preVal, curVal) => Object.assign(preVal, { [curVal]: '' }), {})
}

// 部分节点类型不需要被收集
const RUNTIME_FILTER_NODES = ['import', 'template', 'wxs', 'component', 'slot']

function collectParentCustomComponent (el, isComponentNode, options) {
  const res = []
  let parent = el.parent
  while (parent) {
    if (isComponentNode(parent, options)) {
      if (!res.length) res.push(el.tag)
      res.push(parent.tag)
    }
    parent = parent.parent
  }
  return res
}

module.exports = function setBaseWxml (el, config, meta) {
  const { mode, isComponentNode, options } = config
  if (RUNTIME_FILTER_NODES.includes(el.tag)) {
    return
  }

  if (options.runtimeCompile) {
    const isCustomComponent = isComponentNode(el, options)

    if (!meta.runtimeInfo) {
      meta.runtimeInfo = {
        baseComponents: {},
        customComponents: {},
        dynamicSlotDependencies: []
      }
    }

    const tag = el.tag
    // 属性收集
    const modeConfig = mpxConfig[mode]
    const directives = new Set([...Object.values(modeConfig.directive), 'slot'])
    const attrKeys = Object.keys(el.attrsMap).filter(key => !directives.has(key))
    const componentType = isCustomComponent ? 'customComponents' : 'baseComponents'

    if (!isCustomComponent) {
      const optimizedInfo = getOptimizedComponentInfo(
        {
          nodeType: el.tag,
          attrs: el.attrsMap
        },
        mode
      )
      if (optimizedInfo) {
        el.tag = optimizedInfo.nodeType
      }
    } else {
      // 收集运行时组件模版当中运行时组件使用 slot 的场景，主要因为运行时组件渲染slot时组件上下文发生了变化
      const slotDependencies = collectParentCustomComponent(el, isComponentNode, options)
      if (slotDependencies.length) {
        const dynamicSlotDependencies = meta.runtimeInfo.dynamicSlotDependencies
        dynamicSlotDependencies.push(slotDependencies)
      }
    }

    const componentsConfig = meta.runtimeInfo[componentType]

    if (!componentsConfig[tag]) {
      componentsConfig[tag] = {}
    }
    Object.assign(componentsConfig[tag], makeAttrsMap(attrKeys))
  }
}
