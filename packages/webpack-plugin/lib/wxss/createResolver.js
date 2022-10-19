module.exports = function createResolver (alias) {
  if (typeof alias !== 'object' || Array.isArray(alias)) {
    return function (url) {
      return url
    }
  }

  alias = Object.keys(alias).map(function (key) {
    let onlyModule = false
    let obj = alias[key]
    if (/\$$/.test(key)) {
      onlyModule = true
      key = key.substr(0, key.length - 1)
    }
    if (typeof obj === 'string') {
      obj = {
        alias: obj
      }
    }
    obj = Object.assign({
      name: key,
      onlyModule: onlyModule
    }, obj)
    return obj
  })

  return function (url) {
    alias.forEach(function (obj) {
      const name = obj.name
      if (url === name || (!obj.onlyModule && url.startsWith(name + '/'))) {
        url = obj.alias + url.substr(name.length)
      }
    })
    return url
  }
}
