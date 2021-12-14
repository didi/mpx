const isEmptyObject = require('../utils/is-empty-object')

const customComponentWxssSet = new Set()
const injectedPath = new Set()
const pathAndAliasTagMap = {}
const injectMap = {}

module.exports = {
  setInjectMap (absolutePath, nameOrPathObj = {}) {
    if (!injectMap[absolutePath]) {
      injectMap[absolutePath] = {}
    }
    Object.assign(injectMap[absolutePath], nameOrPathObj)
  },
  getInjectedComponentMap () {
    const res = {}
    injectedPath.forEach((path) => {
      const { aliasTag, componentPath } = pathAndAliasTagMap[path]
      res[aliasTag] = componentPath
    })

    return res
  },
  collectCustomComponentWxss (path) {
    customComponentWxssSet.add(path)
  },
  // todo 输出文件内容需要添加
  addCustomComponentWxss () {
    let res = ''
    customComponentWxssSet.forEach((wxss) => {
      res += `@import '${wxss}';\n`
    })
    return res
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
  // todo: name/hashName -> tag/hashTag
  normalizeHashTagAndPath (runtimeComponents = []) {
    return runtimeComponents.reduce((preVal, curVal) => {
      const [name, hashName, absolutePath] = curVal.split(':')
      return Object.assign(preVal, {
        [name]: {
          hashName,
          absolutePath
        }
      })
    }, {})
  }
}
