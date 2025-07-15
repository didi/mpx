function transSubNameRules (asyncSubpackageNameRules, tarRoot) {
  // 如果没有tarRoot，则无需进行tarRoot的修改，因此
  if (tarRoot && Array.isArray(asyncSubpackageNameRules) && asyncSubpackageNameRules.length >= 1) {
    for (const item of asyncSubpackageNameRules) {
      if (item?.from) {
        const fromPaths = Array.isArray(item.from) ? item.from : [item.from]
        if (fromPaths.includes(tarRoot)) {
          tarRoot = item.to
          break
        }
      }
    }
  }
  return tarRoot
}

module.exports = {
  transSubNameRules
}
