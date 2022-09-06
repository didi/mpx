/**
 * 预处理一次常量对象，处理掉不符合标识符规则的变量，目前只处理'.'，用于在JSON/style中使用的场景
 * @param {object} defs 待处理的常量
 * @returns {object} 处理完毕的常量对象
 */

module.exports = function processDefs (defs) {
  const newDefs = {}
  Object.keys(defs).forEach(key => {
    if (typeof key === 'string' && key.indexOf('.') !== -1) {
      key.split('.').reduce((prev, curr, index, arr) => {
        if (index === arr.length - 1) {
          prev[curr] = defs[key]
        } else {
          prev[curr] = prev[curr] || {}
        }
        return prev[curr]
      }, newDefs)
    } else {
      newDefs[key] = defs[key]
    }
  })
  return newDefs
}
