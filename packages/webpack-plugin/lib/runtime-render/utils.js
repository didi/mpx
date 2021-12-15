const isEmptyObject = require('../utils/is-empty-object')

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
  }
}
