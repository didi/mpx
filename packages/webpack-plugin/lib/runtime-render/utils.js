const isEmptyObject = require('../utils/is-empty-object')

const customComponentWxssSet = new Set()
const injectedPath = new Set()
const runtimeCompileMap = {}
let templateNodes = {}
let pathAndAliasTagMap = {}
let globalRuntimeComponent = {}
let appJsonUsingComponents = {}

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
  },
  componentConfig: {
    includes: new Set(),
    exclude: new Set(),
    // 收集自定义组件元素节点
    thirdPartyComponents: new Map(),
    // 收集运行时组件元素节点
    runtimeComponents: new Map(),
    includeAll: false,
    // 收集基础元素(小程序内置组件)节点
    internalComponents: {}
  },
  setAppUsingComponents (name, path) {
    appJsonUsingComponents[name] = path
  },
  getAppUsingComponents () {
    return appJsonUsingComponents
  }
}
