const hasOwn = require('./has-own')

module.exports = function shallowStringify (obj) {
  const arr = []
  for (const key in obj) {
    if (hasOwn(obj, key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.join(',')}]`
      } else if (typeof value === 'object') {
        value = shallowStringify(value)
      }
      arr.push(`'${key}':${value}`)
    }
  }
  return `{${arr.join(',')}}`
}
