const isEmptyObject = require('../utils/is-empty-object')
const config = require('../config')

const directiveSet = new Set()
const commonBaseAttrs = ['class', 'style', 'id', 'hidden']
const commonMpxAttrs = ['mpxShow', 'slots']

function genRegExp (arrStr) {
  return new RegExp(`^(${arrStr.join('|')})$`)
}

module.exports = {
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
  },
  hasExtractAttr (el) {
    const res = Object.keys(el.attrsMap).find(attr => {
      return !(genRegExp(commonBaseAttrs).test(attr) || attr.startsWith('data-'))
    })
    return Boolean(res)
  },
  isCommonAttr (attr) {
    return genRegExp([...commonBaseAttrs, ...commonMpxAttrs]).test(attr) || attr.startsWith('data-')
  },
  isDirective (key) {
    return directiveSet.has(key)
  },
  updateModeDirectiveSet (mode) {
    const directiveMap = config[mode].directive
    if (!isEmptyObject(directiveMap)) {
      for (let key in directiveMap) {
        directiveSet.add(directiveMap[key])
      }
    }
  }
}
