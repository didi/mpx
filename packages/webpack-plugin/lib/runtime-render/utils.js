const isEmptyObject = require('../utils/is-empty-object')

const customComponentWxssSet = new Set()
const injectedPath = new Set()
const runtimeCompileMap = {}
const pathAndAliasTagMap = {}
const globalRuntimeComponent = {}

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
  }
}
