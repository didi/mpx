const hasOwn = require('./has-own')

module.exports = function shallowStringify (obj, isTemplateExp) {
  const arr = []
  for (const key in obj) {
    if (hasOwn(obj, key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.map((item) => typeof item === 'object' ? shallowStringify(item, isTemplateExp) : item).join(',')}]`
      } else if (typeof value === 'object') {
        value = shallowStringify(value, isTemplateExp)
      }
      arr.push(isTemplateExp ? `${key}:${value}` : `'${key}':${value}`)
    }
  }
  return isTemplateExp ? `({${arr.join(',')}})` : `{${arr.join(',')}}`
}
