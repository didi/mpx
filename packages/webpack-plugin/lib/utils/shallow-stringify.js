const hasOwn = require('./has-own')

function isJsLiteralOrExpression (value) {
  if (typeof value !== 'string') return true
  const s = value.trim()
  if (!s) return false

  // already a JS string literal
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith('\'') && s.endsWith('\''))
  ) return true

  // primitives / numbers
  if (s === 'null' || s === 'undefined' || s === 'true' || s === 'false') return true
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return true

  // array/object literal or wrapped expression
  if (s.startsWith('[') || s.startsWith('{') || s.startsWith('(')) return true

  // function call expression e.g. global.__formatValue(...)
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*\(/.test(s)) return true

  return false
}

module.exports = function shallowStringify (obj, isTemplateExp) {
  const arr = []
  for (const key in obj) {
    if (hasOwn(obj, key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.map((item) => typeof item === 'object' ? shallowStringify(item, isTemplateExp) : item).join(',')}]`
      } else if (typeof value === 'object') {
        value = shallowStringify(value, isTemplateExp)
      } else if (typeof value === 'string' && !isJsLiteralOrExpression(value)) {
        // Defensive: ensure bare strings become valid JS string literals.
        // e.g. fontFamily: PingFangSC-Regular  ->  fontFamily: "PingFangSC-Regular"
        value = JSON.stringify(value)
      }
      arr.push(isTemplateExp ? `${key}:${value}` : `'${key}':${value}`)
    }
  }
  return isTemplateExp ? `({${arr.join(',')}})` : `{${arr.join(',')}}`
}
