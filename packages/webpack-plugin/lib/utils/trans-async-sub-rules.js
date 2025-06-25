const { matchCondition } = require('./match-condition')

function transAsyncSubNameRules (asyncSubpackageNameRules, tarRoot) {
  // 如果没有tarRoot，则无需进行tarRoot的修改，因此
  if (tarRoot && Array.isArray(asyncSubpackageNameRules) && asyncSubpackageNameRules.length >= 1) {
    for (const item of asyncSubpackageNameRules) {
      if (item?.from) {
        const fromPaths = Array.isArray(item.from) ? item.from : [item.from];
        if (fromPaths.includes(tarRoot)) {
          tarRoot = item.to
          break
        }
      }
    }
  }
  return tarRoot
}

function transAsyncSubRules (resourcePath, asyncSubpackageRules, tarRoot) {
  if (!tarRoot && Array.isArray(asyncSubpackageRules) && asyncSubpackageRules.length >= 1) {
    for (const item of asyncSubpackageRules) {
      if (matchCondition(resourcePath, item)) {
        tarRoot = item.root
        break
      }
    }
  }
  return tarRoot
}

module.exports = {
  transAsyncSubNameRules,
  transAsyncSubRules
}
