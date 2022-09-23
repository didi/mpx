function makeMap (arr) {
  return arr.reduce((obj, item) => {
    obj[item] = true
    return obj
  }, {})
}

function findItem (arr = [], key) {
  for (const item of arr) {
    if ((key instanceof RegExp && key.test(item)) || item === key) {
      return true
    }
  }
  return false
}

export {
  makeMap,
  findItem
}
