module.exports = function normalizeTest (test) {
  if (test) {
    return (input, meta) => {
      const pathArr = test.split('|')
      meta.paths = []
      let result = false
      for (let i = 0; i < pathArr.length; i++) {
        if (input.hasOwnProperty(pathArr[i])) {
          meta.paths.push(pathArr[i])
          result = true
        }
      }
      return result
    }
  } else {
    return () => true
  }
}