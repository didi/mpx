const babylon = require('@babel/parser')
const t = require('@babel/types')
const generate = require('@babel/generator').default
const dash2hump = require('../utils/hump-dash').dash2hump

module.exports = function transDynamicClassExpr (expr) {
  expr = babylon.parseExpression(expr, {
    plugins: [
      'objectRestSpread'
    ]
  })
  if (t.isObjectExpression(expr)) {
    expr.properties.forEach((property) => {
      if (t.isObjectProperty(property) && !property.computed) {
        const propertyName = property.key.name || property.key.value
        if (/-/.test(propertyName)) {
          property.key = t.identifier(dash2hump(propertyName) + 'MpxDash')
        } else {
          property.key = t.identifier(propertyName)
        }
      }
    })
  }
  return generate(expr, {
    compact: true
  }).code
}
