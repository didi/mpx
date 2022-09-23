function makeMap (arr) {
  return arr.reduce((obj, item) => {
    obj[item] = true
    return obj
  }, {})
}

export {
  makeMap
}